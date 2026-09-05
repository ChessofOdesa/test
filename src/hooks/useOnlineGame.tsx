import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const DEVELOPMENT_WS_URL = "ws://localhost:3001";
const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const RECONNECT_BASE_DELAY_MS = 600;
const RECONNECT_MAX_DELAY_MS = 8_000;

export type GameState = {
  id: string | null;
  white: { id: string; name: string; rating: number | null } | null;
  black: { id: string; name: string; rating: number | null } | null;
  timeControl: string;
  fen: string;
  pgn: string;
  yourColor: "w" | "b" | null;
  currentTurn: "w" | "b";
  whiteTime: number;
  blackTime: number;
  status: "waiting" | "playing" | "finished";
  result: string;
  reason?: string;
  rated: boolean;
  saved: boolean;
  persistenceStatus: "pending" | "saved" | "disabled" | "failed";
  whiteRatingBefore: number | null;
  blackRatingBefore: number | null;
  whiteRatingChange: number | null;
  blackRatingChange: number | null;
};

export type ChatMessage = {
  from: string;
  message: string;
  self?: boolean;
};

type Opponent = {
  id: string;
  name: string;
  lastPlayed: number;
};

type RematchOffer = {
  gameId: string;
  from: string;
  timeControl: string;
};

type OnlineGameContextValue = {
  connected: boolean;
  connectionError: string | null;
  playerId: string | null;
  playerName: string;
  game: GameState | null;
  searching: boolean;
  queueSize: number;
  searchTime: number;
  chatMessages: ChatMessage[];
  recentOpponents: Opponent[];
  incomingDrawOffer: string | null;
  incomingRematchOffer: RematchOffer | null;
  connect: () => void;
  findGame: (timeControl: string, color?: "w" | "b" | "random") => void;
  cancelSearch: () => void;
  makeMove: (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => void;
  resign: () => void;
  abortGame: () => void;
  offerDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  sendChat: (message: string) => void;
  requestRematch: (timeControl: string) => void;
  respondToRematch: (accept: boolean) => void;
  resetGame: () => void;
  getPlayerColor: () => "w" | "b" | null;
};

const OnlineGameContext = createContext<OnlineGameContextValue | null>(null);

function getWebSocketUrl() {
  const configured = import.meta.env.VITE_ONLINE_WS_URL?.trim();
  if (configured) return configured;
  return import.meta.env.DEV ? DEVELOPMENT_WS_URL : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function normalizePlayer(value: unknown): { id: string; name: string; rating: number | null } | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  return { id: value.id, name: value.name, rating: normalizeInteger(value.rating) };
}

function normalizeGame(value: unknown): GameState | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;

  const yourColor = value.yourColor === "w" || value.yourColor === "b" ? value.yourColor : null;
  const currentTurn = value.currentTurn === "b" ? "b" : "w";
  const status = value.status === "finished" || value.status === "waiting" ? value.status : "playing";
  const persistenceStatus = value.persistenceStatus === "saved"
    || value.persistenceStatus === "disabled"
    || value.persistenceStatus === "failed"
    ? value.persistenceStatus
    : "pending";

  return {
    id: value.id,
    white: normalizePlayer(value.white),
    black: normalizePlayer(value.black),
    timeControl: typeof value.timeControl === "string" ? value.timeControl : "5+0",
    fen: typeof value.fen === "string" ? value.fen : STARTING_FEN,
    pgn: typeof value.pgn === "string" ? value.pgn : "",
    yourColor,
    currentTurn,
    whiteTime: typeof value.whiteTime === "number" ? value.whiteTime : 0,
    blackTime: typeof value.blackTime === "number" ? value.blackTime : 0,
    status,
    result: typeof value.result === "string" ? value.result : "*",
    reason: typeof value.reason === "string" ? value.reason : undefined,
    rated: value.rated === true,
    saved: value.saved === true,
    persistenceStatus,
    whiteRatingBefore: normalizeInteger(value.whiteRatingBefore),
    blackRatingBefore: normalizeInteger(value.blackRatingBefore),
    whiteRatingChange: normalizeInteger(value.whiteRatingChange),
    blackRatingChange: normalizeInteger(value.blackRatingChange),
  };
}

export function OnlineGameProvider({ children }: { children: ReactNode }) {
  const { user, session, isGuest } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [game, setGame] = useState<GameState | null>(null);
  const [searching, setSearching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [recentOpponents, setRecentOpponents] = useState<Opponent[]>([]);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<string | null>(null);
  const [incomingRematchOffer, setIncomingRematchOffer] = useState<RematchOffer | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const gameRef = useRef<GameState | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const searchStartRef = useRef(0);
  const searchRequestRef = useRef<{
    timeControl: string;
    color: "w" | "b" | "random";
  } | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  const playerName =
    user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split("@")[0] || "Гість";

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearSearchState = useCallback(() => {
    setSearching(false);
    setQueueSize(0);
    setSearchTime(0);
  }, []);

  const clearGameState = useCallback(() => {
    setGame(null);
    setChatMessages([]);
    setIncomingDrawOffer(null);
    setIncomingRematchOffer(null);
  }, []);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const applyGame = useCallback((rawGame: unknown, { rememberOpponent = false } = {}) => {
    const nextGame = normalizeGame(rawGame);
    if (!nextGame) return;

    if (rememberOpponent) {
      const opponent = nextGame.yourColor === "w" ? nextGame.black : nextGame.white;
      if (opponent) {
        setRecentOpponents((current) => [
          { id: opponent.id, name: opponent.name, lastPlayed: Date.now() },
          ...current.filter((item) => item.id !== opponent.id),
        ].slice(0, 10));
      }
    }

    setGame(nextGame);
  }, []);

  const handleMessage = useCallback((data: unknown) => {
    if (!isRecord(data) || typeof data.type !== "string") return;

    switch (data.type) {
      case "authenticated":
        if (typeof data.playerId === "string") setPlayerId(data.playerId);
        reconnectAttemptsRef.current = 0;
        clearReconnectTimer();
        setConnectionError(null);
        setConnected(true);
        if (searchRequestRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "find_game", ...searchRequestRef.current }));
        }
        return;

      case "waiting":
        setSearching(true);
        searchStartRef.current = Date.now();
        setSearchTime(0);
        setQueueSize(typeof data.queueSize === "number" ? data.queueSize : 0);
        return;

      case "cancelled":
        searchRequestRef.current = null;
        clearSearchState();
        return;

      case "queue_update":
        setQueueSize(typeof data.queueSize === "number" ? data.queueSize : 0);
        return;

      case "game_found":
        searchRequestRef.current = null;
        clearSearchState();
        setChatMessages([]);
        setIncomingDrawOffer(null);
        setIncomingRematchOffer(null);
        applyGame(data.game, { rememberOpponent: true });
        return;

      case "game_state":
        applyGame(data.game);
        return;

      case "move_made":
        if (data.gameId === gameRef.current?.id) {
          setGame((current) =>
            current
              ? {
                  ...current,
                  fen: typeof data.fen === "string" ? data.fen : current.fen,
                  pgn: typeof data.pgn === "string" ? data.pgn : current.pgn,
                  currentTurn: data.currentTurn === "b" ? "b" : "w",
                  whiteTime: typeof data.whiteTime === "number" ? data.whiteTime : current.whiteTime,
                  blackTime: typeof data.blackTime === "number" ? data.blackTime : current.blackTime,
                }
              : current,
          );
        }
        return;

      case "game_update":
        if (data.gameId === gameRef.current?.id) {
          setGame((current) =>
            current
              ? {
                  ...current,
                  currentTurn: data.currentTurn === "b" ? "b" : "w",
                  whiteTime: typeof data.whiteTime === "number" ? data.whiteTime : current.whiteTime,
                  blackTime: typeof data.blackTime === "number" ? data.blackTime : current.blackTime,
                }
              : current,
          );
        }
        return;

      case "game_over":
        setIncomingDrawOffer(null);
        setGame((current) =>
          current && data.gameId === current.id
            ? {
                ...current,
                fen: typeof data.fen === "string" ? data.fen : current.fen,
                pgn: typeof data.pgn === "string" ? data.pgn : current.pgn,
                whiteTime: typeof data.whiteTime === "number" ? data.whiteTime : current.whiteTime,
                blackTime: typeof data.blackTime === "number" ? data.blackTime : current.blackTime,
                status: "finished",
                result: typeof data.result === "string" ? data.result : current.result,
                reason: typeof data.reason === "string" ? data.reason : undefined,
                rated: data.rated === true,
                saved: data.saved === true,
                persistenceStatus: data.persistenceStatus === "disabled"
                  || data.persistenceStatus === "failed"
                  ? data.persistenceStatus
                  : "pending",
              }
            : current,
        );
        return;

      case "game_saved":
        applyGame(data.game);
        return;

      case "draw_offer":
        setIncomingDrawOffer(typeof data.from === "string" ? data.from : "Суперник");
        toast.info("Суперник пропонує нічию.");
        return;

      case "draw_response":
        if (data.accept === false) toast.info("Пропозицію нічиєї відхилено.");
        setIncomingDrawOffer(null);
        return;

      case "rematch_offer":
        if (typeof data.gameId === "string" && typeof data.from === "string" && typeof data.timeControl === "string") {
          setIncomingRematchOffer({ gameId: data.gameId, from: data.from, timeControl: data.timeControl });
          toast.info(`${data.from} пропонує реванш.`);
        }
        return;

      case "rematch_requested":
        toast.info("Запит на реванш надіслано.");
        return;

      case "rematch_declined":
        toast.info("Суперник відхилив реванш.");
        setIncomingRematchOffer(null);
        return;

      case "chat_msg":
        if (data.gameId === gameRef.current?.id && typeof data.from === "string" && typeof data.message === "string") {
          const from = data.from;
          const message = data.message;
          setChatMessages((current) => [
            ...current,
            { from, message, self: data.fromId === playerIdRef.current },
          ]);
        }
        return;

      case "error":
        if (typeof data.message === "string") {
          setConnectionError(data.message);
          toast.error(data.message);
        }
        return;

      default:
        return;
    }
  }, [applyGame, clearReconnectTimer, clearSearchState]);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current || reconnectTimerRef.current != null) {
      return;
    }

    const delay = Math.min(
      RECONNECT_MAX_DELAY_MS,
      RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttemptsRef.current,
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      if (shouldReconnectRef.current) {
        connectRef.current();
      }
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (!session?.access_token || isGuest) {
      setConnectionError("Для онлайн-партій потрібно увійти у свій акаунт.");
      return;
    }

    shouldReconnectRef.current = true;
    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      setConnectionError("Адресу онлайн-сервера ще не налаштовано.");
      return;
    }

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    setConnectionError(null);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "authenticate", token: session.access_token }));
    };

    socket.onclose = (event) => {
      if (wsRef.current !== socket) return;
      wsRef.current = null;
      setConnected(false);
      setPlayerId(null);
      clearSearchState();

      if (event.code !== 1008) {
        scheduleReconnect();
      }
    };

    socket.onerror = () => {
      if (wsRef.current === socket) {
        setConnectionError("Не вдалося підключитися до онлайн-сервера.");
      }
    };

    socket.onmessage = (event) => {
      try {
        handleMessage(JSON.parse(event.data));
      } catch {
        toast.error("Некоректне повідомлення від ігрового сервера.");
      }
    };
  }, [clearSearchState, handleMessage, isGuest, scheduleReconnect, session?.access_token]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!session?.access_token || isGuest) {
      shouldReconnectRef.current = false;
      searchRequestRef.current = null;
      clearReconnectTimer();
      reconnectAttemptsRef.current = 0;
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
      setPlayerId(null);
      clearSearchState();
      clearGameState();
    } else {
      shouldReconnectRef.current = true;
    }
  }, [clearGameState, clearReconnectTimer, clearSearchState, isGuest, session?.access_token]);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      wsRef.current?.close();
    };
  }, [clearReconnectTimer]);

  useEffect(() => {
    if (!searching) return;

    const interval = window.setInterval(() => {
      setSearchTime(Math.floor((Date.now() - searchStartRef.current) / 1_000));
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [searching]);

  const findGame = useCallback((timeControl: string, color: "w" | "b" | "random" = "random") => {
    if (!session?.access_token || isGuest) {
      toast.info("Увійдіть у свій акаунт, щоб грати онлайн.");
      return;
    }

    searchRequestRef.current = { timeControl, color };

    if (!connected) {
      connect();
      setSearching(true);
      searchStartRef.current = Date.now();
      toast.info("Підключаємося до сервера. Пошук почнеться автоматично.");
      return;
    }

    send({ type: "find_game", timeControl, color });
  }, [connect, connected, isGuest, send, session?.access_token]);

  const cancelSearch = useCallback(() => {
    searchRequestRef.current = null;
    send({ type: "cancel_find" });
    clearSearchState();
  }, [clearSearchState, send]);

  const makeMove = useCallback((from: string, to: string, promotion: "q" | "r" | "b" | "n" = "q") => {
    if (!gameRef.current?.id) return;
    send({ type: "make_move", gameId: gameRef.current.id, from, to, promotion });
  }, [send]);

  const resign = useCallback(() => {
    if (gameRef.current?.id) send({ type: "resign", gameId: gameRef.current.id });
  }, [send]);

  const abortGame = useCallback(() => {
    if (gameRef.current?.id) send({ type: "abort", gameId: gameRef.current.id });
  }, [send]);

  const offerDraw = useCallback(() => {
    if (!gameRef.current?.id) return;
    send({ type: "draw_offer", gameId: gameRef.current.id });
    toast.info("Пропозицію нічиєї надіслано.");
  }, [send]);

  const respondToDraw = useCallback((accept: boolean) => {
    if (gameRef.current?.id) send({ type: "draw_response", gameId: gameRef.current.id, accept });
    setIncomingDrawOffer(null);
  }, [send]);

  const sendChat = useCallback((message: string) => {
    if (!gameRef.current?.id || !message.trim()) return;
    send({ type: "chat", gameId: gameRef.current.id, message: message.trim() });
  }, [send]);

  const requestRematch = useCallback((timeControl: string) => {
    if (gameRef.current?.id) send({ type: "rematch", gameId: gameRef.current.id, timeControl });
  }, [send]);

  const respondToRematch = useCallback((accept: boolean) => {
    const offer = incomingRematchOffer;
    if (!offer) return;
    send({ type: "rematch_response", gameId: offer.gameId, timeControl: offer.timeControl, accept });
    setIncomingRematchOffer(null);
  }, [incomingRematchOffer, send]);

  const resetGame = useCallback(() => {
    searchRequestRef.current = null;
    clearSearchState();
    clearGameState();
  }, [clearGameState, clearSearchState]);

  const getPlayerColor = useCallback(() => gameRef.current?.yourColor || null, []);

  return (
    <OnlineGameContext.Provider
      value={{
        connected,
        connectionError,
        playerId,
        playerName,
        game,
        searching,
        queueSize,
        searchTime,
        chatMessages,
        recentOpponents,
        incomingDrawOffer,
        incomingRematchOffer,
        connect,
        findGame,
        cancelSearch,
        makeMove,
        resign,
        abortGame,
        offerDraw,
        respondToDraw,
        sendChat,
        requestRematch,
        respondToRematch,
        resetGame,
        getPlayerColor,
      }}
    >
      {children}
    </OnlineGameContext.Provider>
  );
}

export function useOnlineGame() {
  const context = useContext(OnlineGameContext);
  if (!context) throw new Error("useOnlineGame must be used inside OnlineGameProvider");
  return context;
}
