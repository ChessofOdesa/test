import fs from "node:fs";

const modelFile = "src/features/analysis/model.tsx";
let model = fs.readFileSync(modelFile, "utf8");

const functionMarker = `export function createMoveNode(move: {
    san: string;
    from: string;
    to: string;
    color: "w" | "b";
    promotion?: string;
}, fenBefore: string, fenAfter: string, ply: number): AnalysisMoveNode {
    return {`;

const functionReplacement = `export function createMoveNode(move: {
    san: string;
    from: string;
    to: string;
    color: "w" | "b";
    promotion?: string;
}, fenBefore: string, fenAfter: string, ply: number): AnalysisMoveNode {
    const fenFields = fenBefore.trim().split(/\\s+/);
    const fenFullmove = Number(fenFields[5]);
    const moveNumber = Number.isFinite(fenFullmove) && fenFullmove > 0
        ? Math.trunc(fenFullmove)
        : Math.floor((ply + 1) / 2);
    return {`;

if (!model.includes("const fenFullmove = Number(fenFields[5]);")) {
    if (!model.includes(functionMarker)) throw new Error("createMoveNode marker not found");
    model = model.replace(functionMarker, functionReplacement);
}
model = model.replace("        moveNumber: Math.floor((ply + 1) / 2),", "        moveNumber,");
fs.writeFileSync(modelFile, model);

const treeFile = "src/features/analysis/AnalysisMoveTree.tsx";
let tree = fs.readFileSync(treeFile, "utf8");

const importMarker = 'import { cn } from "@/lib/utils";';
const helperImport = 'import { promoteVariationPath } from "@/features/analysis/branching";';
if (!tree.includes(helperImport)) {
    if (!tree.includes(importMarker)) throw new Error("Move tree import marker not found");
    tree = tree.replace(importMarker, helperImport + "\n" + importMarker);
}

tree = tree.replace(/\nfunction tailToBranch\(nodes: AnalysisMoveNode\[\]\): AnalysisMoveNode \| null \{[\s\S]*?\n\}\n\nfunction detachPrimaryBranch\(node: AnalysisMoveNode\): AnalysisMoveNode\[\] \{[\s\S]*?\n\}\n/, "\n");

tree = tree.replace(
    "    const moveCount = Math.ceil(record.mainline.length / 2);",
    "    const moveCount = new Set(record.mainline.map(node => node.moveNumber)).size;",
);

const promoteStart = tree.indexOf("    const promoteVariation = () => {");
const promoteEnd = tree.indexOf("\n\n    const returnToMainline = () => {", promoteStart);
if (promoteStart < 0 || promoteEnd < 0) throw new Error("promoteVariation block markers not found");
const promoteReplacement = `    const promoteVariation = () => {
        if (!promotePath || promotePath.length < 2) return;
        const promoted = promoteVariationPath(record.mainline, promotePath);
        if (!promoted) return;

        setRecord(current => ({
            ...current,
            mainline: promoted.mainline,
            currentPath: promoted.currentPath,
        }));
        setPromotePath(null);
        toast.success("Варіант став основною лінією. Стара лінія збережена як варіант.");
    };`;
tree = tree.slice(0, promoteStart) + promoteReplacement + tree.slice(promoteEnd);

tree = tree.replace(
    '{entry.path.length === 2 && <DropdownMenuItem onSelect={() => setPromotePath(entry.path)}><GitBranch size={15} className="mr-2" />Зробити основною лінією</DropdownMenuItem>}',
    '{entry.path.length > 1 && <DropdownMenuItem onSelect={() => setPromotePath(entry.path)}><GitBranch size={15} className="mr-2" />Зробити основною лінією</DropdownMenuItem>}',
);

fs.writeFileSync(treeFile, tree);
console.log("Analysis move-tree FEN numbering and nested promotion patch applied.");
