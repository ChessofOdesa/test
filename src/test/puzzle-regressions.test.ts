import { readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { playPuzzleMove, type TrainingPuzzle } from '@/features/puzzles/model';
import { attemptFen, findNextPuzzle, finishAttempt, freshProgress, markAttemptAssisted, markAttemptWrong, readProgress, saveProgress, type Attempt } from '@/features/puzzles/training';
import { puzzleAnalysisPgn } from '@/features/puzzles/analysisPgn';
import { buildRecordFromPgn } from '@/features/analysis/model';
const puzzle = { id: 'test', fen: new Chess().fen(), solution: ['e2e4', 'e7e5', 'g1f3'], title: 'Test', theme: 'Тактика', rating: 1500 };
const attempt: Attempt = { puzzle, step: 0, wrong: false, assisted: false, hintLevel: 0, complete: false };
afterEach(() => localStorage.clear());
describe('Puzzle audit regressions', () => {
    it('accepts every immediate mating alternative in the shipped one-move puzzles', () => {
        const manifest = JSON.parse(readFileSync('public/puzzles/manifest.json', 'utf8'));
        let affected = 0;
        for (const { file } of manifest.chunks) {
            const puzzles: TrainingPuzzle[] = JSON.parse(readFileSync(`public/puzzles/${file}`, 'utf8'));
            for (const puzzle of puzzles.filter(p => p.solution.length === 1)) {
                const game = new Chess(puzzle.fen);
                let alternatives = 0;
                for (const move of game.moves({ verbose: true })) {
                    game.move(move);
                    const mate = game.isCheckmate(); game.undo();
                    const uci = move.from + move.to + (move.promotion || '');
                    if (!mate || uci === puzzle.solution[0]) continue;
                    alternatives++;
                    const result = playPuzzleMove(puzzle.fen, puzzle.solution, 0, move.from, move.to, move.promotion);
                    expect(result?.complete, puzzle.id + ':' + uci).toBe(true);
                    const done = { ...attempt, puzzle, line: result!.line, step: result!.index, complete: true };
                    saveProgress(finishAttempt(freshProgress(), done));
                    expect(attemptFen(readProgress().current!)).toBe(result!.fen);
                    expect(new Chess(result!.fen).isCheckmate()).toBe(true);
                }
                if (alternatives) affected++;
            }
        }
        expect(affected).toBeGreaterThanOrEqual(31);
    }, 60000);
    it('preserves the first mistake penalty through hints and reload, but practice begun with a hint is neutral', () => {
        const failed = markAttemptAssisted(markAttemptWrong(attempt, 'd2d4'));
        saveProgress({ ...freshProgress(), current: failed });
        expect(finishAttempt(readProgress(), { ...readProgress().current!, step: 3, complete: true }).rating).toBe(1488);
        const practice = markAttemptWrong(markAttemptAssisted(attempt), 'd2d4');
        saveProgress({ ...freshProgress(), current: practice });
        expect(finishAttempt(readProgress(), { ...readProgress().current!, step: 3, complete: true }).rating).toBe(1500);
    });
    it('compares ratings across shards and uses the index to fetch only the best matching shard', async () => {
        const manifest = { count: 2, themes: ['Тактика'], chunks: [{ file: 'one.json', count: 1, themes: ['Тактика'] }, { file: 'two.json', count: 1, themes: ['Тактика'] }] };
        const load = vi.fn(async (file: string) => [{ ...puzzle, id: file, rating: file === 'one.json' ? 1200 : 1500 }]);
        expect((await findNextPuzzle(manifest, freshProgress(), load))?.id).toBe('two.json');
        load.mockClear();
        const index = [{ id: 'one.json', file: 'one.json', theme: 'Тактика', rating: 1200 }, { id: 'two.json', file: 'two.json', theme: 'Тактика', rating: 1500 }];
        expect((await findNextPuzzle(manifest, freshProgress(), load, index))?.id).toBe('two.json');
        expect(load.mock.calls).toEqual([['two.json']]);
        expect((await findNextPuzzle(manifest, { ...freshProgress(), completed: ['two.json'] }, load, index))?.id).toBe('one.json');
    });
    it('keeps the shipped rating index consistent with every puzzle', () => {
        const manifest = JSON.parse(readFileSync('public/puzzles/manifest.json', 'utf8'));
        const index = JSON.parse(readFileSync(`public/puzzles/${manifest.indexFile}`, 'utf8'));
        const expected = manifest.chunks.flatMap(({ file }: { file: string }) => JSON.parse(readFileSync(`public/puzzles/${file}`, 'utf8')).map((p: TrainingPuzzle) => ({ id: p.id, rating: p.rating, theme: p.theme, file })));
        expect(index).toEqual(expected);
    });
    it('opens the complete solution and mistakes at their original plies in the real analysis parser', () => {
        const failed = markAttemptWrong(attempt, 'd2d4');
        const completed = { ...markAttemptWrong({ ...failed, step: 2 }, 'f1c4'), step: 3, complete: true };
        const record = buildRecordFromPgn(puzzleAnalysisPgn(puzzle, completed));
        expect(record.mainline.map(n => n.san)).toEqual(['e4', 'e5', 'Nf3']);
        expect(record.rootVariations?.[0].san).toBe('d4');
        expect(record.rootVariations?.[0].comment).toBe('Моя помилка');
        expect(record.mainline[1].children[0].san).toBe('Bc4');
        const black = { ...puzzle, fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 12', solution: ['e7e5', 'g1f3', 'b8c6'] };
        const imported = buildRecordFromPgn(puzzleAnalysisPgn(black, { ...attempt, puzzle: black, mistakes: [{ step: 0, move: 'c7c5' }] }));
        expect(imported.mainline[0].moveNumber).toBe(12);
        expect(imported.rootVariations?.[0].san).toBe('c5');
    });
});
