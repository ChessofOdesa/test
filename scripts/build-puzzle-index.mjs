import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../public/puzzles/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const index = [];
for (const { file } of manifest.chunks) {
  const puzzles = JSON.parse(await readFile(new URL(file, root), 'utf8'));
  index.push(...puzzles.map(({ id, rating, theme }) => ({ id, rating, theme, file })));
}
await writeFile(new URL('index.json', root), JSON.stringify(index));
await writeFile(new URL('manifest.json', root), JSON.stringify({ ...manifest, indexFile: 'index.json' }));
