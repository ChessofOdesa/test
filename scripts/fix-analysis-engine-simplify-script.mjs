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

const footerPatchStart = source.indexOf('const oldFooter = `');
const footerWrite = 'fs.writeFileSync(centerFile, center);';
const footerPatchEndIndex = source.indexOf(footerWrite, footerPatchStart);
if (footerPatchStart < 0 || footerPatchEndIndex < 0) throw new Error("Footer patch section not found in one-time script");

const positionalFooterPatch = `const footerStartMarker = '                    <div className="analysis-panel-navigation"';
const footerStart = center.lastIndexOf(footerStartMarker);
const footerEndMarker = '\\n                </aside>';
const footerEnd = center.indexOf(footerEndMarker, footerStart);
if (footerStart < 0 || footerEnd < 0) throw new Error("Footer navigation block not found");
const newFooter = \`                    <div className="analysis-panel-navigation analysis-panel-navigation-simple" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={19} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? "Активна лінія: " + navigationLabel : "Позиція: " + navigationLabel}>{navigationLabel}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={19} />} onClick={goNext} disabled={!canGoNext} />
                    </div>\`;
center = center.slice(0, footerStart) + newFooter + center.slice(footerEnd);
fs.writeFileSync(centerFile, center);`;

source = source.slice(0, footerPatchStart) + positionalFooterPatch + source.slice(footerPatchEndIndex + footerWrite.length);

fs.writeFileSync(file, source);
console.log("Simplification patch script repaired.");
