import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Power, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { attemptFen, type Attempt } from './training';
import { framesForLine, reviewPuzzle, type PuzzleFrame, type PuzzleReviewResult } from './review';
export function PuzzleReview({ attempt, rating, onPreview, actions, blocked = false }: { attempt: Attempt; rating?: number; onPreview: (frame: PuzzleFrame | null) => void; actions?: ReactNode; blocked?: boolean }) {
    const [review, setReview] = useState<PuzzleReviewResult | null>(null), [error, setError] = useState('');
    const [busy, setBusy] = useState(false), [enabled, setEnabled] = useState(true), [settings, setSettings] = useState(false);
    const [depth, setDepth] = useState(18), [multiPv, setMultiPv] = useState(3);
    const [selected, setSelected] = useState<number | null>(null), [lineIndex, setLineIndex] = useState(0), [ply, setPly] = useState<number | null>(null);
    const controller = useRef<AbortController | null>(null);
    const load = useCallback(async (mistake: number | null) => {
        controller.current?.abort(); const task = new AbortController(); controller.current = task;
        setBusy(true); setError(''); setReview(null); setPly(null); setLineIndex(0); onPreview(null);
        try { const result = await reviewPuzzle(attempt, mistake, task.signal, { depth, multiPv }); if (!task.signal.aborted) setReview(result); }
        catch (error) {
            if (!task.signal.aborted) {
                const message = error instanceof Error ? error.message : '';
                const expected = ['Спочатку заверши задачу.', 'Хід не знайдено.', 'Недостатньо даних Stockfish. Спробуй повторити розбір.', 'Stockfish недоступний. Оновіть сторінку та повторіть аналіз.'];
                setError(expected.includes(message) ? message : 'Розбір недоступний. Спробуй повторити.');
            }
        }
        finally { if (!task.signal.aborted) setBusy(false); }
    }, [attempt, depth, multiPv, onPreview]);
    useEffect(() => { if (enabled) void load(selected); else { controller.current?.abort(); setBusy(false); } return () => controller.current?.abort(); }, [load, selected, enabled]);
    const line = review?.lines[lineIndex];
    const solution = framesForLine(attempt.puzzle.fen, attempt.line || attempt.puzzle.solution).slice(1).map(frame => frame.san);
    const ratingChange = attempt.ratingBefore !== undefined && rating !== undefined ? rating - attempt.ratingBefore : null;
    const mistakeCount = Math.max(Number(Boolean(attempt.wrong)), attempt.mistakes?.length || 0);
    const show = useCallback((row: number, next: number) => {
        const frame = review?.lines[row]?.frames[next];
        if (frame) { setLineIndex(row); setPly(next); onPreview(frame); }
    }, [review, onPreview]);
    const step = useCallback((direction: number) => {
        if (!line) return;
        const next = ply === null ? (direction > 0 ? 0 : line.frames.length - 1) : Math.max(0, Math.min(line.frames.length - 1, ply + direction));
        show(lineIndex, next);
    }, [line, lineIndex, ply, show]);
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if (blocked || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !line || document.querySelector('[role="dialog"]') || target?.closest('input,textarea,select,[contenteditable="true"],[role="slider"],[role="textbox"]')) return;
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
        };
        window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
    }, [blocked, line, step]);
    return <section className="puzzle-review" aria-label="Розбір задачі">
        <div className="puzzle-review-scroll">
        <div className="puzzle-review-summary">
            <div className={`puzzle-result-heading${attempt.wrong ? ' is-wrong' : attempt.assisted ? ' is-assisted' : ''}`}><Check size={21} aria-hidden="true" /><strong>{attempt.wrong ? 'Завершено з помилкою' : attempt.assisted ? 'Розв’язано з підказкою' : 'Розв’язано'}</strong></div>
            <p className="puzzle-review-meta">{mistakeCount} {mistakeCount === 1 ? 'помилка' : mistakeCount >= 2 && mistakeCount <= 4 ? 'помилки' : 'помилок'} · {attempt.assisted ? 'З підказкою' : 'Без підказки'}</p>
            <div className="puzzle-review-facts">
                {rating !== undefined && <div className="puzzle-player-rating"><span>Рейтинг гравця</span><strong>{attempt.ratingBefore !== undefined ? `${attempt.ratingBefore} → ${rating}` : rating}</strong>{ratingChange !== null && <small className={ratingChange < 0 ? 'is-negative' : ratingChange === 0 ? 'is-unchanged' : ''}>{ratingChange === 0 ? 'без змін' : `${ratingChange > 0 ? '+' : ''}${ratingChange}`}</small>}</div>}
                <div><span>Тема</span><strong>{attempt.puzzle.theme}</strong></div>
                <div><span>Рейтинг задачі</span><strong>{attempt.puzzle.rating}</strong></div>
            </div>
            <div className="puzzle-best-line"><span>Найкраще продовження</span><p>{solution.slice(0, 6).join('  ')}{solution.length > 6 ? ' …' : ''}</p></div>
        </div>
        <div className="puzzle-engine-panel">
            <header className={`puzzle-engine-header${busy ? ' is-loading' : ''}`}><Button variant="ghost" className="puzzle-power" title={enabled ? 'Вимкнути Stockfish' : 'Увімкнути Stockfish'} aria-label={enabled ? 'Вимкнути Stockfish' : 'Увімкнути Stockfish'} aria-pressed={enabled} onClick={() => setEnabled(!enabled)}><Power size={19} /></Button><div><h2>Stockfish</h2><small>{busy ? 'Розрахунок…' : !enabled ? 'На паузі' : review?.depth ? `Глибина ${review.depth} · варіантів ${review.lines.length}` : 'Розбір позиції'}</small></div><span className="puzzle-engine-score" title="Оцінка з боку білих">{line?.score || '—'}</span><Button variant="ghost" title="Налаштування Stockfish" aria-label="Налаштування Stockfish" aria-expanded={settings} onClick={() => setSettings(!settings)}><SlidersHorizontal size={19} /></Button></header>
            {settings && <div className="puzzle-engine-settings"><label>Глибина<select aria-label="Глибина Stockfish" value={depth} onChange={e => setDepth(Number(e.target.value))}>{[14,18,20].map(n => <option key={n}>{n}</option>)}</select></label><label>Варіанти<select aria-label="Кількість варіантів" value={multiPv} onChange={e => setMultiPv(Number(e.target.value))}>{[1,2,3].map(n => <option key={n}>{n}</option>)}</select></label></div>}
            {!!attempt.mistakes?.length && <div className="puzzle-review-mistakes"><span>Переглянути помилки</span><div className="puzzle-review-choices"><Button disabled={!enabled} variant={selected === null ? 'secondary' : 'ghost'} onClick={() => setSelected(null)}>Ідея задачі</Button>{attempt.mistakes.map((mistake, index) => <Button key={`${mistake.step}-${mistake.move}`} disabled={!enabled} variant={selected === index ? 'secondary' : 'ghost'} onClick={() => setSelected(index)}>Помилка {framesForLine(attemptFen({ ...attempt, step: mistake.step }), [mistake.move])[1].san}</Button>)}</div></div>}
            {busy && <p role="status">Stockfish готує розбір…</p>}
            {error && <div role="alert"><p>{error}</p><Button variant="outline" disabled={!enabled} onClick={() => void load(selected)}>Повторити розбір</Button></div>}
            {review?.lines.map((variant, row) => <div className="puzzle-engine-row" key={row} aria-label={`Варіант ${row + 1}`}><b aria-hidden="true">{row + 1}</b><span title="Оцінка з боку білих">{variant.score}</span><div className="puzzle-review-line" title={variant.frames.map(frame => frame.san).join(' ')}>{variant.frames.map((frame, index) => <button key={index} type="button" aria-pressed={row === lineIndex && ply === index} onClick={() => show(row, index)}>{frame.san}</button>)}</div></div>)}
        </div>
        <nav className="puzzle-review-nav" aria-label="Перегляд варіанта"><Button variant="outline" title="Попередній хід розбору" aria-label="Попередній хід розбору" disabled={!line || ply === 0} onClick={() => step(-1)}>←</Button><span aria-live="polite">{ply ?? '—'} / {line ? line.frames.length - 1 : '—'}</span><Button variant="outline" title="Наступний хід розбору" aria-label="Наступний хід розбору" disabled={!line || ply === line.frames.length - 1} onClick={() => step(1)}>→</Button><Button variant="ghost" disabled={ply === null} onClick={() => { setPly(null); onPreview(null); }}>До розв’язання</Button><small>Клавіші ← →</small></nav>
        </div>
        {actions}
    </section>;
}
