// Optimize: Split lichess puzzles by theme for better performance
import { LICHESS_PUZZLES } from './lichess-puzzles-converted';

export const PUZZLES_BY_THEME = LICHESS_PUZZLES.reduce((acc, puzzle) => {
  if (!acc[puzzle.theme]) {
    acc[puzzle.theme] = [];
  }
  acc[puzzle.theme].push(puzzle);
  return acc;
}, {} as Record<string, typeof LICHESS_PUZZLES>);

// Log stats
console.log('📊 Lichess puzzles by theme:', 
  Object.entries(PUZZLES_BY_THEME).map(([theme, puzzles]) => `${theme}: ${puzzles.length}`).join(', ')
);

export const TOTAL_LICHESS_PUZZLES = LICHESS_PUZZLES.length;
