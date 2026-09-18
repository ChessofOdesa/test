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
import AnalysisEvaluationGraph from "@/features/analysis/AnalysisEvaluationGraph";
import { analysisNavigationLabel, lastAnalysisPath, nextAnalysisPath, previousAnalysisPath, sameAnalysisPath } from "@/features/analysis/navigation";
import { buildSanLinePreview } from "@/features/analysis/preview";
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
    findOpening,
    formatAnalysisError,
    formatCp,
    getCurrentFen,
    getLastMove,
    getNodeByPath,
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
    BookOpen,
    Bookmark,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clipboard,
    Copy,
    Download,
    FileText,
    FileUp,
    FlipVertical,
    Gauge,
    GitBranch,
    Info,
    Loader2,
    MoreHorizontal,
    Pause,
    Play,
    Plus,
    RotateCcw,
    Settings2,
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
import "@/styles/analysis-panel-professional.css";
import "@/styles/analysis-page-screenshot.css";

type PanelTab = "engine" | "overview" | "info";
type ImportMode = "pgn" | "fen";
type OverviewFilter = MoveClassification | "all";
type AnalysisUiMode = "simple" | "advanced";
type BoardBadgeKind = MoveClassification | "book";

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

const BOARD_BADGE_LABELS: Record<BoardBadgeKind, string> = {
    ...CLASSIFICATION_LABELS,
    book: "Теорія",
};

const BOARD_BADGE_MARKS: Record<BoardBadgeKind, string> = {
    ...CLASSIFICATION_MARKS,
    book: "📖",
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

function engineVerdict(score: number | null | undefined) {
    if (score == null) return "Оцінка позиції ще обчислюється";
    if (score >= 250) return "Велика перевага білих";
    if (score >= 80) return "Перевага білих";
    if (score >= 25) return "Трохи краще у білих";
    if (score <= -250) return "Велика перевага чорних";
    if (score <= -80) return "Перевага чорних";
    if (score <= -25) return "Трохи краще у чорних";
    return "Позиція близька до рівної";
}

function ukrainianExplanationForMove(classification: MoveClassification, color: "w" | "b", bestMoveSan: string | null) {
    const side = color === "w" ? "Білі" : "Чорні";
    if (classification === "best") return `${side} зіграли найточніше й зберегли оцінку позиції.`;
    if (classification === "excellent") return `${side} знайшли дуже сильне продовження, майже рівне першому вибору Stockfish.`;
    if (classification === "good") return `${side} зіграли добре, хоча в позиції було ще точніше продовження.`;
    if (classification === "inaccuracy") return `${side} трохи відхилилися від найсильнішої лінії.${bestMoveSan ? ` Краще було ${bestMoveSan}.` : ""}`;
    if (classification === "mistake") return `${side} віддали помітну частину оцінки.${bestMoveSan ? ` Краще було ${bestMoveSan}.` : ""}`;
    return `${side} різко погіршили позицію.${bestMoveSan ? ` Stockfish радив ${bestMoveSan}.` : ""}`;
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
    const [tab, setTab] = useState<PanelTab>("engine");
    const [boardSize, setBoardSize] = useState(650);
    const [flipped, setFlipped] = useState(false);
    const [engineEnabled, setEngineEnabled] = useState(true);
    const [enginePaused, setEnginePaused] = useState(false);
    const [engineDepth, setEngineDepth] = useState(12);
    const [multiPv, setMultiPv] = useState(3);
    const [showBestMoveArrow, setShowBestMoveArrow] = useState(true);
    const [showMoveBadges, setShowMoveBadges] = useState(true);
    const [moveAnimation, setMoveAnimation] = useState(true);
    const [currentEngine, setCurrentEngine] = useState<EngineSummary | null>(null);
    const [positionBusy, setPositionBusy] = useState(false);
    const [positionError, setPositionError] = useState("");
    const [review, setReview] = useState<ReviewState>({ running: false, current: 0, total: 0, error: "" });
    const [importOpen, setImportOpen] = useState(false);
    const [importMode, setImportMode] = useState<ImportMode>("pgn");
    const [importDraft, setImportDraft] = useState("");
    const [importError, setImportError] = useState("");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [linePreview, setLinePreview] = useState<EnginePreview | null>(null);
    const [overviewFilter, setOverviewFilter] = useState<OverviewFilter>("all");
    const [analysisUiMode, setAnalysisUiMode] = useState<AnalysisUiMode>("simple");
    const [showFullMoveTree, setShowFullMoveTree] = useState(false);
    const [predictionMode, setPredictionMode] = useState(false);

    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);

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

    const currentNode = useMemo(() => getLastMove(record), [record]);
    const currentFen = useMemo(() => getCurrentFen(record), [record]);
    const currentMoveIndex = useMemo(
        () => renderedMoves.findIndex(entry => isSamePath(entry.path, record.currentPath)),
        [record.currentPath, renderedMoves],
    );
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
    const currentMainlineIndex = record.currentPath?.length === 1 ? record.currentPath[0] : -1;
    const previousMainlineEval = currentMainlineIndex > 0 ? record.mainline[currentMainlineIndex - 1]?.engineEval ?? null : null;
    const cachedBeforeEval = currentNode
        ? engineCacheRef.current.get(`${Math.min(engineDepth, 12)}:1:${currentNode.fenBefore}`)?.numericScore ?? null
        : null;
    const reviewBeforeEval = cachedBeforeEval ?? previousMainlineEval;
    const reviewAfterEval = currentNode?.engineEval ?? null;
    const badgeClassification = showMoveBadges && !linePreview && currentNode?.classification && currentNode.evalLoss != null ? currentNode.classification : null;
    const badgeIsBook = Boolean(
        showMoveBadges
        && !linePreview
        && !badgeClassification
        && currentNode
        && opening
        && record.currentPath?.length === 1
        && currentNode.ply <= opening.matchedPly,
    );
    const boardBadgeKind: BoardBadgeKind | null = badgeClassification || (badgeIsBook ? "book" : null);
    const badgeSquare = boardBadgeKind && currentNode?.uci?.length >= 4 ? currentNode.uci.slice(2, 4) as Square : null;

    const overviewMoments = useMemo(() => {
        const reviewed = renderedMoves.filter(entry => entry.node.classification);
        if (overviewFilter !== "all") return reviewed.filter(entry => entry.node.classification === overviewFilter).slice(0, 10);
        return reviewed.filter(entry => ["inaccuracy", "mistake", "blunder"].includes(entry.node.classification || "")).slice(0, 8);
    }, [overviewFilter, renderedMoves]);

    const metadataText = useMemo(() => {
        const rows = [
            ["White", record.headers.White],
            ["WhiteElo", record.headers.WhiteElo],
            ["Black", record.headers.Black],
            ["BlackElo", record.headers.BlackElo],
            ["Result", record.headers.Result],
            ["TimeControl", record.headers.TimeControl],
            ["Date", record.headers.Date],
            ["Event", record.headers.Event],
            ["Site", record.headers.Site],
            ["Round", record.headers.Round],
            ["Termination", record.headers.Termination],
            ["Opening", opening?.opening.name],
            ["ECO", opening?.opening.eco],
        ];
        return rows.filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`).join("\n");
    }, [opening, record.headers]);

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
                setTab("engine");
                setShowFullMoveTree(false);
                setLinePreview(null);
                toast.success("Партію відкрито в аналізі.");
            } else if (routeFen) {
                const chess = new Chess(routeFen);
                setRecord(createRecord(chess.fen()));
                setImportDraft(chess.fen());
                setTab("engine");
                setShowFullMoveTree(false);
                setLinePreview(null);
                toast.success("Позицію відкрито для аналізу.");
            }
        } catch {
            toast.error("Не вдалося відкрити переданий PGN або FEN.");
        }
    }, [location.state, searchParams]);

    const analyzeCached = useCallback(async (fen: string, depth: number, requestedMultiPv: number, signal: AbortSignal) => {
        const key = `${depth}:${requestedMultiPv}:${fen}`;
        const cached = engineCacheRef.current.get(key);
        if (cached) return cached;
        const result = await analyzeFenWithStockfish(fen, depth, undefined, 20_000, {
            signal,
            multiPv: requestedMultiPv,
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
            setLinePreview(null);
            setEnginePaused(false);
            return;
        }
        if (enginePaused) {
            setPositionBusy(false);
            setPositionError("");
            return;
        }
        const controller = new AbortController();
        positionAbortRef.current = controller;
        setPositionBusy(true);
        setPositionError("");
        const timer = window.setTimeout(() => {
            void analyzeCached(currentFen, engineDepth, multiPv, controller.signal)
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
    }, [analyzeCached, currentFen, engineDepth, engineEnabled, enginePaused, multiPv]);

    const navigateTo = useCallback((path: number[] | null) => {
        setLinePreview(null);
        setRecord(current => ({ ...current, currentPath: path ? [...path] : null }));
    }, []);

    const previousPath = useMemo(() => previousAnalysisPath(record, record.currentPath), [record]);
    const nextPath = useMemo(() => nextAnalysisPath(record, record.currentPath), [record]);
    const lastPath = useMemo(() => lastAnalysisPath(record, record.currentPath), [record]);
    const navigationLabel = useMemo(() => analysisNavigationLabel(record, record.currentPath), [record]);
    const canGoPrevious = Boolean(record.currentPath);
    const canGoNext = nextPath !== null;
    const canGoLast = lastPath !== null && !sameAnalysisPath(record.currentPath, lastPath);

    const goFirst = useCallback(() => navigateTo(null), [navigateTo]);
    const goPrevious = useCallback(() => {
        if (!record.currentPath) return;
        navigateTo(previousPath);
    }, [navigateTo, previousPath, record.currentPath]);
    const goNext = useCallback(() => {
        if (nextPath) navigateTo(nextPath);
    }, [navigateTo, nextPath]);
    const goLast = useCallback(() => {
        if (lastPath) navigateTo(lastPath);
    }, [lastPath, navigateTo]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
            if (linePreview && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                event.preventDefault();
                setLinePreview(current => current ? {
                    ...current,
                    index: Math.max(0, Math.min(current.fens.length - 1, current.index + (event.key === "ArrowRight" ? 1 : -1))),
                } : null);
                return;
            }
            if (event.key === "ArrowLeft") { event.preventDefault(); goPrevious(); }
            if (event.key === "ArrowRight") { event.preventDefault(); goNext(); }
            if (event.key === "Home") { event.preventDefault(); goFirst(); }
            if (event.key === "End") { event.preventDefault(); goLast(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [goFirst, goLast, goNext, goPrevious, linePreview]);

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
            setLinePreview(null);
            setTab("engine");
                setShowFullMoveTree(false);
            setReview({ running: false, current: 0, total: 0, error: "" });
            setOverviewFilter("all");
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
            setLinePreview(null);
            setTab("engine");
                setShowFullMoveTree(false);
            setReview({ running: false, current: 0, total: 0, error: "" });
            setOverviewFilter("all");
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
                const node = getNodeByPath(current.mainline, path);
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
    }, [currentFen, currentNode?.ply, linePreview]);


    const handleAnalysisBoardMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        if (!predictionMode) return addVariationMove(from, to, promotion);
        try {
            const chess = new Chess(currentFen);
            const move = chess.move({ from, to, promotion: promotion || "q" });
            if (!move) return false;
            const predictedUci = `${move.from}${move.to}${move.promotion || ""}`;
            const bestUci = currentEngine?.bestMoveUci;
            const bestSan = currentEngine?.bestMoveSan;
            setPredictionMode(false);
            if (!bestUci) {
                toast.info(`Ваш прогноз: ${move.san}. Stockfish ще не завершив розрахунок.`);
            } else if (predictedUci === bestUci) {
                toast.success(`Точно! ${move.san} — перший вибір Stockfish.`);
            } else {
                toast.info(`Ваш прогноз: ${move.san}. Stockfish обирає ${bestSan || bestUci}.`);
            }
            return false;
        } catch {
            setPredictionMode(false);
            return false;
        }
    }, [addVariationMove, currentEngine?.bestMoveSan, currentEngine?.bestMoveUci, currentFen, predictionMode]);

    const savePositionBookmark = useCallback(() => {
        try {
            const key = "chess-of-odesa-analysis-bookmarks";
            const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
            const current = Array.isArray(parsed) ? parsed : [];
            if (!current.some((item: { fen?: string }) => item?.fen === currentFen)) {
                current.unshift({ fen: currentFen, createdAt: new Date().toISOString() });
                window.localStorage.setItem(key, JSON.stringify(current.slice(0, 50)));
                toast.success("Позицію додано в закладки.");
            } else {
                toast.info("Ця позиція вже є в закладках.");
            }
        } catch {
            toast.error("Не вдалося зберегти позицію в закладки.");
        }
    }, [currentFen]);

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

    const startFullReview = async () => {
        if (!record.mainline.length || review.running) return;
        reviewAbortRef.current?.abort();
        positionAbortRef.current?.abort();
        setLinePreview(null);
        setOverviewFilter("all");
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
                const rawLoss = node.color === "w"
                    ? Math.max(0, before.numericScore - after.numericScore)
                    : Math.max(0, after.numericScore - before.numericScore);
                const moverBefore = node.color === "w" ? before.numericScore : -before.numericScore;
                const adjustedClassificationLoss = moverBefore <= -500 ? rawLoss * 0.45 : rawLoss;
                const playedBestMove = Boolean(before.bestMoveUci && before.bestMoveUci === node.uci);
                const classification = classificationFromLoss(adjustedClassificationLoss, playedBestMove);
                const bestMoveSan = before.bestMoveSan;

                setRecord(current => ({
                    ...current,
                    mainline: updateNodeAtPath(current.mainline, [index], target => {
                        target.classification = classification;
                        target.evalLoss = rawLoss;
                        target.engineEval = after.numericScore;
                        target.engineMate = after.scoreMate;
                        target.bestMoveSan = bestMoveSan;
                        target.alternatives = before.pvSan.slice(0, 8);
                        target.explanation = ukrainianExplanationForMove(classification, node.color, bestMoveSan);
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

    const stopFullReview = () => reviewAbortRef.current?.abort();

    const resetAnalysis = () => {
        reviewAbortRef.current?.abort();
        positionAbortRef.current?.abort();
        setRecord(createRecord());
        setCurrentEngine(null);
        setLinePreview(null);
        setReview({ running: false, current: 0, total: 0, error: "" });
        setOverviewFilter("all");
        setTab("engine");
                setShowFullMoveTree(false);
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
        reviewAbortRef.current?.abort();
        setRecord(current => ({ ...current, mainline: clearReviewData(current.mainline) }));
        setReview({ running: false, current: 0, total: 0, error: "" });
        setOverviewFilter("all");
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
            label: `Краще: ${node.bestMoveSan}`,
            fens: preview.fens,
            moves: preview.moves,
            index: 0,
        });
        setTab("engine");
    }, [record.currentPath, record.mainline]);

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

    const addEngineLineToVariations = (line: EngineLineView) => {
        if (!record.currentPath || !currentNode || !line.pv.length) {
            toast.info("Оберіть хід у партії, від якого потрібно зберегти варіант.");
            return;
        }
        const basePath = [...record.currentPath];
        const parent = getNodeByPath(record.mainline, basePath);
        if (!parent) return;

        const chess = new Chess(currentFen);
        const nodes: AnalysisMoveNode[] = [];
        for (const uci of line.pv.slice(0, 10)) {
            if (uci.length < 4) break;
            const fenBefore = chess.fen();
            try {
                const move = chess.move({
                    from: uci.slice(0, 2),
                    to: uci.slice(2, 4),
                    promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) || "q",
                });
                if (!move) break;
                nodes.push(createMoveNode(move, fenBefore, chess.fen(), currentNode.ply + nodes.length + 1));
            } catch {
                break;
            }
        }
        if (!nodes.length) {
            toast.info("Цю лінію не вдалося додати до варіантів.");
            return;
        }
        for (let index = 0; index < nodes.length - 1; index += 1) nodes[index].children = [nodes[index + 1]];

        const existingIndex = parent.children.findIndex(child => child.uci === nodes[0].uci);
        if (existingIndex >= 0) {
            navigateTo([...basePath, existingIndex]);
            setTab("engine");
                setShowFullMoveTree(false);
            toast.info("Такий варіант уже є в дереві.");
            return;
        }

        const childIndex = parent.children.length;
        setRecord(current => ({
            ...current,
            mainline: updateNodeAtPath(current.mainline, basePath, target => { target.children.push(nodes[0]); }),
            currentPath: [...basePath, childIndex],
        }));
        setLinePreview(null);
        setTab("engine");
        setShowFullMoveTree(true);
        toast.success("Лінію Stockfish додано до варіантів.");
    };

    const bestMoveArrow = useMemo<[Square, Square, string?][]>(() => {
        const move = currentEngine?.bestMoveUci;
        if (!showBestMoveArrow || boardBadgeKind || linePreview || !engineEnabled || !move || move.length < 4) return [];
        return [[move.slice(0, 2) as Square, move.slice(2, 4) as Square, "#315c9a"]];
    }, [boardBadgeKind, currentEngine?.bestMoveUci, engineEnabled, linePreview, showBestMoveArrow]);

    const lastMoveSquares = !linePreview && currentNode?.uci?.length >= 4
        ? [currentNode.uci.slice(0, 2) as Square, currentNode.uci.slice(2, 4) as Square]
        : [];

    const panelTabs: Array<{ id: PanelTab; label: string; icon: typeof Clipboard }> = [
        { id: "overview", label: "Огляд", icon: BarChart3 },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "info", label: "Інфо", icon: Info },
    ];

    const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        const currentIndex = panelTabs.findIndex(item => item.id === tab);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + panelTabs.length) % panelTabs.length;
        setTab(panelTabs[nextIndex].id);
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIndex]?.focus();
    };

    const missing = (value?: string | null) => value?.trim() || "Не вказано";
    const resultLabel = record.headers.Result && record.headers.Result !== "*" ? record.headers.Result : "Не завершено";
    const moveCount = new Set(record.mainline.map(node => node.moveNumber)).size;

    return (
        <div className="analysis-center analysis-center-v3 analysis-center-v4">
            <input ref={fileInputRef} className="hidden" type="file" accept=".pgn" onChange={event => void handleFile(event.target.files?.[0])} />

            <main className="analysis-workspace">
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
                                onMove={handleAnalysisBoardMove}
                                customArrows={bestMoveArrow}
                                lastMoveSquares={lastMoveSquares}
                                showLastMove
                                showLegalMoves
                                showChecks
                                allowArrows={showBestMoveArrow && !linePreview}
                                animationDuration={moveAnimation ? 150 : 0}
                                customBoardStyle={{ borderRadius: 10, boxShadow: "0 16px 42px rgba(27,49,80,.16)" }}
                            />

                            {boardBadgeKind && badgeSquare && currentNode && (
                                <span className="analysis-board-badge-slot" style={badgeSquareStyle(badgeSquare, flipped)}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className={`analysis-board-badge analysis-board-badge-${boardBadgeKind}`}
                                                aria-label={boardBadgeKind === "book" ? "Хід позначено як теорію" : `Хід класифіковано як ${BOARD_BADGE_LABELS[boardBadgeKind]}`}
                                                onClick={() => boardBadgeKind !== "book" && setTab("engine")}
                                            >
                                                {BOARD_BADGE_MARKS[boardBadgeKind]}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                            <div className="analysis-badge-tooltip">
                                                <strong>{BOARD_BADGE_LABELS[boardBadgeKind]}</strong>
                                                {boardBadgeKind === "book" ? (
                                                    <span>{opening?.line?.name || opening?.opening.name || "Хід із дебютної бази"}</span>
                                                ) : (
                                                    <>
                                                        {reviewBeforeEval != null && reviewAfterEval != null && <span>Оцінка: {formatCp(reviewBeforeEval)} → {formatCp(reviewAfterEval)}</span>}
                                                        {currentNode.evalLoss != null && <span>Втрата: {(currentNode.evalLoss / 100).toFixed(2)}</span>}
                                                    </>
                                                )}
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
                        {tab === "engine" && (
                            <div className="analysis-engine-workspace-v3">
                                <section className="analysis-engine-control-v3" aria-label="Керування Stockfish">
                                    <div className="analysis-engine-control-main-v3">
                                        <BrainCircuit size={22} />
                                        <div>
                                            <strong>{engineSource(currentEngine)}</strong>
                                            <span>{!engineEnabled ? "Вимкнено" : enginePaused ? "Призупинено" : positionBusy ? "Аналізує позицію…" : currentEngine ? "Готовий" : "Очікує позицію"}</span>
                                        </div>
                                    </div>
                                    <div className="analysis-engine-control-actions-v3">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-label="Stockfish"
                                            aria-checked={engineEnabled}
                                            className="analysis-engine-toggle-v3"
                                            onClick={() => {
                                                setEngineEnabled(value => !value);
                                                setEnginePaused(false);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className={cn("analysis-engine-pause-v4", enginePaused && "is-paused")}
                                            aria-label={enginePaused ? "Продовжити Stockfish" : "Призупинити Stockfish"}
                                            disabled={!engineEnabled}
                                            onClick={() => setEnginePaused(value => !value)}
                                        >
                                            {enginePaused ? <Play size={17} /> : <Pause size={17} />}
                                        </button>
                                        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                                                <PopoverTrigger asChild>
                                                    <button type="button" className="analysis-engine-settings-v3" aria-label="Налаштувати движок">
                                                        <Settings2 size={17} />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent side="bottom" align="end" className="analysis-settings-popover">
                                                    <div className="analysis-popover-heading"><strong>Інтерфейс</strong><span>Режим</span></div>
                                                    <div className="analysis-ui-mode-options" role="group" aria-label="Режим Analysis">
                                                        <button type="button" className={cn(analysisUiMode === "simple" && "is-active")} aria-pressed={analysisUiMode === "simple"} onClick={() => setAnalysisUiMode("simple")}>
                                                            <strong>Простий</strong><span>Менше деталей</span>
                                                        </button>
                                                        <button type="button" className={cn(analysisUiMode === "advanced" && "is-active")} aria-pressed={analysisUiMode === "advanced"} onClick={() => setAnalysisUiMode("advanced")}>
                                                            <strong>Розширений</strong><span>Depth і MultiPV</span>
                                                        </button>
                                                    </div>

                                                    <div className="analysis-popover-heading analysis-popover-subheading"><strong>Движок</strong><span>Глибина</span></div>
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
                                    </div>
                                </section>

                                <div className="analysis-engine-meta-v3">
                                    <span>Глибина <b>{currentEngine?.depth || engineDepth}</b></span>
                                    <i aria-hidden="true" />
                                    <span><b>{Math.min(3, multiPv)}</b> {Math.min(3, multiPv) === 1 ? "варіант" : "варіанти"}</span>
                                </div>

                                {engineEnabled && (
                                    <>
                                        <div className="analysis-engine-verdict-v3" aria-live="polite">
                                            <strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong>
                                            <span>{engineVerdict(currentEngine?.numericScore)}</span>
                                        </div>

                                        {analysisUiMode === "advanced" && (
                                            <div className="analysis-engine-advanced-v3" aria-label="Розширені дані движка">
                                                <span><small>Глибина</small><b>{currentEngine?.depth || engineDepth}</b></span>
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
                                        <strong>{showFullMoveTree ? "Варіанти" : "Ходи партії"}</strong>
                                        <button type="button" onClick={() => setShowFullMoveTree(value => !value)}>{showFullMoveTree ? "Партія" : "Усі варіанти"}</button>
                                    </div>
                                    {showFullMoveTree ? (
                                        <div className="analysis-full-tree-v4" aria-label="Повне дерево ходів">
                                            <AnalysisMoveTree
                                                record={record}
                                                setRecord={setRecord}
                                                onNavigate={navigateTo}
                                                onOpenEngine={() => setShowFullMoveTree(false)}
                                                onPreviewBestMove={previewReviewedBestMove}
                                            />
                                        </div>
                                    ) : (
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
                                    )}
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
                        )}

                        {tab === "overview" && (
                            <div className="analysis-overview-panel">
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
                                        <div className="analysis-overview-topbar">
                                            <div><strong>Огляд партії</strong><span>{reviewedNodes.length} перевірених ходів · реальна оцінка Stockfish</span></div>
                                            {!review.running && <Button variant="outline" size="sm" className="analysis-rerun-button" onClick={() => void startFullReview()}><Play size={14} />Заново</Button>}
                                        </div>

                                        <div className="analysis-accuracy-grid">
                                            <div><span>Білі</span><strong>{whiteAccuracy ?? "—"}%</strong></div>
                                            <div><span>Загальна</span><strong>{overallAccuracy ?? "—"}%</strong></div>
                                            <div><span>Чорні</span><strong>{blackAccuracy ?? "—"}%</strong></div>
                                        </div>

                                        <AnalysisEvaluationGraph
                                            record={record}
                                            currentPath={record.currentPath}
                                            onNavigate={navigateTo}
                                        />

                                        <section className="analysis-overview-section">
                                            <div className="analysis-overview-section-title">
                                                <div><strong>Класифікація ходів</strong><span>Натисніть категорію, щоб перейти до першого такого ходу</span></div>
                                                {overviewFilter !== "all" && <button type="button" className="analysis-overview-clear-filter" onClick={() => setOverviewFilter("all")}>Усі</button>}
                                            </div>
                                            <div className="analysis-summary-table">
                                                {(["best", "excellent", "good", "inaccuracy", "mistake", "blunder"] as MoveClassification[]).map(kind => (
                                                    <button
                                                        key={kind}
                                                        type="button"
                                                        className={cn(overviewFilter === kind && "is-selected")}
                                                        aria-pressed={overviewFilter === kind}
                                                        onClick={() => {
                                                            setOverviewFilter(kind);
                                                            const target = renderedMoves.find(entry => entry.node.classification === kind);
                                                            if (target) navigateTo(target.path);
                                                        }}
                                                    >
                                                        <span className={`analysis-classification analysis-classification-${kind}`}>{CLASSIFICATION_MARKS[kind]}</span>
                                                        <span>{CLASSIFICATION_LABELS[kind]}</span>
                                                        <strong>{counts[kind]}</strong>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="analysis-overview-section">
                                            <div className="analysis-overview-section-title"><div><strong>Ключові моменти</strong><span>{overviewFilter === "all" ? "Неточності, помилки та грубі помилки" : CLASSIFICATION_LABELS[overviewFilter]}</span></div></div>
                                            <div className="analysis-key-moments">
                                                {overviewMoments.length ? overviewMoments.map(entry => {
                                                    const node = entry.node;
                                                    return (
                                                        <button key={node.id} type="button" onClick={() => navigateTo(entry.path)}>
                                                            <div className="analysis-key-moment-main">
                                                                <div className="analysis-key-moment-head"><strong>{node.moveNumber}{node.color === "w" ? "." : "..."} {node.san}</strong></div>
                                                                <p>{ukrainianExplanationForMove(node.classification!, node.color, node.bestMoveSan)}</p>
                                                                {node.bestMoveSan && node.classification !== "best" && <small>Краще: {node.bestMoveSan}</small>}
                                                            </div>
                                                            <span className={`analysis-classification analysis-classification-${node.classification}`}>{CLASSIFICATION_MARKS[node.classification!]}</span>
                                                        </button>
                                                    );
                                                }) : <p className="analysis-muted">Для цієї категорії ходів не знайдено.</p>}
                                            </div>
                                        </section>

                                        <div className="analysis-overview-meta"><span>Дебют</span><strong>{opening?.line?.name || opening?.opening.name || "Не визначено"}</strong></div>
                                    </>
                                ) : !review.running ? (
                                    <div className="analysis-empty-state">
                                        <Gauge size={30} />
                                        <strong>Огляд ще не готовий</strong>
                                        <p>Запустіть повний аналіз партії, щоб отримати точність, класифікації та ключові моменти.</p>
                                        <Button size="sm" disabled={!record.mainline.length} onClick={() => void startFullReview()}><Play size={15} />Проаналізувати партію</Button>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {tab === "info" && (
                            <div className="analysis-info-panel">
                                <div className="analysis-info-header">
                                    <div><strong>Дані партії</strong><span>Метадані PGN, гравці та дебют</span></div>
                                    <button type="button" className="analysis-info-copy" disabled={!metadataText} onClick={() => void copyText(metadataText, "Метадані PGN")}><Copy size={14} />Копіювати дані</button>
                                </div>

                                <div className="analysis-info-players">
                                    <div className="analysis-info-player"><span>Білі</span><strong>{missing(record.headers.White)}</strong><small>{record.headers.WhiteElo ? `Рейтинг ${record.headers.WhiteElo}` : "Рейтинг не вказано"}</small></div>
                                    <div className="analysis-info-player"><span>Чорні</span><strong>{missing(record.headers.Black)}</strong><small>{record.headers.BlackElo ? `Рейтинг ${record.headers.BlackElo}` : "Рейтинг не вказано"}</small></div>
                                </div>

                                <div className="analysis-info-grid">
                                    {[
                                        ["Результат", resultLabel],
                                        ["Контроль часу", missing(record.headers.TimeControl)],
                                        ["Дата", missing(record.headers.Date)],
                                        ["Подія", missing(record.headers.Event)],
                                        ["Місце", missing(record.headers.Site)],
                                        ["Тур", missing(record.headers.Round)],
                                        ["Ходів", moveCount ? String(moveCount) : "Немає"],
                                        ["Завершення", missing(record.headers.Termination)],
                                    ].map(([label, value]) => (
                                        <div key={label} className="analysis-info-item"><span>{label}</span><strong className={value === "Не вказано" ? "is-missing" : undefined}>{value}</strong></div>
                                    ))}
                                </div>

                                <div className="analysis-info-opening">
                                    <div><span>Дебют</span><strong title={opening?.opening.name || undefined}>{opening?.line?.name || opening?.opening.name || "Не визначено"}</strong></div>
                                    <b>{opening?.opening.eco || "ECO —"}</b>
                                </div>

                                {record.rootFen !== START_FEN && (
                                    <div className="analysis-info-fen"><span>Початкова FEN</span><code>{record.rootFen}</code></div>
                                )}

                                {!metadataText && <div className="analysis-empty-state compact"><FileText size={24} /><strong>Метаданих поки немає</strong><p>Імпортуйте PGN із заголовками, щоб тут з’явилися дані партії.</p></div>}
                            </div>
                        )}
                    </div>

                    <div className="analysis-panel-navigation analysis-panel-navigation-v3" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="На початок" icon={<ChevronsLeft size={19} />} onClick={goFirst} disabled={!canGoPrevious} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={19} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={19} />} onClick={goNext} disabled={!canGoNext} />
                        <NavIconButton label="У кінець" icon={<ChevronsRight size={19} />} onClick={goLast} disabled={!canGoLast} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? "Активна лінія: " + navigationLabel : "Позиція: " + navigationLabel}>{navigationLabel}</span>
                    </div>

                    <div className="analysis-panel-actions-v4" aria-label="Дії аналізу">
                        <button
                            type="button"
                            className={cn("analysis-prediction-v4", predictionMode && "is-active")}
                            aria-pressed={predictionMode}
                            disabled={!engineEnabled || !currentEngine?.bestMoveUci || review.running || Boolean(linePreview)}
                            onClick={() => {
                                setPredictionMode(value => {
                                    const next = !value;
                                    if (next) toast.info("Зробіть свій прогнозований хід на дошці.");
                                    return next;
                                });
                            }}
                        >
                            <BrainCircuit size={17} />
                            <span>Мій прогноз</span>
                        </button>

                        <button type="button" className="analysis-bottom-icon-v4" aria-label="Зберегти позицію в закладки" onClick={savePositionBookmark}>
                            <Bookmark size={19} />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button type="button" className="analysis-more-v4" aria-label="Додаткові дії аналізу">
                                    <MoreHorizontal size={18} />
                                    <span>Ще</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="top" className="w-64">
                                <DropdownMenuItem onSelect={resetAnalysis}><Plus size={16} className="mr-2" />Нова позиція</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openImport("pgn")}><Clipboard size={16} className="mr-2" />Імпорт PGN</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}><FileUp size={16} className="mr-2" />Відкрити PGN-файл</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openImport("fen")}><Copy size={16} className="mr-2" />Вставити FEN</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={!record.mainline.length} onSelect={() => void copyText(buildAnalysisPgn(record), "PGN")}><Copy size={16} className="mr-2" />Копіювати PGN</DropdownMenuItem>
                                <DropdownMenuItem disabled={!record.mainline.length} onSelect={downloadPgn}><Download size={16} className="mr-2" />Зберегти PGN</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => void copyText(currentFen, "FEN")}><Copy size={16} className="mr-2" />Копіювати FEN</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setFlipped(value => !value)}><FlipVertical size={16} className="mr-2" />Перевернути дошку</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={!hasVariations} onSelect={clearVariations}><Trash2 size={16} className="mr-2" />Очистити власні варіанти</DropdownMenuItem>
                                <DropdownMenuItem disabled={!reviewedNodes.length} onSelect={clearReviewResults}><Trash2 size={16} className="mr-2" />Очистити результати аналізу</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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
