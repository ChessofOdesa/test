import { Chess } from 'chess.js';
export function editorFen(position: Record<string, string>, turn: string, castling: string, ep: string, halfmove: number, fullmove: number) {
  const ranks = Array.from({ length: 8 }, (_, row) => { let rank = '', empty = 0; for (let file = 0; file < 8; file++) { const piece = position[`${String.fromCharCode(97 + file)}${8 - row}`]; if (!piece) empty++; else { if (empty) rank += empty; empty = 0; rank += piece[0] === 'w' ? piece[1] : piece[1].toLowerCase(); } } return rank + (empty || ''); });
  if (!Number.isInteger(fullmove) || fullmove < 1 || !Number.isInteger(halfmove) || halfmove < 0) throw new Error('Перевірте лічильники ходів.');
  for (const right of castling) { const white = right === right.toUpperCase(); const rank = white ? '1' : '8'; const side = white ? 'w' : 'b'; if (position[`e${rank}`] !== `${side}K` || position[`${right.toLowerCase() === 'k' ? 'h' : 'a'}${rank}`] !== `${side}R`) throw new Error('Для права рокіровки король і відповідна тура мають стояти на початкових полях.'); }
  const fen = `${ranks.join('/')} ${turn} ${castling || '-'} ${ep || '-'} ${halfmove} ${fullmove}`;
  const game = new Chess(fen);
  const other = turn === 'w' ? 'b' : 'w';
  const king = game.board().flat().find(piece => piece?.type === 'k' && piece.color === other);
  if (king && game.isAttacked(king.square, turn as 'w' | 'b')) throw new Error('Король сторони, яка щойно ходила, не може залишатися під шахом.');
  return fen;
}
