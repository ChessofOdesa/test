import { Chess } from 'chess.js';
import { applySolutionMove, type TrainingPuzzle, type PuzzleManifest } from './model';

export const PUZZLE_PROGRESS_KEY = 'coo.puzzles.training.v1';
export type Difficulty = 'easier' | 'normal' | 'harder';
export type Attempt = { puzzle: TrainingPuzzle; step: number; wrong: boolean; assisted: boolean; hintLevel: number; complete: boolean };
export type PuzzleProgress = {
    rating: number; solved: number; clean: number; streak: number;
    completed: string[]; saved: TrainingPuzzle[];
    days: Record<string, { solved: number; delta: number }>;
    current: Attempt | null; theme: string; difficulty: Difficulty; goal: number;
};
export const freshProgress = (): PuzzleProgress => ({ rating: 1500, solved: 0, clean: 0, streak: 0, completed: [], saved: [], days: {}, current: null, theme: 'all', difficulty: 'normal', goal: 10 });
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function isPuzzle(value: unknown): value is TrainingPuzzle {
    const p = value as TrainingPuzzle;
    if (!p || typeof p.id !== 'string' || !p.id || typeof p.fen !== 'string' || typeof p.theme !== 'string' || typeof p.title !== 'string' || !Number.isFinite(p.rating) || p.rating < 0 || p.rating > 5000 || !Array.isArray(p.solution) || !p.solution.length || p.solution.length > 100) return false;
    try { const game = new Chess(p.fen); for (const move of p.solution) { if (typeof move !== 'string' || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) return false; applySolutionMove(game, move); } return true; } catch { return false; }
}
export function attemptFen(attempt: Attempt) {
    const game = new Chess(attempt.puzzle.fen);
    for (const move of attempt.puzzle.solution.slice(0, attempt.step)) applySolutionMove(game, move);
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
        if (a && isPuzzle(a.puzzle) && integer(a.step, a.puzzle.solution.length) && (a.step % 2 === 0 || a.step === a.puzzle.solution.length) && typeof a.wrong === 'boolean' && typeof a.assisted === 'boolean' && integer(a.hintLevel, 2) && (!a.hintLevel || a.assisted) && a.complete === (a.step === a.puzzle.solution.length) && completed.includes(a.puzzle.id) === a.complete) current = a;
        return { ...fresh, rating: raw.rating, solved: raw.solved, clean: raw.clean, streak: raw.streak, completed, days, current,
            saved: Array.isArray(raw.saved) ? raw.saved.slice(0, 500).filter(isPuzzle) : [],
            theme: typeof raw.theme === 'string' ? raw.theme : 'all', difficulty: ['easier', 'normal', 'harder'].includes(raw.difficulty) ? raw.difficulty : 'normal', goal: [5, 10, 20, 30].includes(raw.goal) ? raw.goal : 10 };
    } catch { return fresh; }
}
export function saveProgress(progress: PuzzleProgress) { try { localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; } }
export function finishAttempt(progress: PuzzleProgress, attempt: Attempt, date = new Date()): PuzzleProgress {
    if (!attempt.complete || progress.completed.includes(attempt.puzzle.id)) return progress;
    const clean = !attempt.wrong && !attempt.assisted;
    const expected = 1 / (1 + 10 ** ((attempt.puzzle.rating - progress.rating) / 400));
    const rating = Math.max(100, Math.min(4000, progress.rating + (attempt.assisted ? 0 : Math.round(24 * ((clean ? 1 : 0) - expected)))));
    const day = dayKey(date), previous = progress.days[day] || { solved: 0, delta: 0 };
    const days = { ...progress.days, [day]: { solved: previous.solved + 1, delta: previous.delta + rating - progress.rating } };
    return { ...progress, current: attempt, rating, solved: progress.solved + 1, clean: progress.clean + Number(clean), streak: clean ? progress.streak + 1 : 0,
        completed: [...progress.completed, attempt.puzzle.id], days: Object.fromEntries(Object.entries(days).sort(([a], [b]) => a.localeCompare(b)).slice(-366)) };
}
export function nearestPuzzle(puzzles: TrainingPuzzle[], progress: PuzzleProgress) {
    const target = progress.rating + ({ easier: -300, normal: 0, harder: 300 }[progress.difficulty]);
    const completed = new Set(progress.completed);
    return puzzles.filter(p => !completed.has(p.id) && (progress.theme === 'all' || p.theme === progress.theme))
        .sort((a, b) => Math.abs(a.rating - target) - Math.abs(b.rating - target)).find(isPuzzle) || null;
}
export async function findNextPuzzle(manifest: PuzzleManifest, progress: PuzzleProgress, load: (file: string) => Promise<TrainingPuzzle[]>) {
    for (const set of manifest.chunks.filter(set => progress.theme === 'all' || set.themes.includes(progress.theme))) {
        if (!/^[a-zA-Z0-9_-]+\.json$/.test(set.file)) throw new Error('Некоректна адреса добірки');
        const candidate = nearestPuzzle(await load(set.file), progress);
        if (candidate) return candidate;
    }
    return null;
}
