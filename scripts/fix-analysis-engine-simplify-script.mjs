import fs from "node:fs";

const file = "scripts/apply-analysis-engine-simplify.mjs";
let source = fs.readFileSync(file, "utf8");

source = source.replace(
  '<span>{positionBusy ? "Аналізує…" : currentEngine ? `Готовий${currentEngine.depth ? ` · D${currentEngine.depth}` : ""}` : "Очікує"}</span>',
  '<span>{positionBusy ? "Аналізує…" : currentEngine ? "Готовий" + (currentEngine.depth ? " · D" + currentEngine.depth : "") : "Очікує"}</span>',
);

source = source.replace(
  '<strong>{line.moves.split(" ")[0] || `#${line.rank}`}</strong>',
  '<strong>{line.moves.split(" ")[0] || "#" + line.rank}</strong>',
);

source = source.replace(
  'aria-label={`Додати варіант Stockfish ${line.rank} до дерева`}',
  'aria-label={"Додати варіант Stockfish " + line.rank + " до дерева"}',
);

source = source.replaceAll(
  'title={record.currentPath?.length && record.currentPath.length > 1 ? `Активна лінія: ${navigationLabel}` : `Позиція: ${navigationLabel}`}',
  'title={record.currentPath?.length && record.currentPath.length > 1 ? "Активна лінія: " + navigationLabel : "Позиція: " + navigationLabel}',
);

fs.writeFileSync(file, source);
console.log("Simplification patch script quoting repaired.");
