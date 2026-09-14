import type { EngineSummary } from './model';
export function trainingAccepted(before: EngineSummary, after: EngineSummary | null, played: string, color: 'w' | 'b') {
  if (played === before.bestMoveUci) return true;
  if (!after) return false;
  const sign = color === 'w' ? 1 : -1;
  if (before.scoreMate != null || after.scoreMate != null) return before.scoreMate != null && after.scoreMate != null && before.scoreMate * sign > 0 && after.scoreMate * sign > 0;
  return before.scoreCp != null && after.scoreCp != null && (before.numericScore - after.numericScore) * sign <= 30;
}

