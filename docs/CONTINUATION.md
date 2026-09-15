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


## Button and interaction audit — 2026-09-14

- Keep one Analysis settings entry; remove the duplicate Engine-tab settings button.
- Place file selection inside Import PGN, removing its competing toolbar entry.
  Successful file loading now closes the import dialog.
- During a paused review show Resume without Start/Restart controls alongside it.
- Use the shared edit-history undo only. Remove the old deletion-toast snapshot action,
  which could overwrite later changes. Keyboard undo now respects review/modal locks.
- Hide global variation collapse during branch focus, where it had no effect.
- Make the deep-position action toggle back to short analysis instead of becoming a no-op.
- The archive primary action updates an already saved analysis; a separately labeled
  Create copy action makes duplication explicit.
- Suspend autoplay while a workspace/import/settings dialog, review or engine preview
  is active, so the underlying selected position does not drift during these operations.

Verification: all 118 frontend tests pass (39 targeted interaction tests), plus TypeScript and focused ESLint.
The existing live-browser limitation still applies; this is a source/component audit.


## Forecast, position image and game metadata — 2026-09-15

- My forecast opens an isolated board without engine scores. Legal SAN/UCI, a numeric
  White-perspective estimate and a plan are saved before explicit Stockfish comparison.
  Inputs survive draft/archive hydration and undo. The comparison evaluates both the
  starting position and proposed move; it does not claim to judge the prose plan.
- Info / Edit game data supports players, ratings, event, site, date, round, result,
  time control, termination, opening and ECO. Dates/results/ratings/ECO are validated.
  Unknown headers, move-tree identity and current branch are retained; edits use undo.
- Info / Export image captures the displayed position, board theme/orientation,
  last-move squares, visible arrows and caption in self-contained SVG or 2x PNG.
  Preview checkboxes control layers; arrow fields also work on mobile. Caption changes
  affect only the image. Escaping and caption/line limits prevent invalid or oversized SVG.
- Analysis annotations are controlled: right-drag toggles saved arrows per move/root,
  repeated drawing removes an arrow, and More / Clear position arrows clears them.
  These arrows survive Stockfish updates and draft restoration. Other pages keep the
  existing board's native arrow interaction because the new callback is opt-in.
- 127 frontend tests passed in 23 files, including authoring persistence, worker-error
  and cancellation, metadata undo, orientation and annotation-gesture regressions.
  TypeScript, focused ESLint and production Vite build passed. SVG sample diagrams
  were rendered with Sharp and visually inspected. Actual browser PNG download and
  real-worker checks remain pending under the existing live-browser limitation.
- Local environment returned after preparation; the implementation is now in tracked
  source files. No production deployment, merge, account sync or database change.

## Game-information and button audit — 2026-09-15

The reported metadata save failure was reproduced with a PGN containing Date `?`,
ECO `?` and WhiteElo `-`: changing only White never called onSave. The regression
failed before the fix and passes afterward.

- Validate only explicitly changed metadata fields; preserve untouched imported
  values and custom headers. Omitted patch fields are preserved; an explicit empty
  value removes a field. Dates accept DD.MM.YYYY, YYYY.MM.DD and YYYY-MM-DD, normalize
  to PGN format and still reject nonexistent dates. ECO accepts lowercase and `?`.
- Metadata errors identify/focus the invalid field, retain the draft and expose
  aria-invalid/description. Form fields scroll separately from Save/Cancel/error
  footer. Mobile layout needs a real-browser check, as noted below.
- Engine depth and MultiPV buttons now show effective settings. Choosing them exits
  economy mode and clears a per-position depth override, so the requested choice
  actually reaches the engine. A note explains this behavior before selection.
- The formerly ineffective book-badge button now opens Info; evaluation badges still
  open Engine. No duplicate toolbar, editor, move tree or navigation was added.

Audit scope: existing Analysis Center handlers and their regression coverage.

| Area | Evidence |
| --- | --- |
| Metadata Save/Cancel/error/reopen/undo/redo | Component tests, including legacy imported values and invalid dates |
| Metadata persistence and PGN export | Integration test verifies names/date/result/custom headers/comments/branches, then remounts from the saved draft |
| Navigation, tabs, board moves, previews, branches | Existing smoke/tree/navigation/branch tests |
| Import, archives, links, cache, history | Existing file-import and workspace tests |
| Stockfish controls and review pause/resume/cancel | Existing cancellation tests plus manual depth/MultiPV regression |
| Forecast, practice, comparison, position editor, annotations | Existing authoring/practice/editor-model/board-annotation tests |
| Image export | SVG/content/orientation and PNG-error tests; actual browser download remains unverified |

Validation: all 133 tests in 23 files, TypeScript, focused ESLint and production
Vite build pass. Existing bundle-size/Browserslist/React Router notices remain.
Component tests use a mocked board/worker; these results do not certify every live
button or every page of the platform.

Deployment check: PR #10 is still draft/unmerged, main is `8c3a27e`. The PR's Vercel
preview navigates to “Log in to Vercel” in the available browser. No login or access
settings were changed. Earlier localhost access was blocked by the browser. Live
responsive, clipboard/download and real Stockfish worker QA remain pending. The
user's exact site URL and deployed revision have not been provided; do not claim
that the user's current browser already contains these changes. Update this same
PR branch; no production merge/deployment was performed.

## Settings-specific audit — 2026-09-15

Continued the existing settings popover in response to the user's report that some
settings do not work. No replacement settings UI or duplicate controls were added.

Fixes:
- Persist all ten Analysis settings with validated device-local preferences. Theme
  and coordinates retain the existing shared board preferences. Invalid/unavailable
  storage falls back safely; inability to save is visible in the popover.
- Best-move arrows no longer disappear merely because a book/evaluation badge exists.
  The independent arrow and badge switches can both be on.
- Clear cache now reports storage failure, cancels old position/review requests,
  clears memory, invalidates the displayed result and starts a fresh current-position
  search when allowed. The fresh search can repopulate the cache by design.
- Effective MultiPV is used in the Advanced display and rendered line limit; the
  economy note also reflects a temporary deep-position request.
- Clicking a move no longer counts as manual scrolling. Wheel/touch/manual paging
  still suspend follow temporarily; turning follow back on reveals immediately.
- Popover scrolling is constrained by Radix available height and dynamic viewport
  height, with overscroll containment. Live mobile visual validation is still pending.

Automated settings audit (real shared ChessBoard adapter, mocked renderer/engine):

| Control | Verified effect |
| --- | --- |
| Simple / Advanced | Engine details appear/disappear; selection persists |
| D8 / D12 / D16 | Every depth reaches engine; selection persists |
| MultiPV 1 / 2 / 3 / 5 | Every choice reaches engine; selection persists |
| Economy / explicit depth override | Short/deep requests, manual override, effective display, hidden-tab cancellation and visible-tab resume |
| All 11 board themes | Correct light/dark colors delivered to renderer |
| Coordinates | Board notation flag switches both ways and persists |
| Move animation | Renderer duration switches between 0 and 150 ms and persists |
| Best-move arrow / badges | Independent visible states, including a recognized opening |
| Branch focus | Inactive branches collapse and reopen |
| Follow selected move | Control toggles, actual scroll request, manual-scroll pause and immediate re-enable |
| Compact mobile board | Layout class and board size change in a simulated 500x800 viewport |
| Clear Stockfish cache | Persistent cache removal, old request cancellation, fresh same-position search, failure feedback |

Validation: 141 tests in 24 files, TypeScript, focused ESLint and production build.
Live browser, animation rendering, touch gestures and Vercel preview remain subject
to the previously recorded access limitation. PR #10 remains draft/unmerged.

## Engine tab redesign — 2026-09-15

User requested a complete Engine tab redesign with directly explorable variations.
Replaced the large best-move card and collapsed alternatives with a single compact
variation list. Removed obsolete styles for the replaced sections.

- Compact Stockfish status, one position evaluation, White-perspective explanation
  and side-to-move label. All returned MultiPV lines are visible immediately.
- Each row has a fixed score cell (including mate scores), best/rank indicator,
  individually clickable SAN moves and one explicit Add entire line control.
- Move numbers follow the actual FEN, including Black to move and custom fullmove
  numbers. Preview up to 20 legal plies; invalid continuations stop before bad moves.
- Clicking any ply uses the existing board preview and shared bottom navigator.
  Preview selection is highlighted and horizontally revealed; switching rows never
  edits the saved tree. Return to game restores the selected game position.
- Mobile rows scroll horizontally with larger move targets. Scores/add controls stay
  outside the scrolling region. Focus/disabled states and accessible move labels.
- Comparison and economy deep-position actions remain below the lines. Existing
  settings, engine adapter, board and tree are reused; Advanced details still work.
- Clear loading, error, review-in-progress, checkmate/stalemate and fewer-line states.
  Preview text explicitly says scores belong to the original analyzed position.

Validation: 143 tests in 25 files, TypeScript, focused ESLint and production build
pass. Includes direct any-ply preview, row switching, shared navigation, unchanged
PGN until explicit add, Black move numbers, mate-score display and disabled controls.
Live visual/touch/worker validation remains pending under the existing protected
preview limitation. No production merge/deployment. Continue on the same PR #10.
