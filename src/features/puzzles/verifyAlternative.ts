import { Chess } from 'chess.js';
import { analyzeFenWithStockfish, type AnalyzeResult } from '@/lib/stockfish';
import { applySolutionMove, playPuzzleMove } from './model';
import { attemptFen, type Attempt } from './training';

function equivalent(reference: AnalyzeResult, candidate: AnalyzeResult, sign: number) {
    if ((reference.depth || 0) < 14 || (candidate.depth || 0) < 14) throw new Error('Недостатня глибина перевірки');
    if (reference.scoreMate != null || candidate.scoreMate != null) {
        if (candidate.scoreMate != null && candidate.scoreMate * sign > 0) return true;
        if (reference.scoreMate != null && reference.scoreMate * sign > 0) return false;
        if (candidate.scoreMate != null && candidate.scoreMate * sign < 0 && reference.scoreMate == null) return false;
        throw new Error('Оцінка потребує глибшої перевірки');
    }
    if (!Number.isFinite(reference.scoreCp) || !Number.isFinite(candidate.scoreCp)) throw new Error('Немає оцінки');
    return (reference.scoreCp! - candidate.scoreCp!) * sign <= 30;
}

/** Only unmatched legal moves need a bounded engine search; never penalize failed searches. */
export async function verifyAlternative(attempt: Attempt, uci: string, signal: AbortSignal) {
    const fen = attemptFen(attempt), line = attempt.line || attempt.puzzle.solution;
    const reference = new Chess(fen), candidate = new Chess(fen), sign = reference.turn() === 'w' ? 1 : -1;
    applySolutionMove(reference, line[attempt.step]);
    applySolutionMove(candidate, uci);
    // An immediate mate is already handled synchronously by playPuzzleMove.
    if (reference.isCheckmate()) return null;
    if (candidate.isGameOver()) throw new Error('Кінцева позиція потребує окремої перевірки');
    const options = { signal, workerOnly: true, movetime: 2500, timeoutMs: 12000 };
    const before = await analyzeFenWithStockfish(reference.fen(), 18, undefined, 12000, options);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const after = await analyzeFenWithStockfish(candidate.fen(), 18, undefined, 12000, options);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (!equivalent(before, after, sign)) return null;
    const remaining = line.length - attempt.step - 1;
    const continuation: string[] = [];
    for (const move of after.pv.slice(0, remaining)) {
        applySolutionMove(candidate, move);
        continuation.push(move);
        if (candidate.isGameOver()) break;
    }
    if (candidate.isGameOver() && (!candidate.isCheckmate() || candidate.turn() === (sign === 1 ? 'w' : 'b'))) throw new Error('Варіант не підтверджено');
    if (continuation.length < remaining && !candidate.isCheckmate()) throw new Error('Недостатньо ходів у варіанті');
    const verifiedLine = [...line.slice(0, attempt.step), uci, ...continuation];
    return playPuzzleMove(fen, verifiedLine, attempt.step, uci.slice(0, 2), uci.slice(2, 4), uci[4]);
}
