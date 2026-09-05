import { createHash } from "node:crypto";
import { Chess } from "chess.js";

const LICHESS_CLOUD_EVAL_URL = "https://lichess.org/api/cloud-eval";
const REQUEST_TIMEOUT_MS = 7_000;
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_MEMORY_ENTRIES = 500;
const UCI_MOVE_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

export class LichessEvaluationError extends Error {
  constructor(message, statusCode = 503, code = "lichess_unavailable") {
    super(message);
    this.name = "LichessEvaluationError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}

export function normalizeFenForEvaluation(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 160) {
    throw new LichessEvaluationError("Invalid FEN.", 400, "invalid_fen");
  }

  try {
    const fullFen = new Chess(value.trim()).fen();
    const positionFen = fullFen.split(" ").slice(0, 4).join(" ");
    const fenHash = createHash("sha256").update(positionFen).digest("hex");
    return { fullFen, positionFen, fenHash };
  } catch {
    throw new LichessEvaluationError("Invalid FEN.", 400, "invalid_fen");
  }
}

function normalizePv(value) {
  if (!value || typeof value !== "object" || typeof value.moves !== "string") {
    return null;
  }

  const moves = value.moves
    .trim()
    .split(/\s+/)
    .filter((move) => UCI_MOVE_PATTERN.test(move))
    .slice(0, 32);
  if (moves.length === 0) return null;

  const cp = Number.isInteger(value.cp)
    ? Math.max(-100_000, Math.min(100_000, value.cp))
    : null;
  const mate = Number.isInteger(value.mate)
    ? Math.max(-1_000, Math.min(1_000, value.mate))
    : null;
  if (cp == null && mate == null) return null;

  return {
    moves: moves.join(" "),
    cp: mate == null ? cp : null,
    mate,
  };
}

function normalizeEvaluation(value, fallbackFen, requestedMultiPv) {
  if (!value || typeof value !== "object") return null;

  const pvs = (Array.isArray(value.pvs) ? value.pvs : [])
    .map(normalizePv)
    .filter(Boolean)
    .slice(0, 5);
  if (pvs.length === 0) return null;

  return {
    fen: fallbackFen,
    depth: clampInteger(value.depth, 0, 0, 255),
    knodes: clampInteger(value.knodes, 0, 0, 2_147_483_647),
    pvs,
    requestedMultiPv: clampInteger(
      value.requested_multipv ?? value.requestedMultiPv,
      requestedMultiPv,
      1,
      5,
    ),
    fetchedAt:
      typeof value.fetched_at === "string" && value.fetched_at
        ? value.fetched_at
        : new Date().toISOString(),
  };
}

function publicEvaluation(record, multiPv, source) {
  return {
    fen: record.fen,
    depth: record.depth,
    knodes: record.knodes,
    pvs: record.pvs.slice(0, multiPv),
    source,
  };
}

export function createLichessEvaluationService({
  persistence,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
} = {}) {
  const memoryCache = new Map();
  const inFlight = new Map();
  let requestQueue = Promise.resolve();
  let blockedUntil = 0;

  function remember(fenHash, record) {
    memoryCache.delete(fenHash);
    memoryCache.set(fenHash, record);
    if (memoryCache.size > MAX_MEMORY_ENTRIES) {
      memoryCache.delete(memoryCache.keys().next().value);
    }
  }

  function readMemory(fenHash, multiPv) {
    const record = memoryCache.get(fenHash);
    if (!record || record.requestedMultiPv < multiPv) return null;
    remember(fenHash, record);
    return publicEvaluation(record, multiPv, "cache");
  }

  async function readDatabase(fenHash, positionFen, multiPv) {
    if (!persistence?.enabled || typeof persistence.findPositionEvaluation !== "function") {
      return null;
    }

    try {
      const row = await persistence.findPositionEvaluation(fenHash);
      const record = normalizeEvaluation(row, positionFen, multiPv);
      if (!record || record.requestedMultiPv < multiPv) return null;
      remember(fenHash, record);
      return publicEvaluation(record, multiPv, "cache");
    } catch (error) {
      persistence.warn?.("read-position-evaluation", error);
      return null;
    }
  }

  async function requestLichess(fullFen, positionFen, multiPv) {
    if (now() < blockedUntil) {
      throw new LichessEvaluationError(
        "Lichess evaluation is temporarily cooling down.",
        503,
        "lichess_rate_limited",
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const url = new URL(LICHESS_CLOUD_EVAL_URL);
    url.searchParams.set("fen", fullFen);
    url.searchParams.set("multiPv", String(multiPv));

    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ChessOfOdesa/1.0",
        },
        signal: controller.signal,
      });

      if (response.status === 404) return null;
      if (response.status === 429) {
        blockedUntil = now() + RATE_LIMIT_COOLDOWN_MS;
        throw new LichessEvaluationError(
          "Lichess evaluation is temporarily rate limited.",
          503,
          "lichess_rate_limited",
        );
      }
      if (!response.ok) {
        throw new LichessEvaluationError(
          `Lichess evaluation returned ${response.status}.`,
          502,
        );
      }

      const record = normalizeEvaluation(await response.json(), positionFen, multiPv);
      if (!record) {
        throw new LichessEvaluationError("Lichess returned an invalid evaluation.", 502);
      }
      return record;
    } catch (error) {
      if (error instanceof LichessEvaluationError) throw error;
      const message = error?.name === "AbortError"
        ? "Lichess evaluation timed out."
        : "Lichess evaluation is unavailable.";
      throw new LichessEvaluationError(message, 503);
    } finally {
      clearTimeout(timeout);
    }
  }

  function queueLichessRequest(task) {
    const request = requestQueue.then(task, task);
    requestQueue = request.catch(() => undefined);
    return request;
  }

  async function fetchAndCache({ fullFen, positionFen, fenHash }, multiPv) {
    const record = await queueLichessRequest(() => requestLichess(fullFen, positionFen, multiPv));
    if (!record) return null;

    remember(fenHash, record);
    if (persistence?.enabled && typeof persistence.savePositionEvaluation === "function") {
      void persistence
        .savePositionEvaluation({
          fen_hash: fenHash,
          fen: positionFen,
          depth: record.depth,
          knodes: record.knodes,
          pvs: record.pvs,
          requested_multipv: record.requestedMultiPv,
          source: "lichess",
          fetched_at: record.fetchedAt,
        })
        .catch((error) => persistence.warn?.("save-position-evaluation", error));
    }

    return publicEvaluation(record, multiPv, "lichess");
  }

  async function getEvaluation(fen, requestedMultiPv = 1) {
    const normalized = normalizeFenForEvaluation(fen);
    const multiPv = clampInteger(requestedMultiPv, 1, 1, 5);
    const memoryHit = readMemory(normalized.fenHash, multiPv);
    if (memoryHit) return memoryHit;

    const databaseHit = await readDatabase(
      normalized.fenHash,
      normalized.positionFen,
      multiPv,
    );
    if (databaseHit) return databaseHit;

    const requestKey = `${normalized.fenHash}:${multiPv}`;
    if (!inFlight.has(requestKey)) {
      const request = fetchAndCache(normalized, multiPv).finally(() => {
        inFlight.delete(requestKey);
      });
      inFlight.set(requestKey, request);
    }

    return inFlight.get(requestKey);
  }

  return { getEvaluation };
}
