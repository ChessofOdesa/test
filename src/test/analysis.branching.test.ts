import { promoteVariationPath } from "@/features/analysis/branching";
import { createMoveNode, type AnalysisMoveNode } from "@/features/analysis/model";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

function nodeFrom(game: Chess, san: string, ply: number): AnalysisMoveNode {
    const fenBefore = game.fen();
    const move = game.move(san)!;
    return createMoveNode(move, fenBefore, game.fen(), ply);
}

function makeTree() {
    const game = new Chess();
    const e4 = nodeFrom(game, "e4", 1);
    const d5 = nodeFrom(game, "d5", 2);
    const e5 = nodeFrom(game, "e5", 3);

    const branchGame = new Chess(d5.fenAfter);
    const exd5 = nodeFrom(branchGame, "exd5", 3);

    const c6Game = new Chess(exd5.fenAfter);
    const c6 = nodeFrom(c6Game, "c6", 4);

    const qxd5Game = new Chess(exd5.fenAfter);
    const qxd5 = nodeFrom(qxd5Game, "Qxd5", 4);

    exd5.children = [c6, qxd5];
    d5.children = [exd5];
    return [e4, d5, e5];
}

describe("promoteVariationPath", () => {
    it("promotes a nested selected continuation to the mainline", () => {
        const result = promoteVariationPath(makeTree(), [1, 0, 1]);
        expect(result).not.toBeNull();
        expect(result!.mainline.map(node => node.san)).toEqual(["e4", "d5", "exd5", "Qxd5"]);
        expect(result!.currentPath).toEqual([3]);
    });

    it("keeps the replaced mainline tail and former primary branch as alternatives", () => {
        const result = promoteVariationPath(makeTree(), [1, 0, 1])!;
        const anchor = result.mainline[1];
        const promotedRoot = result.mainline[2];

        expect(anchor.children[0]?.san).toBe("e5");
        expect(promotedRoot.children[0]?.san).toBe("c6");
    });

    it("returns null for a mainline-only path", () => {
        expect(promoteVariationPath(makeTree(), [1])).toBeNull();
    });
});
