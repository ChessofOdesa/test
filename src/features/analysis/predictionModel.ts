import { Chess } from 'chess.js';
import type { AnalysisRecord, PositionPrediction } from './model';
export function makePrediction(fen: string, moveText: string, estimate: string, plan: string): PositionPrediction {
  if (!moveText.trim()) throw new Error('Вкажіть свій хід.');
  const value = estimate.trim().replace(',', '.');
  if (!/^[+-]?\d{1,3}(\.\d{1,2})?$/.test(value) || Math.abs(Number(value)) > 100) throw new Error('Оцінка має бути числом від −100 до +100.');
  const game = new Chess(fen);
  let move;
  try { move = game.move(moveText.trim()); } catch { throw new Error('Цей хід неможливий у вибраній позиції. Використайте SAN або e2e4.'); }
  if (!plan.trim()) throw new Error('Коротко запишіть свій план.');
  if (plan.length > 2000) throw new Error('План має містити до 2000 символів.');
  return { fen, moveUci: move.lan, moveSan: move.san, estimatedCp: Math.round(Number(value) * 100), plan: plan.trim(), createdAt: new Date().toISOString() };
}
export function savePrediction(record: AnalysisRecord, prediction: PositionPrediction): AnalysisRecord {
  return { ...record, predictions: [...(record.predictions || []).filter(item => item.fen !== prediction.fen), prediction].slice(-200) };
}
export function readPredictions(input: unknown): PositionPrediction[] {
  if (!Array.isArray(input)) return [];
  return input.slice(-200).flatMap(item => {
    try {
      if (!item || typeof item.fen !== 'string' || typeof item.moveUci !== 'string' || typeof item.plan !== 'string' || !Number.isFinite(item.estimatedCp)) return [];
      const valid = makePrediction(item.fen, item.moveUci, String(item.estimatedCp / 100), item.plan);
      return [{ ...valid, createdAt: typeof item.createdAt === 'string' ? item.createdAt.slice(0, 40) : valid.createdAt }];
    } catch { return []; }
  });
}
