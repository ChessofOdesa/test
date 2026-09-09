import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Chess } from "chess.js";
import { ArrowLeft, Ban, Copy, Download, Flag, Handshake, RefreshCw, Swords } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { GameRoom } from "@/features/game-room/GameRoom";
import { GameControls, ConfirmAction } from "@/features/game-room/GameControls";
import { GameInfo } from "@/features/game-room/GameInfo";
import { GameChat } from "@/features/game-room/GameChat";
import { GameLoading } from "@/features/game-room/GameLoading";
import { useRoomPreferences } from "@/features/game-room/preferences";
import { readHistory, capturedMaterial, resultPresentation } from "@/features/game-room/rules";
import { copyPgn, downloadPgn } from "@/features/game-room/notation";
import { playChessSound } from "@/hooks/useChessSounds";
import type { Color, Promotion, RoomPlayer } from "@/features/game-room/types";
export default function GamePage() {
    const { gameId } = useParams<{
        gameId: string;
    }>();
    const navigate = useNavigate();
    const online = useOnlineGame();
    const { game, viewedGame, connected, connect, loadGame, gameLoadStatus } = online;
    const liveGame = game?.id === gameId ? game : viewedGame?.id === gameId ? viewedGame : null;
    const [preferences, updatePreferences] = useRoomPreferences();
    const [cursor, setCursor] = useState<number | null>(null);
    const [flipped, setFlipped] = useState(false);
    const [confirm, setConfirm] = useState<"resign" | "abort" | null>(null);
    const [loadingExpired, setLoadingExpired] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    useEffect(() => { connect(); }, [connect]);
    useEffect(() => { setCursor(null); setFlipped(false); setLoadingExpired(false); if (gameId && connected && game?.id !== gameId)
        loadGame(gameId); }, [gameId, connected, game?.id, loadGame]);
    useEffect(() => { if (liveGame)
        return; const timer = window.setTimeout(() => setLoadingExpired(true), 12000); return () => window.clearTimeout(timer); }, [liveGame, gameId, connected, loadAttempt]);
    const history = useMemo(() => readHistory(liveGame?.pgn || "", liveGame?.fen), [liveGame?.pgn, liveGame?.fen]);
    const ended = liveGame?.status === "finished";
    const playing = liveGame?.status === "playing";
    const color = liveGame?.yourColor || "w";
    const bottomColor: Color = flipped ? (color === "w" ? "b" : "w") : color;
    const topColor = bottomColor === "w" ? "b" : "w";
    const isMyTurn = !!liveGame && connected && playing && liveGame.currentTurn === color && cursor == null && !online.movePending;
    const boardFen = cursor == null ? liveGame?.fen : history.positions[cursor + 1] || liveGame?.fen;
    const lastSquares = useMemo(() => { const move = history.verbose[cursor == null ? history.verbose.length - 1 : cursor]; return move ? [move.from, move.to] : []; }, [history, cursor]);
    const makeMove = online.makeMove;
    const handleMove = useCallback((from: string, to: string, promotion: Promotion = "q") => {
        if (!isMyTurn || !liveGame)
            return false;
        try {
            new Chess(liveGame.fen).move({ from, to, promotion });
            return makeMove(from, to, promotion, history.moves.length);
        }
        catch {
            return false;
        }
    }, [isMyTurn, liveGame?.fen, history.moves.length, makeMove]);
    const board = useCallback((size: number) => <ChessBoard initialFen={boardFen} size={size} flipped={bottomColor === "b"} playerColor={color} interactive={isMyTurn} allowPremoves={!!playing && connected && !online.movePending && cursor == null && liveGame?.currentTurn !== color} optimistic={false} onMove={handleMove} showLegalMoves={preferences.legalMoves} showLastMove={preferences.lastMove} lastMoveSquares={lastSquares} showChecks autoQueen={preferences.autoQueen} confirmMove={preferences.confirmMove} animationDuration={preferences.animation ? 150 : 0}/>, [boardFen, bottomColor, color, isMyTurn, playing, connected, online.movePending, cursor, liveGame?.currentTurn, handleMove, preferences.legalMoves, preferences.lastMove, preferences.autoQueen, preferences.confirmMove, preferences.animation, lastSquares]);
    const lastSound = useRef<{
        id: string | null;
        ply: number;
        ended: boolean;
    }>({ id: null, ply: 0, ended: false });
    useEffect(() => {
        if (!liveGame)
            return;
        const previous = lastSound.current;
        if (previous.id === liveGame.id) {
            if (ended && !previous.ended && preferences.endSound)
                playChessSound("gameEnd");
            else if (history.moves.length > previous.ply && preferences.sound) {
                const move = history.verbose.at(-1);
                playChessSound(history.game.isCheck() && preferences.checkSound ? "check" : move?.isKingsideCastle() || move?.isQueensideCastle() ? "castle" : move?.captured ? "capture" : "move");
            }
        }
        lastSound.current = { id: liveGame.id, ply: history.moves.length, ended: !!ended };
    }, [liveGame?.id, history, ended, preferences.sound, preferences.checkSound, preferences.endSound]);
    if (!liveGame) {
        const error = gameLoadStatus === "not_found" ? "Партію не знайдено" : gameLoadStatus === "error" ? "Не вдалося завантажити партію" : online.connectionError || loadingExpired ? "Не вдалося підключитися до сервера" : null;
        return <GameLoading error={error} onRetry={() => { setLoadingExpired(false); setLoadAttempt(value => value + 1); connect(); if (gameId && connected)
            loadGame(gameId); }}/>;
    }
    const opponent = color === "w" ? liveGame.black : liveGame.white;
    const seat = (seatColor: Color): RoomPlayer => { const player = seatColor === "w" ? liveGame.white : liveGame.black; return { name: player?.name || (seatColor === color ? online.playerName : "Суперник"), color: seatColor, own: seatColor === color, rating: player?.rating, connected: seatColor === color ? connected : player?.connected, ratingChange: ended && liveGame.persistenceStatus === "saved" ? (seatColor === "w" ? liveGame.whiteRatingChange : liveGame.blackRatingChange) : null, ...capturedMaterial(history.verbose, liveGame.fen, seatColor), clock: { remainingMs: seatColor === "w" ? liveGame.whiteTime : liveGame.blackTime, asOf: liveGame.clockSyncAt, running: !!playing && liveGame.currentTurn === seatColor } }; };
    const savedCurrent = game?.id === gameId;
    const rematchPossible = ended && savedCurrent && connected && liveGame.rematchAvailable && opponent?.connected !== false;
    const newGame = () => { const query = new URLSearchParams({ mode: "online", time: liveGame.timeControl, color: "random", rated: liveGame.rated ? "1" : "0", start: "1" }); online.resetGame(); navigate(`/play?${query}`); };
    const status = !connected && playing ? "Відновлення з’єднання…" : ended ? "Партію завершено" : online.movePending ? "Підтверджуємо хід…" : cursor != null ? "Перегляд історії · годинники працюють" : isMyTurn ? (history.game.isCheck() ? "Ваш хід · шах" : "Ваш хід") : "Хід суперника";
    const controls = playing ? <GameControls more={history.moves.length < 2 ? [{ label: "Скасувати партію", icon: <Ban size={15}/>, onClick: () => setConfirm("abort"), disabled: !connected }] : []}><Button variant="outline" disabled={!connected || online.outgoingDrawOffer} onClick={online.offerDraw}><Handshake size={16}/>{online.outgoingDrawOffer ? "Запропоновано" : "Нічия"}</Button><Button variant="outline" className="is-danger" disabled={!connected} onClick={() => setConfirm("resign")}><Flag size={16}/>Здатися</Button></GameControls> : null;
    const rating = liveGame.rated ? <div className="room-rating">{liveGame.persistenceStatus === "pending" ? <span role="status">Оновлюємо рейтинг…</span> : liveGame.persistenceStatus === "failed" ? <span>Не вдалося зберегти результат і рейтинг.</span> : liveGame.persistenceStatus === "saved" ? (["w", "b"] as Color[]).map(seatColor => { const before = seatColor === "w" ? liveGame.whiteRatingBefore : liveGame.blackRatingBefore; const change = seatColor === "w" ? liveGame.whiteRatingChange : liveGame.blackRatingChange; const player = seatColor === "w" ? liveGame.white : liveGame.black; return before != null && change != null ? <span key={seatColor}>{player?.name}: <strong>{before} → {before + change}</strong> ({change > 0 ? "+" : ""}{change})</span> : null; }) : <span>Рейтинг не збережено.</span>}</div> : <p>Партія без зміни рейтингу.</p>;
    const result = ended ? { ...resultPresentation(liveGame.result, color, liveGame.reason || ""), result: liveGame.result, id: liveGame.id!, pgn: liveGame.pgn, players: { w: seat("w"), b: seat("b") }, startedAt: liveGame.createdAt, onFullAnalysis: () => navigate("/analysis", { state: { gameId: liveGame.id, pgn: liveGame.pgn } }), rating, actions: <>{rematchPossible && <Button variant="outline" disabled={online.rematchRequested} onClick={() => online.requestRematch(liveGame.timeControl, liveGame.id!)}><RefreshCw size={15}/>{online.rematchRequested ? "Запропоновано…" : "Реванш"}</Button>}<Button variant="outline" onClick={newGame}><Swords size={15}/>Нова партія</Button><Button asChild variant="ghost"><Link to="/play"><ArrowLeft size={15}/>Назад до Грати</Link></Button></> } : undefined;
    const notice = <>{playing && !connected && <div className="room-notice"><span>{online.connectionError || "Відновлюємо позицію, ходи й час із сервера."}</span><Button size="sm" variant="outline" onClick={connect}>Спробувати ще раз</Button></div>}{online.actionError && <div className="room-notice" role="alert"><span>{online.actionError}</span><button onClick={online.clearActionError}>Зрозуміло</button></div>}{playing && online.incomingDrawOffer && <div className="room-notice"><span>Суперник пропонує нічию.</span><div><Button size="sm" disabled={!connected} onClick={() => online.respondToDraw(true)}>Прийняти</Button><Button variant="outline" size="sm" disabled={!connected} onClick={() => online.respondToDraw(false)}>Відхилити</Button></div></div>}{ended && online.incomingRematchOffer?.gameId === liveGame.id && <div className="room-notice"><span>Суперник пропонує реванш {liveGame.timeControl}.</span><div><Button size="sm" disabled={!connected} onClick={() => online.respondToRematch(true)}>Прийняти</Button><Button variant="outline" size="sm" disabled={!connected} onClick={() => online.respondToRematch(false)}>Відхилити</Button></div></div>}</>;
    const hasNotice = (playing && !connected) || online.actionError || (playing && online.incomingDrawOffer) || (ended && online.incomingRematchOffer?.gameId === liveGame.id);
    const info = <GameInfo rows={[["Режим", "Онлайн"], ["Рейтинг", liveGame.rated ? "Рейтингова" : "Без рейтингу"], ["Час", liveGame.timeControl], ["Ваш колір", color === "w" ? "Білі" : "Чорні"], ["Суперник", opponent?.name], ["З’єднання", connected ? "Підключено" : "Відновлення з’єднання…"], ["Дата", liveGame.createdAt ? new Date(liveGame.createdAt).toLocaleString("uk-UA") : null], ["Партія", liveGame.id]]}>{liveGame.persistenceStatus === "disabled" && <p>Збереження партій на сервері ще не налаштоване.</p>}{ended && <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void copyPgn(liveGame.pgn)}><Copy size={14}/>Копіювати PGN</Button><Button size="sm" variant="outline" onClick={() => downloadPgn(liveGame.pgn, liveGame.id!)}><Download size={14}/>Завантажити PGN</Button></div>}</GameInfo>;
    return <><GameRoom mode="online" title="Онлайн-партія" timeControl={liveGame.timeControl} board={board} top={seat(topColor)} bottom={seat(bottomColor)} preferences={preferences} updatePreferences={updatePreferences} onFlip={() => setFlipped(value => !value)} moves={history.moves} cursor={cursor} onCursor={setCursor} status={status} statusTone={!connected ? "is-warning" : isMyTurn ? "is-turn" : ""} info={info} controls={controls} result={result} notice={hasNotice ? notice : undefined} chat={savedCurrent && opponent ? <GameChat key={`${online.playerId}:${opponent.id}`} messages={online.chatMessages} connected={connected} opponentId={opponent.id} playerId={online.playerId || ""} onSend={online.sendChat} onReport={online.capabilities?.reports ? (reason, note) => online.reportGame(liveGame.id!, reason, note) : undefined} reportStatus={online.reportStatus}/> : undefined}/><ConfirmAction open={confirm != null} onCancel={() => setConfirm(null)} onConfirm={() => { if (connected) {
        if (confirm === "abort")
            online.abortGame();
        else
            online.resign();
    } setConfirm(null); }} title={confirm === "abort" ? "Скасувати цю партію?" : "Ви справді хочете здатися?"} description={confirm === "abort" ? "Скасування доступне до другого ходу й не змінює рейтинг." : "Сервер завершить партію та зафіксує поразку."} confirm={confirm === "abort" ? "Скасувати партію" : "Здатися"}/></>;
}
