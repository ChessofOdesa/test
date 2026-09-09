import { buildReview, isReviewSample, parseReviewGame, type ReviewReport, type ReviewSample } from "./model";

const KEY = "coo.game-review.v1";
type Entry = { identity: string; createdAt: number; samples: ReviewSample[] };

function readEntries(): Entry[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(data) ? data.filter((item): item is Entry => item && typeof item.identity === "string" &&
      Number.isFinite(item.createdAt) && Array.isArray(item.samples) && item.samples.every(isReviewSample)) : [];
  } catch { return []; }
}

export function readReview(pgn: string): ReviewReport | null {
  try {
    const { identity } = parseReviewGame(pgn);
    const entry = readEntries().find(item => item.identity === identity);
    return entry ? buildReview(pgn, entry.samples, entry.createdAt) : null;
  } catch { return null; }
}

export function saveReview(pgn: string, report: ReviewReport) {
  try {
    const { identity } = parseReviewGame(pgn);
    const entries = [{ identity, createdAt: report.createdAt, samples: report.samples }, ...readEntries().filter(item => item.identity !== identity)].slice(0, 12);
    while (entries.length && JSON.stringify(entries).length > 1_000_000) entries.pop();
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch { /* A full or unavailable device cache must not discard the visible review. */ }
}
