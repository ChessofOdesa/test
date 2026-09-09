import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BOARD_THEMES, useBoardSettings } from "@/contexts/BoardSettingsContext";
import { SettingToggle } from '@/features/analysis/components';
import { ANALYSIS_BOARD_THEME, ANALYSIS_SETTINGS_STORAGE_KEY, AnalysisArrow, AnalysisRecord, AnalysisReportMode, AnalysisRunPhase, AnalysisSessionSnapshot, AnalysisSnapshot, AnalysisToolMode, averageCentipawnLoss, boardPositionFromFen, boardPositionToFen, buildCoachEntry, buildMovePairs, buildPgn, buildRecordFromPgn, buildShareUrl, calculateAccuracy, classificationClasses, classificationFromLoss, classificationLabel, CoachEntry, coachToneClasses, collectNodes, countLabels, createMoveNode, createRecord, determinePhase, EngineSummary, explanationForMove, findOpening, formatAnalysisError, formatCp, getCurrentFen, getLastMove, getLastPath, getNextPath, getNodeByPath, getPreviousPath, isSamePath, makeSessionTitle, materialCount, MoveClassification, MoveNag, numericScoreFromEngine, parseAnalysisImport, PersistedAnalysisSettings, readAnalysisSettings, readStoredSessions, removeNodeAtPath, renderMoves, restoreRecord, saveStoredSessions, sleep, START_FEN, toSnapshot, uciPvToSan, uciToSan, updateNodeAtPath } from '@/features/analysis/model';
import { playChessSound, type ChessSoundType } from "@/hooks/useChessSounds";
import { buildGrowthSummary, markNotebookEntryStatus, readGrowthState, recordGameReview, type GrowthMoveClassification, type NotebookStatus, type ReviewedMove, } from "@/lib/growth-system";
import analyzeFenWithStockfish from "@/lib/stockfish";
import { cn } from "@/lib/utils";
import { Chess } from "chess.js";
import { Archive, BarChart3, BrainCircuit, ChevronLeft, ChevronRight, ChevronsLeft, CloudUpload, Compass, Copy, FlipVertical, FolderClock, Layers3, Link2, Loader2, Pause, PencilLine, Play, RotateCcw, Search, Settings, Upload, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Chessboard } from "react-chessboard";
import type { BoardPosition, Piece, Square } from "react-chessboard/dist/chessboard/types";
import { useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
export default function Analysis() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { theme, pieceStyle, showCoordinates: savedCoordinates, setTheme, setPieceStyle, setShowCoordinates, } = useBoardSettings();
    const initialBoardPrefsRef = useRef({
        theme,
        pieceStyle,
        showCoordinates: savedCoordinates,
    });
    const engineCacheRef = useRef(new Map<string, EngineSummary>());
    const analysisRunRef = useRef(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const loadedQueryRef = useRef<string | null>(null);
    const autoplayTimerRef = useRef<number | null>(null);
    const coachScrollAreaRef = useRef<HTMLDivElement | null>(null);
    const commentEditorRef = useRef<HTMLTextAreaElement | null>(null);
    const persistedSettingsRef = useRef(readAnalysisSettings());
    const [record, setRecord] = useState<AnalysisRecord>(() => createRecord());
    const [boardBaseSize, setBoardBaseSize] = useState(560);
    const [flipped, setFlipped] = useState(persistedSettingsRef.current.flipped);
    const [showCoordinatesEnabled, setShowCoordinatesEnabled] = useState(persistedSettingsRef.current.showCoordinates);
    const [highlightMoves, setHighlightMoves] = useState(persistedSettingsRef.current.highlightMoves);
    const [showLastMoveEnabled, setShowLastMoveEnabled] = useState(persistedSettingsRef.current.showLastMove);
    const [soundEnabled, setSoundEnabled] = useState(persistedSettingsRef.current.soundEnabled);
    const [moveAnimationEnabled, setMoveAnimationEnabled] = useState(persistedSettingsRef.current.moveAnimation);
    const [engineDepth, setEngineDepth] = useState(persistedSettingsRef.current.engineDepth);
    const [analysisEnabled, setAnalysisEnabled] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState("Вставте PGN або FEN для аналізу.");
    const [analysisPhase, setAnalysisPhase] = useState<AnalysisRunPhase>("idle");
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [analysisMessage, setAnalysisMessage] = useState("Готово до аналізу.");
    const [analyzedMoveCount, setAnalyzedMoveCount] = useState(0);
    const [totalMoveCount, setTotalMoveCount] = useState(0);
    const [canStopAnalysis, setCanStopAnalysis] = useState(false);
    const [liveDepth, setLiveDepth] = useState<number | null>(null);
    const [analysisError, setAnalysisError] = useState("");
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);
    const [rightPanelTab, setRightPanelTab] = useState<"analysis" | "gameInfo">("analysis");
    const [analysisReportMode, setAnalysisReportMode] = useState<AnalysisReportMode>("overview");
    const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
    const [activeTool, setActiveTool] = useState<AnalysisToolMode>("import");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [isImportDragging, setImportDragging] = useState(false);
    const [isManualAnalysisRunning, setManualAnalysisRunning] = useState(false);
    const [isFenDialogOpen, setFenDialogOpen] = useState(false);
    const [isPgnDialogOpen, setPgnDialogOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);
    const [variationMode, setVariationMode] = useState(false);
    const [fenDraft, setFenDraft] = useState("");
    const [pgnDraft, setPgnDraft] = useState("");
    const [quickImportDraft, setQuickImportDraft] = useState("");
    const [commentDraft, setCommentDraft] = useState("");
    const [currentEngine, setCurrentEngine] = useState<EngineSummary | null>(null);
    const [backgroundAnalysisBusy, setBackgroundAnalysisBusy] = useState(false);
    const [editorPosition, setEditorPosition] = useState<BoardPosition>(boardPositionFromFen(START_FEN));
    const [editorTurn, setEditorTurn] = useState<"w" | "b">("w");
    const [selectedPalettePiece, setSelectedPalettePiece] = useState<Piece | "eraser" | null>(null);
    const [coachStatus, setCoachStatus] = useState("Завантажте партію або позицію для пояснення.");
    const [coachFeed, setCoachFeed] = useState<CoachEntry[]>([]);
    const [storedSessions, setStoredSessions] = useState<AnalysisSessionSnapshot[]>(() => readStoredSessions());
    const [growthState, setGrowthState] = useState(() => readGrowthState());
    const coachEventKeyRef = useRef("empty");
    const manualAnalysisRunRef = useRef({ runId: 0, cancelled: false });
    const commitRecordChange = useCallback((mutator: (draft: AnalysisSnapshot) => void) => {
        setRecord((current) => {
            const previousSnapshot = toSnapshot(current);
            const nextSnapshot = toSnapshot(current);
            mutator(nextSnapshot);
            return restoreRecord(nextSnapshot, [...current.historyStack.slice(-39), previousSnapshot], []);
        });
    }, []);
    const mutateRecordSilently = useCallback((mutator: (draft: AnalysisSnapshot) => void) => {
        setRecord((current) => {
            const nextSnapshot = toSnapshot(current);
            mutator(nextSnapshot);
            return restoreRecord(nextSnapshot, current.historyStack, current.futureStack);
        });
    }, []);
    const emitSound = useCallback((type: ChessSoundType) => {
        if (!soundEnabled) {
            return;
        }
        playChessSound(type);
    }, [soundEnabled]);
    useEffect(() => {
        const previous = initialBoardPrefsRef.current;
        setTheme(ANALYSIS_BOARD_THEME);
        setPieceStyle("unicode");
        return () => {
            setTheme(previous.theme);
            setPieceStyle(previous.pieceStyle);
            setShowCoordinates(previous.showCoordinates);
        };
    }, [setPieceStyle, setShowCoordinates, setTheme]);
    useEffect(() => {
        setShowCoordinates(showCoordinatesEnabled);
    }, [setShowCoordinates, showCoordinatesEnabled]);
    useEffect(() => {
        const selectedTheme = [ANALYSIS_BOARD_THEME, ...BOARD_THEMES].find((item) => item.id === persistedSettingsRef.current.themeId) ||
            ANALYSIS_BOARD_THEME;
        setTheme(selectedTheme);
    }, [setTheme]);
    useEffect(() => {
        const payload: PersistedAnalysisSettings = {
            flipped,
            showCoordinates: showCoordinatesEnabled,
            soundEnabled,
            moveAnimation: moveAnimationEnabled,
            highlightMoves,
            showLastMove: showLastMoveEnabled,
            engineDepth,
            themeId: theme.id,
        };
        window.localStorage.setItem(ANALYSIS_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    }, [
        engineDepth,
        flipped,
        highlightMoves,
        moveAnimationEnabled,
        showCoordinatesEnabled,
        showLastMoveEnabled,
        soundEnabled,
        theme.id,
    ]);
    useEffect(() => {
        const syncBoardSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            if (width < 640) {
                setBoardBaseSize(Math.max(180, Math.min(520, width - 78, height - 220)));
                return;
            }
            if (width < 1024) {
                setBoardBaseSize(Math.max(420, Math.min(560, width - 72, height - 220)));
                return;
            }
            const widthBound = width - 500;
            const heightBound = height - 170;
            setBoardBaseSize(Math.max(320, Math.min(620, widthBound, heightBound)));
        };
        syncBoardSize();
        window.addEventListener("resize", syncBoardSize);
        return () => window.removeEventListener("resize", syncBoardSize);
    }, []);
    const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);
    const currentNode = useMemo(() => getLastMove(record), [record]);
    const currentFen = useMemo(() => getCurrentFen(record), [record]);
    const currentMoveIndex = useMemo(() => renderedMoves.findIndex((entry) => isSamePath(entry.path, record.currentPath)), [record.currentPath, renderedMoves]);
    const material = useMemo(() => materialCount(currentFen), [currentFen]);
    const gamePhase = useMemo(() => determinePhase(currentFen, currentNode?.ply || record.mainline.length), [currentFen, currentNode?.ply, record.mainline.length]);
    const openingMatch = useMemo(() => findOpening(record.mainline), [record.mainline]);
    const accuracy = useMemo(() => calculateAccuracy(record.mainline), [record.mainline]);
    const acpl = useMemo(() => averageCentipawnLoss(record.mainline), [record.mainline]);
    const counts = useMemo(() => countLabels(record.mainline), [record.mainline]);
    const boardSize = useMemo(() => Math.max(180, Math.round(boardBaseSize)), [boardBaseSize]);
    const currentEvalScore = currentNode?.engineEval ?? currentEngine?.numericScore ?? 0;
    const currentMateLabel = currentNode?.engineMate != null
        ? `${currentNode.engineMate > 0 ? "+" : ""}M${currentNode.engineMate}`
        : currentEngine?.scoreMate != null
            ? `${currentEngine.scoreMate > 0 ? "+" : ""}M${currentEngine.scoreMate}`
            : null;
    const currentBestMove = currentNode?.bestMoveSan || currentEngine?.bestMoveSan || null;
    const currentPv = useMemo(() => currentNode?.alternatives?.length
        ? currentNode.alternatives
        : currentEngine?.lineSan.length
            ? currentEngine.lineSan
            : currentEngine?.pvSan.length
                ? currentEngine.pvSan
                : [], [currentEngine?.lineSan, currentEngine?.pvSan, currentNode?.alternatives]);
    const mainlinePairs = useMemo(() => buildMovePairs(record.mainline), [record.mainline]);
    const currentArrows = useMemo<AnalysisArrow[]>(() => {
        if (currentNode?.arrows?.length) {
            return currentNode.arrows;
        }
        if (currentEngine?.bestMoveUci && currentEngine.bestMoveUci.length >= 4) {
            return [
                [
                    currentEngine.bestMoveUci.slice(0, 2) as Square,
                    currentEngine.bestMoveUci.slice(2, 4) as Square,
                    "#22458f",
                ],
            ];
        }
        return [];
    }, [currentEngine?.bestMoveUci, currentNode?.arrows]);
    const lastMoveSquares = currentNode ? [currentNode.uci.slice(0, 2) as Square, currentNode.uci.slice(2, 4) as Square] : [];
    const isEmptyState = record.mainline.length === 0 && record.rootFen === START_FEN;
    useEffect(() => {
        setCommentDraft(currentNode?.comment || "");
    }, [currentNode?.id, currentNode?.comment]);
    useEffect(() => {
        const queryPgn = typeof location.state?.pgn === "string" ? location.state.pgn : searchParams.get("pgn");
        const queryFen = searchParams.get("fen");
        if (queryPgn && loadedQueryRef.current !== queryPgn) {
            loadedQueryRef.current = queryPgn;
            try {
                const nextRecord = buildRecordFromPgn(queryPgn);
                setRecord(nextRecord);
                setPgnDraft(queryPgn);
                setQuickImportDraft(queryPgn);
                setAnalysisStatus(`Партію завантажено: ${nextRecord.mainline.length} півходів.`);
                toast.success("Партію завантажено.");
            }
            catch {
                toast.error("Не вдалося завантажити PGN.");
            }
            return;
        }
        if (queryFen && loadedQueryRef.current !== queryFen) {
            loadedQueryRef.current = queryFen;
            try {
                const chess = new Chess(queryFen);
                setRecord(createRecord(chess.fen()));
                setFenDraft(chess.fen());
                setAnalysisStatus("Позицію завантажено. Можна починати аналіз.");
                toast.success("Позицію завантажено.");
            }
            catch {
                toast.error("Не вдалося завантажити FEN.");
            }
        }
    }, [searchParams, location.state]);
    useEffect(() => {
        const viewport = coachScrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
        if (viewport instanceof HTMLDivElement && typeof viewport.scrollTo === "function") {
            viewport.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [coachFeed]);
    const getEngineForFen = useCallback(async (fen: string, depth = 12, onOutput?: (line: string) => void, options: {
        multiPv?: number;
        sessionId?: string;
        timeoutMs?: number;
        preferCloud?: boolean;
    } = {}) => {
        const multiPv = options.multiPv ?? 1;
        const timeoutMs = options.timeoutMs ?? 16000;
        const key = `${options.preferCloud ? "cloud" : "local"}:${depth}:${multiPv}:${fen}`;
        const cached = engineCacheRef.current.get(key);
        if (cached) {
            return cached;
        }
        const result = await analyzeFenWithStockfish(fen, depth, onOutput, timeoutMs, {
            multiPv,
            sessionId: options.sessionId ?? "analysis",
            timeoutMs,
            preferCloud: options.preferCloud,
        });
        const lines = result.lines ?? [];
        const summary: EngineSummary = {
            backend: result.backend,
            fen,
            scoreCp: result.scoreCp,
            scoreMate: result.scoreMate,
            numericScore: numericScoreFromEngine(result),
            bestMoveUci: result.bestmove,
            bestMoveSan: uciToSan(fen, result.bestmove),
            pvSan: uciPvToSan(fen, result.pv).slice(0, 5),
            lines,
            lineSan: lines
                .map((line) => uciPvToSan(fen, line.pv).slice(0, 5).join(" "))
                .filter(Boolean),
            depth: result.depth ?? depth,
            nodes: result.nodes,
            timeMs: result.timeMs,
        };
        engineCacheRef.current.set(key, summary);
        return summary;
    }, []);
    useEffect(() => {
        if (!analysisEnabled) {
            return;
        }
        let cancelled = false;
        setAnalysisStatus("Аналіз поточної позиції…");
        getEngineForFen(currentFen, engineDepth, undefined, {
            multiPv: 3,
            preferCloud: true,
        })
            .then((summary) => {
            if (cancelled) {
                return;
            }
            setCurrentEngine(summary);
            setAnalysisStatus(summary.bestMoveSan ? `Best move: ${summary.bestMoveSan}` : "Позицію проаналізовано.");
        })
            .catch((error) => {
            console.error(error);
            if (cancelled) {
                return;
            }
            setCurrentEngine(null);
            setAnalysisStatus("Stockfish недоступний. Оновіть сторінку та спробуйте ще раз.");
        });
        return () => {
            cancelled = true;
        };
    }, [analysisEnabled, currentFen, engineDepth, getEngineForFen]);
    useEffect(() => {
        if (!analysisEnabled || renderedMoves.length === 0) {
            return;
        }
        const pending = renderedMoves.filter(({ node }) => node.engineEval == null || node.bestMoveSan == null);
        if (pending.length === 0) {
            return;
        }
        const runId = ++analysisRunRef.current;
        setBackgroundAnalysisBusy(true);
        void (async () => {
            for (const { path, node } of pending) {
                if (runId !== analysisRunRef.current) {
                    return;
                }
                try {
                    const before = await getEngineForFen(node.fenBefore, 10, undefined, {
                        multiPv: 3,
                        sessionId: "analysis-background",
                    });
                    const after = await getEngineForFen(node.fenAfter, 10, undefined, {
                        sessionId: "analysis-background",
                    });
                    if (runId !== analysisRunRef.current) {
                        return;
                    }
                    const playedBestMove = before.bestMoveSan === node.san;
                    const evalLoss = node.color === "w"
                        ? Math.max(0, before.numericScore - after.numericScore)
                        : Math.max(0, after.numericScore - before.numericScore);
                    const classification = classificationFromLoss(evalLoss, playedBestMove);
                    const explanation = explanationForMove(classification, node.color, before.bestMoveSan);
                    mutateRecordSilently((draft) => {
                        draft.mainline = updateNodeAtPath(draft.mainline, path, (target) => {
                            target.classification = classification;
                            target.evalLoss = Math.round(evalLoss);
                            target.engineEval = after.scoreCp ?? after.numericScore;
                            target.engineMate = after.scoreMate;
                            target.bestMoveSan = before.bestMoveSan;
                            target.alternatives = before.lineSan.length ? before.lineSan.slice(0, 3) : before.pvSan.slice(0, 3);
                            target.explanation = explanation;
                            target.arrows =
                                before.bestMoveUci && before.bestMoveUci.length >= 4
                                    ? [[before.bestMoveUci.slice(0, 2) as Square, before.bestMoveUci.slice(2, 4) as Square, "#22458f"]]
                                    : [];
                        });
                    });
                }
                catch (error) {
                    console.error(error);
                    if (runId !== analysisRunRef.current) {
                        return;
                    }
                }
            }
            if (runId === analysisRunRef.current) {
                setBackgroundAnalysisBusy(false);
            }
        })();
        return () => {
            analysisRunRef.current += 1;
            setBackgroundAnalysisBusy(false);
        };
    }, [analysisEnabled, getEngineForFen, mutateRecordSilently, renderedMoves]);
    useEffect(() => {
        if (!isAutoPlaying) {
            if (autoplayTimerRef.current) {
                window.clearInterval(autoplayTimerRef.current);
                autoplayTimerRef.current = null;
            }
            return;
        }
        autoplayTimerRef.current = window.setInterval(() => {
            setRecord((current) => {
                const nextPath = getNextPath(current, current.currentPath);
                if (!nextPath) {
                    setIsAutoPlaying(false);
                    return current;
                }
                return { ...current, currentPath: nextPath };
            });
        }, 900);
        return () => {
            if (autoplayTimerRef.current) {
                window.clearInterval(autoplayTimerRef.current);
                autoplayTimerRef.current = null;
            }
        };
    }, [isAutoPlaying]);
    useEffect(() => {
        const isPristineWorkspace = !currentNode && record.mainline.length === 0 && record.rootFen === START_FEN;
        if (isPristineWorkspace) {
            setCoachFeed([]);
            setCoachStatus("Завантажте PGN, FEN або зробіть хід для пояснення позиції.");
            coachEventKeyRef.current = "empty";
            return;
        }
        const entry = buildCoachEntry(currentNode, openingMatch, gamePhase);
        const key = `${entry.id}:${currentBestMove || "none"}:${currentPv.join("|")}`;
        if (coachEventKeyRef.current === key) {
            return;
        }
        setCoachStatus(currentNode ? "Аналіз ходу…" : "Готово до аналізу.");
        const timer = window.setTimeout(() => {
            setCoachFeed((current) => {
                if (current[0]?.id === entry.id) {
                    return current;
                }
                return [entry, ...current.filter((item) => item.moveId !== entry.moveId).slice(0, 11)];
            });
            setCoachStatus(currentNode ? `Reviewed ${entry.moveLabel}` : "Оберіть хід, щоб переглянути пояснення.");
            coachEventKeyRef.current = key;
        }, currentNode ? 950 : 120);
        return () => window.clearTimeout(timer);
    }, [
        currentBestMove,
        currentNode,
        currentPv,
        gamePhase,
        openingMatch,
        record.mainline.length,
        record.rootFen,
    ]);
    const latestCoachEntry = currentNode && coachFeed[0]?.moveId !== currentNode.id
        ? buildCoachEntry(currentNode, openingMatch, gamePhase)
        : coachFeed[0] ?? buildCoachEntry(currentNode, openingMatch, gamePhase);
    const coachHistory = coachFeed.slice(1);
    const rememberCurrentSession = useCallback((source = "Workspace") => {
        const session: AnalysisSessionSnapshot = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: makeSessionTitle(record),
            source,
            createdAt: new Date().toISOString(),
            snapshot: toSnapshot(record),
        };
        setStoredSessions((current) => {
            const next = [session, ...current].slice(0, 12);
            saveStoredSessions(next);
            return next;
        });
    }, [record]);
    const restoreSession = useCallback((session: AnalysisSessionSnapshot) => {
        setRecord(restoreRecord(session.snapshot, [], []));
        setCurrentEngine(null);
        setEditorOpen(false);
        setVariationMode(false);
        setActiveTool("class");
        setAnalysisPhase("idle");
        setAnalysisProgress(0);
        setAnalyzedMoveCount(0);
        setTotalMoveCount(session.snapshot.mainline.length);
        setAnalysisMessage("Розбір відновлено. Можна продовжувати.");
        setAnalysisError("");
        setAnalysisStatus(`Restored ${session.title}.`);
        toast.success("Розбір відновлено.");
    }, []);
    const updateNotebookStatus = useCallback((entryId: string, status: NotebookStatus) => {
        setGrowthState(markNotebookEntryStatus(entryId, status));
        toast.success(status === "fixed" ? "Помилку позначено виправленою." : "Запис оновлено.");
    }, []);
    const persistGameReview = useCallback((reviewRecord: AnalysisRecord, source: string) => {
        const reviewedMoves: ReviewedMove[] = collectNodes(reviewRecord.mainline)
            .filter((node) => node.classification)
            .map((node) => ({
            id: node.id,
            ply: node.ply,
            moveNumber: node.moveNumber,
            color: node.color,
            san: node.san,
            fenBefore: node.fenBefore,
            fenAfter: node.fenAfter,
            classification: node.classification as GrowthMoveClassification | null,
            evalLoss: node.evalLoss,
            engineEval: node.engineEval,
            bestMoveSan: node.bestMoveSan,
            explanation: node.explanation,
        }));
        if (reviewedMoves.length === 0) {
            return;
        }
        const opening = findOpening(reviewRecord.mainline);
        const nextGrowth = recordGameReview({
            title: makeSessionTitle(reviewRecord),
            source,
            openingName: opening?.line?.name || opening?.opening.name || "Unknown opening",
            eco: opening?.opening.eco || "—",
            result: reviewRecord.headers.Result || "*",
            accuracy: calculateAccuracy(reviewRecord.mainline),
            acpl: averageCentipawnLoss(reviewRecord.mainline),
            counts: countLabels(reviewRecord.mainline),
            reviewedMoves,
            pgnPreview: buildPgn(reviewRecord).replace(/\s+/g, " ").slice(0, 240),
        });
        setGrowthState(nextGrowth);
    }, []);
    const resetAnalysisRunView = useCallback((message = "Готово до аналізу.") => {
        manualAnalysisRunRef.current.cancelled = true;
        setManualAnalysisRunning(false);
        setBackgroundAnalysisBusy(false);
        setCanStopAnalysis(false);
        setAnalysisPhase("idle");
        setAnalysisProgress(0);
        setAnalyzedMoveCount(0);
        setTotalMoveCount(0);
        setLiveDepth(null);
        setAnalysisMessage(message);
        setAnalysisError("");
    }, []);
    const handleStartAnalysis = useCallback(async () => {
        if (isManualAnalysisRunning) {
            return;
        }
        const runId = manualAnalysisRunRef.current.runId + 1;
        manualAnalysisRunRef.current = { runId, cancelled: false };
        setActiveTool("class");
        setAnalysisReportMode("overview");
        setSelectedCandidateIndex(0);
        setAnalysisEnabled(false);
        setManualAnalysisRunning(true);
        setBackgroundAnalysisBusy(true);
        setCanStopAnalysis(true);
        setLiveDepth(null);
        setAnalysisError("");
        setAnalysisProgress(3);
        setAnalyzedMoveCount(0);
        setTotalMoveCount(record.mainline.length);
        setAnalysisPhase("initializing");
        setAnalysisMessage("Запуск рушія…");
        setAnalysisStatus("Запуск рушія…");
        const ensureActiveRun = () => {
            if (manualAnalysisRunRef.current.cancelled || manualAnalysisRunRef.current.runId !== runId) {
                throw new Error("Аналіз зупинено.");
            }
        };
        const handleEngineLine = (line: string) => {
            const depthMatch = line.match(/\bdepth\s+(\d+)/);
            const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
            const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
            if (depthMatch) {
                const depth = Number(depthMatch[1]);
                const evalText = mateMatch
                    ? `M${mateMatch[1]}`
                    : cpMatch
                        ? `${(Number(cpMatch[1]) / 100).toFixed(1)}`
                        : "";
                setLiveDepth(depth);
                setAnalysisMessage(`Analyzing depth ${depth}${evalText ? `, eval ${evalText}` : ""}...`);
            }
        };
        try {
            let workingRecord = record;
            if (quickImportDraft.trim()) {
                setAnalysisPhase("importing");
                setAnalysisMessage("Зчитування позиції…");
                setAnalysisStatus("Reading pasted PGN/FEN...");
                const parsed = parseAnalysisImport(quickImportDraft);
                rememberCurrentSession("Before start analysis import");
                workingRecord = parsed.record;
                setRecord(workingRecord);
                setEditorPosition(boardPositionFromFen(workingRecord.rootFen));
                if (parsed.sourceType === "fen") {
                    setFenDraft(quickImportDraft.trim());
                }
                else {
                    setPgnDraft(quickImportDraft);
                }
                setAnalysisStatus(parsed.message);
                await sleep(120);
            }
            ensureActiveRun();
            const workingMoves = renderMoves(workingRecord.mainline);
            const workingFen = getCurrentFen(workingRecord);
            const reviewDepth = Math.min(engineDepth, 12);
            setTotalMoveCount(workingMoves.length);
            setAnalysisPhase(workingMoves.length > 0 ? "analyzingGame" : "analyzingPosition");
            setAnalysisMessage(workingMoves.length > 0 ? "Підготовка розбору ходів…" : "Підготовка аналізу позиції…");
            setAnalysisProgress(workingMoves.length > 0 ? 8 : 18);
            await sleep(120);
            ensureActiveRun();
            const summary = await getEngineForFen(workingFen, engineDepth, handleEngineLine, {
                multiPv: 3,
                sessionId: `analysis-manual-${runId}`,
                preferCloud: true,
            });
            ensureActiveRun();
            setCurrentEngine(summary);
            setAnalysisProgress(workingMoves.length > 0 ? 18 : 76);
            const workingSnapshot = toSnapshot(workingRecord);
            if (workingMoves.length > 0) {
                for (let index = 0; index < workingMoves.length; index += 1) {
                    ensureActiveRun();
                    const { path, node } = workingMoves[index];
                    setAnalyzedMoveCount(index + 1);
                    setAnalysisMessage(`Analyzing move ${index + 1} / ${workingMoves.length}...`);
                    setAnalysisProgress(Math.min(94, 18 + Math.round(((index + 1) / workingMoves.length) * 72)));
                    const before = await getEngineForFen(node.fenBefore, reviewDepth, handleEngineLine, {
                        multiPv: 3,
                        sessionId: `analysis-manual-${runId}`,
                    });
                    ensureActiveRun();
                    const after = await getEngineForFen(node.fenAfter, reviewDepth, handleEngineLine, {
                        sessionId: `analysis-manual-${runId}`,
                    });
                    ensureActiveRun();
                    const playedBestMove = before.bestMoveSan === node.san;
                    const evalLoss = node.color === "w"
                        ? Math.max(0, before.numericScore - after.numericScore)
                        : Math.max(0, after.numericScore - before.numericScore);
                    const classification = classificationFromLoss(evalLoss, playedBestMove);
                    const explanation = explanationForMove(classification, node.color, before.bestMoveSan);
                    workingSnapshot.mainline = updateNodeAtPath(workingSnapshot.mainline, path, (target) => {
                        target.classification = classification;
                        target.evalLoss = Math.round(evalLoss);
                        target.engineEval = after.scoreCp ?? after.numericScore;
                        target.engineMate = after.scoreMate;
                        target.bestMoveSan = before.bestMoveSan;
                        target.alternatives = before.lineSan.length ? before.lineSan.slice(0, 3) : before.pvSan.slice(0, 3);
                        target.explanation = explanation;
                        target.arrows =
                            before.bestMoveUci && before.bestMoveUci.length >= 4
                                ? [[before.bestMoveUci.slice(0, 2) as Square, before.bestMoveUci.slice(2, 4) as Square, "#22458f"]]
                                : [];
                    });
                    workingSnapshot.currentPath = path;
                    setCurrentEngine(after);
                    setRecord(restoreRecord(workingSnapshot, [], []));
                    await sleep(65);
                }
            }
            ensureActiveRun();
            const finalRecord = restoreRecord(workingSnapshot, [], []);
            setRecord(finalRecord);
            setAnalysisProgress(100);
            setAnalysisPhase("complete");
            setAnalysisReportMode("overview");
            setAnalysisMessage("Аналіз завершено.");
            setAnalysisEnabled(false);
            const finalNode = getLastMove(finalRecord);
            const entry = finalNode
                ? buildCoachEntry(finalNode, findOpening(workingSnapshot.mainline), determinePhase(getCurrentFen(finalRecord), finalNode.ply))
                : {
                    id: `position-review-${Date.now()}`,
                    moveId: "position",
                    title: "Position review",
                    text: summary.numericScore > 35
                        ? "У білих краща оцінка. Шукайте способи посилити активність фігур."
                        : summary.numericScore < -35
                            ? "У чорних краща оцінка. Шукайте активне продовження."
                            : "Оцінка близька до рівності. Порівняйте активність фігур і можливі поліпшення.",
                    detail: summary.bestMoveSan
                        ? `Better move: ${summary.bestMoveSan}. Plan: follow the main line ${summary.pvSan.slice(0, 4).join(" / ") || "and keep the position coordinated"}.`
                        : "План: поліпшуйте активність фігур і дбайте про безпеку короля.",
                    tone: "system" as const,
                    moveLabel: "Current position",
                };
            setCoachFeed((current) => [entry, ...current.filter((item) => item.moveId !== entry.moveId)].slice(0, 12));
            setCoachStatus(finalNode ? `Reviewed ${entry.moveLabel}` : "Розбір позиції завершено.");
            setAnalysisStatus(summary.bestMoveSan
                ? `Analysis complete. Best move: ${summary.bestMoveSan}.`
                : "Рушій не повернув продовження.");
            rememberCurrentSession("Engine analysis");
            persistGameReview(finalRecord, quickImportDraft.trim() ? "Imported review" : "Analysis workspace");
            toast.success("Аналіз оновлено.");
        }
        catch (error) {
            const message = formatAnalysisError(error);
            if (message === "Аналіз зупинено.") {
                setAnalysisPhase("idle");
                setAnalysisMessage("Аналіз зупинено.");
                setAnalysisStatus("Аналіз зупинено.");
                toast.info("Аналіз зупинено.");
            }
            else {
                setAnalysisPhase("error");
                setAnalysisError(message);
                setAnalysisMessage("Не вдалося завершити аналіз. Спробуйте ще раз.");
                setAnalysisStatus("Не вдалося завершити аналіз. Спробуйте ще раз.");
                toast.error(message);
            }
        }
        finally {
            setManualAnalysisRunning(false);
            setBackgroundAnalysisBusy(false);
            setCanStopAnalysis(false);
        }
    }, [
        engineDepth,
        getEngineForFen,
        isManualAnalysisRunning,
        quickImportDraft,
        record,
        rememberCurrentSession,
        persistGameReview,
    ]);
    const handleStopAnalysis = useCallback(() => {
        manualAnalysisRunRef.current.cancelled = true;
        setManualAnalysisRunning(false);
        setBackgroundAnalysisBusy(false);
        setCanStopAnalysis(false);
        setAnalysisPhase("idle");
        setAnalysisMessage("Аналіз зупинено.");
        setAnalysisStatus("Аналіз зупинено.");
        toast.info("Аналіз зупинено.");
    }, []);
    const handleLoadFen = useCallback(() => {
        try {
            const chess = new Chess(fenDraft.trim());
            rememberCurrentSession("Before FEN import");
            setRecord(createRecord(chess.fen()));
            setCurrentEngine(null);
            setEditorPosition(boardPositionFromFen(chess.fen()));
            setFenDialogOpen(false);
            setActiveTool("class");
            resetAnalysisRunView("Позицію завантажено для аналізу.");
            setAnalysisStatus("Позицію завантажено. Продовжуйте аналіз.");
            emitSound("gameStart");
            toast.success("Позицію завантажено.");
        }
        catch {
            toast.error("Неправильний FEN.");
        }
    }, [emitSound, fenDraft, rememberCurrentSession, resetAnalysisRunView]);
    const handleLoadPgn = useCallback(() => {
        try {
            const nextRecord = buildRecordFromPgn(pgnDraft.trim());
            rememberCurrentSession("Before PGN import");
            setRecord(nextRecord);
            setCurrentEngine(null);
            setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
            setPgnDialogOpen(false);
            setActiveTool("class");
            resetAnalysisRunView(`PGN loaded. ${nextRecord.mainline.length} moves ready.`);
            setAnalysisStatus(`Loaded ${nextRecord.mainline.length} moves. Press start to run review.`);
            emitSound("gameStart");
            toast.success("Партію завантажено.");
        }
        catch {
            toast.error("Неправильний PGN.");
        }
    }, [emitSound, pgnDraft, rememberCurrentSession, resetAnalysisRunView]);
    const handleImportGame = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        const lowerName = file.name.toLowerCase();
        if (!/\.(pgn|txt|fen)$/.test(lowerName)) {
            toast.error("Підтримуються файли PGN, FEN і TXT.");
            event.target.value = "";
            return;
        }
        try {
            const text = await file.text();
            setQuickImportDraft(text);
            try {
                const chess = new Chess(text.trim());
                rememberCurrentSession(`Before ${file.name}`);
                setRecord(createRecord(chess.fen()));
                setCurrentEngine(null);
                setEditorPosition(boardPositionFromFen(chess.fen()));
                setFenDraft(text.trim());
                setActiveTool("class");
                resetAnalysisRunView("FEN імпортовано. Можна аналізувати.");
                setAnalysisStatus(`Imported position from ${file.name}.`);
                emitSound("gameStart");
                toast.success("FEN імпортовано.");
                return;
            }
            catch {
                // Not a FEN file; try PGN below.
            }
            const nextRecord = buildRecordFromPgn(text);
            rememberCurrentSession(`Before ${file.name}`);
            setRecord(nextRecord);
            setCurrentEngine(null);
            setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
            setPgnDraft(text);
            setActiveTool("class");
            resetAnalysisRunView(`Imported ${nextRecord.mainline.length} moves. Ready to analyze.`);
            setAnalysisStatus(`Imported ${nextRecord.mainline.length} moves from ${file.name}.`);
            emitSound("gameStart");
            toast.success("Партію імпортовано.");
        }
        catch {
            toast.error("Файл не містить правильного PGN або FEN.");
        }
        finally {
            event.target.value = "";
        }
    }, [emitSound, rememberCurrentSession, resetAnalysisRunView]);
    const applyQuickImport = useCallback((text: string) => {
        const value = text.trim();
        if (!value) {
            setPgnDialogOpen(true);
            return;
        }
        try {
            const chess = new Chess(value);
            rememberCurrentSession("Before quick FEN import");
            setRecord(createRecord(chess.fen()));
            setCurrentEngine(null);
            setEditorPosition(boardPositionFromFen(chess.fen()));
            setFenDraft(value);
            setActiveTool("class");
            resetAnalysisRunView("Позицію завантажено для аналізу.");
            setAnalysisStatus("Позицію завантажено. Продовжуйте аналіз.");
            emitSound("gameStart");
            toast.success("Позицію завантажено.");
            return;
        }
        catch {
            // Try PGN next.
        }
        try {
            const nextRecord = buildRecordFromPgn(value);
            rememberCurrentSession("Before quick PGN import");
            setRecord(nextRecord);
            setCurrentEngine(null);
            setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
            setPgnDraft(value);
            setActiveTool("class");
            resetAnalysisRunView(`PGN loaded. ${nextRecord.mainline.length} moves ready.`);
            setAnalysisStatus(`Loaded ${nextRecord.mainline.length} moves. Press start to run review.`);
            emitSound("gameStart");
            toast.success("Партію завантажено.");
        }
        catch {
            toast.error("Вставте правильний FEN або PGN.");
        }
    }, [emitSound, rememberCurrentSession, resetAnalysisRunView]);
    const handleQuickDrop = useCallback(async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setImportDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (!file) {
            return;
        }
        if (!/\.(pgn|txt|fen)$/.test(file.name.toLowerCase())) {
            toast.error("Перетягніть файл PGN, FEN або TXT.");
            return;
        }
        const text = await file.text();
        setQuickImportDraft(text);
        applyQuickImport(text);
    }, [applyQuickImport]);
    const handleNewAnalysis = useCallback(() => {
        rememberCurrentSession("Before new analysis");
        setRecord(createRecord());
        setCurrentEngine(null);
        setEditorOpen(false);
        setVariationMode(false);
        setFenDraft("");
        setPgnDraft("");
        setQuickImportDraft("");
        setCommentDraft("");
        setActiveTool("import");
        setEditorPosition(boardPositionFromFen(START_FEN));
        setEditorTurn("w");
        resetAnalysisRunView("Новий розбір готовий.");
        setAnalysisStatus("Вставте PGN або FEN для аналізу.");
        setCoachStatus("Завантажте партію або позицію для пояснення.");
        setCoachFeed([]);
        coachEventKeyRef.current = "empty";
        toast.success("Створено новий розбір.");
    }, [rememberCurrentSession, resetAnalysisRunView]);
    const exportPgn = useCallback(() => {
        const pgn = buildPgn(record);
        const blob = new Blob([pgn], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "analysis.pgn";
        link.click();
        URL.revokeObjectURL(url);
    }, [record]);
    const copyCurrentFen = useCallback(async () => {
        await navigator.clipboard.writeText(currentFen);
        toast.success("FEN скопійовано.");
    }, [currentFen]);
    const copyCurrentPgn = useCallback(async () => {
        await navigator.clipboard.writeText(buildPgn(record));
        toast.success("PGN скопійовано.");
    }, [record]);
    const shareAnalysis = useCallback(async () => {
        const url = buildShareUrl(record);
        await navigator.clipboard.writeText(url);
        toast.success("Посилання скопійовано.");
    }, [record]);
    const handleExplainMore = useCallback(() => {
        const entry = buildCoachEntry(currentNode, openingMatch, gamePhase);
        const expanded: CoachEntry = {
            ...entry,
            id: `${entry.id}-deep`,
            title: `${entry.title} - deeper look`,
            text: currentNode?.explanation || entry.text,
            detail: currentPv.length > 0 ? `Candidate line: ${currentPv.join(" / ")}` : entry.detail,
        };
        setCoachFeed((current) => [expanded, ...current].slice(0, 12));
        setCoachStatus("Пояснення готове.");
    }, [currentNode, currentPv, gamePhase, openingMatch]);
    const handleShowBestMove = useCallback(() => {
        if (!currentBestMove) {
            toast.info("Найкращий хід ще обчислюється.");
            return;
        }
        setAnalysisStatus(`Showing best move: ${currentBestMove}`);
        setCoachFeed((current) => [
            {
                id: `bestmove-${currentNode?.id || "root"}`,
                moveId: currentNode?.id || "root",
                title: "Найкращий хід позначено",
                text: `The engine wants ${currentBestMove}. The board now highlights that idea with an arrow.`,
                detail: currentPv.length > 0 ? `Main line: ${currentPv.join(" / ")}` : "Перегляньте стрілку на дошці.",
                tone: "system" as const,
                moveLabel: currentNode ? `${currentNode.moveNumber}${currentNode.color === "w" ? "." : "..."} ${currentNode.san}` : "Position",
            },
            ...current,
        ].slice(0, 12));
    }, [currentBestMove, currentNode, currentPv]);
    const navigateTo = useCallback((path: number[] | null) => {
        setRecord((current) => ({ ...current, currentPath: path ? [...path] : null }));
    }, []);
    const handleShowBlunder = useCallback(() => {
        const blunders = renderedMoves.filter((entry) => entry.node.classification === "blunder");
        if (blunders.length === 0) {
            toast.info("У цьому розборі зівків не знайдено.");
            return;
        }
        const currentIndex = currentMoveIndex;
        const target = blunders.find((entry) => renderedMoves.findIndex((candidate) => candidate.node.id === entry.node.id) > currentIndex) ||
            blunders[0];
        navigateTo(target.path);
        setRightPanelTab("analysis");
        setAnalysisReportMode("critical");
        setAnalysisStatus(`Jumped to blunder: ${target.node.san}`);
        setCoachFeed((current) => [
            {
                id: `blunder-focus-${target.node.id}`,
                moveId: target.node.id,
                title: "Blunder review",
                text: target.node.explanation || "Цей хід суттєво змінив оцінку. Перевірте варіант рушія.",
                detail: target.node.bestMoveSan ? `Better move: ${target.node.bestMoveSan}.` : "Порівняйте позначений хід із варіантом рушія.",
                tone: "danger" as const,
                moveLabel: `${target.node.color === "w" ? `${target.node.moveNumber}.` : `${target.node.moveNumber}...`} ${target.node.san}`,
            },
            ...current,
        ].slice(0, 12));
    }, [currentMoveIndex, navigateTo, renderedMoves]);
    const moveToFirst = useCallback(() => {
        navigateTo(record.mainline.length > 0 ? [0] : null);
    }, [navigateTo, record.mainline.length]);
    const moveBackward = useCallback(() => {
        navigateTo(getPreviousPath(record.currentPath));
    }, [navigateTo, record.currentPath]);
    const moveForward = useCallback(() => {
        navigateTo(getNextPath(record, record.currentPath));
    }, [navigateTo, record]);
    const moveToLast = useCallback(() => {
        navigateTo(getLastPath(record));
    }, [navigateTo, record]);
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            if (target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target?.isContentEditable) {
                return;
            }
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveBackward();
                return;
            }
            if (event.key === "ArrowRight") {
                event.preventDefault();
                moveForward();
                return;
            }
            if (event.key === "Home") {
                event.preventDefault();
                moveToFirst();
                return;
            }
            if (event.key === "End") {
                event.preventDefault();
                moveToLast();
                return;
            }
            if (event.code === "Space") {
                event.preventDefault();
                setIsAutoPlaying((value) => !value);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [moveBackward, moveForward, moveToFirst, moveToLast]);
    const handleUndo = useCallback(() => {
        setRecord((current) => {
            const previous = current.historyStack[current.historyStack.length - 1];
            if (!previous) {
                return current;
            }
            const future = [...current.futureStack, toSnapshot(current)];
            return restoreRecord(previous, current.historyStack.slice(0, -1), future);
        });
    }, []);
    const handleRedo = useCallback(() => {
        setRecord((current) => {
            const next = current.futureStack[current.futureStack.length - 1];
            if (!next) {
                return current;
            }
            const history = [...current.historyStack, toSnapshot(current)];
            return restoreRecord(next, history, current.futureStack.slice(0, -1));
        });
    }, []);
    const handleDeleteCurrentMove = useCallback(() => {
        if (!record.currentPath) {
            return;
        }
        commitRecordChange((draft) => {
            draft.mainline = removeNodeAtPath(draft.mainline, draft.currentPath || []);
            draft.currentPath = getPreviousPath(draft.currentPath);
        });
        toast.success("Хід видалено.");
    }, [commitRecordChange, record.currentPath]);
    const handleFocusComment = useCallback(() => {
        setRightPanelTab("analysis");
        window.setTimeout(() => {
            commentEditorRef.current?.focus();
        }, 50);
    }, []);
    const handleSaveComment = useCallback(() => {
        if (!record.currentPath) {
            return;
        }
        commitRecordChange((draft) => {
            draft.mainline = updateNodeAtPath(draft.mainline, draft.currentPath || [], (node) => {
                node.comment = commentDraft;
            });
        });
        toast.success("Коментар збережено.");
    }, [commentDraft, commitRecordChange, record.currentPath]);
    const handleSetNag = useCallback((nag: MoveNag) => {
        if (!record.currentPath) {
            return;
        }
        commitRecordChange((draft) => {
            draft.mainline = updateNodeAtPath(draft.mainline, draft.currentPath || [], (node) => {
                node.nag = node.nag === nag ? null : nag;
            });
        });
    }, [commitRecordChange, record.currentPath]);
    const appendAnalysisMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        if (!record.currentPath && record.mainline.length > 0) {
            toast.info("Оберіть хід, від якого почати варіант.");
            return false;
        }
        const chess = new Chess(currentFen);
        try {
            const move = chess.move({ from, to, promotion: promotion || "q" });
            if (!move) {
                return false;
            }
            const nextNode = createMoveNode({
                san: move.san,
                from: move.from,
                to: move.to,
                color: move.color,
                promotion: move.promotion,
            }, currentFen, chess.fen(), (currentNode?.ply || 0) + 1);
            commitRecordChange((draft) => {
                if (!draft.currentPath) {
                    draft.mainline.push(nextNode);
                    draft.currentPath = [0];
                    return;
                }
                const path = draft.currentPath;
                const appendAsVariation = variationMode || path.length > 1 || path[0] < draft.mainline.length - 1;
                if (!appendAsVariation && path.length === 1 && path[0] === draft.mainline.length - 1) {
                    draft.mainline.push(nextNode);
                    draft.currentPath = [draft.mainline.length - 1];
                    return;
                }
                draft.mainline = updateNodeAtPath(draft.mainline, path, (node) => {
                    node.children.push(nextNode);
                });
                draft.currentPath = [...path, getNodeByPath(draft.mainline, path)?.children.length ? getNodeByPath(draft.mainline, path)!.children.length - 1 : 0];
            });
            setVariationMode(false);
            setAnalysisStatus(`Added ${move.san} to the analysis tree.`);
            emitSound(move.captured ? "capture" : move.san.includes("+") ? "check" : "move");
            return true;
        }
        catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Неможливий хід.");
            return false;
        }
    }, [
        commitRecordChange,
        currentFen,
        currentNode?.ply,
        emitSound,
        record.currentPath,
        record.mainline.length,
        variationMode,
    ]);
    const handleBoardMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => appendAnalysisMove(from, to, promotion), [appendAnalysisMove]);
    const handleEditorDrop = useCallback((sourceSquare: Square, targetSquare: Square, piece: Piece) => {
        setEditorPosition((current) => {
            const next = { ...current };
            delete next[sourceSquare];
            next[targetSquare] = piece;
            return next;
        });
        return true;
    }, []);
    const handleEditorDropOffBoard = useCallback((sourceSquare: Square) => {
        setEditorPosition((current) => {
            const next = { ...current };
            delete next[sourceSquare];
            return next;
        });
    }, []);
    const handleEditorSquareClick = useCallback((square: Square) => {
        if (!selectedPalettePiece) {
            return;
        }
        setEditorPosition((current) => {
            const next = { ...current };
            if (selectedPalettePiece === "eraser") {
                delete next[square];
            }
            else {
                next[square] = selectedPalettePiece;
            }
            return next;
        });
    }, [selectedPalettePiece]);
    const applyEditorAsRoot = useCallback(() => {
        try {
            const fen = boardPositionToFen(editorPosition, editorTurn);
            const chess = new Chess(fen);
            rememberCurrentSession("Before editor apply");
            setRecord(createRecord(chess.fen()));
            setAnalysisStatus("Позицію застосовано як початкову для аналізу.");
            toast.success("Позицію застосовано.");
        }
        catch {
            toast.error("Неправильна позиція. На дошці має бути по одному королю кожного кольору.");
        }
    }, [editorPosition, editorTurn, rememberCurrentSession]);
    const handleOpenEditorFromCurrent = useCallback(() => {
        setEditorOpen(true);
        setEditorPosition(boardPositionFromFen(currentFen));
        setAnalysisStatus("Редактор позиції увімкнено.");
    }, [currentFen]);
    const handleResetToStartPosition = useCallback(() => {
        rememberCurrentSession("Before reset");
        setRecord(createRecord());
        setCurrentEngine(null);
        setEditorOpen(false);
        setVariationMode(false);
        setCommentDraft("");
        setEditorPosition(boardPositionFromFen(START_FEN));
        setEditorTurn("w");
        setActiveTool("import");
        resetAnalysisRunView("Початкова позиція готова.");
        setAnalysisStatus("Відновлено початкову позицію.");
        setCoachStatus("Завантажте партію або позицію для пояснення.");
        setCoachFeed([]);
        coachEventKeyRef.current = "empty";
        toast.success("Початкову позицію завантажено.");
    }, [rememberCurrentSession, resetAnalysisRunView]);
    const handleClearBoardEditor = useCallback(() => {
        setEditorOpen(true);
        setEditorPosition({});
        setAnalysisStatus("Дошку очищено. Розставте фігури в редакторі.");
        toast.info("Дошку очищено.");
    }, []);
    const currentMoveLabel = currentNode
        ? `${currentNode.color === "w" ? `${currentNode.moveNumber}.` : `${currentNode.moveNumber}...`} ${currentNode.san}`
        : "Start position";
    const sideToMove = currentFen.split(" ")[1] === "b" ? "b" : "w";
    const whitePlayerName = record.headers.White || "White";
    const blackPlayerName = record.headers.Black || "Black";
    const whitePlayerMeta = record.headers.WhiteElo || "Study board";
    const blackPlayerMeta = record.headers.BlackElo ||
        (currentEngine?.backend === "cloud"
            ? "Lichess Cloud"
            : currentEngine?.backend === "native"
                ? "Native Stockfish"
                : "Browser Stockfish");
    const materialBalance = material.diff > 0 ? `White +${material.diff}` : material.diff < 0 ? `Black +${Math.abs(material.diff)}` : "Equal";
    const openingSummary = openingMatch?.line?.comment || openingMatch?.opening.description || "Завантажте партію, щоб визначити дебют.";
    const positionSourceLabel = record.mainline.length > 0 ? "Imported game" : record.rootFen !== START_FEN ? "Custom position" : "Standard position";
    const isPristineWorkspace = record.mainline.length === 0 && record.rootFen === START_FEN && !currentNode;
    const evaluationVerdict = currentMateLabel
        ? currentEvalScore >= 0
            ? "White winning"
            : "Black winning"
        : currentEvalScore > 35
            ? "White better"
            : currentEvalScore < -35
                ? "Black better"
                : "Equal";
    const topMoveCounts = [
        { label: "Найкращий", value: counts.best, tone: "best" as const },
        { label: "Excellent", value: counts.excellent, tone: "excellent" as const },
        { label: "Good", value: counts.good, tone: "good" as const },
        { label: "Inaccuracy", value: counts.inaccuracy, tone: "inaccuracy" as const },
        { label: "Mistake", value: counts.mistake, tone: "mistake" as const },
        { label: "Зівок", value: counts.blunder, tone: "blunder" as const },
    ];
    const analysisIsRunning = analysisPhase === "importing" ||
        analysisPhase === "initializing" ||
        analysisPhase === "analyzingPosition" ||
        analysisPhase === "analyzingGame" ||
        isManualAnalysisRunning;
    const reviewedMoveCount = useMemo(() => collectNodes(record.mainline).filter((node) => node.classification).length, [record.mainline]);
    const resultMoveRows = useMemo(() => renderedMoves.slice(0, 36), [renderedMoves]);
    const resultMovePairs = useMemo(() => mainlinePairs.slice(0, 28), [mainlinePairs]);
    const evalGraphPoints = useMemo(() => {
        const reviewed = collectNodes(record.mainline).filter((node) => node.engineEval != null);
        if (reviewed.length === 0) {
            return [
                { x: 0, y: 50 },
                { x: 100, y: 50 },
            ];
        }
        const visible = reviewed.slice(-42);
        const maxIndex = Math.max(1, visible.length - 1);
        return visible.map((node, index) => {
            const score = Math.max(-500, Math.min(500, node.engineEval || 0));
            return {
                x: (index / maxIndex) * 100,
                y: 50 - (score / 500) * 42,
            };
        });
    }, [record.mainline]);
    const evalGraphPolyline = evalGraphPoints.map((point) => `${point.x},${point.y}`).join(" ");
    const gameInfoRows = [
        { label: "Opening", value: openingMatch?.opening.name || "Unknown" },
        { label: "ECO", value: openingMatch?.opening.eco || "—" },
        { label: "Result", value: record.headers.Result || "*" },
        { label: "Час", value: record.headers.TimeControl || "—" },
        { label: "Точність", value: `${accuracy}%` },
        { label: "Source", value: positionSourceLabel },
    ];
    const progressLabel = totalMoveCount > 0
        ? `${analyzedMoveCount} / ${totalMoveCount}`
        : analysisPhase === "complete"
            ? "Current position"
            : "Preparing";
    const displayEngineStatusLabel = analysisIsRunning
        ? "Analyzing"
        : currentEngine
            ? currentEngine.backend === "cloud"
                ? "Lichess Cloud"
                : currentEngine.backend === "native"
                    ? "Native engine"
                    : "Browser engine"
            : analysisPhase === "error"
                ? "Engine error"
                : analysisEnabled
                    ? "Engine unavailable"
                    : "Ready";
    const cleanEngineDepthLabel = currentEngine?.depth ? `Depth ${currentEngine.depth}` : "Depth -";
    const finalMoveProgressLabel = record.mainline.length > 0
        ? currentMoveIndex >= 0
            ? `Move ${currentMoveIndex + 1} / ${renderedMoves.length}`
            : `Start | ${renderedMoves.length} moves`
        : "No moves yet";
    const topPlayer = flipped
        ? { label: "Білі", name: whitePlayerName, meta: whitePlayerMeta, color: "white" as const }
        : { label: "Чорні", name: blackPlayerName, meta: blackPlayerMeta, color: "black" as const };
    const bottomPlayer = flipped
        ? { label: "Чорні", name: blackPlayerName, meta: blackPlayerMeta, color: "black" as const }
        : { label: "Білі", name: whitePlayerName, meta: whitePlayerMeta, color: "white" as const };
    const hasEngineEval = currentEngine?.numericScore != null ||
        currentNode?.engineEval != null ||
        currentMateLabel != null;
    const evalLabel = currentMateLabel || (hasEngineEval ? formatCp(currentEvalScore) : "--");
    const evalPercent = Math.max(8, Math.min(92, 50 + currentEvalScore / 18));
    const evalWhitePercent = hasEngineEval ? evalPercent : 50;
    const evalBlackPercent = 100 - evalWhitePercent;
    const evalTopSegment = flipped
        ? { color: "#f4f4f2", height: evalWhitePercent }
        : { color: "#101010", height: evalBlackPercent };
    const evalBottomSegment = flipped
        ? { color: "#101010", height: evalBlackPercent }
        : { color: "#f4f4f2", height: evalWhitePercent };
    const positionClass = currentMateLabel
        ? "Forced tactical position"
        : Math.abs(currentEvalScore) < 35
            ? "Balanced position"
            : currentEvalScore > 0
                ? "White pressure"
                : "Black pressure";
    const growthSummary = useMemo(() => buildGrowthSummary(growthState), [growthState]);
    const notebookPreview = useMemo(() => growthState.mistakeNotebook.filter((entry) => entry.status !== "fixed").slice(0, 3), [growthState.mistakeNotebook]);
    const trainingPlanPreview = useMemo(() => growthState.trainingPlan.filter((item) => !item.completed).slice(0, 3), [growthState.trainingPlan]);
    const activeSession = storedSessions[0] || null;
    const analysisModeLabel = activeTool === "class"
        ? "Клас позиції"
        : activeTool === "openings"
            ? "База дебютів"
            : activeTool === "collections"
                ? "Колекції партій"
                : activeTool === "course"
                    ? "Навчальний курс"
                    : activeTool === "history"
                        ? "Історія партій"
                        : activeTool === "editor"
                            ? "Редактор позиції"
                            : "Імпорт партії";
    const primaryActionDisabled = analysisIsRunning || backgroundAnalysisBusy;
    const themeOptions = [ANALYSIS_BOARD_THEME, ...BOARD_THEMES];
    const analysisPanelTitle = analysisReportMode === "overview" ? "Аналіз" : "Аналіз партії";
    const reviewedNodes = useMemo(() => collectNodes(record.mainline), [record.mainline]);
    const candidateRows = useMemo(() => {
        const engineLines = currentEngine?.lines?.slice(0, 5) || [];
        if (engineLines.length > 0) {
            return engineLines.map((line, index) => {
                const sanLine = uciPvToSan(currentFen, line.pv).slice(0, 9);
                return {
                    id: `line-${line.multipv || index + 1}`,
                    score: line.scoreMate != null
                        ? `${line.scoreMate > 0 ? "+" : ""}M${line.scoreMate}`
                        : formatCp(line.scoreCp),
                    text: sanLine.join(" ") || line.pv.slice(0, 8).join(" ") || "Engine line pending",
                    isPrimary: index === 0,
                };
            });
        }
        return [
            {
                id: "line-current",
                score: evalLabel,
                text: currentPv.slice(0, 8).join(" ") || currentBestMove || "Engine line pending",
                isPrimary: true,
            },
        ];
    }, [currentBestMove, currentEngine?.lines, currentFen, currentPv, evalLabel]);
    useEffect(() => {
        if (selectedCandidateIndex >= candidateRows.length) {
            setSelectedCandidateIndex(0);
        }
    }, [candidateRows.length, selectedCandidateIndex]);
    const classificationBySide = useMemo<Record<MoveClassification, {
        w: number;
        b: number;
    }>>(() => {
        const empty = {
            best: { w: 0, b: 0 },
            excellent: { w: 0, b: 0 },
            good: { w: 0, b: 0 },
            inaccuracy: { w: 0, b: 0 },
            mistake: { w: 0, b: 0 },
            blunder: { w: 0, b: 0 },
        };
        reviewedNodes.forEach((node) => {
            if (node.classification) {
                empty[node.classification][node.color] += 1;
            }
        });
        return empty;
    }, [reviewedNodes]);
    const sideAccuracy = useMemo(() => {
        const scoreFor = (color: "w" | "b") => {
            const sideNodes = reviewedNodes.filter((node) => node.color === color && node.evalLoss != null);
            if (sideNodes.length === 0) {
                return 100;
            }
            const loss = sideNodes.reduce((sum, node) => sum + (node.evalLoss || 0), 0) / sideNodes.length;
            return Math.max(0, Math.min(100, Math.round((100 - loss / 12) * 10) / 10));
        };
        return {
            white: scoreFor("w"),
            black: scoreFor("b"),
        };
    }, [reviewedNodes]);
    const classificationReportRows: Array<{
        label: string;
        icon: string;
        key: MoveClassification;
    }> = [
        { label: "Неймовірно", icon: "!!", key: "excellent" },
        { label: "Чудово", icon: "!", key: "good" },
        { label: "Найкращий", icon: "★", key: "best" },
        { label: "Помилка", icon: "?", key: "inaccuracy" },
        { label: "Хиба", icon: "×", key: "mistake" },
        { label: "Груба помилка", icon: "??", key: "blunder" },
    ];
    const criticalMoveEntry = useMemo(() => renderedMoves.find((entry) => entry.node.classification === "blunder") ||
        renderedMoves.find((entry) => entry.node.classification === "mistake") ||
        renderedMoves.find((entry) => entry.node.classification === "inaccuracy") ||
        renderedMoves[0] ||
        null, [renderedMoves]);
    const keyMomentRows = useMemo(() => renderedMoves
        .filter((entry) => entry.node.classification === "blunder" ||
        entry.node.classification === "mistake" ||
        entry.node.classification === "inaccuracy" ||
        entry.node.classification === "best")
        .slice(0, 10), [renderedMoves]);
    const criticalMove = criticalMoveEntry?.node || currentNode;
    const criticalMoveText = criticalMove
        ? `${criticalMove.color === "w" ? `${criticalMove.moveNumber}.` : `${criticalMove.moveNumber}...`} ${criticalMove.san}`
        : "Current position";
    const criticalQuality = criticalMove?.classification === "blunder"
        ? "є грубою помилкою"
        : criticalMove?.classification === "mistake"
            ? "є помилкою"
            : criticalMove?.classification === "inaccuracy"
                ? "є неточністю"
                : "є ключовим моментом";
    const criticalBetterMove = criticalMove?.bestMoveSan || currentBestMove || "Pending";
    const graphMoveRows = useMemo(() => renderedMoves.filter((entry) => entry.node.engineEval != null).slice(-42), [renderedMoves]);
    const handleCandidateSelect = useCallback((index: number) => {
        const row = candidateRows[index];
        if (!row) {
            return;
        }
        setSelectedCandidateIndex(index);
        setCoachFeed((current) => [
            {
                id: `candidate-${row.id}`,
                moveId: currentNode?.id || "candidate",
                title: index === 0 ? "Main engine line" : "Candidate line",
                text: `Selected line ${row.score}: ${row.text}`,
                detail: "The board keeps the current position while the coach explains this candidate continuation.",
                tone: index === 0 ? ("system" as const) : ("neutral" as const),
                moveLabel: currentMoveLabel,
            },
            ...current,
        ].slice(0, 12));
    }, [candidateRows, currentMoveLabel, currentNode?.id]);
    const handleReportJump = useCallback((classification: MoveClassification) => {
        const target = renderedMoves.find((entry) => entry.node.classification === classification);
        if (!target) {
            toast.info(`No ${classificationLabel(classification).toLowerCase()} moves found.`);
            return;
        }
        navigateTo(target.path);
        setAnalysisReportMode(classification === "blunder" || classification === "mistake" ? "critical" : "overview");
    }, [navigateTo, renderedMoves]);
    const openCriticalReview = useCallback(() => {
        if (criticalMoveEntry) {
            navigateTo(criticalMoveEntry.path);
        }
        setAnalysisReportMode("critical");
    }, [criticalMoveEntry, navigateTo]);
    const handleNextKeyMoment = useCallback(() => {
        if (keyMomentRows.length === 0) {
            toast.info("No key moments detected yet.");
            return;
        }
        const currentIndex = keyMomentRows.findIndex((entry) => isSamePath(entry.path, record.currentPath));
        const next = keyMomentRows[currentIndex >= 0 ? (currentIndex + 1) % keyMomentRows.length : 0];
        navigateTo(next.path);
        setAnalysisReportMode("critical");
    }, [keyMomentRows, navigateTo, record.currentPath]);
    return (<div className="relative min-h-[calc(100dvh-76px)] overflow-y-auto bg-transparent text-foreground lg:overflow-hidden">
      <input ref={fileInputRef} type="file" accept=".pgn,.txt,.fen" className="hidden" onChange={handleImportGame}/>

      
      
      

      <main className="relative z-10 flex min-h-[calc(100dvh-76px)] items-start justify-center px-4 py-6">
        <div className="flex w-full max-w-[1160px] flex-col items-center justify-center gap-6 lg:flex-row lg:items-start lg:gap-8 xl:gap-9">
          <section className="flex shrink-0 flex-col gap-2">
            <div className="ml-10 flex h-10 items-center gap-3">
              <button type="button" onClick={() => toast.info(`${topPlayer.label}: ${topPlayer.name} · ${topPlayer.meta}`)} className="grid h-10 w-10 place-items-center rounded-[4px] bg-secondary text-foreground shadow-inner shadow-white/10 transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`${topPlayer.label} player information`}>
                <UserRound className="h-7 w-7 fill-[#1b1b1b] stroke-[#1b1b1b]"/>
              </button>
              <button type="button" onClick={() => toast.info(`${topPlayer.label}: ${topPlayer.name} · ${topPlayer.meta}`)} className="text-[19px] font-extrabold text-foreground drop-shadow transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                {topPlayer.name}
              </button>
            </div>

            <div className="flex items-end gap-3">
              <div className="relative mb-0 overflow-hidden rounded-[1px] border border-border bg-muted" style={{ width: 29, height: boardSize }} title={hasEngineEval ? `Evaluation ${evalLabel} · ${evaluationVerdict}` : "Engine evaluation pending"}>
                <div className="absolute inset-x-0 top-0 transition-all duration-300" style={{
            height: `${evalTopSegment.height}%`,
            backgroundColor: evalTopSegment.color,
        }}/>
                <div className="absolute inset-x-0 bottom-0 transition-all duration-300" style={{
            height: `${evalBottomSegment.height}%`,
            backgroundColor: evalBottomSegment.color,
        }}/>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-sm font-bold" style={{ color: flipped ? "#f4f4f2" : "#1c1c1c" }}>
                  {evalLabel}
                </span>
              </div>

              <div className="relative">
                <div className="absolute -right-10 -top-12 flex items-center gap-1 text-muted-foreground">
                  <button type="button" onClick={() => setFlipped((value) => !value)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Перевернути дошку">
                    <FlipVertical className="h-4 w-4"/>
                  </button>
                  <button type="button" onClick={() => setSettingsOpen(true)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Open analysis settings">
                    <Settings className="h-4 w-4"/>
                  </button>
                </div>
                {editorOpen ? (<Chessboard id="analysis-editor" position={editorPosition} boardWidth={boardSize} boardOrientation={flipped ? "black" : "white"} dropOffBoardAction="trash" onPieceDrop={handleEditorDrop} onPieceDropOffBoard={handleEditorDropOffBoard} onSquareClick={handleEditorSquareClick} showBoardNotation={showCoordinatesEnabled} animationDuration={moveAnimationEnabled ? 240 : 0} customDarkSquareStyle={{
                background: "linear-gradient(135deg, rgba(104,148,169,0.96), rgba(88,128,147,0.98)), radial-gradient(circle at 20% 15%, rgba(255,255,255,0.18), transparent 38%)",
            }} customLightSquareStyle={{
                background: "linear-gradient(135deg, rgba(226,241,246,0.98), rgba(196,222,231,0.96)), radial-gradient(circle at 28% 18%, rgba(255,255,255,0.42), transparent 40%)",
            }} customBoardStyle={{
                borderRadius: 2,
                boxShadow: "0 28px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}/>) : (<ChessBoard initialFen={currentFen} size={boardSize} onMove={handleBoardMove} interactive={!isAutoPlaying} flipped={flipped} showLegalMoves={highlightMoves} showLastMove={showLastMoveEnabled} showChecks customArrows={currentArrows} allowArrows lastMoveSquares={lastMoveSquares} animationDuration={moveAnimationEnabled ? 180 : 0} customDarkSquareStyle={{
                background: "linear-gradient(135deg, rgba(104,148,169,0.96), rgba(88,128,147,0.98)), radial-gradient(circle at 20% 15%, rgba(255,255,255,0.18), transparent 38%)",
            }} customLightSquareStyle={{
                background: "linear-gradient(135deg, rgba(226,241,246,0.98), rgba(196,222,231,0.96)), radial-gradient(circle at 28% 18%, rgba(255,255,255,0.42), transparent 40%)",
            }} customBoardStyle={{
                borderRadius: 2,
                boxShadow: "0 28px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}/>)}
              </div>
            </div>

            <div className="ml-10 flex h-10 items-center gap-3">
              <button type="button" onClick={() => toast.info(`${bottomPlayer.label}: ${bottomPlayer.name} · ${bottomPlayer.meta}`)} className="grid h-10 w-10 place-items-center rounded-[4px] bg-secondary text-foreground shadow-inner shadow-white/20 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary" aria-label={`${bottomPlayer.label} player information`}>
                <UserRound className="h-7 w-7 fill-[#d9d9d9] stroke-[#d9d9d9]"/>
              </button>
              <button type="button" onClick={() => toast.info(`${bottomPlayer.label}: ${bottomPlayer.name} · ${bottomPlayer.meta}`)} className="text-[19px] font-extrabold text-foreground drop-shadow transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                {bottomPlayer.name}
              </button>
            </div>
          </section>

          <aside className="w-full max-w-[400px] overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:w-[392px]">
            <div className="relative bg-secondary px-3 py-2.5 text-center shadow-inner shadow-white/[0.03]">
              {analysisPhase === "complete" && analysisReportMode !== "overview" ? (<button type="button" onClick={() => setAnalysisReportMode("overview")} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Back to analysis overview">
                  <ChevronLeft className="h-5 w-5"/>
                </button>) : null}
              <div className="inline-flex items-center justify-center gap-2 text-[20px] font-extrabold text-foreground">
                <Search className="h-4 w-4 rounded-full bg-muted p-0.5 text-muted-foreground"/>
                {analysisPanelTitle}
              </div>
              <button type="button" onClick={() => setSettingsOpen(true)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary" aria-label="Analysis panel settings">
                <Settings className="h-4 w-4"/>
              </button>
            </div>

            <div className="space-y-2.5 p-2.5">
              {analysisIsRunning ? (<div className="rounded-[10px] border border-primary bg-secondary p-3 shadow-inner shadow-white/[0.03]" aria-live="polite">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-primary">Аналіз триває</p>
                      <p className="mt-1 text-[15px] font-bold text-foreground">{analysisMessage}</p>
                    </div>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary"/>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#22458f] to-[#b8df7e] transition-all duration-300" style={{ width: `${Math.max(4, analysisProgress)}%` }}/>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
                    <span>{progressLabel}</span>
                    <span>{liveDepth ? `Depth ${liveDepth}` : "Engine warmup"}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((item) => (<div key={item} className="h-9 animate-pulse rounded-[8px] border border-border bg-secondary"/>))}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 animate-pulse rounded-[8px] border border-border bg-secondary"/>
                      <div className="h-12 animate-pulse rounded-[8px] border border-border bg-secondary"/>
                    </div>
                  </div>
                  {canStopAnalysis ? (<button type="button" onClick={handleStopAnalysis} className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-secondary text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                      <Pause className="h-4 w-4"/>
                      
                      Зупинити аналіз
                    </button>) : null}
                </div>) : analysisPhase === "complete" || analysisPhase === "error" ? (<div className="space-y-2">
                  {analysisPhase === "error" ? (<div className="max-w-full overflow-hidden rounded-[10px] border border-rose-400/25 bg-rose-500/10 p-3 text-sm text-rose-700">
                      <p className="font-extrabold">Не вдалося завершити аналіз. Спробуйте ще раз.</p>
                      <p className="mt-1 max-h-20 overflow-y-auto break-words text-rose-700/72">
                        {analysisError || "The board and previous data were kept intact."}
                      </p>
                    </div>) : null}

                  <div className="grid grid-cols-5 gap-1.5">
                    <button type="button" onClick={() => setPgnDialogOpen(true)} className="grid h-8 place-items-center rounded-[7px] border border-border bg-secondary text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Import PGN">
                      <Upload className="h-3.5 w-3.5"/>
                    </button>
                    <button type="button" onClick={() => setFenDialogOpen(true)} className="grid h-8 place-items-center rounded-[7px] border border-border bg-secondary text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Вставити FEN">
                      <Copy className="h-3.5 w-3.5"/>
                    </button>
                    <button type="button" onClick={() => setFlipped((value) => !value)} className="grid h-8 place-items-center rounded-[7px] border border-border bg-secondary text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Перевернути дошку">
                      <FlipVertical className="h-3.5 w-3.5"/>
                    </button>
                    <button type="button" onClick={copyCurrentFen} className="grid h-8 place-items-center rounded-[7px] border border-border bg-secondary text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Copy FEN">
                      <Copy className="h-3.5 w-3.5"/>
                    </button>
                    <button type="button" onClick={handleOpenEditorFromCurrent} className="grid h-8 place-items-center rounded-[7px] border border-border bg-secondary text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Edit position">
                      <PencilLine className="h-3.5 w-3.5"/>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-secondary p-1 text-sm font-extrabold">
                    <button type="button" onClick={() => {
                setActiveTool("class");
                setAnalysisReportMode("overview");
            }} className={cn("h-8 rounded-[8px] text-muted-foreground transition hover:bg-secondary hover:text-foreground", analysisReportMode === "overview" && activeTool !== "openings" && "bg-secondary text-foreground shadow-inner shadow-black/40")}>
                      Аналіз
                    </button>
                    <button type="button" onClick={() => setAnalysisReportMode("report")} className={cn("h-8 rounded-[8px] text-muted-foreground transition hover:bg-secondary hover:text-foreground", analysisReportMode === "report" && "bg-secondary text-foreground shadow-inner shadow-black/40")}>
                      Партії
                    </button>
                    <button type="button" onClick={() => {
                setActiveTool("openings");
                setAnalysisReportMode("overview");
            }} className={cn("h-8 rounded-[8px] text-muted-foreground transition hover:bg-secondary hover:text-foreground", analysisReportMode === "overview" && activeTool === "openings" && "bg-secondary text-foreground shadow-inner shadow-black/40")}>
                      До бази деб'ютів
                    </button>
                  </div>

                  {analysisReportMode === "overview" ? (<div className="space-y-2">
                      <div className="rounded-[10px] border border-border bg-secondary p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-muted-foreground">
                          <span>{activeTool === "openings" ? openingMatch?.opening.name || "Unknown opening" : "Аналіз"}</span>
                          <span>Глибина {currentEngine?.depth || liveDepth || 0} | {currentEngine?.backend === "cloud" ? "Lichess Cloud" : currentEngine?.backend === "native" ? "Stockfish · сервер" : "Stockfish · браузер"}</span>
                        </div>
                        <div className="space-y-1.5">
                          {activeTool === "openings" ? (<div className="rounded-[8px] border border-primary bg-primary p-2 text-sm text-muted-foreground">
                              <p className="font-extrabold text-foreground">{openingMatch?.opening.name || "Opening line not found"}</p>
                              <p className="mt-1 text-muted-foreground">ECO {openingMatch?.opening.eco || "—"} · {openingSummary}</p>
                            </div>) : null}
                          {candidateRows.map((row, index) => (<button key={row.id} type="button" onClick={() => handleCandidateSelect(index)} className={cn("flex w-full items-center gap-2 rounded-[7px] border px-2 py-1.5 text-left text-sm transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary", selectedCandidateIndex === index
                        ? "border-primary bg-primary"
                        : "border-border bg-secondary")}>
                              <span className={cn("shrink-0 rounded-[5px] px-1.5 py-0.5 text-sm font-black", row.isPrimary ? "bg-white text-black" : "bg-secondary text-foreground")}>
                                {row.score}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-semibold text-muted-foreground">{row.text}</span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/>
                            </button>))}
                        </div>
                      </div>

                      <div className="rounded-[10px] border border-border bg-secondary p-2.5">
                        <div className="mb-2 flex items-center justify-between text-sm font-extrabold text-foreground">
                          <span>Білі - Чорні</span>
                          <span className="text-sm text-muted-foreground">{record.headers.Result || "*"}</span>
                        </div>
                        <div className="max-h-[126px] space-y-1 overflow-y-auto pr-1">
                          {resultMovePairs.length > 0 ? resultMovePairs.slice(0, 14).map((pair) => (<div key={pair.number} className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-sm">
                              <span className="text-muted-foreground">{pair.number}.</span>
                              {[pair.white, pair.black].map((slot, index) => slot ? (<button key={slot.node.id} type="button" onClick={() => navigateTo(slot.path)} className={cn("truncate rounded-[6px] px-2 py-1 text-left font-extrabold transition hover:bg-secondary", isSamePath(slot.path, record.currentPath) ? "bg-accent text-primary" : "text-muted-foreground")}>
                                    {slot.node.san}
                                  </button>) : <span key={`empty-overview-${pair.number}-${index}`}/>)}
                            </div>)) : (<p className="rounded-[8px] border border-border bg-secondary p-3 text-sm text-muted-foreground">Поточна позиція. Найкращий хід: <span className="font-bold text-foreground">{currentBestMove || "Pending"}</span></p>)}
                        </div>
                      </div>

                      <div className="rounded-[10px] border border-primary bg-primary p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-foreground">Прогрес навчання</p>
                            <p className="text-sm font-semibold text-muted-foreground">
                              {growthSummary.reviewCount}  розборів · {growthSummary.openMistakeCount}  помилок для повторення
                            </p>
                          </div>
                          <button type="button" onClick={handleShowBlunder} className="rounded-[7px] border border-rose-400/25 bg-rose-500/12 px-2 py-1.5 text-sm font-extrabold text-foreground transition hover:bg-rose-500/18">
                            
                            Повторити помилки
                          </button>
                        </div>

                        <div className="mt-2 grid gap-2">
                          {notebookPreview.length > 0 ? (notebookPreview.map((entry) => (<div key={entry.id} className="rounded-[8px] border border-border bg-secondary p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-sm font-extrabold text-foreground">
                                    {entry.moveNumber}. {entry.san} · {classificationLabel(entry.classification)}
                                  </p>
                                  <button type="button" onClick={() => updateNotebookStatus(entry.id, "fixed")} className="shrink-0 rounded-[6px] border border-primary bg-primary px-2 py-1 text-sm font-bold text-primary-foreground transition hover:bg-primary">
                                    
                                    Виправлено
                                  </button>
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm leading-4 text-muted-foreground">
                                  
                                  Найкраще: {entry.bestMoveSan || "pending"} · {entry.explanation}
                                </p>
                              </div>))) : (<p className="rounded-[8px] border border-border bg-secondary p-2 text-sm text-muted-foreground">
                              
                              Помилок ще немає. Запустіть розбір партії.
                            </p>)}
                        </div>

                        <div className="mt-2 rounded-[8px] border border-border bg-secondary p-2">
                          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-muted-foreground">План тренування</p>
                          <div className="mt-1 space-y-1">
                            {trainingPlanPreview.map((item) => (<div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                                <span className="truncate font-bold text-muted-foreground">{item.title}</span>
                                <span className={cn("shrink-0 rounded-full px-2 py-0.5 font-extrabold", item.priority === "high" ? "bg-rose-500/16 text-rose-700" : "bg-secondary text-muted-foreground")}>
                                  {item.priority}
                                </span>
                              </div>))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={handleNewAnalysis} className="h-9 rounded-[8px] border border-border bg-secondary text-sm font-extrabold text-muted-foreground transition hover:bg-secondary hover:text-foreground">Новинка</button>
                        <button type="button" onClick={() => { rememberCurrentSession("Manual save"); toast.success("Analysis saved."); }} className="h-9 rounded-[8px] border border-border bg-secondary text-sm font-extrabold text-muted-foreground transition hover:bg-secondary hover:text-foreground">Зберегти</button>
                        <button type="button" onClick={() => setAnalysisReportMode("report")} className="h-9 rounded-[8px] border border-primary bg-primary text-sm font-extrabold text-primary-foreground transition hover:bg-primary">Розбір</button>
                      </div>
                    </div>) : null}

                  {analysisReportMode === "report" ? (<div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] bg-secondary text-foreground shadow-lg shadow-black/30">
                          <UserRound className="h-10 w-10 fill-[#c9c9c9] stroke-[#363636]"/>
                        </div>
                        <button type="button" onClick={handleExplainMore} className="relative min-h-14 flex-1 rounded-[8px] bg-white px-3 py-2 text-left text-sm font-semibold leading-5 text-foreground shadow-lg shadow-black/25 transition hover:brightness-95">
                          <span className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white"/>
                          {record.mainline.length > 0
                    ? `Game report ready. ${whitePlayerName} scored ${sideAccuracy.white}, ${blackPlayerName} scored ${sideAccuracy.black}.`
                    : `Position analysis ready. ${evaluationVerdict} with best move ${currentBestMove || "pending"}.`}
                        </button>
                      </div>

                      <button type="button" onClick={() => graphMoveRows[graphMoveRows.length - 1] && navigateTo(graphMoveRows[graphMoveRows.length - 1].path)} className="w-full rounded-[8px] border border-border bg-secondary p-0 transition hover:brightness-95">
                        <svg viewBox="0 0 100 34" className="h-[70px] w-full rounded-[8px]" preserveAspectRatio="none" aria-label="Evaluation graph">
                          <rect x="0" y="0" width="100" height="34" fill="rgba(20,20,20,0.22)"/>
                          <line x1="0" y1="17" x2="100" y2="17" stroke="rgba(0,0,0,0.25)" strokeWidth="1"/>
                          <polyline points={evalGraphPolyline} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                          {evalGraphPoints.map((point, index) => (<circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={index === evalGraphPoints.length - 1 ? 1.8 : 1.2} fill={index === evalGraphPoints.length - 1 ? "#ef4444" : "#b88a62"}/>))}
                        </svg>
                      </button>

                      <div className="grid grid-cols-[1fr_1fr] gap-2 text-center">
                        <button type="button" onClick={() => toast.info("Showing white report focus.")} className={cn("rounded-[8px] border p-2 transition hover:bg-secondary", sideAccuracy.white >= sideAccuracy.black ? "border-primary bg-primary" : "border-border bg-secondary")}>
                          <p className="text-sm font-bold text-muted-foreground">Білі</p>
                          <p className="mt-1 text-[20px] font-black text-foreground">{sideAccuracy.white}</p>
                        </button>
                        <button type="button" onClick={() => toast.info("Showing black report focus.")} className={cn("rounded-[8px] border p-2 transition hover:bg-secondary", sideAccuracy.black > sideAccuracy.white ? "border-primary bg-primary" : "border-border bg-secondary")}>
                          <p className="text-sm font-bold text-muted-foreground">Чорні</p>
                          <p className="mt-1 text-[20px] font-black text-foreground">{sideAccuracy.black}</p>
                        </button>
                      </div>

                      <div className="rounded-[10px] border border-border bg-secondary p-2.5">
                        <div className="space-y-1.5">
                          {classificationReportRows.map((row) => (<button key={row.label} type="button" onClick={() => handleReportJump(row.key)} className="grid w-full grid-cols-[1fr_38px_34px_38px] items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-sm font-extrabold text-muted-foreground transition hover:bg-secondary">
                              <span>{row.label}</span>
                              <span className="text-center text-primary">{classificationBySide[row.key].w}</span>
                              <span className={cn("mx-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-sm", classificationClasses(row.key))}>{row.icon}</span>
                              <span className="text-center text-primary">{classificationBySide[row.key].b}</span>
                            </button>))}
                        </div>
                      </div>

                      <button type="button" onClick={openCriticalReview} className="flex h-12 w-full items-center justify-center rounded-[8px] bg-gradient-to-b from-[#79bf4a] to-[#5da73d] text-[17px] font-black text-foreground shadow-sm transition hover:brightness-110">
                        Розпочати розбір
                      </button>
                    </div>) : null}

                  {analysisReportMode === "critical" ? (<div className="space-y-2">
                      <div className="rounded-[10px] bg-white p-3 text-foreground shadow-xl shadow-black/25">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-black">
                              <span className="mr-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-sm text-foreground">??</span>
                              {criticalMoveText} {criticalQuality}
                            </p>
                            <p className="mt-1 text-sm leading-5 text-foreground">{criticalMove?.explanation || latestCoachEntry.detail}</p>
                          </div>
                          <span className="shrink-0 rounded-[6px] bg-muted px-2 py-1 text-sm font-black text-foreground">{currentMateLabel || evalLabel}</span>
                        </div>
                        <button type="button" onClick={handleShowBestMove} className="mt-3 rounded-[7px] bg-muted px-3 py-2 text-sm font-black text-foreground transition hover:bg-muted">
                          
                          Показати мат
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={handleShowBestMove} className="h-9 rounded-[7px] border border-border bg-secondary text-sm font-extrabold text-foreground transition hover:bg-secondary">Найкращий хід</button>
                        <button type="button" onClick={() => criticalMoveEntry && navigateTo(criticalMoveEntry.path)} className="h-9 rounded-[7px] border border-border bg-secondary text-sm font-extrabold text-foreground transition hover:bg-secondary">Повторити</button>
                        <button type="button" onClick={handleNextKeyMoment} className="h-9 rounded-[7px] border border-primary bg-primary text-sm font-extrabold text-primary-foreground transition hover:bg-primary">Далі</button>
                      </div>

                      <div className="rounded-[10px] border border-border bg-secondary p-2.5">
                        <div className="max-h-[142px] space-y-1 overflow-y-auto pr-1">
                          {(keyMomentRows.length > 0 ? keyMomentRows : resultMoveRows.slice(0, 8)).map(({ path, node }) => (<button key={node.id} type="button" onClick={() => navigateTo(path)} className={cn("grid w-full grid-cols-[28px_1fr_auto] items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-sm transition hover:bg-secondary", isSamePath(path, record.currentPath) && "bg-secondary")}>
                              <span className="text-muted-foreground">{node.moveNumber}.</span>
                              <span className={cn("truncate font-extrabold", node.classification === "blunder" ? "text-rose-700" : node.classification === "best" ? "text-emerald-700" : "text-muted-foreground")}>{node.san}</span>
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-sm font-black", classificationClasses(node.classification))}>{classificationLabel(node.classification).replace(" move", "")}</span>
                            </button>))}
                        </div>
                      </div>

                      <button type="button" onClick={() => setAnalysisReportMode("report")} className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-secondary text-sm font-black text-foreground transition hover:bg-secondary">
                        <ChevronLeft className="h-4 w-4"/>
                        Ключові моменти
                      </button>

                      <svg viewBox="0 0 100 28" className="h-14 w-full rounded-[8px] border border-border bg-secondary" preserveAspectRatio="none" aria-label="Critical evaluation graph">
                        <line x1="0" y1="14" x2="100" y2="14" stroke="rgba(0,0,0,0.24)" strokeWidth="1"/>
                        <polyline points={evalGraphPolyline} fill="none" stroke="#5f5f5f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                        <line x1="84" y1="0" x2="84" y2="28" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                      </svg>

                      <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={moveToFirst} className="h-10 rounded-[8px] bg-secondary text-muted-foreground transition hover:bg-secondary"><ChevronsLeft className="mx-auto h-4 w-4"/></button>
                        <button type="button" onClick={moveBackward} className="h-10 rounded-[8px] bg-secondary text-muted-foreground transition hover:bg-secondary"><ChevronLeft className="mx-auto h-4 w-4"/></button>
                        <button type="button" onClick={() => setIsAutoPlaying((value) => !value)} className="h-10 rounded-[8px] bg-secondary text-muted-foreground transition hover:bg-secondary">{isAutoPlaying ? <Pause className="mx-auto h-4 w-4"/> : <Play className="mx-auto h-4 w-4"/>}</button>
                        <button type="button" onClick={moveForward} className="h-10 rounded-[8px] bg-secondary text-muted-foreground transition hover:bg-secondary"><ChevronRight className="mx-auto h-4 w-4"/></button>
                      </div>
                    </div>) : null}

                  

                  

                  

                  

                  

                  
                </div>) : (<>
              <button type="button" onClick={() => {
                setActiveTool("class");
                setRightPanelTab("analysis");
            }} className={cn("flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[16px] font-extrabold text-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary active:translate-y-px", activeTool === "class" && "border-primary bg-primary")}>
                <BarChart3 className="h-5 w-5 text-primary"/>
                Клас
              </button>
              <button type="button" onClick={() => setActiveTool("openings")} className={cn("flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[15px] font-extrabold text-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary active:translate-y-px", activeTool === "openings" && "border-primary bg-primary")}>
                <Compass className="h-5 w-5 text-foreground"/>
                До бази деб'ютів
              </button>
              <button type="button" onClick={() => setActiveTool("collections")} className={cn("flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[15px] font-extrabold text-foreground shadow-sm transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary active:translate-y-px", activeTool === "collections" && "border-primary bg-primary")}>
                <Layers3 className="h-5 w-5 text-primary"/>
                Колекції партій
              </button>

              <div className={cn("overflow-hidden rounded-[8px] border bg-secondary shadow-inner shadow-white/[0.03] transition", isImportDragging ? "border-primary bg-primary" : "border-border")} onDragEnter={() => setImportDragging(true)} onDragLeave={() => setImportDragging(false)} onDragOver={(event) => {
                event.preventDefault();
                setImportDragging(true);
            }} onDrop={handleQuickDrop}>
                {activeTool === "import" ? (<Textarea value={quickImportDraft} onChange={(event) => setQuickImportDraft(event.target.value)} placeholder="Вставте FEN, PGN або перетягніть файл партії." className="min-h-[88px] resize-none border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0" aria-label="Paste PGN or FEN"/>) : (<div className="min-h-[88px] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-extrabold text-foreground">{analysisModeLabel}</p>
                        <span className="rounded-full border border-border bg-secondary px-2 py-1 text-sm font-bold text-muted-foreground">
                        {positionSourceLabel}
                      </span>
                    </div>

                    {activeTool === "class" ? (<div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="rounded-[7px] border border-border bg-secondary p-2">
                          <p className="text-muted-foreground">Позиція</p>
                          <p className="font-bold text-foreground">{positionClass}</p>
                        </div>
                        <div className="rounded-[7px] border border-border bg-secondary p-2">
                          <p className="text-muted-foreground">Оцінка</p>
                          <p className="font-bold text-foreground">{evalLabel} · {evaluationVerdict}</p>
                        </div>
                        <div className="rounded-[7px] border border-border bg-secondary p-2">
                          <p className="text-muted-foreground">Найкращий хід</p>
                          <p className="font-bold text-foreground">{currentBestMove || "Pending"}</p>
                        </div>
                        <div className="rounded-[7px] border border-border bg-secondary p-2">
                          <p className="text-muted-foreground">Точність</p>
                          <p className="font-bold text-foreground">{accuracy}% · втрата сантипішаків {acpl}</p>
                        </div>
                      </div>) : activeTool === "openings" ? (<div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p><span className="text-muted-foreground">Дебют:</span> {openingMatch?.opening.name || "Unknown line"}</p>
                        <p><span className="text-muted-foreground">ECO:</span> {openingMatch?.opening.eco || "—"}</p>
                        <p className="max-h-10 overflow-hidden">{openingSummary}</p>
                      </div>) : activeTool === "collections" ? (<div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {storedSessions.length > 0 ? (storedSessions.slice(0, 2).map((session) => (<button key={session.id} type="button" onClick={() => restoreSession(session)} className="flex w-full items-center justify-between rounded-[7px] border border-border bg-secondary px-2 py-2 text-left transition hover:bg-secondary">
                              <span className="truncate font-bold text-foreground">{session.title}</span>
                              <span className="text-sm text-muted-foreground">{session.source}</span>
                            </button>))) : (<p>Збережених розборів ще немає. Аналіз зберігається в цьому браузері.</p>)}
                      </div>) : activeTool === "course" ? (<div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>Відкрийте урок, щоб попрацювати з навчальною позицією.</p>
                        <button type="button" onClick={() => toast.info("Course library will use your real lessons when available.")} className="rounded-[7px] border border-border bg-secondary px-3 py-2 text-sm font-bold text-foreground transition hover:bg-secondary">
                          
                          Відкрити уроки
                        </button>
                      </div>) : activeTool === "history" ? (<div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {storedSessions.length > 0 ? (<p>{storedSessions.length}  розборів збережено в цьому браузері. Відкрийте попередній або виберіть із колекції.</p>) : (<p>Історія аналізу поки порожня.</p>)}
                      </div>) : (<div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <p>Редактор позиції {editorOpen ? "enabled" : "available"}. Розставте фігури або вставте FEN.</p>
                        <button type="button" onClick={applyEditorAsRoot} disabled={!editorOpen} className="rounded-[7px] border border-border bg-secondary px-3 py-2 text-sm font-bold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45">
                          
                          Застосувати позицію
                        </button>
                      </div>)}
                  </div>)}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-10 w-full items-center justify-center gap-2 border-t border-border bg-secondary text-[14px] font-extrabold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  <CloudUpload className="h-4 w-4"/>
                  Вивантажити файл
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setActiveTool("collections")} className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-sm font-extrabold leading-4 text-foreground shadow-sm transition hover:bg-secondary">
                  <Archive className="h-4 w-4 shrink-0 text-muted-foreground"/>
                  <span>Збережені розбори партій</span>
                </button>
                <button type="button" onClick={() => {
                setActiveTool("course");
                toast.info("Course loader is ready. Real lessons will appear when available.");
            }} className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-sm font-extrabold leading-4 text-foreground shadow-sm transition hover:bg-secondary">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground"/>
                  <span>Завантажити курс</span>
                </button>
                <button type="button" onClick={() => setActiveTool("history")} className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-sm font-extrabold leading-4 text-foreground shadow-sm transition hover:bg-secondary">
                  <FolderClock className="h-4 w-4 shrink-0 text-muted-foreground"/>
                  <span>Історія партій</span>
                </button>
                <button type="button" onClick={() => {
                setActiveTool("editor");
                handleOpenEditorFromCurrent();
            }} className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-border bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-sm font-extrabold leading-4 text-foreground shadow-sm transition hover:bg-secondary">
                  <PencilLine className="h-4 w-4 shrink-0 text-muted-foreground"/>
                  <span>Встановити позицію</span>
                </button>
              </div>
                </>)}

              <button type="button" onClick={() => void handleStartAnalysis()} disabled={primaryActionDisabled} className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[8px] bg-primary text-[18px] font-extrabold text-primary-foreground shadow-sm transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65">
                {primaryActionDisabled ? <Loader2 className="h-5 w-5 animate-spin"/> : null}
                {primaryActionDisabled ? "Analyzing..." : analysisPhase === "complete" ? "Re-analyze" : "Розпочати аналіз"}
              </button>

              <button type="button" onClick={() => {
            if (!activeSession) {
                toast.info("No previous analysis session yet.");
                return;
            }
            restoreSession(activeSession);
        }} disabled={!activeSession || analysisIsRunning} className="flex items-center gap-2 px-3 pb-1 pt-1 text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
                <RotateCcw className="h-4 w-4"/>
                
                Попередній розбір
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Налаштування аналізу</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              
              Зміни зберігаються в цьому браузері.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <SettingToggle title="Перевернути дошку" description="Swap white and black sides on the board." checked={flipped} onCheckedChange={setFlipped}/>
            <SettingToggle title="Coordinates" description="Show a-h and 1-8 board notation." checked={showCoordinatesEnabled} onCheckedChange={setShowCoordinatesEnabled}/>
            <SettingToggle title="Sound" description="Play move, capture, and check sounds." checked={soundEnabled} onCheckedChange={setSoundEnabled}/>
            <SettingToggle title="Move animation" description="Animate piece movement on the board." checked={moveAnimationEnabled} onCheckedChange={setMoveAnimationEnabled}/>
            <SettingToggle title="Legal move dots" description="Highlight available destination squares." checked={highlightMoves} onCheckedChange={setHighlightMoves}/>
            <SettingToggle title="Last move" description="Highlight the last move after navigation." checked={showLastMoveEnabled} onCheckedChange={setShowLastMoveEnabled}/>
          </div>

          <div className="rounded-[16px] border border-border bg-secondary p-3">
            <p className="text-sm font-semibold text-foreground">Глибина аналізу</p>
            <p className="mt-1 text-xs text-muted-foreground">Більша глибина потребує більше часу. Доступна глибина залежить від рушія.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[8, 10, 12, 14, 16].map((depth) => (<button key={depth} type="button" onClick={() => setEngineDepth(depth)} className={cn("rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-primary", engineDepth === depth
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:bg-secondary")}>
                  
                  Глибина {depth}
                </button>))}
            </div>
          </div>

          <div className="rounded-[16px] border border-border bg-secondary p-3">
            <p className="text-sm font-semibold text-foreground">Тема дошки</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {themeOptions.map((option) => (<button key={option.id} type="button" onClick={() => setTheme(option)} className={cn("flex items-center justify-between rounded-[14px] border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary", theme.id === option.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-foreground hover:bg-secondary")}>
                  <span>{option.name}</span>
                  <span className="flex overflow-hidden rounded-full border border-border">
                    <span className="h-4 w-4" style={{ background: option.light }}/>
                    <span className="h-4 w-4" style={{ background: option.dark }}/>
                  </span>
                </button>))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFenDialogOpen} onOpenChange={setFenDialogOpen}>
        <DialogContent className="max-w-xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Вставити FEN</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              
              Завантажте позицію для нового аналізу.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={fenDraft} onChange={(event) => setFenDraft(event.target.value)} placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" className="min-h-[120px] border-border bg-secondary text-foreground placeholder:text-muted-foreground"/>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFenDialogOpen(false)} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              
              Скасувати
            </Button>
            <Button onClick={handleLoadFen} className="bg-primary text-primary-foreground hover:bg-primary">
              
              Застосувати FEN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPgnDialogOpen} onOpenChange={setPgnDialogOpen}>
        <DialogContent className="max-w-3xl border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Завантажити PGN</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              
              Вставте PGN партії, щоб відкрити ходи та запустити аналіз.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={pgnDraft} onChange={(event) => setPgnDraft(event.target.value)} placeholder='[Event "Training"]' className="min-h-[220px] border-border bg-secondary font-mono text-sm text-foreground placeholder:text-muted-foreground"/>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              
              Підтримуються PGN із заголовками та без них.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPgnDialogOpen(false)} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
                
                Скасувати
              </Button>
              <Button onClick={handleLoadPgn} className="bg-primary text-primary-foreground hover:bg-primary">
                
                Аналізувати PGN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
