# Chess of Odesa

Chess platform built with React, Vite, TypeScript, Supabase and a separate
authoritative WebSocket server for online games.

## Local start

1. Install Node.js 20.6 or newer.
2. Copy `.env.example` to `.env` and enter the Supabase project URL and
   publishable/anon key.
3. Install the web-app dependencies with `npm ci` (or `npm install`).
4. Run `npm run dev`.
5. In `server`, copy `.env.example` to `.env`, install dependencies, and run
   `npm start`.

The web app uses `ws://localhost:3001` during local development unless
`VITE_ONLINE_WS_URL` is configured.

## Required Supabase migration

Before deploying this version, apply:

`supabase/migrations/20260826000000_secure_profiles_and_game_access.sql`

and then:

`supabase/migrations/20260904000000_online_game_persistence_and_ratings.sql`

and finally:

`supabase/migrations/20260905000000_lichess_evaluation_cache.sql`

It moves country and date of birth to a private table, hardens profile writes,
and prevents browsers from inventing online results, puzzle progress, activity
events, and notifications.

## Production checklist

For a fresh database, follow the exact migration order in
[`supabase/README.md`](supabase/README.md).

1. Add the real HTTPS site URL to Supabase Auth Redirect URLs.
2. Deploy the web app over HTTPS.
3. Deploy the `server` folder separately behind a reverse proxy with `wss://`.
4. Set `VITE_ONLINE_WS_URL` to that exact `wss://` address.
5. Set `NODE_ENV=production`, `ALLOWED_ORIGINS` and
   `SUPABASE_SECRET_KEY` on the online server.
6. Keep `SUPABASE_SECRET_KEY` only on Render. Never put it in Vercel, a
   `VITE_*` variable, browser code, or committed `.env` files.

## Lichess evaluation database

The Analysis page uses the public Lichess cloud-evaluation database for the
current position and up to three principal variations. Requests go through the
Render server, are rate limited, serialized and cached in the server-only
`position_evaluations` table. If a position is missing or Lichess is temporarily
unavailable, the page automatically falls back to the configured native
Stockfish bridge, browser Stockfish and then the lightweight local fallback.

The full compressed Lichess evaluation dump is not committed or loaded in the
browser. It is larger than a normal application deployment and is intended for
bulk data pipelines. `VITE_EVAL_API_URL` is optional: when omitted, the web app
derives `/api/evaluation` from `VITE_ONLINE_WS_URL`.

## Current online-game scope

The game server validates the Supabase session, legal moves and clock on the
server. A browser is never trusted to provide a FEN, PGN, result or time.

With the persistence migration and server-only secret key enabled, active
games survive a server restart, completed games appear in profile history, and
Bullet, Blitz or Rapid rating updates atomically. If the key is absent, the
server remains available but clearly marks new games as unrated and does not
write results.
