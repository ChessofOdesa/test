import { Chess } from "chess.js";
import { getAIMove, type AILevel } from "@/lib/chessAI";
self.onmessage = (event: MessageEvent<{
    fen: string;
    level: number;
}>) => {
    try {
        const game = new Chess(event.data.fen);
        const san = getAIMove(game, Math.min(4, Math.max(1, event.data.level)) as AILevel);
        const move = san ? game.move(san) : null;
        self.postMessage({ move: move ? `${move.from}${move.to}${move.promotion || ""}` : null });
    }
    catch {
        self.postMessage({ error: "Не вдалося знайти легальний хід." });
    }
};
