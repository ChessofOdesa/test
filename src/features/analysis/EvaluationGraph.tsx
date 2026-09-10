import { useState } from "react";
import { formatReviewScore, type ReviewReport, type ReviewScore } from "@/features/game-room/review/model";

export function graphValue(score: ReviewScore) {
  if (score.mate != null) return score.winner === "w" || (!score.winner && score.mate > 0) ? 6 : -6;
  return Math.max(-6, Math.min(6, score.cp! / 100));
}
export function EvalBar({ score, flipped }: { score: ReviewScore | null; flipped: boolean }) {
  const white = score ? 50 + (graphValue(score) / 6) * 49 : 50;
  return <div className="analysis-eval" data-flipped={flipped} aria-label={score ? `Оцінка: ${formatReviewScore(score)}` : "Оцінки ще немає"}>
    <div className="analysis-eval-white" style={{ height: `${white}%` }} />
    <span>{score ? score.mate != null ? score.mate === 0 ? "#" : `M${Math.abs(score.mate)}` : `${score.cp! > 0 ? "+" : ""}${(score.cp! / 100).toFixed(1)}` : "—"}</span>
  </div>;
}
export function EvaluationGraph({ report, index, onSelect }: { report: ReviewReport | null; index: number; onSelect: (index: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!report) return <div className="analysis-graph-empty">Графік з’явиться після аналізу всієї партії.</div>;
  const width = 600, height = 100, pad = 12, count = report.samples.length;
  const x = (i: number) => pad + i / Math.max(1, count - 1) * (width - 2 * pad);
  const y = (score: ReviewScore) => height / 2 - graphValue(score) / 6 * (height / 2 - pad);
  const shown = hover ?? Math.max(0, index + 1);
  return <section className="analysis-graph" aria-label="Графік оцінки">
    <div className="analysis-graph-heading"><strong>Оцінка партії</strong><span>{shown ? `${report.moves[shown - 1].moveNumber}${report.moves[shown - 1].color === "w" ? "." : "..."}${report.moves[shown - 1].san}` : "Початкова позиція"} · {formatReviewScore(report.samples[shown].score)}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Оцінка Stockfish: вище нуля — перевага білих" onMouseLeave={() => setHover(null)}>
      <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="#d2dbe9" strokeDasharray="4 4" />
      <polyline points={report.samples.map((sample, i) => `${x(i)},${y(sample.score)}`).join(" ")} fill="none" stroke="#22458f" strokeWidth="2" />
      {report.moves.filter(move => move.classification === "mistake" || move.classification === "blunder").map(move => <circle key={move.index} cx={x(move.index + 1)} cy={y(move.after)} r="3" fill={move.classification === "blunder" ? "#b7394c" : "#a86218"} />)}
      {index >= -1 && <line x1={x(index + 1)} x2={x(index + 1)} y1="6" y2={height - 6} stroke="#22458f" strokeDasharray="3 3" />}
      {report.samples.map((sample, i) => <rect key={i} x={x(i) - (width - 2 * pad) / Math.max(1, count - 1) / 2} y="0" width={(width - 2 * pad) / Math.max(1, count - 1)} height={height} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => onSelect(i - 1)}><title>{i ? `Позиція після ${report.moves[i - 1].san}` : "Початкова позиція"}: {formatReviewScore(sample.score)}</title></rect>)}
    </svg>
    <input type="range" min="0" max={count - 1} value={Math.max(0, index + 1)} aria-label="Позиція на графіку" onChange={event => onSelect(Number(event.target.value) - 1)} />
  </section>;
}
