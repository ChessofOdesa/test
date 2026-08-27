import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number.parseInt(process.env.STOCKFISH_BRIDGE_PORT || "8765", 10);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_PATH_CANDIDATES = [
  process.env.STOCKFISH_ENGINE_PATH,
  "C:\\Users\\Professional\\Downloads\\stockfish\\stockfish-windows-x86-64-avx2.exe",
  "C:\\Users\\Professional\\Downloads\\stockfish-windows-x86-64-avx2.exe",
  "C:\\Users\\Professional\\Downloads\\Downloads\\stockfish\\stockfish-windows-x86-64-avx2.exe",
  join(__dirname, "engines", "stockfish-windows-x86-64-avx2.exe"),
  join(__dirname, "engines", "stockfish.exe"),
].filter(Boolean);
const ENGINE_PATH =
  ENGINE_PATH_CANDIDATES.find((candidate) => existsSync(candidate)) ||
  ENGINE_PATH_CANDIDATES[0];

const DEFAULT_DEPTH = 14;
const DEFAULT_TIMEOUT_MS = 18_000;
const MAX_PAYLOAD_BYTES = 1_000_000;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendSse(response, event, payload) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function clampInt(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.trunc(numeric)));
}

function normalizeWork(body) {
  const fen =
    typeof body.fen === "string"
      ? body.fen.trim()
      : typeof body.initialFen === "string"
        ? body.initialFen.trim()
        : "";

  return {
    fen,
    initialFen: typeof body.initialFen === "string" ? body.initialFen.trim() : fen,
    moves: Array.isArray(body.moves)
      ? body.moves.filter((move) => typeof move === "string" && move.trim()).map((move) => move.trim())
      : [],
    depth: clampInt(body.depth, DEFAULT_DEPTH, 1, 24),
    movetime: body.movetime == null ? null : clampInt(body.movetime, 0, 50, 120_000),
    nodes: body.nodes == null ? null : clampInt(body.nodes, 0, 1, 2_000_000_000),
    timeoutMs: clampInt(body.timeoutMs, DEFAULT_TIMEOUT_MS, 2_000, 60_000),
    threads: clampInt(body.threads, 1, 1, 16),
    hash: clampInt(body.hash, 32, 1, 4096),
    multiPv: clampInt(body.multiPv ?? body.multipv, 1, 1, 8),
    sessionId: typeof body.sessionId === "string" ? body.sessionId : "default",
  };
}

function createEmptyState() {
  return {
    raw: [],
    scoreCp: null,
    scoreMate: null,
    pv: [],
    depth: null,
    nodes: null,
    timeMs: null,
    lines: [],
    lineMap: new Map(),
  };
}

function parseInfoLine(line, state) {
  state.raw.push(line);

  const depthMatch = line.match(/\bdepth (\d+)/);
  const nodesMatch = line.match(/\bnodes (\d+)/);
  const timeMatch = line.match(/\btime (\d+)/);
  const multipvMatch = line.match(/\bmultipv (\d+)/);
  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  const pvMatch = line.match(/\bpv (.+)$/);

  const multipv = multipvMatch ? Number.parseInt(multipvMatch[1], 10) : 1;
  const lineState = state.lineMap.get(multipv) || {
    multipv,
    scoreCp: null,
    scoreMate: null,
    pv: [],
    depth: null,
    nodes: null,
    timeMs: null,
  };

  if (depthMatch) {
    const depth = Number.parseInt(depthMatch[1], 10);
    state.depth = depth;
    lineState.depth = depth;
  }

  if (nodesMatch) {
    const nodes = Number.parseInt(nodesMatch[1], 10);
    state.nodes = nodes;
    lineState.nodes = nodes;
  }

  if (timeMatch) {
    const timeMs = Number.parseInt(timeMatch[1], 10);
    state.timeMs = timeMs;
    lineState.timeMs = timeMs;
  }

  if (cpMatch) {
    const scoreCp = Number.parseInt(cpMatch[1], 10);
    lineState.scoreCp = scoreCp;
    lineState.scoreMate = null;
    if (multipv === 1) {
      state.scoreCp = scoreCp;
      state.scoreMate = null;
    }
  }

  if (mateMatch) {
    const scoreMate = Number.parseInt(mateMatch[1], 10);
    lineState.scoreMate = scoreMate;
    lineState.scoreCp = null;
    if (multipv === 1) {
      state.scoreMate = scoreMate;
      state.scoreCp = null;
    }
  }

  if (pvMatch) {
    const pv = pvMatch[1].trim().split(/\s+/);
    lineState.pv = pv;
    if (multipv === 1) {
      state.pv = pv;
    }
  }

  state.lineMap.set(multipv, lineState);
  state.lines = [...state.lineMap.values()].sort((a, b) => a.multipv - b.multipv);

  return {
    raw: line,
    depth: state.depth,
    nodes: state.nodes,
    timeMs: state.timeMs,
    scoreCp: state.scoreCp,
    scoreMate: state.scoreMate,
    pv: state.pv,
    lines: state.lines,
  };
}

function toAnalyzeResult(state, bestmove) {
  return {
    backend: "native",
    bestmove,
    raw: state.raw,
    scoreCp: state.scoreCp,
    scoreMate: state.scoreMate,
    pv: state.pv,
    depth: state.depth,
    nodes: state.nodes,
    timeMs: state.timeMs,
    lines: state.lines.map((line) => ({
      multipv: line.multipv,
      scoreCp: line.scoreCp,
      scoreMate: line.scoreMate,
      pv: line.pv,
      depth: line.depth,
      nodes: line.nodes,
      timeMs: line.timeMs,
    })),
  };
}

class StockfishBridge {
  process = null;
  buffer = "";
  starting = null;
  queue = [];
  current = null;
  waiters = [];
  sessionId = null;
  options = {
    threads: null,
    hash: null,
    multiPv: null,
  };

  get alive() {
    return Boolean(this.process && !this.process.killed);
  }

  async analyze(work, callbacks = {}) {
    return new Promise((resolve, reject) => {
      const job = {
        work,
        callbacks,
        resolve,
        reject,
        state: createEmptyState(),
        started: false,
        cancelled: false,
        stopReason: null,
        settled: false,
        timer: null,
        stopTimer: null,
      };

      this.queue.push(job);
      this.processNext();
    });
  }

  stopCurrent(reason = "Analysis stopped.") {
    if (!this.current || this.current.settled) {
      return;
    }

    this.current.cancelled = true;
    this.current.stopReason = reason;
    this.send("stop");
  }

  async processNext() {
    if (this.current || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.current = job;

    try {
      await this.ensureStarted();
      await this.prepareJob(job);
      this.startJob(job);
    } catch (error) {
      this.finishCurrent(job, error);
    }
  }

  async ensureStarted() {
    if (!existsSync(ENGINE_PATH)) {
      throw new Error(
        `Stockfish executable was not found. Checked: ${ENGINE_PATH_CANDIDATES.join(" | ")}. Set STOCKFISH_ENGINE_PATH to override it.`,
      );
    }

    if (this.alive) {
      return;
    }

    if (this.starting) {
      return this.starting;
    }

    this.starting = new Promise((resolve, reject) => {
      this.process = spawn(ENGINE_PATH, [], {
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: true,
      });
      this.buffer = "";
      this.sessionId = null;
      this.options = {
        threads: null,
        hash: null,
        multiPv: null,
      };

      this.process.stdout.on("data", (chunk) => this.handleStdout(chunk));
      this.process.stderr.on("data", (chunk) => {
        const message = String(chunk).trim();
        if (this.current && message) {
          this.current.state.raw.push(message);
        }
      });
      this.process.on("error", (error) => {
        this.rejectWaiters(error);
        if (this.current) {
          this.finishCurrent(this.current, error);
        }
      });
      this.process.on("exit", () => {
        const error = new Error("Native Stockfish process exited.");
        this.process = null;
        this.starting = null;
        this.rejectWaiters(error);
        if (this.current) {
          this.finishCurrent(this.current, error);
        }
      });

      this.waitForLine((line) => line === "uciok", 8_000)
        .then(async () => {
          this.send("setoption name UCI_AnalyseMode value true");
          await this.isReady();
          resolve();
        })
        .catch(reject)
        .finally(() => {
          this.starting = null;
        });

      this.send("uci");
    });

    return this.starting;
  }

  async prepareJob(job) {
    const { work } = job;

    if (work.sessionId !== this.sessionId) {
      this.send("ucinewgame");
      this.sessionId = work.sessionId;
      await this.isReady();
    }

    const optionChanges = [];
    if (this.options.threads !== work.threads) {
      optionChanges.push(["Threads", work.threads]);
      this.options.threads = work.threads;
    }
    if (this.options.hash !== work.hash) {
      optionChanges.push(["Hash", work.hash]);
      this.options.hash = work.hash;
    }
    if (this.options.multiPv !== work.multiPv) {
      optionChanges.push(["MultiPV", work.multiPv]);
      this.options.multiPv = work.multiPv;
    }

    optionChanges.forEach(([name, value]) => this.send(`setoption name ${name} value ${value}`));
    if (optionChanges.length) {
      await this.isReady();
    }
  }

  startJob(job) {
    const { work } = job;
    const positionCommand = work.moves.length
      ? `position fen ${work.initialFen} moves ${work.moves.join(" ")}`
      : `position fen ${work.fen}`;

    job.timer = setTimeout(() => {
      if (this.current === job) {
        job.cancelled = true;
        job.stopReason = "Native Stockfish bridge timed out.";
        this.send("stop");
        job.stopTimer = setTimeout(() => {
          if (this.current === job) {
            this.restartEngine();
            this.finishCurrent(job, new Error(job.stopReason));
          }
        }, 1_500);
      }
    }, work.timeoutMs);

    this.send(positionCommand);

    if (work.movetime) {
      this.send(`go movetime ${work.movetime}`);
    } else if (work.nodes) {
      this.send(`go nodes ${work.nodes}`);
    } else {
      this.send(`go depth ${work.depth}`);
    }
  }

  finishCurrent(job, error = null, result = null) {
    if (job.settled) {
      return;
    }

    job.settled = true;
    if (job.timer) {
      clearTimeout(job.timer);
      job.timer = null;
    }
    if (job.stopTimer) {
      clearTimeout(job.stopTimer);
      job.stopTimer = null;
    }

    if (this.current === job) {
      this.current = null;
    }

    if (error) {
      job.callbacks.onError?.(error);
      job.reject(error);
    } else {
      job.resolve(result);
    }

    this.processNext();
  }

  handleStdout(chunk) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      if (this.resolveWaiters(line)) {
        continue;
      }

      const job = this.current;
      if (!job) {
        continue;
      }

      if (line.startsWith("info ")) {
        const info = parseInfoLine(line, job.state);
        job.callbacks.onInfo?.(info);
        continue;
      }

      const bestmoveMatch = line.match(/^bestmove\s+(\S+)/);
      if (!bestmoveMatch) {
        continue;
      }

      const bestmove = bestmoveMatch[1] === "(none)" ? null : bestmoveMatch[1];
      if (job.cancelled) {
        this.finishCurrent(job, new Error(job.stopReason || "Analysis stopped."));
        continue;
      }

      const result = toAnalyzeResult(job.state, bestmove);
      job.callbacks.onBestMove?.(result);
      this.finishCurrent(job, null, result);
    }
  }

  waitForLine(predicate, timeoutMs) {
    return new Promise((resolve, reject) => {
      const waiter = {
        predicate,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.waiters = this.waiters.filter((entry) => entry !== waiter);
          reject(new Error("Native Stockfish bridge did not become ready in time."));
        }, timeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  resolveWaiters(line) {
    let resolved = false;
    for (const waiter of [...this.waiters]) {
      if (!waiter.predicate(line)) {
        continue;
      }

      clearTimeout(waiter.timer);
      this.waiters = this.waiters.filter((entry) => entry !== waiter);
      waiter.resolve(line);
      resolved = true;
    }

    return resolved;
  }

  rejectWaiters(error) {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.waiters = [];
  }

  isReady() {
    const ready = this.waitForLine((line) => line === "readyok", 8_000);
    this.send("isready");
    return ready;
  }

  send(command) {
    if (!this.process?.stdin?.writable) {
      throw new Error("Native Stockfish process is not writable.");
    }

    this.process.stdin.write(`${command}\n`);
  }

  restartEngine() {
    if (!this.process) {
      return;
    }

    try {
      this.process.kill();
    } catch {
      // no-op
    }

    this.process = null;
    this.starting = null;
    this.sessionId = null;
    this.options = {
      threads: null,
      hash: null,
      multiPv: null,
    };
  }
}

const bridge = new StockfishBridge();

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > MAX_PAYLOAD_BYTES) {
        reject(new Error("Request payload is too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

async function handleAnalyze(request, response) {
  try {
    const body = await readJsonBody(request);
    const work = normalizeWork(body);

    if (!work.fen) {
      sendJson(response, 400, { error: "A FEN string is required." });
      return;
    }

    const result = await bridge.analyze(work);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Native Stockfish bridge failed.",
    });
  }
}

async function handleAnalyzeStream(request, response) {
  let closed = false;

  try {
    const body = await readJsonBody(request);
    const work = normalizeWork(body);

    if (!work.fen) {
      sendJson(response, 400, { error: "A FEN string is required." });
      return;
    }

    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    });
    response.write(": connected\n\n");

    request.on("close", () => {
      closed = true;
      bridge.stopCurrent("Client closed the analysis stream.");
    });

    const result = await bridge.analyze(work, {
      onInfo: (info) => {
        if (!closed) {
          sendSse(response, "info", info);
        }
      },
      onBestMove: (payload) => {
        if (!closed) {
          sendSse(response, "bestmove", payload);
        }
      },
      onError: (error) => {
        if (!closed) {
          sendSse(response, "error", {
            error: error instanceof Error ? error.message : "Native Stockfish bridge failed.",
          });
        }
      },
    });

    if (!closed) {
      sendSse(response, "done", result);
      response.end();
    }
  } catch (error) {
    if (response.headersSent) {
      if (!closed) {
        sendSse(response, "error", {
          error: error instanceof Error ? error.message : "Native Stockfish bridge failed.",
        });
        response.end();
      }
      return;
    }

    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Native Stockfish bridge failed.",
    });
  }
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      ok: existsSync(ENGINE_PATH),
      enginePath: ENGINE_PATH,
      checkedPaths: ENGINE_PATH_CANDIDATES,
      persistent: true,
      port: PORT,
      streamEndpoint: "/analyze/stream",
    });
    return;
  }

  if (request.method === "POST" && request.url === "/analyze") {
    await handleAnalyze(request, response);
    return;
  }

  if (request.method === "POST" && request.url === "/analyze/stream") {
    await handleAnalyzeStream(request, response);
    return;
  }

  sendJson(response, 404, { error: "Not found." });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Native Stockfish bridge is listening on http://127.0.0.1:${PORT}`);
  console.log(`Using engine: ${ENGINE_PATH}`);
});
