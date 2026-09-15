import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCp, type EngineSummary, type PositionPrediction } from './model';
import { makePrediction } from './predictionModel';
import type { PositionAnalyzer } from './PracticeTools';
const score = (summary: EngineSummary) => summary.scoreMate != null ? 'M' + summary.scoreMate : formatCp(summary.numericScore);
export default function PredictionDialog({ fen, saved, analyze, onSave, onClose }: { fen: string; saved?: PositionPrediction; analyze: PositionAnalyzer; onSave: (value: PositionPrediction) => void; onClose: () => void }) {
  const [move, setMove] = useState(saved?.moveSan || '');
  const [estimate, setEstimate] = useState(saved ? String(saved.estimatedCp / 100) : '');
  const [plan, setPlan] = useState(saved?.plan || '');
  const [submitted, setSubmitted] = useState<PositionPrediction | null>(null);
  const [result, setResult] = useState<{ before: EngineSummary; after: EngineSummary } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const compare = async () => {
    if (request.current) return;
    let prediction: PositionPrediction;
    try { prediction = submitted || makePrediction(fen, move, estimate, plan); } catch (e) { setError((e as Error).message); return; }
    onSave(prediction); setSubmitted(prediction); setError(''); setBusy(true);
    const controller = new AbortController(); request.current = controller;
    try {
      const before = await analyze(fen, 12, 3, controller.signal);
      if (controller.signal.aborted) return;
      if (!before.bestMoveUci || before.scoreCp == null && before.scoreMate == null) throw new Error();
      const game = new Chess(fen); game.move(prediction.moveUci);
      const after = await analyze(game.fen(), 12, 1, controller.signal);
      if (after.scoreCp == null && after.scoreMate == null) throw new Error();
      if (!controller.signal.aborted) setResult({ before, after });
    } catch { if (!controller.signal.aborted) setError('Stockfish недоступний. Прогноз збережено; спробуйте перевірити ще раз.'); }
    finally { if (request.current === controller) request.current = null; if (!controller.signal.aborted) setBusy(false); }
  };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog analysis-forecast-dialog">
    <DialogHeader><DialogTitle>Мій прогноз</DialogTitle><DialogDescription>Запишіть хід, оцінку поточної позиції та план. Оцінка з боку білих: плюс — перевага білих. У цьому вікні підказки приховані до порівняння.</DialogDescription></DialogHeader>
    <div className="analysis-practice-board"><ChessBoard displayFen={fen} initialFen={fen} size={Math.min(340, window.innerWidth - 72)} interactive={!submitted} optimistic={false} allowArrows={false} onMove={(from, to, promotion) => { try { setMove(new Chess(fen).move(from + to + (promotion || '')).san); } catch { setError('Оберіть легальний хід.'); } return false; }} /></div>
    <form onSubmit={event => { event.preventDefault(); void compare(); }}>
      <fieldset disabled={Boolean(submitted)} className="analysis-form-grid">
        <label>Мій хід<input value={move} onChange={e => setMove(e.target.value)} placeholder="Nf3 або g1f3" /></label>
        <label>Моя оцінка, пішаки<input value={estimate} onChange={e => setEstimate(e.target.value)} inputMode="decimal" placeholder="+0.50" /></label>
        <label className="analysis-span-all">Мій план<textarea value={plan} maxLength={2000} onChange={e => setPlan(e.target.value)} placeholder="Загроза, відповідь суперника та наступна ціль" /></label>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {!result && <Button type="submit" disabled={busy} className="mt-3">{busy ? 'Stockfish перевіряє…' : submitted ? 'Повторити перевірку' : 'Порівняти зі Stockfish'}</Button>}
    </form>
    {result && submitted && <section className="analysis-prediction-result" aria-label="Порівняння прогнозу">
      <p>Ваш хід: <strong>{submitted.moveSan}</strong> · Stockfish: <strong>{result.before.bestMoveSan}</strong></p>
      <p>Ваша оцінка: {formatCp(submitted.estimatedCp)} · Stockfish до ходу: {score(result.before)} · після вашого ходу: {score(result.after)}</p>
      {result.before.scoreMate == null && <p>Різниця оцінок: {formatCp(Math.abs(submitted.estimatedCp - result.before.numericScore))} пішака.</p>}
      <p>Ваш план: {submitted.plan}</p><p>Лінія Stockfish: {result.before.pvSan.join(' ')}</p>
      <small>План збережено для вашого порівняння. Рушій оцінює ходи й позиції, а не текст плану. Пошук обмежений часом.</small>
      <Button variant="outline" onClick={() => { setSubmitted(null); setResult(null); setError(''); }}>Переглянути свій прогноз</Button>
    </section>}
  </DialogContent></Dialog>;
}
