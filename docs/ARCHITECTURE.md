# Chess of Odesa application

The application uses React, TypeScript and Vite. Existing Supabase authentication, database migrations and the authoritative online game server are retained.

- `src/app`: application routes, navigation metadata, lazy online provider and route error boundary.
- `src/components/layout`: shared header, page layout and loading state.
- `src/features/play`: reusable game setup, computer configuration, move helpers and game controls.
- `src/features/analysis`: record and PGN helpers, engine-result presentation and analysis controls. Evaluations retain the white perspective. A failed engine reports an error rather than a heuristic Stockfish score.
- `src/features/profile`: account-scoped queries and reusable saved-game history.
- `src/features/puzzles`: solution execution; positions are fetched from `public/puzzles` in sets of 400.
- `src/features/lessons`: lesson progression and presentation helpers. Lesson progress remains device-local and is labelled as such.
- `src/pages`: route workspaces, loaded on demand.
- `src/index.css`: light surface and navy accent tokens, responsive header and common surfaces.

## Removed product surfaces

The seeded message inbox, demo tournaments, unsupported quests UI and duplicate AI trainer were removed. Legacy URLs redirect to the appropriate working workspace. Social contains actual profile search, requests and friends only. Profiles show actual database ratings and stored games, without invented presence, rating trends or titles.

Unused legacy pages, hidden UI blocks, old navigation, duplicate puzzle sources, obsolete lesson data and Lovable authoring integration have been removed. Server-side historical tables and migrations are preserved; no user database records are deleted.

## Important behavior

Online access still requires a real account. Login preserves the requested route and time-control query. Online setup and game routes share the same provider while navigating between them. Saved PGNs are passed into analysis through router state. Errors and empty states never display seeded substitutes.

The existing backend setup remains required for online persistence and ratings. This frontend redesign adds no database migration or secret.
