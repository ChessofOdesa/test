import {
    analysisNavigationLabel,
    lastAnalysisPath,
    nextAnalysisPath,
    previousAnalysisPath,
} from "@/features/analysis/navigation";
import { createMoveNode, createRecord, type AnalysisRecord } from "@/features/analysis/model";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

function makeRecord(): AnalysisRecord {
    const game = new Chess();
    const mainline = [];

    const play = (san: string, ply: number) => {
        const fenBefore = game.fen();
        const move = game.move(san)!;
        const node = createMoveNode(move, fenBefore, game.fen(), ply);
        mainline.push(node);
        return node;
    };

    play("e4", 1);
    const d5 = play("d5", 2);
    play("e5", 3);

    const branch = new Chess(d5.fenAfter);
    const exd5Before = branch.fen();
    const exd5Move = branch.move("exd5")!;
    const exd5 = createMoveNode(exd5Move, exd5Before, branch.fen(), 3);

    const c6Before = branch.fen();
    const c6Move = branch.move("c6")!;
    const c6 = createMoveNode(c6Move, c6Before, branch.fen(), 4);
    exd5.children.push(c6);

    const alternate = new Chess(exd5.fenAfter);
    const qxd5Before = alternate.fen();
    const qxd5Move = alternate.move("Qxd5")!;
    const qxd5 = createMoveNode(qxd5Move, qxd5Before, alternate.fen(), 4);
    exd5.children.push(qxd5);
    d5.children.push(exd5);

    return {
        ...createRecord(),
        mainline,
        currentPath: [1],
    };
}

describe("Analysis active-line navigation", () => {
    it("keeps mainline next/last navigation on the mainline", () => {
        const record = makeRecord();
        expect(nextAnalysisPath(record, [1])).toEqual([2]);
        expect(lastAnalysisPath(record, [1])).toEqual([2]);
        expect(analysisNavigationLabel(record, [1])).toBe("2 / 3");
    });

    it("follows the selected variation primary continuation", () => {
        const record = makeRecord();
        expect(previousAnalysisPath(record, [1, 0])).toEqual([1]);
        expect(nextAnalysisPath(record, [1, 0])).toEqual([1, 0, 0]);
        expect(lastAnalysisPath(record, [1, 0])).toEqual([1, 0, 0]);
        expect(analysisNavigationLabel(record, [1, 0])).toBe("Варіант 1 / 2");
        expect(analysisNavigationLabel(record, [1, 0, 0])).toBe("Варіант 2 / 2");
    });

    it("does not jump from a finished variation back into DFS siblings", () => {
        const record = makeRecord();
        expect(nextAnalysisPath(record, [1, 0, 0])).toBeNull();
        expect(previousAnalysisPath(record, [1, 0, 0])).toEqual([1, 0]);
        expect(nextAnalysisPath(record, [1, 0, 1])).toBeNull();
        expect(previousAnalysisPath(record, [1, 0, 1])).toEqual([1, 0]);
    });

    it("moves between start and the first mainline move without entering branches", () => {
        const record = makeRecord();
        expect(nextAnalysisPath(record, null)).toEqual([0]);
        expect(previousAnalysisPath(record, [0])).toBeNull();
        expect(analysisNavigationLabel(record, null)).toBe("0 / 3");
    });
});
