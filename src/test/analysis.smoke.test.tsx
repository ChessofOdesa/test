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
    it("starts directly with the workspace and local analysis tools", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider>
                <Analysis />
            </BoardSettingsProvider>
        </MemoryRouter>);

        expect(await screen.findByTestId("analysis-board")).toBeInTheDocument();
        expect(screen.queryByRole("heading", { name: /Аналіз партії/i })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Нова позиція" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Імпорт PGN" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Вставити FEN" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Вимкнути Stockfish/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /Огляд/i })).toHaveAttribute("aria-selected", "true");
    });

    it("opens a finished game's PGN from route state and starts a real full-game review", async () => {
        const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1';
        const game = new Chess();
        game.loadPgn(pgn);

        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn, gameId: "test-finished" } }]}>
            <BoardSettingsProvider><Analysis/></BoardSettingsProvider>
        </MemoryRouter>);

        await waitFor(() => expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen()));
        fireEvent.click(screen.getByRole("button", { name: "Імпорт PGN" }));
        expect(screen.getByRole("textbox", { name: "Paste PGN or FEN" })).toHaveValue(expect.stringContaining("Тест білих"));
        fireEvent.click(screen.getByRole("button", { name: /Скасувати/i }));
        fireEvent.click(screen.getByRole("button", { name: /Проаналізувати всю партію/i }));
        expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Зупинити аналіз/i })).toBeInTheDocument();
    });
});
