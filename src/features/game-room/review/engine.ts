import { Chess } from "chess.js";
import analyzeFenWithStockfish, { releaseIdleStockfishWorker } from "@/lib/stockfish";
import { buildReview, isReviewSample, parseReviewGame, REVIEW_CONFIG, terminalSample, type ReviewSample } from "./model";

export async function analyzeGame(pgn: string, signal: AbortSignal, onProgress: (completed: number, total: number) => void) {
  const { moves, startFen } = parseReviewGame(pgn);
  if (!moves.length) throw new Error("У партії ще немає ходів для аналізу.");
  const walk = new Chess(startFen);
  const samples: ReviewSample[] = [];
  try {
    onProgress(0, moves.length);
    for (let index = 0; index <= moves.length; index++) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      let sample = terminalSample(walk);
      if (!sample) {
        const evaluation = await analyzeFenWithStockfish(walk.fen(), REVIEW_CONFIG.depth, undefined, 8000, {
          workerOnly: true, signal, movetime: REVIEW_CONFIG.movetime,
        });
        if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
        sample = { score: { cp: evaluation.scoreMate == null ? evaluation.scoreCp : null, mate: evaluation.scoreMate }, bestMove: evaluation.bestmove, depth: evaluation.depth ?? null };
        if (!isReviewSample(sample)) throw new Error("Рушій не повернув оцінку позиції. Спробуйте ще раз.");
      }
      samples.push(sample);
      onProgress(index, moves.length);
      if (index < moves.length) walk.move(moves[index]);
    }
    return buildReview(pgn, samples);
  } finally { releaseIdleStockfishWorker(); }
}
