import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import { analyzeFenWithStockfish } from '@/lib/stockfish';
import { reviewPuzzle } from '@/features/puzzles/review';
import { PuzzleReview } from '@/features/puzzles/PuzzleReview';
import type { Attempt } from '@/features/puzzles/training';
vi.mock('@/lib/stockfish', () => ({ analyzeFenWithStockfish: vi.fn() }));
const attempt: Attempt = { puzzle: { id: 'a', fen: new Chess().fen(), solution: ['e2e4','e7e5','g1f3'], theme: 'Тактика', title: 'Test', rating: 1500 }, step: 3, complete: true, wrong: true, assisted: false, hintLevel: 0, mistakes: [{step: 0, move: 'd2d4'}] };
const result = { bestmove: 'e2e4', pv: ['e2e4','e7e5','g1f3'], scoreCp: 32, scoreMate: null, depth: 16, raw: [] };
beforeEach(() => vi.mocked(analyzeFenWithStockfish).mockReset().mockResolvedValue(result));
afterEach(cleanup);
describe('Puzzle engine review', () => {
    it('keeps the answer locked before completion and refuses shallow or broken engine lines', async () => {
        await expect(reviewPuzzle({ ...attempt, complete: false }, null, new AbortController().signal)).rejects.toThrow('Спочатку');
        expect(analyzeFenWithStockfish).not.toHaveBeenCalled();
        for (const invalid of [{ ...result, depth: 8 }, { ...result, pv: ['a1a8'] }]) {
            vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce(invalid);
            await expect(reviewPuzzle(attempt, null, new AbortController().signal)).rejects.toThrow();
        }
    });
    it('explains the idea, previews any ply on the existing board, and replays an error plus the engine response', async () => {
        const preview = vi.fn(); render(<PuzzleReview attempt={attempt} onPreview={preview} />);
        await screen.findByText(/Варіант Stockfish починається з e4/);
        fireEvent.click(screen.getByRole('button', { name: 'e5' }));
        expect(preview.mock.lastCall?.[0].squares).toEqual(['e7','e5']);
        const game = new Chess(preview.mock.lastCall?.[0].fen); expect(game.get('e5')?.color).toBe('b');
        fireEvent.click(screen.getByRole('button', { name: 'До розв’язання' })); expect(preview.mock.lastCall?.[0]).toBeNull();
        vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce({ ...result, bestmove:'d7d5', pv:['d7d5','c2c4'],scoreCp:-80 });
        fireEvent.click(screen.getByRole('button', { name: 'Помилка d4' }));
        await screen.findByText(/Після d4 Stockfish знаходить відповідь d5/);
        fireEvent.click(screen.getByRole('button', { name: 'd4' }));
        expect(preview.mock.lastCall?.[0].squares).toEqual(['d2','d4']);
    });
    it('cancels a pending review when leaving and offers retry on a worker failure', async () => {
        vi.mocked(analyzeFenWithStockfish).mockRejectedValueOnce(new Error('offline'));
        const view=render(<PuzzleReview attempt={attempt} onPreview={vi.fn()} />);
        await screen.findByText('offline');
        let signal: AbortSignal | undefined;
        vi.mocked(analyzeFenWithStockfish).mockImplementationOnce(async (_fen,_depth,_output,_timeout,options) => { signal=options?.signal; return new Promise(()=>{}); });
        fireEvent.click(screen.getByRole('button', { name:'Повторити розбір' }));
        await waitFor(()=>expect(signal).toBeDefined()); view.unmount(); expect(signal?.aborted).toBe(true);
    });
});
