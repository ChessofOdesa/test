
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
  signal?: AbortSignal;
  workerOnly?: boolean;
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
  multiPv: number;
  lines: Map<number, EngineLine>;
  movetime?: number;
  cleanup?: () => void;
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

function invertEngineScore(value: number | null) {
  if (value == null || value === 0) {
    return value;
  }

  return -value;
}

function normalizeUciInfoLineForWhite(fen: string, line: string) {
  if (fen.trim().split(/\s+/)[1] !== "b") {
    return line;
  }

  return line.replace(/\bscore (cp|mate) (-?\d+)/g, (_match, kind: string, rawValue: string) => {
    const value = Number.parseInt(rawValue, 10);
    return `score ${kind} ${value === 0 ? 0 : -value}`;
  });
}

/**
 * UCI engines report scores from the side-to-move perspective. The rest of
 * Chess of Odesa stores evaluations from White's perspective, so Black-to-move
 * results must be inverted before move-loss comparisons or an evaluation bar.
 */
export function normalizeSideToMoveResultForWhite(
  fen: string,
  result: AnalyzeResult,
): AnalyzeResult {
  if (fen.trim().split(/\s+/)[1] !== "b") {
    return result;
  }

  return {
    ...result,
    raw: result.raw.map((line) => normalizeUciInfoLineForWhite(fen, line)),
    scoreCp: invertEngineScore(result.scoreCp),
    scoreMate: invertEngineScore(result.scoreMate),
    lines: result.lines?.map((line) => ({
      ...line,
      scoreCp: invertEngineScore(line.scoreCp),
      scoreMate: invertEngineScore(line.scoreMate),
    })),
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
  private uciReady = false;

  private ensureWorker() {
    if (this.worker) {
      return;
    }

    const workerUrl = getStockfishWorkerUrl();
    this.worker = new Worker(workerUrl, { name: "stockfish-engine" });
    const source = this.worker;
    this.worker.onmessage = event => { if (this.worker === source) this.handleMessage(event); };
    this.worker.onerror = () => {
      if (this.worker !== source) return;
      this.failCurrentAndQueue(
        new Error(`Stockfish worker failed to load: ${workerUrl}`),
        true,
      );
    };

    this.worker.postMessage("uci");
    // This bundled WASM build has fixed defaults: one thread and 16 MB hash.
    // Reconfiguring its thread pool can stall startup.
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
    this.uciReady = false;
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
    this.scheduleTimeout(this.uciReady ? this.current.timeoutMs : Math.max(20000, this.current.timeoutMs));
    if (this.uciReady) this.worker.postMessage("isready");
  };

  private finishCurrent(result: AnalyzeResult) {
    if (!this.current) {
      return;
    }

    const request = this.current;
    this.current = null;
    this.clearTimer();
    markWorkerHealthy();
    request.cleanup?.();
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
      active.cleanup?.();
      active.reject(error);
    }

    pending.forEach((request) => { request.cleanup?.(); request.reject(error); });
  }

  private handleMessage = (event: MessageEvent) => {
    const line = toEngineLine(event.data);
    if (!line || !this.current || !this.worker) {
      return;
    }

    const request = this.current;
    request.rawLines.push(line);
    request.onOutput?.(line);

    if (line === "uciok") {
      this.uciReady = true;
      this.worker.postMessage("isready");
      return;
    }

    if (line === "readyok" && !request.started) {
      this.scheduleTimeout(request.timeoutMs);
      request.started = true;
      this.worker.postMessage("ucinewgame");
      this.worker.postMessage(`setoption name MultiPV value ${request.multiPv}`);
      this.worker.postMessage(`position fen ${request.fen}`);
      this.worker.postMessage(`go depth ${request.depth}${request.movetime ? ` movetime ${request.movetime}` : ""}`);
      return;
    }

    // Keep depth and score from the same completed, exact PV. Search progress
    // and aspiration bounds must not become a finished move evaluation.
    if (/\bscore (cp|mate) -?\d+/.test(line) && !/\b(lowerbound|upperbound)\b/.test(line)) {
      const multipv = Number(line.match(/\bmultipv (\d+)/)?.[1] || 1);
      const pv = line.match(/\bpv (.+)$/)?.[1].trim().split(/\s+/) || [];
      if (pv.length) request.lines.set(multipv, {
        multipv, pv,
        scoreCp: /\bscore cp /.test(line) ? Number(line.match(/\bscore cp (-?\d+)/)![1]) : null,
        scoreMate: /\bscore mate /.test(line) ? Number(line.match(/\bscore mate (-?\d+)/)![1]) : null,
        depth: Number(line.match(/\bdepth (\d+)/)?.[1] || 0),
      });
      // Other PVs must not overwrite the primary score or best continuation.
      if (multipv !== 1) return;
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
      lines: request.lines.size ? [...request.lines.values()].sort((a, b) => a.multipv - b.multipv) : primaryLine ? [primaryLine] : undefined,
    });
  };

  private cancelRequest(request: PendingRequest) {
    const error = new DOMException("Analysis cancelled", "AbortError");
    request.cleanup?.();
    if (this.current === request) {
      this.current = null;
      this.clearTimer();
      this.cleanupWorker();
    } else this.queue = this.queue.filter(item => item !== request);
    request.reject(error);
    this.processNext();
  }

  enqueue(
    fen: string,
    depth: number,
    onOutput?: (line: string) => void,
    timeoutMs = 20_000,
    options: { signal?: AbortSignal; movetime?: number; multiPv?: number } = {},
  ) {
    if (options.signal?.aborted) return Promise.reject(new DOMException("Analysis cancelled", "AbortError"));
    if (workerHealth === "unavailable") {
      return Promise.reject(
        new Error(
          workerFailureReason || "Stockfish worker is unavailable in this browser session.",
        ),
      );
    }

    return new Promise<AnalyzeResult>((resolve, reject) => {
      const request: PendingRequest = {
        multiPv: Math.max(1, Math.min(3, Math.round(options.multiPv || 1))),
        lines: new Map(),
        movetime: options.movetime,
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
      };
      const cancel = () => this.cancelRequest(request);
      options.signal?.addEventListener("abort", cancel, { once: true });
      request.cleanup = () => options.signal?.removeEventListener("abort", cancel);
      this.queue.push(request);
      this.processNext();
    });
  }
  releaseIfIdle() {
    if (!this.current && this.queue.length === 0) this.cleanupWorker();
  }

}

const stockfishManager = new StockfishManager();

export function releaseIdleStockfishWorker() { stockfishManager.releaseIfIdle(); }
export function retryStockfishWorker() { workerHealth = "unknown"; workerFailureReason = null; }

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
  // Time-bounded worker jobs can honour the requested depth. The legacy cap
  // protected unbounded searches, but silently limited post-game review to 8.
  const timedWorker = options.workerOnly && Number.isFinite(options.movetime) && options.movetime! > 0;
  const browserSafeDepth = Math.min(depth, timedWorker ? 20 : options.multiPv && options.multiPv > 1 ? 7 : 8);
  const browserSafeTimeoutMs = Math.max(requestTimeoutMs, 18_000);
  const whitePerspectiveOutput = onOutput
    ? (line: string) => onOutput(normalizeUciInfoLineForWhite(fen, line))
    : undefined;

  if (options.signal?.aborted) throw new DOMException("Analysis cancelled", "AbortError");
  if (options.preferCloud && !options.workerOnly) {
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

  if (nativeUrl && nativeEngineHealth !== "unavailable" && !options.workerOnly) {
    try {
      const result = await analyzeWithNativeEngine(
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
        whitePerspectiveOutput,
      );
      return normalizeSideToMoveResultForWhite(fen, result);
    } catch (error) {
      console.warn("Native Stockfish bridge failed, falling back to worker engine.", error);
    }
  }

  try {
    const result = await stockfishManager.enqueue(
      fen,
      browserSafeDepth,
      whitePerspectiveOutput,
      options.workerOnly ? requestTimeoutMs : browserSafeTimeoutMs,
      { signal: options.signal, movetime: options.movetime, multiPv: options.multiPv },
    );
    return normalizeSideToMoveResultForWhite(fen, result);
  } catch (error) {
    if (options.signal?.aborted || error instanceof DOMException && error.name === "AbortError") throw error;
    console.warn("Browser Stockfish is unavailable.", error);
    throw new Error("Stockfish недоступний. Оновіть сторінку та повторіть аналіз.");
  }
}

export default analyzeFenWithStockfish;
