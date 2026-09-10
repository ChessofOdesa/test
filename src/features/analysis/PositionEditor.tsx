import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { BoardPosition, Piece, Square } from "react-chessboard/dist/chessboard/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { START_FEN } from "./tree";

const PIECES: Record<string, string> = { wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙", bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟" };
const NAMES: Record<string, string> = { K: "король", Q: "ферзь", R: "тура", B: "слон", N: "кінь", P: "пішак" };
function placement(fen: string): BoardPosition {
  return Object.fromEntries(new Chess(fen).board().flat().filter(Boolean).map(piece => [piece!.square, `${piece!.color}${piece!.type.toUpperCase()}`])) as BoardPosition;
}
export function editorFen(position: BoardPosition, turn: string, castling: string, ep: string, move: number) {
  const ranks: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = "", empty = 0;
    for (const file of "abcdefgh") {
      const piece = position[`${file}${rank}`];
      if (!piece) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += piece[0] === "w" ? piece[1] : piece[1].toLowerCase();
    }
    ranks.push(row + (empty || ""));
  }
  const fen = `${ranks.join("/")} ${turn} ${castling || "-"} ${ep || "-"} 0 ${move}`;
  const game = new Chess(fen);
  const previousSide = new Chess(fen.replace(` ${turn} `, ` ${turn === "w" ? "b" : "w"} `).split(" ").map((part, index) => index === 3 ? "-" : part).join(" "));
  if (previousSide.isCheck()) throw new Error("Король сторони, яка щойно ходила, не може залишатися під шахом.");
  const needed: Record<string, [string, string]> = { K: ["e1", "h1"], Q: ["e1", "a1"], k: ["e8", "h8"], q: ["e8", "a8"] };
  for (const right of castling) {
    const [king, rook] = needed[right];
    const color = right === right.toUpperCase() ? "w" : "b";
    if (position[king] !== `${color}K` || position[rook] !== `${color}R`) throw new Error("Перевірте короля й туру для вибраної рокіровки.");
  }
  return game.fen();
}
export function PositionEditor({ fen, onClose, onApply }: { fen: string; onClose: () => void; onApply: (fen: string) => void }) {
  const parts = fen.split(" ");
  const [position, setPosition] = useState(() => placement(fen));
  const [piece, setPiece] = useState<Piece | null>("wK");
  const [turn, setTurn] = useState(parts[1]);
  const [castling, setCastling] = useState(parts[2].replace("-", ""));
  const [ep, setEp] = useState(parts[3]);
  const [move, setMove] = useState(Number(parts[5]));
  const [error, setError] = useState("");
  const width = Math.min(400, Math.max(180, window.innerWidth - 68));
  const remove = (square: Square) => setPosition(current => { const next = { ...current }; delete next[square]; return next; });
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="analysis-editor-dialog"><DialogHeader><DialogTitle>Редактор позиції</DialogTitle><DialogDescription>Оберіть фігуру й поле. Для видалення оберіть гумку.</DialogDescription></DialogHeader>
    <div className="analysis-editor-grid"><div>
      <Chessboard id="analysis-position-editor" boardWidth={width} position={position} onPieceDrop={(from, to, moved) => { setPosition(current => { const next = { ...current }; delete next[from]; next[to] = moved; return next; }); return true; }} onPieceDropOffBoard={square => remove(square)} dropOffBoardAction="trash" onSquareClick={square => { if (!piece) remove(square); else setPosition(current => ({ ...current, [square]: piece })); }} customLightSquareStyle={{ backgroundColor: "#dae3ee" }} customDarkSquareStyle={{ backgroundColor: "#7a92b2" }} />
      <div className="analysis-palette">{Object.entries(PIECES).map(([key, symbol]) => <button type="button" key={key} aria-label={`${key[0] === "w" ? "Білий" : "Чорний"} ${NAMES[key[1]]}`} aria-pressed={piece === key} onClick={() => setPiece(key as Piece)}>{symbol}</button>)}</div>
      <div className="analysis-small-actions"><Button size="sm" variant={piece === null ? "default" : "outline"} onClick={() => setPiece(null)}>Гумка</Button><Button size="sm" variant="outline" onClick={() => { setPosition({}); setCastling(""); setEp("-"); }}>Очистити</Button><Button size="sm" variant="outline" onClick={() => { setPosition(placement(START_FEN)); setTurn("w"); setCastling("KQkq"); setEp("-"); setMove(1); }}>Початкова</Button></div>
    </div><div className="analysis-editor-fields">
      <label>Хід<select aria-label="Сторона ходу" value={turn} onChange={event => setTurn(event.target.value)}><option value="w">Білі</option><option value="b">Чорні</option></select></label>
      <fieldset><legend>Право на рокіровку</legend>{[["K", "Білі: коротка"], ["Q", "Білі: довга"], ["k", "Чорні: коротка"], ["q", "Чорні: довга"]].map(([key, label]) => <label className="analysis-check" key={key}><Checkbox checked={castling.includes(key)} onCheckedChange={checked => setCastling(current => "KQkq".split("").filter(right => right === key ? checked : current.includes(right)).join(""))} />{label}</label>)}</fieldset>
      <label>Поле взяття на проході<Input aria-label="Поле взяття на проході" value={ep} onChange={event => setEp(event.target.value)} placeholder="— або e3" /></label>
      <label>Номер ходу<Input type="number" min="1" max="9999" value={move} onChange={event => setMove(Number(event.target.value))} /></label>
      {error && <p className="analysis-error" role="alert">{error}</p>}
      <Button onClick={() => { try { onApply(editorFen(position, turn, castling, ep, move)); } catch (cause) { setError(cause instanceof Error && /[А-Яа-яІіЇїЄє]/.test(cause.message) ? cause.message : "Некоректна позиція. Перевірте королів, пішаків та поля FEN."); } }}>Аналізувати позицію</Button>
    </div></div>
  </DialogContent></Dialog>;
}
