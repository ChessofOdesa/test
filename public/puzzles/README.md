# Training positions

5,000 positions from the existing Lichess puzzle export. Source: https://database.lichess.org/#puzzles (CC0).

Each position is normalized to the solver's turn: the original first setup move has already been applied. `solution` contains UCI moves beginning with the solver's answer, alternating with the opponent. Promotions retain their fifth character. All included lines were replayed successfully with chess.js; this is a legality check, not a new engine evaluation. The “Мат в 1” category includes only lines ending in checkmate after one solver move.

The manifest lists 13 sets, at most 400 positions each. The client fetches one set at a time and filters within matching sets. No puzzle database is bundled into the initial application JavaScript.
