import { Chess } from "chess.js";
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
    indexFile?: string;
}
export function applySolutionMove(chess: Chess, uci: string) { return chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }); }
export function playPuzzleMove(fen: string, solution: string[], index: number, from: string, to: string, promotion = "q") {
    const chess = new Chess(fen), expected = solution[index];
    if (!expected)
        return null;
    try {
        const move = chess.move({ from, to, promotion });
        const actual = move.from + move.to + (move.promotion || "");
        // A legal checkmate ends the exercise even if its stored line differs.
        if (chess.isCheckmate()) {
            const line = [...solution.slice(0, index), actual];
            return { fen: chess.fen(), index: line.length, complete: true, line };
        }
        if (actual !== expected)
            return null;
        let next = index + 1;
        if (next < solution.length) {
            applySolutionMove(chess, solution[next]);
            next++;
        }
        return { fen: chess.fen(), index: next, complete: next >= solution.length, line: solution };
    }
    catch {
        return null;
    }
}
