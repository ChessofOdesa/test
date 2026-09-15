import { trainingAccepted } from './trainingModel';
import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCp, getRecordNode, uciPvToSan, type AnalysisRecord, type EngineSummary } from './model';
import { nextAnalysisPath } from './navigation';
import { buildSanLinePreview } from './preview';
export type PositionAnalyzer = (fen: string, depth: number, multiPv: number, signal: AbortSignal) => Promise<EngineSummary>;
const cancelled = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

export function MistakeTraining({ record, analyze, onClose }: { record: AnalysisRecord; analyze: PositionAnalyzer; onClose: () => void }) {
  const errors = record.mainline.filter(node => ['inaccuracy', 'mistake', 'blunder'].includes(node.classification || ''));
  const [index, setIndex] = useState(0); const [feedback, setFeedback] = useState(''); const [busy, setBusy] = useState(false); const [solved, setSolved] = useState(false); const [revealed, setRevealed] = useState(false); const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<EngineSummary | null>(null);
  const controller = useRef<AbortController | null>(null); const node = errors[index];
  useEffect(() => () => controller.current?.abort(), []);
  const check = async (uci?: string) => {
    if (!node || busy || solved) return;
    const request = new AbortController(); controller.current?.abort(); controller.current = request; setBusy(true); setFeedback('Stockfish перевіряє…');
    try {
      const before = await analyze(node.fenBefore, 12, 3, request.signal);
      if (!before.bestMoveUci || !before.bestMoveSan) throw new Error('Рушій не повернув надійного продовження.');
      if (!uci) { if (!request.signal.aborted) { setAnswer(before); setRevealed(true); setFeedback(`Stockfish: ${before.bestMoveSan}`); } return; }
      const game = new Chess(node.fenBefore); const move = game.move(uci);
      const after = move.lan === before.bestMoveUci ? null : await analyze(game.fen(), 12, 1, request.signal);
      if (request.signal.aborted) return;
      if (trainingAccepted(before, after, move.lan, node.color)) { setSolved(true); setAnswer(before); setScore(value => value + (revealed ? 0 : 1)); setFeedback(revealed ? 'Правильне продовження після підказки.' : 'Знайдено сильне продовження!'); }
      else setFeedback(`${move.san}: є сильніше продовження. Спробуйте ще раз.`);
    } catch (e) { if (!request.signal.aborted && !cancelled(e)) setFeedback('Не вдалося перевірити хід. Спробуйте повторно.'); }
    finally { if (controller.current === request && !request.signal.aborted) setBusy(false); }
  };
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog"><DialogHeader><DialogTitle>Тренування на помилках</DialogTitle><DialogDescription>Знайдіть сильніше продовження перед помилкою. Відповідь перевіряє Stockfish.</DialogDescription></DialogHeader>
    {node ? <><div className="analysis-section-heading"><strong>Позиція {index + 1} / {errors.length} · {node.color === 'w' ? 'хід білих' : 'хід чорних'}</strong><span>Без підказки: {score}</span></div>
      <div className="analysis-practice-board"><ChessBoard initialFen={node.fenBefore} displayFen={node.fenBefore} size={Math.min(440, typeof window === 'undefined' ? 440 : window.innerWidth - 64)} flipped={node.color === 'b'} interactive={!busy && !solved} optimistic={false} allowArrows={false} onMove={(from, to, promotion) => { void check(`${from}${to}${promotion || ''}`); return false; }} /></div>
      <p role="status">{feedback || 'Зробіть свій хід на дошці.'}</p>{answer && (solved || revealed) && <p>Лінія Stockfish: {answer.pvSan.slice(0, 6).join(' ')}</p>}
      <div className="analysis-inline-actions"><Button variant="outline" disabled={busy || solved} onClick={() => void check()}>Показати відповідь</Button><Button disabled={busy || index >= errors.length - 1} onClick={() => { controller.current?.abort(); setIndex(value => value + 1); setFeedback(''); setSolved(false); setRevealed(false); setAnswer(null); }}>Наступна позиція</Button>{index === errors.length - 1 && solved && <Button onClick={onClose}>Завершити</Button>}</div>
    </> : <p>Спершу запустіть огляд партії. Тут з’являться позиції перед неточностями та помилками.</p>}
  </DialogContent></Dialog>;
}

export function CompareLines({ record, analyze, onClose }: { record: AnalysisRecord; analyze: PositionAnalyzer; onClose: () => void }) {
  const node = getRecordNode(record, record.currentPath);
  const baseFen = node?.fenBefore || record.rootFen;
  const [step, setStep] = useState(0); const [best, setBest] = useState<EngineSummary | null>(null); const [evaluations, setEvaluations] = useState<[EngineSummary, EngineSummary] | null>(null); const [error, setError] = useState('');
  const played: string[] = []; let path = record.currentPath || (record.mainline.length ? [0] : null);
  for (let count = 0; path && count < 10; count++) { const current = getRecordNode(record, path); if (!current) break; played.push(current.san); path = nextAnalysisPath(record, path); }
  const playedPreview = buildSanLinePreview(baseFen, played, 10);
  const bestPreview = best ? buildSanLinePreview(baseFen, best.pvSan.length ? best.pvSan : uciPvToSan(baseFen, best.bestMoveUci ? [best.bestMoveUci] : []), 10) : null;
  const frames = [playedPreview, bestPreview].map(preview => step === 0 || !preview ? baseFen : preview.fens[Math.min(step, preview.fens.length) - 1]);
  const max = Math.max(playedPreview?.fens.length || 0, bestPreview?.fens.length || 0);
  useEffect(() => { const controller = new AbortController(); void analyze(baseFen, 12, 1, controller.signal).then(value => { if (!controller.signal.aborted) setBest(value); }).catch(e => { if (!controller.signal.aborted && !cancelled(e)) setError('Не вдалося обчислити рекомендацію.'); }); return () => controller.abort(); }, [baseFen, analyze]);
  const left = frames[0], right = frames[1];
  useEffect(() => { if (!best) return; const controller = new AbortController(); setEvaluations(null); setError(''); void (async () => { const a = await analyze(left, 12, 1, controller.signal); const b = await analyze(right, 12, 1, controller.signal); if (!controller.signal.aborted) setEvaluations([a, b]); })().catch(e => { if (!controller.signal.aborted && !cancelled(e)) setError('Оцінки тимчасово недоступні.'); }); return () => controller.abort(); }, [left, right, best, analyze]);
  return <Dialog open onOpenChange={open => !open && onClose()}><DialogContent className="analysis-workspace-dialog analysis-comparison-dialog"><DialogHeader><DialogTitle>Порівняння продовжень</DialogTitle><DialogDescription>Обидві лінії починаються перед вибраним ходом. Оцінки наведені з боку білих.</DialogDescription></DialogHeader>
    <div className="analysis-comparison-grid">{frames.map((fen, i) => <section key={i}><h3>{i ? 'Stockfish' : 'Зіграна лінія'} · {evaluations ? evaluations[i].scoreMate != null ? `M${evaluations[i].scoreMate}` : formatCp(evaluations[i].numericScore) : '…'}</h3><ChessBoard initialFen={baseFen} displayFen={fen} size={Math.min(330, window.innerWidth - 80)} interactive={false} /><p>{(i ? bestPreview : playedPreview)?.moves.slice(0, step).join(' ') || 'Початкова позиція'}</p>{step > ((i ? bestPreview : playedPreview)?.fens.length || 0) && <small>Лінія завершилася; показано її останню позицію.</small>}</section>)}</div>
    {error && <p role="alert">{error}</p>}<div className="analysis-inline-actions"><Button variant="outline" disabled={step === 0} onClick={() => setStep(value => value - 1)}>Назад</Button><span>Півхід {step} / {max}</span><Button disabled={!best || step >= max} onClick={() => setStep(value => value + 1)}>Далі</Button></div>
  </DialogContent></Dialog>;
}
