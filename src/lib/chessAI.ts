import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

const PAWN_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
};

function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -Infinity : Infinity;
  }

  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) {
        continue;
      }

      let value = PIECE_VALUES[piece.type] || 0;
      const table = TABLES[piece.type];
      if (table) {
        const index = piece.color === "w" ? rank * 8 + file : (7 - rank) * 8 + file;
        value += table[index] || 0;
      }

      score += piece.color === "w" ? value : -value;
    }
  }

  const mobility = game.moves().length * 2;
  score += game.turn() === "w" ? mobility : -mobility;
  return score;
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const evaluation = minimax(game, depth - 1, alpha, beta, false);
      game.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break;
      }
    }
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of moves) {
    game.move(move);
    const evaluation = minimax(game, depth - 1, alpha, beta, true);
    game.undo();
    minEval = Math.min(minEval, evaluation);
    beta = Math.min(beta, evaluation);
    if (beta <= alpha) {
      break;
    }
  }
  return minEval;
}

export type AILevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AIConfig {
  level: AILevel;
  name: string;
  description: string;
  depth: number;
  randomness: number;
}

export const AI_LEVELS: AIConfig[] = [
  { level: 1, name: "Very Easy", description: "About 600 ELO", depth: 1, randomness: 0.65 },
  { level: 2, name: "Easy", description: "About 800 ELO", depth: 1, randomness: 0.48 },
  { level: 3, name: "Beginner", description: "About 1000 ELO", depth: 2, randomness: 0.34 },
  { level: 4, name: "Intermediate", description: "About 1200 ELO", depth: 2, randomness: 0.22 },
  { level: 5, name: "Strong", description: "About 1600 ELO", depth: 3, randomness: 0.14 },
  { level: 6, name: "Expert", description: "About 2000 ELO", depth: 3, randomness: 0.08 },
  { level: 7, name: "Master", description: "About 2200 ELO", depth: 3, randomness: 0.04 },
  { level: 8, name: "Grandmaster", description: "About 2400+ ELO", depth: 3, randomness: 0.01 },
];

export function getAIMove(game: Chess, level: AILevel): string | null {
  const config = AI_LEVELS[level - 1];
  const moves = game.moves();

  if (moves.length === 0) {
    return null;
  }

  if (Math.random() < config.randomness) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const isMaximizing = game.turn() === "w";
  let bestMove = moves[0];
  let bestEval = isMaximizing ? -Infinity : Infinity;
  const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

  for (const move of shuffledMoves) {
    game.move(move);
    const evaluation = minimax(game, config.depth - 1, -Infinity, Infinity, !isMaximizing);
    game.undo();

    if (isMaximizing ? evaluation > bestEval : evaluation < bestEval) {
      bestEval = evaluation;
      bestMove = move;
    }
  }

  return bestMove;
}
