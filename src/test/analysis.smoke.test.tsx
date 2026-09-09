import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import Analysis from "@/pages/Analysis";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";
vi.mock("@/components/ChessBoard", () => ({
    default: ({ initialFen }: { initialFen: string }) => <div data-testid="analysis-board" data-fen={initialFen}/>,
}));
vi.mock("react-chessboard", () => ({
    Chessboard: () => <div data-testid="analysis-editor-board"/>,
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
        lines: [],
    }),
}));
afterEach(cleanup);
describe("Analysis page", () => {
    it("renders without crashing", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
        <BoardSettingsProvider>
          <Analysis />
        </BoardSettingsProvider>
      </MemoryRouter>);
        expect(await screen.findAllByText(/Аналіз/i)).not.toHaveLength(0);
        expect(screen.getByRole("button", { name: /Розпочати аналіз/i })).toBeInTheDocument();
        expect(screen.getByTestId("analysis-board")).toBeInTheDocument();
    });
    it("opens the finished game's PGN from route state and keeps the actual final position ready for analysis", async () => {
        const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1';
        const game = new Chess();
        game.loadPgn(pgn);
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn, gameId: "test-finished" } }]}><BoardSettingsProvider><Analysis/></BoardSettingsProvider></MemoryRouter>);
        await waitFor(() => expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen()));
        expect(screen.getByRole("textbox", { name: "Paste PGN or FEN" })).toHaveValue(pgn);
        fireEvent.click(screen.getByRole("button", { name: "Розпочати аналіз" }));
        expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Зупинити аналіз" }));
    });
});
