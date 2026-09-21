import { isPuzzle, type PuzzleIndexEntry } from './training';
import type { PuzzleManifest, TrainingPuzzle } from './model';
export function puzzleLink(id: string, location: string) {
    const url = new URL(location); url.search = ''; url.hash = ''; url.searchParams.set('puzzle', id); return url.toString();
}
export async function findSharedPuzzle(id: string, manifest: PuzzleManifest, index: PuzzleIndexEntry[] | undefined, load: (file: string) => Promise<TrainingPuzzle[]>) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new Error('Некоректне посилання на задачу.');
    const file = index?.find(p => p.id === id)?.file;
    if (index && !file) throw new Error('Задачу з цього посилання не знайдено.');
    for (const set of manifest.chunks.filter(set => !file || set.file === file)) {
        if (!/^[a-zA-Z0-9_-]+\.json$/.test(set.file)) throw new Error('Некоректна адреса добірки');
        const puzzle = (await load(set.file)).find(p => p.id === id);
        if (puzzle && isPuzzle(puzzle)) return puzzle;
    }
    throw new Error('Задачу з цього посилання не знайдено.');
}
