# Chess of Odesa — online server

The online server is authoritative: it verifies the Supabase session, validates
every move with `chess.js`, owns the clock, and never accepts FEN or PGN from a
browser as truth.

## Local start

1. Install Node.js 20.6 or newer.
2. In this `server` folder, run `npm install`.
3. Copy `.env.example` to `.env` and fill in the Supabase URL and anon key.
4. Run `npm start`.
5. In the web-app `.env`, set `VITE_ONLINE_WS_URL=ws://localhost:3001`.

For development, open the app on `http://localhost:8080`. To test a game, sign
in with two different accounts in separate browser profiles.

## Production settings

- Serve the site over HTTPS and expose this service through a `wss://` reverse
  proxy.
- Set `NODE_ENV=production`.
- Set `ALLOWED_ORIGINS` to the exact comma-separated HTTPS site origins.
- Never place a Supabase service-role key in the browser or this `.env` file.

The server intentionally keeps active games only in memory for this first
release-safety pass. Add a trusted persistence worker/service-role database
writer before rating online games or offering permanent game archives.
