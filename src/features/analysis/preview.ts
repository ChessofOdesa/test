import { Chess } from "chess.js";

export type AnalysisSanPreview = {
    fens: string[];
    moves: string[];
};

export function buildSanLinePreview(baseFen: string, sanMoves: string[], limit = 8): AnalysisSanPreview | null {
    if (!sanMoves.length) return null;
    const chess = new Chess(baseFen);
    const fens: string[] = [];
    const moves: string[] = [];

    for (const san of sanMoves.slice(0, Math.max(1, limit))) {
        try {
            const move = chess.move(san);
            if (!move) break;
            moves.push(move.san);
            fens.push(chess.fen());
        } catch {
            break;
        }
    }

    return fens.length ? { fens, moves } : null;
}
