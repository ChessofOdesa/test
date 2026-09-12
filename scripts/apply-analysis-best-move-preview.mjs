import fs from "node:fs";

const centerFile = "src/pages/AnalysisCenter.tsx";
let center = fs.readFileSync(centerFile, "utf8");

const navigationImport = 'import { analysisNavigationLabel, lastAnalysisPath, nextAnalysisPath, previousAnalysisPath, sameAnalysisPath } from "@/features/analysis/navigation";';
const previewImport = 'import { buildSanLinePreview } from "@/features/analysis/preview";';
if (!center.includes(previewImport)) {
  if (!center.includes(navigationImport)) throw new Error("Analysis navigation import marker not found");
  center = center.replace(navigationImport, `${navigationImport}\n${previewImport}`);
}

const downloadBlock = `    const downloadPgn = () => {
        if (!record.mainline.length) return;
        const pgn = buildAnalysisPgn(record);
        const blob = new Blob([pgn], { type: "application/x-chess-pgn;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "chess-of-odesa-analysis.pgn";
        anchor.click();
        URL.revokeObjectURL(url);
    };`;

const previewCallback = `${downloadBlock}

    const previewReviewedBestMove = useCallback(() => {
        if (!record.currentPath) {
            setTab("engine");
            return;
        }
        const node = getNodeByPath(record.mainline, record.currentPath);
        if (!node?.bestMoveSan) {
            setTab("engine");
            return;
        }

        const storedLine = node.alternatives.length ? node.alternatives : [node.bestMoveSan];
        let preview = buildSanLinePreview(node.fenBefore, storedLine);
        if (!preview && storedLine[0] !== node.bestMoveSan) {
            preview = buildSanLinePreview(node.fenBefore, [node.bestMoveSan]);
        }
        if (!preview) {
            toast.info("Не вдалося показати збережену найкращу лінію на дошці.");
            setTab("engine");
            return;
        }

        setLinePreview({
            label: \`Краще: \${node.bestMoveSan}\`,
            fens: preview.fens,
            moves: preview.moves,
            index: 0,
        });
        setTab("engine");
    }, [record.currentPath, record.mainline]);`;

if (!center.includes("const previewReviewedBestMove = useCallback")) {
  if (!center.includes(downloadBlock)) throw new Error("downloadPgn marker not found");
  center = center.replace(downloadBlock, previewCallback);
}

const treeUsage = `                            <AnalysisMoveTree
                                record={record}
                                setRecord={setRecord}
                                onNavigate={navigateTo}
                                onOpenEngine={() => setTab("engine")}
                            />`;
const treeUsageWithPreview = `                            <AnalysisMoveTree
                                record={record}
                                setRecord={setRecord}
                                onNavigate={navigateTo}
                                onOpenEngine={() => setTab("engine")}
                                onPreviewBestMove={previewReviewedBestMove}
                            />`;
if (!center.includes("onPreviewBestMove={previewReviewedBestMove}")) {
  if (!center.includes(treeUsage)) throw new Error("AnalysisMoveTree usage marker not found");
  center = center.replace(treeUsage, treeUsageWithPreview);
}

fs.writeFileSync(centerFile, center);

const treeFile = "src/features/analysis/AnalysisMoveTree.tsx";
let tree = fs.readFileSync(treeFile, "utf8");

const propsBlock = `    onNavigate,
    onOpenEngine,
}: {
    record: AnalysisRecord;
    setRecord: Dispatch<SetStateAction<AnalysisRecord>>;
    onNavigate: (path: number[] | null) => void;
    onOpenEngine: () => void;
}) {`;
const propsWithPreview = `    onNavigate,
    onOpenEngine,
    onPreviewBestMove,
}: {
    record: AnalysisRecord;
    setRecord: Dispatch<SetStateAction<AnalysisRecord>>;
    onNavigate: (path: number[] | null) => void;
    onOpenEngine: () => void;
    onPreviewBestMove?: () => void;
}) {`;
if (!tree.includes("onPreviewBestMove?: () => void")) {
  if (!tree.includes(propsBlock)) throw new Error("AnalysisMoveTree props marker not found");
  tree = tree.replace(propsBlock, propsWithPreview);
}

const oldBestButton = '<button type="button" onClick={onOpenEngine}>Краще: {selectedNode.bestMoveSan} <ChevronRight size={13} /></button>';
const newBestButton = '<button type="button" onClick={onPreviewBestMove || onOpenEngine}>Краще: {selectedNode.bestMoveSan} <ChevronRight size={13} /></button>';
if (!tree.includes("onClick={onPreviewBestMove || onOpenEngine}")) {
  if (!tree.includes(oldBestButton)) throw new Error("Best-move inspector button marker not found");
  tree = tree.replace(oldBestButton, newBestButton);
}

fs.writeFileSync(treeFile, tree);
console.log("Best-move preview integration applied.");
