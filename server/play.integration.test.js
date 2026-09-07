import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { WebSocket } from "ws";
import { parseTimeControl, validateMatchOptions } from "./time-control.js";
const records = new Map(), sockets = [];
const users = Object.fromEntries(["alice", "bob", "carol", "dave", "erin", "frank"].map((name, i) => [name, { id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, name, rating: 1500 + i * 100 }]));
let api, child, port;
function listen(server) { return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server.address().port))); }
before(async () => {
  api = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost"); let body = ""; for await (const chunk of req) body += chunk;
    const data = body ? JSON.parse(body) : {};
    let result = [];
    if (url.pathname === "/auth/v1/user") { const name = req.headers.authorization?.replace("Bearer test-fixture-token-", ""); const u = users[name]; if (!u) { res.writeHead(401); res.end("{}"); return; } result = { id: u.id, user_metadata: { display_name: u.name } }; }
    else if (url.pathname === "/rest/v1/rpc/play_capabilities") result = { version: 2 };
    else if (url.pathname === "/rest/v1/profiles") result = Object.values(users).map(u => ({ user_id: u.id, display_name: u.name, rating_bullet: u.rating, rating_blitz: u.rating, rating_rapid: u.rating }));
    else if (url.pathname === "/rest/v1/online_games") {
      if (req.method === "POST") records.set(data.id, data);
      else if (req.method === "PATCH") { const id = url.searchParams.get("id").slice(3); Object.assign(records.get(id) || {}, data); }
      else result = [...records.values()].filter(g => g.status === "playing" && (url.searchParams.get("or") || "").includes(g.white_player_id) || g.status === "playing" && (url.searchParams.get("or") || "").includes(g.black_player_id));
    } else if (url.pathname === "/rest/v1/rpc/finalize_online_game") { const g = records.get(data.p_game_id); Object.assign(g, { status: "finished", result: data.p_result, pgn: data.p_pgn, fen: data.p_fen }); result = { white_rating_change: 0, black_rating_change: 0 }; }
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
  });
  const apiPort = await listen(api), reservation = createServer(); port = await listen(reservation); await new Promise(resolve => reservation.close(resolve));
  child = spawn(process.execPath, ["server.js"], { cwd: new URL(".", import.meta.url), env: { ...process.env, PORT: String(port), NODE_ENV: "test", SUPABASE_URL: `http://127.0.0.1:${apiPort}`, SUPABASE_ANON_KEY: "fixture-anon", SUPABASE_SECRET_KEY: "fixture-server", ALLOWED_ORIGINS: "http://localhost:8080" }, stdio: ["ignore", "pipe", "pipe"] });
  await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error("Server did not start")), 8000); child.stdout.on("data", d => { if (d.toString().includes("listening")) { clearTimeout(timeout); resolve(); } }); child.once("exit", code => reject(new Error(`Server exited ${code}`))); });
});
after(async () => { for (const ws of sockets) ws.terminate(); if (child && child.exitCode === null) { child.kill(); await once(child, "exit"); } await new Promise(resolve => api.close(resolve)); });
async function connect(name) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`), messages = []; sockets.push(ws);
  ws.on("message", raw => messages.push(JSON.parse(raw)));
  const next = (type, predicate = () => true) => new Promise((resolve, reject) => { const started = Date.now(); const timer = setInterval(() => { const i = messages.findIndex(m => m.type === type && predicate(m)); if (i >= 0) { clearInterval(timer); resolve(messages.splice(i, 1)[0]); } else if (Date.now() - started > 4000) { clearInterval(timer); reject(new Error(`Missing ${type}; received ${messages.map(m => m.type)}`)); } }, 10); });
  await once(ws, "open"); const send = data => ws.send(JSON.stringify(data)); send({ type: "authenticate", token: `test-fixture-token-${name}` }); const auth = await next("authenticated"); return { ws, messages, send, next, auth };
}
const options = { timeControl: "3+0", color: "random", rated: false, minRating: 100, maxRating: 4000 };
async function finish(player, game) { player.send({ type: "resign", gameId: game.id }); await player.next("game_over"); }
test("time bounds, categories and capability checks are enforced", () => {
  assert.equal(parseTimeControl("2+1").category, "bullet"); assert.equal(parseTimeControl("5+3").category, "blitz"); assert.equal(parseTimeControl("15+10").category, "rapid"); assert.equal(parseTimeControl("60+0").category, "classical");
  for (const value of ["0+0", "181+0", "3+61", "NaN+0", "-1+0", "3.5+0"]) assert.equal(parseTimeControl(value), null);
  assert.equal(parseTimeControl("0+2").initialMs, 2000);
  assert.throws(() => validateMatchOptions({ ...options, rated: true }, {}));
  assert.throws(() => validateMatchOptions({ ...options, rated: false }, { persistenceEnabled: true, flexibleRatings: false }));
  assert.throws(() => validateMatchOptions({ ...options, minRating: 2000, maxRating: 1500 }));
});
test("3+0 honors colors and rating range, cancellation removes queue entry, refresh restores game", async () => {
  const a = await connect("alice"), b = await connect("bob");
  a.send({ type: "find_game", ...options, color: "w", maxRating: 1550 }); await a.next("waiting");
  b.send({ type: "find_game", ...options, color: "b" }); await b.next("waiting");
  a.send({ type: "cancel_find" }); await a.next("cancelled");
  a.send({ type: "find_game", ...options, color: "w" }); const game = (await a.next("game_found")).game; await b.next("game_found");
  assert.equal(game.yourColor, "w"); assert.equal(game.rated, false); assert.equal(game.timeControl, "3+0");
  a.send({ type: "make_move", gameId: game.id, from: "e2", to: "e4" }); await a.next("move_made");
  a.ws.close(); await once(a.ws, "close"); const restored = await connect("alice"); assert.equal(restored.auth.hasActiveGame, true); const state = (await restored.next("game_state")).game; assert.equal(state.id, game.id); assert.match(state.pgn, /e4/);
  restored.send({ type: "find_game", ...options }); await restored.next("error"); await finish(restored, game);
});
test("10+0 rated and custom casual queues stay separate; invalid settings are rejected", async () => {
  const a = await connect("carol"), b = await connect("dave");
  a.send({ type: "find_game", ...options, timeControl: "10+0", rated: true }); await a.next("waiting");
  b.send({ type: "find_game", ...options, timeControl: "10+0", rated: false }); await b.next("waiting");
  b.send({ type: "find_game", ...options, timeControl: "10+0", rated: true }); const first = (await b.next("game_found")).game; await a.next("game_found"); assert.equal(first.rated, true); await finish(a, first);
  a.send({ type: "find_game", ...options, timeControl: "7+4" }); await a.next("waiting"); b.send({ type: "find_game", ...options, timeControl: "7+4" }); const second = (await a.next("game_found")).game; await b.next("game_found"); assert.equal(second.timeControl, "7+4"); assert.equal(second.rated, false); await finish(a, second);
  a.send({ type: "find_game", ...options, timeControl: "0+0" }); assert.match((await a.next("error")).message, /0\+0/);
});
test("private link challenges survive reconnect, reject self-accept, invite and accept produce one game", async () => {
  const a = await connect("erin"), b = await connect("frank");
  a.send({ type: "create_challenge", ...options, timeControl: "5+3", color: "b" }); const challenge = (await a.next("challenge_created")).challenge;
  a.send({ type: "accept_challenge", id: challenge.id }); await a.next("error");
  a.ws.close(); await once(a.ws, "close"); const host = await connect("erin"); assert.equal((await host.next("challenge_created")).challenge.id, challenge.id);
  b.send({ type: "get_challenge", id: challenge.id }); const invitation = (await b.next("challenge_received")).challenge; assert.equal(invitation.color, "b");
  b.send({ type: "accept_challenge", id: challenge.id }); const game = (await b.next("game_found")).game; await host.next("game_found"); assert.equal(game.yourColor, "w"); assert.equal(game.timeControl, "5+3");
  b.send({ type: "accept_challenge", id: challenge.id }); await b.next("error"); await finish(b, game);
  b.send({ type: "rematch", gameId: game.id, timeControl: "1+0" }); const offer = await host.next("rematch_offer"); assert.equal(offer.timeControl, "5+3");
  host.send({ type: "rematch_response", gameId: game.id, accept: true, timeControl: "10+0" }); const rematch = (await b.next("game_found")).game; assert.equal(rematch.timeControl, "5+3"); assert.equal(rematch.yourColor, "b"); assert.equal(rematch.rated, false); await finish(b, rematch);
});
