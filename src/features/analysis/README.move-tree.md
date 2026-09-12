# Analysis move tree invariants

- `AnalysisRecord.mainline` remains the played game.
- `AnalysisMoveNode.children` stores user exploration from the position after that node.
- Inside a user branch, `children[0]` is the primary continuation of that branch; `children[1+]` are nested alternatives.
- Stockfish preview lines are never written into the move tree automatically.
- Engine classification and PGN/user NAG annotations remain separate fields.
- `record.currentPath` is the single selected-position source of truth shared by board, move tree, engine and bottom navigation.
