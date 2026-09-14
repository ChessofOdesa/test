import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Analysis from "@/pages/AnalysisCenter";
import analyzeFenWithStockfish from "@/lib/stockfish";
import { Chess } from "chess.js";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ChessBoard", () => ({
    default: ({ displayFen, initialFen, onMove }: { displayFen?: string; initialFen: string; onMove: (from: string, to: string) => boolean }) => <div data-testid="analysis-board" data-fen={displayFen || initialFen}>
        {['e2e4', 'e4d5', 'd8d5', 'd7d5', 'd2d4'].map(uci => <button key={uci} onClick={() => onMove(uci.slice(0, 2), uci.slice(2))}>{uci}</button>)}
    </div>,
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

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
afterEach(() => { cleanup(); localStorage.clear(); vi.mocked(analyzeFenWithStockfish).mockClear(); });

function openAnalysis(pgn = '1. e4 d5 2. e5 *') {
    return render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
        <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
    </MemoryRouter>);
}
function expectBoard(moves: string[]) {
    const game = new Chess();
    moves.forEach(move => game.move(move));
    expect(screen.getByTestId("analysis-board")).toHaveAttribute("data-fen", game.fen());
}
function importGame(pgn: string) {
    fireEvent.click(screen.getByRole("button", { name: "Імпорт PGN" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Paste PGN or FEN" }), { target: { value: pgn } });
    fireEvent.click(screen.getByRole("button", { name: "Відкрити для аналізу" }));
}


describe("Analysis Center", () => {
    it("restores an autosaved selected variation after remount and preserves it on invalid shared input", async () => {
        const view = openAnalysis('1. e4 *');
        fireEvent.keyDown(window, { key: 'Home' });
        fireEvent.click(screen.getByRole('button', { name: 'd2d4' }));
        expectBoard(['d4']);
        view.unmount();
        openAnalysis('');
        expectBoard(['d4']);
        cleanup();
        render(<MemoryRouter initialEntries={['/analysis#analysis=invalid']}><BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider></MemoryRouter>);
        expectBoard(['d4']);
    });

    it("undoes and redoes a board edit and resizes the existing panel using the keyboard", async () => {
        openAnalysis('');
        fireEvent.click(await screen.findByRole('button', { name: 'd2d4' }));
        expectBoard(['d4']);
        fireEvent.click(screen.getByRole('button', { name: 'Скасувати зміну' }));
        expectBoard([]);
        fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
        expectBoard(['d4']);
        const resizer = screen.getByRole('separator', { name: 'Ширина панелі аналізу' });
        fireEvent.keyDown(resizer, { key: 'ArrowLeft' });
        expect(resizer).toHaveAttribute('aria-valuenow', '480');
    });

    it("saves and searches an analysis through the archive dialog", async () => {
        openAnalysis();
        fireEvent.click(await screen.findByRole('button', { name: 'Мої аналізи' }));
        fireEvent.change(screen.getByLabelText('Назва'), { target: { value: 'Турнірна партія' } });
        fireEvent.change(screen.getByLabelText('Теги через кому'), { target: { value: 'перевірити' } });
        fireEvent.click(screen.getByRole('button', { name: 'Зберегти аналіз' }));
        fireEvent.change(screen.getByLabelText('Пошук аналізів'), { target: { value: 'перевірити' } });
        expect(screen.getByText('Турнірна партія')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Оновити збережений' }));
        expect(screen.getAllByText('Турнірна партія')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Створити копію' })).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Пошук аналізів'), { target: { value: 'нічоготакого' } });
        expect(screen.getByText('Нічого не знайдено.')).toBeInTheDocument();
    });

    it("uses one short engine line in economy mode and supports an explicit deep request", async () => {
        openAnalysis('');
        fireEvent.click(await screen.findByRole('button', { name: 'Налаштування аналізу' }));
        fireEvent.click(screen.getByRole('switch', { name: /Економний режим/ }));
        fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
        fireEvent.click(screen.getByRole('tab', { name: /Движок/ }));
        await waitFor(() => expect(vi.mocked(analyzeFenWithStockfish).mock.calls.some(call => call[1] === 8 && call[4]?.multiPv === 1 && call[4]?.movetime === 600)).toBe(true));
        fireEvent.click(screen.getByRole('button', { name: 'Глибоко цю позицію' }));
        await waitFor(() => expect(vi.mocked(analyzeFenWithStockfish).mock.calls.some(call => call[1] === 16 && call[4]?.multiPv === 1)).toBe(true));
        fireEvent.click(screen.getByRole('button', { name: 'Повернути швидкий аналіз' }));
        expect(screen.getByRole('button', { name: 'Глибоко цю позицію' })).toHaveAttribute('aria-pressed', 'false');
    });

    it("pins the only primary move navigator to the bottom of the right analysis panel", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        expect(await screen.findByTestId("analysis-board")).toBeInTheDocument();
        const panel = screen.getByLabelText("Права панель аналізу");
        const navigator = within(panel).getByLabelText("Навігація по партії");
        expect(navigator).toBeInTheDocument();
        expect(screen.getAllByLabelText("Навігація по партії")).toHaveLength(1);
        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();
        expect(within(navigator).queryByRole("button", { name: /На початок/i })).not.toBeInTheDocument();
        expect(within(navigator).queryByRole("button", { name: /У кінець/i })).not.toBeInTheDocument();
        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();
    });

    it("keeps the shared move navigator available across all right-panel tabs", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        for (const name of [/Ходи/i, /Движок/i, /Огляд/i, /Інфо/i]) {
            fireEvent.click(screen.getByRole("tab", { name }));
            expect(screen.getByLabelText("Навігація по партії")).toBeInTheDocument();
        }
    });

    it("keeps global actions in the left toolbar and board flip out of the move navigator", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        const tools = screen.getByLabelText("Інструменти аналізу");
        expect(within(tools).getAllByRole("button")[0]).toHaveAccessibleName(/Stockfish/i);
        expect(within(tools).getByRole("button", { name: "Нова позиція" })).toBeInTheDocument();
        expect(within(tools).getByRole("button", { name: "Імпорт PGN" })).toBeInTheDocument();
        expect(within(tools).queryByRole("button", { name: "Відкрити PGN-файл" })).not.toBeInTheDocument();
        expect(within(tools).getByRole("button", { name: "Вставити FEN" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Перевернути дошку" })).not.toBeInTheDocument();
    });

    it("opens a PGN file from the single import dialog and closes it after loading", async () => {
        openAnalysis('');
        fireEvent.click(screen.getByRole('button', { name: 'Імпорт PGN' }));
        expect(screen.getAllByRole('button', { name: 'Відкрити PGN-файл' })).toHaveLength(1);
        const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
        const file = new File(['1. d4 d5 *'], 'game.pgn', { type: 'application/x-chess-pgn' });
        Object.defineProperty(file, 'text', { value: async () => '1. d4 d5 *' });
        fireEvent.change(input, { target: { files: [file] } });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expectBoard(['d4', 'd5']);
    });

    it("keeps analysis settings in one popover", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(await screen.findByRole("button", { name: "Налаштування аналізу" }));
        expect(screen.getByText("Тема дошки")).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Координати/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Стрілка найкращого ходу/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Позначки якості ходу/i })).toBeInTheDocument();
        expect(screen.getByRole("switch", { name: /Анімація ходів/i })).toBeInTheDocument();
        expect(screen.getByText("MultiPV")).toBeInTheDocument();
    });

    it("switches between simple and advanced Analysis UI without cluttering the default", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));
        expect(screen.queryByLabelText("Розширені дані движка")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Налаштування аналізу" }));
        expect(screen.getByRole("button", { name: /Простий/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: /Розширений/i }));
        expect(screen.getByRole("button", { name: /Розширений/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "Налаштування аналізу" }));

        const advanced = await screen.findByLabelText("Розширені дані движка");
        expect(within(advanced).getByText("Глибина")).toBeInTheDocument();
        expect(within(advanced).getByText("MultiPV")).toBeInTheDocument();
    });

    it("previews the best move from the simplified engine card", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        const board = await screen.findByTestId("analysis-board");
        const initialFen = board.getAttribute("data-fen");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        const bestMoveCard = await screen.findByLabelText("Найкращий хід Stockfish");
        expect(within(bestMoveCard).getByText("e4")).toBeInTheDocument();
        fireEvent.click(within(bestMoveCard).getByRole("button", { name: /Показати на дошці/i }));
        await waitFor(() => expect(board.getAttribute("data-fen")).not.toBe(initialFen));
        expect(screen.getByText("Найкращий варіант")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /До партії/i })).toBeInTheDocument();
    });

    it("keeps the Engine tab simple and hides secondary lines until requested", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(await screen.findByText("Позиція близька до рівної")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Налаштувати движок" })).not.toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: "Налаштування аналізу" })).toHaveLength(1);
        expect(screen.queryByText("Глибина")).not.toBeInTheDocument();
        expect(screen.queryByText("Варіанти Stockfish")).not.toBeInTheDocument();
        const alternatives = screen.getByText("Інші варіанти").closest("details");
        expect(alternatives).toBeInTheDocument();
        expect(alternatives).not.toHaveAttribute("open");
        fireEvent.click(within(alternatives!).getByText("Інші варіанти"));
        expect(within(alternatives!).getAllByRole("button", { name: /Додати варіант Stockfish .* до дерева/i })).toHaveLength(2);
    });

    it("runs full review from Overview and adds a real classification badge", async () => {
        const pgn = '[Event "Smoke"]\n[White "Тест білих"]\n[Black "Тест чорних"]\n[Result "*"]\n\n1. e4 e5 *';
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(await screen.findByRole("tab", { name: /Огляд/i }));
        expect(screen.queryByRole("button", { name: /Хід класифіковано як/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Проаналізувати партію/i }));
        const badge = await screen.findByRole("button", { name: /Хід класифіковано як/i });
        expect(badge).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Заново/i })).toBeInTheDocument();
        fireEvent.click(badge);
        expect(screen.getByRole("tab", { name: /Движок/i })).toHaveAttribute("aria-selected", "true");
    });

    it("renders useful PGN metadata in Info instead of raw dash placeholders", async () => {
        const pgn = [
            '[Event "Odesa Championship"]',
            '[Site "Odesa"]',
            '[Date "2026.09.12"]',
            '[Round "4"]',
            '[White "Andriy"]',
            '[WhiteElo "1956"]',
            '[Black "Opponent"]',
            '[BlackElo "2010"]',
            '[TimeControl "600+5"]',
            '[Result "1-0"]',
            '',
            '1. e4 e5 2. Nf3 Nc6 1-0',
        ].join('\n');
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByText("e4");
        fireEvent.click(screen.getByRole("tab", { name: /Інфо/i }));

        expect(screen.getByText("Odesa Championship")).toBeInTheDocument();
        expect(screen.getByText("Odesa")).toBeInTheDocument();
        expect(screen.getByText("Тур")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText("Рейтинг 1956")).toBeInTheDocument();
        expect(screen.getByText("Рейтинг 2010")).toBeInTheDocument();
        expect(screen.getByText("600+5")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Копіювати дані/i })).toBeInTheDocument();
        expect(screen.getAllByText("Не вказано").length).toBeGreaterThan(0);
    });

    it("keeps PGN import returning to Moves with a precise action label", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis/></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(screen.getByRole("button", { name: "Імпорт PGN" }));
        const editor = screen.getByRole("textbox", { name: "Paste PGN or FEN" });
        fireEvent.change(editor, { target: { value: '[Event "Import"]\n\n1. e4 e5 2. Nf3 Nc6 *' } });
        fireEvent.click(screen.getByRole("button", { name: "Відкрити для аналізу" }));

        await waitFor(() => expect(screen.getByText("e4")).toBeInTheDocument());
        expect(screen.getByRole("tab", { name: /Ходи/i })).toHaveAttribute("aria-selected", "true");
    });
});

describe("Analysis position synchronization", () => {
    it("navigates along a branch and returns to its parent without visiting siblings", () => {
        openAnalysis();
        fireEvent.click(screen.getByRole("button", { name: "Вимкнути Stockfish" }));
        fireEvent.click(screen.getByText("d5"));
        fireEvent.click(screen.getByText("e4d5"));
        fireEvent.click(screen.getByText("d8d5"));
        expectBoard(['e4', 'd5', 'exd5', 'Qxd5']);
        const nav = screen.getByLabelText("Навігація по партії");
        expect(within(nav).getByText('Варіант 2 / 2')).toBeInTheDocument();
        expect(within(nav).getByRole('button', { name: 'Наступний хід' })).toBeDisabled();
        fireEvent.keyDown(window, { key: 'ArrowLeft' });
        expectBoard(['e4', 'd5', 'exd5']);
        fireEvent.keyDown(window, { key: 'End' });
        expectBoard(['e4', 'd5', 'exd5', 'Qxd5']);
        fireEvent.click(screen.getByText('e5'));
        expect(within(nav).getByText('3 / 3')).toBeInTheDocument();
        fireEvent.click(within(nav).getByRole('button', { name: 'Попередній хід' }));
        expectBoard(['e4', 'd5']);
        fireEvent.click(within(nav).getByRole('button', { name: 'Наступний хід' }));
        expectBoard(['e4', 'd5', 'e5']);
    });

    it("follows an existing move on the board without duplicating it", () => {
        openAnalysis();
        fireEvent.keyDown(window, { key: 'Home' });
        fireEvent.click(screen.getByText('e2e4'));
        expectBoard(['e4']);
        expect(screen.getAllByText('e4', { exact: true })).toHaveLength(1);
        fireEvent.click(screen.getByText('d5'));
        fireEvent.click(screen.getByText('e4d5'));
        fireEvent.click(screen.getByText('d5'));
        fireEvent.click(screen.getByText('e4d5'));
        expectBoard(['e4', 'd5', 'exd5']);
        expect(screen.getAllByText('exd5', { exact: true })).toHaveLength(1);
    });

    it("does not move the board when arrow keys switch tabs", () => {
        openAnalysis();
        fireEvent.click(screen.getByText('e4'));
        fireEvent.keyDown(screen.getByRole('tab', { name: /Ходи/i }), { key: 'ArrowRight' });
        expect(screen.getByRole('tab', { name: /Движок/i })).toHaveAttribute('aria-selected', 'true');
        expectBoard(['e4']);
    });

    it("hides the previous engine lines immediately after navigating", async () => {
        openAnalysis('');
        fireEvent.click(screen.getByRole('tab', { name: /Движок/i }));
        expect(await screen.findByLabelText('Найкращий хід Stockfish')).toBeInTheDocument();
        fireEvent.click(screen.getByText('e2e4'));
        expectBoard(['e4']);
        expect(screen.queryByLabelText('Найкращий хід Stockfish')).not.toBeInTheDocument();
    });

    it("uses the same bottom controls and keyboard for a Stockfish preview", async () => {
        openAnalysis('');
        fireEvent.click(screen.getByRole('tab', { name: /Движок/i }));
        fireEvent.click(within(await screen.findByLabelText('Найкращий хід Stockfish')).getByRole('button', { name: 'Показати на дошці' }));
        expectBoard(['e4']);
        fireEvent.click(screen.getByRole('button', { name: 'Наступний хід' }));
        expectBoard(['e4', 'e5']);
        fireEvent.keyDown(window, { key: 'End' });
        expectBoard(['e4', 'e5', 'Nf3']);
        fireEvent.click(screen.getByRole('button', { name: /До партії/ }));
        expectBoard([]);
    });

    it("pauses a review, ignores its late result and resumes the unfinished move", async () => {
        openAnalysis('1. e4 e5 *');
        fireEvent.click(screen.getByRole('button', { name: 'Вимкнути Stockfish' }));
        let finish!: (value: Awaited<ReturnType<typeof analyzeFenWithStockfish>>) => void;
        vi.mocked(analyzeFenWithStockfish).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        fireEvent.click(screen.getByRole('tab', { name: /Огляд/i }));
        fireEvent.click(screen.getByRole('button', { name: /Проаналізувати партію/i }));
        await waitFor(() => expect(finish).toBeDefined());
        const signal = vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)![4]!.signal!;
        fireEvent.click(screen.getByRole('button', { name: 'Пауза' }));
        expect(signal.aborted).toBe(true);
        await act(async () => finish({ backend: 'worker', scoreCp: 800, scoreMate: null, bestmove: 'e2e4', pv: ['e2e4'], raw: [], depth: 12, lines: [] }));
        expect(screen.getByText('Огляд на паузі · 0 / 2 півходів')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Проаналізувати партію' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Заново' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Продовжити огляд' }));
        await waitFor(() => expect(screen.getByText(/2 перевірених ходів/)).toBeInTheDocument());
        expect(screen.queryByRole('button', { name: 'Продовжити огляд' })).not.toBeInTheDocument();
    });

    it("aborts the old review on import and ignores its delayed result", async () => {
        openAnalysis('1. e4 e5 *');
        fireEvent.click(screen.getByRole('button', { name: 'Вимкнути Stockfish' }));
        let finish!: (value: Awaited<ReturnType<typeof analyzeFenWithStockfish>>) => void;
        vi.mocked(analyzeFenWithStockfish).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        fireEvent.click(screen.getByRole('tab', { name: /Огляд/i }));
        fireEvent.click(screen.getByRole('button', { name: /Проаналізувати партію/i }));
        await waitFor(() => expect(finish).toBeDefined());
        const signal = vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)![4]!.signal!;
        importGame('1. d4 d5 *');
        expect(signal.aborted).toBe(true);
        await act(async () => finish({ backend: 'worker', scoreCp: 800, scoreMate: null, bestmove: 'e2e4', pv: ['e2e4'], raw: [], depth: 12, lines: [] }));
        expectBoard(['d4', 'd5']);
        expect(screen.queryByRole('button', { name: /Хід класифіковано як/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: /Огляд/i }));
        expect(screen.getByRole('button', { name: /Проаналізувати партію/i })).toBeInTheDocument();
    });

    it("aborts a review on unmount", async () => {
        const view = openAnalysis('1. e4 e5 *');
        fireEvent.click(screen.getByRole('button', { name: 'Вимкнути Stockfish' }));
        vi.mocked(analyzeFenWithStockfish).mockImplementationOnce(() => new Promise(() => {}));
        fireEvent.click(screen.getByRole('tab', { name: /Огляд/i }));
        fireEvent.click(screen.getByRole('button', { name: /Проаналізувати партію/i }));
        await waitFor(() => expect(analyzeFenWithStockfish).toHaveBeenCalled());
        const signal = vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)![4]!.signal!;
        view.unmount();
        expect(signal.aborted).toBe(true);
    });

    it("keeps PGN navigation available when the engine fails", async () => {
        vi.mocked(analyzeFenWithStockfish).mockRejectedValueOnce(new Error('Engine unavailable'));
        openAnalysis();
        fireEvent.click(screen.getByRole('tab', { name: /Движок/i }));
        await waitFor(() => expect(document.querySelector('.analysis-error')).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: 'Попередній хід' }));
        expectBoard(['e4', 'd5']);
    });
});

it("adds a Stockfish line explicitly and exports the resulting game in Info", async () => {
    openAnalysis('');
    fireEvent.click(screen.getByRole('tab', { name: /Движок/i }));
    const card = await screen.findByLabelText('Найкращий хід Stockfish');
    expectBoard([]);
    fireEvent.click(within(card).getByRole('button', { name: 'У варіанти' }));
    expectBoard(['e4', 'e5', 'Nf3']);
    expect(screen.getByRole('tab', { name: /Ходи/i })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: /Інфо/i }));
    expect(screen.getByRole('button', { name: 'Копіювати PGN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Завантажити PGN' })).toBeInTheDocument();
    expect(document.querySelector('.analysis-pgn-details pre')?.textContent).toContain('1. e4 e5 2. Nf3');
});

it("creates a root branch on the board and navigates it with the shared footer", () => {
    openAnalysis('1. e4 e5 *');
    fireEvent.click(screen.getByRole('button', { name: 'Вимкнути Stockfish' }));
    fireEvent.keyDown(window, { key: 'Home' });
    fireEvent.click(screen.getByText('d2d4'));
    expectBoard(['d4']);
    const nav = within(screen.getByLabelText('Навігація по партії'));
    expect(nav.getByText('Варіант 1 / 1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('d7d5'));
    expectBoard(['d4', 'd5']);
    fireEvent.click(nav.getByRole('button', { name: 'Попередній хід' }));
    expectBoard(['d4']);
    fireEvent.click(nav.getByRole('button', { name: 'Попередній хід' }));
    expectBoard([]);
    fireEvent.click(nav.getByRole('button', { name: 'Наступний хід' }));
    expectBoard(['e4']);
    fireEvent.click(screen.getByRole('tab', { name: /Інфо/i }));
    expect(document.querySelector('.analysis-pgn-details pre')?.textContent).toContain('(1. d4 1... d5)');
});
