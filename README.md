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

It moves country and date of birth to a private table, hardens profile writes,
and prevents browsers from inventing online results, puzzle progress, activity
events, and notifications.

## Production checklist

1. Add the real HTTPS site URL to Supabase Auth Redirect URLs.
2. Deploy the web app over HTTPS.
3. Deploy the `server` folder separately behind a reverse proxy with `wss://`.
4. Set `VITE_ONLINE_WS_URL` to that exact `wss://` address.
5. Set `NODE_ENV=production` and `ALLOWED_ORIGINS` on the online server.
6. Never put server secrets in a `VITE_*` variable or commit `.env` files.

## Current online-game scope

The game server validates the Supabase session, legal moves and clock on the
server. A browser is never trusted to provide a FEN, PGN, result or time.

Online games are currently an unrated beta: active games live in the server's
memory, so permanent archives, rating changes, tournaments and public
spectating should be added only with a trusted persistence backend.
