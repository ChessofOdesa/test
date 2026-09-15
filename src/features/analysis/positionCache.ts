import type { EngineSummary } from './model';
export const POSITION_CACHE_KEY = 'coo.analysis.positions.v1';
const nullableNumber = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value));
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
type Entry = { key: string; time: number; summary: EngineSummary };
function entries(): Entry[] {
  try {
    const raw = localStorage.getItem(POSITION_CACHE_KEY); if (!raw || raw.length > 900000) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(item => item && typeof item.key === 'string' && Number.isFinite(item.time) && item.time <= Date.now() && Date.now() - item.time < 30 * 86400000 && item.summary?.backend === 'worker' && typeof item.summary.fen === 'string' && Number.isFinite(item.summary.numericScore) && Number.isFinite(item.summary.depth) && nullableNumber(item.summary.scoreCp) && nullableNumber(item.summary.scoreMate) && strings(item.summary.lineSan) && Array.isArray(item.summary.lines) && item.summary.lines.every((line: EngineSummary['lines'][number]) => line && Number.isFinite(line.multipv) && nullableNumber(line.scoreCp) && nullableNumber(line.scoreMate) && strings(line.pv)) && strings(item.summary.pvSan)) : [];
  } catch { return []; }
}
export function readPositionCache(key: string): EngineSummary | null { return entries().find(item => item.key === key)?.summary || null; }
export function writePositionCache(key: string, summary: EngineSummary) {
  try {
    const data = [{ key, summary, time: Date.now() }, ...entries().filter(item => item.key !== key)].slice(0, 128);
    while (data.length && JSON.stringify(data).length > 800000) data.pop();
    localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(data));
  } catch { /* Cache availability never blocks analysis. */ }
}
export function clearPositionCache(): boolean { try { localStorage.removeItem(POSITION_CACHE_KEY); return true; } catch { return false; } }
