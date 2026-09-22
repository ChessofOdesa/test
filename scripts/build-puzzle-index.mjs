import { readFile, writeFile, rm } from 'node:fs/promises';
const root = new URL('../public/puzzles/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const index = [];
for (const { file } of manifest.chunks) {
  const puzzles = JSON.parse(await readFile(new URL(file, root), 'utf8'));
  index.push(...puzzles.map(({ id, rating, theme }) => ({ id, rating, theme, file })));
}
// Vercel serves index.* as the directory entry page, shadowing the /puzzles SPA route.
const indexFile = 'rating-index.json';
await writeFile(new URL(indexFile, root), JSON.stringify(index));
await writeFile(new URL('manifest.json', root), JSON.stringify({ ...manifest, indexFile }));
await rm(new URL('index.json', root), { force: true });
