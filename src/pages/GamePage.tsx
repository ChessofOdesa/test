import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Chess } from "chess.js";
import {
  ArrowLeft,
  Ban,
  Crown,
  Flag,
  Handshake,
  Loader2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Swords,
} from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import ChessTimer from "@/components/ChessTimer";
import MoveList from "@/components/MoveList";
import { Button } from "@/components/ui/button";
import { useOnlineGame, type GameState } from "@/hooks/useOnlineGame";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    connect,
    connected,
    connectionError,
    game,
    playerName,
    chatMessages,
    incomingDrawOffer,
    incomingRematchOffer,
    makeMove,
    resign,
    abortGame,
    offerDraw,
    respondToDraw,
    sendChat,
    requestRematch,
    respondToRematch,
    resetGame,
  } = useOnlineGame();
  const [chatInput, setChatInput] = useState("");
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [boardSize, setBoardSize] = useState(640);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    const syncBoardSize = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setBoardSize(Math.max(300, width - 24));
        return;
      }

      if (width < 1280) {
        setBoardSize(Math.min(560, width - 48));
        return;
      }

      setBoardSize(640);
    };

    syncBoardSize();
    window.addEventListener("resize", syncBoardSize);

    return () => window.removeEventListener("resize", syncBoardSize);
  }, []);

  useEffect(() => {
    if (game?.id && gameId && game.id !== gameId) {
      navigate(`/game/${game.id}`, { replace: true });
    }
  }, [game?.id, gameId, navigate]);

  const liveGame = game?.id === gameId ? game : null;

  const replayState = useMemo(() => {
    const finalBoard = new Chess();
    const walker = new Chess();
    const positions = [STARTING_FEN];
    const movesSan: string[] = [];

    if (liveGame) {
      try {
        if (liveGame.pgn) {
          finalBoard.loadPgn(liveGame.pgn);
        } else {
          finalBoard.load(liveGame.fen);
        }
      } catch {
        finalBoard.load(STARTING_FEN);
      }

      for (const move of finalBoard.history({ verbose: true })) {
        walker.move(move);
        movesSan.push(move.san);
        positions.push(walker.fen());
      }
    }

    return {
      positions,
      movesSan,
      inCheck: finalBoard.inCheck(),
      isCheckmate: finalBoard.isCheckmate(),
      isStalemate: finalBoard.isStalemate(),
    };
  }, [liveGame?.fen, liveGame?.pgn]);

  useEffect(() => {
    setSelectedMoveIndex((current) => {
      if (current == null) {
        return null;
      }

      return current >= replayState.movesSan.length ? null : current;
    });
  }, [replayState.movesSan.length]);

  const latestMoveIndex =
    replayState.movesSan.length > 0 ? replayState.movesSan.length - 1 : null;
  const isReviewMode =
    selectedMoveIndex != null && selectedMoveIndex !== latestMoveIndex;
  const boardFen =
    selectedMoveIndex == null
      ? liveGame?.fen || STARTING_FEN
      : replayState.positions[selectedMoveIndex + 1] || liveGame?.fen || STARTING_FEN;

  const opponent = liveGame
    ? liveGame.yourColor === "w"
      ? liveGame.black
      : liveGame.white
    : null;
  const yourSeat = liveGame
    ? liveGame.yourColor === "w"
      ? liveGame.white
      : liveGame.black
    : null;
  const isMyTurn =
    !!liveGame &&
    connected &&
    liveGame.status === "playing" &&
    liveGame.currentTurn === liveGame.yourColor &&
    !isReviewMode;
  const canAbort =
    !!liveGame &&
    liveGame.status === "playing" &&
    replayState.movesSan.length < 2;

  const handleMove = (from: string, to: string) => {
    if (!liveGame || !isMyTurn) {
      return false;
    }

    const current = new Chess(liveGame.fen);

    try {
      const move = current.move({ from, to, promotion: "q" });
      if (!move) {
        return false;
      }

      setSelectedMoveIndex(null);
      const promotion = ["q", "r", "b", "n"].includes(move.promotion || "")
        ? (move.promotion as "q" | "r" | "b" | "n")
        : "q";
      makeMove(from, to, promotion);
      return true;
    } catch {
      return false;
    }
  };

  const handleRematch = () => {
    if (!liveGame) {
      return;
    }

    requestRematch(liveGame.timeControl);
  };

  const handleBackToLobby = () => {
    resetGame();
    navigate("/online");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) {
      return;
    }

    sendChat(chatInput);
    setChatInput("");
  };

  if (!liveGame) {
    return (
      <div className="min-h-screen px-4 py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-[32px] border border-border bg-card/80 px-8 py-14 text-center shadow-2xl shadow-black/20">
          {!connected ? (
            <>
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">
                Підключаємося до ігрового сервера
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Щойно з&apos;явиться активна партія, ми відкриємо її тут.
              </p>
            </>
          ) : (
            <>
              <Swords className="mb-4 h-10 w-10 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">
                Активної партії зараз немає
              </h1>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Поверніться в лобі, знайдіть суперника і ми одразу перенесемо вас на цю сторінку.
              </p>
              <Button onClick={() => navigate("/online")} className="mt-6">
                <ArrowLeft className="mr-2 h-4 w-4" /> До пошуку гри
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const resultTone = getResultTone(liveGame);
  const statusLabel = getStatusLabel(liveGame, replayState.inCheck, opponent?.name || "суперника");
  const displayedStatus =
    !connected && liveGame.status === "playing"
      ? connectionError || "З’єднання перервано. Відновлюємо партію…"
      : statusLabel;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.25),transparent_28%)] px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-border bg-card/85 p-5 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  Stage 3 • Game Page
                </p>
                <h1 className="text-2xl font-semibold text-foreground">
                  Жива партія {liveGame.timeControl}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {yourSeat?.name || playerName} vs {opponent?.name || "Суперник"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {liveGame.status === "playing" ? "LIVE" : "ЗАВЕРШЕНО"}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                Ви: {playerName}
              </span>
              {isReviewMode && (
                <Button variant="outline" size="sm" onClick={() => setSelectedMoveIndex(null)}>
                  Повернутись до live
                </Button>
              )}
              {liveGame.status === "finished" && (
                <Button variant="outline" size="sm" onClick={handleBackToLobby}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> До лобі
                </Button>
              )}
            </div>
          </div>
        </motion.section>

        {incomingDrawOffer && liveGame.status === "playing" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-[28px] border border-amber-500/30 bg-amber-500/10 p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-3">
              <Handshake className="h-5 w-5 text-amber-300" />
              <p className="text-sm text-foreground">
                {incomingDrawOffer} пропонує нічию. Приймаємо чи граємо далі?
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => respondToDraw(true)}>
                Прийняти
              </Button>
              <Button size="sm" variant="outline" onClick={() => respondToDraw(false)}>
                Відхилити
              </Button>
            </div>
          </motion.section>
        )}

        {incomingRematchOffer && liveGame.status === "finished" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-primary" />
              <p className="text-sm text-foreground">
                {incomingRematchOffer.from} пропонує реванш {incomingRematchOffer.timeControl}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respondToRematch(true)}>Прийняти</Button>
              <Button size="sm" variant="outline" onClick={() => respondToRematch(false)}>Відхилити</Button>
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]"
        >
          <div className="space-y-4">
            <Panel title="Матч" icon={<Swords className="h-4 w-4" />}>
              <PlayerRow
                label="Суперник"
                name={opponent?.name || "Очікуємо"}
                subtitle={liveGame.yourColor === "w" ? "Чорні" : "Білі"}
              />
              <PlayerRow
                label="Ви"
                name={yourSeat?.name || playerName}
                subtitle={liveGame.yourColor === "w" ? "Білі" : "Чорні"}
              />
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm text-muted-foreground">
                Ідентифікатор партії: <span className="font-mono text-foreground">{liveGame.id}</span>
              </div>
            </Panel>

            <Panel title="Дії" icon={<ShieldAlert className="h-4 w-4" />}>
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  disabled={!connected || liveGame.status !== "playing"}
                  onClick={() => {
                    if (window.confirm("Здатися в цій позиції?")) {
                      resign();
                    }
                  }}
                >
                  <Flag className="mr-2 h-4 w-4" /> Здатися
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  disabled={!connected || liveGame.status !== "playing"}
                  onClick={offerDraw}
                >
                  <Handshake className="mr-2 h-4 w-4" /> Запропонувати нічию
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  disabled={!connected || !canAbort}
                  onClick={abortGame}
                >
                  <Ban className="mr-2 h-4 w-4" /> Скасувати старт
                </Button>
                <Button variant="outline" className="justify-start" disabled>
                  <RefreshCw className="mr-2 h-4 w-4" /> Takeback незабаром
                </Button>
                {liveGame.status === "finished" && (
                  <>
                    <Button className="justify-start" onClick={handleRematch}>
                      <RefreshCw className="mr-2 h-4 w-4" /> Реванш
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={handleBackToLobby}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Повернутись у лобі
                    </Button>
                  </>
                )}
              </div>
            </Panel>

            <Panel title="Статус" icon={<Crown className="h-4 w-4" />}>
              <div className={`rounded-2xl border px-4 py-3 text-sm ${resultTone}`}>
                {displayedStatus}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MiniStat label="Ходи" value={String(replayState.movesSan.length)} />
                <MiniStat label="Контроль" value={liveGame.timeControl} />
                <MiniStat label="Черга" value={connected ? "Online" : "Offline"} />
                <MiniStat label="Результат" value={liveGame.result === "*" ? "..." : liveGame.result} />
              </div>
            </Panel>
          </div>

          <div className="rounded-[32px] border border-border bg-card/85 p-4 shadow-2xl shadow-black/20">
            <div className="mx-auto flex max-w-[720px] flex-col items-center gap-3">
              <div className="w-full max-w-[640px]">
                <ChessTimer
                  initialTimeMs={liveGame.blackTime}
                  timeMs={liveGame.yourColor === "w" ? liveGame.blackTime : liveGame.whiteTime}
                  isRunning={connected && liveGame.status === "playing"}
                  isActive={liveGame.currentTurn !== liveGame.yourColor}
                  onTimeout={() => {}}
                  color={liveGame.yourColor === "w" ? "b" : "w"}
                  playerName={opponent?.name || "Суперник"}
                />
              </div>

              <ChessBoard
                initialFen={boardFen}
                size={boardSize}
                onMove={handleMove}
                flipped={liveGame.yourColor === "b"}
                interactive={isMyTurn}
              />

              <div className="w-full max-w-[640px]">
                <ChessTimer
                  initialTimeMs={liveGame.whiteTime}
                  timeMs={liveGame.yourColor === "w" ? liveGame.whiteTime : liveGame.blackTime}
                  isRunning={connected && liveGame.status === "playing"}
                  isActive={liveGame.currentTurn === liveGame.yourColor}
                  onTimeout={() => {}}
                  color={liveGame.yourColor || "w"}
                  playerName={yourSeat?.name || playerName}
                />
              </div>

              <div className="w-full max-w-[640px] rounded-[24px] border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground">
                {displayedStatus}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="Ходи" icon={<Swords className="h-4 w-4" />}>
              <MoveList
                moves={replayState.movesSan}
                currentMoveIndex={selectedMoveIndex ?? latestMoveIndex ?? undefined}
                onMoveClick={setSelectedMoveIndex}
              />
            </Panel>

            <Panel title="Чат" icon={<MessageSquareText className="h-4 w-4" />}>
              <div className="flex h-72 flex-col gap-3">
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">
                      Поки тихо. Можна домовитися про темп або просто побажати вдалої гри.
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={`${message.from}-${index}`}
                        className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                          message.self
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p className={`mb-1 text-[11px] uppercase tracking-[0.18em] ${
                          message.self ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}>
                          {message.self ? "Ви" : message.from}
                        </p>
                        <p>{message.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSendChat();
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Повідомлення..."
                    className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
                  />
                  <Button type="submit" disabled={!chatInput.trim()}>
                    Надіслати
                  </Button>
                </form>
              </div>
            </Panel>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-card/85 p-4 shadow-xl shadow-black/10">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PlayerRow({
  label,
  name,
  subtitle,
}: {
  label: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/35 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/35 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function getStatusLabel(game: GameState, inCheck: boolean, opponentName: string) {
  if (game.status === "finished") {
    if (game.result === "1/2-1/2") {
      return "Партія завершилась унічию.";
    }

    const iWon =
      (game.result === "1-0" && game.yourColor === "w") ||
      (game.result === "0-1" && game.yourColor === "b");

    return iWon
      ? `Партія завершена. Ви переграли ${opponentName}.`
      : `Партія завершена. ${opponentName} цього разу був сильнішим.`;
  }

  if (game.currentTurn === game.yourColor) {
    return inCheck ? "Ваш хід, але спершу треба розв'язати шах." : "Ваш хід.";
  }

  return inCheck ? `Хід ${opponentName}. Ваш король під шахом.` : `Хід ${opponentName}.`;
}

function getResultTone(game: GameState) {
  if (game.status !== "finished") {
    return "border-border bg-secondary/40 text-foreground";
  }

  if (game.result === "1/2-1/2") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-100";
  }

  const iWon =
    (game.result === "1-0" && game.yourColor === "w") ||
    (game.result === "0-1" && game.yourColor === "b");

  return iWon
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
    : "border-rose-500/30 bg-rose-500/10 text-rose-100";
}
