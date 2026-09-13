import { buildSanLinePreview } from "@/features/analysis/preview";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

describe("Analysis SAN preview", () => {
    it("builds board positions for a stored Stockfish SAN line", () => {
        const preview = buildSanLinePreview(new Chess().fen(), ["e4", "e5", "Nf3", "Nc6"]);
        expect(preview?.moves).toEqual(["e4", "e5", "Nf3", "Nc6"]);
        expect(preview?.fens).toHaveLength(4);
        expect(preview?.fens.at(-1)).toContain(" w ");
    });

    it("stops safely at the first invalid SAN instead of inventing positions", () => {
        const preview = buildSanLinePreview(new Chess().fen(), ["e4", "not-a-move", "e5"]);
        expect(preview?.moves).toEqual(["e4"]);
        expect(preview?.fens).toHaveLength(1);
    });

    it("returns null when no legal preview move can be created", () => {
        expect(buildSanLinePreview(new Chess().fen(), ["not-a-move"])).toBeNull();
        expect(buildSanLinePreview(new Chess().fen(), [])).toBeNull();
    });
});
