import { afterEach, describe, expect, it, vi } from 'vitest';
import { Chess } from 'chess.js';
import { freshProgress, findNextPuzzle, nearestPuzzle, readProgress, saveProgress, lastAttemptMove } from '@/features/puzzles/training';
import { findSharedPuzzle, puzzleLink } from '@/features/puzzles/share';
const puzzle = { id: 'a', fen: new Chess().fen(), solution: ['e2e4','e7e5','g1f3'], theme: 'Тактика', title: 'A', rating: 1500 };
const puzzles = [puzzle, { ...puzzle, id:'b',rating:1600 }, { ...puzzle,id:'c',rating:1900 }, { ...puzzle,id:'d',rating:2000 }];
const manifest = { count:4, themes:['Тактика'], chunks:[{file:'one.json',count:4,themes:['Тактика']}] };
afterEach(()=>localStorage.clear());
describe('Puzzle ranges and links',()=>{
    it('applies inclusive range limits with and without an index, including empty ranges',async()=>{
        const progress={...freshProgress(),ratingRange:{min:1600,max:1900}};
        expect(nearestPuzzle(puzzles,progress)?.id).toBe('b');
        expect(nearestPuzzle(puzzles,{...progress,rating:2100})?.id).toBe('c');
        const index=puzzles.map(({id,rating,theme})=>({id,rating,theme,file:'one.json'}));
        expect((await findNextPuzzle(manifest,progress,async()=>puzzles,index))?.id).toBe('b');
        expect(await findNextPuzzle(manifest,{...progress,ratingRange:{min:1700,max:1800}},async()=>puzzles,index)).toBeNull();
        saveProgress(progress); expect(readProgress().ratingRange).toEqual(progress.ratingRange);
        saveProgress({...progress,ratingRange:{min:1900,max:1600}}); expect(readProgress().ratingRange).toBeNull();
    });
    it('does not download shards when a complete index has no rating matches', async () => {
        const load = vi.fn(async () => puzzles);
        const index = puzzles.map(({id,rating,theme}) => ({id,rating,theme,file:'one.json'}));
        expect(await findNextPuzzle(manifest, {...freshProgress(), ratingRange:{min:3000,max:3100}}, load, index)).toBeNull();
        expect(load).not.toHaveBeenCalled();
    });
    it('shares only an ID, resolves it independently of filters and rejects missing or invalid IDs',async()=>{
        const link=new URL(puzzleLink('a','https://example.test/puzzles?fen=secret#answer'));
        expect(link.toString()).toBe('https://example.test/puzzles?puzzle=a');
        const load=vi.fn(async()=>puzzles);
        const index=[{id:'a',rating:1500,theme:'Тактика',file:'one.json'}];
        expect((await findSharedPuzzle('a',manifest,index,load)).id).toBe('a');
        load.mockClear(); await expect(findSharedPuzzle('../bad',manifest,index,load)).rejects.toThrow();
        await expect(findSharedPuzzle('missing',manifest,index,load)).rejects.toThrow('не знайдено');
        expect(load).not.toHaveBeenCalled();
    });
    it('marks setup, opponent reply and final solver moves correctly',()=>{
        const attempt={puzzle:{...puzzle,setupMove:'a7a6'},step:0,complete:false,wrong:false,assisted:false,hintLevel:0};
        expect(lastAttemptMove(attempt)).toEqual(['a7','a6']);
        expect(lastAttemptMove({...attempt,step:2})).toEqual(['e7','e5']);
        expect(lastAttemptMove({...attempt,step:3})).toEqual(['g1','f3']);
    });
});
