# Chess of Odesa — online server

The online server is authoritative: it verifies the Supabase session, validates
every move with `chess.js`, owns the clock, and never accepts FEN or PGN from a
browser as truth.

## Local start

1. Install Node.js 20.6 or newer.
2. In this `server` folder, run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL, anon key and
   server-only service-role key.
4. Run `npm start`.
5. In the web-app `.env`, set `VITE_ONLINE_WS_URL=ws://localhost:3001`.

For development, open the app on `http://localhost:8080`. To test a game, sign
in with two different accounts in separate browser profiles.

## Production settings

- Serve the site over HTTPS and expose this service through a `wss://` reverse
  proxy.
- Set `NODE_ENV=production`.
- Set `ALLOWED_ORIGINS` to the exact comma-separated HTTPS site origins.
- Set `SUPABASE_SERVICE_ROLE_KEY` only in the Render server environment.
- Never add the service-role key to Vercel, GitHub, a `VITE_` variable, or any
  browser code.

Apply `supabase/migrations/20260904000000_online_game_persistence_and_ratings.sql`
before enabling the service-role key. The server then stores active positions
and clocks, restores interrupted games, archives completed games, and updates
the correct Bullet, Blitz or Rapid rating in one atomic database operation.
