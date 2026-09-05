# Chess of Odesa — online server

The online server is authoritative: it verifies the Supabase session, validates
every move with `chess.js`, owns the clock, and never accepts FEN or PGN from a
browser as truth.

## Local start

1. Install Node.js 20.6 or newer.
2. In this `server` folder, run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL, anon key and
   server-only secret key.
4. Run `npm start`.
5. In the web-app `.env`, set `VITE_ONLINE_WS_URL=ws://localhost:3001`.

For development, open the app on `http://localhost:8080`. To test a game, sign
in with two different accounts in separate browser profiles.

## Production settings

- Serve the site over HTTPS and expose this service through a `wss://` reverse
  proxy.
- Set `NODE_ENV=production`.
- Set `ALLOWED_ORIGINS` to the exact comma-separated HTTPS site origins.
- Set `SUPABASE_SECRET_KEY` only in the Render server environment. A legacy
  `SUPABASE_SERVICE_ROLE_KEY` remains supported during migration.
- Never add the server secret to Vercel, GitHub, a `VITE_` variable, or any
  browser code.

Apply `supabase/migrations/20260904000000_online_game_persistence_and_ratings.sql`
before enabling the server secret. The server then stores active positions
and clocks, restores interrupted games, archives completed games, and updates
the correct Bullet, Blitz or Rapid rating in one atomic database operation.

Also apply `supabase/migrations/20260905000000_lichess_evaluation_cache.sql`.
The HTTP endpoint `GET /api/evaluation?fen=...&multiPv=3` then reads from the
server-only Supabase cache before requesting the public Lichess cloud database.
It accepts at most five variations, validates every FEN, serializes upstream
requests, observes a one-minute cooldown after a Lichess rate limit, and limits
each client address to 24 calls per minute. The existing `ALLOWED_ORIGINS`
setting protects browser access to this endpoint as well as WebSocket access.

No additional secret is required for Lichess. If the Supabase server key is not
configured, evaluation still works with the in-memory cache, but cached results
will disappear when Render restarts.
