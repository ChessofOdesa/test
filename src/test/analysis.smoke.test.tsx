import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import Analysis from "@/pages/AnalysisCenter";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";

vi.mock("@/components/ChessBoard", () => ({
    default: ({ displayFen, initialFen }: { displayFen?: string; initialFen: string }) => <div data-testid="analysis-board" data-fen={displayFen || initialFen}/>,
}));

vi.mock("@/lib/stockfish", () => ({
    __esModule: true,
    default: vi.fn().mockResolvedValue({
        backend: "worker",
        scoreCp: 18,
        scoreMate: null,
        bestmove: "e2e4",
        raw: [],
        pv: ["e2e4", "e7e5", "g1f3"],
        depth: 8,
        lines: [],
    }),
}));

afterEach(cleanup);

describe("Analysis Center", () => {
    it("opens directly on Moves with understandable local tools and no bottom graph block", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider>
                <Analysis />
            </BoardSettingsProvider>
        </MemoryRouter>);

        expect(await screen.findByTestId("analysis-board")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /Аналіз партії/i })).not.toBeInTheDocument();
        expect(screen.queryByText("Графік оцінки")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Нова позиція" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Імпорт PGN" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Відкрити PGN-файл" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Вставити FEN" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Вимкнути Stockfish/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Налаштування аналізу" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("tab", { name: /Огляд/i })).toHaveAttribute("aria-selected", "false");
        expect(screen.getByText("Ходів ще немає")).toBeInTheDocument();
    });

    it("opens a finished game's PGN in Moves and starts the real full-game review from the move actions", async () => {
        const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1';
        const game = new Chess();
        game.loadPgn(pgn);

        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn, gameId: "test-finished" } }]}>
            <BoardSettingsProvider><Analysis/></BoardSettingsProvider>
        </MemoryRouter>);

        await waitFor(() => expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen()));
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText("f3")).toBeInTheDocument();
        expect(screen.getByText("Qh4#")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Проаналізувати всю партію/i }));
        expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Зупинити/i })).toBeInTheDocument();
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
