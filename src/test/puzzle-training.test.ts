import { Chess } from 'chess.js';
import { afterEach, describe, expect, it } from 'vitest';
import { attemptFen, dayKey, findNextPuzzle, finishAttempt, freshProgress, isPuzzle, nearestPuzzle, readProgress, saveProgress, PUZZLE_PROGRESS_KEY, type Attempt } from '@/features/puzzles/training';
const puzzle = { id: 'a', fen: new Chess().fen(), solution: ['e2e4', 'e7e5', 'g1f3'], title: 'Test', theme: 'Тактика', rating: 1500 };
const done: Attempt = { puzzle, step: 3, wrong: false, assisted: false, hintLevel: 0, complete: true };
afterEach(() => localStorage.clear());
describe('Puzzle progress', () => {
    it('counts unique completions once, calculates Elo, accuracy and daily progress', () => {
        const now = new Date(2026, 8, 20, 12), initial = freshProgress();
        const result = finishAttempt(initial, done, now);
        expect(result.rating).toBe(1512); expect(result.clean).toBe(1); expect(result.streak).toBe(1);
        expect(result.current?.ratingBefore).toBe(1500);
        expect(result.days[dayKey(now)]).toEqual({ solved: 1, delta: 12 });
        expect(finishAttempt(result, done, now)).toBe(result);
    });
    it('does not reward retries or assisted solutions', () => {
        const failed = finishAttempt(freshProgress(), { ...done, wrong: true });
        expect(failed.rating).toBe(1488); expect(failed.clean).toBe(0); expect(failed.streak).toBe(0);
        expect(failed.current?.ratingBefore).toBe(1500);
        const assisted = finishAttempt(freshProgress(), { ...done, assisted: true });
        expect(assisted.rating).toBe(1500); expect(assisted.clean).toBe(0); expect(assisted.solved).toBe(1);
    });
    it('restores the exact partial attempt and hint/mistake flags after reload', () => {
        const state = { ...freshProgress(), current: { ...done, step: 2, complete: false, wrong: true, assisted: true, hintLevel: 1 } };
        saveProgress(state); const loaded = readProgress(); expect(loaded).toEqual(state);
        const game = new Chess(); game.move('e4'); game.move('e5'); expect(attemptFen(loaded.current!)).toBe(game.fen());
    });
    it('validates persisted results and rejects broken chess data', () => {
        const completed = finishAttempt(freshProgress(), done); saveProgress(completed); expect(readProgress()).toEqual(completed);
        localStorage.setItem(PUZZLE_PROGRESS_KEY, '{broken'); expect(readProgress()).toEqual(freshProgress());
        expect(isPuzzle({ ...puzzle, solution: ['a1a8'] })).toBe(false);
        expect(isPuzzle({ ...puzzle, fen: 'bad' })).toBe(false);
    });
    it('chooses new puzzles by theme and target difficulty without mutating the batch', () => {
        const choices = [puzzle, { ...puzzle, id: 'easy', rating: 1200 }, { ...puzzle, id: 'hard', rating: 1800 }];
        expect(nearestPuzzle(choices, { ...freshProgress(), difficulty: 'harder' })?.id).toBe('hard');
        expect(nearestPuzzle(choices, { ...freshProgress(), difficulty: 'easier' })?.id).toBe('easy');
        expect(nearestPuzzle(choices, { ...freshProgress(), theme: 'Мат' })).toBeNull();
        expect(choices[0].id).toBe('a');
    });
    it('continues across exhausted shards and terminates when no new puzzle exists', async () => {
        const manifest = { count: 2, themes: ['Тактика'], chunks: [{ file: 'one.json', count: 1, themes: ['Тактика'] }, { file: 'two.json', count: 1, themes: ['Тактика'] }] };
        const progress = finishAttempt(freshProgress(), done);
        expect((await findNextPuzzle(manifest, progress, async file => [{ ...puzzle, id: file === 'one.json' ? 'a' : 'b' }]))?.id).toBe('b');
        expect(await findNextPuzzle(manifest, progress, async () => [puzzle])).toBeNull();
    });
});
