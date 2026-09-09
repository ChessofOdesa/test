import { Chess, type Move } from "chess.js";
import type { Color } from "./types";
export const INITIAL_FEN = new Chess().fen();
export { positionResult, timeoutResult } from "../../../server/game-rules.js";
export const REASONS: Record<string, string> = { checkmate: "Мат", resignation: "Здача партії", timeout: "Час вичерпано", draw_agreement: "Нічия за згодою", stalemate: "Пат", threefold_repetition: "Триразове повторення", insufficient_material: "Недостатньо матеріалу для мату", fifty_move_rule: "Правило 50 ходів", draw: "Нічия", abort: "Партію скасовано", disconnect: "З’єднання гравця не відновлено", timeout_insufficient_material: "Час вичерпано · мат неможливий" };
export function resultPresentation(result: string, color: Color, reason: string) {
    const won = (result === "1-0" && color === "w") || (result === "0-1" && color === "b");
    const draw = result === "1/2-1/2" || reason === "abort";
    return { title: reason === "abort" ? "Партію скасовано" : draw ? "Нічия" : won ? "Перемога" : "Поразка", tone: draw ? "draw" as const : won ? "win" as const : "loss" as const, reason: REASONS[reason] || "Партію завершено" };
}
export function readHistory(pgn: string, fallbackFen = INITIAL_FEN) {
    const game = new Chess();
    try {
        if (pgn.trim())
            game.loadPgn(pgn);
        else
            game.load(fallbackFen);
    }
    catch {
        game.load(fallbackFen);
    }
    const history = game.history({ verbose: true });
    const startFen = game.getHeaders().FEN || (history.length ? INITIAL_FEN : game.fen());
    const walk = new Chess(startFen);
    const positions = [walk.fen()];
    for (const move of history) {
        walk.move(move);
        positions.push(walk.fen());
    }
    return { positions, moves: history.map(move => move.san), verbose: history, game };
}
const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const glyphs: Record<Color, Record<string, string>> = { w: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" }, b: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕" } };
export function capturedMaterial(history: Move[], fen: string, color: Color) {
    const captures = history.filter(move => move.color === color && move.captured).map(move => move.captured!);
    captures.sort((a, b) => values[b] - values[a]);
    const board = new Chess(fen).board().flat().filter(Boolean);
    const score = board.reduce((sum, piece) => sum + (piece!.color === color ? 1 : -1) * values[piece!.type], 0);
    return { captures: captures.map(piece => glyphs[color][piece]).join(""), advantage: Math.max(0, score) };
}
export function undoToPlayer(game: Chess, player: Color) {
    if (!game.history().length)
        return 0;
    let undone = 0;
    do {
        game.undo();
        undone++;
    } while (game.history().length && game.turn() !== player);
    return undone;
}
export function roomPanelWidth(width: number) {
    return Math.round(Math.max(400, Math.min(500, width * .30)));
}
// The defaults mirror CSS before the first DOM measurement. Actual occupied
// height is measured by GameRoom, including enlarged text and player bars.
export function roomBoardSize(width: number, height: number, header = 56, vertical = 138, horizontal = width < 1000 ? 24 : 48, panel = roomPanelWidth(width)) {
    if (width < 1000)
        return Math.max(160, Math.min(680, width - horizontal));
    return Math.max(160, Math.floor(Math.min(880, width - horizontal - panel - 20, height - header - vertical)));
}
