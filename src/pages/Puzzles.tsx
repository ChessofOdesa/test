import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { puzzleAnalysisPgn } from '@/features/puzzles/analysisPgn';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { useBoardSettings } from '@/contexts/BoardSettingsContext';
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, markAttemptWrong, markAttemptAssisted, findNextPuzzle, finishAttempt, readProgress, saveProgress, type Attempt, type PuzzleIndexEntry, type Difficulty, type PuzzleProgress } from '@/features/puzzles/training';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess, type Square } from 'chess.js';
import { ArrowRight, ChartNoAxesCombined, Check, ChevronDown, FlipVertical, Lightbulb } from 'lucide-react';
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
    const [themeOpen, setThemeOpen] = useState(false);
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
        if (!current || current.complete || busy || checkController.current || themeOpen) return false;
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
    const bestMove = attempt && (attempt.line || attempt.puzzle.solution)[attempt.step];
    const palette = settings.theme.id === 'odesa' ? { light: '#eee9d3', dark: '#708b9c' } : settings.theme;
    const direction = puzzle?.fen.split(' ')[1] === 'b';
    const failedRating = attempt?.ratingOutcome === 'failed' || !attempt?.ratingOutcome && attempt?.wrong;
    const status = complete ? failedRating ? 'Задачу завершено. Помилку враховано в рейтингу.' : attempt?.assisted ? 'Розв’язано з підказкою. Рейтинг не змінено.' : 'Задачу розв’язано правильно!' : feedback || (attempt?.hintLevel ? `Підказку показано на дошці.${bestMove?.[4] ? ' Перетворення: ' + ({ q: 'ферзь', r: 'тура', b: 'слон', n: 'кінь' }[bestMove[4]] || '') + '.' : ''}` : 'Знайди найкращий хід');
    return <div className="puzzles-studio">
        <aside className="puzzle-stats puzzle-card" aria-label="Рейтинг задач">
            <h1>Задачі</h1>
            <div className="puzzle-rating"><span><ChartNoAxesCombined size={21} />Рейтинг задач</span><strong>{progress.rating}</strong></div>
            <div className="puzzle-theme-picker">
                <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
                    <DialogTrigger asChild><Button className="puzzle-theme-button" variant="outline" disabled={busy} aria-label="Вибрати тему задач"><span><span>Тема задач</span><strong>{progress.theme === 'all' ? 'Змішані задачі' : progress.theme}</strong></span><ChevronDown size={18} /></Button></DialogTrigger>
                    <DialogContent className="puzzle-theme-dialog w-[90vw] max-w-sm max-h-[85dvh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Тема задач</DialogTitle><DialogDescription>Вибрана тема застосовується до наступної задачі.</DialogDescription></DialogHeader>
                        <div className="grid gap-1" role="group" aria-label="Теми задач">
                            {[{ value: 'all', label: 'Змішані задачі' }, ...(manifest.data?.themes || []).map(theme => ({ value: theme, label: theme }))].map(({ value, label }) =>
                                <Button key={value} variant={progress.theme === value ? 'secondary' : 'ghost'} className="justify-between" aria-pressed={progress.theme === value} disabled={busy} onClick={() => { commit({ ...latest.current, theme: value }); setThemeOpen(false); }}>{label}{progress.theme === value && <Check size={16} />}</Button>
                            )}
                        </div>
                        {manifest.data && <p className="text-xs text-muted-foreground">У базі: {manifest.data.count.toLocaleString('uk-UA')} задач</p>}
                    </DialogContent>
                </Dialog>
            </div>
            {!storageOk && <p role="alert" className="puzzle-storage-error">Не вдалося зберегти прогрес. Не закривайте сторінку, щоб не втратити поточну спробу.</p>}
        </aside>
        <section className="puzzle-board-card puzzle-card" aria-label="Дошка задачі">
            <div className="puzzle-turn"><span aria-hidden="true">{direction ? '♚' : '♔'}</span><strong>{puzzle ? direction ? 'Хід чорних' : 'Хід білих' : 'Задача'}</strong></div>
            <div ref={boardWrap} className="puzzle-board-wrap">
                {puzzle && fen ? <ChessBoard key={puzzle.id} displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={direction !== flipped} interactive={!complete && !busy && !themeOpen} onMove={move} allowArrows annotationSquares={bestMove && attempt?.hintLevel ? [bestMove.slice(0, 2) as Square] : []} customArrows={bestMove && attempt?.hintLevel === 2 ? [[bestMove.slice(0, 2) as Square, bestMove.slice(2, 4) as Square, '#219cff']] : []} customLightSquareStyle={{ backgroundColor: palette.light }} customDarkSquareStyle={{ backgroundColor: palette.dark }} customBoardStyle={{ borderRadius: 3 }} />
                    : <div className="puzzle-board-placeholder" role="status">{busy ? 'Завантаження задачі…' : empty ? 'У цій добірці більше немає нових задач.' : 'Задача поки недоступна.'}</div>}
            </div>
            <div className={`puzzle-status${complete ? ' is-solved' : ''}`} role="status">{status}</div>
            <div className="puzzle-board-footer"><Button variant="ghost" disabled={!puzzle} onClick={() => setFlipped(value => !value)}><FlipVertical size={17} />Перевернути</Button></div>
        </section>
        <aside className="puzzle-training puzzle-card" aria-label="Керування тренуванням">
            <header><h2>Тренування</h2></header>
            <fieldset className="puzzle-difficulty" disabled={busy}><legend>Складність</legend><div>{([['easier', 'Легше'], ['normal', 'Мій рівень'], ['harder', 'Складніше']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={progress.difficulty === value} onClick={() => commit({ ...latest.current, difficulty: value as Difficulty })}>{label}</button>)}</div></fieldset>
            <p className="puzzle-next-settings">Складність — для наступної задачі.</p>
            <div className="puzzle-instruction"><span aria-hidden="true">{complete ? <Check size={32} /> : direction ? '♚' : '♔'}</span><div><h2>{complete ? 'Готово!' : 'Поточна задача'}</h2><p>{puzzle ? `Складність: ${puzzle.rating}` : 'Очікуємо завантаження'}</p></div></div>
            {!complete && <div className="puzzle-help"><Button className="puzzle-hint" variant="outline" disabled={!puzzle || busy || attempt?.hintLevel === 2} onClick={hint}><Lightbulb size={21} />{attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'}</Button><p className="puzzle-hint-note">{failedRating ? 'Підказка не скасує вже допущену помилку.' : 'Підказка переведе спробу в навчальну.'}</p></div>}
            {(error || manifest.isError) && <div role="alert" className="puzzle-load-error">{error || 'Не вдалося завантажити базу задач.'}<Button variant="outline" onClick={() => { if (manifest.isError) void manifest.refetch(); else void loadNext(); }}>Повторити завантаження</Button></div>}
            {complete ? <div className="puzzle-complete-actions"><Button disabled={busy} onClick={() => void loadNext()}>Наступна задача<ArrowRight size={18} /></Button><Button variant="outline" onClick={() => navigate('/analysis', { state: { pgn: puzzleAnalysisPgn(puzzle!, attempt!) } })}>Відкрити в аналізі</Button></div> : null}
            {empty && <Button disabled={busy} onClick={() => void loadNext()}>Завантажити вибрану добірку</Button>}
            {!complete && <p className="puzzle-next-note">Наступна задача стане доступною після розв’язання.</p>}
        </aside>
    </div>;
}
