import { buildAnalysisPgn } from "@/features/analysis/pgnTree";
import { createMoveNode, createRecord } from "@/features/analysis/model";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

describe("Analysis PGN tree export", () => {
    it("keeps comments and user branches in exported PGN", () => {
        const game = new Chess();
        const e4Before = game.fen();
        const e4Move = game.move("e4")!;
        const e4 = createMoveNode(e4Move, e4Before, game.fen(), 1);
        const d5Before = game.fen();
        const d5Move = game.move("d5")!;
        const d5 = createMoveNode(d5Move, d5Before, game.fen(), 2);
        const e5Before = game.fen();
        const e5Move = game.move("e5")!;
        const e5 = createMoveNode(e5Move, e5Before, game.fen(), 3);

        const branch = new Chess(d5.fenAfter);
        const branchBefore = branch.fen();
        const exd5Move = branch.move("exd5")!;
        const exd5 = createMoveNode(exd5Move, branchBefore, branch.fen(), 3);
        exd5.comment = "Альтернативний план";
        d5.children.push(exd5);

        const record = createRecord();
        record.mainline = [e4, d5, e5];
        const pgn = buildAnalysisPgn(record);

        expect(pgn).toContain("1. e4 d5");
        expect(pgn).toContain("(2. exd5 {Альтернативний план})");
        expect(pgn).toContain("2. e5");
    });
});
