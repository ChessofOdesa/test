import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { appendAnalysisLine, buildRecordFromPgn, createRecord, getCurrentFen, type AnalysisRecord } from '@/features/analysis/model';
import AnalysisMoveTree from '@/features/analysis/AnalysisMoveTree';

afterEach(cleanup);

const pgn = '[White "Анна"]\n[Black "Іван"]\n[WhiteElo "1900"]\n[Event "Клуб"]\n[Site "Одеса"]\n[Round "3"]\n[TimeControl "300+2"]\n\n1. e4 d5 2. e5 (2. exd5 {План} Qxd5 (2... c6) 3. Nc3) *';
function Tree({ initial }: { initial: AnalysisRecord }) {
  const [record, setRecord] = useState(initial);
  return <><AnalysisMoveTree record={record} setRecord={setRecord} onNavigate={path => setRecord(r => ({ ...r, currentPath: path }))} onOpenEngine={vi.fn()}/><output data-testid="fen">{getCurrentFen(record)}</output></>;
}

describe('Analysis variation actions', () => {
  it('deletes a selected branch while returning to its anchor', () => {
    const record = buildRecordFromPgn(pgn);
    record.currentPath = [1, 0];
    render(<Tree initial={record}/>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Дії для 2.exd5' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Видалити цей варіант' }));
    expect(screen.queryByText('exd5', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByTestId('fen')).toHaveTextContent(record.mainline[1].fenAfter);
  });

  it('promotes a variation and preserves the old continuation as a branch', () => {
    const record = buildRecordFromPgn(pgn);
    record.currentPath = [1, 0];
    render(<Tree initial={record}/>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Дії для 2.exd5' }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Зробити основною лінією' }));
    fireEvent.click(screen.getByRole('button', { name: 'Зробити основною' }));
    expect(screen.getByTestId('fen')).toHaveTextContent(record.mainline[1].children[0].fenAfter);
    expect(screen.getByText('e5', { exact: true }).closest('.analysis-inline-variation')).toBeTruthy();
  });
});

it('adds engine continuations atomically and reuses the same branch on a second insertion', () => {
  const record = buildRecordFromPgn('1. e4 d5 2. e5 *');
  record.currentPath = [1];
  const result = appendAnalysisLine(record, ['e4d5', 'd8d5']);
  expect(result.mainline.map(n => n.san)).toEqual(['e4', 'd5', 'e5']);
  expect(result.currentPath).toEqual([1, 0, 0]);
  const again = appendAnalysisLine({ ...result, currentPath: [1] }, ['e4d5', 'd8d5']);
  expect(again.mainline[1].children).toHaveLength(1);
  expect(again.mainline[1].children[0].children).toHaveLength(1);
  expect(() => appendAnalysisLine(record, ['e4d5', 'a1a8'])).toThrow();
  expect(record.mainline[1].children).toHaveLength(0);
});
