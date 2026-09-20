import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BoardSettingsProvider } from '@/contexts/BoardSettingsContext';
import Puzzles from '@/pages/Puzzles';
import { Chess } from 'chess.js';
import { readProgress } from '@/features/puzzles/training';
vi.mock('@/components/ChessBoard', () => ({ default: (p: { displayFen: string; onMove: (a: string,b: string) => boolean; interactive: boolean; flipped: boolean }) => <div data-testid="puzzle-board" data-fen={p.displayFen} data-flipped={String(p.flipped)}>{['e2e4','d2d4','g1f3'].map(move => <button key={move} disabled={!p.interactive} onClick={() => p.onMove(move.slice(0,2),move.slice(2,4))}>{move}</button>)}</div> }));
const puzzles = [
    { id: 'a', fen: new Chess().fen(), solution: ['e2e4','e7e5','g1f3'], rating: 1500, theme: 'Тактика', title: 'A' },
    { id: 'b', fen: new Chess().fen(), solution: ['d2d4'], rating: 1800, theme: 'Мат', title: 'B' }
];
function Location() { return <output data-testid="location">{useLocation().search}</output>; }
function open() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<MemoryRouter><QueryClientProvider client={client}><BoardSettingsProvider><Puzzles /><Location /></BoardSettingsProvider></QueryClientProvider></MemoryRouter>); }
beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('fetch', vi.fn(async (path: string) => ({ ok: true, json: async () => path.includes('manifest') ? { count: 2, themes: ['Тактика','Мат'], chunks: [{ file: 'one.json', count: 2, themes: ['Тактика','Мат'] }] } : puzzles })));
});
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals(); });
describe('Puzzle studio', () => {
    it('puts the title in the stats panel, removes rejected controls and prevents skipping by settings', async () => {
        open(); await screen.findByTestId('puzzle-board');
        expect(within(screen.getByRole('complementary', { name: 'Рейтинг і статистика задач' })).getByRole('heading', { name: 'Задачі' })).toBeInTheDocument();
        expect(screen.queryByRole('tab')).not.toBeInTheDocument();
        for (const name of ['Пропустити','Наступна задача','Записати варіант','Почати заново']) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Добірка задач'), { target: { value: 'Мат' } });
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
        fireEvent.click(screen.getByRole('button', { name: 'Підказка' }));
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' }));
        const fen = screen.getByTestId('puzzle-board').getAttribute('data-fen');
        view.unmount(); open();
        expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-fen', fen);
        await waitFor(() => expect(screen.getByRole('button', { name: 'g1f3' })).toBeEnabled());
        fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        expect(readProgress().rating).toBe(1500); expect(readProgress().clean).toBe(0); expect(readProgress().solved).toBe(1);
    });
    it('saves bookmarks, flips the board and opens the original position in analysis after completion', async () => {
        open(); await screen.findByTestId('puzzle-board');
        fireEvent.click(screen.getByRole('button', { name: 'Зберегти' })); expect(readProgress().saved[0].id).toBe('a');
        fireEvent.click(screen.getByRole('button', { name: 'Перевернути' })); expect(screen.getByTestId('puzzle-board')).toHaveAttribute('data-flipped','true');
        fireEvent.click(screen.getByRole('button', { name: 'e2e4' })); fireEvent.click(screen.getByRole('button', { name: 'g1f3' }));
        fireEvent.click(screen.getByRole('button', { name: 'Відкрити в аналізі' }));
        expect(new URLSearchParams(screen.getByTestId('location').textContent!).get('fen')).toBe(puzzles[0].fen);
    });
    it('reports a load error and retries rather than leaving an endless loader', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
        open(); const retry = await screen.findByRole('button', { name: 'Повторити завантаження' });
        fireEvent.click(retry); await screen.findByTestId('puzzle-board');
    });
});
