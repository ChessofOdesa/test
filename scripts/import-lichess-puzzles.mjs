// Input: JSONL rows decoded from the official Lichess CSV export (CC0).
// Usage: node scripts/import-lichess-puzzles.mjs /path/to/sample.jsonl 10000
import { readFile, writeFile } from 'node:fs/promises';
import { Chess } from 'chess.js';
const root = new URL('../public/puzzles/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const rows = (await readFile(process.argv[2], 'utf8')).trim().split('\n').map(JSON.parse);
const target = Number(process.argv[3] || 10000);
if (!Number.isSafeInteger(target) || target <= 0) throw new Error('Requested count must be a positive integer');
const themes = [ ['defensiveMove','Захисний хід'], ['quietMove','Тихий хід'], ['zugzwang','Цугцванг'], ['exposedKing','Відкритий король'], ['kingsideAttack','Атака на королівському фланзі'], ['queensideAttack','Атака на ферзевому фланзі'], ['underPromotion','Слабке перетворення'], ['mateIn2','Мат у 2'], ['mateIn3','Мат у 3'], ['doubleCheck','Подвійний шах'], ['interference','Перекриття'], ['intermezzo','Проміжний хід'], ['deflection','Відволікання'], ['pin','Зв’язка'], ['skewer','Наскрізний напад'], ['attraction','Заманювання'], ['clearance','Звільнення поля'], ['discoveredAttack','Відкритий напад'], ['backRankMate','Мат на останній горизонталі'], ['promotion','Перетворення пішака'], ['sacrifice','Жертва'], ['fork','Вилка'], ['opening','Дебют'], ['rookEndgame','Туровий ендшпіль'], ['pawnEndgame','Пішаковий ендшпіль'] ];
const known = new Set(), ids = new Set();
for (const {file} of manifest.chunks) for (const p of JSON.parse(await readFile(new URL(file,root),'utf8'))) { known.add(p.fen.split(' ').slice(0,4).join(' ')); ids.add(p.id); }
const queues = themes.map(([tag]) => rows.filter(r => r.Themes.split(' ').includes(tag)));
const added = [], counts = {};
const cursors = queues.map(() => 0);
while (added.length < target && queues.some((q, i) => cursors[i] < q.length)) {
 for (let i=0;i<themes.length && added.length<target;i++) {
  while(cursors[i] < queues[i].length) {
   const row=queues[i][cursors[i]++], id='lichess-'+row.PuzzleId;
   if(ids.has(id)) continue;
   try {
    const moves=row.Moves.split(' '), game=new Chess(row.FEN);
    const apply=uci=>game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]});
    const setupMove=moves.shift(); apply(setupMove); const fen=game.fen(), key=fen.split(' ').slice(0,4).join(' ');
    if(known.has(key)||!moves.length||moves.length%2!==1||game.isGameOver())continue;
    moves.forEach(apply);
    const theme=themes[i][1];
    added.push({id,fen,solution:moves,title:`Lichess ${row.PuzzleId}`,theme,rating:Number(row.Rating),sourceId:row.PuzzleId,tags:row.Themes.split(' '),setupMove});
    ids.add(id);known.add(key);counts[theme]=(counts[theme]||0)+1;break;
   } catch { /* Exclude malformed/illegal source rows. */ }
  }
 }
}
if(added.length!==target)throw new Error(`Only ${added.length} valid new puzzles; requested ${target}`);
for(let offset=0;offset<added.length;offset+=400) {
 const file=`lichess-${String(manifest.chunks.length+1).padStart(2,'0')}.json`, batch=added.slice(offset,offset+400);
 await writeFile(new URL(file,root),JSON.stringify(batch));
 manifest.chunks.push({file,count:batch.length,themes:[...new Set(batch.map(p=>p.theme))]});
}
manifest.count+=added.length;manifest.themes=[...new Set(manifest.chunks.flatMap(c=>c.themes))];
await writeFile(new URL('manifest.json',root),JSON.stringify(manifest));
await import('./build-puzzle-index.mjs');
console.log(JSON.stringify({added:added.length,total:manifest.count,themes:counts}));
