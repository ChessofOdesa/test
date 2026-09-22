// Validate the shipped corpus and its lookup index without network access.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { Chess } from 'chess.js';

const root = new URL('../public/puzzles/', import.meta.url);
assert(!(await readdir(root)).some(file => /^index\./i.test(file)), 'A directory index shadows the /puzzles SPA route on Vercel');
const read = async file => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const manifest = await read('manifest.json');
const ids = new Set(), positions = new Set(), themes = new Set(), expectedIndex = [];
for (const chunk of manifest.chunks) {
  const puzzles = await read(chunk.file);
  assert.equal(puzzles.length, chunk.count, chunk.file);
  assert(puzzles.length <= 400, `Oversized chunk: ${chunk.file}`);
  const chunkThemes = new Set();
  for (const puzzle of puzzles) {
    assert(!ids.has(puzzle.id), `Duplicate ID: ${puzzle.id}`);
    const game = new Chess(puzzle.fen);
    const key = game.fen().split(' ').slice(0, 4).join(' ');
    assert(!positions.has(key), `Duplicate position: ${puzzle.id}`);
    assert(Number.isInteger(puzzle.rating) && puzzle.rating >= 100 && puzzle.rating <= 4000, puzzle.id);
    assert(puzzle.solution.length > 0 && puzzle.solution.length % 2 === 1, puzzle.id);
    assert(!game.isGameOver(), `Terminal start: ${puzzle.id}`);
    for (const move of puzzle.solution) {
      assert(/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move), puzzle.id);
      assert(!game.isGameOver(), `Move after game end: ${puzzle.id}`);
      game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] });
    }
    ids.add(puzzle.id); positions.add(key); themes.add(puzzle.theme); chunkThemes.add(puzzle.theme);
    expectedIndex.push({ id: puzzle.id, rating: puzzle.rating, theme: puzzle.theme, file: chunk.file });
  }
  assert.deepEqual([...chunkThemes].sort(), [...chunk.themes].sort(), chunk.file);
}
assert.equal(ids.size, manifest.count);
assert.deepEqual([...themes].sort(), [...manifest.themes].sort());
assert.deepEqual(await read(manifest.indexFile), expectedIndex);
console.log(JSON.stringify({ count: ids.size, themes: themes.size, chunks: manifest.chunks.length, duplicateIds: 0, duplicatePositions: 0, illegalLines: 0, index: 'consistent' }));
