import { useCallback, useEffect, useRef, useState } from "react";
import { readReview, saveReview } from "./cache";
import type { ReviewReport } from "./model";

type State = { status: "idle" | "running" | "done" | "cancelled" | "error"; report: ReviewReport | null; completed: number; total: number; error: string | null; cached: boolean };
function initial(pgn: string): State {
  const report = readReview(pgn);
  return { status: report ? "done" : "idle", report, completed: 0, total: 0, error: null, cached: !!report };
}

// This hook lives only in the lazily mounted, finished-game panel.
export function useGameReview(pgn: string) {
  const [state, setState] = useState<State>(() => initial(pgn));
  const job = useRef<AbortController | null>(null);
  useEffect(() => {
    setState(initial(pgn));
    return () => { job.current?.abort(); job.current = null; };
  }, [pgn]);
  const start = useCallback(async () => {
    if (job.current) return;
    const cached = readReview(pgn);
    if (cached) { setState({ ...initial(pgn), report: cached }); return; }
    const controller = new AbortController();
    job.current = controller;
    setState({ status: "running", report: null, completed: 0, total: 0, error: null, cached: false });
    try {
      const { analyzeGame } = await import("./engine");
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      const report = await analyzeGame(pgn, controller.signal, (completed, total) => {
        if (!controller.signal.aborted) setState(current => ({ ...current, completed, total }));
      });
      if (controller.signal.aborted) return;
      saveReview(pgn, report);
      setState({ status: "done", report, completed: report.moves.length, total: report.moves.length, error: null, cached: false });
    } catch (error) {
      if (!controller.signal.aborted) setState(current => ({ ...current, status: "error", error: error instanceof Error && /[А-Яа-яІіЇїЄє]/.test(error.message) ? error.message : "Не вдалося проаналізувати партію. Спробуйте ще раз." }));
    } finally { if (job.current === controller) job.current = null; }
  }, [pgn]);
  const cancel = () => { job.current?.abort(); job.current = null; setState(current => ({ ...current, status: "cancelled" })); };
  return { ...state, start, cancel };
}
