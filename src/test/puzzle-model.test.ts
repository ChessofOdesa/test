import { buildPuzzleQueue, playPuzzleMove, sessionSuccessRate, type TrainingPuzzle } from "@/features/puzzles/model";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

describe("Puzzle line execution", () => {
    it("keeps the solver's first move and plays the reply from the updated position", () => {
        const result = playPuzzleMove(new Chess().fen(), ["e2e4", "e7e5", "g1f3"], 0, "e2", "e4");
        expect(result?.index).toBe(2);
        expect(result?.complete).toBe(false);

        const board = new Chess(result!.fen);
        expect(board.get("e4")?.type).toBe("p");
        expect(board.get("e5")?.color).toBe("b");
        expect(playPuzzleMove(result!.fen, ["e2e4", "e7e5", "g1f3"], 2, "g1", "f3")?.complete).toBe(true);
    });

    it("rejects a legal but incorrect answer and supports underpromotion", () => {
        expect(playPuzzleMove(new Chess().fen(), ["e2e4"], 0, "d2", "d4")).toBeNull();
        const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
        expect(playPuzzleMove(fen, ["a7a8n"], 0, "a7", "a8", "q")).toBeNull();
        expect(playPuzzleMove(fen, ["a7a8n"], 0, "a7", "a8", "n")?.complete).toBe(true);
    });
});

describe("Puzzle training sessions", () => {
    const puzzles: TrainingPuzzle[] = [
        { id: "hard", fen: new Chess().fen(), solution: ["e2e4"], title: "Hard", theme: "Тактика", rating: 2100 },
        { id: "easy", fen: new Chess().fen(), solution: ["e2e4"], title: "Easy", theme: "Тактика", rating: 900 },
        { id: "medium", fen: new Chess().fen(), solution: ["e2e4"], title: "Medium", theme: "Тактика", rating: 1500 },
    ];

    it("orders survival puzzles from easier to harder", () => {
        expect(buildPuzzleQueue(puzzles, "survival", 1).map(puzzle => puzzle.id)).toEqual(["easy", "medium", "hard"]);
    });

    it("uses a stable shuffled queue for timed and classic sessions", () => {
        const first = buildPuzzleQueue(puzzles, "rush", 42).map(puzzle => puzzle.id);
        const second = buildPuzzleQueue(puzzles, "rush", 42).map(puzzle => puzzle.id);
        expect(first).toEqual(second);
        expect(first).toHaveLength(3);
        expect(new Set(first)).toEqual(new Set(["hard", "easy", "medium"]));
    });

    it("derives success rate only from completed session results", () => {
        expect(sessionSuccessRate(0, 0)).toBe(0);
        expect(sessionSuccessRate(7, 3)).toBe(70);
    });
});
