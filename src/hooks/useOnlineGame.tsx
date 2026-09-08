import { uniqueId } from "@/lib/unique-id";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MatchOptions, PlayCapabilities, Challenge, AvailablePlayer } from "@/lib/play-types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const DEVELOPMENT_WS_URL = "ws://localhost:3001";
const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const RECONNECT_BASE_DELAY_MS = 600;
const RECONNECT_MAX_DELAY_MS = 8_000;

export type GameState = {
  id: string | null;
  white: { id: string; name: string; rating: number | null; connected?: boolean } | null;
  black: { id: string; name: string; rating: number | null; connected?: boolean } | null;
  clockSyncAt: number;
  createdAt?: string;
  rematchAvailable?: boolean;
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
  id?: string;
  fromId?: string;
  timestamp?: number;
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
  viewedGame: GameState | null;
  gameLoadStatus: "idle" | "loading" | "ready" | "not_found" | "error";
  loadGame: (id: string) => void;
  movePending: boolean;
  outgoingDrawOffer: boolean;
  rematchRequested: boolean;
  reportStatus: "idle" | "sending" | "saved" | "error";
  reportGame: (gameId: string, reason: string, note: string) => void;
  connect: () => void;
  findGame: (timeControl: string, color?: "w" | "b" | "random", options?: Partial<MatchOptions>) => void;
  capabilities: PlayCapabilities | null;
  searchSettings: MatchOptions | null;
  actionError: string | null;
  clearActionError: () => void;
  incomingChallenge: Challenge | null;
  outgoingChallenge: Challenge | null;
  challengeStatus: string | null;
  challengeBusy: boolean;
  availablePlayers: AvailablePlayer[];
  playersQuery: string;
  challengeAction: (type: string, payload?: Record<string, unknown>) => boolean;
  pendingGameId: string | null;
  acknowledgeMatch: () => void;
  cancelSearch: () => void;
  makeMove: (from: string, to: string, promotion?: "q" | "r" | "b" | "n", expectedPly?: number) => boolean;
  resign: () => void;
  abortGame: () => void;
  offerDraw: () => void;
  respondToDraw: (accept: boolean) => void;
  sendChat: (message: string) => void;
  requestRematch: (timeControl: string, gameId?: string) => void;
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

function normalizePlayer(value: unknown): { id: string; name: string; rating: number | null; connected?: boolean } | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    return null;
  }

  return { id: value.id, name: value.name, rating: normalizeInteger(value.rating), connected: typeof value.connected === "boolean" ? value.connected : undefined };
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
    clockSyncAt: Date.now(),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : undefined,
    rematchAvailable: value.rematchAvailable === true,
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
  const [capabilities, setCapabilities] = useState<PlayCapabilities | null>(null);
  const [searchSettings, setSearchSettings] = useState<MatchOptions | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [outgoingChallenge, setOutgoingChallenge] = useState<Challenge | null>(null);
  const [challengeStatus, setChallengeStatus] = useState<string | null>(null);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [playersQuery, setPlayersQuery] = useState("");
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const accountIdRef = useRef(user?.id);
  const previousAccountRef = useRef(user?.id);
  accountIdRef.current = user?.id;
  const clearStoredSearch = useCallback(() => {
    try { if (accountIdRef.current) sessionStorage.removeItem(`coo.matchmaking:${accountIdRef.current}`); } catch { /* Browser storage is optional. */ }
  }, []);
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
  const [viewedGame, setViewedGame] = useState<GameState | null>(null);
  const [gameLoadStatus, setGameLoadStatus] = useState<"idle" | "loading" | "ready" | "not_found" | "error">("idle");
  const requestedGameRef = useRef<string | null>(null);
  const [movePending, setMovePending] = useState(false);
  const pendingMoveRef = useRef(false);
  const [outgoingDrawOffer, setOutgoingDrawOffer] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "saved" | "error">("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const connectRef = useRef<() => void>(() => undefined);
  const gameRef = useRef<GameState | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const searchStartRef = useRef(0);
  const searchRequestRef = useRef<MatchOptions | null>(null);
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
    gameRef.current = null;
    requestedGameRef.current = null;
    setViewedGame(null);
    setGameLoadStatus("idle");
    pendingMoveRef.current = false;
    setMovePending(false);
    setOutgoingDrawOffer(false);
    setRematchRequested(false);
    setReportStatus("idle");
    setGame(null);
    setChatMessages([]);
    setIncomingDrawOffer(null);
    setIncomingRematchOffer(null);
  }, []);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
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

    gameRef.current = nextGame;
    pendingMoveRef.current = false;
    setMovePending(false);
    setGame(nextGame);
  }, []);

  const handleMessage = useCallback((data: unknown) => {
    if (!isRecord(data) || typeof data.type !== "string") return;

    switch (data.type) {
      case "authenticated":
        if (isRecord(data.capabilities)) setCapabilities(data.capabilities as unknown as PlayCapabilities);
        if (data.hasActiveGame === true) {
          searchRequestRef.current = null;
          clearStoredSearch();
          clearSearchState();
        }
        if (typeof data.playerId === "string") { playerIdRef.current = data.playerId; setPlayerId(data.playerId); }
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
        if (!searchStartRef.current) searchStartRef.current = Date.now();
        setSearchTime(Math.floor((Date.now() - searchStartRef.current) / 1000));
        setQueueSize(typeof data.queueSize === "number" ? data.queueSize : 0);
        return;

      case "cancelled":
        searchRequestRef.current = null;
        clearStoredSearch();
        clearSearchState();
        return;

      case "queue_update":
        setQueueSize(typeof data.queueSize === "number" ? data.queueSize : 0);
        return;

      case "game_found":
        setOutgoingDrawOffer(false); setRematchRequested(false); setReportStatus("idle");
        searchRequestRef.current = null;
        clearStoredSearch();
        setIncomingChallenge(null);
        setOutgoingChallenge(null);
        setChallengeBusy(false);
        if (isRecord(data.game) && typeof data.game.id === "string") setPendingGameId(data.game.id);
        clearSearchState();
        setChatMessages([]);
        setIncomingDrawOffer(null);
        setIncomingRematchOffer(null);
        applyGame(data.game, { rememberOpponent: true });
        return;

      case "game_state":
        if (isRecord(data.game) && data.game.status === "playing") { searchRequestRef.current = null; clearStoredSearch(); clearSearchState(); }
        applyGame(data.game);
        return;

      case "move_made":
      case "game_update":
      case "game_over": {
        const current = gameRef.current;
        if (!current || data.gameId !== current.id) return;
        const next: GameState = {
          ...current,
          fen: typeof data.fen === "string" ? data.fen : current.fen,
          pgn: typeof data.pgn === "string" ? data.pgn : current.pgn,
          currentTurn: data.currentTurn === "w" || data.currentTurn === "b" ? data.currentTurn : current.currentTurn,
          whiteTime: typeof data.whiteTime === "number" ? data.whiteTime : current.whiteTime,
          blackTime: typeof data.blackTime === "number" ? data.blackTime : current.blackTime,
          clockSyncAt: Date.now(),
          white: current.white ? { ...current.white, connected: typeof data.whiteConnected === "boolean" ? data.whiteConnected : current.white.connected } : null,
          black: current.black ? { ...current.black, connected: typeof data.blackConnected === "boolean" ? data.blackConnected : current.black.connected } : null,
        };
        if (data.type === "game_over") {
          next.status = "finished";
          next.result = typeof data.result === "string" ? data.result : current.result;
          next.reason = typeof data.reason === "string" ? data.reason : undefined;
          next.rated = data.rated === true;
          next.saved = data.saved === true;
          next.persistenceStatus = data.persistenceStatus === "disabled" || data.persistenceStatus === "failed" ? data.persistenceStatus : "pending";
        }
        if (data.type !== "game_update") { pendingMoveRef.current = false; setMovePending(false); setIncomingDrawOffer(null); setOutgoingDrawOffer(false); }
        gameRef.current = next; setGame(next);
        return;
      }

      case "game_loaded":
        if (isRecord(data.game) && data.game.id === requestedGameRef.current) { setViewedGame(normalizeGame(data.game)); setGameLoadStatus("ready"); }
        return;
      case "game_load_error":
        if (data.gameId === requestedGameRef.current) setGameLoadStatus(data.code === "not_found" ? "not_found" : "error");
        return;
      case "draw_requested":
        if (data.gameId === gameRef.current?.id) setOutgoingDrawOffer(true);
        return;
      case "report_saved":
        if (data.gameId === gameRef.current?.id) setReportStatus("saved");
        return;
      case "chat_history":
        if (data.gameId === gameRef.current?.id && Array.isArray(data.messages)) setChatMessages(data.messages.filter(isRecord).filter(item => typeof item.message === "string" && typeof item.from === "string").slice(-100).map(item => ({ id: String(item.id), from: String(item.from), fromId: String(item.fromId), message: String(item.message), self: item.fromId === playerIdRef.current })));
        return;

      case "game_saved":
        if (isRecord(data.game) && data.game.id === gameRef.current?.id) applyGame(data.game);
        return;

      case "draw_offer":
        if (data.gameId !== gameRef.current?.id) return;
        setIncomingDrawOffer(typeof data.from === "string" ? data.from : "Суперник");
        toast.info("Суперник пропонує нічию.");
        return;

      case "draw_response":
        if (data.gameId !== gameRef.current?.id) return;
        setOutgoingDrawOffer(false);
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
        setRematchRequested(true);
        toast.info("Запит на реванш надіслано.");
        return;

      case "rematch_declined":
        setRematchRequested(false);
        toast.info("Суперник відхилив реванш.");
        setIncomingRematchOffer(null);
        return;

      case "chat_msg":
        if (data.gameId === gameRef.current?.id && typeof data.from === "string" && typeof data.message === "string") {
          const from = data.from;
          const message = data.message;
          setChatMessages((current) => [
            ...current,
            { id: typeof data.id === "string" ? data.id : undefined, fromId: typeof data.fromId === "string" ? data.fromId : undefined, from, message, self: data.fromId === playerIdRef.current },
          ].slice(-100));
        }
        return;

      case "challenge_created":
      case "challenge_received":
        if (isRecord(data.challenge) && typeof data.challenge.id === "string" && isRecord(data.challenge.from)) {
          const challenge = data.challenge as unknown as Challenge;
          if (data.type === "challenge_created") setOutgoingChallenge(challenge);
          else setIncomingChallenge(challenge);
          setChallengeStatus(null);
          setActionError(null);
        }
        setChallengeBusy(false);
        return;
      case "challenge_closed":
        setOutgoingChallenge(current => current?.id === data.id ? null : current);
        setIncomingChallenge(current => current?.id === data.id ? null : current);
        setChallengeBusy(false);
        setChallengeStatus(data.status === "expired" ? "Термін виклику минув." : data.status === "declined" ? "Виклик відхилено." : "Виклик скасовано.");
        return;
      case "player_results":
        setAvailablePlayers(Array.isArray(data.players) ? data.players as AvailablePlayer[] : []);
        setPlayersQuery(typeof data.query === "string" ? data.query : "");
        return;
      case "error":
        pendingMoveRef.current = false; setMovePending(false);
        if (data.action === "draw_offer") setOutgoingDrawOffer(false);
        if (data.action === "rematch") setRematchRequested(false);
        if (data.action === "report_game") setReportStatus("error");
        if (typeof data.message === "string") {
          setActionError(data.message);
          setChallengeBusy(false);
          if (data.action === "find_game") { searchRequestRef.current = null; clearStoredSearch(); clearSearchState(); }
          toast.error(data.message);
        }
        return;

      default:
        return;
    }
  }, [applyGame, clearReconnectTimer, clearSearchState, clearStoredSearch]);

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

    if (!navigator.onLine) { setConnectionError("Немає з’єднання з мережею."); return; }
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;
    setConnectionError(null);

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "authenticate", token: session.access_token }));
    };

    socket.onclose = (event) => {
      if (wsRef.current !== socket) return;
      wsRef.current = null;
      pendingMoveRef.current = false;
      setMovePending(false);
      setConnected(false);
      setPlayerId(null);
      if (searchRequestRef.current) setSearching(true);
      else clearSearchState();

      if (event.code === 4001) setConnectionError("Акаунт відкрито в іншій вкладці або на іншому пристрої.");
      if (event.code !== 1008 && event.code !== 4001) {
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
      const previousSocket = wsRef.current;
      wsRef.current = null;
      previousSocket?.close();
      setCapabilities(null);
      setIncomingChallenge(null);
      setOutgoingChallenge(null);
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

  const findGame = useCallback((timeControl: string, color: "w" | "b" | "random" = "random", options: Partial<MatchOptions> = {}) => {
    if (!connected || !navigator.onLine) { setConnectionError("Немає з’єднання з сервером. Спробуйте підключитися знову."); return; }
    if (gameRef.current?.status === "playing") { setActionError("У вас уже є активна партія."); return; }
    const request = { timeControl, color, rated: capabilities?.rated ?? false, minRating: 100, maxRating: 4000, ...options };
    searchRequestRef.current = request;
    setSearchSettings(request);
    setActionError(null);
    searchStartRef.current = Date.now();
    setSearchTime(0);
    setSearching(true);
    try { sessionStorage.setItem(`coo.matchmaking:${accountIdRef.current}`, JSON.stringify({ options: request, startedAt: searchStartRef.current })); } catch { /* Optional storage. */ }
    send({ type: "find_game", ...request });
  }, [capabilities?.rated, connected, send]);

  const challengeAction = useCallback((type: string, payload: Record<string, unknown> = {}) => {
    if (!connected || !navigator.onLine) { setActionError("Немає з’єднання з сервером."); return false; }
    setActionError(null);
    if (["create_challenge", "accept_challenge", "get_challenge"].includes(type)) setChallengeBusy(true);
    return send({ type, ...payload });
  }, [connected, send]);

  const cancelSearch = useCallback(() => {
    searchRequestRef.current = null;
    clearStoredSearch();
    searchStartRef.current = 0;
    send({ type: "cancel_find" });
    clearSearchState();
  }, [clearSearchState, clearStoredSearch, send]);

  const loadGame = useCallback((id: string) => {
    if (!connected) return;
    requestedGameRef.current = id;
    setGameLoadStatus("loading");
    setViewedGame(null);
    if (!send({ type: "get_game", gameId: id })) setGameLoadStatus("error");
  }, [connected, send]);

  const reportGame = useCallback((gameId: string, reason: string, note: string) => {
    setReportStatus("sending");
    if (!send({ type: "report_game", gameId, reason, note })) setReportStatus("error");
  }, [send]);

  const makeMove = useCallback((from: string, to: string, promotion: "q" | "r" | "b" | "n" = "q", expectedPly?: number) => {
    const current = gameRef.current;
    if (!connected || !current?.id || current.status !== "playing" || current.currentTurn !== current.yourColor || pendingMoveRef.current) return false;
    pendingMoveRef.current = true;
    const sent = send({ type: "make_move", gameId: current.id, from, to, promotion, expectedPly, moveId: uniqueId() });
    pendingMoveRef.current = sent;
    setMovePending(sent);
    return sent;
  }, [send, connected]);

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

  const requestRematch = useCallback((timeControl: string, gameId?: string) => {
    const id = gameId || gameRef.current?.id;
    if (id && send({ type: "rematch", gameId: id, timeControl })) setRematchRequested(true);
  }, [send]);

  const respondToRematch = useCallback((accept: boolean) => {
    const offer = incomingRematchOffer;
    if (!offer) return;
    send({ type: "rematch_response", gameId: offer.gameId, timeControl: offer.timeControl, accept });
    setIncomingRematchOffer(null);
  }, [incomingRematchOffer, send]);

  const resetGame = useCallback(() => {
    if (gameRef.current?.status === "playing") return;
    gameRef.current = null;
    searchRequestRef.current = null;
    clearStoredSearch();
    clearSearchState();
    clearGameState();
  }, [clearGameState, clearSearchState, clearStoredSearch]);

  useEffect(() => {
    const previous = previousAccountRef.current;
    if (previous && previous !== user?.id) {
      try { sessionStorage.removeItem(`coo.matchmaking:${previous}`); } catch { /* Optional storage. */ }
      searchRequestRef.current = null;
      gameRef.current = null;
      setPendingGameId(null);
      clearSearchState();
      clearGameState();
      const socket = wsRef.current;
      wsRef.current = null;
      socket?.close();
      setConnected(false);
    }
    previousAccountRef.current = user?.id;
  }, [user?.id, clearSearchState, clearGameState]);

  useEffect(() => {
    if (!user?.id || isGuest) return;
    try {
      const stored = JSON.parse(sessionStorage.getItem(`coo.matchmaking:${user.id}`) || "null");
      if (stored?.options && Date.now() - stored.startedAt < 30 * 60_000) {
        searchRequestRef.current = stored.options;
        searchStartRef.current = stored.startedAt;
        setSearchSettings(stored.options);
        setSearching(true);
      }
    } catch { /* Ignore invalid browser preferences. */ }
  }, [user?.id, isGuest]);

  useEffect(() => {
    if (user?.id && session?.access_token && !isGuest) connect();
  }, [connect, user?.id, isGuest, session?.access_token]);

  useEffect(() => {
    const online = () => connectRef.current();
    const offline = () => { setConnectionError("Немає з’єднання з мережею."); setConnected(false); wsRef.current?.close(); };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  const acknowledgeMatch = useCallback(() => setPendingGameId(null), []);
  const getPlayerColor = useCallback(() => gameRef.current?.yourColor || null, []);

  return (
    <OnlineGameContext.Provider
      value={{
        connected,
        viewedGame, gameLoadStatus, loadGame, movePending, outgoingDrawOffer, rematchRequested, reportStatus, reportGame,
        capabilities, searchSettings, actionError, clearActionError: () => setActionError(null),
        incomingChallenge, outgoingChallenge, challengeStatus, challengeBusy, availablePlayers, playersQuery, challengeAction,
        pendingGameId, acknowledgeMatch,
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
