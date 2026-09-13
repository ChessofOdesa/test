import AnalysisMoveTree from "@/features/analysis/AnalysisMoveTree";
import { createMoveNode, createRecord, type AnalysisRecord } from "@/features/analysis/model";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Chess } from "chess.js";
import { afterEach, describe, expect, it, vi } from "vitest";

function reviewedRecord(): AnalysisRecord {
    const game = new Chess();
    const mainline = [];

    ["e4", "d5", "e5"].forEach((san, index) => {
        const fenBefore = game.fen();
        const move = game.move(san)!;
        mainline.push(createMoveNode(move, fenBefore, game.fen(), index + 1));
    });

    const selected = mainline[2];
    selected.classification = "mistake";
    selected.engineEval = -76;
    selected.evalLoss = 132;
    selected.bestMoveSan = "exd5";
    selected.alternatives = ["exd5", "Qxd5", "Nc3"];

    return {
        ...createRecord(),
        mainline,
        currentPath: [2],
    };
}

afterEach(cleanup);

describe("Analysis reviewed best-move action", () => {
    it("uses the board-preview callback when it is available", () => {
        const previewBestMove = vi.fn();
        const openEngine = vi.fn();
        render(
            <AnalysisMoveTree
                record={reviewedRecord()}
                setRecord={vi.fn() as never}
                onNavigate={vi.fn()}
                onOpenEngine={openEngine}
                onPreviewBestMove={previewBestMove}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Краще: exd5/i }));
        expect(previewBestMove).toHaveBeenCalledTimes(1);
        expect(openEngine).not.toHaveBeenCalled();
    });

    it("keeps Engine as a safe fallback when preview handling is not supplied", () => {
        const openEngine = vi.fn();
        render(
            <AnalysisMoveTree
                record={reviewedRecord()}
                setRecord={vi.fn() as never}
                onNavigate={vi.fn()}
                onOpenEngine={openEngine}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Краще: exd5/i }));
        expect(openEngine).toHaveBeenCalledTimes(1);
    });
});
