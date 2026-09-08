import type { Chess } from "chess.js";
export function positionResult(chess: Chess): { result: string; reason: string } | null;
export function timeoutResult(chess: Chess, loser: "w" | "b"): { result: string; reason: string };
