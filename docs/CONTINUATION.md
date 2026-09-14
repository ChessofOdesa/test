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

- 99 frontend tests in 19 files passed, including 58 Analysis tests.
- TypeScript application check, focused ESLint and production Vite build passed.
- Existing large-chunk and Browserslist/React Router notices remain; expected
  engine-failure test logs are not runtime failures of this change.
- The browser refused localhost with `ERR_BLOCKED_BY_CLIENT`; no live Stockfish or
  visual certification at 1366×768, 1600×900, 1920×1080 or mobile is claimed.
- No production configuration, deployment or database migration was applied.

## Remaining work

- Consolidate full-review scoring/persistent caching with the existing Game Room
  review model. The disclosed accuracy measure remains an approximation.
- Run live browser/responsive checks and actual worker analysis where the preview
  is reachable, then verify the production online environment and two-account play.
  The older Render `ALLOWED_ORIGINS` concern has not been rechecked here.
- PR #2 already covers puzzle training; inspect it before changing that workspace.
