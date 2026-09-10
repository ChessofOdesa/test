# Analysis Center

This replaces the old 2,067-line Analysis page and its unused coach/model UI.
The working surface contains a board and Overview, Moves, Engine and Info tabs.
The evaluation graph lives under the tabs so it does not reduce board height.
Existing board appearance preferences and the rest of the site are preserved.

## Implemented

- Import one PGN or FEN, including .pgn upload (2 MB limit). Invalid imports keep
  the current document intact and show a Ukrainian error.
- Legal move validation through the installed chess.js. The analysis tree keeps
  root alternatives, nested RAVs, comments, NAGs, FEN setups and move numbers.
- PGN export and copy preserve annotations; copying a branch exports its line.
- Click or keyboard navigation (arrows, Home, End), undo/redo, branch promotion
  and deletion, move search, board flip and optional best-move arrows. Escape
  clears arrows and exits a variation preview. Imported metadata is retained.
- Position editor with a piece palette, deletion, side to move, castling rights,
  en passant and move number. Chess.js validates the resulting position.
- Browser Stockfish uses the existing worker manager. MultiPV now supports 1–3
  distinct lines and resets to one for other callers. A secondary PV cannot
  overwrite the first line's score. Position changes debounce for 250 ms and
  abort the prior job; engine off terminates it. Errors allow an explicit retry.
- Quick/standard/deep current-position analysis uses depth limits 12/16/20 with
  time limits 0.7/2/5 seconds. The UI reports actual completed depth.
- Full review reuses the post-game worker, grading and device cache. It is
  explicitly started, cancellable, and can be forced to run again. Current
  position calculation pauses while a review runs.
- Overview includes side-by-side counts, average centipawn loss, key mistakes,
  best moves and an interactive graph with keyboard range navigation. Mate
  scores are displayed as mate, not fictitious centipawns. There is no invented
  accuracy percentage. Grading thresholds are documented inside the interface.
- Engine line clicks preview moves without editing the PGN. Opening names come
  from the existing local opening catalog and are absent if there is no match.
- `/analysis/:gameId` loads a saved, finished game; recent games and online games
  saved by the server link there. Unsaved computer/online games still pass PGN
  through route state.
- Account save stores the annotated PGN and validated review samples in an
  independent `analysis_sessions` record. It never inserts or changes a game.
  The five recent account analyses can be reopened. Guests can export PGN.

## Database rollout

Apply `supabase/migrations/20260909000000_analysis_sessions.sql` after the existing
migrations. It adds account-owned rows, private RLS policies and a unique link
per account/game. A linked game must be finished and belong to the writer.
Source edits and tests do not apply this migration to a live database.
Without it, import, editing, Stockfish, graph and export remain usable, but
account save/reopen reports an error. No extra key or server dependency is added.

## Validation

- Production Vite build and TypeScript check.
- Full frontend suite: 52 passing tests, including PGN round trips, nested
  variations, black-to-move setups, promotions, illegal positions, navigation,
  invalid imports, root-branch promotion, cancellation, worker MultiPV/reset,
  and existing play/post-game regression tests.
- Browser QA could not be completed: the browser connection did not return.
  Visual checks at 1366×768, 1600×900, 1920×1080, 2560×1440 and mobile remain
  a review gate before production deployment. Account save/reopen and RLS also
  require verification against a database with the migration applied.

No AI explanation service, external opening database, fake brilliance labels or
accuracy formula is introduced. Board styling controls remain shared with the
existing game settings. Position arrows are temporary board annotations; PGN
comments and chess variations are persisted.
