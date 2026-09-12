import fs from "node:fs";

const file = "src/pages/AnalysisCenter.tsx";
let source = fs.readFileSync(file, "utf8");

const importMarker = 'import AnalysisMoveTree from "@/features/analysis/AnalysisMoveTree";';
const importReplacement = `${importMarker}\nimport AnalysisEvaluationGraph from "@/features/analysis/AnalysisEvaluationGraph";`;

if (!source.includes('AnalysisEvaluationGraph from "@/features/analysis/AnalysisEvaluationGraph"')) {
  if (!source.includes(importMarker)) throw new Error("AnalysisMoveTree import marker not found");
  source = source.replace(importMarker, importReplacement);
}

const accuracyBlock = `                                        <div className="analysis-accuracy-grid">\n                                            <div><span>Білі</span><strong>{whiteAccuracy ?? "—"}%</strong></div>\n                                            <div><span>Загальна</span><strong>{overallAccuracy ?? "—"}%</strong></div>\n                                            <div><span>Чорні</span><strong>{blackAccuracy ?? "—"}%</strong></div>\n                                        </div>`;

const graphBlock = `${accuracyBlock}\n\n                                        <AnalysisEvaluationGraph\n                                            record={record}\n                                            currentPath={record.currentPath}\n                                            onNavigate={navigateTo}\n                                        />`;

if (!source.includes("<AnalysisEvaluationGraph")) {
  if (!source.includes(accuracyBlock)) throw new Error("Overview accuracy grid marker not found");
  source = source.replace(accuracyBlock, graphBlock);
}

fs.writeFileSync(file, source);
console.log("Analysis evaluation graph integration applied.");
