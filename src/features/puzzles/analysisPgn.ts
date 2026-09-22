import { Chess } from 'chess.js';
import { applySolutionMove, type TrainingPuzzle } from './model';
import type { Attempt } from './training';

export function puzzleAnalysisPgn(puzzle: TrainingPuzzle, attempt?: Attempt) {
    const line = attempt?.line || puzzle.solution;
    const game = new Chess(puzzle.fen);
    const tokens: string[] = [];
    for (const [step, uci] of line.entries()) {
        const before = game.fen(), number = before.split(' ')[5], color = game.turn();
        const label = `${number}${color === 'w' ? '.' : '...'} `;
        const move = applySolutionMove(game, uci);
        tokens.push(label + move.san);
        for (const mistake of attempt?.mistakes?.filter(m => m.step === step && m.move !== uci) || []) {
            const branch = new Chess(before);
            const played = applySolutionMove(branch, mistake.move);
            tokens.push(`(${label}${played.san} {Моя помилка})`);
        }
    }
    const escape = (text: string) => text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ');
    return `[Event "${escape(puzzle.title)}"]\n[SetUp "1"]\n[FEN "${escape(puzzle.fen)}"]\n[Result "*"]\n\n${tokens.join(' ')} *`;
}
