import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { puzzleAnalysisPgn } from '@/features/puzzles/analysisPgn';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBoardSettings } from '@/contexts/BoardSettingsContext';
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, markAttemptWrong, markAttemptAssisted, dayKey, findNextPuzzle, finishAttempt, readProgress, saveProgress, type Attempt, type PuzzleIndexEntry, type Difficulty, type PuzzleProgress } from '@/features/puzzles/training';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess, type Square } from 'chess.js';
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
    const [savedOpen, setSavedOpen] = useState(false);
    const [checking, setChecking] = useState(false);
    const checkController = useRef<AbortController | null>(null);
    const [storageOk, setStorageOk] = useState(true);
    const [loading, setLoading] = useState(false), [error, setError] = useState(''), [empty, setEmpty] = useState(false);
    const [feedback, setFeedback] = useState(''), [flipped, setFlipped] = useState(false), [boardSize, setBoardSize] = useState(480);
    const boardWrap = useRef<HTMLDivElement>(null), requestId = useRef(0), alive = useRef(true);
    const settings = useBoardSettings(), client = useQueryClient(), navigate = useNavigate();
    const manifest = useQuery({ queryKey: ['puzzle-manifest'], queryFn: ({ signal }) => loadJson<PuzzleManifest>('/puzzles/manifest.json', signal), staleTime: Infinity });
    const commit = useCallback((next: PuzzleProgress) => { latest.current = next; setProgress(next); setStorageOk(saveProgress(next)); }, []);
    useEffect(() => { alive.current = true; return () => { alive.current = false; checkController.current?.abort(); }; }, []);
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
            const indexFile = manifest.data.indexFile;
            if (indexFile && !/^[a-zA-Z0-9_-]+\.json$/.test(indexFile)) throw new Error('Некоректний індекс задач');
            const index = indexFile ? await client.fetchQuery({ queryKey: ['puzzle-index', indexFile], queryFn: ({ signal }) => loadJson<PuzzleIndexEntry[]>(`/puzzles/${indexFile}`, signal), staleTime: Infinity }) : undefined;
            const puzzle = await findNextPuzzle(manifest.data, snapshot, file => client.fetchQuery({ queryKey: ['puzzle-set', file], queryFn: ({ signal }) => loadJson<TrainingPuzzle[]>(`/puzzles/${file}`, signal), staleTime: Infinity, gcTime: 60000 }), index);
            if (!alive.current || id !== requestId.current) return;
            commit({ ...latest.current, current: puzzle ? { puzzle, step: 0, wrong: false, assisted: false, hintLevel: 0, complete: false } : null });
            setEmpty(!puzzle); setFeedback(''); setFlipped(false);
        } catch { if (alive.current && id === requestId.current) setError('Не вдалося завантажити задачу. Спробуйте ще раз.'); }
        finally { if (alive.current && id === requestId.current) setLoading(false); }
    }, [manifest.data, client, commit]);
    useEffect(() => { if (manifest.data && !latest.current.current) void loadNext(); }, [manifest.data, loadNext]);

    const attempt = progress.current, puzzle = attempt?.puzzle, complete = Boolean(attempt?.complete);
    const fen = attempt ? attemptFen(attempt) : '';
    const busy = manifest.isPending || loading || checking;
    const acceptMove = (current: Attempt, result: NonNullable<ReturnType<typeof playPuzzleMove>>) => {
        const next = { ...current, line: result.line, step: result.index, complete: result.complete, hintLevel: 0 };
        commit(result.complete ? finishAttempt(latest.current, next) : { ...latest.current, current: next });
        setFeedback(result.complete ? '' : 'Правильно. Знайдіть наступний хід.');
    };
    const move = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
        const current = latest.current.current;
        if (!current || current.complete || busy || checkController.current || savedOpen) return false;
        const currentFen = attemptFen(current);
        let uci: string;
        try { const played = new Chess(currentFen).move({ from, to, promotion: promotion || 'q' }); uci = played.from + played.to + (played.promotion || ''); }
        catch { return false; }
        const result = playPuzzleMove(currentFen, current.line || current.puzzle.solution, current.step, from, to, promotion);
        if (result) { acceptMove(current, result); return true; }
        const controller = new AbortController(); checkController.current = controller;
        setChecking(true); setFeedback('Stockfish перевіряє твій хід…');
        void verifyAlternative(current, uci, controller.signal).then(verified => {
            if (!alive.current || controller.signal.aborted || latest.current.current !== current) return;
            if (verified) acceptMove(current, verified);
            else { commit({ ...latest.current, current: markAttemptWrong(current, uci) }); setFeedback('Це не розв’язок. Спробуйте інший хід.'); }
        }).catch(() => {
            if (alive.current && !controller.signal.aborted && latest.current.current === current) setFeedback('Stockfish не підтвердив оцінку. Штрафу немає. Повтори хід для перевірки або спробуй інший.');
        }).finally(() => { if (checkController.current === controller) { checkController.current = null; if (alive.current) setChecking(false); } });
        return false;
    };
    const hint = () => {
        const current = latest.current.current;
        if (!current || current.complete || checkController.current) return;
        commit({ ...latest.current, current: markAttemptAssisted(current) });
        setFeedback('');
    };
    const toggleSaved = () => {
        const current = latest.current.current;
        if (!current) return;
        const saved = latest.current.saved;
        if (!saved.some(p => p.id === current.puzzle.id) && saved.length >= 500) { setFeedback('Збережено вже 500 задач. Зніміть зайві закладки перед додаванням нових.'); return; }
        commit({ ...latest.current, saved: saved.some(p => p.id === current.puzzle.id) ? saved.filter(p => p.id !== current.puzzle.id) : [...saved, current.puzzle] });
    };
    const today = progress.days[dayKey()] || { solved: 0, delta: 0 };
    const bestMove = attempt && (attempt.line || attempt.puzzle.solution)[attempt.step];
    const palette = settings.theme.id === 'odesa' ? { light: '#eee9d3', dark: '#708b9c' } : settings.theme;
    const saved = Boolean(puzzle && progress.saved.some(p => p.id === puzzle.id));
    const direction = puzzle?.fen.split(' ')[1] === 'b';
    const failedRating = attempt?.ratingOutcome === 'failed' || !attempt?.ratingOutcome && attempt?.wrong;
    const status = complete ? failedRating ? 'Задачу завершено. Помилку враховано в рейтингу.' : attempt?.assisted ? 'Розв’язано з підказкою. Рейтинг не змінено.' : 'Задачу розв’язано правильно!' : feedback || (attempt?.hintLevel ? `Підказку показано на дошці.${bestMove?.[4] ? ' Перетворення: ' + ({ q: 'ферзь', r: 'тура', b: 'слон', n: 'кінь' }[bestMove[4]] || '') + '.' : ''}` : 'Знайди найкращий хід');
    return <div className="puzzles-studio">
        <aside className="puzzle-stats puzzle-card" aria-label="Рейтинг і статистика задач">
            <h1>Задачі</h1>
            <div className="puzzle-rating"><span><ChartNoAxesCombined size={21} />Рейтинг задач</span><strong>{progress.rating}</strong><small>{today.delta > 0 ? '+' : ''}{today.delta} за сьогодні</small>
                <details><summary>Про рейтинг</summary><p>Навчальний рейтинг на цьому пристрої, старт — 1500. Перше розв’язання без допомоги підвищує рейтинг; помилка знижує його після завершення. Підказка до першої помилки переводить спробу в навчальну. Підказка після помилки не скасовує штраф.</p></details>
            </div>
            <dl className="puzzle-stat-values"><div><dt>Розв’язано</dt><dd>{progress.solved}</dd></div><div><dt>Без помилок і підказок</dt><dd>{progress.solved ? `${Math.round(progress.clean / progress.solved * 100)}%` : '—'}</dd></div><div><dt>Серія правильних</dt><dd>{progress.streak}</dd></div></dl>
            <div className="puzzle-daily"><span>Сьогодні</span><strong>{today.solved} / {progress.goal}</strong><progress aria-label="Денна ціль" value={Math.min(today.solved, progress.goal)} max={progress.goal} /></div>
            <Button className="puzzle-saved-button" variant="outline" onClick={() => setSavedOpen(true)}><Bookmark size={16} />Збережені ({progress.saved.length})</Button>
            {!storageOk && <p role="alert" className="puzzle-storage-error">Не вдалося зберегти прогрес. Не закривайте сторінку, щоб не втратити поточну спробу.</p>}
        </aside>
        <section className="puzzle-board-card puzzle-card" aria-label="Дошка задачі">
            <div className="puzzle-turn"><span aria-hidden="true">{direction ? '♚' : '♔'}</span><strong>{puzzle ? direction ? 'Хід чорних' : 'Хід білих' : 'Задача'}</strong></div>
            <div ref={boardWrap} className="puzzle-board-wrap">
                {puzzle && fen ? <ChessBoard key={puzzle.id} displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={direction !== flipped} interactive={!complete && !busy && !savedOpen} onMove={move} allowArrows annotationSquares={bestMove && attempt?.hintLevel ? [bestMove.slice(0, 2) as Square] : []} customArrows={bestMove && attempt?.hintLevel === 2 ? [[bestMove.slice(0, 2) as Square, bestMove.slice(2, 4) as Square, '#219cff']] : []} customLightSquareStyle={{ backgroundColor: palette.light }} customDarkSquareStyle={{ backgroundColor: palette.dark }} customBoardStyle={{ borderRadius: 3 }} />
                    : <div className="puzzle-board-placeholder" role="status">{busy ? 'Завантаження задачі…' : empty ? 'У цій добірці більше немає нових задач.' : 'Задача поки недоступна.'}</div>}
            </div>
            <div className={`puzzle-status${complete ? ' is-solved' : ''}`} role="status">{status}</div>
            {!complete && <div className="puzzle-help"><Button className="puzzle-hint" variant="outline" disabled={!puzzle || busy || attempt?.hintLevel === 2} onClick={hint}><Lightbulb size={21} />{attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'}</Button><p className="puzzle-hint-note">{failedRating ? 'Підказка не скасує вже допущену помилку.' : 'Підказка переведе спробу в навчальну.'}</p></div>}
            <div className="puzzle-board-footer"><Button variant="ghost" disabled={!puzzle} onClick={() => setFlipped(value => !value)}><FlipVertical size={17} />Перевернути</Button><Button variant="ghost" disabled={!puzzle} aria-pressed={saved} onClick={toggleSaved}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Збережено' : 'Зберегти'}</Button></div>
        </section>
        <aside className="puzzle-training puzzle-card" aria-label="Керування тренуванням">
            <header><h2>Тренування</h2><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Налаштування задач"><Settings2 size={23} /></Button></PopoverTrigger><PopoverContent align="end"><label className="grid gap-2 text-sm">Денна ціль<select aria-label="Денна ціль задач" value={progress.goal} onChange={event => commit({ ...latest.current, goal: Number(event.target.value) })}>{[5, 10, 20, 30].map(goal => <option key={goal} value={goal}>{goal} задач</option>)}</select></label><p className="mt-3 text-xs text-muted-foreground">Точність — частка задач без помилок і підказок. Прогрес зберігається на цьому пристрої.</p></PopoverContent></Popover></header>
            <label className="puzzle-collection">Добірка<select aria-label="Добірка задач" value={progress.theme} disabled={busy} onChange={event => commit({ ...latest.current, theme: event.target.value })}><option value="all">Змішані задачі</option>{manifest.data?.themes.map(theme => <option key={theme} value={theme}>{theme}</option>)}</select></label>
            <fieldset className="puzzle-difficulty" disabled={busy}><legend>Складність</legend><div>{([['easier', 'Легше'], ['normal', 'Мій рівень'], ['harder', 'Складніше']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={progress.difficulty === value} onClick={() => commit({ ...latest.current, difficulty: value as Difficulty })}>{label}</button>)}</div></fieldset>
            <p className="puzzle-next-settings">Добірка й складність — для наступної задачі.</p>
            <div className="puzzle-instruction"><span aria-hidden="true">{complete ? <Check size={32} /> : direction ? '♚' : '♔'}</span><div><h2>{complete ? 'Готово!' : 'Поточна задача'}</h2><p>{puzzle ? `Складність: ${puzzle.rating}` : 'Очікуємо завантаження'}</p></div></div>
            {(error || manifest.isError) && <div role="alert" className="puzzle-load-error">{error || 'Не вдалося завантажити базу задач.'}<Button variant="outline" onClick={() => { if (manifest.isError) void manifest.refetch(); else void loadNext(); }}>Повторити завантаження</Button></div>}
            {complete ? <div className="puzzle-complete-actions"><Button disabled={busy} onClick={() => void loadNext()}>Наступна задача<ArrowRight size={18} /></Button><Button variant="outline" onClick={() => navigate('/analysis', { state: { pgn: puzzleAnalysisPgn(puzzle!, attempt!) } })}>Відкрити в аналізі</Button></div> : null}
            {empty && <Button disabled={busy} onClick={() => void loadNext()}>Завантажити вибрану добірку</Button>}
            {!complete && <p className="puzzle-next-note">Наступна задача стане доступною після розв’язання.</p>}
        </aside>
        <Dialog open={savedOpen} onOpenChange={setSavedOpen}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Збережені задачі</DialogTitle><DialogDescription>Відкрий розв’язання завершеної задачі в аналізі або видали закладку.</DialogDescription></DialogHeader>
            {!progress.saved.length && <p>Збережених задач поки немає.</p>}
            {progress.saved.map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 border-b py-3"><div className="min-w-0 flex-1"><strong>{item.title}</strong><p className="text-sm text-muted-foreground">{item.theme} · {item.rating}</p></div>
                <Button variant="outline" disabled={!progress.completed.includes(item.id)} onClick={() => navigate('/analysis', { state: { pgn: puzzleAnalysisPgn(item, attempt?.puzzle.id === item.id ? attempt : undefined) } })}>Відкрити в аналізі</Button>
                <Button variant="ghost" aria-label={`Видалити закладку ${item.title}`} onClick={() => commit({ ...latest.current, saved: latest.current.saved.filter(p => p.id !== item.id) })}>Видалити</Button>
                {!progress.completed.includes(item.id) && <p className="w-full text-xs text-muted-foreground">Аналіз відкриється після завершення задачі.</p>}
            </div>)}
        </DialogContent></Dialog>
    </div>;
}
