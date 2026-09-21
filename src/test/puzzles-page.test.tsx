import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BoardSettingsProvider } from '@/contexts/BoardSettingsContext';
import Puzzles from '@/pages/Puzzles';
import { Chess } from 'chess.js';
import { verifyAlternative } from '@/features/puzzles/verifyAlternative';
import { readProgress } from '@/features/puzzles/training';
vi.mock('@/features/puzzles/verifyAlternative', () => ({ verifyAlternative: vi.fn(async () => null) }));
vi.mock('@/components/ChessBoard', () => ({ default: (p: { displayFen: string; onMove: (a: string,b: string) => boolean; interactive: boolean; flipped: boolean }) => <div data-testid="puzzle-board" data-fen={p.displayFen} data-flipped={String(p.flipped)}>{['e2e4','d2d4','g1f3'].map(move => <button key={move} disabled={!p.interactive} onClick={() => p.onMove(move.slice(0,2),move.slice(2,4))}>{move}</button>)}</div> }));
const puzzles = [
    { id: 'a', fen: new Chess().fen(), solution: ['e2e4','e7e5','g1f3'], rating: 1500, theme: 'Тактика', title: 'A' },
    { id: 'b', fen: new Chess().fen(), solution: ['d2d4'], rating: 1800, theme: 'Мат', title: 'B' }
];
function Location() { const location = useLocation(); return <output data-testid="location">{location.state?.pgn || location.search}</output>; }
function open() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<MemoryRouter><QueryClientProvider client={client}><BoardSettingsProvider><Puzzles /><Location /></BoardSettingsProvider></QueryClientProvider></MemoryRouter>); }
beforeEach(() => {
    vi.mocked(verifyAlternative).mockReset().mockResolvedValue(null);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('fetch', vi.fn(async (path: string) => ({ ok: true, json: async () => path.includes('manifest') ? { count: 2, themes: ['Тактика','Мат'], chunks: [{ file: 'one.json', count: 2, themes: ['Тактика','Мат'] }] } : puzzles })));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
describe('Puzzle studio', () => {
    it('puts the title in the stats panel, removes rejected controls and prevents skipping by settings', async () => {
        open(); await screen.findByTestId('puzzle-board');
        expect(within(screen.getByRole('complementary', { name: 'Рейтинг задач' })).getByRole('heading', { name: 'Задачі' })).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        for (const name of ['Пропустити','Наступна задача','Записати варіант','Почати заново']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' }));
        fireEvent.click(screen.getByRole('button', { name: 'Складніше' }));
        expect(readProgress().current?.puzzle.id).toBe('a');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        expect(screen.queryByRole('button', { name: 'Наступна задача' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        expect(readProgress().rating).toBe(1512);
        fireEvent.click(screen.getByRole('button', { name: 'Наступна задача' }));
        await waitFor(() => expect(readProgress().current?.puzzle.id).toBe('b'));
    });
    it('persists wrong moves, hints and the position across remount without awarding a clean success', async () => {
        const view = open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'd2d4' }));
        await waitFor(() => expect(readProgress().current?.wrong).toBe(true));
        fireEvent.click(screen.getByRole('button', { name: 'Підказка' }));
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        const fen = screen.getByTestId('puzzle-board').getAttribute('data-fen');
        view.unmount(); open();
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', fen);
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        expect(readProgress().rating).toBe(1488); expect(readProgress().clean).toBe(0); expect(readProgress().solved).toBe(1);
    });
    it('flips the board and opens the full solution in analysis after completion', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'Перевернути' })); expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-flipped','true');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' })); fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        fireEvent.click(screen.getByRole('button', { name: 'Відкрити в аналізі' }));
        const game = new Chess(); game.loadPgn(screen.getByTestId('location').textContent!); expect(game.history()).toEqual(['e4', 'e5', 'Nf3']);
    });

    it('keeps only rating and themes on the left, hints on the right, and persists a popup choice without skipping', async () => {
        const view = open(); await screen.findByTestId('puzzle-board');
        const left = within(screen.getByRole('complementary', { name: 'Рейтинг задач' }));
        expect(left.getByText('1500')).toBeInTheDocument();
        for (const text of ['Розв’язано', 'Сьогодні', 'Серія правильних', 'Без помилок і підказок', 'Про рейтинг']) expect(left.queryByText(text)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Зберегти|Збережені/ })).not.toBeInTheDocument();
        expect(within(screen.getByRole('complementary', { name: 'Керування тренуванням' })).getByRole('button', { name: 'Підказка' })).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        fireEvent.click(left.getByRole('button', { name: 'Вибрати тему задач' }));
        expect(within(screen.getByTestId('puzzle-board')).getByText('e2e4')).toBeDisabled();
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Змішані задачі' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(readProgress().theme).toBe('Мат');
        expect(readProgress().current?.puzzle.id).toBe('a');
        view.unmount(); open();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Вибрати тему задач' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'Вибрати тему задач' }));
        expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Мат' })).toHaveAttribute('aria-pressed', 'true');
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        expect(readProgress().theme).toBe('Мат');
        expect(screen.getByRole('button', { name: 'e2e4' })).toBeEnabled();
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
    it('reports a load error and retries rather than leaving an endless loader', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
        open(); const retry = await screen.findByRole('button', { name: 'Повторити завантаження' });
        fireEvent.click(retry); await screen.findByTestId('puzzle-board');
    });
});
