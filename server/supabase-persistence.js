const REQUEST_TIMEOUT_MS = 8_000;

const PROFILE_SELECT = [
  "user_id",
  "display_name",
  "rating_bullet",
  "rating_blitz",
  "rating_rapid",
].join(",");

const ACTIVE_GAME_SELECT = [
  "id",
  "white_player_id",
  "black_player_id",
  "fen",
  "pgn",
  "status",
  "result",
  "time_control",
  "white_time_ms",
  "black_time_ms",
  "last_move_at",
  "created_at",
  "updated_at",
  "rated",
  "termination",
  "white_rating_before",
  "black_rating_before",
  "white_rating_change",
  "black_rating_change",
  "moves_count",
].join(",");

function normalizeBaseUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function normalizeRating(value) {
  return Number.isInteger(value) ? value : 1500;
}

function normalizeProfile(row, fallbackName = "Гравець") {
  if (!row || typeof row !== "object" || typeof row.user_id !== "string") {
    return null;
  }

  return {
    id: row.user_id,
    name:
      typeof row.display_name === "string" && row.display_name.trim()
        ? row.display_name.trim().slice(0, 30)
        : fallbackName,
    ratings: {
      bullet: normalizeRating(row.rating_bullet),
      blitz: normalizeRating(row.rating_blitz),
      rapid: normalizeRating(row.rating_rapid),
    },
  };
}

export function createSupabasePersistence({ url, serviceRoleKey, logger = console }) {
  const baseUrl = normalizeBaseUrl(url);
  const key = typeof serviceRoleKey === "string" ? serviceRoleKey.trim() : "";
  const enabled = Boolean(baseUrl && key);

  async function request(path, { method = "GET", body, prefer } = {}) {
    if (!enabled) {
      throw new Error("Supabase persistence is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
        method,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          ...(prefer ? { Prefer: prefer } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Supabase request failed with status ${response.status}.`);
      }

      if (response.status === 204) return null;
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadProfiles(userIds) {
    const ids = [...new Set(userIds.filter((value) => typeof value === "string" && value))];
    if (!enabled || ids.length === 0) return new Map();

    const query = new URLSearchParams({
      select: PROFILE_SELECT,
      user_id: `in.(${ids.join(",")})`,
    });
    const rows = await request(`profiles?${query.toString()}`);
    const profiles = new Map();

    for (const row of Array.isArray(rows) ? rows : []) {
      const profile = normalizeProfile(row);
      if (profile) profiles.set(profile.id, profile);
    }

    return profiles;
  }

  async function loadProfile(userId, fallbackName) {
    const profiles = await loadProfiles([userId]);
    return profiles.get(userId) || {
      id: userId,
      name: fallbackName,
      ratings: { bullet: 1500, blitz: 1500, rapid: 1500 },
    };
  }

  async function createGame(record) {
    await request("online_games?on_conflict=id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: record,
    });
    return true;
  }

  async function updateGame(gameId, record) {
    const query = new URLSearchParams({ id: `eq.${gameId}`, status: "eq.playing" });
    await request(`online_games?${query.toString()}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: record,
    });
  }

  async function findActiveGame(userId) {
    if (!enabled) return null;

    const query = new URLSearchParams({
      select: ACTIVE_GAME_SELECT,
      status: "eq.playing",
      or: `(white_player_id.eq.${userId},black_player_id.eq.${userId})`,
      order: "updated_at.desc",
      limit: "1",
    });
    const rows = await request(`online_games?${query.toString()}`);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  }

  async function finalizeGame(payload) {
    const result = await request("rpc/finalize_online_game", {
      method: "POST",
      body: payload,
    });

    return result && typeof result === "object" ? result : null;
  }

  function warn(operation, error) {
    const message = error instanceof Error ? error.message : "Unknown persistence error.";
    logger.warn(`[persistence:${operation}] ${message}`);
  }

  return {
    enabled,
    loadProfile,
    loadProfiles,
    createGame,
    updateGame,
    findActiveGame,
    finalizeGame,
    warn,
  };
}

