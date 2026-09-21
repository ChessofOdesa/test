import { Chess } from 'chess.js';
import { applySolutionMove, type TrainingPuzzle, type PuzzleManifest } from './model';

export const PUZZLE_PROGRESS_KEY = 'coo.puzzles.training.v1';
export type Difficulty = 'easier' | 'normal' | 'harder';
export type Attempt = { puzzle: TrainingPuzzle; step: number; wrong: boolean; assisted: boolean; hintLevel: number; complete: boolean; line?: string[]; ratingOutcome?: 'failed' | 'assisted'; mistakes?: { step: number; move: string }[] };
export type PuzzleProgress = {
    rating: number; solved: number; clean: number; streak: number;
    completed: string[]; saved: TrainingPuzzle[];
    days: Record<string, { solved: number; delta: number }>;
    ratingRange: { min: number; max: number } | null;
    current: Attempt | null; theme: string; difficulty: Difficulty; goal: number;
};
export const freshProgress = (): PuzzleProgress => ({ rating: 1500, solved: 0, clean: 0, streak: 0, completed: [], saved: [], days: {}, current: null, ratingRange: null, theme: 'all', difficulty: 'normal', goal: 10 });
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function isPuzzle(value: unknown): value is TrainingPuzzle {
    const p = value as TrainingPuzzle;
    if (!p || typeof p.id !== 'string' || !p.id || typeof p.fen !== 'string' || typeof p.theme !== 'string' || typeof p.title !== 'string' || !Number.isFinite(p.rating) || p.rating < 0 || p.rating > 5000 || !Array.isArray(p.solution) || !p.solution.length || p.solution.length > 100) return false;
    try { const game = new Chess(p.fen); for (const move of p.solution) { if (typeof move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return false; applySolutionMove(game, move); } return true; } catch { return false; }
}
export function attemptFen(attempt: Attempt) {
    const game = new Chess(attempt.puzzle.fen);
    for (const move of (attempt.line || attempt.puzzle.solution).slice(0, attempt.step)) applySolutionMove(game, move);
    return game.fen();
}
export function readProgress(): PuzzleProgress {
    const fresh = freshProgress();
    try {
        const raw = JSON.parse(localStorage.getItem(PUZZLE_PROGRESS_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return fresh;
        const integer = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
        if (!integer(raw.rating, 4000) || raw.rating < 100 || !integer(raw.solved, 100000) || !integer(raw.clean, raw.solved) || !integer(raw.streak, raw.clean)) return fresh;
        const completed = Array.isArray(raw.completed) ? [...new Set(raw.completed.filter((id: unknown) => typeof id === 'string'))].slice(0, 100000) as string[] : [];
        if (completed.length !== raw.solved) return fresh;
        const days: PuzzleProgress['days'] = {};
        for (const [day, value] of Object.entries(raw.days || {}).slice(-366)) {
            const v = value as { solved: number; delta: number };
            if (/^\d{4}-\d{2}-\d{2}$/.test(day) && v && integer(v.solved, raw.solved) && Number.isInteger(v.delta) && Math.abs(v.delta) <= 4000) days[day] = v;
        }
        let current: Attempt | null = null;
        const a = raw.current;
        const line = a?.line || a?.puzzle?.solution;
        const validExtras = a && (!a.line || isPuzzle({ ...a.puzzle, solution: a.line })) &&
            (!a.ratingOutcome || ['failed', 'assisted'].includes(a.ratingOutcome)) &&
            (!a.mistakes || Array.isArray(a.mistakes) && a.mistakes.length <= 20 && a.mistakes.every((m: { step: number; move: string }) => {
                if (!m || !integer(m.step, a.step) || m.step % 2 !== 0 || typeof m.move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m.move)) return false;
                try { const game = new Chess(a.puzzle.fen); for (const move of line.slice(0, m.step)) applySolutionMove(game, move); applySolutionMove(game, m.move); return true; } catch { return false; }
            }));
        if (a && validExtras && isPuzzle(a.puzzle) && integer(a.step, line.length) && (a.step % 2 === 0 || a.step === line.length) && typeof a.wrong === 'boolean' && typeof a.assisted === 'boolean' && integer(a.hintLevel, 2) && (!a.hintLevel || a.assisted) && a.complete === (a.step === line.length) && completed.includes(a.puzzle.id) === a.complete) current = a;
        const range = raw.ratingRange;
        const ratingRange = range && integer(range.min, 4000) && integer(range.max, 4000) && range.min >= 100 && range.min <= range.max ? { min: range.min, max: range.max } : null;
        return { ...fresh, ratingRange, rating: raw.rating, solved: raw.solved, clean: raw.clean, streak: raw.streak, completed, days, current,
            saved: Array.isArray(raw.saved) ? raw.saved.slice(0, 500).filter(isPuzzle) : [],
            theme: typeof raw.theme === 'string' ? raw.theme : 'all', difficulty: ['easier', 'normal', 'harder'].includes(raw.difficulty) ? raw.difficulty : 'normal', goal: [5, 10, 20, 30].includes(raw.goal) ? raw.goal : 10 };
    } catch { return fresh; }
}
export function saveProgress(progress: PuzzleProgress) { try { localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; } }
export function finishAttempt(progress: PuzzleProgress, attempt: Attempt, date = new Date()): PuzzleProgress {
    if (!attempt.complete || progress.completed.includes(attempt.puzzle.id)) return progress;
    const clean = !attempt.wrong && !attempt.assisted;
    const expected = 1 / (1 + 10 ** ((attempt.puzzle.rating - progress.rating) / 400));
    const assisted = attempt.ratingOutcome === 'assisted' || !attempt.ratingOutcome && attempt.assisted && !attempt.wrong;
    const rating = Math.max(100, Math.min(4000, progress.rating + (assisted ? 0 : Math.round(24 * ((clean ? 1 : 0) - expected)))));
    const day = dayKey(date), previous = progress.days[day] || { solved: 0, delta: 0 };
    const days = { ...progress.days, [day]: { solved: previous.solved + 1, delta: previous.delta + rating - progress.rating } };
    return { ...progress, current: attempt, rating, solved: progress.solved + 1, clean: progress.clean + Number(clean), streak: clean ? progress.streak + 1 : 0,
        completed: [...progress.completed, attempt.puzzle.id], days: Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).slice(-366)) };
}
export function nearestPuzzle(puzzles: TrainingPuzzle[], progress: PuzzleProgress) {
    const target = progress.rating + ({ easier: -300, normal: 0, harder: 300 }[progress.difficulty]);
    const completed = new Set(progress.completed);
    return puzzles.filter(p => !completed.has(p.id) && inRatingRange(p.rating, progress.ratingRange) && (progress.theme === 'all' || p.theme === progress.theme))
        .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target)).find(isPuzzle) || null;
}
export type PuzzleIndexEntry = Pick<TrainingPuzzle, 'id' | 'rating' | 'theme'> & { file: string };
export async function findNextPuzzle(manifest: PuzzleManifest, progress: PuzzleProgress, load: (file: string) => Promise<TrainingPuzzle[]>, index?: PuzzleIndexEntry[]) {
    const sets = manifest.chunks.filter(set => progress.theme === 'all' || set.themes.includes(progress.theme));
    const files = new Set(sets.map(set => set.file));
    for (const file of files) if (!/^[a-zA-Z0-9_-]+\.json$/.test(file)) throw new Error('Некоректна адреса добірки');
    const target = progress.rating + ({ easier: -300, normal: 0, harder: 300 }[progress.difficulty]);
    const completed = new Set(progress.completed);
    if (index) {
        const candidates = index.filter(p => files.has(p.file) && Number.isFinite(p.rating) && !completed.has(p.id) && inRatingRange(p.rating, progress.ratingRange) && (progress.theme === 'all' || p.theme === progress.theme))
            .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target));
        const loaded = new Map<string, TrainingPuzzle[]>();
        for (const entry of candidates) {
            if (!loaded.has(entry.file)) loaded.set(entry.file, await load(entry.file));
            const puzzle = loaded.get(entry.file)!.find(p => p.id === entry.id && p.rating === entry.rating && p.theme === entry.theme && isPuzzle(p));
            if (puzzle) return puzzle;
        }
        // The complete index already exhausted the matching candidates.
        return null;
    }
    // Old manifests still work, but compare all shards instead of taking the first.
    let best: TrainingPuzzle | null = null;
    for (const set of sets) {
        const candidate = nearestPuzzle(await load(set.file), progress);
        if (candidate && (!best || Math.abs(candidate.rating - target) < Math.abs(best.rating - target))) best = candidate;
        if (best?.rating === target) break;
    }
    return best;
}

export function markAttemptWrong(attempt: Attempt, move: string): Attempt {
    const mistakes = attempt.mistakes || [];
    return { ...attempt, wrong: true, ratingOutcome: attempt.ratingOutcome || (attempt.assisted ? 'assisted' : 'failed'),
        mistakes: mistakes.some(m => m.step === attempt.step && m.move === move) ? mistakes : [...mistakes, { step: attempt.step, move }].slice(-20) };
}
export function markAttemptAssisted(attempt: Attempt): Attempt {
    return { ...attempt, assisted: true, ratingOutcome: attempt.ratingOutcome || (attempt.wrong ? 'failed' : 'assisted'), hintLevel: Math.min(2, attempt.hintLevel + 1) };
}

export function inRatingRange(rating: number, range: PuzzleProgress['ratingRange']) { return !range || rating >= range.min && rating <= range.max; }
export function lastAttemptMove(attempt: Attempt) {
    const line = attempt.line || attempt.puzzle.solution;
    const uci = attempt.step > 0 ? line[attempt.step - 1] : attempt.puzzle.setupMove;
    return uci && /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci) ? [uci.slice(0, 2), uci.slice(2, 4)] : [];
}
