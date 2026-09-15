import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Chess } from 'chess.js';
import { BoardSettingsProvider, BOARD_THEMES } from '@/contexts/BoardSettingsContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Analysis from '@/pages/AnalysisCenter';
import analyzeFenWithStockfish from '@/lib/stockfish';
import { ANALYSIS_PREFERENCES_KEY, readAnalysisPreferences } from '@/features/analysis/preferences';
import { POSITION_CACHE_KEY } from '@/features/analysis/positionCache';
import { toast } from 'sonner';

// Keep the real shared ChessBoard adapter; inspect the options it delivers to its renderer.
vi.mock('react-chessboard', () => ({ Chessboard: (props: Record<string, unknown>) => <div data-testid="settings-board" data-options={JSON.stringify(props)} /> }));
vi.mock('@/lib/stockfish', () => ({ default: vi.fn(async (fen: string, depth: number) => {
  const pv = new Chess(fen).moves({ verbose: true }).slice(0, 1).map(move => move.lan);
  return { backend: 'worker', scoreCp: 20, scoreMate: null, bestmove: pv[0], pv, depth, raw: [], lines: [{ multipv: 1, scoreCp: 20, scoreMate: null, pv, depth }] };
}) }));
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
const originalWidth = window.innerWidth, originalHeight = window.innerHeight;
afterEach(() => { Object.defineProperty(window, 'innerWidth', { value: originalWidth, configurable: true }); Object.defineProperty(window, 'innerHeight', { value: originalHeight, configurable: true }); cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.mocked(analyzeFenWithStockfish).mockClear(); });
function open(pgn = '1. e4 e5 2. Nf3 Nc6 3. Bc4 *') {
  return render(<MemoryRouter initialEntries={[{ pathname: '/analysis', state: { pgn } }]}><BoardSettingsProvider><TooltipProvider><Analysis /></TooltipProvider></BoardSettingsProvider></MemoryRouter>);
}
const settings = () => fireEvent.click(screen.getByRole('button', { name: 'Налаштування аналізу' }));
const closeSettings = () => fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
const toggle = (name: string) => fireEvent.click(screen.getByRole('switch', { name: new RegExp(name) }));
const board = () => JSON.parse(screen.getByTestId('settings-board').getAttribute('data-options')!);

describe('Analysis settings controls', () => {
  it('applies every board theme, coordinates and animation through the real shared board', () => {
    open(); settings();
    for (const theme of BOARD_THEMES) {
      fireEvent.change(screen.getByLabelText('Тема дошки'), { target: { value: theme.id } });
      expect(board().customLightSquareStyle.backgroundColor).toBe(theme.light);
      expect(board().customDarkSquareStyle.backgroundColor).toBe(theme.dark);
    }
    toggle('Координати'); expect(board().showBoardNotation).toBe(false);
    toggle('Координати'); expect(board().showBoardNotation).toBe(true);
    toggle('Анімація ходів'); expect(board().animationDuration).toBe(0);
    toggle('Анімація ходів'); expect(board().animationDuration).toBe(150);
  });
  it('toggles arrows independently of opening badges and retains settings after remount', async () => {
    const view = open();
    await waitFor(() => expect(board().customArrows).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Хід позначено як теорію' })).toBeInTheDocument();
    settings(); toggle('Стрілка найкращого ходу'); expect(board().customArrows).toHaveLength(0);
    toggle('Стрілка найкращого ходу'); expect(board().customArrows).toHaveLength(1);
    toggle('Позначки якості ходу'); closeSettings();
    expect(screen.queryByRole('button', { name: 'Хід позначено як теорію' })).not.toBeInTheDocument();
    settings();
    for (const name of ['Координати', 'Анімація ходів', 'Прокручувати до вибраного ходу', 'Компактна дошка на телефоні', 'Фокус на активному варіанті', 'Економний режим']) toggle(name);
    fireEvent.click(screen.getByRole('button', { name: /Розширений/ }));
    view.unmount(); open(); settings();
    for (const name of ['Координати', 'Анімація ходів', 'Прокручувати до вибраного ходу', 'Компактна дошка на телефоні', 'Позначки якості ходу']) expect(screen.getByRole('switch', { name: new RegExp(name) })).toHaveAttribute('aria-checked', 'false');
    for (const name of ['Фокус на активному варіанті', 'Економний режим', 'Стрілка найкращого ходу']) expect(screen.getByRole('switch', { name: new RegExp(name) })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: /Розширений/ })).toHaveAttribute('aria-pressed', 'true');
    expect(board().animationDuration).toBe(0); expect(board().showBoardNotation).toBe(false);
    closeSettings(); fireEvent.click(screen.getByRole('tab', { name: /Движок/ }));
    expect(screen.getByLabelText('Розширені дані движка')).toHaveTextContent('MultiPV1');
    settings(); fireEvent.click(screen.getByRole('button', { name: /Простий/ })); closeSettings();
    expect(screen.queryByLabelText('Розширені дані движка')).not.toBeInTheDocument();
  });
  it('sends all depth and MultiPV choices to the engine and restores them', async () => {
    const view = open(''); settings();
    for (const [label, depth] of [['Швидкий D8', 8], ['Стандартний D12', 12], ['Глибокий D16', 16]] as const) {
      fireEvent.click(screen.getByRole('button', { name: label }));
      await waitFor(() => expect(vi.mocked(analyzeFenWithStockfish).mock.calls.some(call => call[1] === depth)).toBe(true));
    }
    for (const multiPv of [1, 2, 3, 5]) {
      fireEvent.click(screen.getByRole('button', { name: `Кількість варіантів: ${multiPv}` }));
      await waitFor(() => expect(vi.mocked(analyzeFenWithStockfish).mock.calls.some(call => call[1] === 16 && call[4]?.multiPv === multiPv)).toBe(true));
    }
    view.unmount(); open(''); settings();
    expect(screen.getByRole('button', { name: 'Глибокий D16' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Кількість варіантів: 5' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('collapses inactive branches, restores follow selection and switches the mobile layout', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    const view = open('1. e4 (1. d4 d5) e5 *');
    const compactSize = board().boardWidth; settings();
    toggle('Фокус на активному варіанті'); toggle('Прокручувати до вибраного ходу'); toggle('Компактна дошка на телефоні'); closeSettings();
    expect(screen.getByRole('button', { name: /Відкрити 1.d4/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Показати вибраний хід' })).not.toBeInTheDocument();
    expect(view.container.querySelector('.analysis-mobile-focus')).toBeNull();
    expect(board().boardWidth).toBeGreaterThan(compactSize);
    settings(); toggle('Фокус на активному варіанті'); toggle('Прокручувати до вибраного ходу'); toggle('Компактна дошка на телефоні'); closeSettings();
    expect(screen.queryByRole('button', { name: /Відкрити 1.d4/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показати вибраний хід' })).toBeInTheDocument();
    expect(view.container.querySelector('.analysis-mobile-focus')).not.toBeNull();
    expect(board().boardWidth).toBe(compactSize);
  });
  it('clears the cache, cancels the previous request and searches the same position again', async () => {
    open(''); await waitFor(() => expect(localStorage.getItem(POSITION_CACHE_KEY)).not.toBeNull());
    const lastCall = vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)!;
    const before = vi.mocked(analyzeFenWithStockfish).mock.calls.length;
    settings(); fireEvent.click(screen.getByRole('button', { name: 'Очистити кеш Stockfish' }));
    expect(lastCall[4]?.signal?.aborted).toBe(true);
    expect(localStorage.getItem(POSITION_CACHE_KEY)).toBeNull();
    await waitFor(() => expect(analyzeFenWithStockfish).toHaveBeenCalledTimes(before + 1));
    expect(vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)![0]).toBe(lastCall[0]);
  });
  it('pauses economy searches while hidden and resumes on visibility', async () => {
    open(''); settings(); toggle('Економний режим');
    await waitFor(() => expect(vi.mocked(analyzeFenWithStockfish).mock.calls.some(call => call[1] === 8 && call[4]?.multiPv === 1)).toBe(true));
    const request = vi.mocked(analyzeFenWithStockfish).mock.calls.at(-1)!;
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(request[4]?.signal?.aborted).toBe(true); expect(board().customArrows).toHaveLength(0);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(board().customArrows).toHaveLength(1));
  });
  it('handles invalid stored settings and reports storage failures without fake success', () => {
    localStorage.setItem(ANALYSIS_PREFERENCES_KEY, JSON.stringify({ economy: 'false', engineDepth: 99, multiPv: -1 }));
    expect(readAnalysisPreferences()).toMatchObject({ economy: false, engineDepth: 12, multiPv: 3 });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    const failure = vi.spyOn(toast, 'error');
    open(); settings(); toggle('Анімація ходів');
    expect(board().animationDuration).toBe(0);
    expect(screen.getByText(/Налаштування діють, але не збережені/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Очистити кеш Stockfish' }));
    expect(failure).toHaveBeenCalledWith('Не вдалося очистити кеш: сховище недоступне.');
  });
});
