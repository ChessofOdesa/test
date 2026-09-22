import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import { TooltipProvider } from "@/components/ui/tooltip";
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

class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
afterEach(cleanup);

describe("Analysis Center", () => {
    it("opens and edits a puzzle mistake from the initial position while retaining the main layout", async () => {
        const pgn = '1. e4 (1. d4 {Моя помилка}) e5 2. Nf3 *';
        render(<MemoryRouter initialEntries={[{ pathname: "/analysis", state: { pgn } }]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);
        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("button", { name: "Усі варіанти" }));
        fireEvent.click(screen.getByText("d4"));
        expect(screen.getByTestId("analysis-board").getAttribute("data-fen")).toContain("3P4");
        expect(screen.getByLabelText("Коментар до позиції")).toHaveValue("Моя помилка");
        fireEvent.change(screen.getByLabelText("Коментар до позиції"), { target: { value: "Перевірена помилка" } });
        expect(screen.getByLabelText("Коментар до позиції")).toHaveValue("Перевірена помилка");
        expect(screen.getAllByLabelText("Навігація по партії")).toHaveLength(1);
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
        expect(within(navigator).getByRole("button", { name: "На початок" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "У кінець" })).toBeInTheDocument();
        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();
    });

    it("keeps the shared move navigator available across all right-panel tabs", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        for (const name of [/Движок/i, /Огляд/i, /Інфо/i]) {
            fireEvent.click(screen.getByRole("tab", { name }));
            expect(screen.getByLabelText("Навігація по партії")).toBeInTheDocument();
        }
    });

    it("keeps rare Analysis actions in one bottom More menu without a duplicate local toolbar", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        expect(screen.queryByLabelText("Інструменти аналізу")).not.toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: /Ходи/i })).not.toBeInTheDocument();

        fireEvent.keyDown(screen.getByRole("button", { name: "Додаткові дії аналізу" }), { key: "ArrowDown" });
        expect(screen.getByRole("menuitem", { name: "Нова позиція" })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "Імпорт PGN" })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "Відкрити PGN-файл" })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "Вставити FEN" })).toBeInTheDocument();
        expect(screen.getByRole("menuitem", { name: "Перевернути дошку" })).toBeInTheDocument();
    });

    it("keeps analysis settings in one popover", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.click(await screen.findByRole("button", { name: "Налаштувати движок" }));
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

        fireEvent.click(screen.getByRole("button", { name: "Налаштувати движок" }));
        expect(screen.getByRole("button", { name: /Простий/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: /Розширений/i }));
        expect(screen.getByRole("button", { name: /Розширений/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "Налаштувати движок" }));

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

    it("renders the compact screenshot-inspired Engine workspace", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(await screen.findByText("Позиція близька до рівної")).toBeInTheDocument();
        expect(screen.getAllByRole("switch", { name: "Stockfish" })).toHaveLength(1);
        expect(screen.getAllByRole("button", { name: "Налаштувати движок" })).toHaveLength(1);
        expect(screen.getAllByRole("button", { name: "Призупинити Stockfish" })).toHaveLength(1);
        expect(screen.getByRole("button", { name: "Мій прогноз" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Зберегти позицію в закладки" })).toBeInTheDocument();
        expect(screen.getByText("Глибина")).toBeInTheDocument();
        expect(screen.getByText("Ходи партії")).toBeInTheDocument();
        expect(screen.getByLabelText("Коментар до позиції")).toBeInTheDocument();
        expect(await screen.findAllByTestId("analysis-engine-line")).toHaveLength(3);
        expect(screen.queryByText("Інші варіанти")).not.toBeInTheDocument();
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

    it("imports PGN from the single More menu and returns to Engine", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><TooltipProvider><Analysis/></TooltipProvider></BoardSettingsProvider>
        </MemoryRouter>);

        fireEvent.keyDown(screen.getByRole("button", { name: "Додаткові дії аналізу" }), { key: "ArrowDown" });
        fireEvent.click(screen.getByRole("menuitem", { name: "Імпорт PGN" }));
        const editor = screen.getByRole("textbox", { name: "Paste PGN or FEN" });
        fireEvent.change(editor, { target: { value: '[Event "Import"]\n\n1. e4 e5 2. Nf3 Nc6 *' } });
        fireEvent.click(screen.getByRole("button", { name: "Відкрити для аналізу" }));

        await waitFor(() => expect(screen.getByText("e4")).toBeInTheDocument());
        expect(screen.getByRole("tab", { name: /Движок/i })).toHaveAttribute("aria-selected", "true");
        expect(screen.queryByRole("tab", { name: /Ходи/i })).not.toBeInTheDocument();
    });
});
