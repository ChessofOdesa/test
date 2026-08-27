import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardPosition, CustomPieces, Piece as BoardPiece } from "react-chessboard/dist/chessboard/types";
import { Chess, type Square } from "chess.js";
import { useBoardSettings } from "@/contexts/BoardSettingsContext";
import { playChessSound, type ChessSoundType } from "@/hooks/useChessSounds";

type BoardArrow = [Square, Square, string?];
type PromotionPiece = "q" | "r" | "b" | "n";
type SquareStyle = Record<string, string>;
type BoardStyle = Record<string, string | number>;
type DragVisual = { from: Square; piece: BoardPiece; isTouch: boolean };
type DragRuntime = {
  from: Square;
  piece: BoardPiece;
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  moved: boolean;
  isTouch: boolean;
};
type Point = { x: number; y: number };

interface ChessBoardProps {
  initialFen?: string;
  displayFen?: string;
  onMove?: (from: string, to: string, promotion?: PromotionPiece) => boolean | void;
  interactive?: boolean;
  size?: number;
  flipped?: boolean;
  highlightSquares?: { squares: Square[]; type: "correct" | "wrong" };
  annotationSquares?: Square[];
  targetSquares?: Square[];
  startSquares?: Square[];
  blockedSquares?: Square[];
  captureSquares?: Square[];
  dangerSquares?: Square[];
  customArrows?: BoardArrow[];
  allowArrows?: boolean;
  allowPremoves?: boolean;
  customArrowColor?: string;
  showLegalMoves?: boolean;
  showLastMove?: boolean;
  showChecks?: boolean;
  lastMoveSquares?: Square[];
  customLightSquareStyle?: SquareStyle;
  customDarkSquareStyle?: SquareStyle;
  customBoardStyle?: BoardStyle;
  animationDuration?: number;
  enableMoveSounds?: boolean;
}

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const TARGET_STAR_BACKGROUND =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Cpath fill=\'%23f6d44f\' stroke=\'%238a6a08\' stroke-width=\'4\' stroke-linejoin=\'round\' d=\'M32 5l7.7 16.1 17.7 2.6-12.8 12.5 3 17.7L32 45.5 16.4 53.9l3-17.7L6.6 23.7l17.7-2.6L32 5z\'/%3E%3Cpath fill=\'%23fff6a8\' fill-opacity=\'.65\' d=\'M32 10l4.8 10.1 11.1 1.7-8 7.8 1.9 11.1L32 35.4l-9.8 5.3 1.9-11.1-8-7.8 11.1-1.7L32 10z\'/%3E%3C/svg%3E")';
const TEXT_PIECES: Record<string, string> = {
  wP: "P",
  wN: "N",
  wB: "B",
  wR: "R",
  wQ: "Q",
  wK: "K",
  bP: "P",
  bN: "N",
  bB: "B",
  bR: "R",
  bQ: "Q",
  bK: "K",
};

const FEN_PIECES: Record<string, BoardPiece> = {
  P: "wP",
  N: "wN",
  B: "wB",
  R: "wR",
  Q: "wQ",
  K: "wK",
  p: "bP",
  n: "bN",
  b: "bB",
  r: "bR",
  q: "bQ",
  k: "bK",
};

const PIECE_SYMBOLS: Record<BoardPiece, string> = {
  wP: "♙",
  wN: "♘",
  wB: "♗",
  wR: "♖",
  wQ: "♕",
  wK: "♔",
  bP: "♟",
  bN: "♞",
  bB: "♝",
  bR: "♜",
  bQ: "♛",
  bK: "♚",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const DRAG_LERP_SPEED = 0.46;
const SNAP_ANIMATION_MS = 70;

function chessPieceToBoardPiece(piece: { color: "w" | "b"; type: string }): BoardPiece {
  return `${piece.color}${piece.type.toUpperCase()}` as BoardPiece;
}

function getSquareFromClientPoint(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  flipped: boolean,
): Square | null {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return null;
  }

  const column = Math.min(7, Math.max(0, Math.floor((x / rect.width) * 8)));
  const row = Math.min(7, Math.max(0, Math.floor((y / rect.height) * 8)));
  const fileIndex = flipped ? 7 - column : column;
  const rank = flipped ? row + 1 : 8 - row;

  return `${FILES[fileIndex]}${rank}` as Square;
}

function getSquareCenter(square: Square, rect: DOMRect, flipped: boolean): Point {
  const fileIndex = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  const column = flipped ? 7 - fileIndex : fileIndex;
  const row = flipped ? rank - 1 : 8 - rank;
  const squareSize = rect.width / 8;

  return {
    x: column * squareSize + squareSize / 2,
    y: row * squareSize + squareSize / 2,
  };
}

function parseFenPlacementToPosition(fen?: string): BoardPosition | null {
  const placement = fen?.split(" ")[0];
  if (!placement) return null;

  const position: BoardPosition = {};
  const ranks = placement.split("/");
  if (ranks.length !== 8) return null;

  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex += 1) {
    let fileIndex = 0;

    for (const char of ranks[rankIndex]) {
      if (/\d/.test(char)) {
        fileIndex += Number(char);
        continue;
      }

      const piece = FEN_PIECES[char];
      if (!piece || fileIndex > 7) return null;

      const square = `${String.fromCharCode(97 + fileIndex)}${8 - rankIndex}` as Square;
      position[square] = piece;
      fileIndex += 1;
    }

    if (fileIndex !== 8) return null;
  }

  return position;
}

function createSafeGame(fen?: string) {
  try {
    return new Chess(fen || STARTING_FEN);
  } catch {
    return new Chess(STARTING_FEN);
  }
}

function getMoveSoundType(
  fen: string,
  sourceSquare: string,
  targetSquare: string,
  promotion: PromotionPiece,
): ChessSoundType {
  const game = createSafeGame(fen);

  try {
    const move = game.move({ from: sourceSquare, to: targetSquare, promotion });
    if (!move) return "illegal";
    if (game.isCheckmate()) return "checkmate";
    if (game.isCheck()) return "check";
    if (move.san.includes("O-O")) return "castle";
    if (move.flags.includes("p")) return "promote";
    if (move.flags.includes("c") || move.flags.includes("e")) return "capture";
    return "move";
  } catch {
    return "illegal";
  }
}

function findCheckedKingSquare(game: Chess): Square[] {
  if (!game.inCheck()) {
    return [];
  }

  const kingColor = game.turn();
  const board = game.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (piece?.type === "k" && piece.color === kingColor) {
        const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
        return [square];
      }
    }
  }

  return [];
}

function createTextPieces(): CustomPieces {
  return Object.fromEntries(
    Object.entries(TEXT_PIECES).map(([piece, symbol]) => [
      piece,
      ({ squareWidth }) => {
        const isWhite = piece.startsWith("w");
        return (
          <div
            style={{
              width: squareWidth,
              height: squareWidth,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                width: squareWidth * 0.68,
                height: squareWidth * 0.68,
                borderRadius: "999px",
                display: "grid",
                placeItems: "center",
                background: isWhite ? "linear-gradient(180deg, #f9fafb, #d5dae0)" : "linear-gradient(180deg, #24313d, #0f1720)",
                boxShadow: isWhite
                  ? "0 10px 22px rgba(15, 23, 32, 0.14)"
                  : "0 12px 22px rgba(0, 0, 0, 0.28)",
                color: isWhite ? "#111827" : "#f8fafc",
                border: isWhite ? "1px solid rgba(148, 163, 184, 0.55)" : "1px solid rgba(255, 255, 255, 0.08)",
                fontWeight: 700,
                fontSize: Math.max(squareWidth * 0.27, 14),
                letterSpacing: "0.08em",
              }}
            >
              {symbol}
            </div>
          </div>
        );
      },
    ]),
  ) as CustomPieces;
}

const TEXT_CUSTOM_PIECES = createTextPieces();

export default function ChessBoard({
  initialFen,
  displayFen,
  onMove,
  interactive = true,
  size = 480,
  flipped = false,
  highlightSquares,
  annotationSquares = [],
  targetSquares = [],
  startSquares = [],
  blockedSquares = [],
  captureSquares = [],
  dangerSquares = [],
  customArrows = [],
  allowArrows = true,
  allowPremoves = false,
  customArrowColor = "#81B64C",
  showLegalMoves = true,
  showLastMove = true,
  showChecks = true,
  lastMoveSquares = [],
  customLightSquareStyle,
  customDarkSquareStyle,
  customBoardStyle,
  animationDuration = 180,
  enableMoveSounds = false,
}: ChessBoardProps) {
  const [fen, setFen] = useState(initialFen || STARTING_FEN);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: "w" | "b";
  } | null>(null);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);
  const [hoverSquare, setHoverSquare] = useState<Square | null>(null);
  const [shakeSquare, setShakeSquare] = useState<Square | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragLayerRef = useRef<HTMLDivElement | null>(null);
  const dragRuntimeRef = useRef<DragRuntime | null>(null);
  const dragTargetRef = useRef<Point>({ x: 0, y: 0 });
  const dragCurrentRef = useRef<Point>({ x: 0, y: 0 });
  const dragFrameRef = useRef<number | null>(null);
  const { theme, pieceStyle, showCoordinates } = useBoardSettings();

  useEffect(() => {
    setFen(initialFen || STARTING_FEN);
  }, [initialFen]);

  useEffect(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalTargets([]);
    setDragVisual(null);
    setHoverSquare(null);
    dragRuntimeRef.current = null;
  }, [initialFen]);

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
      }
    };
  }, []);

  const boardGame = useMemo(() => createSafeGame(fen), [fen]);
  const displayPosition = useMemo(() => parseFenPlacementToPosition(displayFen), [displayFen]);

  const checkedSquares = useMemo(
    () => (showChecks ? findCheckedKingSquare(boardGame) : []),
    [boardGame, showChecks],
  );

  const setDragLayerPosition = (point: Point, withTransition = false) => {
    const layer = dragLayerRef.current;
    if (!layer) return;

    const squareSize = size / 8;
    layer.style.transition = withTransition ? `transform ${SNAP_ANIMATION_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : "none";
    layer.style.transform = `translate3d(${point.x - squareSize / 2}px, ${point.y - squareSize / 2}px, 0) scale(${
      dragRuntimeRef.current?.isTouch ? 1.15 : 1.08
    })`;
  };

  const runDragFrame = () => {
    dragFrameRef.current = null;
    if (!dragRuntimeRef.current || !dragLayerRef.current) return;

    const current = dragCurrentRef.current;
    const target = dragTargetRef.current;
    current.x += (target.x - current.x) * DRAG_LERP_SPEED;
    current.y += (target.y - current.y) * DRAG_LERP_SPEED;
    setDragLayerPosition(current);

    if (Math.abs(target.x - current.x) > 0.35 || Math.abs(target.y - current.y) > 0.35) {
      dragFrameRef.current = window.requestAnimationFrame(runDragFrame);
    }
  };

  const scheduleDragFrame = () => {
    if (dragFrameRef.current === null) {
      dragFrameRef.current = window.requestAnimationFrame(runDragFrame);
    }
  };

  const clearDrag = () => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }

    dragRuntimeRef.current = null;
    setDragVisual(null);
    setHoverSquare(null);
  };

  const vibrate = (duration: number) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, Record<string, string | number>> = {};

    annotationSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundImage:
          "radial-gradient(circle, transparent 52%, rgba(129,182,76,0.95) 56%, rgba(129,182,76,0.95) 61%, transparent 65%)",
      };
    });

    startSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        boxShadow: "inset 0 0 0 4px rgba(56, 189, 248, 0.82)",
      };
    });

    blockedSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundColor: "rgba(239, 68, 68, 0.34)",
        boxShadow: "inset 0 0 0 3px rgba(248, 113, 113, 0.85)",
      };
    });

    captureSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundImage:
          "radial-gradient(circle, transparent 50%, rgba(245, 158, 11, 0.92) 54%, rgba(245, 158, 11, 0.92) 64%, transparent 68%)",
      };
    });

    dangerSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundColor: "rgba(190, 24, 93, 0.34)",
        boxShadow: "inset 0 0 0 3px rgba(251, 113, 133, 0.86)",
      };
    });

    if (highlightSquares) {
      highlightSquares.squares.forEach((square) => {
        styles[square] = {
          ...(styles[square] ?? {}),
          backgroundColor:
            highlightSquares.type === "correct"
              ? "rgba(111, 207, 151, 0.58)"
              : "rgba(192, 57, 43, 0.52)",
          boxShadow:
            highlightSquares.type === "correct"
              ? "inset 0 0 0 3px rgba(143, 233, 179, 0.92)"
              : "inset 0 0 0 3px rgba(245, 155, 146, 0.9)",
        };
      });
    }

    if (showLastMove) {
      lastMoveSquares.forEach((square) => {
        styles[square] = {
          ...(styles[square] ?? {}),
          backgroundColor: "rgba(14, 165, 233, 0.28)",
          boxShadow: "inset 0 0 0 2px rgba(125, 211, 252, 0.55)",
        };
      });
    }

    if (selectedSquare) {
      styles[selectedSquare] = {
        ...(styles[selectedSquare] ?? {}),
        boxShadow: "inset 0 0 0 3px rgba(45, 212, 191, 0.92)",
      };
    }

    if (showLegalMoves) {
      legalTargets.forEach((square) => {
        const occupied = boardGame.get(square);
        styles[square] = {
          ...(styles[square] ?? {}),
          backgroundImage: occupied
            ? "radial-gradient(circle, transparent 56%, rgba(245, 158, 11, 0.88) 58%, rgba(245, 158, 11, 0.88) 64%, transparent 66%)"
            : "radial-gradient(circle, rgba(16, 185, 129, 0.92) 0 22%, transparent 24%)",
          animation: "chess-legal-pop 120ms ease-out both",
        };
      });
    }

    targetSquares.forEach((square) => {
      const existingBackground = styles[square]?.backgroundImage;
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundImage: existingBackground
          ? `${TARGET_STAR_BACKGROUND}, ${existingBackground}`
          : `${TARGET_STAR_BACKGROUND}, radial-gradient(circle, rgba(246, 212, 79, 0.18) 0 46%, transparent 49%)`,
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "62% 62%, 78% 78%",
        boxShadow: "inset 0 0 0 3px rgba(246, 212, 79, 0.58)",
      };
    });

    if (hoverSquare) {
      styles[hoverSquare] = {
        ...(styles[hoverSquare] ?? {}),
        backgroundColor: "rgba(255, 255, 255, 0.16)",
        boxShadow: "inset 0 0 0 3px rgba(255, 255, 255, 0.38)",
      };
    }

    if (dragVisual?.from) {
      styles[dragVisual.from] = {
        ...(styles[dragVisual.from] ?? {}),
        opacity: 0.28,
      };
    }

    if (shakeSquare) {
      styles[shakeSquare] = {
        ...(styles[shakeSquare] ?? {}),
        animation: "chess-illegal-shake 180ms ease-in-out",
      };
    }

    checkedSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        backgroundColor: "rgba(239, 68, 68, 0.28)",
        boxShadow: "inset 0 0 0 3px rgba(248, 113, 113, 0.92)",
      };
    });

    return styles;
  }, [
    annotationSquares,
    boardGame,
    blockedSquares,
    captureSquares,
    checkedSquares,
    dangerSquares,
    dragVisual,
    highlightSquares,
    hoverSquare,
    lastMoveSquares,
    legalTargets,
    selectedSquare,
    shakeSquare,
    showLastMove,
    showLegalMoves,
    startSquares,
    targetSquares,
  ]);

  const commitMove = (
    sourceSquare: string,
    targetSquare: string,
    promotion: PromotionPiece = "q",
  ) => {
    if (onMove) {
      const result = onMove(sourceSquare, targetSquare, promotion);
      if (result === false) {
        return false;
      }

      const game = createSafeGame(fen);
      try {
        const move = game.move({ from: sourceSquare, to: targetSquare, promotion });
        if (!move) {
          return false;
        }

        setFen(game.fen());
        setSelectedSquare(null);
        setLegalTargets([]);
        return true;
      } catch {
        return false;
      }
    }

    const game = createSafeGame(fen);
    try {
      const move = game.move({ from: sourceSquare, to: targetSquare, promotion });
      if (!move) {
        return false;
      }

      setFen(game.fen());
      setSelectedSquare(null);
      setLegalTargets([]);
      return true;
    } catch {
      return false;
    }
  };

  const attemptMove = (sourceSquare: string, targetSquare: string) => {
    if (!interactive) {
      return false;
    }

    const game = createSafeGame(fen);
    const piece = game.get(sourceSquare as Square);
    const isPromotion =
      piece?.type === "p" &&
      ((piece.color === "w" && targetSquare.endsWith("8")) ||
        (piece.color === "b" && targetSquare.endsWith("1")));

    if (isPromotion && piece) {
      setPendingPromotion({ from: sourceSquare, to: targetSquare, color: piece.color });
      return false;
    }

    const soundType = enableMoveSounds ? getMoveSoundType(fen, sourceSquare, targetSquare, promotion) : null;
    const success = commitMove(sourceSquare, targetSquare);
    if (enableMoveSounds) {
      playChessSound(success ? soundType || "move" : "illegal");
    }

    return success;
  };

  const snapDragBack = () => {
    const runtime = dragRuntimeRef.current;
    const board = boardRef.current;
    if (!runtime || !board) {
      clearDrag();
      return;
    }

    const rect = board.getBoundingClientRect();
    const center = getSquareCenter(runtime.from, rect, flipped);
    setShakeSquare(runtime.from);
    setDragLayerPosition(center, true);
    window.setTimeout(() => {
      setShakeSquare(null);
      clearDrag();
    }, SNAP_ANIMATION_MS);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pendingPromotion) return;
    if (event.pointerType !== "touch" && event.button !== 0) return;

    const board = boardRef.current;
    if (!board) return;

    const rect = board.getBoundingClientRect();
    const square = getSquareFromClientPoint(event.clientX, event.clientY, rect, flipped);
    if (!square) return;

    if (selectedSquare && legalTargets.includes(square)) {
      event.preventDefault();
      const success = attemptMove(selectedSquare, square);
      if (!success) {
        setShakeSquare(selectedSquare);
        window.setTimeout(() => setShakeSquare(null), SNAP_ANIMATION_MS);
      }
      return;
    }

    if (displayPosition && !displayPosition[square]) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const piece = boardGame.get(square);
    if (!piece || piece.color !== boardGame.turn()) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    event.preventDefault();
    board.setPointerCapture?.(event.pointerId);

    const nextTargets = boardGame
      .moves({ square, verbose: true })
      .map((move) => move.to as Square);
    const center = getSquareCenter(square, rect, flipped);
    const pointerPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const boardPiece = displayPosition?.[square] ?? chessPieceToBoardPiece(piece);

    setSelectedSquare(square);
    setLegalTargets(nextTargets);
    setDragVisual({ from: square, piece: boardPiece, isTouch: event.pointerType === "touch" });
    setHoverSquare(square);
    dragRuntimeRef.current = {
      from: square,
      piece: boardPiece,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startedAt: performance.now(),
      moved: false,
      isTouch: event.pointerType === "touch",
    };
    dragCurrentRef.current = center;
    dragTargetRef.current = pointerPoint;
    window.requestAnimationFrame(() => {
      setDragLayerPosition(center);
      scheduleDragFrame();
    });
    if (event.pointerType === "touch") vibrate(8);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const runtime = dragRuntimeRef.current;
    const board = boardRef.current;
    if (!runtime || !board || runtime.pointerId !== event.pointerId) return;

    event.preventDefault();
    const rect = board.getBoundingClientRect();
    const distance = Math.hypot(event.clientX - runtime.startX, event.clientY - runtime.startY);
    if (distance > 4) runtime.moved = true;

    dragTargetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setHoverSquare(getSquareFromClientPoint(event.clientX, event.clientY, rect, flipped));
    scheduleDragFrame();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const runtime = dragRuntimeRef.current;
    const board = boardRef.current;
    if (!runtime || !board || runtime.pointerId !== event.pointerId) return;

    event.preventDefault();
    board.releasePointerCapture?.(event.pointerId);

    const elapsed = performance.now() - runtime.startedAt;
    if (!runtime.moved && elapsed < 240) {
      clearDrag();
      return;
    }

    const rect = board.getBoundingClientRect();
    const targetSquare = getSquareFromClientPoint(event.clientX, event.clientY, rect, flipped);
    if (!targetSquare || targetSquare === runtime.from) {
      snapDragBack();
      return;
    }

    const success = attemptMove(runtime.from, targetSquare);
    if (success) {
      if (runtime.isTouch) vibrate(12);
      clearDrag();
      return;
    }

    snapDragBack();
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    const runtime = dragRuntimeRef.current;
    if (!runtime || runtime.pointerId !== event.pointerId) return;
    snapDragBack();
  };

  const handleSquareClick = (square: Square) => {
    if (!interactive) {
      return;
    }

    if (selectedSquare && legalTargets.includes(square)) {
      const game = createSafeGame(fen);
      const movingPiece = game.get(selectedSquare);
      const isPromotion =
        movingPiece?.type === "p" &&
        ((movingPiece.color === "w" && square.endsWith("8")) ||
          (movingPiece.color === "b" && square.endsWith("1")));

      if (isPromotion && movingPiece) {
        setPendingPromotion({ from: selectedSquare, to: square, color: movingPiece.color });
        return;
      }

      commitMove(selectedSquare, square);
      return;
    }

    if (displayPosition && !displayPosition[square]) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const piece = boardGame.get(square);
    if (!piece || piece.color !== boardGame.turn()) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const nextTargets = boardGame
      .moves({ square, verbose: true })
      .map((move) => move.to as Square);

    setSelectedSquare(square);
    setLegalTargets(nextTargets);
  };

  const promotionChoices: PromotionPiece[] = ["q", "r", "b", "n"];
  const promotionLabels: Record<PromotionPiece, string> = {
    q: "Queen",
    r: "Rook",
    b: "Bishop",
    n: "Knight",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <style>
        {`
          @keyframes chess-illegal-shake {
            0%, 100% { transform: translate3d(0, 0, 0); }
            25% { transform: translate3d(-4px, 0, 0); }
            50% { transform: translate3d(4px, 0, 0); }
            75% { transform: translate3d(-3px, 0, 0); }
          }

          @keyframes chess-legal-pop {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}
      </style>

      <div
        ref={boardRef}
        className="relative select-none"
        style={{
          width: size,
          height: size,
          touchAction: "none",
          cursor: dragVisual ? "grabbing" : interactive ? "grab" : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <Chessboard
          position={displayPosition ?? fen}
          boardWidth={size}
          boardOrientation={flipped ? "black" : "white"}
          customSquareStyles={customSquareStyles}
          arePiecesDraggable={false}
          areArrowsAllowed={allowArrows}
          arePremovesAllowed={allowPremoves}
          customArrows={allowArrows ? customArrows : []}
          customArrowColor={customArrowColor}
          customDarkSquareStyle={customDarkSquareStyle ?? { backgroundColor: theme.dark }}
          customLightSquareStyle={customLightSquareStyle ?? { backgroundColor: theme.light }}
          customPieces={pieceStyle === "text" ? TEXT_CUSTOM_PIECES : undefined}
          showBoardNotation={showCoordinates}
          animationDuration={animationDuration}
          customBoardStyle={
            customBoardStyle ?? {
              borderRadius: 22,
              boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
            }
          }
        />

        {dragVisual ? (
          <div
            ref={dragLayerRef}
            className="pointer-events-none absolute left-0 top-0 z-50 grid place-items-center will-change-transform"
            style={{
              width: size / 8,
              height: size / 8,
              opacity: 0.96,
              filter: "drop-shadow(0 16px 16px rgba(0,0,0,0.42))",
            }}
          >
            <div
              style={{
                width: size / 8,
                height: size / 8,
                display: "grid",
                placeItems: "center",
                fontSize: Math.max(size / 8 * 0.78, 28),
                lineHeight: 1,
                color: dragVisual.piece.startsWith("w") ? "#f8fafc" : "#101820",
                WebkitTextStroke: dragVisual.piece.startsWith("w")
                  ? "1px rgba(15,23,42,0.72)"
                  : "1px rgba(248,250,252,0.62)",
                textShadow: dragVisual.piece.startsWith("w")
                  ? "0 6px 14px rgba(0,0,0,0.38)"
                  : "0 7px 16px rgba(255,255,255,0.16)",
              }}
            >
              {pieceStyle === "text" ? TEXT_PIECES[dragVisual.piece] : PIECE_SYMBOLS[dragVisual.piece]}
            </div>
          </div>
        ) : null}
      </div>

      {pendingPromotion && (
        <div className="w-full max-w-[340px] rounded-2xl border border-border bg-card/95 p-3 shadow-2xl shadow-black/20">
          <div className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Choose promotion
          </div>
          <div className="grid grid-cols-4 gap-2">
            {promotionChoices.map((piece) => (
              <button
                key={piece}
                onClick={() => {
                  const success = commitMove(pendingPromotion.from, pendingPromotion.to, piece);
                  if (success && enableMoveSounds) {
                    playChessSound("promote");
                  }
                  setPendingPromotion(null);
                }}
                className="rounded-xl border border-border bg-secondary/60 px-3 py-3 text-center text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/10"
              >
                {promotionLabels[piece]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPendingPromotion(null)}
            className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
