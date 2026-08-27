import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import { Chess } from "chess.js";

/**
 * Chess of Odesa online-game server.
 *
 * The browser is deliberately not trusted: it sends only a move attempt, while
 * the server owns the position, clock and result. Before starting this service,
 * copy .env.example to .env and set the Supabase values there.
 */

const PORT = readPort(process.env.PORT, 3001);
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_MESSAGE_BYTES = 8 * 1024;
const AUTH_TIMEOUT_MS = 10_000;
const RECONNECT_GRACE_MS = 30_000;
const FINISHED_GAME_TTL_MS = 5 * 60_000;
const PLAYER_TTL_MS = 15 * 60_000;

const DEFAULT_DEV_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080"];
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || DEFAULT_DEV_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const TIME_CONTROLS = new Map([
  ["1+0", { initialMs: 60_000, incrementMs: 0 }],
  ["3+0", { initialMs: 3 * 60_000, incrementMs: 0 }],
  ["5+0", { initialMs: 5 * 60_000, incrementMs: 0 }],
  ["10+0", { initialMs: 10 * 60_000, incrementMs: 0 }],
  ["15+10", { initialMs: 15 * 60_000, incrementMs: 10_000 }],
]);

const MSG = {
  AUTHENTICATE: "authenticate",
  AUTHENTICATED: "authenticated",
  FIND_GAME: "find_game",
  CANCEL_FIND: "cancel_find",
  GAME_FOUND: "game_found",
  GAME_STATE: "game_state",
  MAKE_MOVE: "make_move",
  MOVE_MADE: "move_made",
  GAME_UPDATE: "game_update",
  GAME_OVER: "game_over",
  CHAT: "chat",
  CHAT_MSG: "chat_msg",
  ERROR: "error",
  RESIGN: "resign",
  DRAW_OFFER: "draw_offer",
  DRAW_RESPONSE: "draw_response",
  ABORT: "abort",
  REMATCH: "rematch",
  REMATCH_OFFER: "rematch_offer",
  REMATCH_RESPONSE: "rematch_response",
  PING: "ping",
  PONG: "pong",
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("SUPABASE_URL and SUPABASE_ANON_KEY must be set before starting the online server.");
  process.exit(1);
}

if (NODE_ENV === "production" && !process.env.ALLOWED_ORIGINS) {
  console.error("ALLOWED_ORIGINS must be set in production.");
  process.exit(1);
}

const games = new Map();
const players = new Map();
const waitingPlayers = new Map();

class Player {
  constructor({ id, socket, name }) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.rating = 1200;
    this.gameId = null;
    this.queueEntry = null;
    this.disconnectTimer = null;
    this.lastDisconnectedAt = null;
    this.lastChatAt = 0;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  send(payload) {
    if (this.isConnected()) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}

class Game {
  constructor({ id, whitePlayer, blackPlayer, timeControl }) {
    const settings = TIME_CONTROLS.get(timeControl);

    this.id = id;
    this.whitePlayer = whitePlayer;
    this.blackPlayer = blackPlayer;
    this.timeControl = timeControl;
    this.chess = new Chess();
    this.status = "playing";
    this.result = "*";
    this.winner = null;
    this.reason = null;
    this.whiteTime = settings.initialMs;
    this.blackTime = settings.initialMs;
    this.increment = settings.incrementMs;
    this.lastClockUpdateAt = Date.now();
    this.drawOfferFrom = null;
    this.rematchOfferFrom = null;
    this.createdAt = new Date().toISOString();
    this.finishedAt = null;
  }

  get currentTurn() {
    return this.chess.turn();
  }

  getPlayerColor(playerId) {
    if (this.whitePlayer.id === playerId) return "w";
    if (this.blackPlayer.id === playerId) return "b";
    return null;
  }

  getOpponent(playerId) {
    return this.whitePlayer.id === playerId ? this.blackPlayer : this.whitePlayer;
  }

  advanceClock(now = Date.now()) {
    if (this.status !== "playing") {
      return null;
    }

    const elapsed = Math.max(0, now - this.lastClockUpdateAt);
    this.lastClockUpdateAt = now;

    if (this.currentTurn === "w") {
      this.whiteTime = Math.max(0, this.whiteTime - elapsed);
      return this.whiteTime === 0 ? "w" : null;
    }

    this.blackTime = Math.max(0, this.blackTime - elapsed);
    return this.blackTime === 0 ? "b" : null;
  }

  addIncrement(color) {
    if (color === "w") {
      this.whiteTime += this.increment;
    } else {
      this.blackTime += this.increment;
    }
  }
}

function readPort(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

function sanitizeName(value, fallback = "Гравець") {
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(/[\r\n\t]/g, " ").trim().slice(0, 30);
  return normalized || fallback;
}

function createGameId() {
  return randomUUID();
}

function send(socket, payload) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcastGame(game, payload) {
  game.whitePlayer.send(payload);
  game.blackPlayer.send(payload);
}

function gameSnapshot(game, player) {
  return {
    id: game.id,
    white: { id: game.whitePlayer.id, name: game.whitePlayer.name },
    black: { id: game.blackPlayer.id, name: game.blackPlayer.name },
    timeControl: game.timeControl,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
    status: game.status,
    result: game.result,
    reason: game.reason,
    yourColor: player ? game.getPlayerColor(player.id) : null,
  };
}

function sendGameFound(game, player) {
  player.send({ type: MSG.GAME_FOUND, game: gameSnapshot(game, player) });
}

function sendGameState(game, player) {
  player.send({ type: MSG.GAME_STATE, game: gameSnapshot(game, player) });
}

function gameUpdatePayload(game) {
  return {
    type: MSG.GAME_UPDATE,
    gameId: game.id,
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  };
}

function finishGame(game, { result, winner = null, reason }) {
  if (game.status === "finished") {
    return;
  }

  game.status = "finished";
  game.result = result;
  game.winner = winner;
  game.reason = reason;
  game.finishedAt = new Date().toISOString();
  game.drawOfferFrom = null;
  game.rematchOfferFrom = null;

  broadcastGame(game, {
    type: MSG.GAME_OVER,
    gameId: game.id,
    result: game.result,
    winner: game.winner,
    reason: game.reason,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  setTimeout(() => {
    const current = games.get(game.id);
    if (current?.status === "finished") {
      games.delete(game.id);
    }
  }, FINISHED_GAME_TTL_MS).unref();
}

function finishForTimeout(game, timedOutColor) {
  const winner = timedOutColor === "w" ? game.blackPlayer : game.whitePlayer;
  finishGame(game, {
    result: timedOutColor === "w" ? "0-1" : "1-0",
    winner: winner.id,
    reason: "timeout",
  });
}

function finishForPosition(game) {
  if (game.chess.isCheckmate()) {
    const winner = game.currentTurn === "w" ? game.blackPlayer : game.whitePlayer;
    finishGame(game, {
      result: game.currentTurn === "w" ? "0-1" : "1-0",
      winner: winner.id,
      reason: "checkmate",
    });
    return;
  }

  if (game.chess.isDraw()) {
    finishGame(game, {
      result: "1/2-1/2",
      winner: null,
      reason: "draw",
    });
  }
}

function removeFromQueue(player) {
  const entry = player.queueEntry;
  if (!entry) return;

  const queue = waitingPlayers.get(entry.timeControl);
  if (queue) {
    queue.delete(entry);
    if (queue.size === 0) {
      waitingPlayers.delete(entry.timeControl);
    }
  }

  player.queueEntry = null;
}

function getQueueSize(timeControl) {
  return waitingPlayers.get(timeControl)?.size || 0;
}

function colorsForPair(first, second) {
  const firstColor = first.color;
  const secondColor = second.color;

  if (firstColor === "w" && secondColor === "w") return null;
  if (firstColor === "b" && secondColor === "b") return null;
  if (firstColor === "w" || secondColor === "b") return { white: first.player, black: second.player };
  if (firstColor === "b" || secondColor === "w") return { white: second.player, black: first.player };

  return Math.random() < 0.5
    ? { white: first.player, black: second.player }
    : { white: second.player, black: first.player };
}

function createMatchedGame(first, second, timeControl) {
  const colors = colorsForPair(first, second);
  if (!colors) return null;

  const game = new Game({
    id: createGameId(),
    whitePlayer: colors.white,
    blackPlayer: colors.black,
    timeControl,
  });

  games.set(game.id, game);
  colors.white.gameId = game.id;
  colors.black.gameId = game.id;
  sendGameFound(game, colors.white);
  sendGameFound(game, colors.black);
  return game;
}

function enqueuePlayer(player, timeControl, color) {
  if (player.gameId && games.get(player.gameId)?.status === "playing") {
    player.send({ type: MSG.ERROR, message: "Спочатку завершіть поточну партію." });
    return;
  }

  removeFromQueue(player);
  const queue = waitingPlayers.get(timeControl) || new Set();
  const newEntry = { player, timeControl, color };

  for (const waitingEntry of queue) {
    if (waitingEntry.player.id === player.id || !waitingEntry.player.isConnected()) {
      continue;
    }

    const game = createMatchedGame(newEntry, waitingEntry, timeControl);
    if (!game) {
      continue;
    }

    queue.delete(waitingEntry);
    waitingEntry.player.queueEntry = null;
    player.queueEntry = null;
    if (queue.size === 0) waitingPlayers.delete(timeControl);
    return;
  }

  queue.add(newEntry);
  waitingPlayers.set(timeControl, queue);
  player.queueEntry = newEntry;
  player.send({ type: "waiting", queueSize: getQueueSize(timeControl) });
}

function getParticipantGame(player, gameId, { active = true } = {}) {
  if (typeof gameId !== "string" || gameId.length > 64) {
    player.send({ type: MSG.ERROR, message: "Некоректний ідентифікатор партії." });
    return null;
  }

  const game = games.get(gameId);
  if (!game || !game.getPlayerColor(player.id)) {
    player.send({ type: MSG.ERROR, message: "Партію не знайдено." });
    return null;
  }

  if (active && game.status !== "playing") {
    player.send({ type: MSG.ERROR, message: "Партія вже завершена." });
    return null;
  }

  return game;
}

function handleMove(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game) return;

  const timedOutColor = game.advanceClock();
  if (timedOutColor) {
    finishForTimeout(game, timedOutColor);
    return;
  }

  const playerColor = game.getPlayerColor(player.id);
  if (game.currentTurn !== playerColor) {
    player.send({ type: MSG.ERROR, message: "Зараз не ваш хід." });
    return;
  }

  const from = typeof payload.from === "string" ? payload.from.toLowerCase() : "";
  const to = typeof payload.to === "string" ? payload.to.toLowerCase() : "";
  const promotion = ["q", "r", "b", "n"].includes(payload.promotion)
    ? payload.promotion
    : "q";

  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) {
    player.send({ type: MSG.ERROR, message: "Некоректний хід." });
    return;
  }

  let move;
  try {
    move = game.chess.move({ from, to, promotion });
  } catch {
    player.send({ type: MSG.ERROR, message: "Цей хід неможливий у поточній позиції." });
    return;
  }

  if (!move) {
    player.send({ type: MSG.ERROR, message: "Цей хід неможливий у поточній позиції." });
    return;
  }

  game.addIncrement(playerColor);
  game.lastClockUpdateAt = Date.now();
  game.drawOfferFrom = null;

  broadcastGame(game, {
    type: MSG.MOVE_MADE,
    gameId: game.id,
    from: move.from,
    to: move.to,
    promotion: move.promotion || null,
    san: move.san,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  finishForPosition(game);
}

function handleResign(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game) return;

  const opponent = game.getOpponent(player.id);
  finishGame(game, {
    result: game.getPlayerColor(opponent.id) === "w" ? "1-0" : "0-1",
    winner: opponent.id,
    reason: "resignation",
  });
}

function handleDrawOffer(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game) return;

  if (game.drawOfferFrom === player.id) {
    return;
  }

  game.drawOfferFrom = player.id;
  const opponent = game.getOpponent(player.id);
  opponent.send({ type: MSG.DRAW_OFFER, gameId: game.id, from: player.name });
}

function handleDrawResponse(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game || !game.drawOfferFrom || game.drawOfferFrom === player.id) return;

  const accept = payload.accept === true;
  const offerPlayer = game.drawOfferFrom === game.whitePlayer.id ? game.whitePlayer : game.blackPlayer;
  game.drawOfferFrom = null;

  if (accept) {
    finishGame(game, { result: "1/2-1/2", winner: null, reason: "draw_agreement" });
    return;
  }

  offerPlayer.send({ type: MSG.DRAW_RESPONSE, gameId: game.id, accept: false });
}

function handleAbort(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game) return;

  if (game.chess.history().length >= 2) {
    player.send({ type: MSG.ERROR, message: "Скасування доступне лише на початку партії." });
    return;
  }

  finishGame(game, { result: "1/2-1/2", winner: null, reason: "abort" });
}

function handleChat(player, payload) {
  const game = getParticipantGame(player, payload.gameId);
  if (!game || typeof payload.message !== "string") return;

  const message = payload.message.replace(/[\r\n]+/g, " ").trim();
  if (!message || message.length > 240) {
    player.send({ type: MSG.ERROR, message: "Повідомлення має містити від 1 до 240 символів." });
    return;
  }

  const now = Date.now();
  if (now - player.lastChatAt < 900) {
    player.send({ type: MSG.ERROR, message: "Надсилайте повідомлення не частіше одного разу на секунду." });
    return;
  }

  player.lastChatAt = now;
  broadcastGame(game, {
    type: MSG.CHAT_MSG,
    gameId: game.id,
    from: player.name,
    fromId: player.id,
    message,
  });
}

function handleRematch(player, payload) {
  const game = getParticipantGame(player, payload.gameId, { active: false });
  if (!game || game.status !== "finished") return;

  const timeControl = TIME_CONTROLS.has(payload.timeControl) ? payload.timeControl : game.timeControl;
  const opponent = game.getOpponent(player.id);

  if (!game.rematchOfferFrom) {
    game.rematchOfferFrom = player.id;
    opponent.send({ type: MSG.REMATCH_OFFER, gameId: game.id, from: player.name, timeControl });
    player.send({ type: "rematch_requested", gameId: game.id });
    return;
  }

  if (game.rematchOfferFrom === player.id) return;

  const newGame = new Game({
    id: createGameId(),
    whitePlayer: game.blackPlayer,
    blackPlayer: game.whitePlayer,
    timeControl,
  });
  games.set(newGame.id, newGame);
  newGame.whitePlayer.gameId = newGame.id;
  newGame.blackPlayer.gameId = newGame.id;
  sendGameFound(newGame, newGame.whitePlayer);
  sendGameFound(newGame, newGame.blackPlayer);
}

function handleRematchResponse(player, payload) {
  const game = getParticipantGame(player, payload.gameId, { active: false });
  if (!game || game.status !== "finished" || !game.rematchOfferFrom) return;

  if (payload.accept !== true) {
    const offerPlayer = game.rematchOfferFrom === game.whitePlayer.id ? game.whitePlayer : game.blackPlayer;
    game.rematchOfferFrom = null;
    offerPlayer.send({ type: "rematch_declined", gameId: game.id });
    return;
  }

  handleRematch(player, { gameId: game.id, timeControl: payload.timeControl || game.timeControl });
}

function handleAuthenticatedMessage(player, data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.type !== "string") {
    player.send({ type: MSG.ERROR, message: "Некоректне повідомлення." });
    return;
  }

  switch (data.type) {
    case MSG.FIND_GAME: {
      if (!TIME_CONTROLS.has(data.timeControl)) {
        player.send({ type: MSG.ERROR, message: "Цей контроль часу зараз недоступний." });
        return;
      }

      const color = ["w", "b", "random"].includes(data.color) ? data.color : "random";
      enqueuePlayer(player, data.timeControl, color);
      return;
    }
    case MSG.CANCEL_FIND:
      removeFromQueue(player);
      player.send({ type: "cancelled" });
      return;
    case MSG.MAKE_MOVE:
      handleMove(player, data);
      return;
    case MSG.RESIGN:
      handleResign(player, data);
      return;
    case MSG.DRAW_OFFER:
      handleDrawOffer(player, data);
      return;
    case MSG.DRAW_RESPONSE:
      handleDrawResponse(player, data);
      return;
    case MSG.ABORT:
      handleAbort(player, data);
      return;
    case MSG.REMATCH:
      handleRematch(player, data);
      return;
    case MSG.REMATCH_RESPONSE:
      handleRematchResponse(player, data);
      return;
    case MSG.CHAT:
      handleChat(player, data);
      return;
    case MSG.PING:
      player.send({ type: MSG.PONG });
      return;
    default:
      player.send({ type: MSG.ERROR, message: "Невідома дія." });
  }
}

async function verifySupabaseToken(token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 8_000) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const user = await response.json();
    if (!user?.id || typeof user.id !== "string") return null;
    return user;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isOriginAllowed(origin) {
  if (!origin) return NODE_ENV !== "production";
  return allowedOrigins.has(origin);
}

function scheduleDisconnectForfeit(player) {
  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
  }

  const game = player.gameId ? games.get(player.gameId) : null;
  if (!game || game.status !== "playing") return;

  player.disconnectTimer = setTimeout(() => {
    if (player.isConnected() || game.status !== "playing") return;
    const opponent = game.getOpponent(player.id);
    finishGame(game, {
      result: game.getPlayerColor(opponent.id) === "w" ? "1-0" : "0-1",
      winner: opponent.id,
      reason: "disconnect",
    });
  }, RECONNECT_GRACE_MS);
  player.disconnectTimer.unref();
}

function attachPlayerSocket(player, socket) {
  if (player.socket && player.socket !== socket && player.socket.readyState === WebSocket.OPEN) {
    player.socket.close(4001, "Signed in from another device");
  }

  if (player.disconnectTimer) {
    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
  }

  player.socket = socket;
  player.lastDisconnectedAt = null;
}

const wss = new WebSocketServer({ port: PORT, maxPayload: MAX_MESSAGE_BYTES });

wss.on("connection", (socket, request) => {
  if (!isOriginAllowed(request.headers.origin)) {
    socket.close(1008, "Origin is not allowed");
    return;
  }

  let player = null;
  let authenticationInProgress = false;
  const authTimer = setTimeout(() => {
    if (!player) socket.close(1008, "Authentication timed out");
  }, AUTH_TIMEOUT_MS);
  authTimer.unref();

  send(socket, { type: "connected", authenticationRequired: true });

  socket.on("message", async (raw, isBinary) => {
    if (isBinary || raw.length > MAX_MESSAGE_BYTES) {
      send(socket, { type: MSG.ERROR, message: "Некоректне повідомлення." });
      socket.close(1008, "Invalid payload");
      return;
    }

    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      send(socket, { type: MSG.ERROR, message: "Некоректний формат повідомлення." });
      return;
    }

    if (!player) {
      if (data?.type !== MSG.AUTHENTICATE || authenticationInProgress) {
        send(socket, { type: MSG.ERROR, message: "Спочатку увійдіть у свій акаунт." });
        return;
      }

      authenticationInProgress = true;
      const user = await verifySupabaseToken(data.token);
      authenticationInProgress = false;

      if (!user) {
        send(socket, { type: MSG.ERROR, message: "Не вдалося підтвердити акаунт." });
        socket.close(1008, "Authentication failed");
        return;
      }

      const existing = players.get(user.id);
      if (existing) {
        player = existing;
        player.name = sanitizeName(
          user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split("@")[0],
          player.name,
        );
        attachPlayerSocket(player, socket);
      } else {
        player = new Player({
          id: user.id,
          socket,
          name: sanitizeName(user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split("@")[0]),
        });
        players.set(player.id, player);
      }

      clearTimeout(authTimer);
      player.send({ type: MSG.AUTHENTICATED, playerId: player.id, name: player.name });

      const activeGame = player.gameId ? games.get(player.gameId) : null;
      if (activeGame && activeGame.status === "playing") {
        sendGameState(activeGame, player);
      }
      return;
    }

    handleAuthenticatedMessage(player, data);
  });

  socket.on("close", () => {
    clearTimeout(authTimer);
    if (!player || player.socket !== socket) return;

    player.socket = null;
    player.lastDisconnectedAt = Date.now();
    removeFromQueue(player);
    scheduleDisconnectForfeit(player);
  });

  socket.on("error", () => {
    // The close handler performs cleanup. Avoid logging tokens or message bodies.
  });
});

setInterval(() => {
  for (const game of games.values()) {
    if (game.status !== "playing") continue;
    const timedOutColor = game.advanceClock();
    if (timedOutColor) {
      finishForTimeout(game, timedOutColor);
      continue;
    }
    broadcastGame(game, gameUpdatePayload(game));
  }
}, 1_000).unref();

setInterval(() => {
  for (const [timeControl, queue] of waitingPlayers.entries()) {
    for (const entry of [...queue]) {
      if (!entry.player.isConnected()) {
        queue.delete(entry);
        entry.player.queueEntry = null;
      }
    }

    if (queue.size === 0) {
      waitingPlayers.delete(timeControl);
      continue;
    }

    for (const entry of queue) {
      entry.player.send({ type: "queue_update", queueSize: queue.size });
    }
  }

  const now = Date.now();
  for (const [playerId, player] of players.entries()) {
    if (!player.isConnected() && !player.gameId && player.lastDisconnectedAt && now - player.lastDisconnectedAt > PLAYER_TTL_MS) {
      players.delete(playerId);
    }
  }
}, 2_000).unref();

console.log(`Chess of Odesa online server listening on port ${PORT}.`);
