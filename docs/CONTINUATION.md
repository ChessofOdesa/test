# Chess of Odesa — continuation, 14 September 2026

## Verified working base

Repository: `ChessofOdesa/test`, main `8c3a27e`. PR #10 continues the existing
Analysis Center. Main advanced through PRs #11–#18 while this branch was being
worked on; those changes were integrated, preserving the evaluation graph,
selected-move inspector, compact variations, reviewed-best-line preview and
simplified Engine panel, Simple/Advanced modes and nested variation promotion. No replacement page or duplicate panel component remains.

## Completed

- Position results must match FEN/depth/MultiPV before they appear. The existing
  Stockfish worker uses bounded searches (600/1500/4500 ms for D8/D12/D16) and a
  256-entry memory cache. Displayed depth is the depth actually returned.
- Review suspends position searches. Import, reset, mainline replacement,
  stop, Engine OFF and unmount cancel its work; late results cannot annotate
  replacement moves. Existing reviewed-best-line preview remains available.
- One footer and keyboard navigate both saved moves and temporary engine previews.
  Upstream's two-arrow footer is preserved; Home/End remain keyboard actions.
  Autoplay now follows the selected branch using the existing navigation helper.
- Explicit engine-line insertion and board moves share atomic insertion and reuse
  stored continuations. An invalid line cannot partly modify the game.
- First-move alternatives now use optional `rootVariations` with paths `[-1, index, ...]`.
  They work with board/engine insertion, navigation/autoplay, comments, deletion/undo,
  nested promotion, PGN round trips and snapshots. Older snapshots remain compatible.
- PGN import/export retains root and nested alternatives, comments, six supported symbolic
  NAGs and headers, with standards-correct RAV placement and numeric NAG export.
  FEN-based games retain their original move numbers, including Black to move.
- Moves adds an explicit player-color filter and accessible selected-move state.
  Opening badges require a standard starting position, and engine classifications
  take precedence consistently on the board and in the tree.
- Overview keeps the existing graph. Categories and accuracy use only the mainline;
  accuracy is labeled as an approximation, explains its formula, and excludes mate
  scores. Key moments are selectable and have a next-moment action.
- Info owns full PGN preview, copy and download; metadata copying retains all
  supplied headers. Missing values stay explicit. Removed duplicate export actions.
- The board badge now uses the exact rendered board surface as its position anchor,
  so a board reduced by available height cannot misalign it with its destination.
  Fixed the missing ChevronDown import in the upstream Engine renderer.

## Existing visual work preserved

Compared with the initial inline-tree version (`8ff2956`), upstream already reduced
variation vertical padding from 6 to 2 px (67%) and row minimum height from 31 to
27 px (13%), with no visible «Ваш варіант» label. Badge maximum size is 30 px on
desktop (previously 24, +25%) and 27 px on mobile (previously 20, +35%); actual
clamped size depends on available square space. It stays in the upper-right corner
inside the destination square. This continuation preserves those sizes/styles.

## Verification

- 115 frontend tests in 21 files passed, including the workspace and practice tests.
- TypeScript application check, focused ESLint and production Vite build passed.
- Existing large-chunk and Browserslist/React Router notices remain; expected
  engine-failure test logs are not runtime failures of this change.
- The browser refused localhost with `ERR_BLOCKED_BY_CLIENT`; no live Stockfish or
  visual certification at 1366×768, 1600×900, 1920×1080 or mobile is claimed.
- No production configuration, deployment or database migration was applied.

## Remaining work

- Consolidate full-review scoring with the existing Game Room review model.
  Persistent Analysis position caching is implemented; accuracy remains approximate.
- Run live browser/responsive checks and actual worker analysis where the preview
  is reachable, then verify the production online environment and two-account play.
  The older Render `ALLOWED_ORIGINS` concern has not been rechecked here.
- PR #2 already covers puzzle training; inspect it before changing that workspace.


## Analysis workspace continuation — 2026-09-14

All 15 requested improvements are wired into the existing Analysis Center and tree.
The current Simple/Advanced panels, navigator, board and PGN model are reused.

| # | Feature | Implementation |
| --- | --- | --- |
| 1 | Autosave | Debounced local draft, pagehide/unmount flush, legal tree hydration and selected branch restoration. Invalid incoming links preserve the draft. |
| 2 | My analyses | Named local records, tags, opponent/header/date/detected-opening search, update/load/delete; legacy sessions remain readable. |
| 3 | Mistake training | Mainline review errors become exercises with hidden answers, fresh worker checks, hints and a without-hint counter. |
| 4 | Compare lines | Played continuation and Stockfish PV on two existing boards, step controls and evaluations from White's perspective. Shorter lines are disclosed. |
| 5 | Persistent cache | Exact FEN/depth/MultiPV keys, validated worker results, 30-day expiry, bounded entries/storage, clear action. |
| 6 | Economy | One PV, depth 8/600 ms; hidden-tab position work stops and review pauses. Explicit deep position uses depth 16/4500 ms. |
| 7 | Undo/redo | Shared bounded edit history covers import, board/engine insertion, promotion/deletion, comments and bookmarks; buttons and Ctrl/Cmd-Z/Y. |
| 8 | Bookmarks | Important/check/opening markers in the move menu; bookmark list navigates to marked positions. |
| 9 | Position editor | Piece palette, turn, castling, en passant and move counters; FEN legality and castling-piece checks before applying. |
| 10 | Sharing | Self-contained URL fragment contains PGN comments/branches and selected line, or only current FEN; copy fallback and size limit. |
| 11 | Panel width | Desktop pointer drag and accessible keyboard separator, clamped to 340–620 px. |
| 12 | Branch focus | Collapses inactive branches in the existing tree; selecting one opens it. |
| 13 | Follow selection | Reveals the active move, pauses after manual scroll/input, offers an explicit jump and respects reduced motion. |
| 14 | Review progress | Completed/total half-moves, pause/resume within the current page, cancellation guards against late writes. |
| 15 | Mobile workspace | Compact sticky board, scrollable right panel with available tabs and pinned shared footer; focus layout can be disabled. |

### File responsibilities

- `workspace.ts` / `useAnalysisWorkspace.ts`: draft/archive, hydration, edit history and URL sharing.
- `WorkspaceDialogs.tsx`: archive/search and share controls.
- `positionCache.ts`: persistent optional engine cache.
- `PracticeTools.tsx` / `trainingModel.ts`: exercises and continuation comparison.
- `PositionEditor.tsx` / `editorModel.ts`: editable board and FEN validation.
- `analysis-workspace-tools.css`: new controls, modal and responsive layout styles, loaded after the existing Analysis CSS.

### Validation and limits

- Full frontend suite: 115 tests pass. TypeScript application check and focused ESLint pass.
- Tests cover remount recovery, invalid shared input, archive search, edit undo/redo,
  economy/deep requests, review pause/resume, stale cancellation, sharing Unicode/branches,
  cached key/expiry, FEN validation and practice waiting for the engine response.
- Drafts, named analyses and cache are local to the browser/device. There is no account sync.
  Named analyses are explicit snapshots; current work autosaves separately. Storage errors
  are shown and PGN remains available. Edit history and review progress are page-session state.
- Sharing sends a static snapshot. Long games must use PGN or position-only links.
- Exercise checks are bounded engine searches and accept non-best moves within 30 cp;
  this is training feedback, not proof of perfect play. Engine/board interactions are mocked
  in component tests; real worker quality and live mobile/desktop layout remain unverified
  because the available browser previously blocked localhost.
- Keep PR #10 as a draft until live preview checks are complete. No production deployment,
  production configuration or database changes are part of this continuation.
