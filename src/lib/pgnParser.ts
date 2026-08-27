import { Chess } from "chess.js";

export interface ParsedGame {
  headers: Record<string, string>;
  moves: string;
  pgn: string;
}

export interface ExtractedPuzzle {
  fen: string;
  solution: string[];
  title: string;
  theme: string;
  rating: number;
  sourceGameId: string;
  moveNumber: number;
}

export function parsePGN(pgnText: string): ParsedGame[] {
  const games: ParsedGame[] = [];
  const blocks = pgnText.split(/\n\n(?=\[)/);
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;
    while ((match = headerRegex.exec(block)) !== null) {
      headers[match[1]] = match[2];
    }
    
    // Extract moves (everything after headers)
    const movesMatch = block.match(/\]\s*\n\n?([\s\S]*?)(?:\s*(?:1-0|0-1|1\/2-1\/2|\*)\s*$)/m);
    const moves = movesMatch ? movesMatch[1].trim() : "";
    
    if (headers.Event) {
      games.push({ headers, moves, pgn: block.trim() });
    }
  }
  
  return games;
}

export function extractPuzzlesFromGames(games: ParsedGame[]): ExtractedPuzzle[] {
  const puzzles: ExtractedPuzzle[] = [];
  
  for (const game of games) {
    try {
      const chess = new Chess();
      const result = game.headers.Result;
      if (!result || result === "*") continue;
      
      // Parse the moves
      const moveText = game.moves
        .replace(/\{[^}]*\}/g, "")
        .replace(/\d+\.\.\./g, "")
        .replace(/\d+\./g, "")
        .trim()
        .split(/\s+/)
        .filter(m => m && !["1-0", "0-1", "1/2-1/2", "*"].includes(m));
      
      const positions: { fen: string; moveIndex: number; nextMove: string }[] = [];
      
      for (let i = 0; i < moveText.length; i++) {
        try {
          const beforeFen = chess.fen();
          const move = chess.move(moveText[i]);
          if (!move) break;
          
          // Check for captures and checks as potential puzzle positions
          if (move.captured || chess.inCheck()) {
            positions.push({
              fen: beforeFen,
              moveIndex: i,
              nextMove: moveText[i],
            });
          }
        } catch {
          break;
        }
      }
      
      // Pick interesting positions (near the end, with tactics)
      const interestingPositions = positions.filter((p, idx) => {
        return p.moveIndex > 10 && p.moveIndex < moveText.length - 2;
      }).slice(-3);
      
      for (const pos of interestingPositions) {
        const rating = parseInt(game.headers.WhiteElo || "1500");
        const puzzleRating = Math.max(800, Math.min(2500, rating - 200 + Math.floor(Math.random() * 400)));
        
        const themes = ["Тактика", "Комбінація", "Атака", "Захист", "Ендшпіль", "Жертва"];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        
        puzzles.push({
          fen: pos.fen,
          solution: [pos.nextMove],
          title: `${game.headers.White} vs ${game.headers.Black}`,
          theme,
          rating: puzzleRating,
          sourceGameId: game.headers.GameId || "",
          moveNumber: Math.floor(pos.moveIndex / 2) + 1,
        });
      }
    } catch {
      continue;
    }
  }
  
  return puzzles;
}

// Extract sample games for AI to replay
export function extractAIGames(games: ParsedGame[]): ParsedGame[] {
  return games
    .filter(g => {
      const elo = parseInt(g.headers.WhiteElo || "0");
      const elo2 = parseInt(g.headers.BlackElo || "0");
      return Math.max(elo, elo2) >= 2000 && g.moves.length > 20;
    })
    .slice(0, 50);
}
