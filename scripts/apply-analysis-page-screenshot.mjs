import fs from "node:fs";

const centerFile = "src/pages/AnalysisCenter.tsx";
let center = fs.readFileSync(centerFile, "utf8");

const cssImport = 'import "@/styles/analysis-page-screenshot.css";';
if (!center.includes(cssImport)) {
  center = center.replace(
    'import "@/styles/analysis-panel-professional.css";',
    'import "@/styles/analysis-panel-professional.css";\n' + cssImport,
  );
}

const renderedMarker = '    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);';
if (!center.includes('const mainlineRows = useMemo(() =>')) {
  const rowsBlock = `
    const mainlineRows = useMemo(() => {
        const rows = new Map<number, {
            number: number;
            white: { index: number; node: AnalysisMoveNode } | null;
            black: { index: number; node: AnalysisMoveNode } | null;
        }>();
        record.mainline.forEach((node, index) => {
            const row = rows.get(node.moveNumber) || { number: node.moveNumber, white: null, black: null };
            if (node.color === "w") row.white = { index, node };
            else row.black = { index, node };
            rows.set(node.moveNumber, row);
        });
        return [...rows.values()].sort((a, b) => a.number - b.number);
    }, [record.mainline]);
`;
  if (!center.includes(renderedMarker)) throw new Error("renderedMoves marker not found");
  center = center.replace(renderedMarker, renderedMarker + "\n" + rowsBlock);
}

if (!center.includes('const updatePositionComment = useCallback')) {
  const marker = '    const startFullReview = async () => {';
  const block = `
    const updatePositionComment = useCallback((value: string) => {
        const selectedPath = record.currentPath;
        if (!selectedPath) return;
        setRecord(current => ({
            ...current,
            mainline: updateNodeAtPath(current.mainline, selectedPath, node => {
                node.comment = value;
            }),
        }));
    }, [record.currentPath]);

`;
  if (!center.includes(marker)) throw new Error("startFullReview marker not found");
  center = center.replace(marker, block + marker);
}

center = center.replace(
`    const panelTabs: Array<{ id: PanelTab; label: string; icon: typeof Clipboard }> = [
        { id: "moves", label: "Ходи", icon: Clipboard },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "overview", label: "Огляд", icon: BarChart3 },
        { id: "info", label: "Інфо", icon: Info },
    ];`,
`    const panelTabs: Array<{ id: PanelTab; label: string; icon: typeof Clipboard }> = [
        { id: "overview", label: "Огляд", icon: BarChart3 },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "moves", label: "Ходи", icon: Clipboard },
        { id: "info", label: "Інфо", icon: Info },
    ];`,
);

center = center.replace(
  '    const moveCount = Math.ceil(record.mainline.length / 2);',
  '    const moveCount = new Set(record.mainline.map(node => node.moveNumber)).size;',
);

center = center.replace(
  '<div className="analysis-center">',
  '<div className="analysis-center analysis-center-v3">',
);

const engineStart = center.indexOf('                        {tab === "engine" && (');
const engineEnd = center.indexOf('\n\n                        {tab === "overview" && (', engineStart);
if (engineStart < 0 || engineEnd < 0) throw new Error("engine block markers not found");

const engineBlock = `                        {tab === "engine" && (
                            <div className="analysis-engine-workspace-v3">
                                <section className="analysis-engine-control-v3" aria-label="Керування Stockfish">
                                    <div className="analysis-engine-control-main-v3">
                                        <BrainCircuit size={22} />
                                        <div>
                                            <strong>{engineSource(currentEngine)}</strong>
                                            <span>{positionBusy ? "Аналізує позицію…" : currentEngine ? "Готовий" : engineEnabled ? "Очікує позицію" : "Вимкнено"}</span>
                                        </div>
                                    </div>
                                    <div className="analysis-engine-control-actions-v3">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-label="Stockfish"
                                            aria-checked={engineEnabled}
                                            className="analysis-engine-toggle-v3"
                                            onClick={() => setEngineEnabled(value => !value)}
                                        />
                                        <button type="button" className="analysis-engine-settings-v3" aria-label="Налаштувати движок" onClick={() => setSettingsOpen(true)}>
                                            <Settings2 size={17} />
                                        </button>
                                    </div>
                                </section>

                                <div className="analysis-engine-meta-v3">
                                    <span>Глибина <b>{currentEngine?.depth || engineDepth}</b></span>
                                    <i aria-hidden="true" />
                                    <span><b>{Math.min(3, multiPv)}</b> {Math.min(3, multiPv) === 1 ? "варіант" : "варіанти"}</span>
                                    <button type="button" onClick={() => setSettingsOpen(true)}>Налаштування</button>
                                </div>

                                {engineEnabled && (
                                    <>
                                        <div className="analysis-engine-verdict-v3" aria-live="polite">
                                            <strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong>
                                            <span>{engineVerdict(currentEngine?.numericScore)}</span>
                                        </div>

                                        {analysisUiMode === "advanced" && (
                                            <div className="analysis-engine-advanced-v3" aria-label="Розширені дані движка">
                                                <span><small>MultiPV</small><b>{multiPv}</b></span>
                                                <span><small>Джерело</small><b>{currentEngine?.backend === "cloud" ? "Cloud" : currentEngine?.backend === "native" ? "Server" : "Browser"}</b></span>
                                                <span><small>Вибраний хід</small><b>{currentNode ? String(currentNode.moveNumber) + (currentNode.color === "w" ? ". " : "... ") + currentNode.san : "—"}</b></span>
                                            </div>
                                        )}

                                        {linePreview && (
                                            <div className="analysis-preview-bar analysis-preview-bar-simple" aria-live="polite">
                                                <div>
                                                    <strong>{linePreview.label}</strong>
                                                    <span>{linePreview.moves.slice(0, linePreview.index + 1).join(" ")}</span>
                                                </div>
                                                <div className="analysis-preview-controls">
                                                    <NavIconButton label="Попередній хід preview" icon={<ChevronLeft size={16} />} disabled={linePreview.index <= 0} onClick={() => setLinePreview(current => current ? { ...current, index: Math.max(0, current.index - 1) } : null)} />
                                                    <span>{linePreview.index + 1}/{linePreview.fens.length}</span>
                                                    <NavIconButton label="Наступний хід preview" icon={<ChevronRight size={16} />} disabled={linePreview.index >= linePreview.fens.length - 1} onClick={() => setLinePreview(current => current ? { ...current, index: Math.min(current.fens.length - 1, current.index + 1) } : null)} />
                                                    <Button variant="ghost" size="sm" onClick={() => setLinePreview(null)}><RotateCcw size={15} />До партії</Button>
                                                </div>
                                            </div>
                                        )}

                                        {positionError ? <div className="analysis-error">{positionError}</div> : null}

                                        <div className="analysis-engine-lines-v3" aria-label="Варіанти Stockfish">
                                            {engineLines.length ? engineLines.slice(0, 3).map((line, index) => (
                                                <div
                                                    key={line.id}
                                                    data-testid="analysis-engine-line"
                                                    className={cn("analysis-engine-line-v3", index === 0 && "is-primary")}
                                                    aria-label={index === 0 ? "Найкращий хід Stockfish" : "Варіант Stockfish " + line.rank}
                                                >
                                                    <button
                                                        type="button"
                                                        className="analysis-engine-line-preview-v3"
                                                        aria-label={index === 0 ? "Показати на дошці найкращий варіант" : "Показати на дошці варіант " + line.rank}
                                                        onClick={() => previewEngineLine(line, index === 0 ? "Найкращий варіант" : "Варіант " + line.rank)}
                                                    >
                                                        <b className="analysis-engine-line-score-v3">{line.score}</b>
                                                        <span className="analysis-engine-line-rank-v3">{line.rank}.</span>
                                                        <span className="analysis-engine-line-moves-v3">
                                                            {line.moves.split(" ").filter(Boolean).slice(0, 8).map((move, moveIndex) => <i key={line.id + "-" + moveIndex}>{move}</i>)}
                                                        </span>
                                                    </button>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="analysis-engine-line-add-v3"
                                                                disabled={!record.currentPath}
                                                                onClick={() => addEngineLineToVariations(line)}
                                                                aria-label={"Додати варіант Stockfish " + line.rank + " до дерева"}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Додати до варіантів</TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )) : positionBusy ? (
                                                <>
                                                    <div className="analysis-engine-loading-v3" />
                                                    <div className="analysis-engine-loading-v3" />
                                                    <div className="analysis-engine-loading-v3" />
                                                </>
                                            ) : (
                                                <div className="analysis-empty-state compact"><BrainCircuit size={24} /><strong>Лінії ще не готові</strong><p>Stockfish обчислює найсильніші продовження.</p></div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {!engineEnabled && (
                                    <div className="analysis-empty-state compact"><Zap size={24} /><strong>Stockfish вимкнено</strong><p>Увімкніть перемикач вище, щоб побачити варіанти.</p></div>
                                )}

                                <section className="analysis-game-moves-v3">
                                    <div className="analysis-game-moves-head-v3">
                                        <strong>Ходи партії</strong>
                                        <button type="button" onClick={() => setTab("moves")}>Усі варіанти</button>
                                    </div>
                                    <div className="analysis-game-moves-list-v3" aria-label="Ходи партії">
                                        {mainlineRows.length ? mainlineRows.map(row => (
                                            <div key={row.number} className="analysis-game-move-row-v3">
                                                <span>{row.number}.</span>
                                                {row.white ? (
                                                    <button type="button" className={cn("analysis-game-move-v3", isSamePath([row.white.index], record.currentPath) && "is-selected")} onClick={() => navigateTo([row.white!.index])}>
                                                        <span>{row.white.node.san}</span>
                                                        {row.white.node.classification && <em>{CLASSIFICATION_MARKS[row.white.node.classification]}</em>}
                                                    </button>
                                                ) : <span className="analysis-game-move-v3 is-empty" />}
                                                {row.black ? (
                                                    <button type="button" className={cn("analysis-game-move-v3", isSamePath([row.black.index], record.currentPath) && "is-selected")} onClick={() => navigateTo([row.black!.index])}>
                                                        <span>{row.black.node.san}</span>
                                                        {row.black.node.classification && <em>{CLASSIFICATION_MARKS[row.black.node.classification]}</em>}
                                                    </button>
                                                ) : <span className="analysis-game-move-v3 is-empty" />}
                                            </div>
                                        )) : (
                                            <div className="analysis-empty-state compact"><Clipboard size={22} /><strong>Ходів ще немає</strong><p>Зробіть хід на дошці або імпортуйте PGN.</p></div>
                                        )}
                                    </div>
                                </section>

                                <section className="analysis-position-comment-v3">
                                    <label htmlFor="analysis-position-comment">Коментар до позиції</label>
                                    <Textarea
                                        id="analysis-position-comment"
                                        aria-label="Коментар до позиції"
                                        value={currentNode?.comment || ""}
                                        disabled={!record.currentPath}
                                        onChange={event => updatePositionComment(event.target.value)}
                                        placeholder={record.currentPath ? "Оцініть позицію, додайте свій план або ідею…" : "Оберіть хід, щоб додати коментар…"}
                                    />
                                </section>
                            </div>
                        )}`;

center = center.slice(0, engineStart) + engineBlock + center.slice(engineEnd);

const navStart = center.indexOf('                    <div className="analysis-panel-navigation analysis-panel-navigation-simple"');
const navEnd = center.indexOf('\n                </aside>', navStart);
if (navStart < 0 || navEnd < 0) throw new Error("navigation block markers not found");
const navBlock = `                    <div className="analysis-panel-navigation analysis-panel-navigation-v3" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="На початок" icon={<ChevronsLeft size={19} />} onClick={goFirst} disabled={!canGoPrevious} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={19} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={19} />} onClick={goNext} disabled={!canGoNext} />
                        <NavIconButton label="У кінець" icon={<ChevronsRight size={19} />} onClick={goLast} disabled={!canGoLast} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? "Активна лінія: " + navigationLabel : "Позиція: " + navigationLabel}>{navigationLabel}</span>
                    </div>`;
center = center.slice(0, navStart) + navBlock + center.slice(navEnd);

fs.writeFileSync(centerFile, center);

const testFile = "src/test/analysis.smoke.test.tsx";
let test = fs.readFileSync(testFile, "utf8");

test = test.replace(
`        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();
        expect(within(navigator).queryByRole("button", { name: /На початок/i })).not.toBeInTheDocument();
        expect(within(navigator).queryByRole("button", { name: /У кінець/i })).not.toBeInTheDocument();
        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();`,
`        expect(within(navigator).getByRole("button", { name: "На початок" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();
        expect(within(navigator).getByRole("button", { name: "У кінець" })).toBeInTheDocument();
        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();`,
);

const oldEngineTestStart = test.indexOf('    it("keeps the Engine tab simple and hides secondary lines until requested"');
const oldEngineTestEnd = test.indexOf('\n\n    it("runs full review from Overview', oldEngineTestStart);
if (oldEngineTestStart < 0 || oldEngineTestEnd < 0) throw new Error("old engine test markers not found");
const newEngineTest = `    it("renders the compact screenshot-inspired Engine workspace", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(await screen.findByText("Позиція близька до рівної")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Налаштувати движок" })).toBeInTheDocument();
        expect(screen.getByText("Глибина")).toBeInTheDocument();
        expect(screen.getByText("Ходи партії")).toBeInTheDocument();
        expect(screen.getByLabelText("Коментар до позиції")).toBeInTheDocument();
        expect(await screen.findAllByTestId("analysis-engine-line")).toHaveLength(3);
        expect(screen.queryByText("Інші варіанти")).not.toBeInTheDocument();
    });`;
test = test.slice(0, oldEngineTestStart) + newEngineTest + test.slice(oldEngineTestEnd);

fs.writeFileSync(testFile, test);

console.log("Analysis screenshot-inspired page patch applied.");
