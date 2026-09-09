import { Chess, type Move } from "chess.js";
import { classificationFromLoss, type MoveClassification } from "@/features/analysis/scoring";
import { getOpeningByMoves } from "@/lib/openings-data";
import type { Color } from "../types";

export const REVIEW_CONFIG = {
  version: "stockfish-2019-08-15/review-3/depth14/time1500",
  engine: "Stockfish · 2019-08-15",
  depth: 14,
  movetime: 1500,
} as const;
export type ReviewScore = { cp: number | null; mate: number | null; winner?: Color };
export type ReviewSample = { score: ReviewScore; bestMove: string | null; depth: number | null };
export type ReviewedMove = {
  index: number;
  color: Color;
  san: string;
  moveNumber: number;
  classification: MoveClassification;
  loss: number;
  cpLoss: number | null;
  bestMoveSan: string | null;
  before: ReviewScore;
  after: ReviewScore;
};
export type ReviewReport = {
  version: string;
  createdAt: number;
  samples: ReviewSample[];
  moves: ReviewedMove[];
  opening: { name: string; eco: string } | null;
  sides: Record<Color, { counts: Record<MoveClassification, number>; averageLoss: number | null; cpMoves: number }>;
  keyMove: ReviewedMove | null;
  minDepth: number | null;
};
export const REVIEW_LABELS: Record<MoveClassification, string> = {
  best: "Найкращі", excellent: "Відмінні", good: "Добрі", inaccuracy: "Неточності", mistake: "Помилки", blunder: "Грубі помилки",
};
export const REVIEW_MARKS: Record<MoveClassification, string> = {
  best: "★", excellent: "✓", good: "", inaccuracy: "?!", mistake: "?", blunder: "??",
};

export function parseReviewGame(pgn: string) {
  const game = new Chess();
  game.loadPgn(pgn);
  const moves = game.history({ verbose: true });
  const startFen = game.getHeaders().FEN || new Chess().fen();
  // Metadata such as names and save status must not invalidate identical games.
  // Full identity is compared in cache, so no hash collision can return another game.
  const identity = `${REVIEW_CONFIG.version}\n${startFen}\n${moves.map(m => m.lan).join(" ")}`;
  return { game, moves, startFen, identity };
}

export function terminalSample(game: Chess): ReviewSample | null {
  if (game.isCheckmate()) {
    return { score: { cp: null, mate: 0, winner: game.turn() === "w" ? "b" : "w" }, bestMove: null, depth: null };
  }
  if (game.isDraw()) return { score: { cp: 0, mate: null }, bestMove: null, depth: null };
  return null;
}

function rank(score: ReviewScore) {
  if (score.mate != null) return (score.winner === "w" || (!score.winner && score.mate > 0)) ? 100000 : -100000;
  return Math.max(-99999, Math.min(99999, score.cp!));
}

export function gradeMove(move: Move, index: number, before: ReviewSample, after: ReviewSample): ReviewedMove {
  const best = before.bestMove === move.lan;
  const loss = best ? 0 : Math.max(0, (rank(before.score) - rank(after.score)) * (move.color === "w" ? 1 : -1));
  let bestMoveSan: string | null = null;
  if (before.bestMove) {
    try { bestMoveSan = new Chess(move.before).move(before.bestMove).san; } catch { /* Invalid PV is never shown. */ }
  }
  return {
    index, color: move.color, san: move.san, moveNumber: Number(move.before.split(" ")[5]),
    classification: classificationFromLoss(loss, best), loss,
    // Mate values are not centipawns. Exclude them from the average, rather than inventing a cp score.
    cpLoss: before.score.cp != null && after.score.cp != null ? loss : null,
    bestMoveSan, before: before.score, after: after.score,
  };
}

export function buildReview(pgn: string, samples: ReviewSample[], createdAt = Date.now()): ReviewReport {
  const parsed = parseReviewGame(pgn);
  if (samples.length !== parsed.moves.length + 1) throw new Error("Аналіз партії ще не завершений.");
  const moves = parsed.moves.map((move, index) => gradeMove(move, index, samples[index], samples[index + 1]));
  const side = (color: Color) => {
    const own = moves.filter(move => move.color === color);
    const cp = own.filter(move => move.cpLoss != null);
    const counts: Record<MoveClassification, number> = { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    own.forEach(move => counts[move.classification]++);
    return { counts, averageLoss: cp.length ? Math.round(cp.reduce((sum, move) => sum + move.cpLoss!, 0) / cp.length) : null, cpMoves: cp.length };
  };
  const opening = parsed.startFen === new Chess().fen() ? getOpeningByMoves(parsed.moves.map(move => move.san)) : null;
  const keyMove = moves.filter(move => ["inaccuracy", "mistake", "blunder"].includes(move.classification)).sort((a, b) => b.loss - a.loss)[0] || null;
  const depths = samples.map(sample => sample.depth).filter((depth): depth is number => depth != null);
  return { version: REVIEW_CONFIG.version, createdAt, samples, moves, opening: opening ? { name: opening.name, eco: opening.eco } : null, sides: { w: side("w"), b: side("b") }, keyMove, minDepth: depths.length ? Math.min(...depths) : null };
}

export function formatReviewScore(score: ReviewScore) {
  if (score.mate === 0) return score.winner === "w" ? "Мат за білих" : "Мат за чорних";
  if (score.mate != null) return `${score.mate > 0 ? "+" : "−"}M${Math.abs(score.mate)}`;
  return `${score.cp! > 0 ? "+" : ""}${(score.cp! / 100).toFixed(2)}`;
}

export function isReviewSample(value: unknown): value is ReviewSample {
  if (!value || typeof value !== "object") return false;
  const sample = value as ReviewSample;
  const score = sample.score;
  return !!score && ((Number.isFinite(score.cp) && score.mate === null) ||
    (score.cp === null && Number.isFinite(score.mate) && (score.mate !== 0 || score.winner === "w" || score.winner === "b"))) &&
    (sample.bestMove === null || typeof sample.bestMove === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(sample.bestMove)) &&
    (sample.depth === null || Number.isFinite(sample.depth));
}
