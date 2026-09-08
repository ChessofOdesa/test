import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { Chess } from "chess.js";
import { parseTimeControl, LEGACY_RATED_TIMES, colorsForPair, entriesCompatible, validateMatchOptions } from "./time-control.js";
import { positionResult, timeoutResult } from "./game-rules.js";
import { createChallengeService } from "./challenges.js";
import { createSupabasePersistence } from "./supabase-persistence.js";
import {
  LichessEvaluationError,
  createLichessEvaluationService,
} from "./lichess-evaluation.js";

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
const SUPABASE_ADMIN_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_MESSAGE_BYTES = 8 * 1024;
const AUTH_TIMEOUT_MS = 10_000;
const RECONNECT_GRACE_MS = 30_000;
const FINISHED_GAME_TTL_MS = 5 * 60_000;
const PLAYER_TTL_MS = 15 * 60_000;
const ACTIVE_GAME_SYNC_MS = 5_000;
const EVALUATION_RATE_WINDOW_MS = 60_000;
const EVALUATION_RATE_LIMIT = 24;

const DEFAULT_DEV_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080"];
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || DEFAULT_DEV_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);


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
  GAME_SAVED: "game_saved",
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
const persistence = createSupabasePersistence({
  url: SUPABASE_URL,
  secretKey: SUPABASE_ADMIN_KEY,
});
const evaluationService = createLichessEvaluationService({ persistence });
const evaluationRateLimits = new Map();
let flexibleRatings = false;
let gameReports = false;
async function refreshCapabilities() { [flexibleRatings, gameReports] = await Promise.all([persistence.supportsFlexibleRatings(), persistence.supportsGameReports()]); }
await refreshCapabilities();
setInterval(() => { void refreshCapabilities(); }, 60_000).unref();
function validateOptions(data) { return validateMatchOptions(data, { persistenceEnabled: persistence.enabled, flexibleRatings }); }
function capabilities() {
  return { protocol: 2, gameRoom: true, reports: gameReports, customTime: true, challenges: true, casual: !persistence.enabled || flexibleRatings, ratingRange: true, rated: persistence.enabled, ratedTimeControls: flexibleRatings ? "all" : LEGACY_RATED_TIMES, tournaments: false, chess960: false };
}
function lobbyStats() { return { players: [...players.values()].filter(p => p.isConnected()).length, games: [...games.values()].filter(g => g.status === "playing").length }; }
const challenges = createChallengeService({ players, games, validate: validateOptions, startGame: createMatchedGame, removeFromQueue });

if (!persistence.enabled) {
  console.warn(
    "SUPABASE_SECRET_KEY is not set. Online games remain playable, but persistence and ratings are disabled.",
  );
}

class Player {
  constructor({ id, socket, name, ratings }) {
    this.id = id;
    this.socket = socket;
    this.name = name;
    this.ratings = {
      bullet: normalizeRating(ratings?.bullet),
      blitz: normalizeRating(ratings?.blitz),
      rapid: normalizeRating(ratings?.rapid),
    };
    this.gameId = null;
    this.queueEntry = null;
    this.disconnectTimer = null;
    this.lastDisconnectedAt = null;
    this.lastChatAt = 0;
    this.lastDrawAt = 0;
    this.lastReportAt = 0;
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  send(payload) {
    if (this.isConnected()) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  ratingFor(timeControl) {
    return this.ratings[ratingCategoryFor(timeControl)];
  }
}

class Game {
  constructor({ id, whitePlayer, blackPlayer, timeControl, rated = true, restoredState = null }) {
    const settings = parseTimeControl(timeControl);

    this.id = id;
    this.whitePlayer = whitePlayer;
    this.blackPlayer = blackPlayer;
    this.timeControl = timeControl;
    this.chess = restoreChess(restoredState);
    this.status = restoredState?.status === "finished" ? "finished" : "playing";
    this.result = typeof restoredState?.result === "string" ? restoredState.result : "*";
    this.winner = null;
    this.reason = typeof restoredState?.termination === "string" ? restoredState.termination : null;
    this.whiteTime = normalizeClock(restoredState?.white_time_ms, settings.initialMs);
    this.blackTime = normalizeClock(restoredState?.black_time_ms, settings.initialMs);
    this.increment = settings.incrementMs;
    this.lastClockUpdateAt = Date.now();
    this.drawOfferFrom = null;
    this.rematchOfferFrom = null;
    this.createdAt = restoredState?.created_at || new Date().toISOString();
    this.finishedAt = restoredState?.status === "finished" ? restoredState.updated_at : null;
    this.chat = [];
    this.acceptedMoves = new Set();
    this.rated = restoredState ? restoredState.rated !== false : rated && persistence.enabled;
    this.saved = Boolean(restoredState);
    this.persistenceStatus = restoredState
      ? "saved"
      : persistence.enabled
        ? "pending"
        : "disabled";
    this.whiteRatingBefore = normalizeRating(
      restoredState?.white_rating_before ?? whitePlayer.ratingFor(timeControl),
    );
    this.blackRatingBefore = normalizeRating(
      restoredState?.black_rating_before ?? blackPlayer.ratingFor(timeControl),
    );
    this.whiteRatingChange = Number.isInteger(restoredState?.white_rating_change)
      ? restoredState.white_rating_change
      : null;
    this.blackRatingChange = Number.isInteger(restoredState?.black_rating_change)
      ? restoredState.black_rating_change
      : null;
    this.persistenceReady = restoredState ? Promise.resolve(true) : Promise.resolve(false);
    this.persistenceQueue = Promise.resolve();
    this.lastPersistedAt = Date.now();
    this.finalizationPromise = null;
    this.chess.header("White", whitePlayer.name, "Black", blackPlayer.name, "Site", "Chess of Odesa", "TimeControl", `${settings.minutes * 60}+${settings.increment}`, "Result", this.result);

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

function normalizeRating(value) {
  return Number.isInteger(value) && value >= 100 ? value : 1500;
}

function normalizeClock(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

function ratingCategoryFor(timeControl) {
  const category = parseTimeControl(timeControl)?.category;
  return category === "classical" ? "rapid" : category || "rapid";
}

function restoreChess(state) {
  if (!state) return new Chess();

  if (typeof state.pgn === "string" && state.pgn.trim()) {
    try {
      const chess = new Chess();
      chess.loadPgn(state.pgn);
      return chess;
    } catch {
      // Fall through to the persisted FEN.
    }
  }

  if (typeof state.fen === "string" && state.fen.trim()) {
    try {
      const chess = new Chess();
      chess.load(state.fen);
      return chess;
    } catch {
      // A corrupt row must not crash the WebSocket process.
    }
  }

  return new Chess();
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

function broadcastGameState(game) {
  sendGameState(game, game.whitePlayer);
  sendGameState(game, game.blackPlayer);
}

function gameSnapshot(game, player) {
  return {
    id: game.id,
    white: {
      id: game.whitePlayer.id,
      name: game.whitePlayer.name,
      connected: game.whitePlayer.isConnected(),
      rating: game.whiteRatingBefore + (game.whiteRatingChange || 0),
    },
    black: {
      id: game.blackPlayer.id,
      name: game.blackPlayer.name,
      connected: game.blackPlayer.isConnected(),
      rating: game.blackRatingBefore + (game.blackRatingChange || 0),
    },
    createdAt: game.createdAt,
    rematchAvailable: games.has(game.id) && game.status === "finished" && game.whitePlayer.isConnected() && game.blackPlayer.isConnected() && ![game.whitePlayer, game.blackPlayer].some(p => games.get(p.gameId)?.status === "playing"),
    timeControl: game.timeControl,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    clockAt: game.lastClockUpdateAt,
    whiteConnected: game.whitePlayer.isConnected(),
    blackConnected: game.blackPlayer.isConnected(),
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
    status: game.status,
    result: game.result,
    reason: game.reason,
    rated: game.rated,
    saved: game.saved,
    persistenceStatus: game.persistenceStatus,
    whiteRatingBefore: game.whiteRatingBefore,
    blackRatingBefore: game.blackRatingBefore,
    whiteRatingChange: game.whiteRatingChange,
    blackRatingChange: game.blackRatingChange,
    yourColor: player ? game.getPlayerColor(player.id) : null,
  };
}

function sendGameFound(game, player) {
  player.send({ type: MSG.GAME_FOUND, game: gameSnapshot(game, player) });
}

function sendGameState(game, player) {
  player.send({ type: MSG.GAME_STATE, game: gameSnapshot(game, player) });
  player.send({ type: "chat_history", gameId: game.id, messages: game.chat });
  if (game.drawOfferFrom && game.drawOfferFrom !== player.id) player.send({ type: MSG.DRAW_OFFER, gameId: game.id, from: game.getOpponent(player.id).name });
  if (game.rematchOfferFrom && game.rematchOfferFrom !== player.id) player.send({ type: MSG.REMATCH_OFFER, gameId: game.id, from: game.getOpponent(player.id).name, timeControl: game.timeControl });
}

function gameUpdatePayload(game) {
  return {
    type: MSG.GAME_UPDATE,
    gameId: game.id,
    clockAt: game.lastClockUpdateAt,
    whiteConnected: game.whitePlayer.isConnected(),
    blackConnected: game.blackPlayer.isConnected(),
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  };
}

function activeGameRecord(game) {
  return {
    id: game.id,
    white_player_id: game.whitePlayer.id,
    black_player_id: game.blackPlayer.id,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    status: game.status,
    result: game.result,
    time_control: game.timeControl,
    white_time_ms: Math.round(game.whiteTime),
    black_time_ms: Math.round(game.blackTime),
    last_move_at: new Date().toISOString(),
    created_at: game.createdAt,
    updated_at: new Date().toISOString(),
    rated: game.rated,
    white_rating_before: game.whiteRatingBefore,
    black_rating_before: game.blackRatingBefore,
    white_rating_change: game.whiteRatingChange,
    black_rating_change: game.blackRatingChange,
    moves_count: game.chess.history().length,
  };
}

function initializeGamePersistence(game) {
  if (!persistence.enabled) {
    game.rated = false;
    game.saved = false;
    game.persistenceStatus = "disabled";
    game.persistenceReady = Promise.resolve(false);
    return;
  }

  game.persistenceReady = persistence
    .createGame(activeGameRecord(game))
    .then(() => {
      game.saved = game.status === "playing";
      game.persistenceStatus = game.status === "playing" ? "saved" : "pending";
      broadcastGameState(game);
      return true;
    })
    .catch((error) => {
      game.rated = false;
      game.saved = false;
      game.persistenceStatus = "failed";
      persistence.warn("create-game", error);
      broadcastGameState(game);
      return false;
    });
}

function queueActiveGamePersistence(game) {
  if (!persistence.enabled || game.status !== "playing") return;

  const snapshot = activeGameRecord(game);
  game.lastPersistedAt = Date.now();
  game.persistenceQueue = game.persistenceQueue
    .then(async () => {
      if (!(await game.persistenceReady)) return;
      await persistence.updateGame(game.id, snapshot);
      game.saved = true;
      game.persistenceStatus = "saved";
    })
    .catch((error) => {
      game.saved = false;
      game.persistenceStatus = "failed";
      persistence.warn("update-game", error);
    });
}

function sendSavedGameState(game) {
  game.whitePlayer.send({ type: MSG.GAME_SAVED, game: gameSnapshot(game, game.whitePlayer) });
  game.blackPlayer.send({ type: MSG.GAME_SAVED, game: gameSnapshot(game, game.blackPlayer) });
}

async function finalizePersistedGame(game) {
  const ready = await game.persistenceReady;
  await game.persistenceQueue;

  if (!ready) {
    game.rated = false;
    game.saved = false;
    game.persistenceStatus = persistence.enabled ? "failed" : "disabled";
    sendSavedGameState(game);
    return;
  }

  const payload = {
    p_game_id: game.id,
    p_fen: game.chess.fen(),
    p_pgn: game.chess.pgn(),
    p_result: game.result,
    p_reason: game.reason,
    p_white_time_ms: Math.round(game.whiteTime),
    p_black_time_ms: Math.round(game.blackTime),
    p_moves_count: game.chess.history().length,
  };

  try {
    const savedResult = await persistence.finalizeGame(payload);
    game.saved = Boolean(savedResult?.saved ?? true);
    game.persistenceStatus = game.saved ? "saved" : "failed";
    game.rated = savedResult?.rated === true;
    game.whiteRatingChange = Number.isInteger(savedResult?.white_rating_change)
      ? savedResult.white_rating_change
      : 0;
    game.blackRatingChange = Number.isInteger(savedResult?.black_rating_change)
      ? savedResult.black_rating_change
      : 0;

    const ratingCategory = ratingCategoryFor(game.timeControl);
    if (Number.isInteger(savedResult?.white_rating_after)) {
      game.whitePlayer.ratings[ratingCategory] = savedResult.white_rating_after;
    }
    if (Number.isInteger(savedResult?.black_rating_after)) {
      game.blackPlayer.ratings[ratingCategory] = savedResult.black_rating_after;
    }
  } catch (error) {
    game.saved = false;
    game.persistenceStatus = "failed";
    game.rated = false;
    game.whiteRatingChange = 0;
    game.blackRatingChange = 0;
    persistence.warn("finish-game", error);
  }

  sendSavedGameState(game);
}

function finishGame(game, { result, winner = null, reason }) {
  if (game.status === "finished") {
    return;
  }

  game.status = "finished";
  game.result = result;
  game.winner = winner;
  game.reason = reason;
  game.chess.header("Result", result, "Termination", reason);
  game.finishedAt = new Date().toISOString();
  game.drawOfferFrom = null;
  game.rematchOfferFrom = null;
  game.saved = false;
  game.persistenceStatus = persistence.enabled ? "pending" : "disabled";

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
    rated: game.rated,
    saved: game.saved,
    persistenceStatus: game.persistenceStatus,
  });

  if (!game.finalizationPromise) {
    game.finalizationPromise = finalizePersistedGame(game);
  }

  setTimeout(() => {
    const current = games.get(game.id);
    if (current?.status === "finished") {
      games.delete(game.id);
      if (game.whitePlayer.gameId === game.id) game.whitePlayer.gameId = null;
      if (game.blackPlayer.gameId === game.id) game.blackPlayer.gameId = null;
    }
  }, FINISHED_GAME_TTL_MS).unref();
}

function finishForTimeout(game, timedOutColor) {
  const ending = timeoutResult(game.chess, timedOutColor);
  const winner = timedOutColor === "w" ? game.blackPlayer : game.whitePlayer;
  finishGame(game, { ...ending, winner: ending.result === "1/2-1/2" ? null : winner.id });
}

function finishForPosition(game) {
  const ending = positionResult(game.chess);
  if (!ending) return;
  const winner = ending.result === "1-0" ? game.whitePlayer.id : ending.result === "0-1" ? game.blackPlayer.id : null;
  finishGame(game, { ...ending, winner });
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

function createMatchedGame(first, second, timeControl) {
  const colors = colorsForPair(first, second);
  if (!colors) return null;

  const game = new Game({
    id: createGameId(),
    whitePlayer: colors.white,
    blackPlayer: colors.black,
    timeControl,
    rated: first.rated,
  });

  games.set(game.id, game);
  colors.white.gameId = game.id;
  colors.black.gameId = game.id;
  initializeGamePersistence(game);
  sendGameFound(game, colors.white);
  sendGameFound(game, colors.black);
  return game;
}

function enqueuePlayer(player, options) {
  const { timeControl } = options;
  if (player.gameId && games.get(player.gameId)?.status === "playing") {
    player.send({ type: MSG.ERROR, message: "Спочатку завершіть поточну партію." });
    return;
  }

  removeFromQueue(player);
  const queue = waitingPlayers.get(timeControl) || new Set();
  const newEntry = { player, ...options };
  challenges.cancelFor(player);

  for (const waitingEntry of queue) {
    if (!entriesCompatible(newEntry, waitingEntry) || !waitingEntry.player.isConnected()) {
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
  player.send({ type: "waiting", options, queueSize: getQueueSize(timeControl) });
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

  if (active) { const timedOut = game.advanceClock(); if (timedOut) { finishForTimeout(game, timedOut); return null; } }
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

  if (typeof payload.moveId === "string" && game.acceptedMoves.has(`${player.id}:${payload.moveId}`)) { sendGameState(game, player); return; }
  if (payload.expectedPly !== undefined && payload.expectedPly !== game.chess.history().length) { player.send({ type: MSG.ERROR, action: "make_move", message: "Позицію оновлено. Зробіть хід ще раз." }); sendGameState(game, player); return; }
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

  if (typeof payload.moveId === "string" && payload.moveId.length <= 80) game.acceptedMoves.add(`${player.id}:${payload.moveId}`);
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
    clockAt: game.lastClockUpdateAt,
    whiteConnected: game.whitePlayer.isConnected(),
    blackConnected: game.blackPlayer.isConnected(),
    currentTurn: game.currentTurn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  queueActiveGamePersistence(game);

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

  if (game.drawOfferFrom === player.id) return;
  if (Date.now() - player.lastDrawAt < 15000) { player.send({ type: MSG.ERROR, action: "draw_offer", message: "Зачекайте перед новою пропозицією нічиєї." }); return; }
  if (game.drawOfferFrom) return;
  player.lastDrawAt = Date.now();

  game.drawOfferFrom = player.id;
  player.send({ type: "draw_requested", gameId: game.id });
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
  const game = getParticipantGame(player, payload.gameId, { active: false });
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
  const chatMessage = { id: randomUUID(), type: MSG.CHAT_MSG, gameId: game.id, from: player.name, fromId: player.id, message, timestamp: now };
  game.chat.push(chatMessage);
  game.chat = game.chat.slice(-100);
  broadcastGame(game, chatMessage);
}

function handleRematch(player, payload) {
  const game = getParticipantGame(player, payload.gameId, { active: false });
  if (!game || game.status !== "finished") return;

  const timeControl = game.timeControl;
  if (!game.getOpponent(player.id).isConnected()) throw new Error("Суперник уже від’єднався.");
  if ([game.whitePlayer, game.blackPlayer].some(p => games.get(p.gameId)?.status === "playing")) throw new Error("Один із гравців уже має активну партію.");
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
    rated: game.rated,
  });
  game.rematchOfferFrom = null;
  removeFromQueue(game.whitePlayer);
  removeFromQueue(game.blackPlayer);
  challenges.cancelFor(game.whitePlayer);
  challenges.cancelFor(game.blackPlayer);
  games.set(newGame.id, newGame);
  newGame.whitePlayer.gameId = newGame.id;
  newGame.blackPlayer.gameId = newGame.id;
  initializeGamePersistence(newGame);
  sendGameFound(newGame, newGame.whitePlayer);
  sendGameFound(newGame, newGame.blackPlayer);
}

function handleRematchResponse(player, payload) {
  const game = getParticipantGame(player, payload.gameId, { active: false });
  if (!game || game.status !== "finished" || !game.rematchOfferFrom || game.rematchOfferFrom === player.id) return;

  if (payload.accept !== true) {
    const offerPlayer = game.rematchOfferFrom === game.whitePlayer.id ? game.whitePlayer : game.blackPlayer;
    game.rematchOfferFrom = null;
    offerPlayer.send({ type: "rematch_declined", gameId: game.id });
    return;
  }

  handleRematch(player, { gameId: game.id, timeControl: payload.timeControl || game.timeControl });
}

async function handleGetGame(player, data) {
  const id = data.gameId;
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/i.test(id)) { player.send({ type: "game_load_error", gameId: id, code: "not_found" }); return; }
  let game = games.get(id);
  if (game && !game.getPlayerColor(player.id)) { player.send({ type: "game_load_error", gameId: id, code: "not_found" }); return; }
  if (!game) {
    try {
      const row = await persistence.findGame(player.id, id);
      if (!row || row.status !== "finished") { player.send({ type: "game_load_error", gameId: id, code: "not_found" }); return; }
      const profiles = await persistence.loadProfiles([row.white_player_id, row.black_player_id]);
      const seat = (id, name) => players.get(id) || new Player({ id, socket: null, name: profiles.get(id)?.name || name, ratings: profiles.get(id)?.ratings });
      game = new Game({ id, whitePlayer: seat(row.white_player_id, "Білі"), blackPlayer: seat(row.black_player_id, "Чорні"), timeControl: row.time_control, restoredState: row });
    } catch (error) { persistence.warn("read-game", error); player.send({ type: "game_load_error", gameId: id, code: "unavailable" }); return; }
  }
  player.send({ type: "game_loaded", game: gameSnapshot(game, player) });
}

async function handleGameReport(player, data) {
  if (!gameReports) throw new Error("Скарги тимчасово недоступні.");
  const game = getParticipantGame(player, data.gameId, { active: false });
  if (!game) return;
  if (!["abuse", "spam", "fair_play", "other"].includes(data.reason)) throw new Error("Оберіть причину скарги.");
  if (Date.now() - player.lastReportAt < 30000) throw new Error("Скаргу вже надіслано. Зачекайте перед наступною.");
  player.lastReportAt = Date.now();
  const note = typeof data.note === "string" ? data.note.trim().slice(0,500) : "";
  await game.persistenceReady;
  await persistence.reportGame({ game_id: game.id, reporter_id: player.id, reported_id: game.getOpponent(player.id).id, reason: data.reason, note, chat_snapshot: game.chat.slice(-50) });
  player.send({ type: "report_saved", gameId: game.id });
}

async function handleAuthenticatedMessage(player, data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.type !== "string") {
    player.send({ type: MSG.ERROR, message: "Некоректне повідомлення." });
    return;
  }

  switch (data.type) {
    case "get_game":
      await handleGetGame(player, data); return;
    case "report_game":
      await handleGameReport(player, data); return;
    case MSG.FIND_GAME: {
      enqueuePlayer(player, validateOptions(data));
      return;
    }
    case "search_players":
    case "create_challenge":
    case "get_challenge":
    case "accept_challenge":
    case "decline_challenge":
    case "cancel_challenge":
      challenges.handle(player, data);
      return;
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

function sendHttpJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(JSON.stringify(payload));
}

function corsHeaders(origin) {
  return origin && isOriginAllowed(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : {};
}

function evaluationClientKey(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim().slice(0, 80);
  }
  return request.socket.remoteAddress || "unknown";
}

function consumeEvaluationRateLimit(request) {
  const key = evaluationClientKey(request);
  const now = Date.now();
  const current = evaluationRateLimits.get(key);

  if (!current || now - current.startedAt >= EVALUATION_RATE_WINDOW_MS) {
    evaluationRateLimits.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (current.count >= EVALUATION_RATE_LIMIT) return false;
  current.count += 1;
  return true;
}

async function handleHttpRequest(request, response) {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const origin = typeof request.headers.origin === "string" ? request.headers.origin : "";

  if (request.method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/health")) {
    sendHttpJson(response, 200, {
      ok: true,
      service: "chess-of-odesa-server",
      evaluationCache: persistence.enabled ? "supabase" : "memory",
      playProtocol: 2,
    });
    return;
  }

  if (requestUrl.pathname === "/api/play") {
    if (!isOriginAllowed(origin)) { sendHttpJson(response, 403, { error: "Origin is not allowed." }); return; }
    if (request.method === "OPTIONS") { response.writeHead(204, corsHeaders(origin)); response.end(); return; }
    if (request.method !== "GET") { sendHttpJson(response, 405, { error: "Method not allowed." }, corsHeaders(origin)); return; }
    sendHttpJson(response, 200, { capabilities: capabilities(), stats: lobbyStats() }, { ...corsHeaders(origin), "Cache-Control": "no-store" });
    return;
  }
  if (requestUrl.pathname !== "/api/evaluation") {
    sendHttpJson(response, 404, { error: "Not found." });
    return;
  }

  if (!isOriginAllowed(origin)) {
    sendHttpJson(response, 403, { error: "Origin is not allowed." });
    return;
  }

  const headers = corsHeaders(origin);
  if (request.method === "OPTIONS") {
    response.writeHead(204, headers);
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendHttpJson(response, 405, { error: "Method not allowed." }, {
      ...headers,
      Allow: "GET, OPTIONS",
    });
    return;
  }

  if (!consumeEvaluationRateLimit(request)) {
    sendHttpJson(response, 429, { error: "Too many evaluation requests. Try again in one minute." }, {
      ...headers,
      "Retry-After": "60",
    });
    return;
  }

  try {
    const evaluation = await evaluationService.getEvaluation(
      requestUrl.searchParams.get("fen") || "",
      requestUrl.searchParams.get("multiPv") || "1",
    );

    if (!evaluation) {
      sendHttpJson(response, 404, { error: "No cloud evaluation is available for this position." }, headers);
      return;
    }

    sendHttpJson(response, 200, evaluation, {
      ...headers,
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    });
  } catch (error) {
    const statusCode = error instanceof LichessEvaluationError ? error.statusCode : 503;
    const publicMessage = statusCode === 400
      ? "Invalid chess position."
      : "Cloud evaluation is temporarily unavailable.";
    if (statusCode !== 400) {
      console.warn(`[lichess-evaluation] ${error instanceof Error ? error.message : "Unknown error."}`);
    }
    sendHttpJson(response, statusCode, { error: publicMessage }, headers);
  }
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

function applyProfileToPlayer(player, profile) {
  if (!profile) return;
  player.name = sanitizeName(profile.name, player.name);
  player.ratings = {
    bullet: normalizeRating(profile.ratings?.bullet),
    blitz: normalizeRating(profile.ratings?.blitz),
    rapid: normalizeRating(profile.ratings?.rapid),
  };
}

async function restoreActiveGameForPlayer(player) {
  if (!persistence.enabled) return null;

  try {
    const row = await persistence.findActiveGame(player.id);
    if (!row || typeof row.id !== "string") return null;

    const existingGame = games.get(row.id);
    if (existingGame?.getPlayerColor(player.id)) {
      player.gameId = existingGame.id;
      return existingGame;
    }

    if (
      typeof row.white_player_id !== "string"
      || typeof row.black_player_id !== "string"
      || row.white_player_id === row.black_player_id
      || !parseTimeControl(row.time_control)
    ) {
      return null;
    }

    const profiles = await persistence.loadProfiles([
      row.white_player_id,
      row.black_player_id,
    ]);

    const getOrCreatePlayer = (id, fallbackName) => {
      const profile = profiles.get(id);
      const existing = players.get(id);
      if (existing) {
        applyProfileToPlayer(existing, profile);
        return existing;
      }

      const restoredPlayer = new Player({
        id,
        socket: null,
        name: profile?.name || fallbackName,
        ratings: profile?.ratings,
      });
      players.set(id, restoredPlayer);
      return restoredPlayer;
    };

    const whitePlayer = getOrCreatePlayer(row.white_player_id, "Білі");
    const blackPlayer = getOrCreatePlayer(row.black_player_id, "Чорні");
    const restoredGame = new Game({
      id: row.id,
      whitePlayer,
      blackPlayer,
      timeControl: row.time_control,
      restoredState: row,
    });

    const gameCreatedDuringRestore = games.get(row.id);
    if (gameCreatedDuringRestore) {
      player.gameId = gameCreatedDuringRestore.id;
      return gameCreatedDuringRestore;
    }

    games.set(restoredGame.id, restoredGame);
    whitePlayer.gameId = restoredGame.id;
    blackPlayer.gameId = restoredGame.id;
    const disconnectedOpponent = restoredGame.getOpponent(player.id);
    if (!disconnectedOpponent.isConnected()) {
      disconnectedOpponent.lastDisconnectedAt = Date.now();
      scheduleDisconnectForfeit(disconnectedOpponent);
    }
    return restoredGame;
  } catch (error) {
    persistence.warn("restore-game", error);
    return null;
  }
}

const httpServer = createServer((request, response) => {
  void handleHttpRequest(request, response).catch((error) => {
    console.warn(`[http] ${error instanceof Error ? error.message : "Unknown request error."}`);
    if (!response.headersSent) {
      sendHttpJson(response, 500, { error: "Internal server error." });
    } else if (!response.writableEnded) {
      response.end();
    }
  });
});
const wss = new WebSocketServer({ server: httpServer, maxPayload: MAX_MESSAGE_BYTES });

wss.on("connection", (socket, request) => {
  if (!isOriginAllowed(request.headers.origin)) {
    socket.close(1008, "Origin is not allowed");
    return;
  }

  let player = null;
  let authenticationInProgress = false;
  let sessionReady = false;
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

      clearTimeout(authTimer);
      const metadataName = sanitizeName(
        user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split("@")[0],
      );
      let profile = null;
      if (persistence.enabled) {
        try {
          profile = await persistence.loadProfile(user.id, metadataName);
        } catch (error) {
          persistence.warn("load-profile", error);
        }
      }

      if (socket.readyState !== WebSocket.OPEN) return;
      const existing = players.get(user.id);
      if (existing) {
        player = existing;
        player.name = sanitizeName(profile?.name || metadataName, player.name);
        applyProfileToPlayer(player, profile);
        attachPlayerSocket(player, socket);
      } else {
        player = new Player({
          id: user.id,
          socket,
          name: profile?.name || metadataName,
          ratings: profile?.ratings,
        });
        players.set(player.id, player);
      }

      let activeGame = player.gameId ? games.get(player.gameId) : null;
      if (!activeGame || activeGame.status !== "playing") {
        activeGame = await restoreActiveGameForPlayer(player);
      }
      if (socket.readyState !== WebSocket.OPEN) return;
      sessionReady = true;
      player.send({ type: MSG.AUTHENTICATED, playerId: player.id, name: player.name, capabilities: capabilities(), hasActiveGame: activeGame?.status === "playing", ratings: player.ratings });
      if (activeGame && activeGame.status === "playing") broadcastGameState(activeGame);
      challenges.restore(player);
      return;
    }

    if (player.socket !== socket || !sessionReady) return;
    try { await handleAuthenticatedMessage(player, data); }
    catch (error) { player.send({ type: MSG.ERROR, action: data.type, message: error instanceof Error ? error.message : "Не вдалося виконати дію." }); }
  });

  socket.on("close", () => {
    clearTimeout(authTimer);
    if (!player || player.socket !== socket) return;

    player.socket = null;
    player.lastDisconnectedAt = Date.now();
    const currentGame = player.gameId ? games.get(player.gameId) : null;
    if (currentGame) broadcastGameState(currentGame);
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
    if (Date.now() - game.lastPersistedAt >= ACTIVE_GAME_SYNC_MS) {
      queueActiveGamePersistence(game);
    }
  }
}, 1_000).unref();

setInterval(() => {
  challenges.prune();
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

httpServer.listen(PORT, () => {
  console.log(`Chess of Odesa online server listening on port ${PORT}.`);
});
