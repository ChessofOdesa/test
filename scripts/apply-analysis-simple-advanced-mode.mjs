import fs from "node:fs";

const centerFile = "src/pages/AnalysisCenter.tsx";
let center = fs.readFileSync(centerFile, "utf8");

center = center.replace(
  'type OverviewFilter = MoveClassification | "all";\ntype BoardBadgeKind = MoveClassification | "book";',
  'type OverviewFilter = MoveClassification | "all";\ntype AnalysisUiMode = "simple" | "advanced";\ntype BoardBadgeKind = MoveClassification | "book";',
);

center = center.replace(
  '    const [overviewFilter, setOverviewFilter] = useState<OverviewFilter>("all");',
  '    const [overviewFilter, setOverviewFilter] = useState<OverviewFilter>("all");\n    const [analysisUiMode, setAnalysisUiMode] = useState<AnalysisUiMode>("simple");',
);

center = center.replace(
  '                const node = renderedMoves.find(entry => isSamePath(entry.path, path))?.node;\n                const childIndex = node?.children.length || 0;',
  '                const node = getNodeByPath(current.mainline, path);\n                const childIndex = node?.children.length || 0;',
);
center = center.replace(
  '    }, [currentFen, currentNode?.ply, linePreview, renderedMoves]);',
  '    }, [currentFen, currentNode?.ply, linePreview]);',
);

const settingsMarker = '                        <PopoverContent side="right" align="center" className="analysis-settings-popover">\n                            <div className="analysis-popover-heading"><strong>Движок</strong><span>Глибина</span></div>';
const settingsReplacement = `                        <PopoverContent side="right" align="center" className="analysis-settings-popover">
                            <div className="analysis-popover-heading"><strong>Інтерфейс</strong><span>Режим</span></div>
                            <div className="analysis-ui-mode-options" role="group" aria-label="Режим Analysis">
                                <button type="button" className={cn(analysisUiMode === "simple" && "is-active")} aria-pressed={analysisUiMode === "simple"} onClick={() => setAnalysisUiMode("simple")}>
                                    <strong>Простий</strong><span>Менше деталей</span>
                                </button>
                                <button type="button" className={cn(analysisUiMode === "advanced" && "is-active")} aria-pressed={analysisUiMode === "advanced"} onClick={() => setAnalysisUiMode("advanced")}>
                                    <strong>Розширений</strong><span>Depth і MultiPV</span>
                                </button>
                            </div>

                            <div className="analysis-popover-heading analysis-popover-subheading"><strong>Движок</strong><span>Глибина</span></div>`;
if (!center.includes("analysis-ui-mode-options")) {
  if (!center.includes(settingsMarker)) throw new Error("Settings marker not found");
  center = center.replace(settingsMarker, settingsReplacement);
}

const evaluationMarker = `                                        <div className="analysis-engine-evaluation-simple" aria-live="polite">
                                            <strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong>
                                            <span>{engineVerdict(currentEngine?.numericScore)}</span>
                                        </div>`;
const evaluationReplacement = `${evaluationMarker}

                                        {analysisUiMode === "advanced" && (
                                            <div className="analysis-engine-advanced-meta" aria-label="Розширені дані движка">
                                                <span><small>Глибина</small><strong>{currentEngine?.depth ? "D" + currentEngine.depth : "—"}</strong></span>
                                                <span><small>MultiPV</small><strong>{multiPv}</strong></span>
                                                <span><small>Джерело</small><strong>{currentEngine?.backend === "cloud" ? "Cloud" : currentEngine?.backend === "native" ? "Server" : "Browser"}</strong></span>
                                            </div>
                                        )}

                                        {analysisUiMode === "advanced" && currentNode?.classification && currentNode.evalLoss != null && (
                                            <div className="analysis-engine-selected-advanced" aria-label="Деталі вибраного ходу">
                                                <div><span>Вибраний хід</span><strong>{currentNode.moveNumber}{currentNode.color === "w" ? "." : "..."} {currentNode.san}</strong></div>
                                                <span className={"analysis-classification analysis-classification-" + currentNode.classification}>{CLASSIFICATION_MARKS[currentNode.classification]}</span>
                                                <small>Втрата {(currentNode.evalLoss / 100).toFixed(2)}</small>
                                            </div>
                                        )}`;
if (!center.includes("analysis-engine-advanced-meta")) {
  if (!center.includes(evaluationMarker)) throw new Error("Engine evaluation marker not found");
  center = center.replace(evaluationMarker, evaluationReplacement);
}

center = center.replace(
  '{currentEngine.pvSan.length > 0 && <p>{currentEngine.pvSan.slice(0, 5).join(" ")}</p>}',
  '{currentEngine.pvSan.length > 0 && <p>{currentEngine.pvSan.slice(0, analysisUiMode === "advanced" ? 8 : 5).join(" ")}</p>}',
);

fs.writeFileSync(centerFile, center);

const cssFile = "src/styles/analysis-panel-professional.css";
let css = fs.readFileSync(cssFile, "utf8");
if (!css.includes(".analysis-ui-mode-options")) {
  const marker = "/* Engine — simplified hierarchy: status → evaluation → best move → optional alternatives. */";
  const addition = `.analysis-ui-mode-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 6px;
}
.analysis-ui-mode-options button {
  min-width: 0;
  display: grid;
  gap: 2px;
  padding: 8px 9px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  text-align: left;
  background: white;
}
.analysis-ui-mode-options button:hover { background: #f8fafd; }
.analysis-ui-mode-options button.is-active { border-color: #9fb8dc; background: #edf4fd; box-shadow: inset 3px 0 0 hsl(var(--primary)); }
.analysis-ui-mode-options button strong { font-size: .72rem; }
.analysis-ui-mode-options button span { color: hsl(var(--muted-foreground)); font-size: .6rem; }
.analysis-ui-mode-options button:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 1px; }

`;
  if (!css.includes(marker)) throw new Error("Engine CSS marker not found");
  css = css.replace(marker, addition + marker);
}

if (!css.includes(".analysis-engine-advanced-meta")) {
  const marker = ".analysis-best-move-simple {";
  const addition = `.analysis-engine-advanced-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 5px;
}
.analysis-engine-advanced-meta > span {
  min-width: 0;
  display: grid;
  gap: 1px;
  padding: 6px 7px;
  border: 1px solid #e1e7ef;
  border-radius: 7px;
  background: #fbfcfe;
}
.analysis-engine-advanced-meta small { color: hsl(var(--muted-foreground)); font-size: .55rem; }
.analysis-engine-advanced-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #314b6d; font-size: .68rem; }
.analysis-engine-selected-advanced {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto auto;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
  background: #fafbfd;
}
.analysis-engine-selected-advanced > div { min-width: 0; display: grid; gap: 1px; }
.analysis-engine-selected-advanced > div span { color: hsl(var(--muted-foreground)); font-size: .55rem; }
.analysis-engine-selected-advanced > div strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .7rem; }
.analysis-engine-selected-advanced > small { color: #6d7b8d; font-size: .6rem; font-weight: 700; }

`;
  if (!css.includes(marker)) throw new Error("Best move CSS marker not found");
  css = css.replace(marker, addition + marker);
}

fs.writeFileSync(cssFile, css);

const testFile = "src/test/analysis.smoke.test.tsx";
let test = fs.readFileSync(testFile, "utf8");
if (!test.includes("switches between simple and advanced Analysis UI")) {
  const marker = '    it("previews the best move from the simplified engine card", async () => {';
  const testCase = `    it("switches between simple and advanced Analysis UI without cluttering the default", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));
        expect(screen.queryByLabelText("Розширені дані движка")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Налаштування аналізу" }));
        expect(screen.getByRole("button", { name: /Простий/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: /Розширений/i }));
        expect(screen.getByRole("button", { name: /Розширений/i })).toHaveAttribute("aria-pressed", "true");
        fireEvent.click(screen.getByRole("button", { name: "Налаштування аналізу" }));

        const advanced = await screen.findByLabelText("Розширені дані движка");
        expect(within(advanced).getByText("Глибина")).toBeInTheDocument();
        expect(within(advanced).getByText("MultiPV")).toBeInTheDocument();
    });

`;
  if (!test.includes(marker)) throw new Error("Smoke-test insertion marker not found");
  test = test.replace(marker, testCase + marker);
}
fs.writeFileSync(testFile, test);

console.log("Analysis Simple/Advanced mode patch applied.");
