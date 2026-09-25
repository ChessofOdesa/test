import ChessBoard from '@/components/ChessBoard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PuzzleReview } from '@/features/puzzles/PuzzleReview';
import { ThemePicker } from '@/features/puzzles/ThemePicker';
import { RatingRange } from '@/features/puzzles/RatingRange';
import type { PuzzleFrame } from '@/features/puzzles/review';
import { findSharedPuzzle, puzzleLink } from '@/features/puzzles/share';
import { puzzleAnalysisPgn } from '@/features/puzzles/analysisPgn';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { BOARD_THEMES, useBoardSettings } from '@/contexts/BoardSettingsContext';
import { playChessSound } from '@/hooks/useChessSounds';
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, lastAttemptMove, markAttemptWrong, markAttemptAssisted, findNextPuzzle, finishAttempt, readProgress, saveProgress, type Attempt, type PuzzleIndexEntry, type Difficulty, type PuzzleProgress, selectedPuzzleThemes } from '@/features/puzzles/training';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Chess, type Square } from 'chess.js';
import { ArrowRight, UserRound, Check, FlipVertical, Lightbulb, Share2, XCircle, Info, Settings2, Search, Flame, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '@/styles/puzzles-studio.css';

function squarePosition(square: string, black: boolean) {
    const file = square.charCodeAt(0) - 97, rank = Number(square[1]) - 1;
    return { left: `${(black ? 7 - file : file) * 12.5}%`, top: `${(black ? rank : 7 - rank) * 12.5}%` };
}
function captureAt(game: Chess, uci: string): Square | null {
    const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || 'q' });
    return move.captured ? (move.isEnPassant() ? `${move.to[0]}${move.from[1]}` : move.to) as Square : null;
}

async function loadJson<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error('Не вдалося завантажити задачі');
    return response.json();
}
type PuzzlePreferences = { background: 'plain' | 'blue'; sound: boolean; motion: boolean; hints: boolean; evaluation: boolean };
const PREFERENCES_KEY = 'coo.puzzles.preferences.v1';
const DEFAULT_PREFERENCES: PuzzlePreferences = { background: 'plain', sound: false, motion: true, hints: true, evaluation: true };
function readPreferences(): PuzzlePreferences {
    try {
        const value = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || 'null');
        if (!value || typeof value !== 'object') return DEFAULT_PREFERENCES;
        return {
            background: value.background === 'blue' ? 'blue' : 'plain',
            sound: value.sound === true, motion: value.motion !== false,
            hints: value.hints !== false, evaluation: value.evaluation !== false,
        };
    } catch { return DEFAULT_PREFERENCES; }
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
    const [presentedFen, setPresentedFen] = useState<string | null>(null);
    const [captureFadeSquare, setCaptureFadeSquare] = useState<Square | null>(null);
    const presentationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const [themeOpen, setThemeOpen] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [rangeOpenOnSettings, setRangeOpenOnSettings] = useState(false);
    const [preferences, setPreferences] = useState(readPreferences);
    const [checking, setChecking] = useState(false);
    const checkController = useRef<AbortController | null>(null);
    const [storageOk, setStorageOk] = useState(true);
    const [loading, setLoading] = useState(false), [error, setError] = useState(''), [empty, setEmpty] = useState(false);
    const [feedback, setFeedback] = useState(''), [flipped, setFlipped] = useState(false), [boardSize, setBoardSize] = useState(480);
    const nextPending = useRef(false);
    const boardWrap = useRef<HTMLDivElement>(null), requestId = useRef(0), alive = useRef(true);
    const settings = useBoardSettings(), client = useQueryClient(), navigate = useNavigate();
    const manifest = useQuery({ queryKey: ['puzzle-manifest'], queryFn: ({ signal }) => loadJson<PuzzleManifest>('/puzzles/manifest.json', signal), staleTime: Infinity });
    const commit = useCallback((next: PuzzleProgress) => { latest.current = next; setProgress(next); setStorageOk(saveProgress(next)); }, []);
    useEffect(() => { try { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch { /* Appearance preferences are optional. */ } }, [preferences]);
    const updatePreference = <K extends keyof PuzzlePreferences>(key: K, value: PuzzlePreferences[K]) => setPreferences(previous => ({ ...previous, [key]: value }));
    useEffect(() => { alive.current = true; return () => { alive.current = false; checkController.current?.abort(); if (presentationTimer.current) clearTimeout(presentationTimer.current); }; }, []);
    useEffect(() => {
        const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!preference) return;
        const update = () => setReducedMotion(preference.matches);
        update(); preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        const element = boardWrap.current;
        if (!element) return;
        const resize = () => setBoardSize(Math.max(100, Math.floor(Math.min(700, element.getBoundingClientRect().width || 480))));
        const observer = new ResizeObserver(resize); observer.observe(element); resize();
        return () => observer.disconnect();
    }, []);
    const loadNext = useCallback(async () => {
        if (!manifest.data || nextPending.current || latest.current.current && !latest.current.current.complete) return;
        nextPending.current = true;
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
            if (presentationTimer.current) clearTimeout(presentationTimer.current);
            presentationTimer.current = null;
            setPresentedFen(null); setCaptureFadeSquare(null); setEmpty(!puzzle); setFeedback(''); setFeedbackKind('neutral'); setPreview(null); setMoveMark(null); setFlipped(false);
        } catch (error) {
            if (alive.current && id === requestId.current) {
                const message = error instanceof Error ? error.message : '';
                setError(['Не вдалося завантажити задачі', 'Некоректний індекс задач'].includes(message) ? message : 'Не вдалося завантажити задачу. Спробуйте ще раз.');
            }
        }
        finally { nextPending.current = false; if (alive.current && id === requestId.current) setLoading(false); }
    }, [manifest.data, client, commit, sharedId, setSearchParams]);
    useEffect(() => {
        const current = latest.current.current;
        if (sharedId && current?.puzzle.id === sharedId) sharedHandled.current = sharedId;
        if (manifest.data && (!current || sharedId && sharedHandled.current !== sharedId && current.complete)) void loadNext();
    }, [manifest.data, loadNext, sharedId]);

    const attempt = progress.current, puzzle = attempt?.puzzle, complete = Boolean(attempt?.complete);
    const fen = preview?.fen || presentedFen || (attempt ? attemptFen(attempt) : '');
    const lastSquares = preview?.squares || (presentedFen ? [] : attempt ? lastAttemptMove(attempt) as Square[] : []);
    const busy = manifest.isPending || loading || checking || Boolean(presentedFen);
    const moveDuration = reducedMotion || !preferences.motion ? 0 : boardSize < 450 ? 145 : 180;
    const acceptMove = (current: Attempt, result: NonNullable<ReturnType<typeof playPuzzleMove>>) => {
        const next = { ...current, line: result.line, step: result.index, complete: result.complete, hintLevel: 0 };
        // Progress is saved immediately; only the displayed position waits for the opponent reply.
        if (moveDuration) {
            const played = new Chess(attemptFen(current));
            const uci = result.line[current.step];
            setCaptureFadeSquare(captureAt(played, uci));
            setPresentedFen(played.fen());
            const reply = result.index > current.step + 1 ? result.line[current.step + 1] : null;
            const replyCapture = reply ? captureAt(played, reply) : null;
            if (presentationTimer.current) clearTimeout(presentationTimer.current);
            presentationTimer.current = setTimeout(() => { setCaptureFadeSquare(replyCapture); setPresentedFen(null); presentationTimer.current = null; if (reply && preferences.sound) playChessSound(replyCapture ? 'capture' : 'move'); }, moveDuration + (reply ? 70 : 35));
        }
        commit(result.complete ? finishAttempt(latest.current, next) : { ...latest.current, current: next });
        setMoveMark({ square: result.line[current.step].slice(2, 4), correct: true });
        setFeedbackKind('correct');
        setFeedback(result.complete ? '' : 'Правильно! Продовжуйте.');
    };
    const move = (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
        const current = latest.current.current;
        if (!current || current.complete || busy || checkController.current || themeOpen || preferencesOpen || shareOpen) return false;
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
            else { setMoveMark({ square: to, correct: false }); commit({ ...latest.current, current: markAttemptWrong(current, uci) }); setFeedbackKind('wrong'); setFeedback('Спробуйте ще.'); }
        }).catch(() => {
            if (alive.current && !controller.signal.aborted && latest.current.current === current) setFeedback('Stockfish не підтвердив оцінку. Штрафу немає. Повтори хід для перевірки або спробуй інший.');
        }).finally(() => { if (checkController.current === controller) { checkController.current = null; if (alive.current) setChecking(false); } });
        return false;
    };
    const hint = () => {
        const current = latest.current.current;
        if (!current || current.complete || checkController.current || !preferences.hints) return;
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
    const status = !puzzle ? '' : complete ? presentedFen ? 'Правильно!' : 'Задачу розв’язано' : feedback || (attempt?.hintLevel ? `Підказку показано на дошці.${bestMove?.[4] ? ' Перетворення: ' + ({ q: 'ферзь', r: 'тура', b: 'слон', n: 'кінь' }[bestMove[4]] || '') + '.' : ''}` : '');
    const ratingChange = complete && attempt?.ratingBefore !== undefined ? progress.rating - attempt.ratingBefore : null;
    const shownRating = complete && presentedFen && attempt?.ratingBefore !== undefined ? attempt.ratingBefore : progress.rating;
    const selectedThemes = selectedPuzzleThemes(progress);
    const boardBlack = Boolean(direction !== flipped);
    const reviewReady = complete && !presentedFen;
    const difficultyLabel = progress.ratingRange ? `${progress.ratingRange.min}–${progress.ratingRange.max}` : ({ easier: 'Легше', normal: 'Мій рівень', harder: 'Складніше' } as const)[progress.difficulty];
    const mistakeCount = Math.max(Number(Boolean(attempt?.wrong)), attempt?.mistakes?.length || 0);
    return <div className={`puzzles-studio${preferences.background === 'blue' ? ' is-blue-background' : ''}`}><div className="puzzle-workspace">
        <header className="puzzle-workspace-bar">
            <div><span className="puzzle-eyebrow">CHESS OF ODESA / ТРЕНУВАННЯ</span><h1>Задачі</h1></div>
            <div className="puzzle-toolbar"><Button variant="outline" aria-label="Пошук тем" title="Пошук тем" onClick={() => setThemeOpen(true)}><Search size={18} /><span>Пошук</span></Button><Button variant="outline" aria-label="Налаштування задач" title="Налаштування задач" aria-expanded={preferencesOpen} onClick={() => { setRangeOpenOnSettings(false); setPreferencesOpen(true); }}><Settings2 size={18} /><span>Налаштування</span></Button></div>
        </header>
        <div className="puzzle-layout">
        <aside className="puzzle-stats puzzle-card" aria-label="Рейтинг гравця">
            <div className="puzzle-sidebar-heading"><SlidersHorizontal size={19} aria-hidden="true" /><strong>Мій тренінг</strong></div>
            <div className="puzzle-rating" title="Ваш рейтинг у тренуванні задач на цьому пристрої"><span><UserRound size={17} />Рейтинг гравця</span><div className="puzzle-rating-value"><strong key={shownRating} className={ratingChange !== null && !presentedFen ? 'has-changed' : ''}>{shownRating}</strong>{ratingChange !== null && ratingChange !== 0 && !presentedFen && <small className={ratingChange < 0 ? 'is-negative' : ''}>{ratingChange > 0 ? '+' : ''}{ratingChange}</small>}</div></div>
            <div className="puzzle-streak" aria-label={`Серія ${progress.streak} без помилок і підказок`}><span className="puzzle-streak-icon"><Flame size={19} aria-hidden="true" /></span><div><strong>Серія {progress.streak}</strong><small>Без помилок і підказок</small></div></div>
            <ThemePicker themes={manifest.data?.themes || []} count={manifest.data?.count || 0} selected={selectedThemes} disabled={busy} open={themeOpen} onOpenChange={setThemeOpen} onChange={nextThemes => commit({ ...latest.current, theme: 'all', selectedThemes: nextThemes })} />
            <section className="puzzle-sidebar-difficulty"><div className="puzzle-setting-heading"><span>Складність</span><small>{difficultyLabel}</small></div>
            <fieldset className="puzzle-difficulty" disabled={busy}><legend>Складність</legend><div>{([['easier', 'Легше'], ['normal', 'Мій рівень'], ['harder', 'Складніше']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={!progress.ratingRange && progress.difficulty === value} onClick={() => commit({ ...latest.current, difficulty: value as Difficulty, ratingRange: null })}>{label}</button>)}</div></fieldset>
            <button type="button" className="puzzle-advanced-trigger" onClick={() => { setRangeOpenOnSettings(true); setPreferencesOpen(true); }}>Точний діапазон <ArrowRight size={14} aria-hidden="true" /></button>
            </section>
            {!storageOk && <p role="alert" className="puzzle-storage-error">Не вдалося зберегти прогрес. Не закривайте сторінку, щоб не втратити поточну спробу.</p>}
        </aside>
        <section className="puzzle-board-card puzzle-card" aria-label="Дошка задачі">
            <div className="puzzle-turn"><span className="puzzle-turn-mark" aria-hidden="true">{reviewReady ? '✓' : direction ? '♚' : '♔'}</span><div><strong>{reviewReady ? 'Задачу завершено' : puzzle ? direction ? 'Хід чорних' : 'Хід білих' : 'Задача'}</strong>{!reviewReady && puzzle && <small>Знайдіть найкраще продовження</small>}</div>{!reviewReady && puzzle && <span className="puzzle-turn-status">У процесі</span>}</div>
            <div ref={boardWrap} className={`puzzle-board-wrap${loading ? ' is-loading-next' : ''}${reviewReady ? ' is-solved' : ''}`}>
                {puzzle && fen ? <div key={puzzle.id} className="puzzle-board-stage" style={{ width: boardSize, height: boardSize }}><ChessBoard displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={boardBlack} playerColor={fen.split(' ')[1] as 'w' | 'b'} animationDuration={moveDuration} captureFadeSquare={captureFadeSquare || undefined} enableMoveSounds={preferences.sound} interactive={!complete && !busy && !themeOpen && !preferencesOpen && !shareOpen} showLastMove lastMoveSquares={lastSquares} onMove={move} allowArrows annotationSquares={bestMove && attempt?.hintLevel ? [bestMove.slice(0, 2) as Square] : []} customArrows={bestMove && attempt?.hintLevel === 2 ? [[bestMove.slice(0, 2) as Square, bestMove.slice(2, 4) as Square, '#219cff']] : []} customLightSquareStyle={{ backgroundColor: palette.light }} customDarkSquareStyle={{ backgroundColor: palette.dark }} customBoardStyle={{ borderRadius: 3 }} /></div>
                    : <div className="puzzle-board-placeholder" role="status">{busy ? 'Завантаження задачі…' : empty ? 'Немає нових задач за вибраною темою та діапазоном.' : 'Задача поки недоступна.'}</div>}
                {moveMark && !preview && <div className="puzzle-mark-layer" style={{ width: boardSize, height: boardSize }} aria-hidden="true"><span key={`${attempt?.step}-${moveMark.square}-${moveMark.correct}`} className={`puzzle-move-mark ${moveMark.correct ? 'is-correct' : 'is-wrong'}`} data-square={moveMark.square} style={squarePosition(moveMark.square, boardBlack)}>{moveMark.correct ? '✓' : '?'}</span></div>}
                {bestMove && attempt && attempt.hintLevel > 0 && !complete && <div className="puzzle-mark-layer" style={{ width: boardSize, height: boardSize }} aria-hidden="true"><span key={`${attempt.step}-${attempt.hintLevel}-from`} className="puzzle-hint-focus" style={squarePosition(bestMove.slice(0, 2), boardBlack)} />{attempt.hintLevel === 2 && <span key={`${attempt.step}-to`} className="puzzle-hint-focus is-target" style={squarePosition(bestMove.slice(2, 4), boardBlack)} />}</div>}
            </div>
            {(status || preview) && <div className={`puzzle-status is-${complete ? 'correct' : feedbackKind}${checking ? ' is-checking' : ''}`} role="status" aria-busy={checking}>{complete || feedbackKind === 'correct' ? <Check aria-hidden="true" size={19} /> : feedbackKind === 'wrong' ? <XCircle aria-hidden="true" size={19} /> : <Info aria-hidden="true" size={19} />}<span>{preview ? 'Перегляд варіанта Stockfish' : status}</span></div>}
            <div className="puzzle-board-footer"><Button variant="ghost" title="Перевернути дошку" disabled={!puzzle} onClick={() => setFlipped(value => !value)}><FlipVertical size={17} />Перевернути</Button><Button variant="ghost" title="Поділитися задачею" disabled={!puzzle} onClick={() => void share()}><Share2 size={17} />Поділитися</Button></div>
        </section>
        <aside className={`puzzle-training puzzle-card${reviewReady ? ' has-review' : ''}`} aria-label="Керування тренуванням">
            {!complete && <div className="puzzle-help">
                {puzzle && <div className="puzzle-companion-head"><span className="puzzle-live-indicator">Задача активна</span></div>}
                {preferences.hints && <Button className="puzzle-hint" variant="outline" aria-label={attempt?.hintLevel === 2 ? 'Хід показано' : attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'} disabled={!puzzle || busy || attempt?.hintLevel === 2} onClick={hint}><span className="puzzle-hint-icon"><Lightbulb size={22} /></span><span><strong>{attempt?.hintLevel === 2 ? 'Хід показано' : attempt?.hintLevel === 1 ? 'Показати хід' : 'Підказка'}</strong><small>Якщо потрібна допомога</small></span><ArrowRight size={17} aria-hidden="true" /></Button>}
                {puzzle && <>
                    <div className="puzzle-attempt-meta" aria-label="Статус задачі"><span><b>{mistakeCount}</b> {mistakeCount === 1 ? 'помилка' : mistakeCount >= 2 && mistakeCount <= 4 ? 'помилки' : 'помилок'}</span><span>{attempt?.assisted ? 'З підказкою' : 'Без підказки'}</span></div>
                    <div className="puzzle-context-grid"><div><span>Рейтинг задачі</span><strong>{puzzle.rating}</strong></div><div><span>Тема</span><strong>{puzzle.theme}</strong></div></div>
                    <p className="puzzle-training-tip"><Sparkles size={16} aria-hidden="true" /><span>Перевір шахи, взяття та загрози.</span></p>
                </>}
            </div>}
            {loading && <p role="status" className="puzzle-next-note">Завантаження задачі…</p>}
            {(error || manifest.isError) && <div role="alert" className="puzzle-load-error">{error || 'Не вдалося завантажити базу задач.'}<Button variant="outline" onClick={() => { if (manifest.isError) void manifest.refetch(); else void loadNext(); }}>Повторити завантаження</Button></div>}
            {complete && presentedFen && <p role="status" className="puzzle-next-note">Завершуємо хід…</p>}
            {reviewReady && attempt && <PuzzleReview key={puzzle!.id} attempt={attempt} rating={progress.rating} showEvaluation={preferences.evaluation} onPreview={setPreview} blocked={themeOpen || preferencesOpen || shareOpen} actions={<div className="puzzle-complete-actions"><Button variant="outline" onClick={() => navigate('/analysis', { state: { pgn: puzzleAnalysisPgn(puzzle!, attempt!) } })}>Відкрити в аналізі</Button><Button disabled={busy} onClick={() => void loadNext()}>Наступна задача<ArrowRight size={18} /></Button></div>} />}
            {empty && <Button disabled={busy} onClick={() => void loadNext()}>Завантажити вибрану добірку</Button>}
            {sharedId && sharedHandled.current !== sharedId && <div className="puzzle-shared-note"><p>{attempt && !complete ? 'Спільна задача відкриється після завершення поточної.' : 'Відкриття спільної задачі.'}</p><Button variant="ghost" onClick={() => { setSearchParams({}, { replace: true }); setError(''); }}>Скасувати відкриття посилання</Button></div>}
        </aside>
        </div>
        <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}><DialogContent closeLabel="Закрити" className="puzzle-settings-dialog"><DialogHeader><DialogTitle>Налаштування задач</DialogTitle><DialogDescription>Оберіть вигляд дошки й зручний спосіб тренування.</DialogDescription></DialogHeader>
            <div className="puzzle-preferences-content">
                <section><h2>Вигляд</h2><label>Фон сторінки<select aria-label="Фон сторінки" value={preferences.background} onChange={event => updatePreference('background', event.target.value as PuzzlePreferences['background'])}><option value="plain">Світлий</option><option value="blue">М’який синій</option></select></label><label>Колір дошки<select aria-label="Колір дошки" value={settings.theme.id} onChange={event => { const theme = BOARD_THEMES.find(item => item.id === event.target.value); if (theme) settings.setTheme(theme); }}>{BOARD_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><label>Фігури<select aria-label="Фігури" value={settings.pieceStyle} onChange={event => settings.setPieceStyle(event.target.value as 'unicode' | 'text')}><option value="unicode">Класичні</option><option value="text">Текстові</option></select></label><label className="puzzle-switch-row"><span>Координати</span><input type="checkbox" checked={settings.showCoordinates} onChange={event => settings.setShowCoordinates(event.target.checked)} /></label></section>
                <section><h2>Тренування</h2><RatingRange key={progress.ratingRange ? `${progress.ratingRange.min}-${progress.ratingRange.max}` : 'auto'} defaultOpen={rangeOpenOnSettings} value={progress.ratingRange} disabled={busy} onChange={ratingRange => commit({ ...latest.current, ratingRange })} /><p className="puzzle-preference-note">Зміни діапазону діятимуть із наступної задачі.</p><label className="puzzle-switch-row"><span>Показувати підказки</span><input type="checkbox" checked={preferences.hints} onChange={event => updatePreference('hints', event.target.checked)} /></label><label className="puzzle-switch-row"><span>Показувати оцінку після рішення</span><input type="checkbox" checked={preferences.evaluation} onChange={event => updatePreference('evaluation', event.target.checked)} /></label></section>
                <section><h2>Звук і рух</h2><label className="puzzle-switch-row"><span>Звуки ходів</span><input type="checkbox" checked={preferences.sound} onChange={event => updatePreference('sound', event.target.checked)} /></label><label className="puzzle-switch-row"><span>Анімація ходів</span><input type="checkbox" checked={preferences.motion} onChange={event => updatePreference('motion', event.target.checked)} /></label></section>
            </div>
        </DialogContent></Dialog>
        <Dialog open={shareOpen} onOpenChange={setShareOpen}><DialogContent closeLabel="Закрити" className="max-w-sm"><DialogHeader><DialogTitle>Поділитися задачею</DialogTitle><DialogDescription>Посилання відкриє цю позицію. Розв’язання стане доступним після завершення.</DialogDescription></DialogHeader><input aria-label="Посилання на задачу" className="w-full rounded border bg-transparent p-2 text-sm" readOnly value={puzzle ? puzzleLink(puzzle.id, window.location.href) : ''} onFocus={event => event.target.select()} /><p role="status">{shareMessage}</p></DialogContent></Dialog>
    </div></div>;
}
