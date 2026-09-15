export const ANALYSIS_PREFERENCES_KEY = 'coo.analysis.preferences.v1';
export const DEFAULT_ANALYSIS_PREFERENCES = {
  economy: false, focusBranch: false, followSelection: true, mobileFocus: true,
  engineDepth: 12, multiPv: 3, showBestMoveArrow: true, showMoveBadges: true,
  moveAnimation: true, analysisUiMode: 'simple' as 'simple' | 'advanced',
};
export type AnalysisPreferences = typeof DEFAULT_ANALYSIS_PREFERENCES;
export function readAnalysisPreferences(): AnalysisPreferences {
  const next = { ...DEFAULT_ANALYSIS_PREFERENCES };
  try {
    const raw = JSON.parse(localStorage.getItem(ANALYSIS_PREFERENCES_KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return next;
    for (const key of ['economy', 'focusBranch', 'followSelection', 'mobileFocus', 'showBestMoveArrow', 'showMoveBadges', 'moveAnimation'] as const) {
      if (typeof raw[key] === 'boolean') next[key] = raw[key];
    }
    if ([8, 12, 16].includes(raw.engineDepth)) next.engineDepth = raw.engineDepth;
    if ([1, 2, 3, 5].includes(raw.multiPv)) next.multiPv = raw.multiPv;
    if (['simple', 'advanced'].includes(raw.analysisUiMode)) next.analysisUiMode = raw.analysisUiMode;
  } catch { /* Invalid or unavailable preferences must not block analysis. */ }
  return next;
}
export function saveAnalysisPreferences(preferences: AnalysisPreferences): boolean {
  try { localStorage.setItem(ANALYSIS_PREFERENCES_KEY, JSON.stringify(preferences)); return true; }
  catch { return false; }
}
