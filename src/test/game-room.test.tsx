import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import { ChessClock, remainingAt } from "@/features/game-room/ChessClock";
import { roomBoardSize, readHistory } from "@/features/game-room/rules";
import { useComputerGame } from "@/features/game-room/useComputerGame";
import { computerMove } from "@/features/game-room/engine/computer-engine";
import type { RoomPreferences } from "@/features/game-room/types";
const surface = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock("react-chessboard", () => ({ Chessboard: (props: Record<string, unknown>) => { surface.props = props; return <div data-testid="board"/>; } }));
vi.mock("@/hooks/useChessSounds", () => ({ playChessSound: vi.fn() }));
vi.mock("@/features/game-room/engine/computer-engine", () => ({ computerMove: vi.fn() }));
const settings: RoomPreferences = { sound: false, checkSound: false, endSound: false, lowTimeSound: false, animation: true, legalMoves: true, lastMove: true, autoQueen: false, confirmMove: false, evaluation: false, focus: false };
const start = new Chess().fen();
function mountBoard(props: React.ComponentProps<typeof ChessBoard>) {
    return render(<BoardSettingsProvider><ChessBoard {...props}/></BoardSettingsProvider>);
}
beforeEach(() => { localStorage.clear(); vi.mocked(computerMove).mockReset(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("shared board interaction", () => {
    it("offers all promotion pieces and sends the chosen underpromotion exactly once", () => {
        const moved = vi.fn();
        mountBoard({ initialFen: "7k/P7/8/8/8/8/8/7K w - - 0 1", onMove: moved, playerColor: "w", optimistic: false });
        act(() => { expect(surface.props.onPieceDrop("a7", "a8")).toBe(false); });
        expect(moved).not.toHaveBeenCalled();
        for (const name of ["Ферзь", "Тура", "Слон", "Кінь"])
            expect(screen.getByRole("button", { name })).toBeVisible();
        fireEvent.click(screen.getByRole("button", { name: "Кінь" }));
        expect(moved).toHaveBeenCalledOnce();
        expect(moved).toHaveBeenCalledWith("a7", "a8", "n");
        expect(surface.props.position).toContain("P7");
    });
    it("rejects illegal moves before invoking the controller and waits for online acknowledgement", () => {
        const moved = vi.fn();
        const view = mountBoard({ initialFen: start, onMove: moved, playerColor: "w", optimistic: false });
        act(() => { surface.props.onPieceDrop("e2", "e5"); surface.props.onPieceDrop("e7", "e5"); });
        expect(moved).not.toHaveBeenCalled();
        act(() => { surface.props.onPieceDrop("e2", "e4"); surface.props.onPieceDrop("e2", "e4"); });
        expect(moved).toHaveBeenCalledOnce();
        expect(surface.props.position).toBe(start);
        const game = new Chess();
        game.move("e4");
        view.rerender(<BoardSettingsProvider><ChessBoard initialFen={game.fen()} onMove={moved} playerColor="w" interactive={false} allowPremoves optimistic={false}/></BoardSettingsProvider>);
        expect(surface.props.position).toBe(game.fen());
    });
    it("validates a premove against the received position and discards an impossible one", () => {
        const moved = vi.fn();
        const game = new Chess();
        game.move("e4");
        const view = mountBoard({ initialFen: game.fen(), onMove: moved, playerColor: "w", interactive: false, allowPremoves: true, optimistic: false });
        act(() => surface.props.onPieceDrop("g1", "f3"));
        expect(moved).not.toHaveBeenCalled();
        game.move("e5");
        view.rerender(<BoardSettingsProvider><ChessBoard initialFen={game.fen()} onMove={moved} playerColor="w" interactive optimistic={false}/></BoardSettingsProvider>);
        expect(moved).toHaveBeenCalledOnce();
        expect(moved).toHaveBeenCalledWith("g1", "f3", "q");
        cleanup();
        moved.mockClear();
        game.move("Nf3");
        const next = mountBoard({ initialFen: game.fen(), onMove: moved, playerColor: "w", interactive: false, allowPremoves: true, optimistic: false });
        act(() => surface.props.onPieceDrop("e4", "e6"));
        game.move("Nc6");
        next.rerender(<BoardSettingsProvider><ChessBoard initialFen={game.fen()} onMove={moved} playerColor="w" interactive optimistic={false}/></BoardSettingsProvider>);
        expect(moved).not.toHaveBeenCalled();
        expect(screen.queryByText("Скасувати попередній хід")).not.toBeInTheDocument();
    });
    it("uses the latest external puzzle position after an automatic reply", () => {
        const moved = vi.fn();
        const view = mountBoard({ initialFen: start, displayFen: start, onMove: moved });
        act(() => surface.props.onPieceDrop("e2", "e4"));
        const game = new Chess();
        game.move("e4");
        game.move("e5");
        view.rerender(<BoardSettingsProvider><ChessBoard initialFen={start} displayFen={game.fen()} onMove={moved}/></BoardSettingsProvider>);
        act(() => surface.props.onPieceDrop("g1", "f3"));
        expect(moved).toHaveBeenLastCalledWith("g1", "f3", "q");
        expect(moved).toHaveBeenCalledTimes(2);
    });
    it("recovers corrupted stored board preferences", () => {
        localStorage.setItem("coo.board.preferences", "null");
        mountBoard({ initialFen: start });
        expect(surface.props.customLightSquareStyle.backgroundColor).toBe("#e4eaf2");
    });
});
describe("computer game lifecycle", () => {
    const config = { color: "w" as const, timeControl: "3+2", level: 3, playerName: "Test player", levelName: "Level 3" };
    it("cancels the pending engine move on undo and ignores a late answer", async () => {
        let answer!: (value: {
            move: string;
            backend: string;
        }) => void;
        vi.mocked(computerMove).mockImplementation(() => new Promise(resolve => { answer = resolve; }));
        const hook = renderHook(() => useComputerGame(config, settings));
        act(() => { hook.result.current.move("e2", "e4"); });
        const signal = vi.mocked(computerMove).mock.calls[0][2];
        expect(hook.result.current.thinking).toBe(true);
        act(() => hook.result.current.undo());
        expect(signal.aborted).toBe(true);
        await act(async () => answer({ move: "e7e5", backend: "Stockfish" }));
        expect(hook.result.current.view.fen).toBe(start);
        expect(hook.result.current.thinking).toBe(false);
    });
    it("restores the player turn on undo and preserves a paused clock", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-09-07T12:00:00Z"));
        vi.mocked(computerMove).mockResolvedValue({ move: "e7e5", backend: "Stockfish" });
        const hook = renderHook(() => useComputerGame(config, settings));
        await act(async () => { vi.advanceTimersByTime(1000); hook.result.current.move("e2", "e4"); });
        expect(readHistory(hook.result.current.view.pgn).moves).toEqual(["e4", "e5"]);
        expect(hook.result.current.view.clocks.w).toBe(181000);
        expect(hook.result.current.view.clocks.b).toBe(182000);
        act(() => hook.result.current.undo());
        expect(hook.result.current.view.fen).toBe(start);
        act(() => { vi.advanceTimersByTime(500); hook.result.current.togglePause(); });
        const saved = hook.result.current.view.clocks.w;
        act(() => { vi.advanceTimersByTime(100000); hook.result.current.togglePause(); });
        expect(hook.result.current.view.clocks.w).toBe(saved);
        act(() => hook.result.current.resign());
        expect(hook.result.current.view.result).toBe("0-1");
        expect(hook.result.current.view.pgn).toContain('[Result "0-1"]');
        act(() => hook.result.current.restart());
        expect(hook.result.current.view.result).toBe("*");
        expect(hook.result.current.view.clocks.w).toBe(180000);
    });
    it("adjudicates a local timeout once, without accepting a late move", () => {
        vi.useFakeTimers();
        const hook = renderHook(() => useComputerGame({ ...config, timeControl: "0+1" }, settings));
        act(() => { vi.advanceTimersByTime(1001); hook.result.current.flag(); hook.result.current.flag(); });
        expect(hook.result.current.view.reason).toBe("timeout");
        expect(hook.result.current.view.result).toBe("0-1");
        act(() => { expect(hook.result.current.move("e2", "e4")).toBe(false); });
    });
});
it("renders the actual tenths and derives clocks from elapsed time", () => {
    render(<ChessClock clock={{ remainingMs: 9500, running: false, asOf: Date.now() }} name="Білі"/>);
    expect(screen.getByRole("timer")).toHaveTextContent("0:09.5");
    expect(remainingAt({ remainingMs: 12000, running: true, asOf: 1000 }, 3500)).toBe(9500);
    expect(remainingAt({ remainingMs: 12000, running: false, asOf: 1000 }, 3500)).toBe(12000);
});
it.each([[1920, 1080], [1366, 768], [1024, 768], [768, 1024], [390, 844], [375, 812]])("fits the board calculation within a %i × %i viewport", (width, height) => {
    const size = roomBoardSize(width, height);
    expect(size + 24).toBeLessThanOrEqual(width);
    if (width >= 1000) {
        expect(size + 450).toBeLessThanOrEqual(width);
        expect(size + 250).toBeLessThanOrEqual(height);
    }
});
