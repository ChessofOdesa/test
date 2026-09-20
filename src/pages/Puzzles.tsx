import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBoardSettings } from '@/contexts/BoardSettingsContext';
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, dayKey, findNextPuzzle, finishAttempt, readProgress, saveProgress, type Difficulty, type PuzzleProgress } from '@/features/puzzles/training';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Square } from 'chess.js';
import { ArrowRight, Bookmark, ChartNoAxesCombined, Check, FlipVertical, Lightbulb, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/styles/puzzles-studio.css';

async function loadJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error('Не вдалося завантажити задачі');
    return response.json();
}
export default function Puzzles() {
    const [progress, setProgress] = useState(readProgress);
    const latest = useRef(progress);
    const [storageOk, setStorageOk] = useState(true);
    const [loading, setLoading] = useState(false), [error, setError] = useState(''), [empty, setEmpty] = useState(false);
    const [feedback, setFeedback] = useState(''), [flipped, setFlipped] = useState(false), [boardSize, setBoardSize] = useState(480);
    const boardWrap = useRef<HTMLDivElement>(null), requestId = useRef(0), alive = useRef(true);
    const settings = useBoardSettings(), client = useQueryClient(), navigate = useNavigate();
    const manifest = useQuery({ queryKey: ['puzzle-manifest'], queryFn: ({ signal }) => loadJson<PuzzleManifest>('/puzzles/manifest.json', signal), staleTime: Infinity });
    const commit = useCallback((next: PuzzleProgress) => { latest.current = next; setProgress(next); setStorageOk(saveProgress(next)); }, []);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        const element = boardWrap.current;
        if (!element) return;
        const resize = () => setBoardSize(Math.max(100, Math.floor(Math.min(700, element.getBoundingClientRect().width || 480))));
        const observer = new ResizeObserver(resize); observer.observe(element); resize();
        return () => observer.disconnect();
    }, []);
    const loadNext = useCallback(async () => {
        if (!manifest.data || latest.current.current && !latest.current.current.complete) return;
        const id = ++requestId.current;
        const snapshot = latest.current;
        setLoading(true); setError(''); setEmpty(false);
        try {
            const puzzle = await findNextPuzzle(manifest.data, snapshot, file => client.fetchQuery({ queryKey: ['puzzle-set', file], queryFn: ({ signal }) => loadJson<TrainingPuzzle[]>(`/puzzles/${file}`, signal), staleTime: Infinity, gcTime: 60000 }));
            if (!alive.current || id !== requestId.current) return;
            commit({ ...latest.current, current: puzzle ? { puzzle, step: 0, wrong: false, assisted: false, hintLevel: 0, complete: false } : null });
            setEmpty(!puzzle); setFeedback(''); setFlipped(false);
        } catch { if (alive.current && id === requestId.current) setError('Не вдалося завантажити задачу. Спробуйте ще раз.'); }
        finally { if (alive.current && id === requestId.current) setLoading(false); }
    }, [manifest.data, client, commit]);
    useEffect(() => { if (manifest.data && !latest.current.current) void loadNext(); }, [manifest.data, loadNext]);

    const attempt = progress.current, puzzle = attempt?.puzzle, complete = Boolean(attempt?.complete);
    const fen = attempt ? attemptFen(attempt) : '';
    const busy = manifest.isPending || loading;
    const move = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
        const current = latest.current.current;
        if (!current || current.complete || loading) return false;
        const result = playPuzzleMove(attemptFen(current), current.puzzle.solution, current.step, from, to, promotion);
        if (!result) {
            commit({ ...latest.current, current: { ...current, wrong: true } });
            setFeedback('Це не розв’язок. Спробуйте інший хід.');
            return false;
        }
        const next = { ...current, step: result.index, complete: result.complete, hintLevel: 0 };
        commit(result.complete ? finishAttempt(latest.current, next) : { ...latest.current, current: next });
        setFeedback(result.complete ? '' : 'Правильно. Знайдіть наступний хід.');
        return true;
    };
    const hint = () => {
        const current = latest.current.current;
        if (!current || current.complete) return;
        commit({ ...latest.current, current: { ...current, assisted: true, hintLevel: Math.min(2, current.hintLevel + 1) } });
    };
    const toggleSaved = () => {
        const current = latest.current.current;
        if (!current) return;
        const saved = latest.current.saved;
        if (!saved.some(p => p.id === current.puzzle.id) && saved.length >= 500) { setFeedback('Збережено вже 500 задач. Зніміть зайві закладки перед додаванням нових.'); return; }
        commit({ ...latest.current, saved: saved.some(p => p.id === current.puzzle.id) ? saved.filter(p => p.id !== current.puzzle.id) : [...saved, current.puzzle] });
    };
    const today = progress.days[dayKey()] || { solved: 0, delta: 0 };
    const bestMove = attempt && puzzle?.solution[attempt.step];
    const palette = settings.theme.id === 'odesa' ? { light: '#eee9d3', dark: '#708b9c' } : settings.theme;
    const saved = Boolean(puzzle && progress.saved.some(p => p.id === puzzle.id));
    const direction = puzzle?.fen.split(' ')[1] === 'b';
    const status = complete ? attempt?.assisted ? 'Розв’язано з підказкою. Рейтинг не змінено.' : attempt?.wrong ? 'Задачу завершено. Помилку враховано в рейтингу.' : 'Задачу розв’язано правильно!' : feedback || (attempt?.hintLevel ? 'Підказку показано на дошці.' : 'Знайди найкращий хід');
    return <div className="puzzles-studio">
        <aside className="puzzle-stats puzzle-card" aria-label="Рейтинг і статистика задач">
            <h1>Задачі</h1>
            <div className="puzzle-rating"><span><ChartNoAxesCombined size={21} />Рейтинг задач</span><strong>{progress.rating}</strong><small>{today.delta > 0 ? '+' : ''}{today.delta} за сьогодні</small>
                <details><summary>Про рейтинг</summary><p>Навчальний рейтинг на цьому пристрої, старт — 1500. Перше розв’язання без допомоги підвищує рейтинг; помилка знижує його після завершення. З підказкою рейтинг не змінюється.</p></details>
            </div>
            <dl className="puzzle-stat-values"><div><dt>Розв’язано</dt><dd>{progress.solved}</dd></div><div><dt>Точність</dt><dd>{progress.solved ? `${Math.round(progress.clean / progress.solved * 100)}%` : '—'}</dd></div><div><dt>Серія правильних</dt><dd>{progress.streak}</dd></div></dl>
            <div className="puzzle-daily"><span>Сьогодні</span><strong>{today.solved} / {progress.goal}</strong><progress aria-label="Денна ціль" value={Math.min(today.solved, progress.goal)} max={progress.goal} /></div>
            {!storageOk && <p role="alert" className="puzzle-storage-error">Не вдалося зберегти прогрес. Не закривайте сторінку, щоб не втратити поточну спробу.</p>}
        </aside>
        <section className="puzzle-board-card puzzle-card" aria-label="Дошка задачі">
            <div className="puzzle-turn"><span aria-hidden="true">{direction ? '♚' : '♔'}</span><strong>{puzzle ? direction ? 'Хід чорних' : 'Хід білих' : 'Задача'}</strong></div>
            <div ref={boardWrap} className="puzzle-board-wrap">
                {puzzle && fen ? <ChessBoard key={puzzle.id} displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={direction !== flipped} interactive={!complete && !busy} onMove={move} allowArrows annotationSquares={bestMove && attempt?.hintLevel ? [bestMove.slice(0, 2) as Square] : []} customArrows={bestMove && attempt?.hintLevel === 2 ? [[bestMove.slice(0, 2) as Square, bestMove.slice(2, 4) as Square, '#219cff']] : []} customLightSquareStyle={{ backgroundColor: palette.light }} customDarkSquareStyle={{ backgroundColor: palette.dark }} customBoardStyle={{ borderRadius: 3 }} />
                    : <div className="puzzle-board-placeholder" role="status">{busy ? 'Завантаження задачі…' : empty ? 'У цій добірці більше немає нових задач.' : 'Задача поки недоступна.'}</div>}
            </div>
            <div className="puzzle-board-footer"><span>{complete ? 'Розв’язання завершено' : 'Знайди найкраще продовження'}</span><Button variant="ghost" disabled={!puzzle} onClick={() => setFlipped(value => !value)}><FlipVertical size={17} />Перевернути</Button><Button variant="ghost" disabled={!puzzle} aria-pressed={saved} onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Збережено' : 'Зберегти'}</Button></div>
        </section>
        <aside className="puzzle-training puzzle-card" aria-label="Керування тренуванням">
            <header><h2>Тренування</h2><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Налаштування задач"><Settings2 size={23} /></Button></PopoverTrigger><PopoverContent align="end"><label className="grid gap-2 text-sm">Денна ціль<select aria-label="Денна ціль задач" value={progress.goal} onChange={event => commit({ ...latest.current, goal: Number(event.target.value) })}>{[5, 10, 20, 30].map(goal => <option key={goal} value={goal}>{goal} задач</option>)}</select></label><p className="mt-3 text-xs text-muted-foreground">Точність — частка задач без помилок і підказок. Прогрес зберігається на цьому пристрої.</p></PopoverContent></Popover></header>
            <label className="puzzle-collection">Добірка<select aria-label="Добірка задач" value={progress.theme} disabled={busy} onChange={event => commit({ ...latest.current, theme: event.target.value })}><option value="all">Змішані задачі</option>{manifest.data?.themes.map(theme => <option key={theme} value={theme}>{theme}</option>)}</select></label>
            <fieldset className="puzzle-difficulty" disabled={busy}><legend>Складність</legend><div>{([['easier', 'Легше'], ['normal', 'Мій рівень'], ['harder', 'Складніше']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={progress.difficulty === value} onClick={() => commit({ ...latest.current, difficulty: value as Difficulty })}>{label}</button>)}</div></fieldset>
            <p className="puzzle-next-settings">Добірка й складність — для наступної задачі.</p>
            <div className="puzzle-instruction"><span aria-hidden="true">{complete ? <Check size={32} /> : direction ? '♚' : '♔'}</span><div><h2>{complete ? 'Готово!' : 'Твій хід'}</h2><p>{complete ? `Складність задачі: ${puzzle?.rating}` : 'Прорахуй продовження та зроби хід на дошці.'}</p></div></div>
            <div className={`puzzle-status${complete ? ' is-solved' : ''}`} role="status">{status}</div>
            {(error || manifest.isError) && <div role="alert" className="puzzle-load-error">{error || 'Не вдалося завантажити базу задач.'}<Button variant="outline" onClick={() => { if (manifest.isError) void manifest.refetch(); else void loadNext(); }}>Повторити завантаження</Button></div>}
            {complete ? <div className="puzzle-complete-actions"><Button disabled={busy} onClick={() => void loadNext()}>Наступна задача<ArrowRight size={18} /></Button><Button variant="outline" onClick={() => navigate(`/analysis?${new URLSearchParams({ fen: puzzle!.fen })}`)}>Відкрити в аналізі</Button></div> : <><Button className="puzzle-hint" variant="outline" disabled={!puzzle || busy || attempt?.hintLevel === 2} onClick={hint}><Lightbulb size={21} />{attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'}</Button><p className="puzzle-hint-note">Підказка позначить спробу як навчальну.</p></>}
            {empty && <Button disabled={busy} onClick={() => void loadNext()}>Завантажити вибрану добірку</Button>}
            {!complete && <p className="puzzle-next-note">Наступна задача стане доступною після розв’язання.</p>}
        </aside>
    </div>;
}
