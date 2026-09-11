import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import Analysis from "@/pages/AnalysisCenter";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";

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
    it("opens on Moves and puts Stockfish first in the local tool rail", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        expect(await screen.findByTestId("analysis-board")).toBeInTheDocument();
        expect(screen.queryByText("Графік оцінки")).not.toBeInTheDocument();
        const tools = screen.getByLabelText("Інструменти аналізу");
        const toolButtons = within(tools).getAllByRole("button");
        expect(toolButtons[0]).toHaveAccessibleName(/Stockfish/i);
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: /Движок/i })).toHaveAttribute("aria-selected", "false");
    });

    it("shows clickable MultiPV lines and previews a real engine line on the board", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        const board = await screen.findByTestId("analysis-board");
        const initialFen = board.getAttribute("data-fen");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        const firstLine = await screen.findByTitle("e4 e5 Nf3");
        fireEvent.click(firstLine);
        await waitFor(() => expect(board.getAttribute("data-fen")).not.toBe(initialFen));
        expect(screen.getByText("Варіант 1")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /До партії/i })).toBeInTheDocument();
    });

    it("adds a board classification badge only after real full-game review", async () => {
        const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "*"]\n\n1. e4 e5 *';
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        expect(screen.queryByRole("button", { name: /Хід класифіковано як/i })).not.toBeInTheDocument();
        fireEvent.click(await screen.findByRole("button", { name: /Проаналізувати всю партію/i }));
        expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
        const badge = await screen.findByRole("button", { name: /Хід класифіковано як/i });
        expect(badge).toBeInTheDocument();
        fireEvent.click(badge);
        expect(screen.getByRole("tab", { name: /Движок/i })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("Ваш хід")).toBeInTheDocument();
    });

    it("keeps PGN import returning to the Moves tab", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis/></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(screen.getByRole("button", { name: "Імпорт PGN" }));
        const editor = screen.getByRole("textbox", { name: "Paste PGN or FEN" });
        fireEvent.change(editor, { target: { value: '1. e4 e5 2. Nf3 Nc6 *' } });
        fireEvent.click(screen.getByRole("button", { name: "Аналізувати" }));

        await waitFor(() => expect(screen.getByText("e4")).toBeInTheDocument());
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
    });
});
