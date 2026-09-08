import { useCallback, useEffect, useRef, useState } from "react";
import analyzeFenWithStockfish from "@/lib/stockfish";
export function useTrainingHints(fen: string, enabled: boolean, evaluate: boolean) {
    const [hint, setHint] = useState<{
        fen: string;
        from: string;
        to: string;
        stage: number;
    } | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [evaluation, setEvaluation] = useState<string | null>(null);
    const job = useRef<AbortController | null>(null);
    useEffect(() => { job.current?.abort(); setHint(null); setBusy(false); setError(null); return () => job.current?.abort(); }, [fen, enabled]);
    const request = useCallback(async () => {
        if (!enabled || busy)
            return;
        if (hint?.fen === fen) {
            setHint({ ...hint, stage: 2 });
            return;
        }
        job.current?.abort();
        const controller = new AbortController();
        job.current = controller;
        setBusy(true);
        setError(null);
        try {
            const result = await analyzeFenWithStockfish(fen, 6, undefined, 8000, { signal: controller.signal, workerOnly: true, movetime: 800 });
            if (!controller.signal.aborted && result.bestmove)
                setHint({ fen, from: result.bestmove.slice(0, 2), to: result.bestmove.slice(2, 4), stage: 1 });
        }
        catch {
            if (!controller.signal.aborted)
                setError("Підказка недоступна. Спробуйте ще раз.");
        }
        finally {
            if (!controller.signal.aborted)
                setBusy(false);
        }
    }, [enabled, busy, hint, fen]);
    useEffect(() => {
        setEvaluation(null);
        if (!evaluate || !enabled)
            return;
        const controller = new AbortController();
        void analyzeFenWithStockfish(fen, 6, undefined, 8000, { signal: controller.signal, workerOnly: true, movetime: 500 }).then(result => { if (controller.signal.aborted)
            return; if (result.scoreMate != null)
            setEvaluation(`M${result.scoreMate}`);
        else if (result.scoreCp != null)
            setEvaluation(`${result.scoreCp > 0 ? "+" : ""}${(result.scoreCp / 100).toFixed(1)}`); }).catch(() => { });
        return () => controller.abort();
    }, [fen, evaluate, enabled]);
    return { hint, busy, error, evaluation, request };
}
