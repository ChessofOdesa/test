# Training positions

25,000 positions in 29 primary themes from the [Lichess puzzle database](https://database.lichess.org/#puzzles), CC0.
The original 5,000 IDs and sets remain unchanged. The 20,000 added positions were
selected from the September 10, 2026 official export on September 21, 2026.

New positions retain the source PuzzleId (`sourceId`), original theme tags and
setup move. Selection streamed the first 120,000 CSV rows, filtered popularity
>=80, plays >=100 and rating deviation <=100, then balanced 25 tactical/endgame
categories. Rarer categories contribute fewer positions; this is a curated subset,
not the full Lichess database or a claim of equal difficulty distribution.

Each FEN is normalized to the solver's turn by applying the first source move.
`solution` starts with the solver's answer. All included lines were replayed using
chess.js. IDs and normalized four-field FEN keys are unique across the full set.
This verifies legality and duplication, not a new engine evaluation of all tasks.

The 63 chunks contain at most 400 positions each. The metadata index selects a
puzzle by theme/rating, then the app downloads its chunk. Source puzzle data is not
bundled into the initial JavaScript. Links use stable local IDs and no answers.

## Import workflow

The downloader requires Python `zstandard`; the importer uses installed chess.js.
Keep the intermediate JSONL outside the repository:

```sh
python scripts/download-lichess-sample.py /path/to/sample.jsonl 120000
node scripts/import-lichess-puzzles.mjs /path/to/sample.jsonl 10000
```

The importer rebuilds the rating index automatically and skips existing IDs/positions and rejects illegal lines. It fails if
it cannot reach the requested new count; no manifest is written in that case.
