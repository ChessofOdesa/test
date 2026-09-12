import fs from "node:fs";

const centerFile = "src/pages/AnalysisCenter.tsx";
let center = fs.readFileSync(centerFile, "utf8");

const engineStart = '                        {tab === "engine" && (';
const overviewStart = '\n\n                        {tab === "overview" && (';
const startIndex = center.indexOf(engineStart);
const endIndex = center.indexOf(overviewStart, startIndex);
if (startIndex < 0 || endIndex < 0) throw new Error("Engine tab block markers not found");

const simpleEngine = `                        {tab === "engine" && (
                            <div className="analysis-engine-panel analysis-engine-panel-simple">
                                {!engineEnabled ? (
                                    <div className="analysis-empty-state"><Zap size={28} /><strong>Движок вимкнено</strong><p>Увімкніть Stockfish у лівій панелі.</p></div>
                                ) : (
                                    <>
                                        <div className="analysis-engine-toolbar analysis-engine-toolbar-simple">
                                            <strong>Движок</strong>
                                            <button type="button" className="analysis-engine-settings-link" aria-label="Налаштувати движок" onClick={() => setSettingsOpen(true)}><SlidersHorizontal size={16} /></button>
                                        </div>

                                        <div className="analysis-engine-status analysis-engine-status-simple">
                                            <div>
                                                <span className={cn("analysis-status-dot", positionBusy && "is-busy", currentEngine && !positionBusy && "is-ready")} />
                                                <strong>{engineSource(currentEngine)}</strong>
                                            </div>
                                            <span>{positionBusy ? "Аналізує…" : currentEngine ? `Готовий${currentEngine.depth ? ` · D${currentEngine.depth}` : ""}` : "Очікує"}</span>
                                        </div>

                                        <div className="analysis-engine-evaluation-simple" aria-live="polite">
                                            <strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong>
                                            <span>{engineVerdict(currentEngine?.numericScore)}</span>
                                        </div>

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

                                        {currentEngine?.bestMoveSan ? (
                                            <section className="analysis-best-move-simple" aria-label="Найкращий хід Stockfish">
                                                <div className="analysis-best-move-simple-head">
                                                    <span><Star size={15} />Найкращий хід</span>
                                                    <b>{evaluationLabel(currentEngine)}</b>
                                                </div>
                                                <strong className="analysis-best-move-simple-san">{currentEngine.bestMoveSan}</strong>
                                                {currentEngine.pvSan.length > 0 && <p>{currentEngine.pvSan.slice(0, 5).join(" ")}</p>}
                                                <div className="analysis-best-move-simple-actions">
                                                    <Button size="sm" disabled={!engineLines.length} onClick={() => engineLines[0] && previewEngineLine(engineLines[0], "Найкращий варіант")}>Показати на дошці</Button>
                                                    <Button variant="ghost" size="sm" disabled={!record.currentPath || !engineLines.length} onClick={() => engineLines[0] && addEngineLineToVariations(engineLines[0])}><GitBranch size={14} />У варіанти</Button>
                                                </div>
                                            </section>
                                        ) : positionBusy ? (
                                            <div className="analysis-best-move-simple is-loading"><div className="analysis-line-skeleton" /><div className="analysis-line-skeleton" /></div>
                                        ) : (
                                            <div className="analysis-empty-state compact"><BrainCircuit size={25} /><strong>Хід ще не готовий</strong><p>Stockfish обчислює поточну позицію.</p></div>
                                        )}

                                        {engineLines.length > 1 && (
                                            <details className="analysis-engine-others">
                                                <summary>
                                                    <span>Інші варіанти</span>
                                                    <b>{engineLines.length - 1}</b>
                                                    <ChevronDown size={16} />
                                                </summary>
                                                <div className="analysis-engine-other-lines">
                                                    {engineLines.slice(1).map(line => (
                                                        <div key={line.id} className="analysis-engine-other-row">
                                                            <button type="button" className="analysis-engine-other-preview" onClick={() => previewEngineLine(line)} title={line.moves}>
                                                                <strong>{line.moves.split(" ")[0] || `#${line.rank}`}</strong>
                                                                <span>{line.moves.split(" ").slice(1, 5).join(" ")}</span>
                                                                <b>{line.score}</b>
                                                            </button>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button type="button" className="analysis-engine-other-add" disabled={!record.currentPath} onClick={() => addEngineLineToVariations(line)} aria-label={`Додати варіант Stockfish ${line.rank} до дерева`}><GitBranch size={14} /></button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Додати до варіантів</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </>
                                )}
                            </div>
                        )}`;

center = center.slice(0, startIndex) + simpleEngine + center.slice(endIndex);

const oldFooter = `                    <div className="analysis-panel-navigation" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="На початок партії" icon={<ChevronsLeft size={18} />} onClick={goFirst} disabled={!record.currentPath} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={18} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? `Активна лінія: ${navigationLabel}` : `Позиція: ${navigationLabel}`}>{navigationLabel}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={18} />} onClick={goNext} disabled={!canGoNext} />
                        <NavIconButton label="У кінець активної лінії" icon={<ChevronsRight size={18} />} onClick={goLast} disabled={!canGoLast} />
                    </div>`;
const newFooter = `                    <div className="analysis-panel-navigation analysis-panel-navigation-simple" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={19} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? `Активна лінія: ${navigationLabel}` : `Позиція: ${navigationLabel}`}>{navigationLabel}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={19} />} onClick={goNext} disabled={!canGoNext} />
                    </div>`;
if (!center.includes(oldFooter)) throw new Error("Footer block marker not found");
center = center.replace(oldFooter, newFooter);
fs.writeFileSync(centerFile, center);

const cssFile = "src/styles/analysis-panel-professional.css";
let css = fs.readFileSync(cssFile, "utf8");
const badgeStart = css.indexOf("/* Board move badge:");
const engineCssStart = css.indexOf("/* Engine */", badgeStart);
const overviewCssStart = css.indexOf("/* Overview */", engineCssStart);
if (badgeStart < 0 || engineCssStart < 0 || overviewCssStart < 0) throw new Error("Professional CSS markers not found");

const badgeCss = `/* Board move badge: fully contained inside the destination square. */
.analysis-board-wrap .analysis-board-badge-slot {
  overflow: hidden;
}
.analysis-board-wrap .analysis-board-badge {
  top: 6%;
  right: 6%;
  width: clamp(22px, 42%, 30px);
  min-width: 0;
  max-width: 88%;
  height: clamp(22px, 42%, 30px);
  max-height: 88%;
  padding: 0;
  border-width: 2px;
  border-radius: 999px;
  box-shadow: 0 2px 7px rgba(18, 34, 55, .24);
  font-size: clamp(.68rem, 1vw, .88rem);
  line-height: 1;
  letter-spacing: -.035em;
}
.analysis-board-wrap .analysis-board-badge-book {
  background: #eef3fb;
  color: #385d8e;
  font-size: clamp(.64rem, .9vw, .78rem);
}
.analysis-badge-tooltip { min-width: 142px; gap: 3px; }
.analysis-badge-tooltip strong { font-size: .8rem; }
.analysis-badge-tooltip span { font-size: .69rem; line-height: 1.25; }

`;

const simpleEngineCss = `/* Engine — simplified hierarchy: status → evaluation → best move → optional alternatives. */
.analysis-engine-panel-simple { display: grid; align-content: start; gap: 9px; }
.analysis-engine-toolbar-simple {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.analysis-engine-toolbar-simple > strong { font-size: .9rem; }
.analysis-engine-settings-link {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 7px;
  color: #657084;
}
.analysis-engine-settings-link:hover { background: hsl(var(--secondary)); color: hsl(var(--foreground)); }

.analysis-engine-status-simple {
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid #e0e6ee;
  border-radius: 8px;
  background: #fbfcfe;
}
.analysis-engine-status-simple > div { min-width: 0; display: flex; align-items: center; gap: 7px; }
.analysis-engine-status-simple strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .7rem; }
.analysis-engine-status-simple > span { flex: 0 0 auto; color: #68768a; font-size: .62rem; font-weight: 700; }

.analysis-engine-evaluation-simple {
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #d8e1ee;
  border-radius: 9px;
  background: #f7f9fc;
}
.analysis-engine-evaluation-simple strong {
  flex: 0 0 auto;
  min-width: 64px;
  color: #1f3554;
  font-size: 1.28rem;
  font-variant-numeric: tabular-nums;
}
.analysis-engine-evaluation-simple span {
  min-width: 0;
  padding-left: 10px;
  border-left: 1px solid #d7dfeb;
  color: #52637a;
  font-size: .72rem;
  font-weight: 680;
}

.analysis-best-move-simple {
  display: grid;
  gap: 7px;
  padding: 11px;
  border: 1px solid #c9d8ee;
  border-radius: 10px;
  background: #f5f8fd;
}
.analysis-best-move-simple-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.analysis-best-move-simple-head > span { display: inline-flex; align-items: center; gap: 5px; color: #436b9f; font-size: .64rem; font-weight: 820; text-transform: uppercase; letter-spacing: .045em; }
.analysis-best-move-simple-head > b { color: #355d90; font-size: .74rem; font-variant-numeric: tabular-nums; }
.analysis-best-move-simple-san { color: #172c49; font-size: 1.45rem; line-height: 1; }
.analysis-best-move-simple > p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #718096; font-size: .67rem; }
.analysis-best-move-simple-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.analysis-best-move-simple-actions .inline-flex { min-height: 32px; font-size: .68rem; }
.analysis-best-move-simple.is-loading { gap: 6px; }

.analysis-preview-bar-simple { margin: 0; }

.analysis-engine-others {
  overflow: hidden;
  border: 1px solid #dfe5ed;
  border-radius: 9px;
  background: white;
}
.analysis-engine-others > summary {
  min-height: 40px;
  display: grid;
  grid-template-columns: minmax(0,1fr) auto 18px;
  align-items: center;
  gap: 7px;
  padding: 7px 9px;
  cursor: pointer;
  list-style: none;
  color: #42536a;
  font-size: .72rem;
  font-weight: 760;
}
.analysis-engine-others > summary::-webkit-details-marker { display: none; }
.analysis-engine-others > summary:hover { background: #fafbfd; }
.analysis-engine-others > summary b { min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; background: #eef2f7; color: #64748b; font-size: .62rem; }
.analysis-engine-others > summary svg { transition: transform .16s ease; }
.analysis-engine-others[open] > summary svg { transform: rotate(180deg); }
.analysis-engine-other-lines { display: grid; gap: 4px; padding: 0 7px 7px; border-top: 1px solid #eef1f5; }
.analysis-engine-other-row { display: grid; grid-template-columns: minmax(0,1fr) 30px; gap: 4px; padding-top: 5px; }
.analysis-engine-other-preview {
  min-width: 0;
  display: grid;
  grid-template-columns: 46px minmax(0,1fr) auto;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 5px 7px;
  border-radius: 7px;
  text-align: left;
}
.analysis-engine-other-preview:hover { background: #f7f9fc; }
.analysis-engine-other-preview:focus-visible,
.analysis-engine-other-add:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 1px; }
.analysis-engine-other-preview strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .72rem; }
.analysis-engine-other-preview span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #7b8798; font-size: .63rem; }
.analysis-engine-other-preview b { color: #435f84; font-size: .66rem; font-variant-numeric: tabular-nums; }
.analysis-engine-other-add { width: 30px; height: 34px; display: grid; place-items: center; border-radius: 7px; color: #7a8797; }
.analysis-engine-other-add:hover:not(:disabled) { background: #f1f5fa; color: hsl(var(--primary)); }
.analysis-engine-other-add:disabled { opacity: .35; cursor: not-allowed; }

.analysis-panel-navigation-simple {
  grid-template-columns: 44px minmax(86px, 1fr) 44px;
  padding-inline: 12px;
}
.analysis-panel-navigation-simple .inline-flex { width: 40px; height: 36px; }

`;

css = css.slice(0, badgeStart) + badgeCss + simpleEngineCss + css.slice(overviewCssStart);

css = css.replace(
  '  .analysis-board-wrap .analysis-board-badge { min-width: 24px; height: 24px; font-size: .72rem; }',
  '  .analysis-board-wrap .analysis-board-badge { width: clamp(21px, 40%, 27px); height: clamp(21px, 40%, 27px); font-size: .7rem; }'
);
css = css.replace(
  '  .analysis-engine-line-row { grid-template-columns: minmax(0,1fr) 30px; }\n  .analysis-engine-line-preview { grid-template-columns: 20px 42px minmax(0,1fr) 14px; gap: 4px; padding-inline: 6px; }',
  '  .analysis-engine-evaluation-simple { align-items: flex-start; flex-direction: column; gap: 5px; }\n  .analysis-engine-evaluation-simple span { padding-left: 0; border-left: 0; }\n  .analysis-best-move-simple-actions { align-items: stretch; flex-direction: column; }\n  .analysis-best-move-simple-actions .inline-flex { width: 100%; justify-content: center; }'
);
fs.writeFileSync(cssFile, css);

const testFile = "src/test/analysis.smoke.test.tsx";
let tests = fs.readFileSync(testFile, "utf8");

tests = tests.replace(
  '        expect(within(navigator).getByRole("button", { name: "На початок партії" })).toBeInTheDocument();\n        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();\n        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();\n        expect(within(navigator).getByRole("button", { name: "У кінець партії" })).toBeInTheDocument();\n        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();',
  '        expect(within(navigator).getByRole("button", { name: "Попередній хід" })).toBeInTheDocument();\n        expect(within(navigator).getByRole("button", { name: "Наступний хід" })).toBeInTheDocument();\n        expect(within(navigator).queryByRole("button", { name: /На початок/i })).not.toBeInTheDocument();\n        expect(within(navigator).queryByRole("button", { name: /У кінець/i })).not.toBeInTheDocument();\n        expect(within(navigator).getByText("0 / 0")).toBeInTheDocument();'
);

const oldClickable = `    it("shows clickable engine lines without a duplicate engine control inside the engine tab", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        const board = await screen.findByTestId("analysis-board");
        const initialFen = board.getAttribute("data-fen");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(screen.queryByLabelText("Кількість варіантів")).not.toBeInTheDocument();
        const firstLine = await screen.findByTitle("e4 e5 Nf3");
        fireEvent.click(firstLine);
        await waitFor(() => expect(board.getAttribute("data-fen")).not.toBe(initialFen));
        expect(screen.getByText("Варіант 1")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /До партії/i })).toBeInTheDocument();
    });`;
const newClickable = `    it("previews the best move from the simplified engine card", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        const board = await screen.findByTestId("analysis-board");
        const initialFen = board.getAttribute("data-fen");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        const bestMoveCard = await screen.findByLabelText("Найкращий хід Stockfish");
        expect(within(bestMoveCard).getByText("e4")).toBeInTheDocument();
        fireEvent.click(within(bestMoveCard).getByRole("button", { name: /Показати на дошці/i }));
        await waitFor(() => expect(board.getAttribute("data-fen")).not.toBe(initialFen));
        expect(screen.getByText("Найкращий варіант")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /До партії/i })).toBeInTheDocument();
    });`;
if (!tests.includes(oldClickable)) throw new Error("Old clickable engine test not found");
tests = tests.replace(oldClickable, newClickable);

const oldVerdict = `    it("presents a human engine verdict and explicit opt-in controls for saving engine lines", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(await screen.findByText("Позиція близька до рівної")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Налаштувати/i })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /Додати варіант Stockfish .* до дерева/i })).toHaveLength(3);
        expect(screen.getByText(/Клік відкриває preview/)).toBeInTheDocument();
    });`;
const newVerdict = `    it("keeps the Engine tab simple and hides secondary lines until requested", async () => {
        render(<MemoryRouter initialEntries={["/analysis"]}>
            <BoardSettingsProvider><Analysis /></BoardSettingsProvider>
        </MemoryRouter>);

        await screen.findByTestId("analysis-board");
        fireEvent.click(screen.getByRole("tab", { name: /Движок/i }));

        expect(await screen.findByText("Позиція близька до рівної")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Налаштувати движок" })).toBeInTheDocument();
        expect(screen.queryByText("Глибина")).not.toBeInTheDocument();
        expect(screen.queryByText("Варіанти Stockfish")).not.toBeInTheDocument();
        const alternatives = screen.getByText("Інші варіанти").closest("details");
        expect(alternatives).toBeInTheDocument();
        expect(alternatives).not.toHaveAttribute("open");
        fireEvent.click(within(alternatives!).getByText("Інші варіанти"));
        expect(within(alternatives!).getAllByRole("button", { name: /Додати варіант Stockfish .* до дерева/i })).toHaveLength(2);
    });`;
if (!tests.includes(oldVerdict)) throw new Error("Old engine verdict test not found");
tests = tests.replace(oldVerdict, newVerdict);

fs.writeFileSync(testFile, tests);
console.log("Analysis Engine simplification applied.");
