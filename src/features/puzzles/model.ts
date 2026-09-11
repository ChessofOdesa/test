import { Chess } from "chess.js";

export type PuzzleMode = "classic" | "rush" | "survival";

export interface TrainingPuzzle {
    id: string;
    fen: string;
    solution: string[];
    title: string;
    theme: string;
    rating: number;
}

export interface PuzzleSet {
    file: string;
    count: number;
    themes: string[];
}

export interface PuzzleManifest {
    count: number;
    themes: string[];
    chunks: PuzzleSet[];
}

export function applySolutionMove(chess: Chess, uci: string) {
    return chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci[4],
    });
}

export function playPuzzleMove(
    fen: string,
    solution: string[],
    index: number,
    from: string,
    to: string,
    promotion = "q",
) {
    const chess = new Chess(fen);
    const expected = solution[index];

    if (!expected) return null;

    try {
        const move = chess.move({ from, to, promotion });
        const actual = move.from + move.to + (move.promotion || "");

        if (actual !== expected) return null;

        let next = index + 1;
        if (next < solution.length) {
            applySolutionMove(chess, solution[next]);
            next += 1;
        }

        return {
            fen: chess.fen(),
            index: next,
            complete: next >= solution.length,
        };
    } catch {
        return null;
    }
}

function seededRandom(seed: number) {
    let value = seed || 1;
    return () => {
        value |= 0;
        value = (value + 0x6d2b79f5) | 0;
        let t = Math.imul(value ^ (value >>> 15), 1 | value);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function puzzleSeed(puzzles: TrainingPuzzle[], seed: number) {
    let hash = seed | 0;
    for (const puzzle of puzzles) {
        for (let index = 0; index < puzzle.id.length; index += 1) {
            hash = Math.imul(hash ^ puzzle.id.charCodeAt(index), 16777619);
        }
    }
    return hash >>> 0;
}

export function buildPuzzleQueue(puzzles: TrainingPuzzle[], mode: PuzzleMode, seed = 1) {
    const queue = [...puzzles];

    if (mode === "survival") {
        return queue.sort((left, right) => left.rating - right.rating || left.id.localeCompare(right.id));
    }

    const random = seededRandom(puzzleSeed(queue, seed));
    for (let index = queue.length - 1; index > 0; index -= 1) {
        const target = Math.floor(random() * (index + 1));
        [queue[index], queue[target]] = [queue[target], queue[index]];
    }

    return queue;
}

export function sessionSuccessRate(solved: number, failed: number) {
    const total = solved + failed;
    if (!total) return 0;
    return Math.round((solved / total) * 100);
}
