export type MoveClassification = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";

// Shared centipawn thresholds for the full analysis and the post-game review.
export function classificationFromLoss(loss: number, playedBestMove: boolean): MoveClassification {
    if (playedBestMove) {
        return "best";
    }
    if (loss <= 18) {
        return "excellent";
    }
    if (loss >= 260) {
        return "blunder";
    }
    if (loss >= 120) {
        return "mistake";
    }
    if (loss >= 45) {
        return "inaccuracy";
    }
    return "good";
}
