import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { analyzeFenWithStockfish, type AnalyzeResult } from '@/lib/stockfish';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import type { Attempt } from '@/features/puzzles/training';
vi.mock('@/lib/stockfish', () => ({ analyzeFenWithStockfish: vi.fn() }));
const attempt: Attempt = { puzzle: { id: 'a', fen: new Chess().fen(), solution: ['e2e4', 'e7e5', 'g1f3'], theme: 'Тактика', title: 'Test', rating: 1500 }, step: 0, wrong: false, assisted: false, hintLevel: 0, complete: false };
const result = (scoreCp: number, pv = ['d7d5', 'c2c4']): AnalyzeResult => ({ bestmove: pv[0], pv, scoreCp, scoreMate: null, raw: [], depth: 16 });
const run = () => verifyAlternative(attempt, 'd2d4', new AbortController().signal);
beforeEach(() => vi.mocked(analyzeFenWithStockfish).mockReset());
describe('Stockfish alternative verification', () => {
    it('continues an equivalent legal line without completing a multi-move exercise early', async () => {
        vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce(result(80)).mockResolvedValueOnce(result(60));
        const verified = await run();
        expect(verified?.line).toEqual(['d2d4', 'd7d5', 'c2c4']);
        expect(verified?.index).toBe(2); expect(verified?.complete).toBe(false);
        expect(new Chess(verified!.fen).get('d5')?.color).toBe('b');
    });
    it('rejects a confirmed inferior move and handles Black perspective correctly', async () => {
        vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce(result(80)).mockResolvedValueOnce(result(-100));
        expect(await run()).toBeNull();
        const black = { ...attempt, puzzle: { ...attempt.puzzle, fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', solution: ['e7e5', 'g1f3', 'b8c6'] } };
        vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce(result(-80)).mockResolvedValueOnce(result(-60, ['g1f3', 'd7d6']));
        expect((await verifyAlternative(black, 'c7c5', new AbortController().signal))?.line).toEqual(['c7c5', 'g1f3', 'd7d6']);
    });
    it('does not decide from shallow, missing, illegal, or incomplete engine output', async () => {
        for (const bad of [{ ...result(60), depth: 8 }, { ...result(60), scoreCp: null }, result(60, ['a8a1']), result(60, [])]) {
            vi.mocked(analyzeFenWithStockfish).mockResolvedValueOnce(result(80)).mockResolvedValueOnce(bad);
            await expect(run()).rejects.toThrow();
        }
    });
    it('propagates engine errors and cancellation without recording a wrong answer', async () => {
        vi.mocked(analyzeFenWithStockfish).mockRejectedValueOnce(new Error('offline'));
        await expect(run()).rejects.toThrow('offline');
        const controller = new AbortController();
        vi.mocked(analyzeFenWithStockfish).mockImplementationOnce(async () => { controller.abort(); return result(80); });
        await expect(verifyAlternative(attempt, 'd2d4', controller.signal)).rejects.toThrow('Cancelled');
    });
});
