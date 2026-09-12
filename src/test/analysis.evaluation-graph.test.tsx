import AnalysisEvaluationGraph from "@/features/analysis/AnalysisEvaluationGraph";
import { createMoveNode, createRecord, type AnalysisRecord } from "@/features/analysis/model";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Chess } from "chess.js";
import { afterEach, describe, expect, it, vi } from "vitest";

function reviewedRecord(): AnalysisRecord {
    const game = new Chess();
    const mainline = [];
    const evals = [24, 12, 148, -92];
    const losses = [0, 12, 4, 240];
    const moves = ["e4", "e5", "Nf3", "Nc6"];

    moves.forEach((san, index) => {
        const fenBefore = game.fen();
        const move = game.move(san)!;
        const node = createMoveNode(move, fenBefore, game.fen(), index + 1);
        node.engineEval = evals[index];
        node.evalLoss = losses[index];
        node.classification = index === 3 ? "blunder" : index === 1 ? "good" : "best";
        node.bestMoveSan = index === 3 ? "Nf6" : move.san;
        mainline.push(node);
    });

    return {
        ...createRecord(),
        mainline,
        currentPath: [2],
    };
}

afterEach(cleanup);

describe("Analysis evaluation graph", () => {
    it("renders only reviewed evaluations and navigates from graph points", () => {
        const record = reviewedRecord();
        const navigate = vi.fn();
        render(<AnalysisEvaluationGraph record={record} currentPath={record.currentPath} onNavigate={navigate} />);

        expect(screen.getByLabelText("Графік оцінки")).toBeInTheDocument();
        expect(screen.getByRole("img", { name: "Зміна оцінки Stockfish протягом партії" })).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /1\. e4, оцінка/i }));
        expect(navigate).toHaveBeenCalledWith([0]);
    });

    it("marks the largest real evaluation loss as the turning point", () => {
        const record = reviewedRecord();
        const navigate = vi.fn();
        render(<AnalysisEvaluationGraph record={record} currentPath={record.currentPath} onNavigate={navigate} />);

        const turningPoint = screen.getByRole("button", { name: /Переломний момент.*2\.\.\. Nc6.*Втрата 2\.40/i });
        expect(turningPoint).toBeInTheDocument();
        expect(screen.getByText("Краще: Nf6")).toBeInTheDocument();

        fireEvent.click(turningPoint);
        expect(navigate).toHaveBeenCalledWith([3]);
    });

    it("does not invent a graph when fewer than two reviewed positions exist", () => {
        const record = reviewedRecord();
        record.mainline.slice(1).forEach(node => {
            node.engineEval = null;
            node.evalLoss = null;
        });

        render(<AnalysisEvaluationGraph record={record} currentPath={[0]} onNavigate={vi.fn()} />);
        expect(screen.getByText(/Потрібні щонайменше дві перевірені позиції/i)).toBeInTheDocument();
        expect(screen.queryByRole("img", { name: "Зміна оцінки Stockfish протягом партії" })).not.toBeInTheDocument();
    });
});
