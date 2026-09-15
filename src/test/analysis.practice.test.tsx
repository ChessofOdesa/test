import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MistakeTraining, CompareLines } from '@/features/analysis/PracticeTools';
import { buildRecordFromPgn, createRecord, type EngineSummary } from '@/features/analysis/model';
vi.mock('@/components/ChessBoard', () => ({ default: ({ displayFen, onMove }: { displayFen: string; onMove?: (a: string, b: string) => void }) => <div data-testid="practice-board" data-fen={displayFen}>{onMove && <button onClick={() => onMove('e2', 'e4')}>Play e4</button>}</div> }));
afterEach(cleanup);
const result: EngineSummary = { backend: 'worker', fen: createRecord().rootFen, numericScore: 30, scoreCp: 30, scoreMate: null, bestMoveUci: 'e2e4', bestMoveSan: 'e4', pvSan: ['e4', 'e5'], lineSan: ['e4 e5'], lines: [], depth: 12 };
describe('Analysis practice tools', () => {
  it('hides the answer and only accepts a move after the engine responds', async () => {
    const record = buildRecordFromPgn('1. d4 *'); record.mainline[0].classification = 'mistake';
    let resolve!: (value: EngineSummary) => void;
    const analyze = vi.fn((_fen: string, _depth: number, _pv: number, _signal: AbortSignal) => new Promise<EngineSummary>(done => { resolve = done; }));
    render(<MistakeTraining record={record} analyze={analyze} onClose={() => {}} />);
    expect(screen.queryByText(/Лінія Stockfish:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Play e4'));
    expect(screen.getByText('Stockfish перевіряє…')).toBeInTheDocument();
    expect(screen.queryByText('Знайдено сильне продовження!')).not.toBeInTheDocument();
    await act(async () => resolve(result));
    expect(screen.getByText('Знайдено сильне продовження!')).toBeInTheDocument();
    expect(screen.getByText('Без підказки: 1')).toBeInTheDocument();
    expect(analyze.mock.calls[0][0]).toBe(record.rootFen);
  });
  it('aborts a pending practice check when closed', () => {
    const record = buildRecordFromPgn('1. d4 *'); record.mainline[0].classification = 'blunder';
    const analyze = vi.fn((_fen: string, _depth: number, _pv: number, _signal: AbortSignal) => new Promise<EngineSummary>(() => {}));
    const view = render(<MistakeTraining record={record} analyze={analyze} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Play e4')); view.unmount();
    expect(analyze.mock.calls[0][3].aborted).toBe(true);
  });
  it('compares legal played and engine positions and discloses a shorter line', async () => {
    const record = buildRecordFromPgn('1. d4 *'); record.currentPath = [0];
    const analyze = vi.fn(async () => result);
    render(<CompareLines record={record} analyze={analyze} onClose={() => {}} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Далі' })).toBeEnabled());
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Далі' })); });
    const boards = screen.getAllByTestId('practice-board');
    expect(boards[0]).toHaveAttribute('data-fen', record.mainline[0].fenAfter);
    expect(boards[1].getAttribute('data-fen')).not.toBe(boards[0].getAttribute('data-fen'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Далі' })); });
    expect(screen.getByText('Лінія завершилася; показано її останню позицію.')).toBeInTheDocument();
  });
});
