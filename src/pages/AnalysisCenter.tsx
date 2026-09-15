import GameMetadataDialog from '@/features/analysis/GameMetadataDialog';
import PredictionDialog from '@/features/analysis/PredictionDialog';
import PositionImageDialog from '@/features/analysis/PositionImageDialog';
import { savePrediction } from '@/features/analysis/predictionModel';
import { toggleArrow } from '@/features/analysis/annotations';
import type { PositionImageOptions } from '@/features/analysis/positionImage';
import { useAnalysisWorkspace } from "@/features/analysis/useAnalysisWorkspace";
import { readDraft, readSharedAnalysis, undoRecord, redoRecord } from "@/features/analysis/workspace";
import { readPositionCache, writePositionCache, clearPositionCache } from "@/features/analysis/positionCache";
import { ArchiveDialog, ShareDialog } from "@/features/analysis/WorkspaceDialogs";
import PositionEditor from "@/features/analysis/PositionEditor";
import { CompareLines, MistakeTraining } from "@/features/analysis/PracticeTools";
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
import { analysisNavigationLabel, lastAnalysisPath, nextAnalysisPath, previousAnalysisPath } from "@/features/analysis/navigation";
import { buildSanLinePreview } from "@/features/analysis/preview";
import { buildAnalysisPgn } from "@/features/analysis/pgnTree";
import {
    START_FEN,
    appendAnalysisLine,
    buildRecordFromPgn,
    classificationFromLoss,
    countLabels,
    createRecord,
    explanationForMove,
    findOpening,
    formatAnalysisError,
    formatCp,
    getCurrentFen,
    getLastMove,
    getRecordNode,
    isSamePath,
    numericScoreFromEngine,
    renderMoves,
    uciPvToSan,
    uciToSan,
    updateNodeAtPath,
    updateRecordNode,
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
    ChevronDown,
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
    FolderOpen,
    Undo2,
    Redo2,
    Share2,
    Pencil,
    Bookmark,
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
import "@/styles/analysis-panel-professional.css";
import "@/styles/analysis-workspace-tools.css";

type PanelTab = "moves" | "engine" | "overview" | "info";
type ImportMode = "pgn" | "fen";
type OverviewFilter = MoveClassification | "all";
type AnalysisUiMode = "simple" | "advanced";
type BoardBadgeKind = MoveClassification | "book";

type ReviewState = {
    running: boolean;
    paused?: boolean;
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
    if (summary.scoreMate != null) return `${summary.scoreMate < 0 ? "−" : ""}M${Math.abs(summary.scoreMate)}`;
    return formatCp(summary.numericScore);
}

function engineLineScore(line: EngineLine) {
    return line.scoreMate != null ? `${line.scoreMate < 0 ? "−" : ""}M${Math.abs(line.scoreMate)}` : formatCp(line.scoreCp);
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

function sideAccuracy(record: AnalysisRecord, color?: "w" | "b") {
    const nodes = record.mainline.filter((node, index) => (!color || node.color === color) && node.evalLoss != null && node.engineMate == null && (index === 0 || record.mainline[index - 1].engineMate == null));
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

    const { record, setRecord, editRecord, saveStatus } = useAnalysisWorkspace(() => readDraft() || createRecord());
    const [workspaceDialog, setWorkspaceDialog] = useState<'archive' | 'share' | 'editor' | 'training' | 'compare' | 'metadata' | 'prediction' | 'image' | null>(null);
    const [imageSource, setImageSource] = useState<PositionImageOptions | null>(null);
    const [activeSaveId, setActiveSaveId] = useState<string | null>(null);
    const [economy, setEconomy] = useState(false);
    const [pageVisible, setPageVisible] = useState(() => document.visibilityState !== 'hidden');
    const [deepPosition, setDeepPosition] = useState<string | null>(null);
    const [focusBranch, setFocusBranch] = useState(false);
    const [followSelection, setFollowSelection] = useState(true);
    const [mobileFocus, setMobileFocus] = useState(true);
    const [panelWidth, setPanelWidth] = useState(460);
    const [resizing, setResizing] = useState(false);
    const panelRef = useRef<HTMLElement | null>(null);
    const reviewProgressRef = useRef<{ identity: string; next: number } | null>(null);
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
    const [overviewFilter, setOverviewFilter] = useState<OverviewFilter>("all");
    const [analysisUiMode, setAnalysisUiMode] = useState<AnalysisUiMode>("simple");

    const renderedMoves = useMemo(() => [...renderMoves(record.mainline), ...renderMoves(record.rootVariations || [], 1, [-1])], [record.mainline, record.rootVariations]);
    const currentNode = useMemo(() => getLastMove(record), [record]);
    const currentFen = useMemo(() => getCurrentFen(record), [record]);
    const requestedDepth = deepPosition === currentFen ? 16 : economy ? 8 : engineDepth;
    const requestedMultiPv = economy ? 1 : multiPv;
    const positionKey = `${requestedDepth}:${requestedMultiPv}:${currentFen}`;
    const currentEngine = engineEnabled && positionResult?.requestKey === positionKey ? positionResult : null;
    const gameIdentity = `${record.rootFen}:${record.mainline.map(node => node.id).join(",")}`;
    const reviewedNodes = useMemo(() => record.mainline.filter(node => node.evalLoss != null), [record.mainline]);
    const opening = useMemo(() => record.rootFen === START_FEN ? findOpening(record.mainline) : null, [record.rootFen, record.mainline]);
    const counts = useMemo(() => countLabels(record.mainline.map(node => ({ ...node, children: [] }))), [record.mainline]);
    const whiteAccuracy = useMemo(() => sideAccuracy(record, "w"), [record]);
    const blackAccuracy = useMemo(() => sideAccuracy(record, "b"), [record]);
    const overallAccuracy = sideAccuracy(record);
    const hasVariations = renderedMoves.some(entry => entry.depth > 0);
    const whitePlayer = playerLabel(record, "white");
    const blackPlayer = playerLabel(record, "black");
    const topPlayer = flipped ? whitePlayer : blackPlayer;
    const bottomPlayer = flipped ? blackPlayer : whitePlayer;
    const currentEval = currentEngine?.numericScore ?? currentNode?.engineEval ?? 0;
    const hasEvaluation = engineEnabled && !linePreview && Boolean(currentEngine || currentNode?.engineEval != null || currentNode?.engineMate != null);
    const currentMate = currentEngine ? currentEngine.scoreMate : currentNode?.engineMate;
    const evalText = !engineEnabled ? "OFF" : linePreview ? "—" : currentMate != null
        ? `${currentMate < 0 ? "−" : ""}M${Math.abs(currentMate)}`
        : hasEvaluation ? formatCp(currentEval) : "—";
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
        const reviewed = renderedMoves.filter(entry => entry.depth === 0 && entry.node.classification);
        if (overviewFilter !== "all") return reviewed.filter(entry => entry.node.classification === overviewFilter);
        return reviewed.filter(entry => ["inaccuracy", "mistake", "blunder"].includes(entry.node.classification || ""));
    }, [overviewFilter, renderedMoves]);

    const selectedMomentIndex = overviewMoments.findIndex(entry => isSamePath(entry.path, record.currentPath));
    const nextMoment = overviewMoments[selectedMomentIndex < 0 ? 0 : (selectedMomentIndex + 1) % overviewMoments.length];

    const metadataText = useMemo(() => {
        return Object.entries(record.headers).filter(([, value]) => value && !/^\?/.test(value)).map(([key, value]) => `${key}: ${value}`).join("\n");
    }, [record.headers]);

    const cancelReview = useCallback(() => {
        reviewAbortRef.current?.abort();
        reviewAbortRef.current = null;
        reviewProgressRef.current = null;
        setReview(current => ({ ...current, running: false, paused: false }));
    }, []);

    const pauseReview = useCallback(() => {
        reviewAbortRef.current?.abort(); reviewAbortRef.current = null;
        setReview(current => current.running ? { ...current, running: false, paused: true } : current);
    }, []);
    const changeHistory = useCallback((redo = false) => {
        cancelReview(); setLinePreview(null); setRecord(current => redo ? redoRecord(current) : undoRecord(current));
    }, [cancelReview, setRecord]);
    const openWorkspaceDialog = (value: typeof workspaceDialog) => { pauseReview(); setLinePreview(null); setWorkspaceDialog(value); };
    useEffect(() => { const update = () => { const visible = document.visibilityState !== 'hidden'; setPageVisible(visible); if (!visible && economy) pauseReview(); }; document.addEventListener('visibilitychange', update); return () => document.removeEventListener('visibilitychange', update); }, [economy, pauseReview]);
    useEffect(() => {
        if (!resizing) return;
        const move = (event: PointerEvent) => { const right = panelRef.current?.getBoundingClientRect().right; if (right) setPanelWidth(Math.max(340, Math.min(620, right - event.clientX))); };
        const stop = () => setResizing(false);
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
        return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
    }, [resizing]);

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
            const maxByHeight = window.innerWidth <= 760 && mobileFocus ? Math.max(160, window.innerHeight * .35) : Math.max(300, window.innerHeight - 128);
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
    }, [mobileFocus]);

    useEffect(() => {
        const routePgn = typeof location.state?.pgn === "string" ? location.state.pgn : searchParams.get("pgn");
        const routeFen = searchParams.get("fen");
        const sharedHash = location.hash.startsWith('#analysis=') ? location.hash : '';
        const source = routePgn || routeFen || sharedHash;
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
            } else if (sharedHash) {
                const shared = readSharedAnalysis(sharedHash);
                if (shared) { setRecord(shared); setTab("moves"); setLinePreview(null); toast.success("Спільний аналіз відкрито."); }
            }
        } catch {
            toast.error("Не вдалося відкрити переданий PGN або FEN.");
        }
    }, [location.state, location.hash, searchParams, setRecord]);

    const analyzeCached = useCallback(async (fen: string, depth: number, requestedMultiPv: number, signal: AbortSignal) => {
        if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
        const key = `${depth}:${requestedMultiPv}:${fen}`;
        const cached = engineCacheRef.current.get(key) || readPositionCache(key);
        if (cached) return cached;
        const result = await analyzeFenWithStockfish(fen, depth, undefined, 20_000, {
            signal,
            multiPv: requestedMultiPv,
            workerOnly: true,
            movetime: depth >= 16 ? 4500 : depth >= 12 ? 1500 : 600,
        });
        if (signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
        const summary = toEngineSummary(fen, result);
        if (engineCacheRef.current.size >= 256) {
            engineCacheRef.current.delete(engineCacheRef.current.keys().next().value!);
        }
        engineCacheRef.current.set(key, summary);
        writePositionCache(key, summary);
        return summary;
    }, []);

    useEffect(() => {
        positionAbortRef.current?.abort();
        if (!engineEnabled || review.running || workspaceDialog || economy && !pageVisible) {
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
            void analyzeCached(currentFen, requestedDepth, requestedMultiPv, controller.signal)
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
    }, [analyzeCached, currentFen, requestedDepth, engineEnabled, requestedMultiPv, positionKey, review.running, workspaceDialog, economy, pageVisible]);

    const navigateTo = useCallback((path: number[] | null) => {
        setLinePreview(null);
        setRecord(current => ({ ...current, currentPath: path ? [...path] : null }));
    }, [setRecord]);

    const previousPath = useMemo(() => previousAnalysisPath(record, record.currentPath), [record]);
    const nextPath = useMemo(() => nextAnalysisPath(record, record.currentPath), [record]);
    const lastPath = useMemo(() => lastAnalysisPath(record, record.currentPath), [record]);
    const navigationLabel = useMemo(() => analysisNavigationLabel(record, record.currentPath), [record]);
    const canGoPrevious = linePreview ? linePreview.index > 0 : Boolean(record.currentPath);
    const canGoNext = linePreview ? linePreview.index < linePreview.fens.length - 1 : nextPath !== null;

    const goFirst = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: 0 } : null);
        else navigateTo(null);
    }, [linePreview, navigateTo]);
    const goPrevious = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: Math.max(0, current.index - 1) } : null);
        else if (record.currentPath) navigateTo(previousPath);
    }, [linePreview, navigateTo, previousPath, record.currentPath]);
    const goNext = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: Math.min(current.fens.length - 1, current.index + 1) } : null);
        else if (nextPath) navigateTo(nextPath);
    }, [linePreview, navigateTo, nextPath]);
    const goLast = useCallback(() => {
        if (linePreview) setLinePreview(current => current ? { ...current, index: current.fens.length - 1 } : null);
        else if (lastPath) navigateTo(lastPath);
    }, [linePreview, lastPath, navigateTo]);

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const typing = event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]');
            if (!typing && !review.running && !importOpen && !settingsOpen && !workspaceDialog && (event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) { event.preventDefault(); changeHistory(event.shiftKey || event.key.toLowerCase() === 'y'); return; }
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable || target?.closest('[role="dialog"], [role="menu"], [role="tablist"], [role="slider"]')) return;
            if (importOpen || settingsOpen || workspaceDialog) return;
            if (event.key === "ArrowLeft") { event.preventDefault(); goPrevious(); }
            if (event.key === "ArrowRight") { event.preventDefault(); goNext(); }
            if (event.key === "Home") { event.preventDefault(); goFirst(); }
            if (event.key === "End") { event.preventDefault(); goLast(); }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [goFirst, goLast, goNext, goPrevious, importOpen, linePreview, settingsOpen, workspaceDialog, review.running, changeHistory]);

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
                editRecord(imported); setActiveSaveId(null);
                toast.success("PGN завантажено.");
            } else {
                editRecord(imported); setActiveSaveId(null);
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
            const imported = buildRecordFromPgn(text);
            cancelReview();
            editRecord(imported); setActiveSaveId(null);
            setImportDraft(text);
            setCurrentEngine(null);
            setLinePreview(null);
            setTab("moves");
            setReview({ running: false, current: 0, total: 0, error: "" });
            setOverviewFilter("all");
            setImportOpen(false);
            toast.success("PGN-файл завантажено.");
        } catch {
            toast.error("Не вдалося прочитати PGN-файл.");
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const addVariationMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        if (linePreview || review.running) return false;
        try { editRecord(appendAnalysisLine(record, [`${from}${to}${promotion || ""}`])); return true; }
        catch { return false; }
    }, [linePreview, record, review.running, editRecord]);

    const startFullReview = async (resume = false) => {
        if (!record.mainline.length || reviewAbortRef.current) return;
        positionAbortRef.current?.abort();
        setLinePreview(null);
        setOverviewFilter("all");
        const controller = new AbortController();
        reviewAbortRef.current = controller;
        const total = record.mainline.length;
        const start = resume && reviewProgressRef.current?.identity === gameIdentity ? reviewProgressRef.current.next : 0;
        reviewProgressRef.current = { identity: gameIdentity, next: start };
        setReview({ running: true, paused: false, current: start, total, error: "" });

        try {
            for (let index = start; index < total; index += 1) {
                if (controller.signal.aborted) throw new DOMException("Analysis cancelled", "AbortError");
                const node = record.mainline[index];
                const depth = economy ? 8 : Math.min(engineDepth, 12);
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
                reviewProgressRef.current = { identity: gameIdentity, next: index + 1 };
                setReview({ running: true, current: index + 1, total, error: "" });
            }
            reviewProgressRef.current = null;
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
        editRecord(createRecord()); setActiveSaveId(null);
        setCurrentEngine(null);
        setLinePreview(null);
        setReview({ running: false, current: 0, total: 0, error: "" });
        setOverviewFilter("all");
        setTab("moves");
        toast.success("Відкрито нову позицію для аналізу.");
    };

    const clearVariations = () => {
        if (!hasVariations) return;
        editRecord(current => ({
            ...current,
            mainline: stripVariations(current.mainline),
            rootVariations: [],
            currentPath: current.currentPath && current.currentPath.length === 1 ? current.currentPath : null,
        }));
        setLinePreview(null);
        toast.success("Власні варіанти очищено.");
    };

    const clearReviewResults = () => {
        if (!reviewedNodes.length) return;
        cancelReview();
        editRecord(current => ({ ...current, mainline: clearReviewData(current.mainline), rootVariations: clearReviewData(current.rootVariations || []) }));
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
        const node = getRecordNode(record, record.currentPath);
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
    }, [record]);

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
        if (review.running || !line.pv.length) return;
        try {
            editRecord(appendAnalysisLine(record, line.pv.slice(0, 20)));
            setLinePreview(null);
            setTab("moves");
            toast.success("Лінію Stockfish відкрито у ходах.");
        } catch {
            toast.error("Не вдалося додати лінію до цієї позиції.");
        }
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
        event.stopPropagation();
        const currentIndex = panelTabs.findIndex(item => item.id === tab);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (currentIndex + direction + panelTabs.length) % panelTabs.length;
        setTab(panelTabs[nextIndex].id);
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        buttons[nextIndex]?.focus();
    };

    const missing = (value?: string | null) => value?.trim() && !/^\?/.test(value) ? value : "Не вказано";
    const resultLabel = record.headers.Result && record.headers.Result !== "*" ? record.headers.Result : "Не завершено";
    const savedArrows = useMemo(() => currentNode?.arrows || record.rootArrows || [], [currentNode, record.rootArrows]);
    const visibleArrows = useMemo(() => linePreview ? [] : [...savedArrows, ...bestMoveArrow.filter(arrow => !savedArrows.some(saved => saved[0] === arrow[0] && saved[1] === arrow[1]))], [savedArrows, bestMoveArrow, linePreview]);
    const changeAnnotationArrow = (from: Square, to: Square) => {
        if (linePreview || review.running || workspaceDialog) return;
        editRecord(current => current.currentPath
            ? updateRecordNode(current, current.currentPath, node => { node.arrows = toggleArrow(node.arrows, from, to); })
            : { ...current, rootArrows: toggleArrow(current.rootArrows || [], from, to) });
    };
    const clearAnnotationArrows = () => editRecord(current => current.currentPath
        ? updateRecordNode(current, current.currentPath, node => { node.arrows = []; })
        : { ...current, rootArrows: [] });
    const openPositionImage = () => {
        setImageSource({ fen: displayedFen, flipped, light: boardSettings.theme.light, dark: boardSettings.theme.dark,
            title: [record.headers.White || 'Білі', record.headers.Black || 'Чорні'].join(' — '),
            comment: linePreview ? '' : currentNode?.comment || '', lastMove: lastMoveSquares?.join(''),
            arrows: visibleArrows, showLastMove: true, showArrows: true, showComment: true });
        openWorkspaceDialog('image');
    };
    const moveCount = Math.ceil(record.mainline.length / 2);

    return (
        <div className={cn("analysis-center", mobileFocus && "analysis-mobile-focus")} style={{ "--analysis-panel-width": `${panelWidth}px` } as CSSProperties}>
            <input ref={fileInputRef} className="hidden" type="file" accept=".pgn" onChange={event => void handleFile(event.target.files?.[0])} />

            <div className="analysis-session-bar"><span role="status">{saveStatus}</span><div>
                <Button variant="ghost" size="sm" aria-label="Скасувати зміну" disabled={!record.historyStack.length || review.running} onClick={() => changeHistory()}><Undo2 size={16} /></Button>
                <Button variant="ghost" size="sm" aria-label="Повторити зміну" disabled={!record.futureStack.length || review.running} onClick={() => changeHistory(true)}><Redo2 size={16} /></Button>
                <Button variant="outline" size="sm" onClick={() => openWorkspaceDialog('archive')}><FolderOpen size={15} />Мої аналізи</Button>
                <Button variant="ghost" size="sm" onClick={() => openWorkspaceDialog('share')}><Share2 size={15} />Поділитися</Button>
            </div></div>
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
                    <ToolButton label="Мій прогноз" shortLabel="Мій прогноз" icon={<BrainCircuit size={18} />} onClick={() => openWorkspaceDialog("prediction")} />
                    <ToolButton label="Редактор позиції" shortLabel="Редактор" icon={<Pencil size={18} />} onClick={() => openWorkspaceDialog("editor")} />
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
                                    <button key={depth} type="button" aria-pressed={requestedDepth === depth} className={cn(requestedDepth === depth && "is-active")} onClick={() => { pauseReview(); setEngineDepth(depth); setEconomy(false); setDeepPosition(null); }}>
                                        <strong>{depth === 8 ? "Швидкий" : depth === 12 ? "Стандартний" : "Глибокий"}</strong>
                                        <span>D{depth}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="analysis-popover-heading analysis-popover-subheading"><strong>Варіанти</strong><span>MultiPV</span></div>
                            <div className="analysis-multipv-options">
                                {[1, 2, 3, 5].map(value => <button key={value} type="button" aria-label={`Кількість варіантів: ${value}`} aria-pressed={requestedMultiPv === value} className={cn(requestedMultiPv === value && "is-active")} onClick={() => { pauseReview(); setMultiPv(value); setEconomy(false); setDeepPosition(null); }}>{value}</button>)}
                            </div>
                            {economy && <p className="analysis-muted">Економний режим: D8 і один варіант. Вибір глибини або кількості варіантів вимкне його.</p>}

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
                                <button type="button" role="switch" aria-checked={economy} onClick={() => { pauseReview(); setEconomy(value => !value); setDeepPosition(null); }}><span>Економний режим</span><b>{economy ? 'ON' : 'OFF'}</b></button>
                                <button type="button" role="switch" aria-checked={focusBranch} onClick={() => setFocusBranch(value => !value)}><span>Фокус на активному варіанті</span><b>{focusBranch ? 'ON' : 'OFF'}</b></button>
                                <button type="button" role="switch" aria-checked={followSelection} onClick={() => setFollowSelection(value => !value)}><span>Прокручувати до вибраного ходу</span><b>{followSelection ? 'ON' : 'OFF'}</b></button>
                                <button type="button" role="switch" aria-checked={mobileFocus} onClick={() => setMobileFocus(value => !value)}><span>Компактна дошка на телефоні</span><b>{mobileFocus ? 'ON' : 'OFF'}</b></button>
                                <button type="button" onClick={() => { clearPositionCache(); engineCacheRef.current.clear(); toast.success('Кеш позицій очищено.'); }}>Очистити кеш Stockfish</button>
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
                            {!currentNode && <DropdownMenuItem onSelect={() => void copyText(currentFen, "FEN")}><Copy size={16} className="mr-2" />Копіювати FEN</DropdownMenuItem>}
                            <DropdownMenuItem onSelect={() => setFlipped(value => !value)}><FlipVertical size={16} className="mr-2" />Перевернути дошку</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!savedArrows.length || review.running} onSelect={clearAnnotationArrows}><Trash2 size={16} className="mr-2" />Очистити стрілки позиції</DropdownMenuItem>
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
                            <div className="analysis-board-surface" style={{ width: boardSize, height: boardSize }}>
                            <ChessBoard
                                displayFen={displayedFen}
                                initialFen={record.rootFen}
                                size={boardSize}
                                flipped={flipped}
                                interactive={!review.running && !linePreview}
                                onMove={addVariationMove}
                                customArrows={visibleArrows}
                                onAnnotationArrow={changeAnnotationArrow}
                                lastMoveSquares={lastMoveSquares}
                                showLastMove
                                showLegalMoves
                                showChecks
                                allowArrows={!linePreview && !review.running}
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
                                                onClick={() => setTab(boardBadgeKind === "book" ? "info" : "engine")}
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
                    </div>

                    <div className="analysis-playerbar analysis-playerbar-bottom">
                        <div className="analysis-avatar analysis-avatar-light">{bottomPlayer.name.slice(0, 1).toUpperCase()}</div>
                        <strong>{bottomPlayer.name}</strong>
                        {bottomPlayer.rating && <span>{bottomPlayer.rating}</span>}
                    </div>
                </section>

                <aside ref={panelRef} className="analysis-panel" aria-label="Права панель аналізу">
                    <div role="separator" aria-label="Ширина панелі аналізу" aria-orientation="vertical" aria-valuemin={340} aria-valuemax={620} aria-valuenow={panelWidth} tabIndex={0} className="analysis-panel-resizer" onPointerDown={event => { event.preventDefault(); setResizing(true); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); setPanelWidth(value => Math.max(340, Math.min(620, value + (event.key === 'ArrowLeft' ? 20 : -20)))); } }} />
                    <div className="analysis-panel-tabs" role="tablist" aria-label="Панель аналізу" onKeyDown={handleTabKeyDown}>
                        {panelTabs.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    role="tab"
                                    id={`analysis-tab-${item.id}`}
                                    aria-controls={`analysis-panel-${item.id}`}
                                    aria-selected={tab === item.id}
                                    tabIndex={tab === item.id ? 0 : -1}
                                    onClick={() => setTab(item.id)}
                                >
                                    <Icon size={16} /><span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                        {linePreview && <div className="analysis-preview-bar analysis-preview-bar-simple" aria-live="polite">
                            <div><strong>{linePreview.label}</strong><span>{linePreview.moves.slice(0, linePreview.index + 1).join(" ")}</span></div>
                            <Button variant="ghost" size="sm" onClick={() => setLinePreview(null)}><RotateCcw size={15} />До партії</Button>
                        </div>}
                    <div className="analysis-panel-body" role="tabpanel" id={`analysis-panel-${tab}`} aria-labelledby={`analysis-tab-${tab}`}>
                        {tab === "moves" && <details className="analysis-bookmarks"><summary><Bookmark size={14} />Закладки ({renderedMoves.filter(entry => entry.node.bookmark).length})</summary>{renderedMoves.filter(entry => entry.node.bookmark).map(entry => <button type="button" key={entry.node.id} onClick={() => navigateTo(entry.path)}>{entry.node.moveNumber}{entry.node.color === 'w' ? '.' : '...'} {entry.node.san} · {entry.node.bookmark === 'important' ? 'Важливо' : entry.node.bookmark === 'check' ? 'Перевірити' : 'Дебютна ідея'}</button>)}</details>}
                        {tab === "moves" && (
                            <AnalysisMoveTree
                                record={record}
                                setRecord={editRecord}
                                focusBranch={focusBranch}
                                followSelection={followSelection}
                                suspended={Boolean(workspaceDialog || importOpen || settingsOpen || review.running || linePreview)}
                                onNavigate={navigateTo}
                                onOpenEngine={() => setTab("engine")}
                                onPreviewBestMove={previewReviewedBestMove}
                            />
                        )}

                        {tab === "engine" && (
                            <div className="analysis-engine-panel analysis-engine-panel-simple">
                                {!engineEnabled ? (
                                    <div className="analysis-empty-state"><Zap size={28} /><strong>Движок вимкнено</strong><p>Увімкніть Stockfish у лівій панелі.</p></div>
                                ) : (
                                    <>
                                        <div className="analysis-inline-actions"><Button size="sm" variant="outline" disabled={review.running || !record.currentPath} onClick={() => openWorkspaceDialog('compare')}>Порівняти лінії</Button>{economy && <Button size="sm" variant="ghost" disabled={review.running} aria-pressed={deepPosition === currentFen} onClick={() => setDeepPosition(value => value === currentFen ? null : currentFen)}>{deepPosition === currentFen ? 'Повернути швидкий аналіз' : 'Глибоко цю позицію'}</Button>}</div>
                                        {economy && <p className="analysis-muted">Економний режим: одна лінія, короткий пошук. У фоновій вкладці — пауза.</p>}
                                        <div className="analysis-engine-toolbar analysis-engine-toolbar-simple">
                                            <strong>Движок</strong>
                                        </div>

                                        <div className="analysis-engine-status analysis-engine-status-simple">
                                            <div>
                                                <span className={cn("analysis-status-dot", positionBusy && "is-busy", currentEngine && !positionBusy && "is-ready")} />
                                                <strong>{engineSource(currentEngine)}</strong>
                                            </div>
                                            <span>{review.running ? "Огляд партії" : positionError ? "Недоступний" : positionBusy ? "Аналізує…" : currentEngine ? "Готовий" + (currentEngine.depth ? " · D" + currentEngine.depth : "") : "Очікує"}</span>
                                        </div>

                                        <div className="analysis-engine-evaluation-simple" aria-live="polite">
                                            <strong>{positionBusy && !currentEngine ? "…" : evaluationLabel(currentEngine)}</strong>
                                            <span>{linePreview ? "Оцінка позиції, вибраної в ходах" : engineVerdict(currentEngine?.numericScore)}</span>
                                        </div>

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
                                        )}

                                        {positionError ? <div className="analysis-error">{positionError}</div> : null}

                                        {currentEngine?.bestMoveSan ? (
                                            <section className="analysis-best-move-simple" aria-label="Найкращий хід Stockfish">
                                                <div className="analysis-best-move-simple-head">
                                                    <span><Star size={15} />Найкращий хід</span>
                                                    <b>{evaluationLabel(currentEngine)}</b>
                                                </div>
                                                <strong className="analysis-best-move-simple-san">{currentEngine.bestMoveSan}</strong>
                                                {currentEngine.pvSan.length > 0 && <p>{currentEngine.pvSan.slice(0, analysisUiMode === "advanced" ? 8 : 5).join(" ")}</p>}
                                                <div className="analysis-best-move-simple-actions">
                                                    <Button size="sm" disabled={!engineLines.length} onClick={() => engineLines[0] && previewEngineLine(engineLines[0], "Найкращий варіант")}>Показати на дошці</Button>
                                                    <Button variant="ghost" size="sm" disabled={review.running || !engineLines.length} onClick={() => engineLines[0] && addEngineLineToVariations(engineLines[0])}><GitBranch size={14} />У варіанти</Button>
                                                </div>
                                            </section>
                                        ) : positionBusy ? (
                                            <div className="analysis-best-move-simple is-loading"><div className="analysis-line-skeleton" /><div className="analysis-line-skeleton" /></div>
                                        ) : (
                                            <div className="analysis-empty-state compact"><BrainCircuit size={25} /><strong>Хід ще не готовий</strong><p>Stockfish обчислює поточну позицію.</p></div>
                                        )}

                                        {!positionBusy && currentEngine && engineLines.length < requestedMultiPv && <p className="analysis-muted">Рушій повернув {engineLines.length} з {requestedMultiPv} запитаних ліній.</p>}
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
                                                                <strong>{line.moves.split(" ")[0] || "#" + line.rank}</strong>
                                                                <span>{line.moves.split(" ").slice(1, 5).join(" ")}</span>
                                                                <b>{line.score}</b>
                                                            </button>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button type="button" className="analysis-engine-other-add" disabled={review.running} onClick={() => addEngineLineToVariations(line)} aria-label={"Додати варіант Stockfish " + line.rank + " до дерева"}><GitBranch size={14} /></button>
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
                        )}

                        {tab === "overview" && (
                            <div className="analysis-overview-panel">
                                <Button size="sm" variant="outline" disabled={!record.mainline.some(node => ['inaccuracy', 'mistake', 'blunder'].includes(node.classification || ''))} onClick={() => openWorkspaceDialog('training')}>Тренувати помилки</Button>
                                {review.paused && <div className="analysis-review-progress" role="status"><span>Огляд на паузі · {review.current} / {review.total} півходів</span><Button size="sm" onClick={() => void startFullReview(true)}>Продовжити огляд</Button></div>}
                                {review.running && (
                                    <div className="analysis-review-progress" aria-live="polite">
                                        <div className="analysis-section-heading"><div><span>Аналіз триває</span><small>{review.current} / {review.total} півходів</small></div><Loader2 className="animate-spin" size={19} /></div>
                                        <Progress value={review.total ? (review.current / review.total) * 100 : 0} />
                                        <div className="analysis-inline-actions"><Button variant="outline" size="sm" onClick={pauseReview}><Pause size={16} />Пауза</Button><Button variant="ghost" size="sm" onClick={stopFullReview}>Зупинити аналіз</Button></div>
                                    </div>
                                )}
                                {review.error && <div className="analysis-error">{review.error}</div>}

                                {reviewedNodes.length ? (
                                    <>
                                        <div className="analysis-overview-topbar">
                                            <div><strong>Огляд партії</strong><span>{reviewedNodes.length} перевірених ходів · реальна оцінка Stockfish</span></div>
                                            {!review.running && !review.paused && <Button variant="outline" size="sm" className="analysis-rerun-button" onClick={() => void startFullReview()}><Play size={14} />Заново</Button>}
                                        </div>

                                        <details className="analysis-accuracy-method"><summary>Орієнтовна точність · як рахуємо</summary><p>100 − середня втрата оцінки в сотих пішака / 12. Спрощений показник основної партії; матові оцінки виключені. Це не Chess.com Accuracy.</p></details>
                                        <div className="analysis-accuracy-grid">
                                            <div><span>Білі</span><strong>{whiteAccuracy == null ? "—" : `${whiteAccuracy}%`}</strong></div>
                                            <div><span>Загальна</span><strong>{overallAccuracy == null ? "—" : `${overallAccuracy}%`}</strong></div>
                                            <div><span>Чорні</span><strong>{blackAccuracy == null ? "—" : `${blackAccuracy}%`}</strong></div>
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
                                                            const target = renderedMoves.find(entry => entry.depth === 0 && entry.node.classification === kind);
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
                                            <div className="analysis-overview-section-title"><div><strong>Ключові моменти</strong><span>{overviewFilter === "all" ? "Неточності, помилки та грубі помилки" : CLASSIFICATION_LABELS[overviewFilter]}</span></div><button type="button" className="analysis-overview-clear-filter" disabled={!nextMoment} onClick={() => nextMoment && navigateTo(nextMoment.path)}>Наступний</button></div>
                                            <div className="analysis-key-moments">
                                                {overviewMoments.length ? overviewMoments.map(entry => {
                                                    const node = entry.node;
                                                    return (
                                                        <button key={node.id} type="button" aria-pressed={isSamePath(entry.path, record.currentPath)} onClick={() => navigateTo(entry.path)}>
                                                            <div className="analysis-key-moment-main">
                                                                <div className="analysis-key-moment-head"><strong>{node.moveNumber}{node.color === "w" ? "." : "..."} {node.san}</strong></div>
                                                                <p>{explanationForMove(node.classification!, node.color, node.bestMoveSan)}</p>
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
                                ) : !review.running && !review.paused ? (
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
                                    <Button size="sm" variant="outline" onClick={() => openWorkspaceDialog("metadata")}><Pencil size={14} />Редагувати дані</Button>
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
                                    <div><span>Дебют</span><strong title={record.headers.Opening || opening?.opening.name || undefined}>{record.headers.Opening || opening?.line?.name || opening?.opening.name || "Не визначено"}</strong></div>
                                    <b>{record.headers.ECO || opening?.opening.eco || "ECO —"}</b>
                                </div>

                                {record.rootFen !== START_FEN && (
                                    <div className="analysis-info-fen"><span>Початкова FEN</span><code>{record.rootFen}</code></div>
                                )}

                                <details className="analysis-pgn-details"><summary>Повний PGN</summary><pre>{buildAnalysisPgn(record)}</pre></details>
                                <div className="analysis-info-export">
                                    <Button size="sm" variant="outline" onClick={openPositionImage}><Download size={14} />Експорт картинки</Button>
                                    <Button size="sm" variant="outline" onClick={() => void copyText(buildAnalysisPgn(record), "PGN")}><Copy size={14} />Копіювати PGN</Button>
                                    <Button size="sm" variant="outline" onClick={downloadPgn}><Download size={14} />Завантажити PGN</Button>
                                </div>

                                {!metadataText && <div className="analysis-empty-state compact"><FileText size={24} /><strong>Метаданих поки немає</strong><p>Додайте імена, результат та інші дані кнопкою «Редагувати дані».</p></div>}
                            </div>
                        )}
                    </div>

                    <div className="analysis-panel-navigation analysis-panel-navigation-simple" aria-label="Навігація по партії" role="group">
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={19} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? "Активна лінія: " + navigationLabel : "Позиція: " + navigationLabel}>{linePreview ? `${linePreview.index + 1} / ${linePreview.fens.length}` : navigationLabel}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={19} />} onClick={goNext} disabled={!canGoNext} />
                    </div>
                </aside>
            </main>

            {workspaceDialog === 'metadata' && <GameMetadataDialog record={record} onSave={editRecord} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'prediction' && <PredictionDialog key={currentFen} fen={currentFen} saved={record.predictions?.find(item => item.fen === currentFen)} analyze={analyzeCached} onSave={prediction => editRecord(current => savePrediction(current, prediction))} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'image' && imageSource && <PositionImageDialog source={imageSource} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'archive'  && <ArchiveDialog record={record} activeId={activeSaveId} onSaved={setActiveSaveId} onLoad={(saved, id) => { cancelReview(); setRecord(saved); setActiveSaveId(id); setTab('moves'); }} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'share' && <ShareDialog record={record} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'editor' && <PositionEditor fen={currentFen} onApply={fen => { cancelReview(); editRecord(createRecord(fen)); setActiveSaveId(null); setTab('moves'); }} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'training' && <MistakeTraining record={record} analyze={analyzeCached} onClose={() => setWorkspaceDialog(null)} />}
            {workspaceDialog === 'compare' && <CompareLines record={record} analyze={analyzeCached} onClose={() => setWorkspaceDialog(null)} />}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{importMode === "pgn" ? "Імпорт PGN" : "FEN позиція"}</DialogTitle>
                        <DialogDescription>{importMode === "pgn" ? "Вставте текст PGN. Партія та метадані відкриються у вкладці «Ходи»." : "Вставте FEN, щоб відкрити конкретну позицію для аналізу."}</DialogDescription>
                    </DialogHeader>
                    {importMode === "pgn" && <Button variant="outline" onClick={() => fileInputRef.current?.click()}><FileUp size={16} />Відкрити PGN-файл</Button>}
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
