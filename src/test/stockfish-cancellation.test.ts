import { afterEach, expect, it, vi } from "vitest";
const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
class EngineWorker {
    static instances: EngineWorker[] = [];
    sent: string[] = [];
    terminated = false;
    onmessage?: (event: {
        data: string;
    }) => void;
    constructor() { EngineWorker.instances.push(this); }
    postMessage(value: string) { this.sent.push(value); }
    terminate() { this.terminated = true; }
    receive(data: string) { this.onmessage?.({ data }); }
}
afterEach(() => vi.unstubAllGlobals());
it("cancels one queued request and restarts after an active abort without stale worker output", async () => {
    vi.resetModules();
    vi.stubGlobal("Worker", EngineWorker);
    const { default: analyze } = await import("@/lib/stockfish");
    const firstAbort = new AbortController(), queuedAbort = new AbortController();
    const first = analyze(start, 4, undefined, 8000, { signal: firstAbort.signal, workerOnly: true, movetime: 500 }).catch(error => error);
    const queued = analyze(start, 4, undefined, 8000, { signal: queuedAbort.signal, workerOnly: true }).catch(error => error);
    const next = analyze(start, 5, undefined, 8000, { workerOnly: true });
    const old = EngineWorker.instances[0];
    expect(old.sent).not.toContain("isready");
    old.receive("uciok");
    expect(old.sent).toContain("isready");
    old.receive("readyok");
    expect(old.sent).toContain("go depth 4 movetime 500");
    queuedAbort.abort();
    expect((await queued).name).toBe("AbortError");
    expect(old.terminated).toBe(false);
    firstAbort.abort();
    expect((await first).name).toBe("AbortError");
    expect(old.terminated).toBe(true);
    old.receive("bestmove a2a3");
    const worker = EngineWorker.instances[1];
    worker.receive("uciok");
    worker.receive("readyok");
    worker.receive("info depth 5 score cp 23 pv e2e4");
    worker.receive("bestmove e2e4");
    expect((await next).bestmove).toBe("e2e4");
});
