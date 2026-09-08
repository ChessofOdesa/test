import analyzeFenWithStockfish from "@/lib/stockfish";
import { Chess } from "chess.js";
export function localComputerMove(fen: string, level: number, signal: AbortSignal) {
    return new Promise<string>((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException("Cancelled", "AbortError"));
            return;
        }
        const worker = new Worker(new URL("./move-worker.ts", import.meta.url), { type: "module" });
        const stop = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); worker.terminate(); };
        const abort = () => { stop(); reject(new DOMException("Cancelled", "AbortError")); };
        const timer = window.setTimeout(() => { stop(); reject(new Error("Комп’ютер не встиг обрати хід.")); }, 6000);
        signal.addEventListener("abort", abort, { once: true });
        worker.onmessage = event => { stop(); if (typeof event.data.move === "string")
            resolve(event.data.move);
        else
            reject(new Error(event.data.error || "Немає відповіді комп’ютера.")); };
        worker.onerror = () => { stop(); reject(new Error("Не вдалося запустити локальний рушій.")); };
        worker.postMessage({ fen, level });
    });
}
export async function computerMove(fen: string, level: number, signal: AbortSignal) {
    const weakMoveChance = [0.8, 0.55, 0.3, 0.12, 0.06, 0.02, 0][level - 1] || 0;
    const depth = Math.min(window.innerWidth < 640 ? 6 : 8, level + 2);
    try {
        const result = await analyzeFenWithStockfish(fen, depth, undefined, 8000, { signal, workerOnly: true, movetime: level < 4 ? 450 : 1200 });
        if (signal.aborted)
            throw new DOMException("Cancelled", "AbortError");
        const move = Math.random() < weakMoveChance ? await localComputerMove(fen, Math.min(level, 4), signal) : result.bestmove;
        if (!move)
            throw new Error("Рушій не повернув хід.");
        new Chess(fen).move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] || "q" });
        return { move, backend: "Stockfish" };
    }
    catch (error) {
        if (signal.aborted)
            throw error;
        return { move: await localComputerMove(fen, Math.min(level, 4), signal), backend: "Локальний рушій" };
    }
}
