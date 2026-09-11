import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
    START_FEN,
    buildMovePairs,
    buildPgn,
    buildRecordFromPgn,
    calculateAccuracy,
    classificationFromLoss,
    collectNodes,
    countLabels,
    createMoveNode,
    createRecord,
    explanationForMove,
    findOpening,
    formatAnalysisError,
    formatCp,
    getCurrentFen,
    getLastMove,
    isSamePath,
    numericScoreFromEngine,
    renderMoves,
    uciPvToSan,
    uciToSan,
    updateNodeAtPath,
    type AnalysisRecord,
    type EngineSummary,
    type MoveClassification,
} from "@/features/analysis/model";
import analyzeFenWithStockfish, { type AnalyzeResult } from "@/lib/stockfish";
import { cn } from "@/lib/utils";
import { Chess, type Square } from "chess.js";
import {
    BarChart3,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clipboard,
    Copy,
    Download,
    FlipVertical,
    Gauge,
    Info,
    Loader2,
    Pause,
    Play,
    RotateCcw,
    Settings2,
    Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import "@/styles/analysis-center.css";

type PanelTab = "overview" | "moves" | "engine" | "info";
type ImportMode = "pgn" | "fen";

type ReviewState = {
    running: boolean;
    current: number;
    total: number;
    error: string;
};

const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
    best: "Найкращий",
    excellent: "Чудовий",
    good: "Добрий",
    inaccuracy: "Неточність",
    mistake: "Помилка",
    blunder: "Груба помилка",
};

const CLASSIFICATION_MARKS: Record<MoveClassification, string> = {
    best: "★",
    excellent: "!",
    good: "✓",
    inaccuracy: "?!",
    mistake: "?",
    blunder: "??",
};

function toEngineSummary(fen: string, result: AnalyzeResult): EngineSummary {
    const numericScore = numericScoreFromEngine(result);
    return {
        backend: result.backend,
        fen,
        scoreCp: result.scoreCp,
        scoreMate: result.scoreMate,
        numericScore,
        bestMoveUci: result.bestmove,
        bestMoveSan: uciToSan(fen, result.bestmove),
        pvSan: uciPvToSan(fen, result.pv || []),
        lines: result.lines || [],
        lineSan: uciPvToSan(fen, result.pv || []),
        depth: result.depth || 0,
        nodes: result.nodes,
        timeMs: result.timeMs,
    };
}

function evaluationLabel(summary: EngineSummary | null) {
    if (!summary) return "—";
    if (summary.scoreMate != null) return `M${Math.abs(summary.scoreMate)}`;
    return formatCp(summary.numericScore);
}

function sideAccuracy(record: AnalysisRecord, color: "w" | "b") {
    const nodes = collectNodes(record.mainline).filter(node => node.color === color && node.evalLoss != null);
    if (!nodes.length) return null;
    const averageLoss = nodes.reduce((sum, node) => sum + (node.evalLoss || 0), 0) / nodes.length;
    return Math.max(0, Math.min(100, Math.round((100 - averageLoss / 12) * 10) / 10));
}

function playerLabel(record: AnalysisRecord, color: "white" | "black") {
    const name = color === "white" ? record.headers.White : record.headers.Black;
    const rating = color === "white" ? record.headers.WhiteElo : record.headers.BlackElo;
    return { name: name || (color === "white" ? "Білі" : "Чорні"), rating: rating || null };
}

function engineSource(summary: EngineSummary | null) {
    if (!summary?.backend) return "Stockfish";
    if (summary.backend === "cloud") return "Lichess Cloud";
    if (summary.backend === "native") return "Stockfish · сервер";
    return "Stockfish · браузер";
}

export default function AnalysisCenter() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const boardWrapRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const positionAbortRef = useRef<AbortController | null>(null);
    const reviewAbortRef = useRef<AbortController | null>(null);
    const engineCacheRef = useRef(new Map<string, EngineSummary>());
    const loadedInputRef = useRef<string | null>(null);

    const [record, setRecord] = useState<AnalysisRecord>(() => createRecord());
    const [tab, setTab] = useState<PanelTab>("overview");
    const [boardSize, setBoardSize] = useState(600);
    const [flipped, setFlipped] = useState(false);
    const [engineEnabled, setEngineEnabled] = useState(true);
    const [engineDepth, setEngineDepth] = useState(12);
    const [currentEngine, setCurrentEngine] = useState<EngineSummary | null>(null);
    const [positionBusy, setPositionBusy] = useState(false);
    const [positionError, setPositionError] = useState("");
    const [review, setReview] = useState<ReviewState>({ running: false, current: 0, total: 0, error: "" });
    const [importOpen, setImportOpen] = useState(false);
    const [importMode, setImportMode] = useState<ImportMode>("pgn");
    const [importDraft, setImportDraft] = useState("");
    const [importError, setImportError] = useState("");

    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);
    const movePairs = useMemo(() => buildMovePairs(record.mainline), [record.mainline]);
    const currentNode = useMemo(() => getLastMove(record), [record]);
    const currentFen = useMemo(() => getCurrentFen(record), [record]);
    const currentMoveIndex = useMemo(
        () => renderedMoves.findIndex(entry => isSamePath(entry.path, record.currentPath)),
        [record.currentPath, renderedMoves],
    );
    const reviewedNodes = useMemo(
        () => collectNodes(record.mainline).filter(node => node.evalLoss != null),
        [record.mainline],
    );
    const opening = useMemo(() => findOpening(record.mainline), [record.mainline]);
    const counts = useMemo(() => countLabels(record.mainline), [record.mainline]);
    const whiteAccuracy = useMemo(() => sideAccuracy(record, "w"), [record]);
    const blackAccuracy = useMemo(() => sideAccuracy(record, "b"), [record]);
    const overallAccuracy = reviewedNodes.length ? calculateAccuracy(record.mainline) : null;
    const whitePlayer = playerLabel(record, "white");
    const blackPlayer = playerLabel(record, "black");
    const topPlayer = flipped ? whitePlayer : blackPlayer;
    const bottomPlayer = flipped ? blackPlayer : whitePlayer;
    const currentEval = currentEngine?.numericScore ?? currentNode?.engineEval ?? 0;
    const hasEvaluation = Boolean(currentEngine || currentNode?.engineEval != null || currentNode?.engineMate != null);
    const evalText = currentNode?.engineMate != null
        ? `M${Math.abs(currentNode.engineMate)}`
        : currentEngine?.scoreMate != null
            ? `M${Math.abs(currentEngine.scoreMate)}`
            : hasEvaluation
                ? formatCp(currentEval)
                : "—";
    const evalWhite = hasEvaluation ? Math.max(7, Math.min(93, 50 + currentEval / 18)) : 50;
    const activeReview = review.running;

    useEffect(() => {
        const element = boardWrapRef.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            const width = entries[0]?.contentRect.width || 600;
            const viewportHeight = window.innerHeight;
            const maxByHeight = Math.max(380, viewportHeight - 205);
            setBoardSize(Math.floor(Math.min(680, width, maxByHeight)));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const routePgn = typeof location.state?.pgn === "string" ? location.state.pgn : searchParams.get("pgn");
        const routeFen = searchParams.get("fen");
        const source = routePgn || routeFen;
        if (!source || loadedInputRef.current === source) return;
        loadedInputRef.current = source;
        try {
            if (routePgn) {
                setRecord(buildRecordFromPgn(routePgn));
                setImportDraft(routePgn);
                toast.success("Партію відкрито в Analysis Center.");
            } else if (routeFen) {
                const chess = new Chess(routeFen);
                setRecord(createRecord(chess.fen()));
                setImportDraft(chess.fen());
                toast.success("Позицію відкрито для аналізу.");
            }
        } catch {
            toast.error("Не вдалося відкрити переданий PGN або FEN.");
        }
    }, [location.state, searchParams]);

    const analyzeCached = useCallback(async (
        fen: string,
        depth: number,
        multiPv: number,
        signal: AbortSignal,
    ) => {
        const key = `${depth}:${multiPv}:${fen}`;
        const cached = engineCacheRef.current.get(key);
        if (cached) return cached;
        const result = await analyzeFenWithStockfish(fen, depth, undefined, 20_000, {
            signal,
            multiPv,
            preferCloud: true,
        });
        const summary = toEngineSummary(fen, result);
        engineCacheRef.current.set(key, summary);
        return summary;
    }, []);

    useEffect(() => {
        positionAbortRef.current?.abort();
        if (!engineEnabled) {
            setCurrentEngine(null);
            setPositionBusy(false);
            setPositionError("");
            return;
        }

        const controller = new AbortController();
        positionAbortRef.current = controller;
        setPositionBusy(true);
        setPositionError("");
        const timer = window.setTimeout(() => {
            void analyzeCached(currentFen, engineDepth, 3, controller.signal)
                .then(summary => {
                    if (!controller.signal.aborted) setCurrentEngine(summary);
                })
                .catch(error => {
                    if (!controller.signal.aborted) setPositionError(formatAnalysisError(error));
                })
                .finally(() => {
                    if (!controller.signal.aborted) setPositionBusy(false);
                });
        }, 220);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [analyzeCached, currentFen, engineDepth, engineEnabled]);

    const navigateTo = useCallback((path: number[] | null) => {
        setRecord(current => ({ ...current, currentPath: path ? [...path] : null }));
    }, []);

    const goFirst = useCallback(() => navigateTo(null), [navigateTo]);
    const goPrevious = useCallback(() => {
        if (currentMoveIndex < 0) return;
        navigateTo(currentMoveIndex <= 0 ? null : renderedMoves[currentMoveIndex - 1].path);
    }, [currentMoveIndex, navigateTo, renderedMoves]);
    const goNext = useCallback(() => {
        if (!renderedMoves.length) return;
        if (currentMoveIndex < 0) navigateTo(renderedMoves[0].path);
        else if (currentMoveIndex < renderedMoves.length - 1) navigateTo(renderedMoves[currentMoveIndex + 1].path);
    }, [currentMoveIndex, navigateTo, renderedMoves]);
    const goLast = useCallback(() => {
        if (renderedMoves.length) navigateTo(renderedMoves[renderedMoves.length - 1].path);
    }, [navigateTo, renderedMoves]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
            if (event.key === "ArrowLeft") { event.preventDefault(); goPrevious(); }
            if (event.key === "ArrowRight") { event.preventDefault(); goNext(); }
            if (event.key === "Home") { event.preventDefault(); goFirst(); }
            if (event.key === "End") { event.preventDefault(); goLast(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [goFirst, goLast, goNext, goPrevious]);

    const openImport = (mode: ImportMode) => {
        setImportMode(mode);
        setImportError("");
        setImportDraft(mode === "pgn" ? buildPgn(record) : currentFen);
        setImportOpen(true);
    };

    const applyImport = () => {
        const value = importDraft.trim();
        if (!value) {
            setImportError(importMode === "pgn" ? "Вставте PGN партії." : "Вставте FEN позиції.");
            return;
        }
        try {
            if (importMode === "pgn") {
                setRecord(buildRecordFromPgn(value));
                toast.success("PGN завантажено.");
            } else {
                const chess = new Chess(value);
                setRecord(createRecord(chess.fen()));
                toast.success("FEN завантажено.");
            }
            setImportOpen(false);
            setCurrentEngine(null);
            setTab("overview");
            setReview({ running: false, current: 0, total: 0, error: "" });
        } catch {
            setImportError(importMode === "pgn"
                ? "Не вдалося прочитати PGN. Перевірте формат ходів або заголовки партії."
                : "Не вдалося прочитати FEN. Перевірте позицію та сторону ходу.");
        }
    };

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith(".pgn")) {
            toast.error("Підтримуються лише файли .pgn.");
            return;
        }
        try {
            const text = await file.text();
            setRecord(buildRecordFromPgn(text));
            setImportDraft(text);
            setCurrentEngine(null);
            setReview({ running: false, current: 0, total: 0, error: "" });
            toast.success("PGN-файл завантажено.");
        } catch {
            toast.error("Не вдалося прочитати PGN-файл.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const addVariationMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        const chess = new Chess(currentFen);
        try {
            const move = chess.move({ from, to, promotion: promotion || "q" });
            if (!move) return false;
            const nextNode = createMoveNode({
                san: move.san,
                from: move.from,
                to: move.to,
                color: move.color,
                promotion: move.promotion,
            }, currentFen, chess.fen(), (currentNode?.ply || 0) + 1);

            setRecord(current => {
                if (!current.currentPath) {
                    if (current.mainline.length === 0) {
                        return { ...current, mainline: [nextNode], currentPath: [0] };
                    }
                    return current;
                }
                if (current.currentPath.length === 1 && current.currentPath[0] === current.mainline.length - 1) {
                    const mainline = [...current.mainline, nextNode];
                    return { ...current, mainline, currentPath: [mainline.length - 1] };
                }
                const path = current.currentPath;
                const node = path.length ? renderedMoves.find(entry => isSamePath(entry.path, path))?.node : null;
                const childIndex = node?.children.length || 0;
                return {
                    ...current,
                    mainline: updateNodeAtPath(current.mainline, path, target => { target.children.push(nextNode); }),
                    currentPath: [...path, childIndex],
                };
            });
            return true;
        } catch {
            return false;
        }
    }, [currentFen, currentNode?.ply, renderedMoves]);

    const startFullReview = async () => {
        if (!record.mainline.length || activeReview) return;
        reviewAbortRef.current?.abort();
        positionAbortRef.current?.abort();
        const controller = new AbortController();
        reviewAbortRef.current = controller;
        const total = record.mainline.length;
        setReview({ running: true, current: 0, total, error: "" });
        setTab("overview");

        try {
            for (let index = 0; index < total; index += 1) {
                if (controller.signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
                const node = record.mainline[index];
                const before = await analyzeCached(node.fenBefore, Math.min(engineDepth, 12), 1, controller.signal);
                const after = await analyzeCached(node.fenAfter, Math.min(engineDepth, 12), 1, controller.signal);
                const beforeScore = before.numericScore;
                const afterScore = after.numericScore;
                const loss = node.color === "w"
                    ? Math.max(0, beforeScore - afterScore)
                    : Math.max(0, afterScore - beforeScore);
                const playedBestMove = Boolean(before.bestMoveUci && before.bestMoveUci === node.uci);
                const classification = classificationFromLoss(loss, playedBestMove);
                const bestMoveSan = before.bestMoveSan;
                const alternatives = before.pvSan.slice(0, 8);
                const explanation = explanationForMove(classification, node.color, bestMoveSan);

                setRecord(current => ({
                    ...current,
                    mainline: updateNodeAtPath(current.mainline, [index], target => {
                        target.classification = classification;
                        target.evalLoss = loss;
                        target.engineEval = after.numericScore;
                        target.engineMate = after.scoreMate;
                        target.bestMoveSan = bestMoveSan;
                        target.alternatives = alternatives;
                        target.explanation = explanation;
                    }),
                }));
                setReview({ running: true, current: index + 1, total, error: "" });
            }
            setReview({ running: false, current: total, total, error: "" });
            toast.success("Повний аналіз партії завершено.");
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                setReview(current => ({ ...current, running: false }));
                toast.info("Аналіз зупинено.");
            } else {
                const message = formatAnalysisError(error);
                setReview(current => ({ ...current, running: false, error: message }));
                toast.error(message);
            }
        }
    };

    const stopFullReview = () => {
        reviewAbortRef.current?.abort();
    };

    const resetAnalysis = () => {
        reviewAbortRef.current?.abort();
        positionAbortRef.current?.abort();
        setRecord(createRecord());
        setCurrentEngine(null);
        setReview({ running: false, current: 0, total: 0, error: "" });
        setTab("overview");
        toast.success("Відкрито новий аналіз.");
    };

    const copyText = async (value: string, label: string) => {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} скопійовано.`);
    };

    const downloadPgn = () => {
        const pgn = buildPgn(record);
        const blob = new Blob([pgn], { type: "application/x-chess-pgn;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "chess-of-odesa-analysis.pgn";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const keyMoments = useMemo(
        () => renderedMoves.filter(entry => ["inaccuracy", "mistake", "blunder"].includes(entry.node.classification || "")).slice(0, 8),
        [renderedMoves],
    );

    const graphNodes = record.mainline.filter(node => node.engineEval != null);
    const graphPoints = graphNodes.map((node, index) => {
        const x = graphNodes.length <= 1 ? 0 : (index / (graphNodes.length - 1)) * 100;
        const score = Math.max(-500, Math.min(500, node.engineEval || 0));
        return { x, y: 50 - (score / 500) * 42, node };
    });
    const graphPolyline = graphPoints.map(point => `${point.x},${point.y}`).join(" ");

    const engineLines = useMemo(() => {
        if (!currentEngine) return [];
        if (currentEngine.lines.length) {
            return currentEngine.lines.slice(0, 3).map((line, index) => ({
                id: `${line.multipv || index + 1}-${line.pv.join("-")}`,
                score: line.scoreMate != null ? `M${Math.abs(line.scoreMate)}` : formatCp(line.scoreCp),
                moves: uciPvToSan(currentFen, line.pv).slice(0, 8).join(" "),
            }));
        }
        return [{ id: "main", score: evaluationLabel(currentEngine), moves: currentEngine.pvSan.slice(0, 8).join(" ") }];
    }, [currentEngine, currentFen]);

    const bestMoveArrow = useMemo<[Square, Square, string?][]>(() => {
        const move = currentEngine?.bestMoveUci;
        if (!engineEnabled || !move || move.length < 4) return [];
        return [[move.slice(0, 2) as Square, move.slice(2, 4) as Square, "#315c9a"]];
    }, [currentEngine?.bestMoveUci, engineEnabled]);

    const lastMoveSquares = currentNode?.uci?.length >= 4
        ? [currentNode.uci.slice(0, 2) as Square, currentNode.uci.slice(2, 4) as Square]
        : [];

    const panelTabs: Array<{ id: PanelTab; label: string; icon: typeof BarChart3 }> = [
        { id: "overview", label: "Огляд", icon: BarChart3 },
        { id: "moves", label: "Ходи", icon: Clipboard },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "info", label: "Інфо", icon: Info },
    ];

    return (
        <div className="analysis-center">
            <input ref={fileInputRef} className="hidden" type="file" accept=".pgn" onChange={event => void handleFile(event.target.files?.[0])} />

            <header className="analysis-toolbar">
                <div className="analysis-title-block">
                    <p className="eyebrow">Analysis Center</p>
                    <h1>Аналіз партії</h1>
                    <p>Розберіть партію або позицію за допомогою Stockfish.</p>
                </div>
                <div className="analysis-toolbar-actions">
                    <Button variant="outline" size="sm" onClick={resetAnalysis}><RotateCcw size={16} />Нова позиція</Button>
                    <Button variant="outline" size="sm" onClick={() => openImport("pgn")}><Clipboard size={16} />Імпорт PGN</Button>
                    <Button variant="outline" size="sm" onClick={() => openImport("fen")}><Copy size={16} />FEN</Button>
                    <Button size="sm" onClick={() => fileInputRef.current?.click()}><Upload size={16} />Завантажити PGN</Button>
                </div>
            </header>

            <div className="analysis-workspace">
                <section className="analysis-board-column">
                    <div className="analysis-playerbar">
                        <div className="analysis-avatar">{topPlayer.name.slice(0, 1).toUpperCase()}</div>
                        <strong>{topPlayer.name}</strong>
                        {topPlayer.rating && <span>{topPlayer.rating}</span>}
                    </div>

                    <div className="analysis-board-row">
                        <div className="analysis-evalbar" aria-label={`Оцінка позиції ${evalText}`}>
                            <div className="analysis-eval-black" style={{ height: `${flipped ? evalWhite : 100 - evalWhite}%` }} />
                            <div className="analysis-eval-white" style={{ height: `${flipped ? 100 - evalWhite : evalWhite}%` }} />
                            <strong className={cn("analysis-eval-label", currentEval < 0 && "analysis-eval-label-top")}>{evalText}</strong>
                        </div>
                        <div ref={boardWrapRef} className="analysis-board-wrap">
                            <ChessBoard
                                displayFen={currentFen}
                                initialFen={record.rootFen}
                                size={boardSize}
                                flipped={flipped}
                                interactive={!activeReview}
                                onMove={addVariationMove}
                                customArrows={bestMoveArrow}
                                lastMoveSquares={lastMoveSquares}
                                showLastMove
                                showLegalMoves
                                showChecks
                                allowArrows
                                customBoardStyle={{ borderRadius: 10, boxShadow: "0 16px 42px rgba(27,49,80,.16)" }}
                            />
                        </div>
                    </div>

                    <div className="analysis-playerbar">
                        <div className="analysis-avatar analysis-avatar-light">{bottomPlayer.name.slice(0, 1).toUpperCase()}</div>
                        <strong>{bottomPlayer.name}</strong>
                        {bottomPlayer.rating && <span>{bottomPlayer.rating}</span>}
                    </div>

                    <div className="analysis-board-controls" aria-label="Навігація по партії">
                        <Button variant="ghost" size="icon" onClick={goFirst} aria-label="На початок"><ChevronsLeft size={20} /></Button>
                        <Button variant="ghost" size="icon" onClick={goPrevious} aria-label="Попередній хід"><ChevronLeft size={20} /></Button>
                        <span>{currentMoveIndex >= 0 ? `${currentMoveIndex + 1} / ${renderedMoves.length}` : `0 / ${renderedMoves.length}`}</span>
                        <Button variant="ghost" size="icon" onClick={goNext} aria-label="Наступний хід"><ChevronRight size={20} /></Button>
                        <Button variant="ghost" size="icon" onClick={goLast} aria-label="В кінець"><ChevronsRight size={20} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setFlipped(value => !value)} aria-label="Перевернути дошку"><FlipVertical size={19} /></Button>
                    </div>

                    <div className="analysis-graph-card">
                        <div className="analysis-section-heading">
                            <div><span>Графік оцінки</span><small>Клікніть по точці, щоб перейти до ходу</small></div>
                            <strong>{reviewedNodes.length ? `${reviewedNodes.length} перевірено` : "Ще не проаналізовано"}</strong>
                        </div>
                        {graphPoints.length > 1 ? (
                            <svg className="analysis-graph" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Графік оцінки партії">
                                <line x1="0" x2="100" y1="50" y2="50" className="analysis-graph-zero" />
                                <polyline points={graphPolyline} className="analysis-graph-line" />
                                {graphPoints.map((point, index) => (
                                    <circle
                                        key={point.node.id}
                                        cx={point.x}
                                        cy={point.y}
                                        r="1.8"
                                        className={cn("analysis-graph-point", ["mistake", "blunder"].includes(point.node.classification || "") && "analysis-graph-point-critical")}
                                        onClick={() => navigateTo([record.mainline.findIndex(node => node.id === point.node.id)])}
                                    >
                                        <title>{`${point.node.moveNumber}${point.node.color === "w" ? "." : "..."}${point.node.san} · ${formatCp(point.node.engineEval)}`}</title>
                                    </circle>
                                ))}
                            </svg>
                        ) : (
                            <div className="analysis-empty-graph">Запустіть «Проаналізувати всю партію», щоб побудувати реальний графік Stockfish.</div>
                        )}
                    </div>
                </section>

                <aside className="analysis-panel">
                    <div className="analysis-panel-tabs" role="tablist" aria-label="Панель аналізу">
                        {panelTabs.map(item => {
                            const Icon = item.icon;
                            return <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}><Icon size={16} /><span>{item.label}</span></button>;
                        })}
                    </div>

                    <div className="analysis-panel-body">
                        {tab === "overview" && (
                            <div className="analysis-stack">
                                <div className="analysis-engine-banner">
                                    <div>
                                        <span>{engineSource(currentEngine)}</span>
                                        <strong>{positionBusy ? "Аналізує позицію…" : evaluationLabel(currentEngine)}</strong>
                                        <small>{currentEngine?.depth ? `Depth ${currentEngine.depth}` : positionError || "Поточна позиція"}</small>
                                    </div>
                                    <button type="button" className={cn("analysis-engine-switch", engineEnabled && "is-on")} onClick={() => setEngineEnabled(value => !value)} aria-pressed={engineEnabled}>
                                        {engineEnabled ? "ON" : "OFF"}
                                    </button>
                                </div>

                                {review.running ? (
                                    <div className="analysis-review-progress" aria-live="polite">
                                        <div className="analysis-section-heading"><div><span>Аналіз партії</span><small>{review.current} / {review.total} ходів</small></div><Loader2 className="animate-spin" size={20} /></div>
                                        <Progress value={review.total ? (review.current / review.total) * 100 : 0} />
                                        <Button variant="outline" size="sm" onClick={stopFullReview}><Pause size={16} />Зупинити аналіз</Button>
                                    </div>
                                ) : (
                                    <Button className="w-full" disabled={!record.mainline.length} onClick={() => void startFullReview()}><Play size={16} />{reviewedNodes.length ? "Проаналізувати заново" : "Проаналізувати всю партію"}</Button>
                                )}

                                {review.error && <div className="analysis-error">{review.error}</div>}

                                {reviewedNodes.length ? (
                                    <>
                                        <div className="analysis-accuracy-grid">
                                            <div><span>Білі</span><strong>{whiteAccuracy ?? "—"}%</strong></div>
                                            <div><span>Загальна</span><strong>{overallAccuracy ?? "—"}%</strong></div>
                                            <div><span>Чорні</span><strong>{blackAccuracy ?? "—"}%</strong></div>
                                        </div>

                                        <div className="analysis-summary-table">
                                            {(["best", "excellent", "good", "inaccuracy", "mistake", "blunder"] as MoveClassification[]).map(kind => (
                                                <button key={kind} type="button" onClick={() => {
                                                    const target = renderedMoves.find(entry => entry.node.classification === kind);
                                                    if (target) navigateTo(target.path);
                                                }}>
                                                    <span className={`analysis-classification analysis-classification-${kind}`}>{CLASSIFICATION_MARKS[kind]}</span>
                                                    <span>{CLASSIFICATION_LABELS[kind]}</span>
                                                    <strong>{counts[kind]}</strong>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="analysis-key-moments">
                                            <div className="analysis-section-heading"><div><span>Ключові моменти</span><small>Помилки з реальної оцінки движка</small></div></div>
                                            {keyMoments.length ? keyMoments.map(entry => (
                                                <button key={entry.node.id} type="button" onClick={() => navigateTo(entry.path)}>
                                                    <div>
                                                        <strong>{entry.node.moveNumber}{entry.node.color === "w" ? "." : "..."} {entry.node.san}</strong>
                                                        <span>{entry.node.explanation || CLASSIFICATION_LABELS[entry.node.classification!]}</span>
                                                    </div>
                                                    <span className={`analysis-classification analysis-classification-${entry.node.classification}`}>{CLASSIFICATION_MARKS[entry.node.classification!]}</span>
                                                </button>
                                            )) : <p className="analysis-muted">Суттєвих помилок не знайдено.</p>}
                                        </div>
                                    </>
                                ) : (
                                    <div className="analysis-empty-state">
                                        <Gauge size={30} />
                                        <strong>Огляд ще не готовий</strong>
                                        <p>Завантажте партію та запустіть повний аналіз. Точність, помилки й ключові моменти не генеруються випадково.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "moves" && (
                            <div className="analysis-moves-tab">
                                <div className="analysis-section-heading"><div><span>Ходи та варіанти</span><small>Клік по ходу змінює позицію</small></div></div>
                                {movePairs.length ? movePairs.map(pair => (
                                    <div key={pair.number} className="analysis-move-row">
                                        <span>{pair.number}.</span>
                                        {[pair.white, pair.black].map((slot, index) => slot ? (
                                            <button key={slot.node.id} type="button" className={cn(isSamePath(slot.path, record.currentPath) && "is-current")} onClick={() => navigateTo(slot.path)}>
                                                <span>{slot.node.san}</span>
                                                {slot.node.classification && <em className={`analysis-classification analysis-classification-${slot.node.classification}`}>{CLASSIFICATION_MARKS[slot.node.classification]}</em>}
                                            </button>
                                        ) : <i key={`${pair.number}-${index}`} />)}
                                    </div>
                                )) : <div className="analysis-empty-state"><Clipboard size={28} /><strong>Ходів ще немає</strong><p>Імпортуйте PGN або зробіть ходи на дошці.</p></div>}

                                {renderedMoves.some(entry => entry.depth > 0) && (
                                    <div className="analysis-variations">
                                        <strong>Власні варіанти</strong>
                                        {renderedMoves.filter(entry => entry.depth > 0).map(entry => (
                                            <button key={entry.node.id} type="button" onClick={() => navigateTo(entry.path)} style={{ paddingLeft: `${Math.min(3, entry.depth) * 14 + 10}px` }}>
                                                ({entry.node.moveNumber}{entry.node.color === "w" ? "." : "..."} {entry.node.san})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "engine" && (
                            <div className="analysis-stack">
                                <div className="analysis-engine-settings">
                                    <div>
                                        <span>Stockfish</span>
                                        <strong>{positionBusy ? "Обчислення…" : evaluationLabel(currentEngine)}</strong>
                                        <small>{engineSource(currentEngine)} · {currentEngine?.depth ? `Depth ${currentEngine.depth}` : "готовий"}</small>
                                    </div>
                                    <Button variant="outline" size="icon" onClick={() => setEngineEnabled(value => !value)} aria-label="Увімкнути або вимкнути движок"><Settings2 size={17} /></Button>
                                </div>

                                <div className="analysis-depth-picker" aria-label="Глибина аналізу">
                                    {[8, 12, 16].map(depth => <button key={depth} type="button" className={cn(engineDepth === depth && "is-active")} onClick={() => setEngineDepth(depth)}>{depth === 8 ? "Швидко" : depth === 12 ? "Стандарт" : "Глибоко"}<small>Depth {depth}</small></button>)}
                                </div>

                                {positionError ? <div className="analysis-error">{positionError}</div> : null}
                                <div className="analysis-engine-lines">
                                    {positionBusy && !engineLines.length ? [0, 1, 2].map(item => <div key={item} className="analysis-line-skeleton" />) : engineLines.map((line, index) => (
                                        <div key={line.id} className={cn("analysis-engine-line", index === 0 && "is-best")}>
                                            <strong>{line.score}</strong>
                                            <span>{line.moves || "Варіант обчислюється…"}</span>
                                        </div>
                                    ))}
                                </div>

                                {currentEngine?.bestMoveSan && (
                                    <div className="analysis-best-move">
                                        <span>Найкращий хід</span>
                                        <strong>{currentEngine.bestMoveSan}</strong>
                                        <p>{currentEngine.pvSan.slice(0, 6).join(" ")}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tab === "info" && (
                            <div className="analysis-stack">
                                <div className="analysis-info-list">
                                    {[
                                        ["Білі", record.headers.White ? `${record.headers.White}${record.headers.WhiteElo ? ` · ${record.headers.WhiteElo}` : ""}` : "—"],
                                        ["Чорні", record.headers.Black ? `${record.headers.Black}${record.headers.BlackElo ? ` · ${record.headers.BlackElo}` : ""}` : "—"],
                                        ["Результат", record.headers.Result || "—"],
                                        ["Контроль", record.headers.TimeControl || "—"],
                                        ["Дата", record.headers.Date || "—"],
                                        ["Дебют", opening?.opening.name || "—"],
                                        ["ECO", opening?.opening.eco || "—"],
                                    ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
                                </div>

                                <div className="analysis-pgn-actions">
                                    <Button variant="outline" onClick={() => void copyText(buildPgn(record), "PGN")}><Copy size={16} />Копіювати PGN</Button>
                                    <Button variant="outline" onClick={downloadPgn}><Download size={16} />Завантажити PGN</Button>
                                    <Button variant="outline" onClick={() => void copyText(currentFen, "FEN")}><Copy size={16} />Копіювати FEN</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{importMode === "pgn" ? "Імпорт партії" : "Аналіз позиції"}</DialogTitle>
                        <DialogDescription>{importMode === "pgn" ? "Вставте коректний PGN. Ходи та метадані будуть завантажені в Analysis Center." : "Вставте FEN, щоб відкрити конкретну позицію без повної партії."}</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        aria-label="Paste PGN or FEN"
                        value={importDraft}
                        onChange={event => { setImportDraft(event.target.value); setImportError(""); }}
                        className="min-h-52 font-mono text-sm"
                        placeholder={importMode === "pgn" ? "[Event \"...\"]\n\n1. e4 e5 2. Nf3 Nc6 ..." : START_FEN}
                    />
                    {importError && <p className="text-sm font-medium text-destructive" role="alert">{importError}</p>}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(false)}>Скасувати</Button>
                        <Button onClick={applyImport}>Аналізувати</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
