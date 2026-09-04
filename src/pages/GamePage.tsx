import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Chess } from "chess.js";
import {
  ArrowLeft,
  Ban,
  Clock3,
  Flag,
  Handshake,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Send,
  Swords,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import ChessTimer from "@/components/ChessTimer";
import MoveList from "@/components/MoveList";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [panelTab, setPanelTab] = useState("moves");
  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [boardSize, setBoardSize] = useState(640);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    const syncBoardSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        setBoardSize(Math.max(292, width - 24));
        return;
      }

      if (width < 1024) {
        setBoardSize(Math.max(340, Math.min(620, width - 48, height - 190)));
        return;
      }

      setBoardSize(Math.max(420, Math.min(680, width - 590, height - 170)));
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
    };
  }, [liveGame]);

  useEffect(() => {
    setSelectedMoveIndex((current) => {
      if (current == null) return null;
      return current >= replayState.movesSan.length ? null : current;
    });
  }, [replayState.movesSan.length]);

  const latestMoveIndex = replayState.movesSan.length > 0 ? replayState.movesSan.length - 1 : null;
  const isReviewMode = selectedMoveIndex != null && selectedMoveIndex !== latestMoveIndex;
  const boardFen = selectedMoveIndex == null
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
  const isMyTurn = !!liveGame
    && connected
    && liveGame.status === "playing"
    && liveGame.currentTurn === liveGame.yourColor
    && !isReviewMode;
  const canAbort = !!liveGame
    && liveGame.status === "playing"
    && replayState.movesSan.length < 2;

  const handleMove = (from: string, to: string) => {
    if (!liveGame || !isMyTurn) return false;

    const current = new Chess(liveGame.fen);
    try {
      const move = current.move({ from, to, promotion: "q" });
      if (!move) return false;

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
    if (liveGame) requestRematch(liveGame.timeControl);
  };

  const handleBackToLobby = () => {
    resetGame();
    navigate("/online");
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput);
    setChatInput("");
  };

  if (!liveGame) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#242321] px-4 py-10 text-white">
        <div className="w-full max-w-lg rounded-xl bg-[#312e2b] px-6 py-10 text-center shadow-[0_20px_55px_rgba(0,0,0,0.35)]">
          {!connected ? (
            <>
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#81b64c]" />
              <h1 className="text-2xl font-bold">Підключаємося до партії</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#aaa7a2]">
                Відновлюємо з’єднання з ігровим сервером.
              </p>
            </>
          ) : (
            <>
              <Swords className="mx-auto mb-4 h-10 w-10 text-[#81b64c]" />
              <h1 className="text-2xl font-bold">Активної партії немає</h1>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#aaa7a2]">
                Поверніться до пошуку, щоб знайти суперника.
              </p>
              <Button onClick={() => navigate("/online")} className="mt-6 h-12 bg-[#81b64c] px-6 font-bold text-white hover:bg-[#8fc45a]">
                <ArrowLeft className="mr-2 h-4 w-4" /> До пошуку гри
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const statusLabel = getStatusLabel(liveGame, replayState.inCheck, opponent?.name || "суперника");
  const displayedStatus = !connected && liveGame.status === "playing"
    ? connectionError || "З’єднання перервано. Відновлюємо партію…"
    : statusLabel;
  const yourColor = liveGame.yourColor || "w";
  const opponentColor = yourColor === "w" ? "b" : "w";
  const yourTime = yourColor === "w" ? liveGame.whiteTime : liveGame.blackTime;
  const opponentTime = yourColor === "w" ? liveGame.blackTime : liveGame.whiteTime;
  const resultTone = getResultTone(liveGame);

  const actionButtons = (
    <div className="grid grid-cols-3 gap-2">
      <GameAction
        icon={<Handshake className="h-4 w-4" />}
        label="Нічия"
        disabled={!connected || liveGame.status !== "playing"}
        onClick={offerDraw}
      />
      <GameAction
        icon={<Ban className="h-4 w-4" />}
        label="Скасувати"
        disabled={!connected || !canAbort}
        onClick={abortGame}
      />
      <GameAction
        icon={<Flag className="h-4 w-4" />}
        label="Здатися"
        disabled={!connected || liveGame.status !== "playing"}
        onClick={() => {
          if (window.confirm("Здатися в цій партії?")) resign();
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#242321] text-white lg:h-[100dvh] lg:min-h-0">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/25 bg-[#242321]/95 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <SidebarTrigger className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white" />
          <div>
            <p className="text-sm font-bold">Онлайн-партія</p>
            <p className="text-xs text-[#aaa7a2]">{liveGame.timeControl}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${connected ? "bg-[#81b64c]/15 text-[#b9e383]" : "bg-rose-500/15 text-rose-200"}`}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "У мережі" : "З’єднання"}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-3 p-3 md:gap-4 md:p-4 lg:h-full">
        {incomingDrawOffer && liveGame.status === "playing" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-[#3c3525] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3 text-sm">
              <Handshake className="h-5 w-5 shrink-0 text-amber-300" />
              <span><strong>{incomingDrawOffer}</strong> пропонує нічию.</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respondToDraw(true)} className="bg-[#81b64c] hover:bg-[#8fc45a]">Прийняти</Button>
              <Button size="sm" variant="outline" onClick={() => respondToDraw(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Відхилити</Button>
            </div>
          </motion.section>
        )}

        {incomingRematchOffer && liveGame.status === "finished" && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-lg border border-[#81b64c]/35 bg-[#34422a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3 text-sm">
              <RefreshCw className="h-5 w-5 shrink-0 text-[#b9e383]" />
              <span><strong>{incomingRematchOffer.from}</strong> пропонує реванш {incomingRematchOffer.timeControl}.</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => respondToRematch(true)} className="bg-[#81b64c] hover:bg-[#8fc45a]">Прийняти</Button>
              <Button size="sm" variant="outline" onClick={() => respondToRematch(false)} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Відхилити</Button>
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid min-h-0 flex-1 gap-3 md:gap-4 lg:grid-cols-[minmax(0,700px)_minmax(320px,370px)] lg:justify-center"
        >
          <main className="min-w-0 space-y-2.5 lg:sticky lg:top-4 lg:self-start">
            <PlayerStrip
              name={opponent?.name || "Суперник"}
              subtitle={`${opponentColor === "w" ? "Білі" : "Чорні"} · онлайн`}
              active={liveGame.currentTurn !== yourColor && liveGame.status === "playing"}
              clock={
                <ChessTimer
                  initialTimeMs={opponentTime}
                  timeMs={opponentTime}
                  isRunning={connected && liveGame.status === "playing"}
                  isActive={liveGame.currentTurn !== yourColor && !isReviewMode}
                  onTimeout={() => {}}
                  color={opponentColor}
                  playerName={opponent?.name || "Суперник"}
                />
              }
            />

            <div className="overflow-hidden rounded-md bg-[#181715] shadow-[0_18px_48px_rgba(0,0,0,0.38)]">
              <div className="flex justify-center">
                <ChessBoard
                  initialFen={boardFen}
                  size={boardSize}
                  onMove={handleMove}
                  flipped={yourColor === "b"}
                  interactive={isMyTurn}
                  allowArrows
                  showLegalMoves
                  showLastMove
                  showChecks
                />
              </div>
            </div>

            <PlayerStrip
              name={yourSeat?.name || playerName}
              subtitle={`${yourColor === "w" ? "Білі" : "Чорні"} · це ви`}
              active={liveGame.currentTurn === yourColor && liveGame.status === "playing"}
              player
              clock={
                <ChessTimer
                  initialTimeMs={yourTime}
                  timeMs={yourTime}
                  isRunning={connected && liveGame.status === "playing"}
                  isActive={liveGame.currentTurn === yourColor && !isReviewMode}
                  onTimeout={() => {}}
                  color={yourColor}
                  playerName={yourSeat?.name || playerName}
                />
              }
            />

            <div className="lg:hidden">
              <div className={`mb-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${resultTone}`}>{displayedStatus}</div>
              {liveGame.status === "playing" ? actionButtons : (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={handleRematch} className="bg-[#81b64c] font-bold hover:bg-[#8fc45a]"><RefreshCw className="mr-2 h-4 w-4" /> Реванш</Button>
                  <Button variant="outline" onClick={handleBackToLobby} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> До лобі</Button>
                </div>
              )}
            </div>
          </main>

          <aside className="min-h-[560px] overflow-hidden rounded-xl bg-[#312e2b] shadow-[0_16px_40px_rgba(0,0,0,0.32)] lg:h-[calc(100dvh-32px)] lg:min-h-0">
            <div className="flex items-center justify-between border-b border-black/25 bg-[#2b2926] px-4 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-[#9ccc63]" />
                  <h1 className="font-bold">Онлайн-партія</h1>
                </div>
                <p className="mt-1 text-xs text-[#aaa7a2]">{yourSeat?.name || playerName} проти {opponent?.name || "суперника"}</p>
              </div>
              <span className="rounded-md bg-[#242321] px-2.5 py-1.5 text-xs font-bold text-[#d1cdc7]">{liveGame.timeControl}</span>
            </div>

            <Tabs value={panelTab} onValueChange={setPanelTab} className="flex h-[calc(100%-69px)] min-h-0 flex-col">
              <TabsList className="grid h-auto w-full shrink-0 grid-cols-3 rounded-none border-b border-black/25 bg-[#262421] p-0">
                <GameTab value="moves" label="Ходи" />
                <GameTab value="chat" label="Чат" />
                <GameTab value="details" label="Матч" />
              </TabsList>

              <TabsContent value="moves" className="m-0 flex min-h-0 flex-1 flex-col p-4">
                <div className={`mb-3 rounded-lg border px-3 py-2.5 text-sm font-semibold ${resultTone}`} aria-live="polite">
                  {displayedStatus}
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
                  <MoveList
                    moves={replayState.movesSan}
                    currentMoveIndex={selectedMoveIndex ?? latestMoveIndex ?? undefined}
                    onMoveClick={setSelectedMoveIndex}
                    heightClassName="h-[250px] lg:h-[calc(100dvh-335px)] lg:min-h-[210px]"
                  />
                </div>
                {isReviewMode && (
                  <Button variant="outline" onClick={() => setSelectedMoveIndex(null)} className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    Повернутися до поточної позиції
                  </Button>
                )}
                <div className="mt-3 hidden lg:block">
                  {liveGame.status === "playing" ? actionButtons : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={handleRematch} className="bg-[#81b64c] font-bold hover:bg-[#8fc45a]"><RefreshCw className="mr-2 h-4 w-4" /> Реванш</Button>
                      <Button variant="outline" onClick={handleBackToLobby} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> До лобі</Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="m-0 flex min-h-0 flex-1 flex-col p-4">
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-black/25 bg-[#262421] p-3">
                  {chatMessages.length === 0 ? (
                    <div className="grid min-h-48 place-items-center px-4 text-center text-sm leading-6 text-[#918e89]">
                      Тут з’являться повідомлення між гравцями.
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={`${message.from}-${index}`}
                        className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${message.self ? "ml-auto bg-[#81b64c] text-white" : "bg-[#3a3835] text-[#e3e0da]"}`}
                      >
                        <p className={`mb-1 text-xs font-bold ${message.self ? "text-white/75" : "text-[#9f9b95]"}`}>{message.self ? "Ви" : message.from}</p>
                        <p className="break-words">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSendChat();
                  }}
                >
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Написати повідомлення…"
                    className="min-w-0 flex-1 rounded-lg border border-black/25 bg-[#3a3835] px-3.5 py-3 text-sm text-white outline-none placeholder:text-[#918e89] focus:border-[#81b64c]"
                  />
                  <Button type="submit" size="icon" disabled={!chatInput.trim()} className="h-11 w-11 shrink-0 bg-[#81b64c] hover:bg-[#8fc45a]" aria-label="Надіслати">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="details" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  <MatchPlayer name={opponent?.name || "Суперник"} label="Суперник" color={opponentColor === "w" ? "Білі" : "Чорні"} />
                  <MatchPlayer name={yourSeat?.name || playerName} label="Ви" color={yourColor === "w" ? "Білі" : "Чорні"} />

                  <div className="grid grid-cols-2 gap-2">
                    <MatchStat icon={<Clock3 className="h-4 w-4" />} label="Контроль" value={liveGame.timeControl} />
                    <MatchStat icon={connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />} label="З’єднання" value={connected ? "Стабільне" : "Відновлення"} />
                    <MatchStat icon={<Swords className="h-4 w-4" />} label="Ходів" value={String(replayState.movesSan.length)} />
                    <MatchStat icon={<UserRound className="h-4 w-4" />} label="Результат" value={liveGame.result === "*" ? "Триває" : liveGame.result} />
                  </div>

                  <div className="rounded-lg border border-black/25 bg-[#262421] px-3 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#918e89]">Номер партії</p>
                    <p className="mt-1 break-all font-mono text-xs text-[#d2cec8]">{liveGame.id}</p>
                  </div>

                  {liveGame.status === "finished" && (
                    <div className="grid gap-2">
                      <Button onClick={handleRematch} className="h-11 bg-[#81b64c] font-bold hover:bg-[#8fc45a]"><RefreshCw className="mr-2 h-4 w-4" /> Запропонувати реванш</Button>
                      <Button variant="outline" onClick={handleBackToLobby} className="h-11 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" /> Повернутися до лобі</Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </aside>
        </motion.section>
      </div>
    </div>
  );
}

function PlayerStrip({
  name,
  subtitle,
  clock,
  active,
  player = false,
}: {
  name: string;
  subtitle: string;
  clock: ReactNode;
  active: boolean;
  player?: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-[#312e2b] px-2.5 py-2 shadow-xl shadow-black/20 sm:px-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-lg text-sm font-black ${player ? "bg-[#5b7442] text-white" : "bg-[#45423e] text-[#e8e5df]"}`}>
          {initial}
          {active && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#312e2b] bg-[#9dce63]" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white sm:text-base">{name}</span>
          <span className="mt-0.5 block truncate text-xs text-[#aaa7a2]">{subtitle}</span>
        </span>
      </div>
      <div className="max-w-[54%] shrink-0 sm:w-[210px]">{clock}</div>
    </div>
  );
}

function GameTab({ value, label }: { value: string; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-[#aaa7a2] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#312e2b] data-[state=active]:text-white"
    >
      {label}
    </TabsTrigger>
  );
}

function GameAction({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border border-black/25 bg-[#3a3835] px-2 py-2 text-xs font-bold text-[#e1ded8] transition hover:bg-[#45423e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MatchPlayer({ name, label, color }: { name: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black/25 bg-[#3a3835] px-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#242321] text-sm font-black text-white">{name.charAt(0).toUpperCase() || "?"}</span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wider text-[#918e89]">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-bold text-white">{name} · {color}</span>
      </span>
    </div>
  );
}

function MatchStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/25 bg-[#262421] p-3">
      <div className="flex items-center gap-2 text-[#9ccc63]">{icon}<span className="text-xs font-bold uppercase tracking-wider text-[#918e89]">{label}</span></div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function getStatusLabel(game: GameState, inCheck: boolean, opponentName: string) {
  if (game.status === "finished") {
    if (game.result === "1/2-1/2") return "Партія завершилася внічию.";

    const iWon = (game.result === "1-0" && game.yourColor === "w")
      || (game.result === "0-1" && game.yourColor === "b");
    return iWon
      ? `Перемога! Ви переграли ${opponentName}.`
      : `Партію завершено. ${opponentName} переміг.`;
  }

  if (game.currentTurn === game.yourColor) {
    return inCheck ? "Ваш хід. Король під шахом." : "Ваш хід.";
  }

  return `Хід суперника — ${opponentName}.`;
}

function getResultTone(game: GameState) {
  if (game.status !== "finished") return "border-white/10 bg-[#262421] text-[#dedbd5]";
  if (game.result === "1/2-1/2") return "border-amber-400/25 bg-amber-400/10 text-amber-100";

  const iWon = (game.result === "1-0" && game.yourColor === "w")
    || (game.result === "0-1" && game.yourColor === "b");
  return iWon
    ? "border-[#81b64c]/35 bg-[#81b64c]/10 text-[#dff0cc]"
    : "border-rose-400/25 bg-rose-400/10 text-rose-100";
}
