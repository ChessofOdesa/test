import { Chess } from 'chess.js';
import { buildAnalysisPgn } from './pgnTree';
import { buildRecordFromPgn, createMoveNode, createRecord, getRecordNode, renderMoves, restoreRecord, toSnapshot, type AnalysisMoveNode, type AnalysisRecord, type AnalysisSnapshot, readStoredSessions, findOpening } from './model';

export const DRAFT_KEY = 'coo.analysis.draft.v2';
export const LIBRARY_KEY = 'coo.analysis.library.v2';
const MAX_BYTES = 3_000_000;
export type SavedAnalysis = { id: string; title: string; tags: string[]; updatedAt: string; snapshot: AnalysisSnapshot };
export const recordMoves = (record: AnalysisSnapshot) => [...renderMoves(record.mainline), ...renderMoves(record.rootVariations || [], 1, [-1])];
export function lineAtPath(record: AnalysisSnapshot, path: number[] | null) {
  if (!path) return [];
  const moves = path[0] < 0 ? [] : record.mainline.slice(0, path[0] + 1).map(node => node.uci);
  for (let n = 2; n <= path.length; n++) { const node = getRecordNode(record, path.slice(0, n)); if (node) moves.push(node.uci); }
  return moves;
}

/** Rebuild legal positions and IDs rather than trusting persisted tree objects. */
export function hydrateSnapshot(input: unknown): AnalysisRecord {
  if (!input || typeof input !== 'object') throw new Error('Неправильний аналіз.');
  const data = input as AnalysisSnapshot;
  const record = createRecord(new Chess(data.rootFen).fen());
  let count = 0;
  const read = (raw: AnalysisMoveNode, fen: string, ply: number, depth: number): AnalysisMoveNode => {
    if (++count > 4000 || depth > 200 || !raw || !Array.isArray(raw.children)) throw new Error('Завеликий або пошкоджений аналіз.');
    const chess = new Chess(fen); const move = chess.move(raw.uci);
    const node = createMoveNode(move, fen, chess.fen(), ply);
    node.comment = typeof raw.comment === 'string' ? raw.comment.slice(0, 10000) : '';
    node.nag = ['!', '?', '!!', '??', '!?', '?!'].includes(raw.nag || '') ? raw.nag : null;
    node.classification = ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'].includes(raw.classification || '') ? raw.classification : null;
    for (const key of ['evalLoss', 'engineEval', 'engineMate'] as const) node[key] = typeof raw[key] === 'number' && Number.isFinite(raw[key]) ? raw[key] : null;
    node.bestMoveSan = typeof raw.bestMoveSan === 'string' ? raw.bestMoveSan.slice(0, 20) : null;
    node.alternatives = Array.isArray(raw.alternatives) ? raw.alternatives.filter(x => typeof x === 'string').slice(0, 20) : [];
    node.explanation = typeof raw.explanation === 'string' ? raw.explanation.slice(0, 1000) : '';
    if (['important', 'check', 'opening'].includes(raw.bookmark || '')) node.bookmark = raw.bookmark;
    node.children = raw.children.map(child => read(child, node.fenAfter, ply + 1, depth + 1));
    return node;
  };
  let fen = record.rootFen;
  if (!Array.isArray(data.mainline)) throw new Error('Немає дерева ходів.');
  record.mainline = data.mainline.map((raw, i) => { const node = read(raw, fen, i + 1, 0); fen = node.fenAfter; return node; });
  record.rootVariations = (data.rootVariations || []).map(raw => read(raw, record.rootFen, 1, 0));
  record.headers = Object.fromEntries(Object.entries(data.headers || {}).filter(([key, value]) => /^\w+$/.test(key) && typeof value === 'string').map(([key, value]) => [key, value.slice(0, 1000)]));
  record.currentPath = Array.isArray(data.currentPath) && data.currentPath.every(Number.isInteger) && getRecordNode(record, data.currentPath) ? [...data.currentPath] : null;
  return record;
}
function readJson(key: string): unknown { try { const text = localStorage.getItem(key); return text && text.length <= MAX_BYTES ? JSON.parse(text) : null; } catch { return null; } }
function writeJson(key: string, value: unknown) { const text = JSON.stringify(value); if (text.length > MAX_BYTES) throw new Error('Аналіз завеликий для локального збереження. Експортуйте PGN.'); localStorage.setItem(key, text); }
export function readDraft() { try { const data = readJson(DRAFT_KEY); return data ? hydrateSnapshot(data) : null; } catch { return null; } }
export function saveDraft(record: AnalysisRecord) { writeJson(DRAFT_KEY, toSnapshot(record)); }
export function readLibrary(): SavedAnalysis[] {
  const data = readJson(LIBRARY_KEY);
  if (!Array.isArray(data)) return readStoredSessions().map(item => ({ ...item, tags: [], updatedAt: item.createdAt })).filter(item => item.snapshot && typeof item.title === "string");
  return data.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.updatedAt === 'string' && Array.isArray(item.tags) && item.tags.every((tag: unknown) => typeof tag === 'string') && item.snapshot).slice(0, 40);
}
export function saveAnalysis(record: AnalysisRecord, title: string, tags: string[], id?: string) {
  const item: SavedAnalysis = { id: id || crypto.randomUUID(), title: title.trim().slice(0, 120) || 'Аналіз партії', tags: tags.map(tag => tag.trim().slice(0, 40)).filter(Boolean).slice(0, 10), updatedAt: new Date().toISOString(), snapshot: toSnapshot(record) };
  const others = readLibrary().filter(entry => entry.id !== item.id);
  if (others.length >= 40) throw new Error('Збережено 40 аналізів. Звільніть місце або оновіть наявний.');
  writeJson(LIBRARY_KEY, [item, ...others]); return item;
}
export function deleteAnalysis(id: string) { writeJson(LIBRARY_KEY, readLibrary().filter(item => item.id !== id)); }
export function analysisMatches(item: SavedAnalysis, query: string) {
  try { return `${item.title} ${item.tags.join(' ')} ${Object.values(item.snapshot.headers || {}).join(' ')} ${item.updatedAt} ${findOpening(item.snapshot.mainline)?.opening.name || ''} ${buildAnalysisPgn(item.snapshot as AnalysisRecord)}`.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()); } catch { return item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()); }
}
export function withHistory(current: AnalysisRecord, next: AnalysisRecord): AnalysisRecord {
  if (current === next) return current;
  const history = [...current.historyStack, toSnapshot(current)].slice(-30);
  while (history.length > 1 && JSON.stringify(history).length > 4_000_000) history.shift();
  return { ...next, historyStack: history, futureStack: [] };
}
export function undoRecord(record: AnalysisRecord): AnalysisRecord {
  const previous = record.historyStack.at(-1);
  return previous ? restoreRecord(previous, record.historyStack.slice(0, -1), [toSnapshot(record), ...record.futureStack].slice(0, 30)) : record;
}
export function redoRecord(record: AnalysisRecord): AnalysisRecord {
  const next = record.futureStack[0];
  return next ? restoreRecord(next, [...record.historyStack, toSnapshot(record)].slice(-30), record.futureStack.slice(1)) : record;
}
export function shareAnalysis(record: AnalysisRecord, base: string, positionOnly = false) {
  const source = positionOnly ? createRecord(getRecordNode(record, record.currentPath)?.fenAfter || record.rootFen) : record;
  const payload = JSON.stringify({ v: 1, pgn: buildAnalysisPgn(source), line: lineAtPath(source, source.currentPath) });
  const bytes = new TextEncoder().encode(payload);
  if (bytes.length > 45000) throw new Error("Для цієї партії посилання задовге. Поділіться позицією або PGN-файлом.");
  const encoded = btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (encoded.length > 60000) throw new Error('Для цієї партії посилання задовге. Поділіться позицією або PGN-файлом.');
  return `${base.split(/[?#]/)[0]}#analysis=${encoded}`;
}
export function readSharedAnalysis(hash: string): AnalysisRecord | null {
  if (!hash.startsWith('#analysis=')) return null;
  const encoded = hash.slice(10); if (encoded.length > 60000) throw new Error('Посилання завелике.');
  const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0))));
  if (decoded.v !== 1 || typeof decoded.pgn !== 'string' || !Array.isArray(decoded.line)) throw new Error('Неправильне посилання на аналіз.');
  const record = buildRecordFromPgn(decoded.pgn);
  record.currentPath = recordMoves(record).find(entry => lineAtPath(record, entry.path).join(' ') === decoded.line.join(' '))?.path || null;
  return record;
}
