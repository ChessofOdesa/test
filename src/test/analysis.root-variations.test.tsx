import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AnalysisMoveTree from '@/features/analysis/AnalysisMoveTree';
import { appendAnalysisLine, buildRecordFromPgn, getCurrentFen, getRecordNode, restoreRecord, toSnapshot, type AnalysisRecord } from '@/features/analysis/model';
import { buildAnalysisPgn } from '@/features/analysis/pgnTree';
import { promoteRecordVariation } from '@/features/analysis/branching';
import { analysisNavigationLabel, lastAnalysisPath, nextAnalysisPath, previousAnalysisPath } from '@/features/analysis/navigation';

const source = '[Event "Odesa"]\n\n1. e4 (1. d4! {Центр} d5 (1... Nf6) 2. c4) (1. c4 e5) e5 2. Nf3 *';
const tree = (record: AnalysisRecord) => JSON.stringify({ mainline: record.mainline, roots: record.rootVariations }, (key, value) => key === 'id' ? undefined : value);
afterEach(cleanup);

function Workspace({ initial }: { initial: AnalysisRecord }) {
  const [record, setRecord] = useState(initial);
  return <><AnalysisMoveTree record={record} setRecord={setRecord} onNavigate={path => setRecord(current => ({ ...current, currentPath: path }))} onOpenEngine={vi.fn()} /><output data-testid="position">{getCurrentFen(record)}</output><output data-testid="export">{buildAnalysisPgn(record)}</output></>;
}

describe('Analysis alternatives from the starting position', () => {
  it('round-trips multiple root alternatives, nested alternatives, comments and NAGs', () => {
    const record = buildRecordFromPgn(source);
    expect(record.rootVariations?.map(node => node.san)).toEqual(['d4', 'c4']);
    expect(getRecordNode(record, [-1, 0, 1])?.san).toBe('Nf6');
    const exported = buildAnalysisPgn(record);
    expect(exported).toContain('1. e4 (1. d4 $1 {Центр}');
    expect(tree(buildRecordFromPgn(exported))).toBe(tree(record));
  });

  it('creates first-move alternatives without replacing or duplicating the saved game', () => {
    const initial = buildRecordFromPgn('1. e4 e5 *');
    initial.currentPath = null;
    const first = appendAnalysisLine(initial, ['d2d4', 'g8f6']);
    expect(first.currentPath).toEqual([-1, 0, 0]);
    expect(first.mainline.map(node => node.san)).toEqual(['e4', 'e5']);
    const repeated = appendAnalysisLine({ ...first, currentPath: null }, ['d2d4', 'g8f6']);
    expect(tree(repeated)).toBe(tree(first));
    expect(() => appendAnalysisLine(initial, ['d2d4', 'a1a8'])).toThrow();
    expect(initial.rootVariations).toEqual([]);
  });

  it('navigates the root branch, then returns to the starting position', () => {
    const record = buildRecordFromPgn(source);
    expect(previousAnalysisPath(record, [-1, 0])).toBeNull();
    expect(nextAnalysisPath(record, [-1, 0])).toEqual([-1, 0, 0]);
    expect(lastAnalysisPath(record, [-1, 0])).toEqual([-1, 0, 0, 0]);
    expect(analysisNavigationLabel(record, [-1, 0, 0])).toBe('Варіант 2 / 3');
    expect(nextAnalysisPath(record, [-1, 0, 1])).toBeNull();
    expect(nextAnalysisPath(record, null)).toEqual([0]);
  });

  it('promotes a nested root alternative while preserving the old game and siblings', () => {
    const record = buildRecordFromPgn(source);
    const promoted = promoteRecordVariation(record, [-1, 0, 1])!;
    expect(promoted.currentPath).toEqual([1]);
    expect(promoted.mainline.map(node => node.san)).toEqual(['d4', 'Nf6']);
    expect(promoted.mainline[0].children[0].san).toBe('d5');
    expect(promoted.rootVariations?.map(node => node.san)).toEqual(['e4', 'c4']);
    expect(tree(buildRecordFromPgn(buildAnalysisPgn(promoted)))).toBe(tree(promoted));
    expect(record.mainline[0].san).toBe('e4');
  });

  it('preserves roots in snapshots and restores old snapshots without roots', () => {
    const record = buildRecordFromPgn(source);
    const snapshot = toSnapshot(record);
    record.rootVariations![0].comment = 'Changed after saving';
    expect(restoreRecord(snapshot).rootVariations?.[0].comment).toBe('Центр');
    const { rootVariations: _roots, ...legacy } = snapshot;
    expect(restoreRecord(legacy).rootVariations).toEqual([]);
  });

  it('keeps custom FEN root alternatives and Black move numbers intact', () => {
    const pgn = '[SetUp "1"]\n[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 17"]\n\n17... e5 (17... d5 18. exd5) 18. Nf3 *';
    const record = buildRecordFromPgn(pgn);
    expect(record.rootVariations?.[0].moveNumber).toBe(17);
    expect(record.rootVariations?.[0].color).toBe('b');
    expect(tree(buildRecordFromPgn(buildAnalysisPgn(record)))).toBe(tree(record));
  });

  it('edits and deletes a selected first-move alternative through the existing menu', () => {
    const record = buildRecordFromPgn(source);
    record.currentPath = [-1, 0];
    render(<Workspace initial={record} />);
    expect(within(screen.getByLabelText('Список ходів')).getByText('d4')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Дії для 1.d4' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Редагувати коментар' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Коментар до ходу' }), { target: { value: 'Новий план' } });
    fireEvent.click(screen.getByRole('button', { name: 'Зберегти' }));
    expect(screen.getByTestId('export')).toHaveTextContent('{Новий план}');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Дії для 1.d4' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Видалити цей варіант' }));
    expect(screen.getByTestId('position')).toHaveTextContent(record.rootFen);
    expect(screen.getByTestId('export')).not.toHaveTextContent('Новий план');
    expect(screen.getByTestId('export')).toHaveTextContent('(1. c4');
  });
});
