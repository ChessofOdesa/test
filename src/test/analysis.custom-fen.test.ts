import { buildRecordFromPgn, createMoveNode } from "@/features/analysis/model";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

describe("custom FEN move numbering", () => {
    it("uses the FEN fullmove number when creating a black move", () => {
        const game = new Chess("4k3/8/8/8/8/8/8/4K3 b - - 0 17");
        const before = game.fen();
        const move = game.move("Kd7")!;
        const node = createMoveNode(move, before, game.fen(), 1);

        expect(node.color).toBe("b");
        expect(node.moveNumber).toBe(17);
    });

    it("keeps move numbers from a setup FEN PGN", () => {
        const pgn = [
            '[SetUp "1"]',
            '[FEN "4k3/8/8/8/8/8/8/4K3 b - - 0 17"]',
            '[Result "*"]',
            '',
            '17... Kd7 18. Kf2 *',
        ].join("\n");

        const record = buildRecordFromPgn(pgn);
        expect(record.mainline.map(node => [node.moveNumber, node.color, node.san])).toEqual([
            [17, "b", "Kd7"],
            [18, "w", "Kf2"],
        ]);
    });
});
