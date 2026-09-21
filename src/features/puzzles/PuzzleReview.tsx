import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { attemptFen, type Attempt } from './training';
import { framesForLine, reviewPuzzle, type PuzzleFrame, type PuzzleReviewResult } from './review';
export function PuzzleReview({ attempt, onPreview }: { attempt: Attempt; onPreview: (frame: PuzzleFrame | null) => void }) {
    const [review, setReview] = useState<PuzzleReviewResult | null>(null), [error, setError] = useState('');
    const [busy, setBusy] = useState(false), [selected, setSelected] = useState<number | null>(null), [ply, setPly] = useState<number | null>(null);
    const controller = useRef<AbortController | null>(null);
    const load = useCallback(async (mistake: number | null) => {
        controller.current?.abort(); const task = new AbortController(); controller.current = task;
        setSelected(mistake); setBusy(true); setError(''); setReview(null); setPly(null); onPreview(null);
        try { const result = await reviewPuzzle(attempt, mistake, task.signal); if (!task.signal.aborted) setReview(result); }
        catch (error) { if (!task.signal.aborted) setError(error instanceof Error ? error.message : 'Розбір недоступний.'); }
        finally { if (!task.signal.aborted) setBusy(false); }
    }, [attempt, onPreview]);
    useEffect(() => { void load(null); return () => { controller.current?.abort(); }; }, [load]);
    const show = (next: number) => { if (review) { setPly(next); onPreview(review.frames[next]); } };
    return <section className="puzzle-review" aria-label="Розбір задачі">
        <h3>Пояснення та помилки</h3>
        <div className="puzzle-review-choices"><Button variant={selected === null ? 'secondary' : 'ghost'} onClick={() => void load(null)}>Ідея задачі</Button>
            {attempt.mistakes?.map((mistake, index) => <Button key={`${mistake.step}-${mistake.move}`} variant={selected === index ? 'secondary' : 'ghost'} onClick={() => void load(index)}>Помилка {framesForLine(attemptFen({ ...attempt, step: mistake.step }), [mistake.move])[1].san}</Button>)}
        </div>
        {busy && <p role="status">Stockfish готує розбір…</p>}
        {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => void load(selected)}>Повторити розбір</Button></div>}
        {review && <><p>{review.explanation}</p><small>{review.score}{review.depth ? ` · Глибина ${review.depth}` : ''}</small>
            <div className="puzzle-review-line">{review.frames.map((frame, index) => <button key={index} type="button" aria-pressed={ply === index} onClick={() => show(index)}>{frame.san}</button>)}</div>
            <div className="puzzle-review-nav"><Button variant="outline" aria-label="Попередній хід розбору" disabled={ply === null || ply === 0} onClick={() => show(ply! - 1)}>←</Button><Button variant="outline" aria-label="Наступний хід розбору" disabled={ply === review.frames.length - 1} onClick={() => show(ply === null ? 0 : ply + 1)}>→</Button><Button variant="ghost" disabled={ply === null} onClick={() => { setPly(null); onPreview(null); }}>До розв’язання</Button></div>
        </>}
    </section>;
}
