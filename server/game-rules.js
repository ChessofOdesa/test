export function positionResult(chess) {
  if (chess.isCheckmate()) return { result: chess.turn() === "w" ? "0-1" : "1-0", reason: "checkmate" };
  if (chess.isStalemate()) return { result: "1/2-1/2", reason: "stalemate" };
  if (chess.isThreefoldRepetition()) return { result: "1/2-1/2", reason: "threefold_repetition" };
  if (chess.isInsufficientMaterial()) return { result: "1/2-1/2", reason: "insufficient_material" };
  if (chess.isDrawByFiftyMoves()) return { result: "1/2-1/2", reason: "fifty_move_rule" };
  return null;
}
export function timeoutResult(chess, loser) {
  const winner = loser === "w" ? "b" : "w";
  const canMate = chess.board().flat().some(piece => piece?.color === winner && piece.type !== "k") && !chess.isInsufficientMaterial();
  return { result: canMate ? loser === "w" ? "0-1" : "1-0" : "1/2-1/2", reason: canMate ? "timeout" : "timeout_insufficient_material" };
}
