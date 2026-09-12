# Chess of Odesa — continuation, 12 September 2026

## Working base

Repository: `ChessofOdesa/test`. This change continues `main` at `8ff2956`
(inline Analysis move tree). The pinned right-panel footer and the existing
`AnalysisCenter`, `AnalysisMoveTree`, model, chess.js and Stockfish manager are
preserved. No replacement page or duplicate game room was introduced.

## Completed in this branch

- Branch-aware navigation, correct selected-line counters and matching autoplay.
- Shared keyboard/footer behavior while previewing a Stockfish line.
- Keyboard tab switching does not also move the chessboard.
- Existing board moves select their saved continuation without duplicating nodes.
- Move numbers are taken from FEN, including games starting with Black on a later move.
- FEN/depth/MultiPV identity prevents old engine evaluations and lines from appearing
  after navigation. The in-memory position cache is bounded to 256 entries.
- Time-bounded worker searches support actual cancellation. Full review pauses
  position searches and cannot write late annotations after import/reset/unmount.
- Restored the Analysis smoke-test providers and resize stub so the tests actually
  mount the page; added behavioral regression coverage.

## Verification

All 61 frontend tests passed, followed by a focused run with two additional
FEN/autoplay cases. TypeScript and the Vite production build passed. Build retains
the pre-existing large-chunk warning. The browser refused the local preview with
`ERR_BLOCKED_BY_CLIENT`, so a live-browser Stockfish run is not claimed here.
No production configuration or database migration was applied.

## Next work, using existing components

1. Complete PGN variation round trips. `buildRecordFromPgn` currently reconstructs
   the chess.js mainline, dropping imported variations/comments. The serializer
   in `pgnTree.ts` also needs standards-correct RAV placement and round-trip tests.
   Preserve the inline tree rather than adding a second tree/page.
2. Consolidate Analysis full-review scoring and persistent cache with the existing
   `features/game-room/review` engine/model/cache. Analysis still contains the
   older accuracy approximation and its own loop; the Game Room already has
   the shared report model and a persistent cache. Root variations require an
   explicit compatible model extension.
3. Check the production online environment and actual two-account gameplay.
   `docs/GAME_ROOM.md` records a prior Render `ALLOWED_ORIGINS` blocker; its live
   status has not been rechecked in this change.

Open PR #2 already contains the puzzle training workspace. Check that work
before making puzzle changes. The older Analysis PR #1 predates the current
mainline UI; do not merge or recreate that alternative page blindly.
