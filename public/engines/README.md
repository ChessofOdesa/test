# Browser engine

The bundled files contain Stockfish `2019-08-15 64 POPCNT Multi-Variant`,
compiled by the stockfish.js project. The app identifies this backend as
Stockfish; it does not claim it is Stockfish 18.

`stockfish.worker.js` loads the existing `stockfish.wasm.js` and `stockfish.wasm`
from the same directory. The browser manager waits for `uciok`, then `readyok`,
before requesting a position. Keep the build's fixed defaults of one thread and
16 MB hash: sending a Threads reconfiguration stalls this WASM build.

The computer room uses this local worker only. If it fails, an explicitly named
local fallback computes legal computer moves in a separate worker. Hints and
position evaluations never use that fallback. Analysis can also use the configured
server evaluation endpoint and a separately configured native engine bridge.

The existing Stockfish source attribution and GPLv3 notice are retained in
`stockfish.wasm.js`. Upstream: https://github.com/niklasf/stockfish.js
