import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PuzzleReview } from '@/features/puzzles/PuzzleReview';
import { RatingRange } from '@/features/puzzles/RatingRange';
import type { PuzzleFrame } from '@/features/puzzles/review';
import { findSharedPuzzle, puzzleLink } from '@/features/puzzles/share';
import { puzzleAnalysisPgn } from '@/features/puzzles/analysisPgn';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { useBoardSettings } from '@/contexts/BoardSettingsContext';
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, lastAttemptMove, markAttemptWrong, markAttemptAssisted, findNextPuzzle, finishAttempt, readProgress, saveProgress, type Attempt, type PuzzleIndexEntry, type Difficulty, type PuzzleProgress } from '@/features/puzzles/training';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess, type Square } from 'chess.js';
import { ArrowRight, ChartNoAxesCombined, Check, ChevronDown, FlipVertical, Lightbulb, Share2, XCircle, Info } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '@/styles/puzzles-studio.css';

async function loadJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error('Не вдалося завантажити задачі');
    return response.json();
}
export default function Puzzles() {
    const [progress, setProgress] = useState(readProgress);
    const latest = useRef(progress);
    const [searchParams, setSearchParams] = useSearchParams();
    const sharedId = searchParams.get('puzzle');
    const sharedHandled = useRef<string | null>(null);
    const [preview, setPreview] = useState<PuzzleFrame | null>(null);
    const [shareOpen, setShareOpen] = useState(false), [shareMessage, setShareMessage] = useState('');
    const [moveMark, setMoveMark] = useState<{ square: string; correct: boolean } | null>(null);
    const [feedbackKind, setFeedbackKind] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
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
            const load = (file: string) => client.fetchQuery({ queryKey: ['puzzle-set', file], queryFn: ({ signal }) => loadJson<TrainingPuzzle[]>(`/puzzles/${file}`, signal), staleTime: Infinity, gcTime: 60000 });
            const requested = sharedId && sharedHandled.current !== sharedId ? sharedId : null;
            const puzzle = requested ? await findSharedPuzzle(requested, manifest.data, index, load) : await findNextPuzzle(manifest.data, snapshot, load, index);
            if (!alive.current || id !== requestId.current) return;
            if (requested) sharedHandled.current = requested;
            else if (sharedId) setSearchParams({}, { replace: true });
            const alreadySolved = Boolean(puzzle && snapshot.completed.includes(puzzle.id));
            commit({ ...latest.current, current: puzzle ? { puzzle, step: alreadySolved ? puzzle.solution.length : 0, wrong: false, assisted: alreadySolved, hintLevel: 0, complete: alreadySolved } : null });
            setEmpty(!puzzle); setFeedback(''); setFeedbackKind('neutral'); setPreview(null); setMoveMark(null); setFlipped(false);
        } catch (error) { if (alive.current && id === requestId.current) setError(error instanceof Error ? error.message : 'Не вдалося завантажити задачу. Спробуйте ще раз.'); }
        finally { if (alive.current && id === requestId.current) setLoading(false); }
    }, [manifest.data, client, commit, sharedId, setSearchParams]);
    useEffect(() => {
        const current = latest.current.current;
        if (sharedId && current?.puzzle.id === sharedId) sharedHandled.current = sharedId;
        if (manifest.data && (!current || sharedId && sharedHandled.current !== sharedId && current.complete)) void loadNext();
    }, [manifest.data, loadNext, sharedId]);

    const attempt = progress.current, puzzle = attempt?.puzzle, complete = Boolean(attempt?.complete);
    const fen = preview?.fen || (attempt ? attemptFen(attempt) : '');
    const lastSquares = preview?.squares || (attempt ? lastAttemptMove(attempt) as Square[] : []);
    const busy = manifest.isPending || loading || checking;
    const acceptMove = (current: Attempt, result: NonNullable<ReturnType<typeof playPuzzleMove>>) => {
        const next = { ...current, line: result.line, step: result.index, complete: result.complete, hintLevel: 0 };
        commit(result.complete ? finishAttempt(latest.current, next) : { ...latest.current, current: next });
        setMoveMark({ square: result.line[current.step].slice(2, 4), correct: true });
        setFeedbackKind('correct');
        setFeedback(result.complete ? '' : 'Правильно. Знайдіть наступний хід.');
    };
    const move = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
        const current = latest.current.current;
        if (!current || current.complete || busy || checkController.current || themeOpen || shareOpen) return false;
        const currentFen = attemptFen(current);
        let uci: string;
        try { const played = new Chess(currentFen).move({ from, to, promotion: promotion || 'q' }); uci = played.from + played.to + (played.promotion || ''); }
        catch { return false; }
        const result = playPuzzleMove(currentFen, current.line || current.puzzle.solution, current.step, from, to, promotion);
        if (result) { acceptMove(current, result); return true; }
        const controller = new AbortController(); checkController.current = controller;
        setMoveMark(null); setChecking(true); setFeedbackKind('neutral'); setFeedback('Stockfish перевіряє твій хід…');
        void verifyAlternative(current, uci, controller.signal).then(verified => {
            if (!alive.current || controller.signal.aborted || latest.current.current !== current) return;
            if (verified) acceptMove(current, verified);
            else { setMoveMark({ square: from, correct: false }); commit({ ...latest.current, current: markAttemptWrong(current, uci) }); setFeedbackKind('wrong'); setFeedback('Це не розв’язок. Спробуйте інший хід.'); }
        }).catch(() => {
            if (alive.current && !controller.signal.aborted && latest.current.current === current) setFeedback('Stockfish не підтвердив оцінку. Штрафу немає. Повтори хід для перевірки або спробуй інший.');
        }).finally(() => { if (checkController.current === controller) { checkController.current = null; if (alive.current) setChecking(false); } });
        return false;
    };
    const hint = () => {
        const current = latest.current.current;
        if (!current || current.complete || checkController.current) return;
        setMoveMark(null); commit({ ...latest.current, current: markAttemptAssisted(current) });
        setFeedback(''); setFeedbackKind('neutral');
    };
    const share = async () => {
        if (!puzzle) return;
        setShareMessage(''); setShareOpen(true);
        try { await navigator.clipboard.writeText(puzzleLink(puzzle.id, window.location.href)); setShareMessage('Посилання скопійовано.'); }
        catch { setShareMessage('Скопіюй посилання з поля нижче.'); }
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
            <div className="puzzle-instruction"><span aria-hidden="true">{complete ? <Check size={32} /> : direction ? '♚' : '♔'}</span><div><h2>{complete ? 'Готово!' : 'Поточна задача'}</h2><p>{!complete && puzzle ? 'Знайди найкращий хід.' : ''}</p><p>{puzzle ? `Складність: ${puzzle.rating}` : 'Очікуємо завантаження'}</p></div></div>
            {!storageOk && <p role="alert" className="puzzle-storage-error">Не вдалося зберегти прогрес. Не закривайте сторінку, щоб не втратити поточну спробу.</p>}
        </aside>
        <section className="puzzle-board-card puzzle-card" aria-label="Дошка задачі">
            <div className="puzzle-turn"><span aria-hidden="true">{direction ? '♚' : '♔'}</span><strong>{puzzle ? direction ? 'Хід чорних' : 'Хід білих' : 'Задача'}</strong></div>
            <div ref={boardWrap} className="puzzle-board-wrap">
                {puzzle && fen ? <ChessBoard key={puzzle.id} displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={direction !== flipped} interactive={!complete && !busy && !themeOpen && !shareOpen} showLastMove lastMoveSquares={lastSquares} onMove={move} allowArrows annotationSquares={bestMove && attempt?.hintLevel ? [bestMove.slice(0, 2) as Square] : []} customArrows={bestMove && attempt?.hintLevel === 2 ? [[bestMove.slice(0, 2) as Square, bestMove.slice(2, 4) as Square, '#219cff']] : []} customLightSquareStyle={{ backgroundColor: palette.light }} customDarkSquareStyle={{ backgroundColor: palette.dark }} customBoardStyle={{ borderRadius: 3 }} />
                    : <div className="puzzle-board-placeholder" role="status">{busy ? 'Завантаження задачі…' : empty ? 'Немає нових задач за вибраною темою та діапазоном.' : 'Задача поки недоступна.'}</div>}
                {moveMark && !preview && <div className="puzzle-mark-layer" style={{ width: boardSize, height: boardSize }} aria-hidden="true"><span className={`puzzle-move-mark ${moveMark.correct ? 'is-correct' : 'is-wrong'}`} data-square={moveMark.square} style={{ left: `${(direction !== flipped ? 7 - (moveMark.square.charCodeAt(0) - 97) : moveMark.square.charCodeAt(0) - 97) * 12.5}%`, top: `${(direction !== flipped ? Number(moveMark.square[1]) - 1 : 8 - Number(moveMark.square[1])) * 12.5}%` }}>{moveMark.correct ? '✓' : '?'}</span></div>}
            </div>
            <div className={`puzzle-status is-${complete ? 'correct' : feedbackKind}`} role="status">{complete || feedbackKind === 'correct' ? <Check aria-hidden="true" size={19} /> : feedbackKind === 'wrong' ? <XCircle aria-hidden="true" size={19} /> : <Info aria-hidden="true" size={19} />}<span>{preview ? 'Перегляд варіанта Stockfish' : status}</span></div>
            <div className="puzzle-board-footer"><Button variant="ghost" disabled={!puzzle} onClick={() => setFlipped(value => !value)}><FlipVertical size={17} />Перевернути</Button><Button variant="ghost" disabled={!puzzle} onClick={() => void share()}><Share2 size={17} />Поділитися</Button></div>
        </section>
        <aside className="puzzle-training puzzle-card" aria-label="Керування тренуванням">
            <header><h2>Тренування</h2></header>
            <details className="puzzle-training-settings" open={!window.matchMedia('(max-width: 760px)').matches}><summary>Налаштування складності</summary>
            <fieldset className="puzzle-difficulty" disabled={busy}><legend>Складність</legend><div>{([['easier', 'Легше'], ['normal', 'Мій рівень'], ['harder', 'Складніше']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={!progress.ratingRange && progress.difficulty === value} onClick={() => commit({ ...latest.current, difficulty: value as Difficulty, ratingRange: null })}>{label}</button>)}</div></fieldset>
            <RatingRange key={progress.ratingRange ? `${progress.ratingRange.min}-${progress.ratingRange.max}` : 'auto'} value={progress.ratingRange} disabled={busy} onChange={ratingRange => commit({ ...latest.current, ratingRange })} />
            <p className="puzzle-next-settings">Налаштування діють для наступної задачі. Кнопки складності скасовують точний діапазон.</p>
            </details>

            {!complete && <div className="puzzle-help"><Button className="puzzle-hint" variant="outline" disabled={!puzzle || busy || attempt?.hintLevel === 2} onClick={hint}><Lightbulb size={21} />{attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'}</Button><p className="puzzle-hint-note">{failedRating ? 'Підказка не скасує вже допущену помилку.' : 'Підказка переведе спробу в навчальну.'}</p></div>}
            {(error || manifest.isError) && <div role="alert" className="puzzle-load-error">{error || 'Не вдалося завантажити базу задач.'}<Button variant="outline" onClick={() => { if (manifest.isError) void manifest.refetch(); else void loadNext(); }}>Повторити завантаження</Button></div>}
            {complete ? <div className="puzzle-complete-actions"><Button disabled={busy} onClick={() => void loadNext()}>Наступна задача<ArrowRight size={18} /></Button><Button variant="outline" onClick={() => navigate('/analysis', { state: { pgn: puzzleAnalysisPgn(puzzle!, attempt!) } })}>Відкрити в аналізі</Button></div> : null}
            {complete && attempt && <PuzzleReview key={puzzle!.id} attempt={attempt} onPreview={setPreview} />}
            {empty && <Button disabled={busy} onClick={() => void loadNext()}>Завантажити вибрану добірку</Button>}
            {sharedId && sharedHandled.current !== sharedId && <div className="puzzle-shared-note"><p>{attempt && !complete ? 'Спільна задача відкриється після завершення поточної.' : 'Відкриття спільної задачі.'}</p><Button variant="ghost" onClick={() => { setSearchParams({}, { replace: true }); setError(''); }}>Скасувати відкриття посилання</Button></div>}
            {!complete && <p className="puzzle-next-note">Наступна задача стане доступною після розв’язання.</p>}
        </aside>
        <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Поділитися задачею</DialogTitle><DialogDescription>Посилання відкриє цю позицію. Розв’язання стане доступним після завершення.</DialogDescription></DialogHeader><input aria-label="Посилання на задачу" className="w-full rounded border bg-transparent p-2 text-sm" readOnly value={puzzle ? puzzleLink(puzzle.id, window.location.href) : ''} onFocus={event => event.target.select()} /><p role="status">{shareMessage}</p></DialogContent></Dialog>
    </div>;
}
