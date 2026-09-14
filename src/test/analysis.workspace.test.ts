import { afterEach, describe, expect, it, vi } from 'vitest';
import { appendAnalysisLine, buildRecordFromPgn, createRecord, getCurrentFen, toSnapshot, updateRecordNode, type EngineSummary } from '@/features/analysis/model';
import { analysisMatches, deleteAnalysis, hydrateSnapshot, readDraft, readLibrary, readSharedAnalysis, redoRecord, saveAnalysis, saveDraft, shareAnalysis, undoRecord, withHistory } from '@/features/analysis/workspace';
import { clearPositionCache, POSITION_CACHE_KEY, readPositionCache, writePositionCache } from '@/features/analysis/positionCache';
import { editorFen } from '@/features/analysis/editorModel';
import { trainingAccepted } from '@/features/analysis/trainingModel';

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
const pgn = '[White "Андрій"]\n[Black "Суперник"]\n[Date "2026.09.14"]\n\n1. e4 (1. d4 {План} d5) e5 2. Nf3 *';
const evaluation = (cp = 30): EngineSummary => ({ fen: createRecord().rootFen, backend: 'worker', depth: 12, scoreCp: cp, scoreMate: null, numericScore: cp, bestMoveUci: 'e2e4', bestMoveSan: 'e4', pvSan: ['e4'], lineSan: ['e4'], lines: [] });

describe('Analysis persistence and sharing', () => {
  it('restores a selected branch, review and bookmark with fresh IDs', () => {
    let record = buildRecordFromPgn(pgn); record.currentPath = [-1, 0];
    record = updateRecordNode(record, [-1, 0], node => { node.bookmark = 'opening'; node.engineEval = 42; node.classification = 'good'; });
    saveDraft(record);
    const restored = readDraft()!;
    expect(getCurrentFen(restored)).toBe(getCurrentFen(record));
    expect(restored.rootVariations?.[0]).toMatchObject({ bookmark: 'opening', comment: 'План', engineEval: 42, classification: 'good' });
    expect(restored.rootVariations?.[0].id).not.toBe(record.rootVariations?.[0].id);
  });
  it('rejects illegal stored moves and tolerates unavailable storage', () => {
    const bad = toSnapshot(buildRecordFromPgn(pgn)); bad.mainline[0].uci = 'a1a8';
    expect(() => hydrateSnapshot(bad)).toThrow();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
    expect(readDraft()).toBeNull(); expect(readLibrary()).toEqual([]);
  });
  it('saves, finds, updates and deletes named analyses without duplicating the ID', () => {
    const record = buildRecordFromPgn(pgn);
    const item = saveAnalysis(record, 'Турнір', ['дебют', 'перевірити']);
    expect(analysisMatches(item, 'суперник')).toBe(true); expect(analysisMatches(item, '2026.09.14')).toBe(true); expect(analysisMatches(item, 'дебют')).toBe(true);
    saveAnalysis(record, 'Оновлено', ['готово'], item.id);
    expect(readLibrary()).toHaveLength(1); expect(readLibrary()[0].title).toBe('Оновлено');
    deleteAnalysis(item.id); expect(readLibrary()).toEqual([]);
  });
  it('round-trips a Unicode shared analysis and its selected root branch on another device', () => {
    const record = buildRecordFromPgn(pgn); record.currentPath = [-1, 0, 0];
    const link = shareAnalysis(record, 'https://example.test/analysis?old=1');
    localStorage.clear();
    const shared = readSharedAnalysis(new URL(link).hash)!;
    expect(shared.headers.White).toBe('Андрій'); expect(shared.rootVariations?.[0].comment).toBe('План'); expect(getCurrentFen(shared)).toBe(getCurrentFen(record));
    const position = readSharedAnalysis(new URL(shareAnalysis(record, 'https://example.test/analysis', true)).hash)!;
    expect(position.mainline).toEqual([]); expect(position.rootFen).toBe(getCurrentFen(record));
  });
  it('undoes and redoes comments and root insertion with the original selection', () => {
    const initial = buildRecordFromPgn('1. e4 e5 *'); initial.currentPath = null;
    const inserted = withHistory(initial, appendAnalysisLine(initial, ['d2d4']));
    const edited = withHistory(inserted, updateRecordNode(inserted, [-1, 0], node => { node.comment = 'Ідея'; node.bookmark = 'important'; }));
    const undo = undoRecord(edited);
    expect(undo.rootVariations?.[0].comment).toBe('');
    expect(undoRecord(undo).rootVariations).toEqual([]);
    expect(redoRecord(undo).rootVariations?.[0].comment).toBe('Ідея');
    expect(redoRecord(undo).currentPath).toEqual([-1, 0]);
  });
});

describe('Analysis calculation and editor', () => {
  it('persists exact-key engine results, expires them and clears the cache', () => {
    writePositionCache('12:3:fen', evaluation());
    expect(readPositionCache('12:3:fen')?.numericScore).toBe(30);
    expect(readPositionCache('8:1:fen')).toBeNull();
    const stored = JSON.parse(localStorage.getItem(POSITION_CACHE_KEY)!); stored[0].time = 0; localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(stored));
    expect(readPositionCache('12:3:fen')).toBeNull();
    clearPositionCache(); expect(localStorage.getItem(POSITION_CACHE_KEY)).toBeNull();
  });
  it('accepts an equal engine continuation and rejects a real loss for either color', () => {
    expect(trainingAccepted(evaluation(100), null, 'e2e4', 'w')).toBe(true);
    expect(trainingAccepted(evaluation(100), evaluation(90), 'd2d4', 'w')).toBe(true);
    expect(trainingAccepted(evaluation(100), evaluation(-200), 'd2d4', 'w')).toBe(false);
    expect(trainingAccepted(evaluation(-100), evaluation(100), 'd2d4', 'b')).toBe(false);
    expect(trainingAccepted({ ...evaluation(), scoreMate: 3 }, { ...evaluation(), scoreMate: -3 }, 'd2d4', 'w')).toBe(false);
  });
  it('builds a custom FEN with move number and castling, rejecting impossible rights and kings', () => {
    const position = { e1: 'wK', h1: 'wR', e8: 'bK' };
    expect(editorFen(position, 'b', 'K', '-', 4, 17)).toBe('4k3/8/8/8/8/8/8/4K2R b K - 4 17');
    expect(() => editorFen(position, 'w', 'Q', '-', 0, 1)).toThrow(/рокіровки/);
    expect(() => editorFen({}, 'w', '', '-', 0, 1)).toThrow();
    expect(() => editorFen({ e1: 'wK', e2: 'bK' }, 'w', '', '-', 0, 1)).toThrow();
  });
});
