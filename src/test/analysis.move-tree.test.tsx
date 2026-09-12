import AnalysisMoveTree from "@/features/analysis/AnalysisMoveTree";
import { buildAnalysisPgn } from "@/features/analysis/pgnTree";
import { createMoveNode, createRecord, type AnalysisRecord } from "@/features/analysis/model";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Chess } from "chess.js";
import { afterEach, describe, expect, it, vi } from "vitest";

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

    const branchGame = new Chess(d5.fenAfter);
    const branchBefore = branchGame.fen();
    const exd5Move = branchGame.move("exd5")!;
    const exd5 = createMoveNode(exd5Move, branchBefore, branchGame.fen(), 3);
    exd5.comment = "Тут я перевіряв альтернативу.";

    const c6Before = branchGame.fen();
    const c6Move = branchGame.move("c6")!;
    const c6 = createMoveNode(c6Move, c6Before, branchGame.fen(), 4);
    exd5.children.push(c6);
    d5.children.push(exd5);

    return {
        ...createRecord(),
        headers: { White: "White", Black: "Black", Result: "*" },
        mainline,
        currentPath: [2],
    };
}

afterEach(cleanup);

describe("Analysis move tree", () => {
    it("renders the main game as move pairs and inserts user variations inline", () => {
        const record = makeRecord();
        render(
            <AnalysisMoveTree
                record={record}
                setRecord={vi.fn() as never}
                onNavigate={vi.fn()}
                onOpenEngine={vi.fn()}
            />,
        );

        expect(screen.getByText("2 ходи · 1 варіант")).toBeInTheDocument();
        expect(screen.getByText("Основна партія")).toBeInTheDocument();
        expect(screen.getByText("Ваш варіант")).toBeInTheDocument();
        expect(screen.getByText("exd5")).toBeInTheDocument();
        expect(screen.getByText("c6")).toBeInTheDocument();
        expect(screen.queryByText("Власні варіанти")).not.toBeInTheDocument();
    });

    it("uses the same navigation callback for mainline and variation moves", () => {
        const record = makeRecord();
        const navigate = vi.fn();
        render(
            <AnalysisMoveTree
                record={record}
                setRecord={vi.fn() as never}
                onNavigate={navigate}
                onOpenEngine={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByText("exd5"));
        expect(navigate).toHaveBeenCalledWith([1, 0]);
        fireEvent.click(screen.getByText("e5"));
        expect(navigate).toHaveBeenCalledWith([2]);
    });

    it("shows a clear return-to-mainline control while a variation is selected", () => {
        const record = makeRecord();
        record.currentPath = [1, 0];
        const navigate = vi.fn();
        render(
            <AnalysisMoveTree
                record={record}
                setRecord={vi.fn() as never}
                onNavigate={navigate}
                onOpenEngine={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Основна лінія/i }));
        expect(navigate).toHaveBeenCalledWith([2]);
    });

    it("serializes comments and user variations instead of dropping them from PGN", () => {
        const pgn = buildAnalysisPgn(makeRecord());
        expect(pgn).toContain("1. e4 d5");
        expect(pgn).toContain("(2. exd5");
        expect(pgn).toContain("Тут я перевіряв альтернативу.");
        expect(pgn).toContain("2... c6");
    });
});

it("autoplays the selected variation without jumping back to the mainline", () => {
    vi.useFakeTimers();
    try {
        const record = makeRecord();
        record.currentPath = [1, 0];
        const navigate = vi.fn();
        render(<AnalysisMoveTree record={record} setRecord={vi.fn()} onNavigate={navigate} onOpenEngine={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Auto-play партії' }));
        act(() => vi.advanceTimersByTime(1000));
        expect(navigate).toHaveBeenCalledWith([1, 0, 0]);
    } finally { vi.useRealTimers(); }
});
