# Analysis move tree invariants

- `AnalysisRecord.mainline` remains the played game.
- `AnalysisMoveNode.children` stores user exploration from the position after that node.
- Inside a user branch, `children[0]` is the primary continuation of that branch; `children[1+]` are nested alternatives.
- Stockfish preview lines are never written into the move tree automatically.
- Engine classification and PGN/user NAG annotations remain separate fields.
- `record.currentPath` is the single selected-position source of truth shared by board, move tree, engine and bottom navigation.
- Previous/Next/End use the existing path helpers, never the flattened render order. A branch returns to its parent, and Next follows its primary continuation. The footer counts half-moves in the selected line.
- Autoplay follows the same continuation as Next. Keyboard navigation ignores text fields, dialogs, menus, sliders and tab controls.
- Replaying a stored move selects its existing path. A different first move in a nonempty game is rejected explicitly because this model has no root variation container.
- Position-engine results must match the requested FEN, depth and MultiPV before appearing. Searches use the existing Stockfish Web Worker with a 1500 ms time bound; its returned depth is displayed.
- Full review owns its AbortController and suspends position searches. Import, reset, mainline replacement, stop, Engine OFF and unmount invalidate its work. A late result cannot annotate a replacement node.
- The temporary Stockfish preview stays separate from saved moves. Its footer and keyboard use the same preview index; returning restores the selected game position.
