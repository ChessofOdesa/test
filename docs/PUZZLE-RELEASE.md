# Puzzle release — 2026-09-21

Publish the requested puzzle features from PR #10 on current main 37b9cfe,
including its Analysis layout from PRs #19 and #20. The broader Analysis redesign
in PR #10 remains separate; this release preserves current main styles and controls.

- 25,000 unique Lichess positions in 29 primary themes; original IDs retained.
- Left task/rating/theme panel, right hints, correct/rejected move marks, rating
  range, mobile controls and completion-only next puzzle.
- Completion-only Stockfish review, error continuations on the board and PGN export.
- ID-only share links, queued behind unfinished attempts; local progress persists.
- Root/nested PGN alternatives and comments survive opening a puzzle in Analysis.
  Reuse the branch-aware model for navigation, insertion, editing and clearing.
- Existing Analysis smoke tests now provide TooltipProvider/ResizeObserver and
  open Radix menus by keyboard; add a real puzzle-mistake integration regression.

123 tests in 24 files, application TypeScript and production build passed on this
release source. The unchanged corpus was already validated: no duplicate IDs or
four-field positions, no illegal solution moves, complete rating index. CI also
checks TypeScript and the corpus. Browser production checks follow deployment.
