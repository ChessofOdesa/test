import type { AnalysisArrow } from './model';
export function readArrows(input: unknown): AnalysisArrow[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 32).filter(arrow => Array.isArray(arrow) && /^[a-h][1-8]$/.test(arrow[0]) && /^[a-h][1-8]$/.test(arrow[1]) && (arrow[2] == null || typeof arrow[2] === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(arrow[2]))).map(arrow => [arrow[0], arrow[1], arrow[2]]);
}
export function toggleArrow(arrows: AnalysisArrow[], from: AnalysisArrow[0], to: AnalysisArrow[1]): AnalysisArrow[] {
  if (from === to) return arrows;
  return arrows.some(a => a[0] === from && a[1] === to) ? arrows.filter(a => a[0] !== from || a[1] !== to) : [...arrows, [from, to, '#cf6d24'] as AnalysisArrow].slice(-32);
}
