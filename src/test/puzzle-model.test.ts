import { playPuzzleMove } from "@/features/puzzles/model";
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
