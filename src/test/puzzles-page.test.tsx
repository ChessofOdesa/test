import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BoardSettingsProvider } from '@/contexts/BoardSettingsContext';
import Puzzles from '@/pages/Puzzles';
import { Chess } from 'chess.js';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { freshProgress, saveProgress, readProgress } from '@/features/puzzles/training';
vi.mock('@/features/puzzles/PuzzleReview', () => ({ PuzzleReview: ({ actions }: { actions?: ReactNode }) => <div>Розбір задачі{actions}</div> }));
vi.mock('@/features/puzzles/verifyAlternative', () => ({ verifyAlternative: vi.fn(async () => null) }));
vi.mock('@/components/ChessBoard', () => ({ default: (p: { displayFen: string; onMove: (a: string,b: string) => boolean; interactive: boolean; flipped: boolean; lastMoveSquares?: string[]; animationDuration?: number; captureFadeSquare?: string }) => <div data-testid="puzzle-board" data-fen={p.displayFen} data-flipped={String(p.flipped)} data-last-move={p.lastMoveSquares?.join('')} data-animation={p.animationDuration} data-capture={p.captureFadeSquare}>{['e2e4','d2d4','g1f3','e4d5'].map(move => <button key={move} disabled={!p.interactive} onClick={() => p.onMove(move.slice(0,2),move.slice(2,4))}>{move}</button>)}</div> }));
const puzzles = [
    { id: 'a', fen: new Chess().fen(), solution: ['e2e4','e7e5','g1f3'], rating: 1500, theme: 'Тактика', title: 'A' },
    { id: 'b', fen: new Chess().fen(), solution: ['d2d4'], rating: 1800, theme: 'Мат', title: 'B' }
];
function Location() { const location = useLocation(); return <output data-testid="location">{location.state?.pgn || location.search}</output>; }
function open(path = "/puzzles") { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<MemoryRouter initialEntries={[path]}><QueryClientProvider client={client}><BoardSettingsProvider><Puzzles /><Location /></BoardSettingsProvider></QueryClientProvider></MemoryRouter>); }
beforeEach(() => {
    vi.mocked(verifyAlternative).mockReset().mockResolvedValue(null);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    vi.stubGlobal('fetch', vi.fn(async (path: string) => ({ ok: true, json: async () => path.includes('manifest') ? { count: 2, themes: ['Тактика','Мат'], chunks: [{ file: 'one.json', count: 2, themes: ['Тактика','Мат'] }] } : puzzles })));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
describe('Puzzle studio', () => {
    it('displays the player move before the automatic reply without delaying saved progress', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        const afterPlayer = new Chess(); afterPlayer.move('e4');
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', afterPlayer.fen());
        expect(readProgress().current?.step).toBe(2);
        expect(screen.getByRole('button', { name: 'g1f3' })).toBeDisabled();
        afterPlayer.move('e5');
        await waitFor(() => expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', afterPlayer.fen()));
        expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled();
    });
    it('fades a captured piece without changing the recorded move', async () => {
        const puzzle = { id: 'capture', fen: '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', solution: ['e4d5'], rating: 1500, theme: 'Тактика', title: 'Capture' };
        saveProgress({ ...freshProgress(), current: { puzzle, step: 0, complete: false, wrong: false, assisted: false, hintLevel: 0 } });
        expect(readProgress().current?.puzzle.id).toBe('capture');
        open(); await screen.findByTestId('puzzle-board');
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', puzzle.fen);
        await waitFor(() => expect(screen.getByRole('button', { name: 'e4d5' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'e4d5' }));
        expect(readProgress().current?.step).toBe(1);
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-capture', 'd5');
        expect(readProgress().current?.complete).toBe(true);
        expect(screen.queryByRole('button', { name: 'Наступна задача' })).not.toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Наступна задача' })).toBeEnabled();
    });
    it('removes board travel and reply delay for reduced motion', async () => {
        vi.stubGlobal('matchMedia', (media: string) => ({ media, matches: media.includes('prefers-reduced-motion'), addEventListener: vi.fn(), removeEventListener: vi.fn() }));
        open(); await screen.findByTestId('puzzle-board');
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-animation', '0');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        const final = new Chess(); final.move('e4'); final.move('e5');
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', final.fen());
        expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled();
    });
    it('puts the title in the stats panel, removes rejected controls and prevents skipping by settings', async () => {
        open(); await screen.findByTestId('puzzle-board');
        expect(within(screen.getByRole('complementary', { name: 'Рейтинг гравця' })).getByRole('heading', { name: 'Задачі' })).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        for (const name of ['Пропустити','Наступна задача','Записати варіант','Почати заново']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' }));
        fireEvent.click(screen.getByRole('button', { name: 'Застосувати теми' }));
        fireEvent.click(screen.getByRole('button', { name: 'Складніше' }));
        expect(readProgress().current?.puzzle.id).toBe('a');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        expect(screen.queryByRole('button', { name: 'Наступна задача' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'g1f3' })).toBeDisabled();
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        expect(readProgress().rating).toBe(1512);
        fireEvent.click(await screen.findByRole('button', { name: 'Наступна задача' }));
        await waitFor(() => expect(readProgress().current?.puzzle.id).toBe('b'));
    });
    it('persists wrong moves, hints and the position across remount without awarding a clean success', async () => {
        const view = open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'd2d4' }));
        await waitFor(() => expect(readProgress().current?.wrong).toBe(true));
        expect(document.querySelector('.puzzle-move-mark.is-wrong')).toHaveAttribute('data-square', 'd4');
        fireEvent.click(screen.getByRole('button', { name: 'Підказка' }));
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        expect(document.querySelector('.puzzle-move-mark.is-correct')).toHaveAttribute('data-square', 'e4');
        const transitionalFen = screen.getByTestId('puzzle-board').getAttribute('data-fen');
        view.unmount(); open();
        const savedFen = new Chess(); savedFen.move('e4'); savedFen.move('e5');
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', savedFen.fen());
        expect(screen.getByTestId('puzzle-board')).not.toHaveAttribute('data-fen', transitionalFen);
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        expect(readProgress().rating).toBe(1488); expect(readProgress().clean).toBe(0); expect(readProgress().solved).toBe(1);
    });
    it('flips the board and opens the full solution in analysis after completion', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'Перевернути' })); expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-flipped','true');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Відкрити в аналізі' }));
        const game = new Chess(); game.loadPgn(screen.getByTestId('location').textContent!); expect(game.history()).toEqual(['e4', 'e5', 'Nf3']);
    });

    it('keeps the task, rating and themes on the left, hints on the right, and persists a popup choice without skipping', async () => {
        const view = open(); await screen.findByTestId('puzzle-board');
        const left = within(screen.getByRole('complementary', { name: 'Рейтинг гравця' }));
        expect(left.getByText('1500')).toBeInTheDocument();
        expect(left.getByText('Налаштування')).toBeInTheDocument();
        expect(left.getByText('Налаштування').closest('summary')).toHaveTextContent('Мій рівень');
        for (const text of ['Розв’язано', 'Сьогодні', 'Серія правильних', 'Без помилок і підказок', 'Про рейтинг']) expect(left.queryByText(text)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Зберегти|Збережені/ })).not.toBeInTheDocument();
        expect(within(screen.getByRole('complementary', { name: 'Керування тренуванням' })).getByRole('button', { name: 'Підказка' })).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(left.getByRole('button', { name: 'Вибрати тему задач' }));
        expect(within(screen.getByTestId('puzzle-board')).getByText('e2e4')).toBeDisabled();
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Змішані задачі' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' }));
        fireEvent.click(screen.getByRole('button', { name: 'Застосувати теми' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(readProgress().selectedThemes).toEqual(['Мат']);
        expect(readProgress().current?.puzzle.id).toBe('a');
        view.unmount(); open();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Вибрати тему задач' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(readProgress().selectedThemes).toEqual(['Мат']);
        expect(screen.getByRole('button', { name: 'e2e4' })).toBeEnabled();
    });
    it('searches and applies several themes together, cancelling a draft leaves the selection intact', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        fireEvent.change(screen.getByLabelText('Пошук теми'), { target: { value: 'мат' } });
        expect(within(screen.getByRole('dialog')).queryByRole('button', { name: 'Тактика' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Мат' }));
        fireEvent.change(screen.getByLabelText('Пошук теми'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'Тактика' }));
        expect(readProgress().selectedThemes).toBeUndefined();
        fireEvent.click(screen.getByRole('button', { name: 'Застосувати теми' }));
        expect(readProgress().selectedThemes).toEqual(['Мат', 'Тактика']);
        expect(readProgress().current?.puzzle.id).toBe('a');
        expect(within(screen.getByRole('complementary', { name: 'Рейтинг гравця' })).getByText(/Обрано тем: 2/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        fireEvent.click(screen.getByRole('button', { name: 'Змішані задачі' }));
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(readProgress().selectedThemes).toEqual(['Мат', 'Тактика']);
    });
    it('locks hints while checking and leaves rating and mistakes unchanged on engine failure', async () => {
        let reject!: (error: Error) => void;
        vi.mocked(verifyAlternative).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'd2d4' }));
        expect(screen.getByRole('button', { name: 'Підказка' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'e2e4' })).toBeDisabled();
        reject(new Error('offline'));
        await screen.findByText(/Штрафу немає/);
        expect(readProgress().current?.wrong).toBe(false);
        expect(readProgress().rating).toBe(1500);
        expect(screen.getByRole('button', { name: 'Підказка' })).toBeEnabled();
    });
    it('ignores late engine results after leaving the page', async () => {
        let resolve!: (result: null) => void;
        vi.mocked(verifyAlternative).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
        const view = open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'd2d4' }));
        const signal = vi.mocked(verifyAlternative).mock.calls[0][2];
        view.unmount(); expect(signal.aborted).toBe(true);
        resolve(null); await Promise.resolve();
        expect(readProgress().current?.wrong).toBe(false);
    });
    it('opens a shared ID with its answer hidden and never replaces an unfinished attempt', async () => {
        const view = open('/puzzles?puzzle=b'); await screen.findByTestId('puzzle-board');
        expect(readProgress().current?.puzzle.id).toBe('b');
        expect(screen.queryByText('Розбір задачі')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Відкрити в аналізі' })).not.toBeInTheDocument();
        view.unmount(); localStorage.clear();
        saveProgress({ ...freshProgress(), current: { puzzle: puzzles[0], step: 0, complete: false, wrong: false, assisted: false, hintLevel: 0 } });
        open('/puzzles?puzzle=b'); await screen.findByText('Спільна задача відкриється після завершення поточної.');
        await waitFor(() => expect(screen.getByRole('button', { name: 'e2e4' })).toBeEnabled());
        expect(readProgress().current?.puzzle.id).toBe('a');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-last-move', '');
        await waitFor(() => expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-last-move', 'e7e5'));
        expect(screen.getByText('Правильно! Продовжуйте.').parentElement).toHaveClass('is-correct');
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Наступна задача' }));
        await waitFor(() => expect(readProgress().current?.puzzle.id).toBe('b'));
    });
    it('offers a manual share link if clipboard is unavailable and contains no answer', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'Поділитися' }));
        await screen.findByText('Скопіюй посилання з поля нижче.');
        const url = new URL((screen.getByLabelText('Посилання на задачу') as HTMLInputElement).value);
        expect([...url.searchParams.keys()]).toEqual(['puzzle']); expect(url.searchParams.get('puzzle')).toBe('a');
        expect(url.hash).toBe('');
    });
    it('queues an explicit range without replacing the puzzle and allows resetting to automatic difficulty', async () => {
        open(); await screen.findByTestId('puzzle-board');
        const settings = screen.getByText('Налаштування').closest('details')!;
        expect(settings).not.toHaveAttribute('open');
        fireEvent.click(screen.getByText('Налаштування'));
        expect(settings).toHaveAttribute('open');
        const range = screen.getByText('Точний діапазон').closest('details')!;
        expect(range).not.toHaveAttribute('open');
        fireEvent.click(screen.getByText('Точний діапазон'));
        expect(range).toHaveAttribute('open');
        fireEvent.change(screen.getByLabelText('Мінімальний рейтинг задач'), { target: { value: '1750' } });
        fireEvent.change(screen.getByLabelText('Максимальний рейтинг задач'), { target: { value: '1850' } });
        fireEvent.click(screen.getByRole('button', { name: 'Застосувати діапазон' }));
        expect(readProgress().ratingRange).toEqual({ min: 1750, max: 1850 }); expect(readProgress().current?.puzzle.id).toBe('a');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Наступна задача' }));
        await waitFor(() => expect(readProgress().current?.puzzle.id).toBe('b'));
        fireEvent.click(screen.getByRole('button', { name: 'Легше' })); expect(readProgress().ratingRange).toBeNull();
    });
    it('shows useful attempt context without duplicating the initial board instruction or exposing an answer', async () => {
        open(); await screen.findByTestId('puzzle-board');
        const right = within(screen.getByRole('complementary', { name: 'Керування тренуванням' }));
        expect(right.getByText('Задача активна')).toBeInTheDocument();
        expect(right.getByLabelText('Статус задачі')).toHaveTextContent('0 помилок');
        expect(right.getByText('Без підказки')).toBeInTheDocument();
        expect(right.getByText('Рейтинг задачі').nextElementSibling).toHaveTextContent('1500');
        for (const text of ['Тренування', 'Спроба', 'Спроба триває', 'Позиція']) expect(right.queryByText(text)).not.toBeInTheDocument();
        expect(right.getByText('Перевір шахи, взяття та загрози.')).toBeInTheDocument();
        expect(within(screen.getByRole('region', { name: 'Дошка задачі' })).queryByText('0')).not.toBeInTheDocument();
        expect(screen.queryByText('Знайди найкращий хід')).not.toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /варіант Stockfish/i })).not.toBeInTheDocument();
        expect(right.queryByText('Розбір задачі')).not.toBeInTheDocument();
    });
    it('starts mobile difficulty collapsed while keeping hints available', async () => {
        const match = vi.spyOn(window, 'matchMedia');
        const original = window.matchMedia('(max-width: 760px)');
        match.mockImplementation(query => ({ ...original, matches: query === '(max-width: 760px)' }));
        try {
            open(); await screen.findByTestId('puzzle-board');
            const summary = screen.getByText('Налаштування');
            expect(summary.closest('details')).not.toHaveAttribute('open');
            expect(screen.getByRole('button', { name: 'Підказка' })).toBeEnabled();
            fireEvent.click(summary); expect(summary.closest('details')).toHaveAttribute('open');
        } finally { match.mockRestore(); }
    });
    it('recovers from an empty filter without showing instructions for a nonexistent puzzle', async () => {
        saveProgress({ ...freshProgress(), ratingRange: { min: 4000, max: 4000 } });
        open(); await screen.findByText('Немає нових задач за вибраною темою та діапазоном.');
        expect(screen.queryByText('Знайди найкращий хід')).not.toBeInTheDocument();
        expect(screen.queryByText('Наступна задача стане доступною після розв’язання.')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Налаштування'));
        fireEvent.click(screen.getByText(/Точний діапазон/));
        fireEvent.click(screen.getByRole('button', { name: 'Автоматична складність' }));
        fireEvent.click(screen.getByRole('button', { name: 'Завантажити вибрану добірку' }));
        await screen.findByTestId('puzzle-board');
        expect(readProgress().current?.puzzle.id).toBe('a');
    });
    it('blocks repeated next clicks while a new shard is pending and rates completion only once', async () => {
        const done = { puzzle: puzzles[0], step: 3, complete: true, wrong: false, assisted: false, hintLevel: 0 };
        saveProgress({ ...freshProgress(), current: done, completed: ['a'], solved: 1, clean: 1 });
        let resolve!: (value: Response) => void;
        vi.mocked(fetch).mockImplementation(async path => String(path).includes('manifest')
            ? { ok: true, json: async () => ({ count: 2, themes: ['Тактика','Мат'], chunks: [{ file: 'one.json', count: 2, themes: ['Тактика','Мат'] }] }) } as Response
            : new Promise<Response>(done => { resolve = done; }));
        open(); await waitFor(() => expect(screen.getByRole('button', { name: 'Наступна задача' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Наступна задача' }));
        fireEvent.click(screen.getByRole('button', { name: 'Наступна задача' }));
        expect(screen.getByRole('button', { name: 'Наступна задача' })).toBeDisabled();
        expect(readProgress().solved).toBe(1);
        resolve({ ok: true, json: async () => puzzles } as Response);
        await waitFor(() => expect(readProgress().current?.puzzle.id).toBe('b'));
        expect(vi.mocked(fetch).mock.calls.filter(([p]) => String(p).includes('one.json'))).toHaveLength(1);
    });
    it('reports a load error and retries rather than leaving an endless loader', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
        open(); const retry = await screen.findByRole('button', { name: 'Повторити завантаження' });
        fireEvent.click(retry); await screen.findByTestId('puzzle-board');
    });
    it('shows a Ukrainian error and preserves retry when the puzzle shard fetch rejects', async () => {
        const regularFetch = vi.mocked(fetch).getMockImplementation()!;
        vi.mocked(fetch).mockImplementationOnce(regularFetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));
        open();
        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('Не вдалося завантажити задачу. Спробуйте ще раз.');
        expect(alert).not.toHaveTextContent('Failed to fetch');
        fireEvent.click(within(alert).getByRole('button', { name: 'Повторити завантаження' }));
        await screen.findByTestId('puzzle-board');
    });
});
