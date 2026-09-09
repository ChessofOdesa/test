import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Chess } from "chess.js";
import MoveList from "@/components/MoveList";
import { GamePanel } from "@/features/game-room/GamePanel";
import { analyzeGame } from "@/features/game-room/review/engine";
import { buildReview, formatReviewScore, gradeMove, parseReviewGame, terminalSample, type ReviewSample } from "@/features/game-room/review/model";
import { readReview, saveReview } from "@/features/game-room/review/cache";
import { useGameReview } from "@/features/game-room/review/useGameReview";
import type { AnalyzeOptions } from "@/lib/stockfish";
import type { RoomResult } from "@/features/game-room/types";

const engine = vi.hoisted(() => ({ analyze: vi.fn(), release: vi.fn() }));
vi.mock("@/lib/stockfish", () => ({ default: engine.analyze, releaseIdleStockfishWorker: engine.release }));
const pgn = "1. f3 e5 2. g4 Qh4# 0-1";
const sample = (cp: number, bestMove: string | null = null): ReviewSample => ({ score: { cp, mate: null }, bestMove, depth: 12 });
const samples: ReviewSample[] = [sample(20, "e2e4"), sample(-80, "e7e5"), sample(-80, "e2e4"), { score: { cp: null, mate: -1 }, bestMove: "d8h4", depth: 12 }, { score: { cp: null, mate: 0, winner: "b" }, bestMove: null, depth: null }];
const result = (): RoomResult => ({ id: "review-game", pgn, result: "0-1", reason: "Мат", title: "Поразка", tone: "loss", players: { w: { name: "Білі" }, b: { name: "Чорні" } }, actions: <button>Реванш</button>, onFullAnalysis: vi.fn() });
function resolveEngine() {
  let index = 0;
  engine.analyze.mockImplementation(async () => {
    const row = samples[index++];
    return { scoreCp: row.score.cp, scoreMate: row.score.mate, bestmove: row.bestMove, depth: row.depth };
  });
}
beforeEach(() => { localStorage.clear(); engine.analyze.mockReset(); engine.release.mockReset(); });
afterEach(cleanup);

describe("post-game scoring", () => {
  it("measures a black mistake from black's perspective, using the same grading thresholds as full analysis", () => {
    const game = new Chess(); game.move("e4"); const move = game.move("e5");
    const black = gradeMove(move, 1, sample(-100, "c7c5"), sample(275));
    expect(black.cpLoss).toBe(375);
    expect(black.classification).toBe("blunder");
    expect(black.bestMoveSan).toBe("c5");
    expect(gradeMove(move, 1, sample(50, "c7c5"), sample(-50)).loss).toBe(0);
  });
  it("handles mate zero for either winner and excludes mate transitions from centipawn averages", () => {
    const blackMate = new Chess(); blackMate.loadPgn(pgn);
    expect(formatReviewScore(terminalSample(blackMate)!.score)).toBe("Мат за чорних");
    const whiteMate = new Chess(); whiteMate.loadPgn("1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0");
    expect(formatReviewScore(terminalSample(whiteMate)!.score)).toBe("Мат за білих");
    const report = buildReview(pgn, samples);
    expect(report.keyMove?.san).toBe("g4");
    expect(report.moves[2].cpLoss).toBeNull();
    expect(report.moves[3].classification).toBe("best");
    expect(report.sides.w.averageLoss).toBe(100);
    expect(report.sides.b.cpMoves).toBe(1);
  });
  it("recognizes actual draws and preserves black-to-move FEN imports and underpromotion", () => {
    const stale = new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(terminalSample(stale)?.score.cp).toBe(0);
    const repeated = new Chess(); repeated.loadPgn("1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8");
    expect(terminalSample(repeated)?.score.cp).toBe(0);
    const custom = '[SetUp "1"]\n[FEN "7k/8/8/8/8/8/p7/7K b - - 0 12"]\n\n12... a1=N 1/2-1/2';
    const imported = parseReviewGame(custom);
    expect(imported.moves[0].color).toBe("b");
    expect(imported.moves[0].promotion).toBe("n");
    render(<MoveList moves={["a1=N"]} startColor="b" startMoveNumber={12} onMoveClick={vi.fn()}/>);
    expect(screen.getByRole("button", { name: "12. Чорні: a1=N" })).toBeInTheDocument();
    expect(gradeMove(imported.moves[0], 0, sample(-5, "a2a1n"), sample(0)).bestMoveSan).toBe("a1=N");
  });
  it("detects openings from the existing catalogue, without guessing a name", () => {
    const italian = "1. e4 e5 2. Nf3 Nc6 3. Bc4 *";
    expect(buildReview(italian, Array.from({ length: 6 }, () => sample(0))).opening?.eco).toBe("C50");
    expect(buildReview(pgn, samples).opening).toBeNull();
  });
});

describe("review engine and cache", () => {
  it("analyses each position in a worker, reports progress and derives the terminal mate from chess rules", async () => {
    resolveEngine();
    const progress = vi.fn(); const controller = new AbortController();
    const report = await analyzeGame(pgn, controller.signal, progress);
    expect(engine.analyze).toHaveBeenCalledTimes(4);
    expect(engine.analyze.mock.calls.every(call => call[4].workerOnly && call[4].signal === controller.signal)).toBe(true);
    expect(report.moves).toHaveLength(4);
    expect(progress).toHaveBeenLastCalledWith(4, 4);
    expect(engine.release).toHaveBeenCalledOnce();
  });
  it("rejects missing scores and never caches a partial or failed analysis", async () => {
    engine.analyze.mockResolvedValue({ scoreCp: null, scoreMate: null, bestmove: "e2e4" });
    await expect(analyzeGame(pgn, new AbortController().signal, vi.fn())).rejects.toThrow("не повернув оцінку");
    expect(readReview(pgn)).toBeNull();
    expect(engine.release).toHaveBeenCalledOnce();
  });
  it("reuses the exact game and engine configuration, ignores cosmetic headers, and recovers a damaged cache", () => {
    saveReview(pgn, buildReview(pgn, samples));
    expect(readReview('[White "Нова назва"]\n\n' + pgn)?.moves).toHaveLength(4);
    expect(readReview("1. e4 e5 0-1")).toBeNull();
    const saved = localStorage.getItem("coo.game-review.v1")!;
    localStorage.setItem("coo.game-review.v1", saved.replace("review-3", "review-old"));
    expect(readReview(pgn)).toBeNull();
    localStorage.setItem("coo.game-review.v1", "null"); expect(readReview(pgn)).toBeNull();
    localStorage.setItem("coo.game-review.v1", "[{\"samples\":[]}]" ); expect(readReview(pgn)).toBeNull();
  });
  it("aborts on navigation, ignores a late response, and does not start an engine for a cached review", async () => {
    let signal: AbortSignal | undefined;
    let resolve!: (value: object) => void;
    engine.analyze.mockImplementation((_fen, _depth, _output, _timeout, options: AnalyzeOptions) => {
      signal = options.signal; return new Promise(done => { resolve = done; });
    });
    const hook = renderHook(() => useGameReview(pgn));
    let pending!: Promise<void>;
    act(() => { pending = hook.result.current.start(); });
    await waitFor(() => expect(engine.analyze).toHaveBeenCalledOnce());
    hook.unmount(); expect(signal?.aborted).toBe(true);
    resolve({ scoreCp: 20, scoreMate: null, bestmove: "e2e4", depth: 12 });
    await pending; expect(readReview(pgn)).toBeNull();
    saveReview(pgn, buildReview(pgn, samples));
    const cached = renderHook(() => useGameReview(pgn));
    expect(cached.result.current.status).toBe("done");
    await act(async () => { await cached.result.current.start(); });
    expect(engine.analyze).toHaveBeenCalledOnce();
  });
});

it("keeps active rooms free of review, then supports progress, cancellation, real errors, move jumps and full analysis", async () => {
  const onCursor = vi.fn();
  const props = { moves: ["f3", "e5", "g4", "Qh4#"], cursor: null, onCursor, info: <p>Рейтингова партія</p>, status: "Ваш хід", controls: <button>Нічия</button> };
  const mounted = render(<GamePanel {...props}/>);
  expect(screen.queryByRole("button", { name: "Аналіз партії" })).not.toBeInTheDocument();
  expect(engine.analyze).not.toHaveBeenCalled();
  const final = result();
  mounted.rerender(<GamePanel {...props} result={final}/>);
  const analyze = await screen.findByRole("button", { name: "Аналіз партії" });
  expect(screen.getByRole("tab", { name: "Огляд" })).toHaveAttribute("aria-selected", "true");
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  let signal: AbortSignal | undefined;
  engine.analyze.mockImplementation((_f, _d, _o, _t, options: AnalyzeOptions) => new Promise((_resolve, reject) => {
    signal = options.signal; signal?.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError")), { once: true });
  }));
  fireEvent.click(analyze);
  await waitFor(() => expect(engine.analyze).toHaveBeenCalledOnce());
  expect(screen.getByRole("progressbar")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Ходи" }), { button: 0, ctrlKey: false });
  fireEvent.click(await screen.findByRole("button", { name: "Попередній хід" }));
  expect(onCursor).toHaveBeenCalledWith(2);
  fireEvent.click(screen.getByRole("button", { name: "Зупинити аналіз" }));
  expect(signal?.aborted).toBe(true);
  resolveEngine();
  fireEvent.click(screen.getByRole("button", { name: "Аналіз партії" }));
  const full = await screen.findByRole("button", { name: "Повний аналіз" });
  expect(screen.getByRole("table")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Грубі помилки, білі: 1" }));
  expect(onCursor).toHaveBeenLastCalledWith(2);
  fireEvent.click(full); expect(final.onFullAnalysis).toHaveBeenCalledOnce();
});
