import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatReviewScore, REVIEW_CONFIG, REVIEW_LABELS, type ReviewReport, type ReviewedMove } from "@/features/game-room/review/model";
import type { MoveClassification } from "./scoring";

export function ReviewPanel({ report, running, completed, total, error, hasMoves, selectedMove, onStart, onCancel, onCategory, onSelect, onBest }: {
  report: ReviewReport | null; running: boolean; completed: number; total: number; error: string | null; hasMoves: boolean; selectedMove: ReviewedMove | null;
  onStart: (force?: boolean) => void; onCancel: () => void; onCategory: (category: MoveClassification) => void; onSelect: (index: number) => void; onBest: (move: ReviewedMove) => void;
}) {
  const critical = report?.moves.filter(move => ["inaccuracy", "mistake", "blunder"].includes(move.classification)) || [];
  return <div className="analysis-review">
    {running ? <div className="analysis-review-progress" role="status"><strong>Аналіз триває</strong><p>{completed} / {total} півходів</p><Progress value={total ? completed / total * 100 : 0} /><Button variant="outline" onClick={onCancel}>Зупинити аналіз</Button></div> : <Button className="w-full" disabled={!hasMoves} onClick={() => onStart(!!report)}>{report ? "Проаналізувати заново" : "Проаналізувати всю партію"}</Button>}
    {error && <p className="analysis-error" role="alert">{error}</p>}
    {!report ? <div className="analysis-review-empty"><h2>Знайдіть ключовий момент</h2><p>{hasMoves ? "Запустіть огляд, щоб побачити помилки, кращі ходи та графік оцінки." : "Імпортуйте партію для повного огляду. Окрему позицію можна досліджувати у вкладці «Движок»."}</p></div> : <>
      <div className="analysis-quality"><h2>Якість ходів</h2><div><span>Середня втрата, сантипішаки</span><strong>{report.sides.w.averageLoss ?? "—"} / {report.sides.b.averageLoss ?? "—"}</strong></div><p>Білі / чорні. Менше — краще. Матові оцінки не входять у середнє.</p></div>
      <table className="analysis-summary"><caption className="sr-only">Класифікація ходів за сторонами</caption><thead><tr><th>Ходи</th><th>Білі</th><th>Чорні</th></tr></thead><tbody>{Object.entries(REVIEW_LABELS).map(([category, label]) => <tr key={category}><td><button onClick={() => onCategory(category as MoveClassification)} disabled={!report.sides.w.counts[category as MoveClassification] && !report.sides.b.counts[category as MoveClassification]}>{label}</button></td><td>{report.sides.w.counts[category as MoveClassification]}</td><td>{report.sides.b.counts[category as MoveClassification]}</td></tr>)}</tbody></table>
      {selectedMove && <div className="analysis-move-detail"><h3>{selectedMove.moveNumber}{selectedMove.color === "w" ? "." : "..."}{selectedMove.san}</h3><p>{formatReviewScore(selectedMove.before)} → {formatReviewScore(selectedMove.after)}</p>{selectedMove.bestMoveSan && <Button size="sm" variant="outline" onClick={() => onBest(selectedMove)}>Кращий хід: {selectedMove.bestMoveSan}</Button>}</div>}
      <div className="analysis-key-moments"><h3>Ключові моменти</h3>{critical.length ? critical.map(move => <button type="button" key={move.index} onClick={() => onSelect(move.index)}><strong>{move.moveNumber}{move.color === "w" ? "." : "..."}{move.san}</strong><span>{formatReviewScore(move.before)} → {formatReviewScore(move.after)}</span></button>) : <p>За цими налаштуваннями суттєвих помилок не знайдено.</p>}</div>
      {report.opening && <p className="analysis-note">{report.opening.eco} · {report.opening.name}</p>}
      <details className="analysis-method"><summary>Як оцінюються ходи</summary><p>{REVIEW_CONFIG.engine}. До {REVIEW_CONFIG.depth} півходів глибини, до 1,5 с на позицію. Найменша досягнута глибина: {report.minDepth ?? "—"}.</p><p>Найкращий хід збігається з першим вибором рушія. Втрата до 18 сантипішаків — відмінний; менше 45 — добрий; від 45 — неточність; від 120 — помилка; від 260 — груба помилка. Оцінки завжди наведено з боку білих. Втрата або допущення форсованого мату оцінюється окремо. Це власні пороги сайту; відсоток точності не розраховується.</p></details>
    </>}
  </div>;
}
