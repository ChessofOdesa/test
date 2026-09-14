import AnalysisMoveTree from "@/features/analysis/AnalysisMoveTree";
import { buildAnalysisPgn } from "@/features/analysis/pgnTree";
import { createMoveNode, createRecord, type AnalysisRecord } from "@/features/analysis/model";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
    it("renders paired mainline moves and compact inline variations without a visible variation label", () => {
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
        expect(screen.queryByText("Ваш варіант")).not.toBeInTheDocument();
        expect(screen.queryByText("Вкладений варіант")).not.toBeInTheDocument();
        expect(screen.getByText("exd5")).toBeInTheDocument();
        expect(screen.getByText("c6")).toBeInTheDocument();
        expect(screen.queryByText("Власні варіанти")).not.toBeInTheDocument();
    });

    it("keeps one selected-move inspector above the move list, including variation comments", () => {
        const record = makeRecord();
        record.currentPath = [1, 0];
        render(
            <AnalysisMoveTree
                record={record}
                setRecord={vi.fn() as never}
                onNavigate={vi.fn()}
                onOpenEngine={vi.fn()}
            />,
        );

        const inspector = screen.getByLabelText("Вибраний хід");
        expect(screen.getAllByLabelText("Вибраний хід")).toHaveLength(1);
        expect(within(inspector).getByText("2.exd5")).toBeInTheDocument();
        expect(within(inspector).getByText("Варіант")).toBeInTheDocument();
        expect(within(inspector).getByText("Тут я перевіряв альтернативу.")).toBeInTheDocument();
    });

    it("keeps variation branches visible when the variations-only filter is selected", () => {
        const record = makeRecord();
        render(
            <AnalysisMoveTree
                record={record}
                setRecord={vi.fn() as never}
                onNavigate={vi.fn()}
                onOpenEngine={vi.fn()}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Згорнути варіанти" }));
        expect(screen.queryByText("exd5")).not.toBeInTheDocument();

        fireEvent.keyDown(screen.getByRole("button", { name: "Фільтр ходів" }), { key: "Enter" });
        fireEvent.click(screen.getByRole("menuitemradio", { name: "Тільки варіанти" }));

        const moveList = screen.getByLabelText("Список ходів");
        expect(within(moveList).getByText("exd5")).toBeInTheDocument();
        expect(within(moveList).getByText("c6")).toBeInTheDocument();
        expect(within(moveList).queryByText("e5")).not.toBeInTheDocument();
        expect(screen.getByText("Тільки варіанти")).toBeInTheDocument();
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

it("filters moves by the explicitly selected player color", () => {
    const record = makeRecord();
    render(<AnalysisMoveTree record={record} setRecord={vi.fn()} onNavigate={vi.fn()} onOpenEngine={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Фільтр ходів' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Тільки мої ходи' }));
    const list = within(screen.getByLabelText('Список ходів'));
    expect(list.getByText('e4')).toBeInTheDocument();
    expect(list.queryByText('d5')).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Мій колір' }), { target: { value: 'b' } });
    expect(list.getByText('d5')).toBeInTheDocument();
    expect(list.queryByText('e4')).not.toBeInTheDocument();
    expect(list.getByText('c6')).toBeInTheDocument();
});

it("suspends autoplay while a parent dialog is open and resumes afterward", () => {
    vi.useFakeTimers();
    try {
        const record = makeRecord(); record.currentPath = null;
        const onNavigate = vi.fn(), setRecord = vi.fn(), onOpenEngine = vi.fn();
        const view = render(<AnalysisMoveTree record={record} setRecord={setRecord} onNavigate={onNavigate} onOpenEngine={onOpenEngine} />);
        fireEvent.click(screen.getByRole('button', { name: 'Auto-play партії' }));
        view.rerender(<AnalysisMoveTree record={record} setRecord={setRecord} onNavigate={onNavigate} onOpenEngine={onOpenEngine} suspended />);
        act(() => { vi.advanceTimersByTime(2000); });
        expect(onNavigate).not.toHaveBeenCalled();
        view.rerender(<AnalysisMoveTree record={record} setRecord={setRecord} onNavigate={onNavigate} onOpenEngine={onOpenEngine} />);
        act(() => { vi.advanceTimersByTime(1100); });
        expect(onNavigate).toHaveBeenCalledWith([0]);
    } finally { vi.useRealTimers(); }
});

it("hides the ineffective global collapse action while branch focus is enabled", () => {
    render(<AnalysisMoveTree record={makeRecord()} setRecord={vi.fn()} onNavigate={vi.fn()} onOpenEngine={vi.fn()} focusBranch />);
    expect(screen.queryByRole('button', { name: 'Згорнути варіанти' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Відкрити 2.exd5/ })).toBeInTheDocument();
});
