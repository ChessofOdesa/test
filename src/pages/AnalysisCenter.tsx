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
    SlidersHorizontal,
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
import "@/styles/analysis-panel-professional.css";

type PanelTab = "moves" | "engine" | "overview" | "info";
type ImportMode = "pgn" | "fen";
type OverviewFilter = MoveClassification | "all";
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

    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);
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
    }, [analyzeCached, currentFen, engineDepth, engineEnabled, multiPv]);

    const navigateTo = useCallback((path: number[] | null) => {
        setLinePreview(null);
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
            setTab("moves");
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
            setTab("moves");
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
    }, [currentFen, currentNode?.ply, linePreview, renderedMoves]);

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
            setTab("moves");
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
        setTab("moves");
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
        { id: "moves", label: "Ходи", icon: Clipboard },
        { id: "engine", label: "Движок", icon: BrainCircuit },
        { id: "overview", label: "Огляд", icon: BarChart3 },
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
    const moveCount = Math.ceil(record.mainline.length / 2);

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
                        onClick={() => setEngineEnabled(value => !value)}
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
                                        <div className="analysis-engine-toolbar">
                                            <div><strong>Движок</strong><span>Поточна позиція та найсильніші продовження</span></div>
                                            <button type="button" className="analysis-engine-settings-link" onClick={() => setSettingsOpen(true)}><SlidersHorizontal size={14} />Налаштувати</button>
                                        </div>

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

                                        <div className="analysis-engine-verdict"><Gauge size={15} /><span>Оцінка позиції:</span><strong>{engineVerdict(currentEngine?.numericScore)}</strong></div>

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
                                                        <span>Вибраний хід</span>
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
                                                <div className="analysis-best-move-actions">
                                                    <Button variant="outline" size="sm" disabled={!engineLines.length} onClick={() => engineLines[0] && previewEngineLine(engineLines[0], "Найкращий варіант")}>Показати на дошці</Button>
                                                    <Button variant="ghost" size="sm" disabled={!record.currentPath || !engineLines.length} onClick={() => engineLines[0] && addEngineLineToVariations(engineLines[0])}><GitBranch size={14} />Додати до варіантів</Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="analysis-engine-lines-section">
                                            <div className="analysis-section-heading"><div><span>Варіанти Stockfish</span><small>Клік відкриває preview · + зберігає у дерево</small></div></div>
                                            <div className="analysis-engine-lines">
                                                {positionBusy && !engineLines.length
                                                    ? Array.from({ length: Math.min(multiPv, 5) }, (_, index) => <div key={index} className="analysis-line-skeleton" />)
                                                    : engineLines.map(line => (
                                                        <div key={line.id} className={cn("analysis-engine-line-row", line.rank === 1 && "is-best")}>
                                                            <button type="button" className="analysis-engine-line-preview" onClick={() => previewEngineLine(line)} title={line.moves}>
                                                                <span className="analysis-line-rank">{line.rank}</span>
                                                                <strong>{line.score}</strong>
                                                                <span className="analysis-line-moves">{line.moves || "Варіант обчислюється…"}</span>
                                                                <ChevronRight size={15} />
                                                            </button>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button type="button" className="analysis-engine-line-add" disabled={!record.currentPath} onClick={() => addEngineLineToVariations(line)} aria-label={`Додати варіант Stockfish ${line.rank} до дерева`}><GitBranch size={14} /></button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Додати до варіантів</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    ))}
                                                {!positionBusy && !engineLines.length && <div className="analysis-empty-state compact"><BrainCircuit size={25} /><strong>Лінії ще не готові</strong><p>Stockfish сформує найсильніші продовження для поточної позиції.</p></div>}
                                            </div>
                                        </div>
                                    </>
                                )}
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

                    <div className="analysis-panel-navigation" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="На початок партії" icon={<ChevronsLeft size={18} />} onClick={goFirst} disabled={currentMoveIndex < 0} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={18} />} onClick={goPrevious} disabled={currentMoveIndex < 0} />
                        <span aria-live="polite" title={currentMoveIndex >= 0 ? `Позиція ${currentMoveIndex + 1} із ${renderedMoves.length}` : "Початкова позиція"}>{currentMoveIndex >= 0 ? `${currentMoveIndex + 1} / ${renderedMoves.length}` : `0 / ${renderedMoves.length}`}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={18} />} onClick={goNext} disabled={!renderedMoves.length || currentMoveIndex >= renderedMoves.length - 1} />
                        <NavIconButton label="У кінець партії" icon={<ChevronsRight size={18} />} onClick={goLast} disabled={!renderedMoves.length || currentMoveIndex >= renderedMoves.length - 1} />
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
