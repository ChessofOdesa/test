# Analysis panel professional polish

The right Analysis panel keeps one shared structure across all tabs:

1. tabs;
2. independently scrollable content;
3. one pinned game navigator.

## Responsibility map

- **Ходи**: mainline, inline user variations, comments, move selection, autoplay, jump/filter tools.
- **Движок**: current-position evaluation, Stockfish status, best move, MultiPV previews and explicit opt-in saving of an engine line into the move tree.
- **Огляд**: full-review progress, accuracy, classification summary, category filtering and key moments.
- **Інфо**: PGN metadata, players/ratings, event details, opening/ECO, initial FEN, full PGN preview and PGN copy/download.
- **Left toolbar / Settings**: engine ON/OFF, engine depth, MultiPV and board appearance settings.
- **Global More menu**: FEN copy for a root position, board flip and destructive cleanup actions. Selected-move FEN copy is in its context menu.

## Invariants

- `record.currentPath` remains the single selection source for board, move tree, engine, overview and bottom navigation.
- Stockfish lines are previews until the user explicitly chooses **Додати до варіантів**.
- Engine classifications come from review data; they are never generated from presentation code.
- Opening/book badges only appear when the existing opening matcher confirms the selected mainline ply.
- The move-tree UI does not display labels such as `Ваш варіант`; branch semantics are communicated by indentation, a thin rail and a light background.
