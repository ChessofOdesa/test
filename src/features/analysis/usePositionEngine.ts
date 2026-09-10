import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import analyze, { releaseIdleStockfishWorker, retryStockfishWorker, type AnalyzeResult } from "@/lib/stockfish";
import { terminalSample, type ReviewScore } from "@/features/game-room/review/model";

export const ENGINE_LEVELS = {
  quick: { label: "Швидко", depth: 12, movetime: 700 },
  standard: { label: "Стандарт", depth: 16, movetime: 2000 },
  deep: { label: "Глибоко", depth: 20, movetime: 5000 },
} as const;
export type EngineLevel = keyof typeof ENGINE_LEVELS;
type State = { fen: string; result: AnalyzeResult | null; terminal: ReviewScore | null; busy: boolean; error: string | null; depth: number | null };

export function usePositionEngine(fen: string, enabled: boolean, paused: boolean, multiPv: number, level: EngineLevel) {
  const [state, setState] = useState<State>({ fen, result: null, terminal: null, busy: false, error: null, depth: null });
  const [retry, setRetry] = useState(0);
  const cache = useRef(new Map<string, AnalyzeResult>());
  useEffect(() => {
    if (!enabled || paused) {
      setState({ fen, result: null, terminal: null, busy: false, error: null, depth: null });
      releaseIdleStockfishWorker();
      return;
    }
    const terminal = terminalSample(new Chess(fen));
    if (terminal) { setState({ fen, terminal: terminal.score, result: null, busy: false, error: null, depth: null }); return; }
    const key = `${fen}:${multiPv}:${level}`;
    const cached = cache.current.get(key);
    if (cached) { setState({ fen, result: cached, terminal: null, busy: false, error: null, depth: cached.depth ?? null }); return; }
    const controller = new AbortController();
    setState({ fen, result: null, terminal: null, busy: true, error: null, depth: null });
    // Navigation settles before allocating a worker. Cancellation terminates the
    // active job; old results can never be attached to a newly selected position.
    let lastUpdate = 0;
    const timer = window.setTimeout(async () => {
      try {
        const options = ENGINE_LEVELS[level];
        const result = await analyze(fen, options.depth, line => {
          const depth = line.match(/\bdepth (\d+)/);
          if (depth && !controller.signal.aborted && Date.now() - lastUpdate > 180) {
            lastUpdate = Date.now(); setState(current => ({ ...current, depth: Number(depth[1]) }));
          }
        }, 10000, { workerOnly: true, signal: controller.signal, multiPv, movetime: options.movetime });
        if (controller.signal.aborted) return;
        if (result.scoreCp == null && result.scoreMate == null) throw new Error("No evaluation");
        if (cache.current.size >= 100) cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(key, result);
        setState({ fen, result, terminal: null, busy: false, error: null, depth: result.depth ?? null });
      } catch {
        if (!controller.signal.aborted) setState({ fen, result: null, terminal: null, busy: false, depth: null, error: "Не вдалося запустити Stockfish. Дошка та PGN залишаються доступними." });
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); releaseIdleStockfishWorker(); };
  }, [fen, enabled, paused, multiPv, level, retry]);
  return { ...state, result: state.fen === fen && enabled && !paused ? state.result : null,
    terminal: state.fen === fen && enabled && !paused ? state.terminal : null,
    retry: () => { retryStockfishWorker(); setRetry(value => value + 1); } };
}
