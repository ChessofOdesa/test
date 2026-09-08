import { memo, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardPosition, CustomPieces, Piece as BoardPiece } from "react-chessboard/dist/chessboard/types";
import { Chess, type Square } from "chess.js";
import { useBoardSettings } from "@/contexts/BoardSettingsContext";
import { playChessSound } from "@/hooks/useChessSounds";
import { ConfirmAction } from "@/features/game-room/GameControls";
import "@/features/game-room/room.css";
type PromotionPiece = "q" | "r" | "b" | "n";
type BoardArrow = [
    Square,
    Square,
    string?
];
interface ChessBoardProps {
    initialFen?: string;
    displayFen?: string;
    onMove?: (from: string, to: string, promotion?: PromotionPiece) => boolean | void;
    interactive?: boolean;
    size?: number;
    flipped?: boolean;
    highlightSquares?: {
        squares: Square[];
        type: "correct" | "wrong";
    };
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
    customLightSquareStyle?: Record<string, string>;
    customDarkSquareStyle?: Record<string, string>;
    customBoardStyle?: Record<string, string | number>;
    animationDuration?: number;
    enableMoveSounds?: boolean;
    autoQueen?: boolean;
    confirmMove?: boolean;
    playerColor?: "w" | "b";
    optimistic?: boolean;
}
const STARTING_FEN = new Chess().fen();
const EMPTY_SQUARES: Square[] = [];
const EMPTY_ARROWS: BoardArrow[] = [];
const TARGET_STAR_BACKGROUND = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 64 64\'%3E%3Cpath fill=\'%23f6d44f\' stroke=\'%238a6a08\' stroke-width=\'4\' stroke-linejoin=\'round\' d=\'M32 5l7.7 16.1 17.7 2.6-12.8 12.5 3 17.7L32 45.5 16.4 53.9l3-17.7L6.6 23.7l17.7-2.6L32 5z\'/%3E%3Cpath fill=\'%23fff6a8\' fill-opacity=\'.65\' d=\'M32 10l4.8 10.1 11.1 1.7-8 7.8 1.9 11.1L32 35.4l-9.8 5.3 1.9-11.1-8-7.8 11.1-1.7L32 10z\'/%3E%3C/svg%3E")';
const symbols: Record<string, string> = { wP: "♙", wN: "♘", wB: "♗", wR: "♖", wQ: "♕", wK: "♔", bP: "♟", bN: "♞", bB: "♝", bR: "♜", bQ: "♛", bK: "♚" };
const TEXT_PIECES = Object.fromEntries(Object.keys(symbols).map(piece => [piece, ({ squareWidth }: {
        squareWidth: number;
    }) => <div style={{ width: squareWidth, height: squareWidth, display: "grid", placeItems: "center", fontSize: squareWidth * .5, fontWeight: 750, color: piece[0] === "w" ? "#fff" : "#1c2b43", textShadow: piece[0] === "w" ? "0 1px 2px #142337,1px 0 2px #142337" : "0 1px 2px #fff" }}>{piece[1]}</div>])) as CustomPieces;
function createGame(fen: string) { try {
    return new Chess(fen);
}
catch {
    return new Chess();
} }
function placement(fen?: string): BoardPosition | undefined {
    if (!fen)
        return undefined;
    const ranks = fen.split(" ")[0].split("/");
    if (ranks.length !== 8)
        return undefined;
    const position: BoardPosition = {};
    for (let r = 0; r < 8; r++) {
        let file = 0;
        for (const char of ranks[r]) {
            if (/^[1-8]$/.test(char))
                file += Number(char);
            else if (/^[prnbqk]$/i.test(char) && file < 8) {
                position[`${String.fromCharCode(97 + file)}${8 - r}`] = `${char === char.toUpperCase() ? "w" : "b"}${char.toUpperCase()}` as BoardPiece;
                file++;
            }
            else
                return undefined;
        }
        if (file !== 8)
            return undefined;
    }
    return position;
}
function ChessBoard({ initialFen, displayFen, onMove, interactive = true, size = 480, flipped = false, highlightSquares, annotationSquares = EMPTY_SQUARES, targetSquares = EMPTY_SQUARES, startSquares = EMPTY_SQUARES, blockedSquares = EMPTY_SQUARES, captureSquares = EMPTY_SQUARES, dangerSquares = EMPTY_SQUARES, customArrows = EMPTY_ARROWS, allowArrows = true, allowPremoves = false, customArrowColor = "#315c9a", showLegalMoves = true, showLastMove = true, showChecks = true, lastMoveSquares = EMPTY_SQUARES, customLightSquareStyle, customDarkSquareStyle, customBoardStyle, animationDuration = 150, enableMoveSounds = false, autoQueen = false, confirmMove = false, playerColor, optimistic = true }: ChessBoardProps) {
    const [fen, setFen] = useState(initialFen || STARTING_FEN);
    const [selected, setSelected] = useState<Square | null>(null);
    const [promotion, setPromotion] = useState<{
        from: Square;
        to: Square;
        color: "w" | "b";
    } | null>(null);
    const [confirmation, setConfirmation] = useState<{
        from: Square;
        to: Square;
        promotion: PromotionPiece;
    } | null>(null);
    const [premove, setPremove] = useState<{
        from: Square;
        to: Square;
        promotion: PromotionPiece;
    } | null>(null);
    const [keyboardMove, setKeyboardMove] = useState("");
    const [keyboardError, setKeyboardError] = useState("");
    const promotionRef = useRef<HTMLDivElement>(null);
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;
    const lastCommit = useRef("");
    const board = useBoardSettings();
    const keyboardId = useId();
    const controlledFen = useMemo(() => { if (displayFen?.includes(" ")) {
        try {
            return new Chess(displayFen).fen();
        }
        catch { /* Lessons can display a partial board. */ }
    } return initialFen || STARTING_FEN; }, [initialFen, displayFen]);
    useEffect(() => { setFen(controlledFen); setSelected(null); setPromotion(null); setConfirmation(null); lastCommit.current = ""; }, [controlledFen]);
    useEffect(() => { if (!interactive && !allowPremoves) {
        setPremove(null);
        setSelected(null);
        setPromotion(null);
        setConfirmation(null);
    } }, [interactive, allowPremoves]);
    useEffect(() => { if (promotion)
        promotionRef.current?.querySelector<HTMLButtonElement>("button")?.focus(); }, [promotion]);
    const game = useMemo(() => createGame(fen), [fen]);
    const display = useMemo(() => placement(displayFen), [displayFen]);
    const premoving = !!playerColor && game.turn() !== playerColor && allowPremoves;
    const canInteract = interactive || premoving;
    const legal = useMemo(() => selected && !premoving ? game.moves({ square: selected, verbose: true }).map(move => move.to) : [], [game, selected, premoving]);
    const commit = (from: Square, to: Square, promote: PromotionPiece = "q") => {
        const check = createGame(fen);
        let move;
        try {
            move = check.move({ from, to, promotion: promote });
        }
        catch {
            return false;
        }
        if (!move)
            return false;
        const key = `${fen}:${from}${to}${promote}`;
        if (lastCommit.current === key)
            return false;
        const accepted = onMoveRef.current?.(from, to, promote);
        if (accepted === false)
            return false;
        lastCommit.current = key;
        setSelected(null);
        setPromotion(null);
        setConfirmation(null);
        if (optimistic)
            setFen(check.fen());
        if (enableMoveSounds)
            playChessSound(check.isCheckmate() ? "checkmate" : check.isCheck() ? "check" : move.isKingsideCastle() || move.isQueensideCastle() ? "castle" : move.captured ? "capture" : "move");
        return optimistic;
    };
    const commitRef = useRef(commit);
    commitRef.current = commit;
    useEffect(() => {
        if (!premove || !interactive || game.turn() !== playerColor)
            return;
        setPremove(null);
        try {
            const legalGame = new Chess(controlledFen);
            legalGame.move(premove);
            commitRef.current(premove.from, premove.to, premove.promotion);
        }
        catch { /* A premove is discarded if the new position makes it illegal. */ }
    }, [controlledFen, fen, game, interactive, playerColor, premove]);
    const queueOrConfirm = (from: Square, to: Square, promote: PromotionPiece = "q") => {
        if (premoving) {
            setPremove({ from, to, promotion: promote });
            setSelected(null);
            setPromotion(null);
            return false;
        }
        if (confirmMove && window.matchMedia("(max-width: 639px)").matches) {
            setConfirmation({ from, to, promotion: promote });
            return false;
        }
        return commit(from, to, promote);
    };
    const attempt = (from: Square, to: Square) => {
        if (!canInteract || from === to)
            return false;
        const piece = game.get(from);
        if (!piece || (playerColor && piece.color !== playerColor))
            return false;
        if (!premoving) {
            try {
                const probe = new Chess(fen);
                probe.move({ from, to, promotion: "q" });
            }
            catch {
                return false;
            }
        }
        else if (game.get(to)?.color === playerColor)
            return false;
        if (piece.type === "p" && (to[1] === "8" || to[1] === "1") && !autoQueen) {
            setPromotion({ from, to, color: piece.color });
            return false;
        }
        return queueOrConfirm(from, to);
    };
    const click = (square: Square) => {
        if (!canInteract)
            return;
        if (selected && selected !== square && (legal.includes(square) || premoving && game.get(square)?.color !== playerColor)) {
            attempt(selected, square);
            return;
        }
        const piece = game.get(square);
        if (!piece || (playerColor ? piece.color !== playerColor : piece.color !== game.turn()) || display && !display[square]) {
            setSelected(null);
            return;
        }
        setPremove(null);
        setSelected(selected === square ? null : square);
    };
    const styles = useMemo(() => {
        const result: Record<string, CSSProperties> = {};
        const mark = (squares: Square[], style: CSSProperties) => squares.forEach(square => { result[square] = { ...result[square], ...style }; });
        mark(annotationSquares, { boxShadow: "inset 0 0 0 3px #6f97bc" });
        mark(startSquares, { boxShadow: "inset 0 0 0 3px #438ec1" });
        mark(blockedSquares, { backgroundColor: "#c44c4855" });
        mark(dangerSquares, { boxShadow: "inset 0 0 0 3px #bd575a" });
        mark(captureSquares, { backgroundImage: "radial-gradient(circle,transparent 56%,#b2785299 59%,#b2785299 65%,transparent 68%)" });
        if (highlightSquares)
            mark(highlightSquares.squares, { backgroundColor: highlightSquares.type === "correct" ? "#78b7a278" : "#c6585578" });
        if (showLastMove)
            mark(lastMoveSquares, { backgroundColor: "var(--lastMove,rgba(48,96,160,.25))" });
        if (premove)
            mark([premove.from, premove.to], { backgroundColor: "rgba(143,99,174,.3)", boxShadow: "inset 0 0 0 2px #9270ab" });
        if (selected)
            mark([selected], { boxShadow: "inset 0 0 0 3px var(--selected,#345f9c)" });
        if (showLegalMoves)
            for (const target of legal)
                mark([target], { backgroundImage: game.get(target) ? "radial-gradient(circle,transparent 57%,rgba(32,61,105,.5) 59%,rgba(32,61,105,.5) 65%,transparent 67%)" : "radial-gradient(circle,rgba(32,61,105,.45) 0 13%,transparent 15%)" });
        mark(targetSquares, { backgroundImage: TARGET_STAR_BACKGROUND, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "60%" });
        if (showChecks && game.isCheck()) {
            const king = game.board().flat().find(piece => piece?.type === "k" && piece.color === game.turn());
            if (king)
                mark([king.square], { backgroundImage: "radial-gradient(circle,var(--check,rgba(194,64,60,.65)) 0,transparent 75%)" });
        }
        return result;
    }, [annotationSquares, startSquares, blockedSquares, dangerSquares, captureSquares, highlightSquares, showLastMove, lastMoveSquares, premove, selected, showLegalMoves, legal, targetSquares, showChecks, game]);
    const promotionStyle = promotion ? { left: Math.min(size - 154, Math.max(0, (flipped ? 7 - (promotion.to.charCodeAt(0) - 97) : promotion.to.charCodeAt(0) - 97) * size / 8)), top: promotion.to[1] === (flipped ? "1" : "8") ? 2 : Math.max(0, size - 140) } : undefined;
    return <div className="relative" style={{ width: size, maxWidth: "100%" }}>
   <Chessboard position={display || fen} boardWidth={size} boardOrientation={flipped ? "black" : "white"} arePiecesDraggable={canInteract} isDraggablePiece={({ piece }) => canInteract && (!playerColor || piece[0] === playerColor)} areArrowsAllowed={allowArrows} arePremovesAllowed={false} onSquareClick={click} onPieceDrop={(from, to) => attempt(from, to)} onPromotionCheck={() => false} onSquareRightClick={() => { setPremove(null); setSelected(null); }} customArrows={allowArrows ? customArrows : EMPTY_ARROWS} customArrowColor={customArrowColor} customSquareStyles={styles} customLightSquareStyle={customLightSquareStyle || { backgroundColor: board.theme.light }} customDarkSquareStyle={customDarkSquareStyle || { backgroundColor: board.theme.dark }} customPieces={board.pieceStyle === "text" ? TEXT_PIECES : undefined} showBoardNotation={board.showCoordinates} animationDuration={animationDuration} customBoardStyle={customBoardStyle || { borderRadius: 7, boxShadow: "0 1px 4px rgba(25,42,68,.12)" }}/>
   {promotion && <div ref={promotionRef} className="room-promotion" style={promotionStyle} role="dialog" aria-label="Перетворення пішака" onKeyDown={event => {
                if (event.key === "Escape") {
                    setPromotion(null);
                    return;
                }
                if (event.key === "Tab") {
                    const buttons = promotionRef.current?.querySelectorAll("button");
                    if (!buttons?.length)
                        return;
                    if (event.shiftKey && document.activeElement === buttons[0]) {
                        event.preventDefault();
                        buttons[buttons.length - 1].focus();
                    }
                    else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
                        event.preventDefault();
                        buttons[0].focus();
                    }
                }
            }}>{(["q", "r", "b", "n"] as PromotionPiece[]).map(piece => <button key={piece} aria-label={{ q: "Ферзь", r: "Тура", b: "Слон", n: "Кінь" }[piece]} onClick={() => { const pending = promotion; setPromotion(null); queueOrConfirm(pending.from, pending.to, piece); }}>{symbols[`${promotion.color}${piece.toUpperCase()}`]}</button>)}<button className="promotion-cancel" onClick={() => setPromotion(null)}>Скасувати</button></div>}
   <ConfirmAction open={!!confirmation} onCancel={() => setConfirmation(null)} title="Підтвердити хід?" description={confirmation ? `${confirmation.from} → ${confirmation.to}` : ""} confirm="Зробити хід" onConfirm={() => { if (confirmation)
        commit(confirmation.from, confirmation.to, confirmation.promotion); }}/>
   {premove && <button className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs text-primary shadow" onClick={() => setPremove(null)}>Скасувати попередній хід</button>}
   {canInteract && <form className="chess-keyboard-input" onSubmit={event => { event.preventDefault(); try {
        const probe = new Chess(fen);
        const parsed = /^[a-h][1-8][a-h][1-8][qrbn]?$/.test(keyboardMove) ? { from: keyboardMove.slice(0, 2), to: keyboardMove.slice(2, 4), promotion: keyboardMove[4] || "q" } : keyboardMove;
        const move = probe.move(parsed);
        if (!move)
            throw new Error();
        queueOrConfirm(move.from, move.to, (move.promotion || "q") as PromotionPiece);
        setKeyboardMove("");
        setKeyboardError("");
    }
    catch {
        setKeyboardError("Цей хід неможливий.");
    } }}><label htmlFor={keyboardId}>Хід з клавіатури</label><input id={keyboardId} aria-label="Хід з клавіатури" placeholder="e4 або e2e4" value={keyboardMove} onChange={event => setKeyboardMove(event.target.value)}/><button type="submit">Зробити хід</button><span role="status">{keyboardError}</span></form>}
 </div>;
}
export default memo(ChessBoard);
