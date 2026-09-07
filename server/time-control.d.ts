export type TimeCategory = "bullet" | "blitz" | "rapid" | "classical";
export type ParsedTime = { value: string; minutes: number; increment: number; category: TimeCategory; initialMs: number; incrementMs: number };
export const STANDARD_TIMES: string[];
export const LEGACY_RATED_TIMES: string[];
export function parseTimeControl(value: unknown): ParsedTime | null;
