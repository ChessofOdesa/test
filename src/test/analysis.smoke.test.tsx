import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import Analysis from "@/pages/AnalysisCenter";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ChessBoard", () => ({
    default: ({ displayFen, initialFen }: { displayFen?: string; initialFen: string }) => <div data-testid="analysis-board" data-fen={displayFen || initialFen}/>,
}));

vi.mock("@/lib/stockfish", () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return {
            backend: "worker",
            scoreCp: 18,
            scoreMate: null,
            bestmove: "e2e4",
            raw: [],
            pv: ["e2e4", "e7e5", "g1f3"],
            depth: 8,
            lines: [
                { multipv: 1, scoreCp: 18, scoreMate: null, pv: ["e2e4", "e7e5", "g1f3"], depth: 8 },
                { multipv: 2, scoreCp: 11, scoreMate: null, pv: ["d2d4", "d7d5", "g1f3"], depth: 8 },
                { multipv: 3, scoreCp: 7, scoreMate: null, pv: ["g1f3", "d7d5", "d2d4"], depth: 8 },
            ],
        };
    }),
}));

afterEach(cleanup);

describe("Analysis Center", () => {
    it("keeps global actions in the left toolbar and only one primary move navigator", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        expect(await screen.findByTestId("analysis-board")).toBeInTheDocument();
        const tools = screen.getByLabelText("Інструменти аналізу");
        const toolButtons = within(tools).getAllByRole("button");
        expect(toolButtons[0]).toHaveAccessibleName(/Stockfish/i);
        expect(within(tools).getByRole("button", { name: "Нова позиція" })).toBeInTheDocument();
        expect(within(tools).getByRole("button", { name: "Імпорт PGN" })).toBeInTheDocument();
        expect(within(tools).getByRole("button", { name: "Відкрити PGN-файл" })).toBeInTheDocument();
        expect(within(tools).getByRole("button", { name: "Вставити FEN" })).toBeInTheDocument();
        expect(screen.getAllByLabelText("Навігація по партії")).toHaveLength(1);
        expect(screen.queryByLabelText("Навігація по ходах")).not.toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
    });

    it("keeps analysis settings in one popover", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(await screen.findByRole("button", { name: "Налаштування аналізу" }));
        expect(screen.getByText("Тема дошки")).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Координати/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Стрілка найкращого ходу/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Позначки якості ходу/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Анімація ходів/i })).toBeInTheDocument();
        expect(screen.getByText("MultiPV")).toBeInTheDocument();
    });

    it("shows clickable engine lines without a duplicate engine toggle or MultiPV selector in the engine tab", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        const board = await screen.findByTestId("analysis-board");
        const initialFen = board.getAttribute("data-fen");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(screen.queryByRole("button", { name: /Увімкнути Stockfish|Вимкнути Stockfish/i })).not.toBeInTheDocument();
        const firstLine = await screen.findByTitle("e4 e5 Nf3");
        fireEvent.click(firstLine);
        await waitFor(() => expect(board.getAttribute("data-fen")).not.toBe(initialFen));
        expect(screen.getByText("Варіант 1")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /До партії/i })).toBeInTheDocument();
    });

    it("runs full review from Overview and adds a real classification badge", async () => {
        const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "*"]\n\n1. e4 e5 *';
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(await screen.findByRole("tab", { name: /Огляд/i }));
        expect(screen.queryByRole("button", { name: /Хід класифіковано як/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Проаналізувати партію/i }));
        expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
        const badge = await screen.findByRole("button", { name: /Хід класифіковано як/i });
        expect(badge).toBeInTheDocument();
        fireEvent.click(badge);
        expect(screen.getByRole("tab", { name: /Движок/i })).toHaveAttribute("aria-selected", "true");
    });

    it("keeps PGN import returning to Moves with a precise action label", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis/></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(screen.getByRole("button", { name: "Імпорт PGN" }));
        const editor = screen.getByRole("textbox", { name: "Paste PGN or FEN" });
        fireEvent.change(editor, { target: { value: '1. e4 e5 2. Nf3 Nc6 *' } });
        fireEvent.click(screen.getByRole("button", { name: "Відкрити для аналізу" }));

        await waitFor(() => expect(screen.getByText("e4")).toBeInTheDocument());
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
    });
});
