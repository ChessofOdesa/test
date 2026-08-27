This folder is intended to hold a local Stockfish build used by the app.

Recommended filename: `stockfish.wasm.js` (or `stockfish.js`).

To add a local engine copy (Windows PowerShell):

mkdir -Force public/engines; Invoke-WebRequest -Uri "https://unpkg.com/stockfish.js@10.0.2/stockfish.wasm.js" -OutFile "public/engines/stockfish.wasm.js"

Or using curl (Linux/macOS):

mkdir -p public/engines && curl -L -o public/engines/stockfish.wasm.js https://unpkg.com/stockfish.js@10.0.2/stockfish.wasm.js

Notes:
- The project loader will try local files under `/engines/` first, then fall back to CDN URLs.
- Stockfish is licensed under the GPL — ensure the license is acceptable for your deployment.
- If you prefer using the CDN, no local file is required; the app will use the CDN fallback automatically.
