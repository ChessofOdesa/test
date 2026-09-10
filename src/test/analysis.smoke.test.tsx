import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import Analysis from "@/pages/Analysis";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";
import analyze from "@/lib/stockfish";
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null, isGuest: false, loading: false }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/components/ChessBoard", () => ({ default: ({ initialFen, onMove }: { initialFen: string; onMove: (from: string, to: string) => void }) => <div data-testid="analysis-board" data-fen={initialFen}><button onClick={() => onMove("d2", "d4")}>Test d4</button></div> }));
vi.mock("react-chessboard", () => ({ Chessboard: () => <div data-testid="analysis-editor-board"/> }));
vi.mock("@/lib/stockfish", () => ({
  default: vi.fn((_fen, _depth, _output, _time, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Cancelled", "AbortError"))))),
  releaseIdleStockfishWorker: vi.fn(), retryStockfishWorker: vi.fn(),
}));
const pgn = '[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1';
function mount(value?: string) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[{ pathname: "/analysis", state: value ? { pgn: value } : null }]}><BoardSettingsProvider><Analysis/></BoardSettingsProvider></MemoryRouter></QueryClientProvider>);
}
function tab(name: string) { fireEvent.mouseDown(screen.getByRole("tab", { name }), { button: 0, ctrlKey: false }); }
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(cleanup);
describe("Analysis center", () => {
  it("opens an empty board without invented scores or automatic full review", () => {
    mount(); expect(screen.getByTestId("analysis-board")).toBeInTheDocument();
    expect(screen.queryByText("100%")).not.toBeInTheDocument(); expect(analyze).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Вставити PGN або FEN" })).toBeInTheDocument();
  });
  it("keeps the finished game's metadata and final position and supports navigation", async () => {
    const game = new Chess(); game.loadPgn(pgn); mount(pgn);
    await waitFor(() => expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen()));
    expect(screen.getByText("Тест білих")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "На початок" }));
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", new Chess().fen());
    fireEvent.keyDown(window, { key: "End" });
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen());
  });
  it("reports an invalid import without replacing the current game", async () => {
    mount(pgn); const initial = screen.getByTestId("analysis-board").getAttribute("data-fen");
    fireEvent.click(screen.getByRole("button", { name: "Імпорт" }));
    fireEvent.change(screen.getByRole("textbox", { name: "PGN або FEN" }), { target: { value: "1.e5" } });
    fireEvent.click(screen.getByRole("button", { name: "Відкрити аналіз" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/PGN/);
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", initial);
  });
  it("adds a root variation and can promote it without losing the original line", async () => {
    mount("1.e4 e5 *"); fireEvent.click(screen.getByRole("button", { name: "На початок" }));
    fireEvent.click(screen.getByRole("button", { name: "Test d4" }));
    expect(screen.getByText("1.d4")).toBeInTheDocument(); expect(screen.getByText("1.e4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Зробити основним" }));
    fireEvent.click(screen.getByRole("button", { name: "На початок" }));
    fireEvent.click(screen.getByRole("button", { name: "Наступний хід" }));
    const game = new Chess(); game.move("d4");
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen());
  });
  it("cancels the full-game job and leaves navigation usable", async () => {
    mount(pgn); tab("Огляд");
    fireEvent.click(screen.getByRole("button", { name: "Проаналізувати всю партію" }));
    expect(await screen.findByText("Аналіз триває")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Зупинити аналіз" }));
    expect(screen.queryByText("Аналіз триває")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "На початок" }));
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", new Chess().fen());
  });
});
