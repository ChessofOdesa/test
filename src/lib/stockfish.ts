import { Chess, type Square } from "chess.js";

export type EngineBackend = "native" | "worker" | "cloud";

export type EngineLine = {
  multipv: number;
  scoreCp: number | null;
  scoreMate: number | null;
  pv: string[];
  depth?: number | null;
  nodes?: number | null;
  timeMs?: number | null;
};

export type AnalyzeResult = {
  backend?: EngineBackend;
  bestmove: string | null;
  raw: string[];
  scoreCp: number | null;
  scoreMate: number | null;
  pv: string[];
  depth?: number | null;
  nodes?: number | null;
  timeMs?: number | null;
  lines?: EngineLine[];
};

export type AnalyzeOptions = {
  moves?: string[];
  multiPv?: number;
  movetime?: number;
  nodes?: number;
  threads?: number;
  hash?: number;
  sessionId?: string;
  timeoutMs?: number;
  preferCloud?: boolean;
};

type CloudEvaluationPv = {
  moves?: unknown;
  cp?: unknown;
  mate?: unknown;
};

type CloudEvaluationResponse = {
  depth?: unknown;
  knodes?: unknown;
  pvs?: unknown;
};

type EngineHealth = "unknown" | "healthy" | "unavailable";

type PendingRequest = {
  fen: string;
  depth: number;
  timeoutMs: number;
  onOutput?: (line: string) => void;
  resolve: (value: AnalyzeResult) => void;
  reject: (reason?: unknown) => void;
  rawLines: string[];
  latestScoreCp: number | null;
  latestScoreMate: number | null;
  latestPv: string[];
  latestDepth: number | null;
  latestNodes: number | null;
  latestTimeMs: number | null;
  started: boolean;
};

type NativeAnalyzePayload = {
  fen: string;
  depth: number;
  timeoutMs: number;
  moves?: string[];
  multiPv?: number;
  movetime?: number;
  nodes?: number;
  threads?: number;
  hash?: number;
  sessionId?: string;
};

const NATIVE_ENGINE_FALLBACK_URL = "http://127.0.0.1:8765";
const CLOUD_EVALUATION_PATH = "/api/evaluation";
const CLOUD_EVALUATION_TIMEOUT_MS = 8_000;
const UCI_MOVE_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

let nativeEngineHealth: EngineHealth = "unknown";
let nativeEngineFailureReason: string | null = null;
let workerHealth: EngineHealth = "unknown";
let workerFailureReason: string | null = null;

const FALLBACK_PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function getNativeEngineUrl() {
  const explicitUrl = import.meta.env.VITE_STOCKFISH_API_URL?.trim();
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return null;
  }

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return NATIVE_ENGINE_FALLBACK_URL;
  }

  return null;
}

function getCloudEvaluationUrl() {
  const explicitUrl = import.meta.env.VITE_EVAL_API_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const websocketUrl = import.meta.env.VITE_ONLINE_WS_URL?.trim();
  if (!websocketUrl) {
    return null;
  }

  try {
    const url = new URL(websocketUrl);
    if (url.protocol !== "ws:" && url.protocol !== "wss:") {
      return null;
    }
    url.protocol = url.protocol === "wss:" ? "https:" : "http:";
    url.pathname = CLOUD_EVALUATION_PATH;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getStockfishWorkerUrl() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";

  return new URL(`${baseUrl}engines/stockfish.worker.js`, origin).toString();
}

function markNativeUnavailable(reason: string) {
  nativeEngineHealth = "unavailable";
  nativeEngineFailureReason = reason;
}

function markNativeHealthy() {
  nativeEngineHealth = "healthy";
  nativeEngineFailureReason = null;
}

function markWorkerUnavailable(reason: string) {
  workerHealth = "unavailable";
  workerFailureReason = reason;
}

function markWorkerHealthy() {
  workerHealth = "healthy";
  workerFailureReason = null;
}

function toEngineLine(payload: unknown) {
  if (typeof payload === "string") {
    return payload.trim();
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const nested = (payload as { data?: unknown }).data;
    return typeof nested === "string" ? nested.trim() : "";
  }

  return "";
}

function normalizeAnalyzeResult(
  result: Partial<AnalyzeResult>,
  backend: EngineBackend,
): AnalyzeResult {
  const lines = Array.isArray(result.lines)
    ? result.lines
        .filter((line): line is EngineLine => Boolean(line && typeof line === "object"))
        .map((line) => ({
          multipv: Number.isFinite(Number(line.multipv)) ? Number(line.multipv) : 1,
          scoreCp: line.scoreCp ?? null,
          scoreMate: line.scoreMate ?? null,
          pv: Array.isArray(line.pv) ? line.pv : [],
          depth: line.depth ?? null,
          nodes: line.nodes ?? null,
          timeMs: line.timeMs ?? null,
        }))
        .sort((a, b) => a.multipv - b.multipv)
    : undefined;

  return {
    backend,
    bestmove: result.bestmove ?? null,
    raw: Array.isArray(result.raw) ? result.raw : [],
    scoreCp: result.scoreCp ?? null,
    scoreMate: result.scoreMate ?? null,
    pv: Array.isArray(result.pv) ? result.pv : [],
    depth: result.depth ?? null,
    nodes: result.nodes ?? null,
    timeMs: result.timeMs ?? null,
    lines,
  };
}

function finiteInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

function normalizeCloudPv(value: CloudEvaluationPv, index: number): EngineLine | null {
  if (typeof value.moves !== "string") {
    return null;
  }

  const pv = value.moves
    .trim()
    .split(/\s+/)
    .filter((move) => UCI_MOVE_PATTERN.test(move))
    .slice(0, 32);
  if (pv.length === 0) {
    return null;
  }

  const scoreMate = finiteInteger(value.mate);
  const scoreCp = scoreMate == null ? finiteInteger(value.cp) : null;
  if (scoreCp == null && scoreMate == null) {
    return null;
  }

  return {
    multipv: index + 1,
    scoreCp,
    scoreMate,
    pv,
  };
}

async function analyzeWithCloudEvaluation(
  fen: string,
  requestedMultiPv: number,
  timeoutMs: number,
  onOutput?: (line: string) => void,
): Promise<AnalyzeResult | null> {
  const endpoint = getCloudEvaluationUrl();
  if (!endpoint) {
    return null;
  }

  const multiPv = Math.max(1, Math.min(5, Math.round(requestedMultiPv || 1)));
  const url = new URL(endpoint);
  url.searchParams.set("fen", fen);
  url.searchParams.set("multiPv", String(multiPv));

  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    Math.min(Math.max(timeoutMs, 2_500), CLOUD_EVALUATION_TIMEOUT_MS),
  );

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Cloud evaluation returned ${response.status}.`);
    }

    const payload = (await response.json()) as CloudEvaluationResponse;
    const lines = (Array.isArray(payload.pvs) ? payload.pvs : [])
      .map((pv, index) => normalizeCloudPv(pv as CloudEvaluationPv, index))
      .filter((line): line is EngineLine => line !== null);
    const primary = lines[0];
    if (!primary) {
      throw new Error("Cloud evaluation returned no usable variations.");
    }

    const depth = finiteInteger(payload.depth);
    const knodes = finiteInteger(payload.knodes);
    const nodes = knodes == null ? null : knodes * 1_000;
    const normalizedLines = lines.map((line) => ({ ...line, depth, nodes, timeMs: null }));
    onOutput?.("info string Lichess cloud evaluation loaded");

    return {
      backend: "cloud",
      bestmove: primary.pv[0] ?? null,
      raw: ["info string Lichess cloud evaluation loaded"],
      scoreCp: primary.scoreCp,
      scoreMate: primary.scoreMate,
      pv: primary.pv,
      depth,
      nodes,
      timeMs: null,
      lines: normalizedLines,
    };
  } finally {
    window.clearTimeout(timer);
  }
}

function evaluateMaterialCp(chess: Chess) {
  return chess
    .board()
    .flat()
    .reduce((score, piece) => {
      if (!piece) {
        return score;
      }

      const value = FALLBACK_PIECE_VALUES[piece.type] ?? 0;
      return score + (piece.color === "w" ? value : -value);
    }, 0);
}

function squareActivityBonus(square: Square) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const fileDistance = Math.abs(file - 3.5);
  const rankDistance = Math.abs(rank - 3.5);

  return Math.max(0, 24 - Math.round((fileDistance + rankDistance) * 6));
}

function createLocalFallbackResult(fen: string): AnalyzeResult {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });
  const scoredMoves = legalMoves
    .map((move) => {
      const capturedValue = move.captured ? FALLBACK_PIECE_VALUES[move.captured] ?? 0 : 0;
      const promotionValue = move.promotion ? FALLBACK_PIECE_VALUES[move.promotion] ?? 0 : 0;
      const checkBonus = move.san.includes("#") ? 10_000 : move.san.includes("+") ? 90 : 0;
      const moveFlags = "flags" in move && typeof move.flags === "string" ? move.flags : "";
      const castleBonus = moveFlags.includes("k") || moveFlags.includes("q") ? 35 : 0;
      const activityBonus = squareActivityBonus(move.to as Square);

      return {
        move,
        score: capturedValue + promotionValue + checkBonus + castleBonus + activityBonus,
      };
    })
    .sort((a, b) => b.score - a.score);

  const bestMove = scoredMoves[0]?.move ?? null;
  const bestmove = bestMove
    ? `${bestMove.from}${bestMove.to}${bestMove.promotion ?? ""}`
    : null;
  const pv = bestmove ? [bestmove] : [];
  const scoreCp = evaluateMaterialCp(chess);

  return {
    backend: "worker",
    bestmove,
    raw: [
      "info string local fallback analysis used because Stockfish was unavailable or too slow",
    ],
    scoreCp,
    scoreMate: null,
    pv,
    depth: 0,
    nodes: legalMoves.length,
    timeMs: 0,
    lines: bestmove
      ? [
          {
            multipv: 1,
            scoreCp,
            scoreMate: null,
            pv,
            depth: 0,
            nodes: legalMoves.length,
            timeMs: 0,
          },
        ]
      : [],
  };
}

function parseSseFrame(frame: string) {
  const lines = frame.split(/\r?\n/);
  let event = "message";
  const data: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      data.push(line.slice("data:".length).trimStart());
    }
  }

  return {
    event,
    data: data.join("\n"),
  };
}

function getSseInfoLine(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const raw = (payload as { raw?: unknown }).raw;
  return typeof raw === "string" ? raw : "";
}

async function analyzeWithNativeEngineStream(
  payload: NativeAnalyzePayload,
  onOutput?: (line: string) => void,
) {
  const engineUrl = getNativeEngineUrl();
  if (!engineUrl) {
    throw new Error("Native Stockfish bridge is not configured for this environment.");
  }

  if (nativeEngineHealth === "unavailable") {
    throw new Error(
      nativeEngineFailureReason || "Native Stockfish bridge is unavailable for this session.",
    );
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), payload.timeoutMs + 1_500);

  try {
    const response = await fetch(`${engineUrl}/analyze/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      const message = await response.text();
      throw new Error(message || `Native Stockfish stream returned ${response.status}.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let finalResult: AnalyzeResult | null = null;

    const consumeFrame = (frame: string) => {
      const { event, data } = parseSseFrame(frame);
      if (!data) {
        return;
      }

      let payloadJson: unknown;
      try {
        payloadJson = JSON.parse(data);
      } catch {
        return;
      }

      if (event === "info") {
        const line = getSseInfoLine(payloadJson);
        if (line) {
          onOutput?.(line);
        }
        return;
      }

      if (event === "error") {
        const message =
          payloadJson && typeof payloadJson === "object" && "error" in payloadJson
            ? String((payloadJson as { error?: unknown }).error || "Native Stockfish bridge failed.")
            : "Native Stockfish bridge failed.";
        throw new Error(message);
      }

      if (event === "done") {
        finalResult = normalizeAnalyzeResult(payloadJson as Partial<AnalyzeResult>, "native");
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex >= 0) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        consumeFrame(frame);
        separatorIndex = buffer.indexOf("\n\n");
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      consumeFrame(buffer);
    }

    if (!finalResult) {
      throw new Error("Native Stockfish stream ended without a result.");
    }

    markNativeHealthy();
    return finalResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Native Stockfish stream failed to analyze the position.";
    throw new Error(message);
  } finally {
    window.clearTimeout(timer);
  }
}

async function analyzeWithNativeEngineJson(
  payload: NativeAnalyzePayload,
  onOutput?: (line: string) => void,
) {
  const engineUrl = getNativeEngineUrl();
  if (!engineUrl) {
    throw new Error("Native Stockfish bridge is not configured for this environment.");
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), payload.timeoutMs);

  try {
    const response = await fetch(`${engineUrl}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Native Stockfish bridge returned ${response.status}.`);
    }

    const json = (await response.json()) as Partial<AnalyzeResult>;
    const result = normalizeAnalyzeResult(json, "native");
    result.raw.forEach((line) => onOutput?.(line));
    markNativeHealthy();
    return result;
  } finally {
    window.clearTimeout(timer);
  }
}

async function analyzeWithNativeEngine(
  payload: NativeAnalyzePayload,
  onOutput?: (line: string) => void,
) {
  if (nativeEngineHealth === "unavailable") {
    throw new Error(
      nativeEngineFailureReason || "Native Stockfish bridge is unavailable for this session.",
    );
  }

  let streamError: unknown = null;
  try {
    return await analyzeWithNativeEngineStream(payload, onOutput);
  } catch (error) {
    streamError = error;
  }

  try {
    return await analyzeWithNativeEngineJson(payload, onOutput);
  } catch (error) {
    const streamMessage = streamError instanceof Error ? streamError.message : "";
    const jsonMessage =
      error instanceof Error
        ? error.message
        : "Native Stockfish bridge failed to analyze the position.";
    const message = streamMessage ? `${jsonMessage} (${streamMessage})` : jsonMessage;
    markNativeUnavailable(message);
    throw new Error(message);
  }
}

class StockfishManager {
  private worker: Worker | null = null;
  private queue: PendingRequest[] = [];
  private current: PendingRequest | null = null;
  private timer: number | null = null;

  private ensureWorker() {
    if (this.worker) {
      return;
    }

    const workerUrl = getStockfishWorkerUrl();
    this.worker = new Worker(workerUrl, { name: "stockfish-engine" });
    this.worker.onmessage = this.handleMessage;
    this.worker.onerror = () => {
      this.failCurrentAndQueue(
        new Error(`Stockfish worker failed to load: ${workerUrl}`),
        true,
      );
    };

    this.worker.postMessage("uci");
    this.worker.postMessage("setoption name Threads value 1");
    this.worker.postMessage("setoption name Hash value 16");
  }

  private clearTimer() {
    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleTimeout(timeoutMs: number) {
    this.clearTimer();
    this.timer = window.setTimeout(() => {
      this.failCurrentAndQueue(
        new Error("Browser Stockfish timed out on this position."),
        false,
      );
    }, timeoutMs);
  }

  private cleanupWorker() {
    if (!this.worker) {
      return;
    }

    try {
      this.worker.postMessage("quit");
    } catch {
      // no-op
    }

    try {
      this.worker.terminate();
    } catch {
      // no-op
    }

    this.worker = null;
  }

  private processNext = () => {
    if (this.current || this.queue.length === 0) {
      return;
    }

    try {
      this.ensureWorker();
    } catch (error) {
      this.failCurrentAndQueue(
        error instanceof Error
          ? error
          : new Error("Failed to initialize Stockfish."),
        true,
      );
      return;
    }

    this.current = this.queue.shift() || null;
    if (!this.current || !this.worker) {
      return;
    }

    this.current.started = false;
    this.scheduleTimeout(this.current.timeoutMs);
    this.worker.postMessage("isready");
  };

  private finishCurrent(result: AnalyzeResult) {
    if (!this.current) {
      return;
    }

    const request = this.current;
    this.current = null;
    this.clearTimer();
    markWorkerHealthy();
    request.resolve(result);
    this.processNext();
  }

  private failCurrentAndQueue(error: Error, markSessionUnavailable = false) {
    const active = this.current;
    const pending = [...this.queue];

    this.current = null;
    this.queue = [];
    this.clearTimer();
    this.cleanupWorker();

    if (markSessionUnavailable) {
      markWorkerUnavailable(error.message);
    }

    if (active) {
      active.reject(error);
    }

    pending.forEach((request) => request.reject(error));
  }

  private handleMessage = (event: MessageEvent) => {
    const line = toEngineLine(event.data);
    if (!line || !this.current || !this.worker) {
      return;
    }

    const request = this.current;
    request.rawLines.push(line);
    request.onOutput?.(line);

    if (line === "readyok" && !request.started) {
      request.started = true;
      this.worker.postMessage("ucinewgame");
      this.worker.postMessage(`position fen ${request.fen}`);
      this.worker.postMessage(`go depth ${request.depth}`);
      return;
    }

    const depthMatch = line.match(/\bdepth (\d+)/);
    if (depthMatch) {
      request.latestDepth = Number.parseInt(depthMatch[1], 10);
    }

    const nodesMatch = line.match(/\bnodes (\d+)/);
    if (nodesMatch) {
      request.latestNodes = Number.parseInt(nodesMatch[1], 10);
    }

    const timeMatch = line.match(/\btime (\d+)/);
    if (timeMatch) {
      request.latestTimeMs = Number.parseInt(timeMatch[1], 10);
    }

    const cpMatch = line.match(/\bscore cp (-?\d+)/);
    if (cpMatch) {
      request.latestScoreCp = Number.parseInt(cpMatch[1], 10);
      request.latestScoreMate = null;
    }

    const mateMatch = line.match(/\bscore mate (-?\d+)/);
    if (mateMatch) {
      request.latestScoreMate = Number.parseInt(mateMatch[1], 10);
      request.latestScoreCp = null;
    }

    const pvMatch = line.match(/\bpv (.+)$/);
    if (pvMatch) {
      request.latestPv = pvMatch[1].trim().split(/\s+/);
    }

    const bestmoveMatch = line.match(/^bestmove\s+(\S+)/);
    if (!bestmoveMatch) {
      return;
    }

    const bestmove = bestmoveMatch[1] === "(none)" ? null : bestmoveMatch[1];
    const primaryLine: EngineLine | undefined = request.latestPv.length
      ? {
          multipv: 1,
          scoreCp: request.latestScoreCp,
          scoreMate: request.latestScoreMate,
          pv: request.latestPv,
          depth: request.latestDepth,
          nodes: request.latestNodes,
          timeMs: request.latestTimeMs,
        }
      : undefined;

    this.finishCurrent({
      backend: "worker",
      bestmove,
      raw: request.rawLines,
      scoreCp: request.latestScoreCp,
      scoreMate: request.latestScoreMate,
      pv: request.latestPv,
      depth: request.latestDepth,
      nodes: request.latestNodes,
      timeMs: request.latestTimeMs,
      lines: primaryLine ? [primaryLine] : undefined,
    });
  };

  enqueue(
    fen: string,
    depth: number,
    onOutput?: (line: string) => void,
    timeoutMs = 20_000,
  ) {
    if (workerHealth === "unavailable") {
      return Promise.reject(
        new Error(
          workerFailureReason || "Stockfish worker is unavailable in this browser session.",
        ),
      );
    }

    return new Promise<AnalyzeResult>((resolve, reject) => {
      this.queue.push({
        fen,
        depth,
        timeoutMs,
        onOutput,
        resolve,
        reject,
        rawLines: [],
        latestScoreCp: null,
        latestScoreMate: null,
        latestPv: [],
        latestDepth: null,
        latestNodes: null,
        latestTimeMs: null,
        started: false,
      });
      this.processNext();
    });
  }
}

const stockfishManager = new StockfishManager();

export function getStockfishStatus() {
  return {
    cloud: {
      url: getCloudEvaluationUrl(),
    },
    native: {
      health: nativeEngineHealth,
      reason: nativeEngineFailureReason,
      url: getNativeEngineUrl(),
    },
    worker: {
      health: workerHealth,
      reason: workerFailureReason,
      url: getStockfishWorkerUrl(),
    },
  };
}

export async function analyzeFenWithStockfish(
  fen: string,
  depth = 15,
  onOutput?: (line: string) => void,
  timeoutMs = 20_000,
  options: AnalyzeOptions = {},
) {
  const nativeUrl = getNativeEngineUrl();
  const requestTimeoutMs = options.timeoutMs ?? timeoutMs;
  const browserSafeDepth = Math.min(depth, options.multiPv && options.multiPv > 1 ? 7 : 8);
  const browserSafeTimeoutMs = Math.max(requestTimeoutMs, 18_000);

  if (options.preferCloud) {
    try {
      const cloudResult = await analyzeWithCloudEvaluation(
        fen,
        options.multiPv ?? 1,
        requestTimeoutMs,
        onOutput,
      );
      if (cloudResult) {
        return cloudResult;
      }
    } catch (error) {
      console.warn("Lichess cloud evaluation failed, falling back to Stockfish.", error);
    }
  }

  if (nativeUrl && nativeEngineHealth !== "unavailable") {
    try {
      return await analyzeWithNativeEngine(
        {
          fen,
          depth,
          timeoutMs: requestTimeoutMs,
          moves: options.moves,
          multiPv: options.multiPv,
          movetime: options.movetime,
          nodes: options.nodes,
          threads: options.threads,
          hash: options.hash,
          sessionId: options.sessionId,
        },
        onOutput,
      );
    } catch (error) {
      console.warn("Native Stockfish bridge failed, falling back to worker engine.", error);
    }
  }

  try {
    return await stockfishManager.enqueue(fen, browserSafeDepth, onOutput, browserSafeTimeoutMs);
  } catch (error) {
    console.warn("Browser Stockfish failed, using local fallback analysis.", error);
    return createLocalFallbackResult(fen);
  }
}

export default analyzeFenWithStockfish;
