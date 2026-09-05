import assert from "node:assert/strict";
import test from "node:test";
import { createSupabasePersistence } from "./supabase-persistence.js";

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("keeps the chess server usable when persistence is not configured", async () => {
  const persistence = createSupabasePersistence({ url: "", secretKey: "" });

  assert.equal(persistence.enabled, false);
  assert.equal((await persistence.loadProfiles(["player-id"])).size, 0);
  assert.equal(await persistence.findActiveGame("player-id"), null);
});

test("loads a player's public ratings with server-only credentials", async () => {
  let requestUrl = "";
  globalThis.fetch = async (url, options) => {
    requestUrl = String(url);
    assert.equal(options.headers.apikey, "sb_secret_test");
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify([
      {
        user_id: "player-id",
        display_name: "Андрій",
        rating_bullet: 1710,
        rating_blitz: 1840,
        rating_rapid: 1920,
      },
    ]));
  };

  const persistence = createSupabasePersistence({
    url: "https://example.supabase.co/",
    secretKey: "sb_secret_test",
  });
  const profile = await persistence.loadProfile("player-id", "Гравець");

  assert.match(requestUrl, /\/rest\/v1\/profiles\?/);
  assert.deepEqual(profile, {
    id: "player-id",
    name: "Андрій",
    ratings: { bullet: 1710, blitz: 1840, rapid: 1920 },
  });
});

test("keeps legacy service-role JWT authentication compatible", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.apikey, "eyJheader.payload.signature");
    assert.equal(options.headers.Authorization, "Bearer eyJheader.payload.signature");
    return new Response("[]");
  };

  const persistence = createSupabasePersistence({
    url: "https://example.supabase.co",
    serviceRoleKey: "eyJheader.payload.signature",
  });

  await persistence.loadProfiles(["player-id"]);
});

test("writes active games and finalizes results through the protected RPC", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), method: options.method, body: options.body });
    if (String(url).endsWith("/rpc/finalize_online_game")) {
      return new Response(JSON.stringify({
        saved: true,
        rated: true,
        white_rating_after: 1512,
        black_rating_after: 1488,
      }));
    }
    return new Response(null, { status: 204 });
  };

  const persistence = createSupabasePersistence({
    url: "https://example.supabase.co",
    secretKey: "sb_secret_test",
  });

  await persistence.createGame({ id: "game-id", status: "playing" });
  await persistence.updateGame("game-id", { fen: "final-fen" });
  const result = await persistence.finalizeGame({ p_game_id: "game-id" });

  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /online_games\?on_conflict=id$/);
  assert.equal(calls[1].method, "PATCH");
  assert.match(calls[1].url, /online_games\?/);
  assert.equal(calls[2].method, "POST");
  assert.equal(result.white_rating_after, 1512);
});
