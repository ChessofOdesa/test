import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BOARD_THEMES, useBoardSettings } from "@/contexts/BoardSettingsContext";
import AnalysisMoveTree from "@/features/analysis/AnalysisMoveTree";
import { buildAnalysisPgn } from "@/features/analysis/pgnTree";
import {
    START_FEN,
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
    getLastPath,
    getNextPath,
    getNodeByPath,
    getPreviousPath,
    isSamePath,
    numericScoreFromEngine,
    renderMoves,
    uciPvToSan,
    uciToSan,
    updateNodeAtPath,
    type AnalysisMoveNode,
    type AnalysisRecord,
    type EngineSummary,
    type MoveClassification,
} from "@/features/analysis/model";
import analyzeFenWithStockfish, { type AnalyzeResult, type EngineLine } from "@/lib/stockfish";
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
    FileUp,
    FlipVertical,
    Gauge,
    Info,
    Loader2,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Settings2,
    Star,
    Trash2,
    Zap,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
} from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import "@/styles/analysis-center.css";

type PanelTab = "moves" | "engine" | "overview" | "info";
type ImportMode = "pgn" | "fen";

type ReviewState = {
    running: boolean;
    current: number;
    total: number;
    error: string;
};

type EnginePreview = {
    label: string;
    fens: string[];
    moves: string[];
    index: number;
};

type EngineLineView = {
    id: string;
    rank: number;
    score: string;
    moves: string;
    pv: string[];
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
    return {
        backend: result.backend,
        fen,
        scoreCp: result.scoreCp,
        scoreMate: result.scoreMate,
        numericScore: numericScoreFromEngine(result),
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

function engineLineScore(line: EngineLine) {
    return line.scoreMate != null ? `M${Math.abs(line.scoreMate)}` : formatCp(line.scoreCp);
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

function stripVariations(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
    return nodes.map(node => ({ ...node, children: [] }));
}

function clearReviewData(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
    return nodes.map(node => ({
        ...node,
        classification: null,
        evalLoss: null,
        engineEval: null,
        engineMate: null,
        bestMoveSan: null,
        alternatives: [],
        explanation: "",
        children: clearReviewData(node.children),
    }));
}

function badgeSquareStyle(square: Square, flipped: boolean): CSSProperties {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]);
    const column = flipped ? 7 - file : file;
    const row = flipped ? rank - 1 : 8 - rank;
    return {
        left: `${column * 12.5}%`,
        top: `${row * 12.5}%`,
        width: "12.5%",
        height: "12.5%",
    };
}

function buildPreview(baseFen: string, pv: string[], label: string): EnginePreview | null {
    const chess = new Chess(baseFen);
    const fens: string[] = [];
    const moves: string[] = [];
    for (const uci of pv.slice(0, 10)) {
        if (uci.length < 4) break;
        try {
            const move = chess.move({
                from: uci.slice(0, 2),
                to: uci.slice(2, 4),
                promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) || "q",
            });
            if (!move) break;
            moves.push(move.san);
            fens.push(chess.fen());
        } catch {
            break;
        }
    }
    return fens.length ? { label, fens, moves, index: 0 } : null;
}

function ToolButton({
    label,
    shortLabel,
    icon,
    active = false,
    onClick,
    detail,
    featured = false,
}: {
    label: string;
    shortLabel: string;
    icon: ReactNode;
    active?: boolean;
    onClick: () => void;
    detail?: string;
    featured?: boolean;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className={cn("analysis-tool-button", active && "is-active", featured && "is-featured")}
                    onClick={onClick}
                    aria-label={label}
                    aria-pressed={active || undefined}
                >
                    <span className="analysis-tool-icon">{icon}</span>
                    <span className="analysis-tool-label">{shortLabel}</span>
                    {detail ? <small>{detail}</small> : null}
                </button>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
}

function NavIconButton({ label, icon, onClick, disabled = false }: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClick} disabled={disabled} aria-label={label}>{icon}</Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export default function AnalysisCenter() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const boardSettings = useBoardSettings();
    const boardWrapRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const positionAbortRef = useRef<AbortController | null>(null);
    const reviewAbortRef = useRef<AbortController | null>(null);
    const engineCacheRef = useRef(new Map<string, EngineSummary>());
    const loadedInputRef = useRef<string | null>(null);

    const [record, setRecord] = useState<AnalysisRecord>(() => createRecord());
    const [tab, setTab] = useState<PanelTab>("moves");
    const [boardSize, setBoardSize] = useState(650);
    const [flipped, setFlipped] = useState(false);
    const [engineEnabled, setEngineEnabled] = useState(true);
    const [engineDepth, setEngineDepth] = useState(12);
    const [multiPv, setMultiPv] = useState(3);
    const [showBestMoveArrow, setShowBestMoveArrow] = useState(true);
    const [showMoveBadges, setShowMoveBadges] = useState(true);
    const [moveAnimation, setMoveAnimation] = useState(true);
    const [positionResult, setCurrentEngine] = useState<(EngineSummary & { requestKey: string }) | null>(null);
    const [positionBusy, setPositionBusy] = useState(false);
    const [positionError, setPositionError] = useState("");
    const [review, setReview] = useState<ReviewState>({ running: false, current: 0, total: 0, error: "" });
    const [importOpen, setImportOpen] = useState(false);
    const [importMode, setImportMode] = useState<ImportMode>("pgn");
    const [importDraft, setImportDraft] = useState("");
    const [importError, setImportError] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [linePreview, setLinePreview] = useState<EnginePreview | null>(null);

    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);
    const currentNode = useMemo(() => getLastMove(record), [record]);
    const currentFen = useMemo(() => getCurrentFen(record), [record]);
    const positionKey = `${engineDepth}:${multiPv}:${currentFen}`;
    const currentEngine = engineEnabled && positionResult?.requestKey === positionKey ? positionResult : null;
    const nextPath = getNextPath(record, record.currentPath);
    const lastPath = getLastPath(record);
    const lineLength = getNodeByPath(record.mainline, lastPath)?.ply ?? 0;
    const currentPly = currentNode?.ply ?? 0;
    // Navigation and comments keep a review alive; replacing/promoting the game does not.
    const gameIdentity = `${record.rootFen}:${record.mainline.map(node => node.id).join(",")}`;
    const reviewedNodes = useMemo(() => collectNodes(record.mainline).filter(node => node.evalLoss != null), [record.mainline]);
    const opening = useMemo(() => findOpening(record.mainline), [record.mainline]);
    const counts = useMemo(() => countLabels(record.mainline), [record.mainline]);
    const whiteAccuracy = useMemo(() => sideAccuracy(record, "w"), [record]);
    const blackAccuracy = useMemo(() => sideAccuracy(record, "b"), [record]);
    const overallAccuracy = reviewedNodes.length ? calculateAccuracy(record.mainline) : null;
    const hasVariations = renderedMoves.some(entry => entry.depth > 0);
    const whitePlayer = playerLabel(record, "white");
    const blackPlayer = playerLabel(record, "black");
    const topPlayer = flipped ? whitePlayer : blackPlayer;
    const bottomPlayer = flipped ? blackPlayer : whitePlayer;
    const currentEval = currentEngine?.numericScore ?? currentNode?.engineEval ?? 0;
    const hasEvaluation = engineEnabled && Boolean(currentEngine || currentNode?.engineEval != null || currentNode?.engineMate != null);
    const evalText = !engineEnabled
        ? "OFF"
        : currentNode?.engineMate != null
            ? `M${Math.abs(currentNode.engineMate)}`
            : currentEngine?.scoreMate != null
                ? `M${Math.abs(currentEngine.scoreMate)}`
                : hasEvaluation
                    ? formatCp(currentEval)
                    : "—";
    const evalWhite = hasEvaluation ? Math.max(7, Math.min(93, 50 + currentEval / 18)) : 50;
    const displayedFen = linePreview?.fens[linePreview.index] || currentFen;
    const engineToolDetail = !engineEnabled
        ? "OFF"
        : currentEngine
            ? `ON · ${evaluationLabel(currentEngine)}`
            : "ON · ...";

    const currentMainlineIndex = record.currentPath?.length === 1 ? record.currentPath[0] : -1;
    const previousMainlineEval = currentMainlineIndex > 0 ? record.mainline[currentMainlineIndex - 1]?.engineEval ?? null : null;
    const cachedBeforeEval = currentNode
        ? engineCacheRef.current.get(`${Math.min(engineDepth, 12)}:1:${currentNode.fenBefore}`)?.numericScore ?? null
        : null;
    const reviewBeforeEval = cachedBeforeEval ?? previousMainlineEval;
    const reviewAfterEval = currentNode?.engineEval ?? null;
    const badgeClassification = showMoveBadges && !linePreview && currentNode?.classification && currentNode.evalLoss != null ? currentNode.classification : null;
    const badgeSquare = badgeClassification && currentNode?.uci?.length >= 4 ? currentNode.uci.slice(2, 4) as Square : null;

    const cancelReview = useCallback(() => {
        reviewAbortRef.current?.abort();
        reviewAbortRef.current = null;
        setReview(current => ({ ...current, running: false }));
    }, []);

    useEffect(() => {
        cancelReview();
        setReview({ running: false, current: 0, total: 0, error: "" });
        setLinePreview(null);
    }, [cancelReview, gameIdentity]);

    useEffect(() => () => {
        reviewAbortRef.current?.abort();
        reviewAbortRef.current = null;
        positionAbortRef.current?.abort();
    }, []);

    useEffect(() => {
        const element = boardWrapRef.current;
        if (!element) return;
        const sync = () => {
            const width = element.getBoundingClientRect().width || 650;
            const maxByHeight = Math.max(400, window.innerHeight - 128);
            setBoardSize(Math.floor(Math.min(710, width, maxByHeight)));
        };
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(element);
        window.addEventListener("resize", sync);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", sync);
        };
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
                setTab("moves");
                setLinePreview(null);
                toast.success("Партію відкрито в аналізі.");
            } else if (routeFen) {
                const chess = new Chess(routeFen);
                setRecord(createRecord(chess.fen()));
                setImportDraft(chess.fen());
                setTab("moves");
                setLinePreview(null);
                toast.success("Позицію відкрито для аналізу.");
            }
        } catch {
            toast.error("Не вдалося відкрити переданий PGN або FEN.");
        }
    }, [location.state, searchParams]);

    const analyzeCached = useCallback(async (fen: string, depth: number, requestedMultiPv: number, signal: AbortSignal) => {
        if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
        const key = `${depth}:${requestedMultiPv}:${fen}`;
        const cached = engineCacheRef.current.get(key);
        if (cached) return cached;
        const result = await analyzeFenWithStockfish(fen, depth, undefined, 20_000, {
            signal,
            multiPv: requestedMultiPv,
            workerOnly: true,
            movetime: 1500,
        });
        if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
        const summary = toEngineSummary(fen, result);
        if (engineCacheRef.current.size >= 256) {
            engineCacheRef.current.delete(engineCacheRef.current.keys().next().value!);
        }
        engineCacheRef.current.set(key, summary);
        return summary;
    }, []);

    useEffect(() => {
        positionAbortRef.current?.abort();
        if (!engineEnabled || review.running) {
            setCurrentEngine(null);
            setPositionBusy(false);
            setPositionError("");
            setLinePreview(null);
            return;
        }
        const controller = new AbortController();
        positionAbortRef.current = controller;
        setPositionBusy(true);
        setPositionError("");
        const timer = window.setTimeout(() => {
            void analyzeCached(currentFen, engineDepth, multiPv, controller.signal)
                .then(summary => {
                    if (!controller.signal.aborted) setCurrentEngine({ ...summary, requestKey: positionKey });
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
    }, [analyzeCached, currentFen, engineDepth, engineEnabled, multiPv, positionKey, review.running]);

    const navigateTo = useCallback((path: number[] | null) => {
        setLinePreview(null);
        setRecord(current => ({ ...current, currentPath: path ? [...path] : null }));
    }, []);

    const goFirst = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: 0 } : null);
        else navigateTo(null);
    }, [linePreview, navigateTo]);
    const goPrevious = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: Math.max(0, current.index - 1) } : null);
        else navigateTo(getPreviousPath(record.currentPath));
    }, [linePreview, navigateTo, record.currentPath]);
    const goNext = useCallback(() => {
        if (linePreview) {
            setLinePreview(current => current ? { ...current, index: Math.min(current.fens.length - 1, current.index + 1) } : null);
            return;
        }
        const path = getNextPath(record, record.currentPath);
        if (path) navigateTo(path);
    }, [linePreview, navigateTo, record]);
    const goLast = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: current.fens.length - 1 } : null);
        else navigateTo(getLastPath(record));
    }, [linePreview, navigateTo, record]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable || target?.closest('[role="dialog"], [role="menu"], [role="tablist"], [role="slider"]')) return;
            if (importOpen || settingsOpen) return;
            if (event.key === "ArrowLeft") { event.preventDefault(); goPrevious(); }
            if (event.key === "ArrowRight") { event.preventDefault(); goNext(); }
            if (event.key === "Home") { event.preventDefault(); goFirst(); }
            if (event.key === "End") { event.preventDefault(); goLast(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [goFirst, goLast, goNext, goPrevious, importOpen, linePreview, settingsOpen]);

    const openImport = (mode: ImportMode) => {
        setImportMode(mode);
        setImportError("");
        setImportDraft(mode === "pgn" ? (record.mainline.length ? buildAnalysisPgn(record) : "") : currentFen);
        setImportOpen(true);
    };

    const applyImport = () => {
        const value = importDraft.trim();
        if (!value) {
            setImportError(importMode === "pgn" ? "Вставте PGN партії." : "Вставте FEN позиції.");
            return;
        }
        try {
            const imported = importMode === "pgn" ? buildRecordFromPgn(value) : createRecord(new Chess(value).fen());
            cancelReview();
            if (importMode === "pgn") {
                setRecord(imported);
                toast.success("PGN завантажено.");
            } else {
                setRecord(imported);
                toast.success("FEN завантажено.");
            }
            setImportOpen(false);
            setCurrentEngine(null);
            setLinePreview(null);
            setTab("moves");
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
            const imported = buildRecordFromPgn(text);
            cancelReview();
            setRecord(imported);
            setImportDraft(text);
            setCurrentEngine(null);
            setLinePreview(null);
            setTab("moves");
            setReview({ running: false, current: 0, total: 0, error: "" });
            toast.success("PGN-файл завантажено.");
        } catch {
            toast.error("Не вдалося прочитати PGN-файл.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const addVariationMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        if (linePreview) return false;
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

            // Follow an existing continuation instead of adding a second copy.
            const path = record.currentPath;
            const continuation = getNextPath(record, path);
            if (continuation && getNodeByPath(record.mainline, continuation)?.uci === nextNode.uci) {
                navigateTo(continuation);
                return true;
            }
            const existingChild = currentNode?.children.findIndex(node => node.uci === nextNode.uci) ?? -1;
            if (path && existingChild >= 0) {
                navigateTo([...path, existingChild]);
                return true;
            }
            if (!path && record.mainline.length) {
                toast.info("Для іншого першого ходу відкрийте нову позицію. Поточну партію збережено.");
                return false;
            }

            setRecord(current => {
                if (!current.currentPath) {
                    if (current.mainline.length === 0) return { ...current, mainline: [nextNode], currentPath: [0] };
                    return current;
                }
                if (current.currentPath.length === 1 && current.currentPath[0] === current.mainline.length - 1) {
                    const mainline = [...current.mainline, nextNode];
                    return { ...current, mainline, currentPath: [mainline.length - 1] };
                }
                const path = current.currentPath;
                const node = renderedMoves.find(entry => isSamePath(entry.path, path))?.node;
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
    }, [currentFen, currentNode, linePreview, navigateTo, record, renderedMoves]);

    const startFullReview = async () => {
        if (!record.mainline.length || reviewAbortRef.current) return;
        positionAbortRef.current?.abort();
        setLinePreview(null);
        const controller = new AbortController();
        reviewAbortRef.current = controller;
        const total = record.mainline.length;
        setReview({ running: true, current: 0, total, error: "" });

        try {
            for (let index = 0; index < total; index += 1) {
                if (controller.signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
                const node = record.mainline[index];
                const depth = Math.min(engineDepth, 12);
                const before = await analyzeCached(node.fenBefore, depth, 1, controller.signal);
                const after = await analyzeCached(node.fenAfter, depth, 1, controller.signal);
                if (controller.signal.aborted || reviewAbortRef.current !== controller) return;
                const rawLoss = node.color === "w"
                    ? Math.max(0, before.numericScore - after.numericScore)
                    : Math.max(0, after.numericScore - before.numericScore);
                const moverBefore = node.color === "w" ? before.numericScore : -before.numericScore;
                const adjustedClassificationLoss = moverBefore <= -500 ? rawLoss * 0.45 : rawLoss;
                const playedBestMove = Boolean(before.bestMoveUci && before.bestMoveUci === node.uci);
                const classification = classificationFromLoss(adjustedClassificationLoss, playedBestMove);
                const bestMoveSan = before.bestMoveSan;

                setRecord(current => current.mainline[index]?.id !== node.id || controller.signal.aborted ? current : ({
                    ...current,
                    mainline: updateNodeAtPath(current.mainline, [index], target => {
                        target.classification = classification;
                        target.evalLoss = rawLoss;
                        target.engineEval = after.numericScore;
                        target.engineMate = after.scoreMate;
                        target.bestMoveSan = bestMoveSan;
                        target.alternatives = before.pvSan.slice(0, 8);
                        target.explanation = explanationForMove(classification, node.color, bestMoveSan);
                    }),
                }));
                setReview({ running: true, current: index + 1, total, error: "" });
            }
            setReview({ running: false, current: total, total, error: "" });
            toast.success("Повний аналіз партії завершено.");
        } catch (error) {
            if (reviewAbortRef.current !== controller || controller.signal.aborted) return;
            if (error instanceof DOMException && error.name === "AbortError") {
                setReview(current => ({ ...current, running: false }));
                toast.info("Аналіз зупинено.");
            } else {
                const message = formatAnalysisError(error);
                setReview(current => ({ ...current, running: false, error: message }));
                toast.error(message);
            }
        } finally {
            if (reviewAbortRef.current === controller) reviewAbortRef.current = null;
        }
    };

    const stopFullReview = cancelReview;

    const resetAnalysis = () => {
        cancelReview();
        positionAbortRef.current?.abort();
        setRecord(createRecord());
        setCurrentEngine(null);
        setLinePreview(null);
        setReview({ running: false, current: 0, total: 0, error: "" });
        setTab("moves");
        toast.success("Відкрито нову позицію для аналізу.");
    };

    const clearVariations = () => {
        if (!hasVariations) return;
        setRecord(current => ({
            ...current,
            mainline: stripVariations(current.mainline),
            currentPath: current.currentPath && current.currentPath.length === 1 ? current.currentPath : null,
        }));
        setLinePreview(null);
        toast.success("Власні варіанти очищено.");
    };

    const clearReviewResults = () => {
        if (!reviewedNodes.length) return;
        cancelReview();
        setRecord(current => ({ ...current, mainline: clearReviewData(current.mainline) }));
        setReview({ running: false, current: 0, total: 0, error: "" });
        setLinePreview(null);
        toast.success("Результати аналізу очищено. Партію та варіанти збережено.");
    };

    const copyText = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} скопійовано.`);
        } catch {
            toast.error(`Не вдалося скопіювати ${label}.`);
        }
    };

    const downloadPgn = () => {
        if (!record.mainline.length) return;
        const pgn = buildAnalysisPgn(record);
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

    const engineLines = useMemo<EngineLineView[]>(() => {
        if (!currentEngine) return [];
        if (currentEngine.lines.length) {
            return currentEngine.lines.slice(0, multiPv).map((line, index) => ({
                id: `${line.multipv || index + 1}-${line.pv.join("-")}`,
                rank: line.multipv || index + 1,
                score: engineLineScore(line),
                moves: uciPvToSan(currentFen, line.pv).slice(0, 10).join(" "),
                pv: line.pv,
            }));
        }
        const fallbackPv = currentEngine.bestMoveUci ? [currentEngine.bestMoveUci] : [];
        return fallbackPv.length ? [{
            id: "main",
            rank: 1,
            score: evaluationLabel(currentEngine),
            moves: currentEngine.pvSan.slice(0, 10).join(" ") || currentEngine.bestMoveSan || "",
            pv: fallbackPv,
        }] : [];
    }, [currentEngine, currentFen, multiPv]);

    const previewEngineLine = (line: EngineLineView, label = `Варіант ${line.rank}`) => {
        const preview = buildPreview(currentFen, line.pv, label);
        if (!preview) {
            toast.info("Цю лінію поки неможливо показати на дошці.");
            return;
        }
        setLinePreview(preview);
    };

    const bestMoveArrow = useMemo<[Square, Square, string?][]>(() => {
        const move = currentEngine?.bestMoveUci;
        if (!showBestMoveArrow || badgeClassification || linePreview || !engineEnabled || !move || move.length < 4) return [];
        return [[move.slice(0, 2) as Square, move.slice(2, 4) as Square, "#315c9a"]];
    }, [badgeClassification, currentEngine?.bestMoveUci, engineEnabled, linePreview, showBestMoveArrow]);

    const lastMoveSquares = !linePreview && currentNode?.uci?.length >= 4
        ? [currentNode.uci.slice(0, 2) as Square, currentNode.uci.slice(2, 4) as Square]
        : [];

    const panelTabs: Array<{ id: PanelTab; label: string; icon: typeof Clipboard }> = [
        { id: "moves", label: "Ходи", icon: Clipboard },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "overview", label: "Огляд", icon: BarChart3 },
        { id: "info", label: "Інфо", icon: Info },
    ];

    const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        event.stopPropagation();
        const currentIndex = panelTabs.findIndex(item => item.id === tab);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + panelTabs.length) % panelTabs.length;
        setTab(panelTabs[nextIndex].id);
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIndex]?.focus();
    };

    return (
        <div className="analysis-center">
            <input ref={fileInputRef} className="hidden" type="file" accept=".pgn" onChange={event => void handleFile(event.target.files?.[0])} />

            <main className="analysis-workspace">
                <aside className="analysis-tools" aria-label="Інструменти аналізу">
                    <ToolButton
                        label={engineEnabled ? "Вимкнути Stockfish" : "Увімкнути Stockfish"}
                        shortLabel="Движок"
                        icon={positionBusy ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} />}
                        active={engineEnabled}
                        featured
                        detail={engineToolDetail}
                        onClick={() => {
                            if (engineEnabled) { cancelReview(); positionAbortRef.current?.abort(); }
                            setEngineEnabled(value => !value);
                        }}
                    />
                    <ToolButton label="Нова позиція" shortLabel="Нова позиція" icon={<Plus size={20} />} onClick={resetAnalysis} />
                    <ToolButton label="Імпорт PGN" shortLabel="Імпорт PGN" icon={<Clipboard size={19} />} active={importOpen && importMode === "pgn"} onClick={() => openImport("pgn")} />
                    <ToolButton label="Відкрити PGN-файл" shortLabel="PGN файл" icon={<FileUp size={19} />} onClick={() => fileInputRef.current?.click()} />
                    <ToolButton label="Вставити FEN" shortLabel="FEN позиція" icon={<Copy size={18} />} active={importOpen && importMode === "fen"} onClick={() => openImport("fen")} />

                    <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <button type="button" className={cn("analysis-tool-button", settingsOpen && "is-active")} aria-label="Налаштування аналізу" aria-expanded={settingsOpen}>
                                        <span className="analysis-tool-icon"><Settings2 size={20} /></span>
                                        <span className="analysis-tool-label">Налаштування</span>
                                    </button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">Налаштування аналізу</TooltipContent>
                        </Tooltip>
                        <PopoverContent side="right" align="center" className="analysis-settings-popover">
                            <div className="analysis-popover-heading"><strong>Движок</strong><span>Глибина</span></div>
                            <div className="analysis-setting-options">
                                {[8, 12, 16].map(depth => (
                                    <button key={depth} type="button" className={cn(engineDepth === depth && "is-active")} onClick={() => setEngineDepth(depth)}>
                                        <strong>{depth === 8 ? "Швидкий" : depth === 12 ? "Стандартний" : "Глибокий"}</strong>
                                        <span>D{depth}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="analysis-popover-heading analysis-popover-subheading"><strong>Варіанти</strong><span>MultiPV</span></div>
                            <div className="analysis-multipv-options">
                                {[1, 2, 3, 5].map(value => <button key={value} type="button" className={cn(multiPv === value && "is-active")} onClick={() => setMultiPv(value)}>{value}</button>)}
                            </div>

                            <div className="analysis-popover-heading analysis-popover-subheading"><strong>Дошка</strong><span>Вигляд</span></div>
                            <label className="analysis-theme-select">
                                <span>Тема дошки</span>
                                <select value={boardSettings.theme.id} onChange={event => {
                                    const next = BOARD_THEMES.find(item => item.id === event.target.value);
                                    if (next) boardSettings.setTheme(next);
                                }}>
                                    {BOARD_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                                </select>
                            </label>
                            <div className="analysis-setting-toggles">
                                <button type="button" role="switch" aria-checked={boardSettings.showCoordinates} onClick={() => boardSettings.setShowCoordinates(!boardSettings.showCoordinates)}><span>Координати</span><b>{boardSettings.showCoordinates ? "ON" : "OFF"}</b></button>
                                <button type="button" role="switch" aria-checked={showBestMoveArrow} onClick={() => setShowBestMoveArrow(value => !value)}><span>Стрілка найкращого ходу</span><b>{showBestMoveArrow ? "ON" : "OFF"}</b></button>
                                <button type="button" role="switch" aria-checked={showMoveBadges} onClick={() => setShowMoveBadges(value => !value)}><span>Позначки якості ходу</span><b>{showMoveBadges ? "ON" : "OFF"}</b></button>
                                <button type="button" role="switch" aria-checked={moveAnimation} onClick={() => setMoveAnimation(value => !value)}><span>Анімація ходів</span><b>{moveAnimation ? "ON" : "OFF"}</b></button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <button type="button" className="analysis-tool-button" aria-label="Додаткові дії">
                                        <span className="analysis-tool-icon"><MoreHorizontal size={21} /></span>
                                        <span className="analysis-tool-label">Ще</span>
                                    </button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">Додаткові дії</TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent side="right" align="end" className="w-60">
                            <DropdownMenuItem disabled={!record.mainline.length} onSelect={() => void copyText(buildAnalysisPgn(record), "PGN")}><Copy size={16} className="mr-2" />Копіювати PGN</DropdownMenuItem>
                            <DropdownMenuItem disabled={!record.mainline.length} onSelect={downloadPgn}><Download size={16} className="mr-2" />Зберегти PGN</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void copyText(currentFen, "FEN")}><Copy size={16} className="mr-2" />Копіювати FEN</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setFlipped(value => !value)}><FlipVertical size={16} className="mr-2" />Перевернути дошку</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!hasVariations} onSelect={clearVariations}><Trash2 size={16} className="mr-2" />Очистити власні варіанти</DropdownMenuItem>
                            <DropdownMenuItem disabled={!reviewedNodes.length} onSelect={clearReviewResults}><Trash2 size={16} className="mr-2" />Очистити результати аналізу</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </aside>

                <section className="analysis-board-column">
                    <div className="analysis-playerbar analysis-playerbar-top">
                        <div className="analysis-avatar">{topPlayer.name.slice(0, 1).toUpperCase()}</div>
                        <strong>{topPlayer.name}</strong>
                        {topPlayer.rating && <span>{topPlayer.rating}</span>}
                    </div>

                    <div className="analysis-board-row">
                        <div className={cn("analysis-evalbar", !engineEnabled && "is-disabled")} aria-label={`Оцінка позиції ${evalText}`}>
                            <div className="analysis-eval-black" style={{ height: `${flipped ? evalWhite : 100 - evalWhite}%` }} />
                            <div className="analysis-eval-white" style={{ height: `${flipped ? 100 - evalWhite : evalWhite}%` }} />
                            <strong className={cn("analysis-eval-label", currentEval < 0 && "analysis-eval-label-top")}>{evalText}</strong>
                        </div>
                        <div ref={boardWrapRef} className="analysis-board-wrap">
                            <ChessBoard
                                displayFen={displayedFen}
                                initialFen={record.rootFen}
                                size={boardSize}
                                flipped={flipped}
                                interactive={!review.running && !linePreview}
                                onMove={addVariationMove}
                                customArrows={bestMoveArrow}
                                lastMoveSquares={lastMoveSquares}
                                showLastMove
                                showLegalMoves
                                showChecks
                                allowArrows={showBestMoveArrow && !linePreview}
                                animationDuration={moveAnimation ? 150 : 0}
                                customBoardStyle={{ borderRadius: 10, boxShadow: "0 16px 42px rgba(27,49,80,.16)" }}
                            />

                            {badgeClassification && badgeSquare && currentNode && (
                                <span className="analysis-board-badge-slot" style={badgeSquareStyle(badgeSquare, flipped)}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className={`analysis-board-badge analysis-board-badge-${badgeClassification}`}
                                                aria-label={`Хід класифіковано як ${CLASSIFICATION_LABELS[badgeClassification]}`}
                                                onClick={() => setTab("engine")}
                                            >
                                                {CLASSIFICATION_MARKS[badgeClassification]}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <div className="analysis-badge-tooltip">
                                                <strong>{CLASSIFICATION_LABELS[badgeClassification]}</strong>
                                                <span>{currentNode.evalLoss != null ? `Втрата оцінки: ${(currentNode.evalLoss / 100).toFixed(2)}` : ""}</span>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="analysis-playerbar analysis-playerbar-bottom">
                        <div className="analysis-avatar analysis-avatar-light">{bottomPlayer.name.slice(0, 1).toUpperCase()}</div>
                        <strong>{bottomPlayer.name}</strong>
                        {bottomPlayer.rating && <span>{bottomPlayer.rating}</span>}
                    </div>
                </section>

                <aside className="analysis-panel" aria-label="Права панель аналізу">
                    <div className="analysis-panel-tabs" role="tablist" aria-label="Панель аналізу" onKeyDown={handleTabKeyDown}>
                        {panelTabs.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    aria-selected={tab === item.id}
                                    tabIndex={tab === item.id ? 0 : -1}
                                    onClick={() => setTab(item.id)}
                                >
                                    <Icon size={16} /><span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="analysis-panel-body">
                        {tab === "moves" && (
                            <AnalysisMoveTree
                                record={record}
                                setRecord={setRecord}
                                onNavigate={navigateTo}
                                onOpenEngine={() => setTab("engine")}
                            />
                        )}

                        {tab === "engine" && (
                            <div className="analysis-engine-panel">
                                {!engineEnabled ? (
                                    <div className="analysis-empty-state"><Zap size={28} /><strong>Движок вимкнено</strong><p>Увімкніть Stockfish першою кнопкою в лівій панелі.</p></div>
                                ) : (
                                    <>
                                        <div className="analysis-engine-summary">
                                            <div><span>Оцінка</span><strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong></div>
                                            <div><span>Глибина</span><strong>{currentEngine?.depth ? `D${currentEngine.depth}` : "—"}</strong></div>
                                            <div><span>Варіанти</span><strong>{multiPv}</strong></div>
                                        </div>

                                        <div className="analysis-engine-status">
                                            <div>
                                                <span className={cn("analysis-status-dot", positionBusy && "is-busy", currentEngine && !positionBusy && "is-ready")} />
                                                <strong>{engineSource(currentEngine)}</strong>
                                            </div>
                                            <span>{positionBusy ? "Аналізує" : currentEngine ? "Готовий" : "Очікує"}</span>
                                        </div>

                                        {linePreview && (
                                            <div className="analysis-preview-bar" aria-live="polite">
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

                                        {currentNode?.classification && currentNode.evalLoss != null && (
                                            <div className={`analysis-current-review analysis-current-review-${currentNode.classification}`}>
                                                <div className="analysis-review-heading">
                                                    <span className={`analysis-classification analysis-classification-${currentNode.classification}`}>{CLASSIFICATION_MARKS[currentNode.classification]}</span>
                                                    <div>
                                                        <span>Ваш хід</span>
                                                        <strong>{currentNode.moveNumber}{currentNode.color === "w" ? "." : "..."} {currentNode.san}</strong>
                                                    </div>
                                                    <b>{CLASSIFICATION_LABELS[currentNode.classification]}</b>
                                                </div>
                                                <div className="analysis-review-metrics">
                                                    <div><span>До ходу</span><strong>{reviewBeforeEval != null ? formatCp(reviewBeforeEval) : "—"}</strong></div>
                                                    <div><span>Після</span><strong>{reviewAfterEval != null ? formatCp(reviewAfterEval) : "—"}</strong></div>
                                                    <div><span>Втрата</span><strong>{(currentNode.evalLoss / 100).toFixed(2)}</strong></div>
                                                </div>
                                                {currentNode.bestMoveSan && <p>Краще: <strong>{currentNode.bestMoveSan}</strong></p>}
                                            </div>
                                        )}

                                        {positionError ? <div className="analysis-error">{positionError}</div> : null}

                                        {currentEngine?.bestMoveSan && (
                                            <div className="analysis-best-move-compact">
                                                <div className="analysis-best-move-title"><Star size={16} /><span>Найкращий хід</span></div>
                                                <div className="analysis-best-move-main">
                                                    <strong>{currentEngine.bestMoveSan}</strong>
                                                    <span>{evaluationLabel(currentEngine)}</span>
                                                </div>
                                                <p>{currentEngine.pvSan.slice(0, 7).join(" ")}</p>
                                                <Button variant="outline" size="sm" disabled={!engineLines.length} onClick={() => engineLines[0] && previewEngineLine(engineLines[0], "Найкращий варіант")}>Показати на дошці</Button>
                                            </div>
                                        )}

                                        <div className="analysis-engine-lines-section">
                                            <div className="analysis-section-heading"><div><span>Варіанти Stockfish</span><small>MultiPV змінюється в Налаштуваннях</small></div></div>
                                            <div className="analysis-engine-lines">
                                                {positionBusy && !engineLines.length
                                                    ? Array.from({ length: Math.min(multiPv, 5) }, (_, index) => <div key={index} className="analysis-line-skeleton" />)
                                                    : engineLines.map(line => (
                                                        <button key={line.id} type="button" className={cn("analysis-engine-line", line.rank === 1 && "is-best")} onClick={() => previewEngineLine(line)} title={line.moves}>
                                                            <span className="analysis-line-rank">{line.rank}</span>
                                                            <strong>{line.score}</strong>
                                                            <span className="analysis-line-moves">{line.moves || "Варіант обчислюється…"}</span>
                                                            <ChevronRight size={15} />
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {tab === "overview" && (
                            <div className="analysis-stack">
                                {review.running && (
                                    <div className="analysis-review-progress" aria-live="polite">
                                        <div className="analysis-section-heading"><div><span>Аналіз триває</span><small>{review.current} / {review.total} ходів</small></div><Loader2 className="animate-spin" size={19} /></div>
                                        <Progress value={review.total ? (review.current / review.total) * 100 : 0} />
                                        <Button variant="outline" size="sm" onClick={stopFullReview}><Pause size={16} />Зупинити аналіз</Button>
                                    </div>
                                )}
                                {review.error && <div className="analysis-error">{review.error}</div>}

                                {reviewedNodes.length ? (
                                    <>
                                        {!review.running && <Button variant="outline" size="sm" className="analysis-rerun-button" onClick={() => void startFullReview()}><Play size={15} />Проаналізувати заново</Button>}
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
                                            <div className="analysis-section-heading"><div><span>Ключові моменти</span><small>На основі реальної оцінки Stockfish</small></div></div>
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

                                        <div className="analysis-overview-meta"><span>Дебют</span><strong>{opening?.opening.name || "Не визначено"}</strong></div>
                                    </>
                                ) : !review.running ? (
                                    <div className="analysis-empty-state">
                                        <Gauge size={30} />
                                        <strong>Огляд ще не готовий</strong>
                                        <p>Запустіть повний аналіз партії, щоб отримати точність, помилки та ключові моменти.</p>
                                        <Button size="sm" disabled={!record.mainline.length} onClick={() => void startFullReview()}><Play size={15} />Проаналізувати партію</Button>
                                    </div>
                                ) : null}
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
                            </div>
                        )}
                    </div>

                    <div className="analysis-panel-navigation" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="На початок партії" icon={<ChevronsLeft size={18} />} onClick={goFirst} disabled={linePreview ? linePreview.index === 0 : !record.currentPath} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={18} />} onClick={goPrevious} disabled={linePreview ? linePreview.index === 0 : !record.currentPath} />
                        <span aria-live="polite" title={linePreview ? "Перегляд варіанта Stockfish" : record.currentPath && record.currentPath.length > 1 ? "Позиція в поточному варіанті" : "Позиція в основній партії"}>{linePreview ? `${linePreview.index + 1} / ${linePreview.fens.length}` : `${currentPly} / ${lineLength}`}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={18} />} onClick={goNext} disabled={linePreview ? linePreview.index === linePreview.fens.length - 1 : !nextPath} />
                        <NavIconButton label="У кінець партії" icon={<ChevronsRight size={18} />} onClick={goLast} disabled={linePreview ? linePreview.index === linePreview.fens.length - 1 : !nextPath} />
                    </div>
                </aside>
            </main>

            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{importMode === "pgn" ? "Імпорт PGN" : "FEN позиція"}</DialogTitle>
                        <DialogDescription>{importMode === "pgn" ? "Вставте текст PGN. Партія та метадані відкриються у вкладці «Ходи»." : "Вставте FEN, щоб відкрити конкретну позицію для аналізу."}</DialogDescription>
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
                        <Button onClick={applyImport}>Відкрити для аналізу</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
