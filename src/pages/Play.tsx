import ChessBoard from "@/components/ChessBoard";
import ChessTimer from "@/components/ChessTimer";
import MoveList from "@/components/MoveList";
import PgnViewer from "@/components/PgnViewer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBoardSettings } from "@/contexts/BoardSettingsContext";
import { ActionButton, BotAvatar, buildReviewData, buildReviewInsights, calculateAccuracy, calculateAccuracyBreakdown, calculateRatingDelta, chooseBotMove, cloneGame, cloneGameFromSnapshot, evaluatePositionCp, formatEval, formatResultLabel, getCapturedPieces, getGameResult, getLocalAnalysisSnapshot, isUciMove, OptionsCard, parseEngineInfoLine, playMoveSound, randomBetween, randomItem, resolveBotAiLevel, resolveStockfishDepth, reviewLabelUa, StatCard, uciPvToSan, uciToSan } from '@/features/play/components';
import { Arrow, BotQuoteEvent, BOTS, EngineMode, PLAY_BOARD_THEME, SHARED_QUOTES, SideChoice, STOCKFISH_EVAL_TIMEOUT_MS, STOCKFISH_HINT_TIMEOUT_MS, STOCKFISH_MOVE_TIMEOUT_MS, TIME_CONTROLS, TimeControlId } from '@/features/play/model';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { playChessSound, type ChessSoundType } from "@/hooks/useChessSounds";
import analyzeFenWithStockfish, { type AnalyzeResult } from "@/lib/stockfish";
import { Chess, type Move, type Square } from "chess.js";
import { BrainCircuit, Copy, Download, Flag, Lightbulb, Minus, PauseCircle, PlayCircle, RefreshCw, Share2, Sparkles, Trophy, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { toast } from "sonner";
export default function Play() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    const { theme, setTheme, pieceStyle, setPieceStyle, showCoordinates: savedCoordinates, setShowCoordinates, } = useBoardSettings();
    const initialBoardPrefsRef = useRef({
        theme,
        pieceStyle,
        showCoordinates: savedCoordinates,
    });
    const [selectedBotId, setSelectedBotId] = useState(() => {
        const requested = searchParams.get("bot");
        return BOTS.some((bot) => bot.id === requested) ? requested! : "andriy";
    });
    const [selectedSide, setSelectedSide] = useState<SideChoice>(() => {
        const requested = searchParams.get("color");
        return requested === "w" || requested === "b" || requested === "random" ? requested : "w";
    });
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControlId>(() => {
        const requested = searchParams.get("time") as TimeControlId | null;
        return TIME_CONTROLS.some((control) => control.id === requested) ? requested! : "unlimited";
    });
    const [flipBoard, setFlipBoard] = useState(false);
    const [highlightMoves, setHighlightMoves] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showCoordinatesEnabled, setShowCoordinatesEnabled] = useState(savedCoordinates);
    const [mobileBotsOpen, setMobileBotsOpen] = useState(false);
    const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
    const [analysisToolsOpen, setAnalysisToolsOpen] = useState(false);
    const [analysisTab, setAnalysisTab] = useState("moves");
    const [game, setGame] = useState(() => new Chess());
    const [gameNonce, setGameNonce] = useState(0);
    const [hasStartedMatch, setHasStartedMatch] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isEngineThinking, setIsEngineThinking] = useState(false);
    const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
    const [engineStatus, setEngineStatus] = useState("Готуємо партію…");
    const [, setBotQuote] = useState(BOTS[0].intro);
    const [engineMode, setEngineMode] = useState<EngineMode>("stockfish");
    const [engineDepth, setEngineDepth] = useState(0);
    const [evalScore, setEvalScore] = useState(0);
    const [bestMoveLabel, setBestMoveLabel] = useState<string | null>(null);
    const [bestMoveUci, setBestMoveUci] = useState<string | null>(null);
    const [principalVariation, setPrincipalVariation] = useState<string[]>([]);
    const [hintArrow, setHintArrow] = useState<Arrow[]>([]);
    const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
    const [engineError, setEngineError] = useState<string | null>(null);
    const [showPostGameModal, setShowPostGameModal] = useState(false);
    const [boardSize, setBoardSize] = useState(640);
    const [trainingRating, setTrainingRating] = useState(() => {
        if (typeof window === "undefined") {
            return 1200;
        }
        const stored = window.localStorage.getItem("cmua-ai-rating");
        return stored ? Number.parseInt(stored, 10) || 1200 : 1200;
    });
    const engineMoveRequestRef = useRef(0);
    const evaluationRequestRef = useRef(0);
    const quoteEventRef = useRef<BotQuoteEvent>("intro");
    const lastEngineResultRef = useRef<{
        fen: string;
        result: AnalyzeResult;
    } | null>(null);
    const hasAutoStartedRef = useRef(false);
    const selectedBot = useMemo(() => BOTS.find((bot) => bot.id === selectedBotId) || BOTS[0], [selectedBotId]);
    const timeControl = useMemo(() => TIME_CONTROLS.find((control) => control.id === selectedTimeControl) || TIME_CONTROLS[0], [selectedTimeControl]);
    const botAiLevel = useMemo(() => resolveBotAiLevel(selectedBot, trainingRating), [selectedBot, trainingRating]);
    const playerName = user?.user_metadata?.display_name ||
        user?.email?.split("@")[0] ||
        "Гість";
    const playerInitial = playerName.charAt(0).toUpperCase() || "G";
    const actualBoardFlipped = flipBoard ? playerColor === "w" : playerColor === "b";
    const clockMs = timeControl.minutes ? timeControl.minutes * 60 * 1000 : 0;
    const reviewData = useMemo(() => buildReviewData(game), [game]);
    const latestMoveIndex = reviewData.movesSan.length > 0 ? reviewData.movesSan.length - 1 : null;
    const reviewMode = selectedMoveIndex != null && selectedMoveIndex !== latestMoveIndex;
    const displayedFen = selectedMoveIndex != null
        ? reviewData.positions[selectedMoveIndex + 1] || game.fen()
        : game.fen();
    const displayedMove = selectedMoveIndex != null
        ? reviewData.movesVerbose[selectedMoveIndex]
        : reviewData.movesVerbose[reviewData.movesVerbose.length - 1];
    const lastMoveSquares = displayedMove ? [displayedMove.from, displayedMove.to] : [];
    const currentTurn = game.turn();
    const opponentColor = playerColor === "w" ? "b" : "w";
    const canPlayerMove = hasStartedMatch &&
        !gameOver &&
        !isPaused &&
        !isEngineThinking &&
        !reviewMode &&
        currentTurn === playerColor;
    const reviewInsights = useMemo(() => buildReviewInsights(reviewData.positions, reviewData.movesSan, playerColor, botAiLevel), [botAiLevel, playerColor, reviewData.movesSan, reviewData.positions]);
    const playerAccuracy = useMemo(() => calculateAccuracy(reviewData.positions, playerColor), [playerColor, reviewData.positions]);
    const playerBreakdown = useMemo(() => calculateAccuracyBreakdown(reviewData.positions, playerColor), [playerColor, reviewData.positions]);
    const analysisChartData = useMemo(() => reviewData.positions.map((fen, index) => ({
        move: index,
        eval: evaluatePositionCp(new Chess(fen)) / 100,
    })), [reviewData.positions]);
    const capturedWhitePieces = useMemo(() => getCapturedPieces(game, "w"), [game]);
    const capturedBlackPieces = useMemo(() => getCapturedPieces(game, "b"), [game]);
    const playerCaptures = playerColor === "w" ? capturedBlackPieces : capturedWhitePieces;
    const botCaptures = playerColor === "w" ? capturedWhitePieces : capturedBlackPieces;
    useEffect(() => {
        const previous = initialBoardPrefsRef.current;
        setTheme(PLAY_BOARD_THEME);
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
        const syncBoardSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            if (width < 640) {
                setBoardSize(Math.max(240, width - 32));
                return;
            }
            if (width < 1024) {
                const widthBound = width - 48;
                const heightBound = Math.max(340, height - 190);
                setBoardSize(Math.max(340, Math.min(620, widthBound, heightBound)));
                return;
            }
            const widthBound = width - 440;
            const heightBound = height - 170;
            setBoardSize(Math.max(380, Math.min(680, widthBound, heightBound)));
        };
        syncBoardSize();
        window.addEventListener("resize", syncBoardSize);
        return () => window.removeEventListener("resize", syncBoardSize);
    }, []);
    useEffect(() => {
        setBotQuote(selectedBot.intro);
        quoteEventRef.current = "intro";
    }, [selectedBot]);
    const setQuoteForEvent = useCallback((event: BotQuoteEvent) => {
        if (event === quoteEventRef.current && event !== "intro") {
            return;
        }
        quoteEventRef.current = event;
        if (event === "intro") {
            setBotQuote(selectedBot.intro);
            return;
        }
        const pool = SHARED_QUOTES[event];
        setBotQuote(randomItem(pool));
    }, [selectedBot]);
    const activateFallbackEngine = useCallback((error?: unknown) => {
        const fallbackMessage = "Stockfish недоступний. Тимчасово використовується локальний рушій.";
        const message = error instanceof Error && error.message.trim().length > 0
            ? error.message
            : fallbackMessage;
        setEngineMode("fallback");
        setEngineDepth(0);
        setPrincipalVariation([]);
        setEngineError((current) => current || message);
    }, []);
    const restoreStockfishMode = useCallback(() => {
        setEngineMode("stockfish");
        setEngineError(null);
    }, []);
    const applyEngineResult = useCallback((fen: string, result: AnalyzeResult) => {
        lastEngineResultRef.current = { fen, result };
        if (result.scoreMate != null) {
            setEvalScore(result.scoreMate > 0 ? 10000 : -10000);
        }
        else if (result.scoreCp != null) {
            setEvalScore(result.scoreCp);
        }
        const san = result.bestmove ? uciToSan(fen, result.bestmove) : null;
        setBestMoveLabel(san);
        setBestMoveUci(result.bestmove);
        setPrincipalVariation(uciPvToSan(fen, result.pv).slice(0, 5));
    }, []);
    const applyFallbackAnalysis = useCallback((fen: string) => {
        const fallback = getLocalAnalysisSnapshot(fen, botAiLevel);
        setEvalScore(fallback.evalScore);
        setBestMoveLabel(fallback.bestMoveLabel);
        setBestMoveUci(fallback.bestMoveUci);
        setPrincipalVariation(fallback.principalVariation);
        return fallback;
    }, [botAiLevel]);
    const emitSound = useCallback((type: ChessSoundType) => {
        if (soundEnabled) {
            playChessSound(type);
        }
    }, [soundEnabled]);
    const jumpToMove = useCallback((index: number | null) => {
        setSelectedMoveIndex(index);
    }, []);
    const startConfiguredGame = useCallback(() => {
        const actualColor = selectedSide === "random"
            ? Math.random() < 0.5
                ? "w"
                : "b"
            : selectedSide;
        engineMoveRequestRef.current += 1;
        evaluationRequestRef.current += 1;
        lastEngineResultRef.current = null;
        setGame(new Chess());
        setGameNonce((value) => value + 1);
        setPlayerColor(actualColor);
        setHasStartedMatch(true);
        setGameOver(false);
        setIsPaused(false);
        setIsEngineThinking(false);
        setSelectedMoveIndex(null);
        setHintArrow([]);
        setEvalScore(0);
        setBestMoveLabel(null);
        setBestMoveUci(null);
        setPrincipalVariation([]);
        setEngineDepth(0);
        setEngineError(null);
        setShowPostGameModal(false);
        setEngineStatus(actualColor === "b" ? `${selectedBot.name} ходить першим.` : "Ваш хід.");
        setQuoteForEvent("intro");
        setMobileBotsOpen(false);
        setMobileOptionsOpen(false);
        emitSound("gameStart");
    }, [emitSound, selectedBot.name, selectedSide, setQuoteForEvent]);
    useEffect(() => {
        if (hasAutoStartedRef.current) {
            return;
        }
        hasAutoStartedRef.current = true;
        startConfiguredGame();
    }, [startConfiguredGame]);
    const exportPgn = useCallback(() => {
        const pgn = game.pgn();
        if (!pgn.trim()) {
            toast.info("Поки немає ходів для збереження.");
            return;
        }
        const blob = new Blob([pgn], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "play-vs-bot.pgn";
        link.click();
        URL.revokeObjectURL(url);
    }, [game]);
    const copyFen = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(game.fen());
            toast.success("FEN скопійовано.");
        }
        catch {
            toast.error("Не вдалося скопіювати FEN.");
        }
    }, [game]);
    const copyPgn = useCallback(async () => {
        const pgn = game.pgn();
        if (!pgn.trim()) {
            toast.info("Поки немає ходів для збереження.");
            return;
        }
        try {
            await navigator.clipboard.writeText(pgn);
            toast.success("PGN скопійовано.");
        }
        catch {
            toast.error("Не вдалося скопіювати PGN.");
        }
    }, [game]);
    const shareGame = useCallback(async () => {
        if (!game.pgn().trim()) {
            toast.info("Спочатку зробіть кілька ходів.");
            return;
        }
        const url = `${window.location.origin}/analysis?pgn=${encodeURIComponent(game.pgn())}`;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Посилання на партію скопійовано.");
        }
        catch {
            toast.error("Не вдалося скопіювати посилання.");
        }
    }, [game]);
    const openAnalysis = useCallback(() => {
        if (!game.pgn().trim()) {
            toast.info("Зробіть хоча б один хід, щоб відкрити аналіз.");
            return;
        }
        navigate(`/analysis?pgn=${encodeURIComponent(game.pgn())}`);
    }, [game, navigate]);
    const finalizeGame = useCallback(async (finishedGame: Chess, overrideResult?: string, overrideStatus?: string) => {
        const result = overrideResult || getGameResult(finishedGame);
        setGame(finishedGame);
        setGameOver(true);
        setIsEngineThinking(false);
        setIsPaused(false);
        setEngineDepth(0);
        setHintArrow([]);
        setSelectedMoveIndex(null);
        setShowPostGameModal(true);
        if (overrideStatus) {
            setEngineStatus(overrideStatus);
        }
        else if (result === "1/2-1/2") {
            setEngineStatus("Нічия.");
        }
        else {
            const playerWon = (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
            setEngineStatus(playerWon ? "Ви перемогли." : "Ви програли.");
        }
        if (result === "1/2-1/2") {
            emitSound("draw");
            setQuoteForEvent("draw");
        }
        else {
            const playerWon = (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
            emitSound(finishedGame.isCheckmate() ? "checkmate" : "gameEnd");
            setQuoteForEvent(playerWon ? "playerWin" : "botWin");
            const delta = calculateRatingDelta(trainingRating, selectedBot.rating, result, playerColor);
            const nextRating = Math.max(200, trainingRating + delta);
            setTrainingRating(nextRating);
            if (typeof window !== "undefined") {
                window.localStorage.setItem("cmua-ai-rating", String(nextRating));
            }
        }
    }, [emitSound, playerColor, selectedBot.rating, setQuoteForEvent, trainingRating]);
    const handlePlayerTimeout = useCallback(async () => {
        if (gameOver) {
            return;
        }
        emitSound("timeout");
        await finalizeGame(game, playerColor === "w" ? "0-1" : "1-0", `${selectedBot.name} переміг за часом.`);
    }, [emitSound, finalizeGame, game, gameOver, playerColor, selectedBot.name]);
    const handleBotTimeout = useCallback(async () => {
        if (gameOver) {
            return;
        }
        emitSound("timeout");
        await finalizeGame(game, playerColor === "w" ? "1-0" : "0-1", `У ${selectedBot.name} завершився час.`);
    }, [emitSound, finalizeGame, game, gameOver, playerColor, selectedBot.name]);
    const applyMoveResult = useCallback(async (nextGame: Chess, move: Move, actor: "player" | "bot", quoteEvent?: Exclude<BotQuoteEvent, "intro" | "botWin" | "playerWin" | "draw">) => {
        playMoveSound(move, nextGame, soundEnabled);
        setGame(nextGame);
        setSelectedMoveIndex(null);
        setHintArrow([]);
        setEngineError(null);
        if (quoteEvent) {
            setQuoteForEvent(quoteEvent);
        }
        if (nextGame.isGameOver()) {
            await finalizeGame(nextGame);
            return;
        }
        setEngineStatus(actor === "player" ? `${selectedBot.name} думає…` : "Ваш хід.");
    }, [finalizeGame, selectedBot.name, setQuoteForEvent, soundEnabled]);
    const handlePlayerMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
        if (!canPlayerMove) {
            return false;
        }
        const beforeEval = evaluatePositionCp(cloneGame(game));
        const nextGame = cloneGame(game);
        try {
            const move = nextGame.move({
                from,
                to,
                promotion: promotion || "q",
            });
            if (!move) {
                emitSound("illegal");
                return false;
            }
            const afterEval = evaluatePositionCp(nextGame);
            const swing = playerColor === "w" ? afterEval - beforeEval : beforeEval - afterEval;
            const quoteEvent = swing >= 90
                ? "playerStrongMove"
                : swing <= -75
                    ? "playerMistake"
                    : undefined;
            void applyMoveResult(nextGame, move, "player", quoteEvent);
            return true;
        }
        catch {
            emitSound("illegal");
            return false;
        }
    }, [applyMoveResult, canPlayerMove, emitSound, game, playerColor]);
    const handleUndo = useCallback(() => {
        const nextGame = cloneGame(game);
        const undoCount = Math.min(2, nextGame.history().length);
        if (undoCount === 0) {
            return;
        }
        engineMoveRequestRef.current += 1;
        evaluationRequestRef.current += 1;
        lastEngineResultRef.current = null;
        for (let index = 0; index < undoCount; index += 1) {
            nextGame.undo();
        }
        setGame(nextGame);
        setGameNonce((value) => value + 1);
        setGameOver(false);
        setIsEngineThinking(false);
        setSelectedMoveIndex(null);
        setHintArrow([]);
        setEngineError(null);
        setEngineStatus(nextGame.turn() === playerColor ? "Ваш хід." : `${selectedBot.name} обирає відповідь…`);
    }, [game, playerColor, selectedBot.name]);
    const handleResign = useCallback(async () => {
        if (!window.confirm("Здатися в цій партії?")) {
            return;
        }
        await finalizeGame(game, playerColor === "w" ? "0-1" : "1-0", `Ви здалися. ${selectedBot.name} переміг.`);
    }, [finalizeGame, game, playerColor, selectedBot.name]);
    const handleOfferDraw = useCallback(async () => {
        if (!hasStartedMatch || gameOver) {
            return;
        }
        if (Math.abs(evalScore) > 120) {
            toast.info(`${selectedBot.name} відхиляє пропозицію нічиєї.`);
            return;
        }
        await finalizeGame(game, "1/2-1/2", "Суперники погодилися на нічию.");
    }, [evalScore, finalizeGame, game, gameOver, hasStartedMatch, selectedBot.name]);
    const handlePauseToggle = useCallback(() => {
        if (!hasStartedMatch || gameOver) {
            return;
        }
        setIsPaused((value) => !value);
        setEngineStatus((current) => !isPaused
            ? "Партію призупинено."
            : currentTurn === playerColor
                ? "Ваш хід."
                : `${selectedBot.name} готує відповідь.`);
    }, [currentTurn, gameOver, hasStartedMatch, isPaused, playerColor, selectedBot.name]);
    const revealHint = useCallback(async () => {
        setHintArrow([]);
        if (bestMoveUci && isUciMove(bestMoveUci)) {
            setHintArrow([[bestMoveUci.slice(0, 2) as Square, bestMoveUci.slice(2, 4) as Square, "#22458f"]]);
            toast.info(bestMoveLabel ? `Hint: ${bestMoveLabel}` : "Підказка готова.");
            return;
        }
        try {
            const result = await analyzeFenWithStockfish(displayedFen, Math.max(8, resolveStockfishDepth(selectedBot, trainingRating)), undefined, STOCKFISH_HINT_TIMEOUT_MS);
            restoreStockfishMode();
            applyEngineResult(displayedFen, result);
            const san = result.bestmove ? uciToSan(displayedFen, result.bestmove) : null;
            if (result.bestmove && isUciMove(result.bestmove)) {
                setHintArrow([[result.bestmove.slice(0, 2) as Square, result.bestmove.slice(2, 4) as Square, "#22458f"]]);
            }
            toast.info(san ? `Hint: ${san}` : "Підказка недоступна.");
        }
        catch (error) {
            console.error(error);
            activateFallbackEngine(error);
            const fallback = applyFallbackAnalysis(displayedFen);
            if (fallback.bestMoveUci && isUciMove(fallback.bestMoveUci)) {
                setHintArrow([
                    [fallback.bestMoveUci.slice(0, 2) as Square, fallback.bestMoveUci.slice(2, 4) as Square, "#22458f"],
                ]);
            }
            toast.info(fallback.bestMoveLabel ? `Hint: ${fallback.bestMoveLabel}` : "Приблизна підказка локального алгоритму.");
        }
    }, [
        activateFallbackEngine,
        applyEngineResult,
        applyFallbackAnalysis,
        bestMoveLabel,
        bestMoveUci,
        displayedFen,
        restoreStockfishMode,
        selectedBot,
        trainingRating,
    ]);
    useEffect(() => {
        if (!hasStartedMatch || isPaused || gameOver || game.turn() === playerColor) {
            return;
        }
        const requestId = ++engineMoveRequestRef.current;
        const snapshotFen = game.fen();
        const snapshotPgn = game.pgn();
        const [delayMin, delayMax] = selectedBot.moveDelay;
        const depth = resolveStockfishDepth(selectedBot, trainingRating);
        setIsEngineThinking(true);
        setEngineDepth(0);
        setHintArrow([]);
        setEngineError((current) => (engineMode === "stockfish" ? null : current));
        setEngineStatus(`${selectedBot.name} обмірковує хід…`);
        const applyBotMove = async (stockfishMove: string | null) => {
            if (requestId !== engineMoveRequestRef.current) {
                return;
            }
            const beforeEval = evaluatePositionCp(cloneGameFromSnapshot(snapshotPgn, snapshotFen));
            const nextGame = cloneGameFromSnapshot(snapshotPgn, snapshotFen);
            const move = chooseBotMove(nextGame, stockfishMove, selectedBot, trainingRating);
            if (!move) {
                setIsEngineThinking(false);
                setEngineError("Комп’ютер не зміг зробити хід. Спробуйте ще раз.");
                setEngineStatus("Помилка рушія.");
                return;
            }
            const afterEval = evaluatePositionCp(nextGame);
            const quoteEvent = move.san.includes("+") ||
                move.san.includes("x") ||
                (playerColor === "w" ? afterEval < beforeEval - 110 : afterEval > beforeEval + 110)
                ? "botAttack"
                : undefined;
            const waitMs = randomBetween(delayMin, delayMax);
            window.setTimeout(() => {
                if (requestId !== engineMoveRequestRef.current) {
                    return;
                }
                void applyMoveResult(nextGame, move, "bot", quoteEvent);
                setIsEngineThinking(false);
            }, waitMs);
        };
        if (engineMode === "fallback") {
            void applyBotMove(null);
            return () => {
                engineMoveRequestRef.current += 1;
            };
        }
        analyzeFenWithStockfish(snapshotFen, depth, (line) => {
            if (requestId !== engineMoveRequestRef.current) {
                return;
            }
            const parsed = parseEngineInfoLine(line);
            if (parsed.depth != null) {
                setEngineDepth(parsed.depth);
            }
            if (parsed.scoreCp != null) {
                setEvalScore(parsed.scoreCp);
            }
        }, STOCKFISH_MOVE_TIMEOUT_MS)
            .then((result) => {
            if (requestId !== engineMoveRequestRef.current) {
                return;
            }
            restoreStockfishMode();
            applyEngineResult(snapshotFen, result);
            void applyBotMove(result.bestmove);
        })
            .catch((error) => {
            console.error(error);
            activateFallbackEngine(error);
            void applyBotMove(null);
        });
        return () => {
            engineMoveRequestRef.current += 1;
        };
    }, [
        applyMoveResult,
        applyEngineResult,
        game,
        gameOver,
        hasStartedMatch,
        engineMode,
        isPaused,
        playerColor,
        restoreStockfishMode,
        selectedBot,
        trainingRating,
        activateFallbackEngine,
    ]);
    useEffect(() => {
        if (!displayedFen) {
            return;
        }
        if (!reviewMode && hasStartedMatch && !gameOver && game.turn() !== playerColor) {
            return;
        }
        if (!reviewMode && isEngineThinking) {
            return;
        }
        const requestId = ++evaluationRequestRef.current;
        if (engineMode === "fallback") {
            applyFallbackAnalysis(displayedFen);
            return;
        }
        if (lastEngineResultRef.current?.fen === displayedFen) {
            applyEngineResult(displayedFen, lastEngineResultRef.current.result);
            return;
        }
        const timer = window.setTimeout(() => {
            analyzeFenWithStockfish(displayedFen, Math.max(5, resolveStockfishDepth(selectedBot, trainingRating) - 2), undefined, STOCKFISH_EVAL_TIMEOUT_MS)
                .then((result) => {
                if (requestId !== evaluationRequestRef.current) {
                    return;
                }
                restoreStockfishMode();
                applyEngineResult(displayedFen, result);
            })
                .catch((error) => {
                console.error(error);
                if (requestId !== evaluationRequestRef.current) {
                    return;
                }
                activateFallbackEngine(error);
                applyFallbackAnalysis(displayedFen);
            });
        }, 180);
        return () => window.clearTimeout(timer);
    }, [
        activateFallbackEngine,
        applyEngineResult,
        applyFallbackAnalysis,
        displayedFen,
        engineMode,
        game,
        gameOver,
        hasStartedMatch,
        isEngineThinking,
        playerColor,
        restoreStockfishMode,
        reviewMode,
        selectedBot,
        trainingRating,
    ]);
    const botPickerContent = (<div className="space-y-2">
      {BOTS.map((bot) => {
            const isSelected = bot.id === selectedBot.id;
            return (<button key={bot.id} type="button" disabled={hasStartedMatch && !gameOver} onClick={() => setSelectedBotId(bot.id)} className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${isSelected
                    ? "border-primary bg-primary"
                    : "border-border bg-secondary hover:bg-secondary"} disabled:cursor-not-allowed disabled:opacity-60`}>
            <BotAvatar bot={bot} size="sm"/>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-foreground">{bot.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                ≈{bot.rating} · {bot.style}
              </span>
            </span>
            {bot.flag ? <span className="text-sm">{bot.flag}</span> : null}
          </button>);
        })}
    </div>);
    const gamePanelContent = (<div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl bg-card shadow-sm lg:h-[calc(100dvh-112px)] lg:min-h-0">
      <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid h-auto w-full shrink-0 grid-cols-3 rounded-none border-b border-border bg-card p-0">
          <TabsTrigger value="moves" className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground">
            Ходи
          </TabsTrigger>
          <TabsTrigger value="engine" className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground">
            Аналіз
          </TabsTrigger>
          <TabsTrigger value="settings" className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-card data-[state=active]:text-foreground">
            Опції
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moves" className="m-0 flex min-h-0 flex-1 flex-col p-4">
          <div className={`mb-3 rounded-lg border px-3 py-2.5 text-sm font-semibold ${gameOver
            ? "border-primary bg-accent text-primary"
            : currentTurn === playerColor && !isPaused
                ? "border-primary bg-accent text-primary"
                : "border-border bg-card text-muted-foreground"}`}>
            {isPaused ? "Партію призупинено." : engineStatus}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <MoveList moves={reviewData.movesSan} currentMoveIndex={selectedMoveIndex ?? latestMoveIndex ?? undefined} onMoveClick={(index) => jumpToMove(index)} heightClassName={`h-[230px] lg:min-h-[150px] ${gameOver ? "lg:h-[calc(100dvh-410px)]" : "lg:h-[calc(100dvh-350px)]"}`}/>
          </div>

          {reviewMode && (<Button type="button" variant="outline" onClick={() => jumpToMove(null)} className="mt-3 border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              Повернутися до поточної позиції
            </Button>)}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionButton icon={<Undo2 className="h-4 w-4"/>} label="Повернути хід" onClick={handleUndo} disabled={reviewData.movesSan.length === 0 || isEngineThinking}/>
            <ActionButton icon={isPaused ? <PlayCircle className="h-4 w-4"/> : <PauseCircle className="h-4 w-4"/>} label={isPaused ? "Продовжити" : "Пауза"} onClick={handlePauseToggle} disabled={!hasStartedMatch || gameOver}/>
            <ActionButton icon={<Minus className="h-4 w-4"/>} label="Запропонувати нічию" onClick={handleOfferDraw} disabled={!hasStartedMatch || gameOver}/>
            <ActionButton icon={<Flag className="h-4 w-4"/>} label="Здатися" onClick={handleResign} disabled={!hasStartedMatch || gameOver}/>
          </div>

          {gameOver && (<Button type="button" onClick={startConfiguredGame} className="mt-3 h-12 w-full rounded-lg bg-primary text-base font-extrabold text-primary-foreground shadow-sm hover:bg-primary">
              <RefreshCw className="mr-2 h-4 w-4"/>
              Нова партія
            </Button>)}
        </TabsContent>

        <TabsContent value="engine" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Рушій" value={engineMode === "stockfish" ? "Stockfish" : "Локальний"}/>
            <StatCard label="Глибина" value={engineDepth > 0 ? String(engineDepth) : "—"}/>
            <StatCard label="Оцінка" value={formatEval(evalScore)}/>
            <StatCard label="Найкращий хід" value={bestMoveLabel || (isEngineThinking ? "Рахує…" : "—")}/>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Основний варіант</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {principalVariation.length > 0 ? principalVariation.join(" · ") : "Варіант з’явиться після першого ходу."}
            </p>
          </div>

          {engineError && (<div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700">
              {engineError}
            </div>)}

          {reviewData.movesSan.length > 0 && (<div className="mt-3 rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-foreground">Перегляд позиції</span>
                {selectedMoveIndex != null && (<button type="button" onClick={() => jumpToMove(null)} className="text-xs font-bold text-primary hover:text-primary">
                    До партії
                  </button>)}
              </div>
              <input type="range" min={1} max={reviewData.movesSan.length} value={selectedMoveIndex == null ? reviewData.movesSan.length : selectedMoveIndex + 1} onChange={(event) => {
                const value = Number(event.target.value);
                jumpToMove(value >= reviewData.movesSan.length ? null : value - 1);
            }} className="w-full accent-[#22458f]"/>
            </div>)}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={revealHint} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              <Lightbulb className="mr-2 h-4 w-4"/> Підказка
            </Button>
            <Button variant="outline" onClick={openAnalysis} disabled={!game.pgn().trim()} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              <Sparkles className="mr-2 h-4 w-4"/> Повний аналіз
            </Button>
            <Button variant="outline" onClick={shareGame} disabled={!game.pgn().trim()} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              <Share2 className="mr-2 h-4 w-4"/> Поділитися
            </Button>
            <Button variant="outline" onClick={exportPgn} disabled={!game.pgn().trim()} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
              <Download className="mr-2 h-4 w-4"/> Завантажити PGN
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label htmlFor="active-bot" className="mb-2 block text-sm font-bold text-muted-foreground">Суперник</label>
            <Select value={selectedBotId} onValueChange={setSelectedBotId} disabled={hasStartedMatch && !gameOver}>
              <SelectTrigger id="active-bot" className="h-11 border-border bg-secondary text-foreground focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOTS.map((bot) => (<SelectItem key={bot.id} value={bot.id}>{bot.name} · ≈{bot.rating}</SelectItem>))}
              </SelectContent>
            </Select>
            {hasStartedMatch && !gameOver && (<p className="mt-2 text-xs leading-5 text-muted-foreground">Суперника можна змінити після завершення партії.</p>)}
          </div>

          <OptionsCard lockMatchOptions={hasStartedMatch && !gameOver} selectedSide={selectedSide} setSelectedSide={setSelectedSide} selectedTimeControl={selectedTimeControl} setSelectedTimeControl={setSelectedTimeControl} flipBoard={flipBoard} setFlipBoard={setFlipBoard} showCoordinatesEnabled={showCoordinatesEnabled} setShowCoordinatesEnabled={setShowCoordinatesEnabled} highlightMoves={highlightMoves} setHighlightMoves={setHighlightMoves} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}/>

          <Button onClick={startConfiguredGame} className="mt-4 h-12 w-full bg-primary font-extrabold text-primary-foreground hover:bg-primary">
            Застосувати й почати заново
          </Button>
          <Button variant="ghost" onClick={() => navigate("/play")} className="mt-2 h-11 w-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            Повернутися до вибору режиму
          </Button>
        </TabsContent>
      </Tabs>
    </div>);
    return (<div className="min-h-full bg-card text-foreground lg:min-h-[calc(100dvh-76px)]">
      <div className="flex min-h-full flex-col lg:h-full">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-3 py-2.5 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            
            <div>
              <p className="text-sm font-bold text-foreground">Гра з ботом</p>
              <p className="text-xs text-muted-foreground">{selectedBot.name} · ≈{selectedBot.rating}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMobileBotsOpen(true)} className="rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground">
              Боти
            </button>
            <button type="button" onClick={() => setMobileOptionsOpen(true)} className="rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold text-foreground">
              Опції
            </button>
          </div>
        </div>

        <div className="grid w-full flex-1 gap-3 p-3 md:gap-4 md:p-4 lg:min-h-0 lg:grid-cols-[max-content_minmax(320px,370px)] lg:justify-start">
          <main className="min-w-0 max-w-full space-y-2.5 lg:sticky lg:top-4 lg:self-start" style={{ width: boardSize }}>
            <div className="rounded-lg bg-card px-2.5 py-2 shadow-xl shadow-black/20 sm:px-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <BotAvatar bot={selectedBot} size="md"/>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-foreground">{selectedBot.name}</p>
                      <span className="text-xs text-muted-foreground">(≈{selectedBot.rating})</span>
                      {selectedBot.flag ? (<span className="text-xs">{selectedBot.flag}</span>) : (<span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                          
                          Рушій
                        </span>)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedBot.character} · {selectedBot.style}
                    </p>
                  </div>
                </div>

                {timeControl.minutes ? (<div className="w-full sm:w-[210px]">
                    <ChessTimer key={`bot-clock-${gameNonce}-${selectedBot.id}-${selectedTimeControl}`} initialTimeMs={clockMs} isRunning={hasStartedMatch && !gameOver && !isPaused} isActive={currentTurn === opponentColor && !reviewMode} onTimeout={handleBotTimeout} color={opponentColor} playerName={selectedBot.name}/>
                  </div>) : (<div className="rounded-md bg-card px-3 py-2 text-sm font-bold text-muted-foreground">
                    Без годинника
                  </div>)}
              </div>
            </div>

            <div>
              <div className="overflow-hidden rounded-md bg-card shadow-sm">
                <div className="flex justify-center">
                  <ChessBoard initialFen={displayedFen} size={boardSize} onMove={handlePlayerMove} flipped={actualBoardFlipped} interactive={canPlayerMove} customArrows={hintArrow} allowArrows allowPremoves={false} showLegalMoves={highlightMoves} showLastMove showChecks lastMoveSquares={lastMoveSquares}/>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-card px-2.5 py-2 shadow-xl shadow-black/20 sm:px-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-foreground">
                    {playerInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{playerName}</p>
                    <p className="text-xs text-muted-foreground">{playerColor === "w" ? "Білі" : "Чорні"}</p>
                  </div>
                </div>

                {timeControl.minutes ? (<div className="w-full sm:w-[210px]">
                    <ChessTimer key={`player-clock-${gameNonce}-${selectedBot.id}-${selectedTimeControl}`} initialTimeMs={clockMs} isRunning={hasStartedMatch && !gameOver && !isPaused} isActive={currentTurn === playerColor && !reviewMode} onTimeout={handlePlayerTimeout} color={playerColor} playerName={playerName}/>
                  </div>) : (<div className="rounded-md bg-muted px-3 py-2 text-sm font-extrabold text-foreground">
                    {playerColor === "w" ? "Ви граєте білими" : "Ви граєте чорними"}
                  </div>)}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 lg:hidden">
              <ActionButton icon={<Undo2 className="h-4 w-4"/>} label="Назад" onClick={handleUndo} disabled={reviewData.movesSan.length === 0 || isEngineThinking}/>
              <ActionButton icon={<Flag className="h-4 w-4"/>} label="Здатися" onClick={handleResign} disabled={!hasStartedMatch || gameOver}/>
              <ActionButton icon={<Minus className="h-4 w-4"/>} label="Нічия" onClick={handleOfferDraw} disabled={!hasStartedMatch || gameOver}/>
              <ActionButton icon={isPaused ? <PlayCircle className="h-4 w-4"/> : <PauseCircle className="h-4 w-4"/>} label={isPaused ? "Далі" : "Пауза"} onClick={handlePauseToggle} disabled={!hasStartedMatch || gameOver}/>
            </div>

            <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground lg:hidden">
              {engineStatus}
            </div>

            

            <div className="pt-1 lg:hidden">{gamePanelContent}</div>
          </main>

          <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-112px)]">
            {gamePanelContent}
          </aside>
        </div>
      </div>

      <Sheet open={mobileBotsOpen} onOpenChange={setMobileBotsOpen}>
        <SheetContent side="right" className="w-[92vw] max-w-sm overflow-y-auto border-l-[#3a3733] bg-card p-4 text-foreground">
          <SheetHeader>
            <SheetTitle>Оберіть бота</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Під час активної партії суперника змінити не можна.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">{botPickerContent}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobileOptionsOpen} onOpenChange={setMobileOptionsOpen}>
        <SheetContent side="bottom" className="h-[75vh] border-t-[#3a3733] bg-card p-4 text-foreground">
          <SheetHeader>
            <SheetTitle>Налаштування</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Колір, час і вигляд шахівниці.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <OptionsCard lockMatchOptions={hasStartedMatch && !gameOver} selectedSide={selectedSide} setSelectedSide={setSelectedSide} selectedTimeControl={selectedTimeControl} setSelectedTimeControl={setSelectedTimeControl} flipBoard={flipBoard} setFlipBoard={setFlipBoard} showCoordinatesEnabled={showCoordinatesEnabled} setShowCoordinatesEnabled={setShowCoordinatesEnabled} highlightMoves={highlightMoves} setHighlightMoves={setHighlightMoves} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}/>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showPostGameModal} onOpenChange={setShowPostGameModal}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-2xl border-border bg-card p-0 text-foreground">
          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {formatResultLabel(playerColor, getGameResult(game))}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {engineStatus}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={startConfiguredGame} className="h-12 rounded-[16px] bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-primary">
                Грати ще раз
              </Button>
              <Button variant="outline" className="h-12 rounded-[16px] border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground" onClick={openAnalysis}>
                Аналіз
              </Button>
              <Button variant="outline" className="h-12 rounded-[16px] border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground" onClick={shareGame}>
                Поділитися
              </Button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Ходи" value={String(reviewData.movesSan.length)}/>
                  <StatCard label="Точність" value={`${playerAccuracy}%`}/>
                  <StatCard label="Бот" value={selectedBot.name}/>
                  <StatCard label="Час" value={timeControl.label}/>
                </div>

                <div className="rounded-[18px] border border-border bg-secondary p-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BrainCircuit className="h-4 w-4 text-primary"/> Графік оцінки
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysisChartData}>
                        <XAxis dataKey="move" tick={{ fontSize: 10, fill: "#9f988f" }}/>
                        <YAxis tick={{ fontSize: 10, fill: "#9f988f" }} domain={[-8, 8]}/>
                        <ReferenceLine y={0} stroke="#7b736b" strokeDasharray="4 4"/>
                        <Tooltip formatter={(value: number) => [
            `${value > 0 ? "+" : ""}${value.toFixed(1)}`,
            "Eval",
        ]}/>
                        <Line type="monotone" dataKey="eval" stroke="#22458f" strokeWidth={2.5} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {game.pgn().trim() && (<div className="rounded-[18px] border border-border bg-secondary p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Перегляд партії</p>
                        <p className="text-xs text-muted-foreground">
                          Перегляньте ходи або відкрийте повний аналіз.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={openAnalysis} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
                        Повний аналіз
                      </Button>
                    </div>
                    <PgnViewer pgn={game.pgn()}/>
                  </div>)}
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard label="Найкращі" value={String(playerBreakdown.best)}/>
                  <StatCard label="Неточності" value={String(playerBreakdown.inaccuracy)}/>
                  <StatCard label="Помилки" value={String(playerBreakdown.mistake)}/>
                  <StatCard label="Зівки" value={String(playerBreakdown.blunder)}/>
                </div>

                <div className="rounded-[18px] border border-border bg-secondary p-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Trophy className="h-4 w-4 text-primary"/> Критичні моменти
                  </div>
                  {reviewInsights.length > 0 ? (<div className="space-y-2">
                      {reviewInsights.slice(0, 5).map((item) => (<div key={`${item.ply}-${item.move}`} className="rounded-[16px] border border-border bg-secondary px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {Math.floor(item.ply / 2) + 1}. {item.move}
                            </span>
                            <span className="text-xs font-semibold text-amber-700">{reviewLabelUa(item.label)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Зміна оцінки: {Math.abs(item.swing / 100).toFixed(1)}
                          </p>
                          {item.suggestion && (<p className="mt-1 text-xs text-primary">Краще: {item.suggestion}</p>)}
                        </div>))}
                    </div>) : (<p className="text-sm text-muted-foreground">
                      Швидка перевірка не знайшла серйозних тактичних помилок.
                    </p>)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={copyFen} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
                    <Copy className="mr-2 h-4 w-4"/> Копіювати FEN
                  </Button>
                  <Button variant="outline" onClick={copyPgn} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
                    <Copy className="mr-2 h-4 w-4"/> Копіювати PGN
                  </Button>
                  <Button variant="outline" onClick={exportPgn} className="border-border bg-secondary text-foreground hover:bg-secondary hover:text-foreground">
                    <Download className="mr-2 h-4 w-4"/> Завантажити PGN
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
}
