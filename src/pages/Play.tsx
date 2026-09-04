import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Chess, type Move, type Square } from "chess.js";
import {
  Bot,
  BrainCircuit,
  ChevronDown,
  Copy,
  Download,
  Flag,
  Lightbulb,
  Minus,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChessBoard from "@/components/ChessBoard";
import ChessTimer from "@/components/ChessTimer";
import MoveList from "@/components/MoveList";
import PgnViewer from "@/components/PgnViewer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import analyzeFenWithStockfish, { type AnalyzeResult } from "@/lib/stockfish";
import { getAIMove, type AILevel } from "@/lib/chessAI";
import { playChessSound, type ChessSoundType } from "@/hooks/useChessSounds";
import { useBoardSettings, type BoardTheme } from "@/contexts/BoardSettingsContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BehaviorTier = "Beginner" | "Intermediate" | "Advanced" | "Master" | "Adaptive" | "Engine";
type BotQuoteEvent =
  | "intro"
  | "playerStrongMove"
  | "playerMistake"
  | "botAttack"
  | "botWin"
  | "playerWin"
  | "draw";

type BotProfile = {
  id: string;
  name: string;
  rating: number;
  character: string;
  style: string;
  description: string;
  shortLine: string;
  intro: string;
  flag: string | null;
  behaviorTier: BehaviorTier;
  aiLevel: AILevel;
  moveDelay: [number, number];
  avatarTheme: {
    base: string;
    accent: string;
    ink: string;
    glow: string;
  };
};

type TimeControlId = "unlimited" | "1m" | "3m" | "5m" | "10m" | "30m";
type SideChoice = "w" | "b" | "random";
type EngineMode = "stockfish" | "fallback";
type Arrow = [Square, Square, string?];

type ReviewInsight = {
  ply: number;
  move: string;
  label: "Blunder" | "Mistake" | "Inaccuracy";
  swing: number;
  suggestion: string | null;
};

type ReviewMove = {
  san: string;
  from: Square;
  to: Square;
};

const PLAY_BOARD_THEME: BoardTheme = {
  id: "play-bots",
  name: "Play Bots",
  light: "#EEEED2",
  dark: "#769656",
};

const STOCKFISH_MOVE_TIMEOUT_MS = 1400;
const STOCKFISH_EVAL_TIMEOUT_MS = 900;
const STOCKFISH_HINT_TIMEOUT_MS = 1200;

const TIME_CONTROLS: Array<{
  id: TimeControlId;
  label: string;
  description: string;
  minutes: number | null;
}> = [
  { id: "unlimited", label: "Без годинника", description: "Спокійна тренувальна партія", minutes: null },
  { id: "1m", label: "1 хвилина", description: "Bullet", minutes: 1 },
  { id: "3m", label: "3 хвилини", description: "Швидкий бліц", minutes: 3 },
  { id: "5m", label: "5 хвилин", description: "Класичний бліц", minutes: 5 },
  { id: "10m", label: "10 хвилин", description: "Рапід", minutes: 10 },
  { id: "30m", label: "30 хвилин", description: "Довга партія", minutes: 30 },
];

const PLAYER_SIDE_OPTIONS: Array<{ value: SideChoice; label: string }> = [
  { value: "w", label: "Білі" },
  { value: "b", label: "Чорні" },
  { value: "random", label: "Випадково" },
];

const SHARED_QUOTES: Record<Exclude<BotQuoteEvent, "intro">, string[]> = {
  playerStrongMove: [
    "О, це вже було розумно.",
    "Гарний удар по позиції.",
    "Ти не просто граєш — ти будуєш.",
    "Це був дуже чистий хід.",
    "Тепер мені цікавіше.",
  ],
  playerMistake: [
    "Тиша… і фігура вже під боєм.",
    "Ти відкрив двері, я зайду.",
    "Один необережний хід — і все змінилось.",
    "Моя улюблена мить: коли позиція тріщить.",
    "Тут пахне тактикою.",
  ],
  botAttack: [
    "Я не поспішаю. Я наближаюсь.",
    "Атака почалась ще кілька ходів тому.",
    "Тепер твій король слухає мене.",
    "На дошці стало гаряче.",
    "Я знайшов слабке місце.",
  ],
  botWin: [
    "Чисто. Холодно. Ефективно.",
    "Дякую за партію. Наступного разу буде складніше.",
    "Я не виграв випадково.",
    "Позиція все сказала сама.",
    "Ще одна партія — і ще один шанс.",
  ],
  playerWin: [
    "Ого. Це було красиво.",
    "Ти знайшов мій слабкий хід.",
    "Добре зіграно. Я це запам’ятаю.",
    "Сьогодні ти був точніший.",
    "Реванш?",
  ],
  draw: [
    "Рівновага теж буває красивою.",
    "Нічия, але напруга була справжня.",
    "Ми обидва втримали позицію.",
  ],
};

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const PIECE_ICONS: Record<"w" | "b", Record<string, string>> = {
  w: { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" },
  b: { p: "p", n: "n", b: "b", r: "r", q: "q", k: "k" },
};

const BOTS: BotProfile[] = [
  {
    id: "andriy",
    name: "Андрій",
    rating: 250,
    character: "новачок",
    style: "випадковий",
    description: "робить прості та іноді випадкові ходи",
    shortLine: "Я ще не чемпіон. Але сьогодні можу здивувати.",
    intro: "Я ще не чемпіон. Але сьогодні можу здивувати.",
    flag: "🇺🇦",
    behaviorTier: "Beginner",
    aiLevel: 1,
    moveDelay: [250, 520],
    avatarTheme: { base: "#5a4737", accent: "#f7b267", ink: "#efe6dc", glow: "#f59e0b" },
  },
  {
    id: "olena",
    name: "Олена",
    rating: 400,
    character: "спокійний",
    style: "захисний",
    description: "намагається захищати свої фігури",
    shortLine: "Спокій — це теж зброя.",
    intro: "Спокій — це теж зброя.",
    flag: "🇺🇦",
    behaviorTier: "Beginner",
    aiLevel: 1,
    moveDelay: [280, 560],
    avatarTheme: { base: "#523c57", accent: "#c084fc", ink: "#f5f3ff", glow: "#8b5cf6" },
  },
  {
    id: "ivan",
    name: "Іван",
    rating: 600,
    character: "обережний",
    style: "захисний",
    description: "уникає втрати фігур",
    shortLine: "Я не поспішаю. Я чекаю на твою помилку.",
    intro: "Я не поспішаю. Я чекаю на твою помилку.",
    flag: "🇺🇦",
    behaviorTier: "Beginner",
    aiLevel: 2,
    moveDelay: [300, 620],
    avatarTheme: { base: "#1f4d48", accent: "#2dd4bf", ink: "#e6fffb", glow: "#14b8a6" },
  },
  {
    id: "sofiia",
    name: "Софія",
    rating: 800,
    character: "терплячий",
    style: "позиційний",
    description: "намагається контролювати центр",
    shortLine: "Почнемо тихо, а далі подивимось, хто витримає.",
    intro: "Почнемо тихо, а далі подивимось, хто витримає.",
    flag: "🇺🇦",
    behaviorTier: "Intermediate",
    aiLevel: 2,
    moveDelay: [320, 660],
    avatarTheme: { base: "#284267", accent: "#7dd3fc", ink: "#eff6ff", glow: "#38bdf8" },
  },
  {
    id: "maksym",
    name: "Максим",
    rating: 1000,
    character: "логічний",
    style: "позиційний",
    description: "правильно розвиває фігури",
    shortLine: "На дошці немає випадковостей — тільки рішення.",
    intro: "На дошці немає випадковостей — тільки рішення.",
    flag: "🇺🇦",
    behaviorTier: "Intermediate",
    aiLevel: 3,
    moveDelay: [340, 700],
    avatarTheme: { base: "#454c27", accent: "#bef264", ink: "#f7fee7", glow: "#84cc16" },
  },
  {
    id: "dmytro",
    name: "Дмитро",
    rating: 1200,
    character: "агресивний",
    style: "атакуючий",
    description: "любить атакувати короля",
    shortLine: "Я відкриваю полювання.",
    intro: "Я відкриваю полювання.",
    flag: "🇺🇦",
    behaviorTier: "Intermediate",
    aiLevel: 4,
    moveDelay: [360, 740],
    avatarTheme: { base: "#5e3023", accent: "#fb7185", ink: "#fff1f2", glow: "#e11d48" },
  },
  {
    id: "mariia",
    name: "Марія",
    rating: 1400,
    character: "розумний",
    style: "позиційний",
    description: "добре розвиває позицію",
    shortLine: "Один хід — це ще не план. Подивимось далі.",
    intro: "Один хід — це ще не план. Подивимось далі.",
    flag: "🇺🇦",
    behaviorTier: "Advanced",
    aiLevel: 4,
    moveDelay: [380, 780],
    avatarTheme: { base: "#433165", accent: "#f9a8d4", ink: "#fdf2f8", glow: "#ec4899" },
  },
  {
    id: "pavlo",
    name: "Павло",
    rating: 1600,
    character: "тактичний",
    style: "атакуючий",
    description: "використовує тактичні удари",
    shortLine: "Мої комбінації не люблять поспіху.",
    intro: "Мої комбінації не люблять поспіху.",
    flag: "🇺🇦",
    behaviorTier: "Advanced",
    aiLevel: 5,
    moveDelay: [400, 820],
    avatarTheme: { base: "#274556", accent: "#60a5fa", ink: "#eff6ff", glow: "#2563eb" },
  },
  {
    id: "kateryna",
    name: "Катерина",
    rating: 1800,
    character: "швидкий",
    style: "активний",
    description: "грає активні позиції",
    shortLine: "Сьогодні я граю не фігурами — темпом.",
    intro: "Сьогодні я граю не фігурами — темпом.",
    flag: "🇺🇦",
    behaviorTier: "Advanced",
    aiLevel: 5,
    moveDelay: [420, 860],
    avatarTheme: { base: "#624137", accent: "#fdba74", ink: "#fff7ed", glow: "#f97316" },
  },
  {
    id: "viktor",
    name: "Віктор",
    rating: 2000,
    character: "стратегічний",
    style: "позиційний",
    description: "контролює слабкі поля",
    shortLine: "Центр — мій. Спробуй забрати.",
    intro: "Центр — мій. Спробуй забрати.",
    flag: "🇺🇦",
    behaviorTier: "Master",
    aiLevel: 6,
    moveDelay: [450, 900],
    avatarTheme: { base: "#304838", accent: "#4ade80", ink: "#f0fdf4", glow: "#22c55e" },
  },
  {
    id: "oleksandr",
    name: "Олександр",
    rating: 2200,
    character: "сильний",
    style: "атакуючий",
    description: "проводить складні атаки",
    shortLine: "Ти прийшов грати. Я — перевіряти.",
    intro: "Ти прийшов грати. Я — перевіряти.",
    flag: "🇺🇦",
    behaviorTier: "Master",
    aiLevel: 6,
    moveDelay: [480, 960],
    avatarTheme: { base: "#45355a", accent: "#a78bfa", ink: "#f5f3ff", glow: "#8b5cf6" },
  },
  {
    id: "taras",
    name: "Тарас",
    rating: 2400,
    character: "холоднокровний",
    style: "універсальний",
    description: "грає дуже стабільно",
    shortLine: "Тиха позиція — найгучніша пастка.",
    intro: "Тиха позиція — найгучніша пастка.",
    flag: "🇺🇦",
    behaviorTier: "Master",
    aiLevel: 7,
    moveDelay: [520, 1020],
    avatarTheme: { base: "#26374e", accent: "#93c5fd", ink: "#eff6ff", glow: "#3b82f6" },
  },
  {
    id: "bohdan",
    name: "Богдан",
    rating: 2600,
    character: "дуже сильний",
    style: "стратегічний",
    description: "майже не робить помилок",
    shortLine: "Помилка в дебюті — це вже історія.",
    intro: "Помилка в дебюті — це вже історія.",
    flag: "🇺🇦",
    behaviorTier: "Adaptive",
    aiLevel: 7,
    moveDelay: [540, 1060],
    avatarTheme: { base: "#35412b", accent: "#86efac", ink: "#f0fdf4", glow: "#16a34a" },
  },
  {
    id: "illia",
    name: "Гросмейстер Ілля",
    rating: 2800,
    character: "елітний",
    style: "універсальний",
    description: "грає як гросмейстер",
    shortLine: "Ласкаво просимо в партію без зайвих шансів.",
    intro: "Ласкаво просимо в партію без зайвих шансів.",
    flag: "🇺🇦",
    behaviorTier: "Master",
    aiLevel: 8,
    moveDelay: [560, 1100],
    avatarTheme: { base: "#4a2f3b", accent: "#f9a8d4", ink: "#fdf2f8", glow: "#db2777" },
  },
  {
    id: "engine",
    name: "Шаховий Двигун",
    rating: 3000,
    character: "комп’ютерний інтелект",
    style: "ідеальний",
    description: "максимально сильна гра",
    shortLine: "Аналіз завершено. Тепер ходи ти.",
    intro: "Аналіз завершено. Тепер ходи ти.",
    flag: null,
    behaviorTier: "Engine",
    aiLevel: 8,
    moveDelay: [620, 1180],
    avatarTheme: { base: "#16222d", accent: "#67e8f9", ink: "#ecfeff", glow: "#06b6d4" },
  },
];

export default function Play() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const {
    theme,
    setTheme,
    pieceStyle,
    setPieceStyle,
    showCoordinates: savedCoordinates,
    setShowCoordinates,
  } = useBoardSettings();
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
  const [botQuote, setBotQuote] = useState(BOTS[0].intro);
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
  const lastEngineResultRef = useRef<{ fen: string; result: AnalyzeResult } | null>(null);
  const hasAutoStartedRef = useRef(false);

  const selectedBot = useMemo(
    () => BOTS.find((bot) => bot.id === selectedBotId) || BOTS[0],
    [selectedBotId],
  );
  const timeControl = useMemo(
    () => TIME_CONTROLS.find((control) => control.id === selectedTimeControl) || TIME_CONTROLS[0],
    [selectedTimeControl],
  );
  const botAiLevel = useMemo(
    () => resolveBotAiLevel(selectedBot, trainingRating),
    [selectedBot, trainingRating],
  );
  const playerName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Guest";
  const playerInitial = playerName.charAt(0).toUpperCase() || "G";
  const actualBoardFlipped = flipBoard ? playerColor === "w" : playerColor === "b";
  const clockMs = timeControl.minutes ? timeControl.minutes * 60 * 1000 : 0;
  const reviewData = useMemo(() => buildReviewData(game), [game]);
  const latestMoveIndex = reviewData.movesSan.length > 0 ? reviewData.movesSan.length - 1 : null;
  const reviewMode = selectedMoveIndex != null && selectedMoveIndex !== latestMoveIndex;
  const displayedFen =
    selectedMoveIndex != null
      ? reviewData.positions[selectedMoveIndex + 1] || game.fen()
      : game.fen();
  const displayedMove =
    selectedMoveIndex != null
      ? reviewData.movesVerbose[selectedMoveIndex]
      : reviewData.movesVerbose[reviewData.movesVerbose.length - 1];
  const lastMoveSquares = displayedMove ? [displayedMove.from, displayedMove.to] : [];
  const currentTurn = game.turn();
  const opponentColor = playerColor === "w" ? "b" : "w";
  const canPlayerMove =
    hasStartedMatch &&
    !gameOver &&
    !isPaused &&
    !isEngineThinking &&
    !reviewMode &&
    currentTurn === playerColor;
  const reviewInsights = useMemo(
    () =>
      buildReviewInsights(
        reviewData.positions,
        reviewData.movesSan,
        playerColor,
        botAiLevel,
      ),
    [botAiLevel, playerColor, reviewData.movesSan, reviewData.positions],
  );
  const playerAccuracy = useMemo(
    () => calculateAccuracy(reviewData.positions, playerColor),
    [playerColor, reviewData.positions],
  );
  const playerBreakdown = useMemo(
    () => calculateAccuracyBreakdown(reviewData.positions, playerColor),
    [playerColor, reviewData.positions],
  );
  const analysisChartData = useMemo(
    () =>
      reviewData.positions.map((fen, index) => ({
        move: index,
        eval: evaluatePositionCp(new Chess(fen)) / 100,
      })),
    [reviewData.positions],
  );
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
        setBoardSize(Math.max(292, width - 24));
        return;
      }

      if (width < 1024) {
        const widthBound = width - 48;
        const heightBound = Math.max(340, height - 190);
        setBoardSize(Math.max(340, Math.min(620, widthBound, heightBound)));
        return;
      }

      const widthBound = width - 590;
      const heightBound = height - 170;
      setBoardSize(Math.max(420, Math.min(680, widthBound, heightBound)));
    };

    syncBoardSize();
    window.addEventListener("resize", syncBoardSize);
    return () => window.removeEventListener("resize", syncBoardSize);
  }, []);

  useEffect(() => {
    setBotQuote(selectedBot.intro);
    quoteEventRef.current = "intro";
  }, [selectedBot]);

  const setQuoteForEvent = useCallback(
    (event: BotQuoteEvent) => {
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
    },
    [selectedBot],
  );

  const activateFallbackEngine = useCallback((error?: unknown) => {
    const fallbackMessage = "Stockfish недоступний. Тимчасово використовується локальний рушій.";
    const message =
      error instanceof Error && error.message.trim().length > 0
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

  const applyEngineResult = useCallback(
    (fen: string, result: AnalyzeResult) => {
      lastEngineResultRef.current = { fen, result };

      if (result.scoreMate != null) {
        setEvalScore(result.scoreMate > 0 ? 10000 : -10000);
      } else if (result.scoreCp != null) {
        setEvalScore(result.scoreCp);
      }

      const san = result.bestmove ? uciToSan(fen, result.bestmove) : null;
      setBestMoveLabel(san);
      setBestMoveUci(result.bestmove);
      setPrincipalVariation(uciPvToSan(fen, result.pv).slice(0, 5));
    },
    [],
  );

  const applyFallbackAnalysis = useCallback(
    (fen: string) => {
      const fallback = getLocalAnalysisSnapshot(fen, botAiLevel);
      setEvalScore(fallback.evalScore);
      setBestMoveLabel(fallback.bestMoveLabel);
      setBestMoveUci(fallback.bestMoveUci);
      setPrincipalVariation(fallback.principalVariation);
      return fallback;
    },
    [botAiLevel],
  );

  const emitSound = useCallback(
    (type: ChessSoundType) => {
      if (soundEnabled) {
        playChessSound(type);
      }
    },
    [soundEnabled],
  );

  const jumpToMove = useCallback((index: number | null) => {
    setSelectedMoveIndex(index);
  }, []);

  const startConfiguredGame = useCallback(() => {
    const actualColor =
      selectedSide === "random"
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
    } catch {
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
    } catch {
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
    } catch {
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

  const finalizeGame = useCallback(
    async (finishedGame: Chess, overrideResult?: string, overrideStatus?: string) => {
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
      } else if (result === "1/2-1/2") {
        setEngineStatus("Нічия.");
      } else {
        const playerWon =
          (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
        setEngineStatus(playerWon ? "Ви перемогли." : "Ви програли.");
      }

      if (result === "1/2-1/2") {
        emitSound("draw");
        setQuoteForEvent("draw");
      } else {
        const playerWon =
          (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
        emitSound(finishedGame.isCheckmate() ? "checkmate" : "gameEnd");
        setQuoteForEvent(playerWon ? "playerWin" : "botWin");
        const delta = calculateRatingDelta(trainingRating, selectedBot.rating, result, playerColor);
        const nextRating = Math.max(200, trainingRating + delta);
        setTrainingRating(nextRating);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("cmua-ai-rating", String(nextRating));
        }
      }
    },
    [emitSound, playerColor, selectedBot.rating, setQuoteForEvent, trainingRating],
  );

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

  const applyMoveResult = useCallback(
    async (
      nextGame: Chess,
      move: Move,
      actor: "player" | "bot",
      quoteEvent?: Exclude<BotQuoteEvent, "intro" | "botWin" | "playerWin" | "draw">,
    ) => {
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
    },
    [finalizeGame, selectedBot.name, setQuoteForEvent, soundEnabled],
  );

  const handlePlayerMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
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
        const quoteEvent =
          swing >= 90
            ? "playerStrongMove"
            : swing <= -75
              ? "playerMistake"
              : undefined;

        void applyMoveResult(nextGame, move, "player", quoteEvent);
        return true;
      } catch {
        emitSound("illegal");
        return false;
      }
    },
    [applyMoveResult, canPlayerMove, emitSound, game, playerColor],
  );

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
    setEngineStatus((current) =>
      !isPaused
        ? "Партію призупинено."
        : currentTurn === playerColor
          ? "Ваш хід."
          : `${selectedBot.name} готує відповідь.`,
    );
  }, [currentTurn, gameOver, hasStartedMatch, isPaused, playerColor, selectedBot.name]);

  const revealHint = useCallback(async () => {
    setHintArrow([]);

    if (bestMoveUci && isUciMove(bestMoveUci)) {
      setHintArrow([[bestMoveUci.slice(0, 2) as Square, bestMoveUci.slice(2, 4) as Square, "#81B64C"]]);
      toast.info(bestMoveLabel ? `Hint: ${bestMoveLabel}` : "Hint is ready.");
      return;
    }

    try {
      const result = await analyzeFenWithStockfish(
        displayedFen,
        Math.max(8, resolveStockfishDepth(selectedBot, trainingRating)),
        undefined,
        STOCKFISH_HINT_TIMEOUT_MS,
      );
      restoreStockfishMode();
      applyEngineResult(displayedFen, result);
      const san = result.bestmove ? uciToSan(displayedFen, result.bestmove) : null;
      if (result.bestmove && isUciMove(result.bestmove)) {
        setHintArrow([[result.bestmove.slice(0, 2) as Square, result.bestmove.slice(2, 4) as Square, "#81B64C"]]);
      }
      toast.info(san ? `Hint: ${san}` : "No hint available.");
    } catch (error) {
      console.error(error);
      activateFallbackEngine(error);
      const fallback = applyFallbackAnalysis(displayedFen);
      if (fallback.bestMoveUci && isUciMove(fallback.bestMoveUci)) {
        setHintArrow([
          [fallback.bestMoveUci.slice(0, 2) as Square, fallback.bestMoveUci.slice(2, 4) as Square, "#81B64C"],
        ]);
      }
      toast.info(fallback.bestMoveLabel ? `Hint: ${fallback.bestMoveLabel}` : "Using local fallback hint.");
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
    setEngineStatus(`${selectedBot.name} is thinking...`);

    const applyBotMove = async (stockfishMove: string | null) => {
      if (requestId !== engineMoveRequestRef.current) {
        return;
      }

      const beforeEval = evaluatePositionCp(cloneGameFromSnapshot(snapshotPgn, snapshotFen));
      const nextGame = cloneGameFromSnapshot(snapshotPgn, snapshotFen);
      const move = chooseBotMove(nextGame, stockfishMove, selectedBot, trainingRating);

      if (!move) {
        setIsEngineThinking(false);
        setEngineError("The bot could not produce a legal move.");
        setEngineStatus("Engine error.");
        return;
      }

      const afterEval = evaluatePositionCp(nextGame);
      const quoteEvent =
        move.san.includes("+") ||
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

    analyzeFenWithStockfish(
      snapshotFen,
      depth,
      (line) => {
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
      },
      STOCKFISH_MOVE_TIMEOUT_MS,
    )
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
      analyzeFenWithStockfish(
        displayedFen,
        Math.max(5, resolveStockfishDepth(selectedBot, trainingRating) - 2),
        undefined,
        STOCKFISH_EVAL_TIMEOUT_MS,
      )
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

  const botPickerContent = (
    <div className="space-y-2">
      {BOTS.map((bot) => {
        const isSelected = bot.id === selectedBot.id;
        return (
          <button
            key={bot.id}
            type="button"
            disabled={hasStartedMatch && !gameOver}
            onClick={() => setSelectedBotId(bot.id)}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
              isSelected
                ? "border-[#81b64c] bg-[#4b5f35]"
                : "border-black/25 bg-[#3a3835] hover:bg-[#45423e]"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <BotAvatar bot={bot} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{bot.name}</span>
              <span className="block truncate text-xs text-[#aaa7a2]">
                {bot.rating} · {bot.style}
              </span>
            </span>
            {bot.flag ? <span className="text-sm">{bot.flag}</span> : null}
          </button>
        );
      })}
    </div>
  );

  const gamePanelContent = (
    <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl bg-[#312e2b] shadow-[0_16px_40px_rgba(0,0,0,0.32)] lg:h-[calc(100dvh-32px)] lg:min-h-0">
      <div className="border-b border-black/25 bg-[#2b2926] p-4">
        <div className="flex items-center gap-3">
          <BotAvatar bot={selectedBot} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-white">{selectedBot.name}</h2>
              <span className="text-sm font-semibold text-[#bdb9b3]">{selectedBot.rating}</span>
              {selectedBot.flag ? <span className="text-sm">{selectedBot.flag}</span> : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-[#aaa7a2]">{selectedBot.description}</p>
          </div>
          <span className="rounded-md bg-[#242321] px-2.5 py-1.5 text-xs font-bold text-[#c8c5bf]">
            {timeControl.label}
          </span>
        </div>
        <div className="mt-3 rounded-lg bg-[#f1f1ef] px-3.5 py-3 text-sm leading-5 text-[#312e2b] shadow-sm">
          {botQuote}
        </div>
      </div>

      <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="grid h-auto w-full shrink-0 grid-cols-3 rounded-none border-b border-black/25 bg-[#262421] p-0">
          <TabsTrigger
            value="moves"
            className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-[#aaa7a2] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#312e2b] data-[state=active]:text-white"
          >
            Ходи
          </TabsTrigger>
          <TabsTrigger
            value="engine"
            className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-[#aaa7a2] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#312e2b] data-[state=active]:text-white"
          >
            Аналіз
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="h-12 rounded-none border-b-2 border-transparent text-sm font-bold text-[#aaa7a2] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#312e2b] data-[state=active]:text-white"
          >
            Опції
          </TabsTrigger>
        </TabsList>

        <TabsContent value="moves" className="m-0 flex min-h-0 flex-1 flex-col p-4">
          <div className={`mb-3 rounded-lg border px-3 py-2.5 text-sm font-semibold ${
            gameOver
              ? "border-[#81b64c]/35 bg-[#81b64c]/10 text-[#dff0cc]"
              : currentTurn === playerColor && !isPaused
                ? "border-[#81b64c]/35 bg-[#81b64c]/10 text-[#dff0cc]"
                : "border-white/10 bg-[#262421] text-[#d0ccc6]"
          }`}>
            {isPaused ? "Партію призупинено." : engineStatus}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <MoveList
              moves={reviewData.movesSan}
              currentMoveIndex={selectedMoveIndex ?? latestMoveIndex ?? undefined}
              onMoveClick={(index) => jumpToMove(index)}
              heightClassName="h-[230px] lg:h-[calc(100dvh-510px)] lg:min-h-[150px]"
            />
          </div>

          {reviewMode && (
            <Button
              type="button"
              variant="outline"
              onClick={() => jumpToMove(null)}
              className="mt-3 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Повернутися до поточної позиції
            </Button>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <ActionButton
              icon={<Undo2 className="h-4 w-4" />}
              label="Повернути хід"
              onClick={handleUndo}
              disabled={reviewData.movesSan.length === 0 || isEngineThinking}
            />
            <ActionButton
              icon={isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
              label={isPaused ? "Продовжити" : "Пауза"}
              onClick={handlePauseToggle}
              disabled={!hasStartedMatch || gameOver}
            />
            <ActionButton
              icon={<Minus className="h-4 w-4" />}
              label="Запропонувати нічию"
              onClick={handleOfferDraw}
              disabled={!hasStartedMatch || gameOver}
            />
            <ActionButton
              icon={<Flag className="h-4 w-4" />}
              label="Здатися"
              onClick={handleResign}
              disabled={!hasStartedMatch || gameOver}
            />
          </div>

          <Button
            type="button"
            onClick={startConfiguredGame}
            className="mt-3 h-12 w-full rounded-lg bg-[#81b64c] text-base font-extrabold text-white shadow-[0_3px_0_#5c8f2d] hover:bg-[#8fc45a]"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Нова партія
          </Button>
        </TabsContent>

        <TabsContent value="engine" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Рушій" value={engineMode === "stockfish" ? "Stockfish" : "Локальний"} />
            <StatCard label="Глибина" value={engineDepth > 0 ? String(engineDepth) : "—"} />
            <StatCard label="Оцінка" value={formatEval(evalScore)} />
            <StatCard label="Найкращий хід" value={bestMoveLabel || (isEngineThinking ? "Рахує…" : "—")} />
          </div>

          <div className="mt-3 rounded-lg border border-white/8 bg-[#262421] p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#99958f]">Основний варіант</p>
            <p className="mt-2 text-sm leading-6 text-white">
              {principalVariation.length > 0 ? principalVariation.join(" · ") : "Варіант з’явиться після першого ходу."}
            </p>
          </div>

          {engineError && (
            <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100">
              {engineError}
            </div>
          )}

          {reviewData.movesSan.length > 0 && (
            <div className="mt-3 rounded-lg border border-white/8 bg-[#262421] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-white">Перегляд позиції</span>
                {selectedMoveIndex != null && (
                  <button type="button" onClick={() => jumpToMove(null)} className="text-xs font-bold text-[#a8d66d] hover:text-[#b9e57e]">
                    До партії
                  </button>
                )}
              </div>
              <input
                type="range"
                min={1}
                max={reviewData.movesSan.length}
                value={selectedMoveIndex == null ? reviewData.movesSan.length : selectedMoveIndex + 1}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  jumpToMove(value >= reviewData.movesSan.length ? null : value - 1);
                }}
                className="w-full accent-[#81b64c]"
              />
            </div>
          )}

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={revealHint} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Lightbulb className="mr-2 h-4 w-4" /> Підказка
            </Button>
            <Button variant="outline" onClick={openAnalysis} disabled={!game.pgn().trim()} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Sparkles className="mr-2 h-4 w-4" /> Повний аналіз
            </Button>
            <Button variant="outline" onClick={shareGame} disabled={!game.pgn().trim()} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Share2 className="mr-2 h-4 w-4" /> Поділитися
            </Button>
            <Button variant="outline" onClick={exportPgn} disabled={!game.pgn().trim()} className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Download className="mr-2 h-4 w-4" /> Завантажити PGN
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="m-0 min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <label htmlFor="active-bot" className="mb-2 block text-sm font-bold text-[#d8d5cf]">Суперник</label>
            <Select value={selectedBotId} onValueChange={setSelectedBotId} disabled={hasStartedMatch && !gameOver}>
              <SelectTrigger id="active-bot" className="h-11 border-black/25 bg-[#3a3835] text-white focus:ring-[#81b64c]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOTS.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>{bot.name} · {bot.rating}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasStartedMatch && !gameOver && (
              <p className="mt-2 text-xs leading-5 text-[#99958f]">Суперника можна змінити після завершення партії.</p>
            )}
          </div>

          <OptionsCard
            lockMatchOptions={hasStartedMatch && !gameOver}
            selectedSide={selectedSide}
            setSelectedSide={setSelectedSide}
            selectedTimeControl={selectedTimeControl}
            setSelectedTimeControl={setSelectedTimeControl}
            flipBoard={flipBoard}
            setFlipBoard={setFlipBoard}
            showCoordinatesEnabled={showCoordinatesEnabled}
            setShowCoordinatesEnabled={setShowCoordinatesEnabled}
            highlightMoves={highlightMoves}
            setHighlightMoves={setHighlightMoves}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />

          <Button onClick={startConfiguredGame} className="mt-4 h-12 w-full bg-[#81b64c] font-extrabold text-white hover:bg-[#8fc45a]">
            Застосувати й почати заново
          </Button>
          <Button variant="ghost" onClick={() => navigate("/play")} className="mt-2 h-11 w-full text-[#c9c5bf] hover:bg-white/5 hover:text-white">
            Повернутися до вибору режиму
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="min-h-full bg-[#242321] text-white lg:h-[100dvh]">
      <div className="flex min-h-full flex-col lg:h-full">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/25 bg-[#242321]/95 px-3 py-2.5 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">Гра з ботом</p>
              <p className="text-xs text-[#aaa7a2]">{selectedBot.name} · {selectedBot.rating}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileBotsOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
            >
              Боти
            </button>
            <button
              type="button"
              onClick={() => setMobileOptionsOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
            >
              Опції
            </button>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1160px] flex-1 gap-3 p-3 md:gap-4 md:p-4 lg:min-h-0 lg:grid-cols-[minmax(0,700px)_minmax(320px,370px)] lg:justify-center">
          <main className="min-w-0 space-y-2.5 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-lg bg-[#312e2b] px-2.5 py-2 shadow-xl shadow-black/20 sm:px-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <BotAvatar bot={selectedBot} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">{selectedBot.name}</p>
                      <span className="text-xs text-[#d1cbc4]">({selectedBot.rating})</span>
                      {selectedBot.flag ? (
                        <span className="text-xs">{selectedBot.flag}</span>
                      ) : (
                        <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
                          Engine
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#aaa7a2]">
                      {selectedBot.character} · {selectedBot.style}
                    </p>
                  </div>
                </div>

                {timeControl.minutes ? (
                  <div className="w-full sm:w-[210px]">
                    <ChessTimer
                      key={`bot-clock-${gameNonce}-${selectedBot.id}-${selectedTimeControl}`}
                      initialTimeMs={clockMs}
                      isRunning={hasStartedMatch && !gameOver && !isPaused}
                      isActive={currentTurn === opponentColor && !reviewMode}
                      onTimeout={handleBotTimeout}
                      color={opponentColor}
                      playerName={selectedBot.name}
                    />
                  </div>
                ) : (
                  <div className="rounded-md bg-[#242321] px-3 py-2 text-sm font-bold text-[#d2cec8]">
                    Без годинника
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="overflow-hidden rounded-md bg-[#181715] shadow-[0_18px_48px_rgba(0,0,0,0.38)]">
                <div className="flex justify-center">
                  <ChessBoard
                    initialFen={displayedFen}
                    size={boardSize}
                    onMove={handlePlayerMove}
                    flipped={actualBoardFlipped}
                    interactive={canPlayerMove}
                    customArrows={hintArrow}
                    allowArrows
                    allowPremoves={false}
                    showLegalMoves={highlightMoves}
                    showLastMove
                    showChecks
                    lastMoveSquares={lastMoveSquares}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-[#312e2b] px-2.5 py-2 shadow-xl shadow-black/20 sm:px-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white">
                    {playerInitial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{playerName}</p>
                    <p className="text-xs text-[#aaa7a2]">{playerColor === "w" ? "Білі" : "Чорні"}</p>
                  </div>
                </div>

                {timeControl.minutes ? (
                  <div className="w-full sm:w-[210px]">
                    <ChessTimer
                      key={`player-clock-${gameNonce}-${selectedBot.id}-${selectedTimeControl}`}
                      initialTimeMs={clockMs}
                      isRunning={hasStartedMatch && !gameOver && !isPaused}
                      isActive={currentTurn === playerColor && !reviewMode}
                      onTimeout={handlePlayerTimeout}
                      color={playerColor}
                      playerName={playerName}
                    />
                  </div>
                ) : (
                  <div className="rounded-md bg-[#f1f1ef] px-3 py-2 text-sm font-extrabold text-[#312e2b]">
                    {playerColor === "w" ? "Ви граєте білими" : "Ви граєте чорними"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 lg:hidden">
              <ActionButton
                icon={<Undo2 className="h-4 w-4" />}
                label="Назад"
                onClick={handleUndo}
                disabled={reviewData.movesSan.length === 0 || isEngineThinking}
              />
              <ActionButton
                icon={<Flag className="h-4 w-4" />}
                label="Здатися"
                onClick={handleResign}
                disabled={!hasStartedMatch || gameOver}
              />
              <ActionButton
                icon={<Minus className="h-4 w-4" />}
                label="Нічия"
                onClick={handleOfferDraw}
                disabled={!hasStartedMatch || gameOver}
              />
              <ActionButton
                icon={isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                label={isPaused ? "Далі" : "Пауза"}
                onClick={handlePauseToggle}
                disabled={!hasStartedMatch || gameOver}
              />
            </div>

            <div className="rounded-lg border border-white/8 bg-[#2b2926] px-3 py-2.5 text-sm text-[#d3d0ca] lg:hidden">
              {engineStatus}
            </div>

            <div className="hidden">
              <button
                type="button"
                onClick={() => setAnalysisToolsOpen((value) => !value)}
                className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.05]"
              >
                <div>
                  <p className="text-sm font-semibold text-white">Analysis tools</p>
                  <p className="mt-1 text-xs text-[#9f988f]">
                    Move history, evaluation, engine lines, replay, PGN and FEN.
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[#c8c1ba] transition ${analysisToolsOpen ? "rotate-180" : ""}`}
                />
              </button>

              {analysisToolsOpen ? (
                <div className="mt-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyFen}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="mr-2 h-4 w-4" /> FEN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPgn}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <Copy className="mr-2 h-4 w-4" /> PGN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportPgn}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>

                  <Tabs value={analysisTab} onValueChange={setAnalysisTab}>
                    <TabsList className="grid h-auto w-full grid-cols-3 rounded-[14px] bg-white/5 p-1">
                      <TabsTrigger value="moves">Move History</TabsTrigger>
                      <TabsTrigger value="engine">Engine Analysis</TabsTrigger>
                      <TabsTrigger value="replay">Game Replay</TabsTrigger>
                    </TabsList>

                    <TabsContent value="moves" className="mt-4">
                      <MoveList
                        moves={reviewData.movesSan}
                        currentMoveIndex={selectedMoveIndex ?? latestMoveIndex ?? undefined}
                        onMoveClick={(index) => jumpToMove(index)}
                      />
                    </TabsContent>

                    <TabsContent value="engine" className="mt-4 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Status" value={engineStatus} />
                        <StatCard
                          label="Engine"
                          value={engineMode === "stockfish" ? "Stockfish" : "Local fallback"}
                        />
                        <StatCard label="Depth" value={engineDepth > 0 ? String(engineDepth) : "—"} />
                        <StatCard label="Eval" value={formatEval(evalScore)} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <StatCard
                          label="Best move"
                          value={bestMoveLabel || (isEngineThinking ? "Analyzing..." : "—")}
                        />
                        <StatCard
                          label="PV"
                          value={principalVariation.length > 0 ? principalVariation.join(" · ") : "—"}
                        />
                      </div>
                      {engineError && (
                        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                          {engineError}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={revealHint}
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        >
                          <Lightbulb className="mr-2 h-4 w-4" /> Hint
                        </Button>
                        <Button
                          variant="outline"
                          onClick={shareGame}
                          disabled={!game.pgn().trim()}
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        >
                          <Share2 className="mr-2 h-4 w-4" /> Share Game
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="replay" className="mt-4 space-y-4">
                      {reviewData.movesSan.length > 0 ? (
                        <>
                          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">Replay slider</p>
                                <p className="text-xs text-[#9f988f]">
                                  Jump to any move and inspect the board state.
                                </p>
                              </div>
                              {selectedMoveIndex != null && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => jumpToMove(null)}
                                  className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                                >
                                  Back to live
                                </Button>
                              )}
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={reviewData.movesSan.length}
                              value={
                                selectedMoveIndex == null
                                  ? reviewData.movesSan.length
                                  : selectedMoveIndex + 1
                              }
                              onChange={(event) => {
                                const value = Number(event.target.value);
                                jumpToMove(value >= reviewData.movesSan.length ? null : value - 1);
                              }}
                              className="w-full accent-[#7fa650]"
                            />
                          </div>
                          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
                            <PgnViewer pgn={game.pgn()} />
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-[#9f988f]">
                          Start a game to unlock replay tools.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#b9b2aa]">
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                    {reviewData.movesSan.length} moves
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                    Eval {formatEval(evalScore)}
                  </span>
                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5">
                    {engineMode === "stockfish" ? "Stockfish live" : "Local fallback"}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-1 lg:hidden">{gamePanelContent}</div>
          </main>

          <aside className="hidden lg:sticky lg:top-4 lg:block lg:h-[calc(100dvh-32px)]">
            {gamePanelContent}
          </aside>
        </div>
      </div>

      <Sheet open={mobileBotsOpen} onOpenChange={setMobileBotsOpen}>
        <SheetContent side="right" className="w-[92vw] max-w-sm overflow-y-auto border-l-[#3a3733] bg-[#262421] p-4 text-white">
          <SheetHeader>
            <SheetTitle>Оберіть бота</SheetTitle>
            <SheetDescription className="text-[#9f988f]">
              Під час активної партії суперника змінити не можна.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">{botPickerContent}</div>
        </SheetContent>
      </Sheet>

      <Sheet open={mobileOptionsOpen} onOpenChange={setMobileOptionsOpen}>
        <SheetContent side="bottom" className="h-[75vh] border-t-[#3a3733] bg-[#262421] p-4 text-white">
          <SheetHeader>
            <SheetTitle>Налаштування</SheetTitle>
            <SheetDescription className="text-[#9f988f]">
              Колір, час і вигляд шахівниці.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <OptionsCard
              lockMatchOptions={hasStartedMatch && !gameOver}
              selectedSide={selectedSide}
              setSelectedSide={setSelectedSide}
              selectedTimeControl={selectedTimeControl}
              setSelectedTimeControl={setSelectedTimeControl}
              flipBoard={flipBoard}
              setFlipBoard={setFlipBoard}
              showCoordinatesEnabled={showCoordinatesEnabled}
              setShowCoordinatesEnabled={setShowCoordinatesEnabled}
              highlightMoves={highlightMoves}
              setHighlightMoves={setHighlightMoves}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showPostGameModal} onOpenChange={setShowPostGameModal}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[22px] border-white/10 bg-[#201e1b] p-0 text-white">
          <div className="p-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                {formatResultLabel(playerColor, getGameResult(game))}
              </DialogTitle>
              <DialogDescription className="text-[#a39c94]">
                {engineStatus}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={startConfiguredGame}
                className="h-12 rounded-[16px] bg-[#7fa650] px-6 text-base font-bold text-white hover:bg-[#90b862]"
              >
                Грати ще раз
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[16px] border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={openAnalysis}
              >
                Аналіз
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-[16px] border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={shareGame}
              >
                Поділитися
              </Button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Ходи" value={String(reviewData.movesSan.length)} />
                  <StatCard label="Точність" value={`${playerAccuracy}%`} />
                  <StatCard label="Бот" value={selectedBot.name} />
                  <StatCard label="Час" value={timeControl.label} />
                </div>

                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <BrainCircuit className="h-4 w-4 text-[#7fa650]" /> Графік оцінки
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysisChartData}>
                        <XAxis dataKey="move" tick={{ fontSize: 10, fill: "#9f988f" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#9f988f" }} domain={[-8, 8]} />
                        <ReferenceLine y={0} stroke="#7b736b" strokeDasharray="4 4" />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value > 0 ? "+" : ""}${value.toFixed(1)}`,
                            "Eval",
                          ]}
                        />
                        <Line type="monotone" dataKey="eval" stroke="#7fa650" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {game.pgn().trim() && (
                  <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Перегляд партії</p>
                        <p className="text-xs text-[#9f988f]">
                          Перегляньте ходи або відкрийте повний аналіз.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAnalysis}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                      >
                        Повний аналіз
                      </Button>
                    </div>
                    <PgnViewer pgn={game.pgn()} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard label="Найкращі" value={String(playerBreakdown.best)} />
                  <StatCard label="Неточності" value={String(playerBreakdown.inaccuracy)} />
                  <StatCard label="Помилки" value={String(playerBreakdown.mistake)} />
                  <StatCard label="Зівки" value={String(playerBreakdown.blunder)} />
                </div>

                <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-3">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <Trophy className="h-4 w-4 text-[#7fa650]" /> Критичні моменти
                  </div>
                  {reviewInsights.length > 0 ? (
                    <div className="space-y-2">
                      {reviewInsights.slice(0, 5).map((item) => (
                        <div
                          key={`${item.ply}-${item.move}`}
                          className="rounded-[16px] border border-white/8 bg-black/10 px-3 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-white">
                              {Math.floor(item.ply / 2) + 1}. {item.move}
                            </span>
                            <span className="text-xs font-semibold text-amber-300">{reviewLabelUa(item.label)}</span>
                          </div>
                          <p className="mt-1 text-xs text-[#b8b0a8]">
                            Зміна оцінки: {Math.abs(item.swing / 100).toFixed(1)}
                          </p>
                          {item.suggestion && (
                            <p className="mt-1 text-xs text-[#a9d36f]">Краще: {item.suggestion}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9f988f]">
                      Швидка перевірка не знайшла серйозних тактичних помилок.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={copyFen}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Копіювати FEN
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyPgn}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Копіювати PGN
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportPgn}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Download className="mr-2 h-4 w-4" /> Завантажити PGN
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OptionsCard({
  lockMatchOptions = false,
  selectedSide,
  setSelectedSide,
  selectedTimeControl,
  setSelectedTimeControl,
  flipBoard,
  setFlipBoard,
  showCoordinatesEnabled,
  setShowCoordinatesEnabled,
  highlightMoves,
  setHighlightMoves,
  soundEnabled,
  setSoundEnabled,
}: {
  lockMatchOptions?: boolean;
  selectedSide: SideChoice;
  setSelectedSide: (value: SideChoice) => void;
  selectedTimeControl: TimeControlId;
  setSelectedTimeControl: (value: TimeControlId) => void;
  flipBoard: boolean;
  setFlipBoard: (value: boolean) => void;
  showCoordinatesEnabled: boolean;
  setShowCoordinatesEnabled: (value: boolean) => void;
  highlightMoves: boolean;
  setHighlightMoves: (value: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-black/25 bg-[#292725] p-3">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#99958f]">Грати за</p>
        <div className="grid grid-cols-3 gap-2">
          {PLAYER_SIDE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={lockMatchOptions}
              onClick={() => setSelectedSide(option.value)}
              className={`rounded-lg px-2 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${
                selectedSide === option.value
                  ? "bg-[#81b64c] text-white"
                  : "bg-[#3a3835] text-[#d1cdc7] hover:bg-[#45423e]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#99958f]">Контроль часу</p>
        <Select disabled={lockMatchOptions} value={selectedTimeControl} onValueChange={(value) => setSelectedTimeControl(value as TimeControlId)}>
          <SelectTrigger className="h-11 rounded-lg border-black/25 bg-[#3a3835] text-white focus:ring-[#81b64c] disabled:opacity-55">
            <SelectValue placeholder="Оберіть контроль часу" />
          </SelectTrigger>
          <SelectContent>
            {TIME_CONTROLS.map((control) => (
              <SelectItem key={control.id} value={control.id}>
                {control.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#99958f]">Шахівниця</p>
        <div className="space-y-3">
          <OptionToggle
            label="Перевернути дошку"
            checked={flipBoard}
            onCheckedChange={setFlipBoard}
          />
          <OptionToggle
            label="Показувати координати"
            checked={showCoordinatesEnabled}
            onCheckedChange={setShowCoordinatesEnabled}
          />
          <OptionToggle
            label="Підсвічувати ходи"
            checked={highlightMoves}
            onCheckedChange={setHighlightMoves}
          />
          <OptionToggle
            label="Звук"
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            icon={soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          />
        </div>
      </div>
    </div>
  );
}

function OptionToggle({
  label,
  checked,
  onCheckedChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        {icon}
        {label}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function BotAvatar({
  bot,
  size,
}: {
  bot: BotProfile;
  size: "sm" | "md" | "lg";
}) {
  const dimension = size === "lg" ? 72 : size === "md" ? 54 : 42;
  const initials =
    bot.behaviorTier === "Engine"
      ? "AI"
      : bot.name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[18px] border border-white/10"
      style={{
        width: dimension,
        height: dimension,
        background: `linear-gradient(135deg, ${bot.avatarTheme.base}, ${bot.avatarTheme.glow})`,
        boxShadow: `0 12px 30px ${bot.avatarTheme.glow}30`,
      }}
    >
      <div
        className="absolute -right-3 -top-3 rounded-full"
        style={{
          width: dimension * 0.56,
          height: dimension * 0.56,
          background: `${bot.avatarTheme.accent}55`,
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 rounded-t-full"
        style={{
          width: dimension * 0.72,
          height: dimension * 0.42,
          transform: "translateX(-50%)",
          background: `${bot.avatarTheme.ink}26`,
        }}
      />
      <div
        className="absolute left-1/2 rounded-full"
        style={{
          width: dimension * 0.4,
          height: dimension * 0.4,
          top: dimension * 0.18,
          transform: "translateX(-50%)",
          background: bot.avatarTheme.ink,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-2 text-center font-black tracking-[0.18em]"
        style={{
          color: bot.avatarTheme.ink,
          fontSize: size === "lg" ? 13 : size === "md" ? 11 : 10,
        }}
      >
        {initials}
      </div>
      {bot.behaviorTier === "Engine" && (
        <div className="absolute inset-0 grid place-items-center">
          <Bot className="h-5 w-5 text-cyan-100" />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border border-black/25 bg-[#3a3835] px-2 py-2 text-center text-xs font-bold leading-4 text-[#e1ded8] transition hover:bg-[#45423e] focus:outline-none focus:ring-2 focus:ring-[#81b64c] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#938b82]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function resolveBotAiLevel(bot: BotProfile, trainingRating: number): AILevel {
  if (bot.behaviorTier === "Adaptive") {
    if (trainingRating < 900) return 3;
    if (trainingRating < 1400) return 5;
    if (trainingRating < 1900) return 6;
    return 7;
  }

  if (bot.behaviorTier === "Engine") {
    return 8;
  }

  return bot.aiLevel;
}

function resolveStockfishDepth(bot: BotProfile, trainingRating: number) {
  const level = resolveBotAiLevel(bot, trainingRating);
  const depthMap: Record<AILevel, number> = {
    1: 3,
    2: 4,
    3: 5,
    4: 6,
    5: 7,
    6: 8,
    7: 9,
    8: 10,
  };

  return depthMap[level];
}

function chooseBotMove(
  game: Chess,
  stockfishMove: string | null,
  bot: BotProfile,
  trainingRating: number,
) {
  const level = resolveBotAiLevel(bot, trainingRating);
  const fallbackLevel = Math.min(level, 6) as AILevel;
  const historyLength = game.history().length;
  const fallbackChance =
    bot.behaviorTier === "Beginner"
      ? 0.75
      : bot.behaviorTier === "Intermediate"
        ? 0.45
        : bot.behaviorTier === "Advanced"
          ? historyLength < 10
            ? 0.18
            : 0.1
          : bot.behaviorTier === "Adaptive"
            ? trainingRating < 1000
              ? 0.2
              : 0.1
            : 0.03;

  if (Math.random() < fallbackChance) {
    const fallback = getAIMove(game, fallbackLevel);
    if (fallback) {
      return game.move(fallback) || null;
    }
  }

  if (stockfishMove && isUciMove(stockfishMove)) {
    const stockfishApplied = applyUciMove(game, stockfishMove);
    if (stockfishApplied) {
      return stockfishApplied;
    }
  }

  const fallback = getAIMove(game, fallbackLevel);
  if (fallback) {
    return game.move(fallback) || null;
  }

  return null;
}

function getLocalAnalysisSnapshot(fen: string, level: AILevel) {
  const game = new Chess(fen);
  const evalScore = evaluatePositionCp(game);
  const fallbackMove = getAIMove(game, Math.min(level, 6) as AILevel);

  if (!fallbackMove) {
    return {
      evalScore,
      bestMoveLabel: null,
      bestMoveUci: null,
      principalVariation: [] as string[],
    };
  }

  const move = game.move(fallbackMove);

  return {
    evalScore,
    bestMoveLabel: move?.san || null,
    bestMoveUci: move ? moveToUci(move) : null,
    principalVariation: move?.san ? [move.san] : [],
  };
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function cloneGame(game: Chess) {
  return cloneGameFromSnapshot(game.pgn(), game.fen());
}

function cloneGameFromSnapshot(pgn: string, fen: string) {
  const next = new Chess();

  if (pgn.trim()) {
    try {
      next.loadPgn(pgn);
      return next;
    } catch {
      // fall back to FEN
    }
  }

  next.load(fen);
  return next;
}

function buildReviewData(game: Chess) {
  const walker = new Chess();
  const positions = [walker.fen()];
  const movesSan: string[] = [];
  const movesVerbose: ReviewMove[] = [];

  for (const move of game.history({ verbose: true })) {
    walker.move(move);
    movesSan.push(move.san);
    movesVerbose.push({
      san: move.san,
      from: move.from as Square,
      to: move.to as Square,
    });
    positions.push(walker.fen());
  }

  return { positions, movesSan, movesVerbose };
}

function parseEngineInfoLine(line: string) {
  const depthMatch = line.match(/\bdepth (\d+)/);
  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  const mateMatch = line.match(/\bscore mate (-?\d+)/);

  return {
    depth: depthMatch ? Number.parseInt(depthMatch[1], 10) : null,
    scoreCp: cpMatch
      ? Number.parseInt(cpMatch[1], 10)
      : mateMatch
        ? Number.parseInt(mateMatch[1], 10) > 0
          ? 10000
          : -10000
        : null,
  };
}

function applyUciMove(game: Chess, uci: string) {
  if (!isUciMove(uci)) {
    return null;
  }

  const payload: { from: string; to: string; promotion?: "q" | "r" | "b" | "n" } = {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
  };

  if (uci.length === 5) {
    payload.promotion = uci.slice(4, 5) as "q" | "r" | "b" | "n";
  }

  return game.move(payload) || null;
}

function moveToUci(move: Move) {
  return `${move.from}${move.to}${move.promotion ?? ""}`;
}

function isUciMove(value: string) {
  return /^[a-h][1-8][a-h][1-8][nbrq]?$/.test(value);
}

function uciToSan(fen: string, uci: string) {
  if (!isUciMove(uci)) {
    return null;
  }

  try {
    const game = new Chess(fen);
    const move = applyUciMove(game, uci);
    return move?.san || null;
  } catch {
    return null;
  }
}

function uciPvToSan(fen: string, pv: string[]) {
  if (pv.length === 0) {
    return [];
  }

  const game = new Chess(fen);
  const san: string[] = [];

  for (const step of pv) {
    const move = applyUciMove(game, step);
    if (!move) {
      break;
    }
    san.push(move.san);
  }

  return san;
}

function getGameResult(game: Chess) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? "0-1" : "1-0";
  }

  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return "1/2-1/2";
  }

  return "*";
}

function formatResultLabel(playerColor: "w" | "b", result: string) {
  if (result === "1/2-1/2") {
    return "Нічия";
  }

  const playerWon =
    (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");

  return playerWon ? "Ви перемогли" : "Ви програли";
}

function reviewLabelUa(label: ReviewInsight["label"]) {
  if (label === "Blunder") return "Зівок";
  if (label === "Mistake") return "Помилка";
  return "Неточність";
}

function playMoveSound(move: Move, game: Chess, soundEnabled: boolean) {
  if (!soundEnabled) {
    return;
  }

  if (game.isCheckmate()) {
    playChessSound("checkmate");
    return;
  }

  if (game.isCheck()) {
    playChessSound("check");
    return;
  }

  if (move.san.includes("O-O")) {
    playChessSound("castle");
    return;
  }

  if (move.flags.includes("p")) {
    playChessSound("promote");
    return;
  }

  if (move.flags.includes("c") || move.flags.includes("e")) {
    playChessSound("capture");
    return;
  }

  playChessSound("move");
}

function evaluatePositionCp(game: Chess) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -10000 : 10000;
  }

  if (game.isDraw() || game.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = game.board();

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank][file];
      if (!piece) {
        continue;
      }

      score += piece.color === "w" ? PIECE_VALUES[piece.type] : -PIECE_VALUES[piece.type];
    }
  }

  const mobility = game.moves().length * 4;
  score += game.turn() === "w" ? mobility : -mobility;
  return score;
}

function getCapturedPieces(game: Chess, color: "w" | "b") {
  const remaining = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (const row of game.board()) {
    for (const piece of row) {
      if (piece && piece.color === color && piece.type in remaining) {
        remaining[piece.type as keyof typeof remaining] += 1;
      }
    }
  }

  const initial = { p: 8, n: 2, b: 2, r: 2, q: 1 };

  return Object.entries(initial)
    .map(([piece, total]) => ({
      piece,
      count: total - remaining[piece as keyof typeof remaining],
      color,
    }))
    .filter((item) => item.count > 0);
}

function buildReviewInsights(
  positions: string[],
  movesSan: string[],
  playerColor: "w" | "b",
  level: AILevel,
) {
  return movesSan
    .map((move, index) => {
      const actorColor = index % 2 === 0 ? "w" : "b";
      if (actorColor !== playerColor) {
        return null;
      }

      const before = new Chess(positions[index]);
      const after = new Chess(positions[index + 1]);
      const beforeEval = evaluatePositionCp(before);
      const afterEval = evaluatePositionCp(after);
      const playerSwing =
        playerColor === "w" ? afterEval - beforeEval : beforeEval - afterEval;

      let label: ReviewInsight["label"] | null = null;
      if (playerSwing <= -150) {
        label = "Blunder";
      } else if (playerSwing <= -80) {
        label = "Mistake";
      } else if (playerSwing <= -35) {
        label = "Inaccuracy";
      }

      if (!label) {
        return null;
      }

      const suggestion = getAIMove(before, Math.min(level + 1, 8) as AILevel);
      return {
        ply: index,
        move,
        label,
        swing: playerSwing,
        suggestion,
      } satisfies ReviewInsight;
    })
    .filter((item): item is ReviewInsight => item != null)
    .sort((left, right) => left.swing - right.swing);
}

function calculateAccuracy(positions: string[], color: "w" | "b") {
  if (positions.length <= 1) {
    return 100;
  }

  const values: number[] = [];
  for (let index = 0; index < positions.length - 1; index += 1) {
    const actorColor = index % 2 === 0 ? "w" : "b";
    if (actorColor !== color) {
      continue;
    }

    const beforeEval = evaluatePositionCp(new Chess(positions[index]));
    const afterEval = evaluatePositionCp(new Chess(positions[index + 1]));
    const centipawnLoss =
      color === "w"
        ? Math.max(0, beforeEval - afterEval)
        : Math.max(0, afterEval - beforeEval);
    const accuracy = Math.round(Math.max(12, 100 * Math.exp(-centipawnLoss / 260)));
    values.push(Math.min(100, accuracy));
  }

  if (values.length === 0) {
    return 100;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function calculateAccuracyBreakdown(positions: string[], color: "w" | "b") {
  const breakdown = { best: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

  for (let index = 0; index < positions.length - 1; index += 1) {
    const actorColor = index % 2 === 0 ? "w" : "b";
    if (actorColor !== color) {
      continue;
    }

    const beforeEval = evaluatePositionCp(new Chess(positions[index]));
    const afterEval = evaluatePositionCp(new Chess(positions[index + 1]));
    const centipawnLoss =
      color === "w"
        ? Math.max(0, beforeEval - afterEval)
        : Math.max(0, afterEval - beforeEval);

    if (centipawnLoss <= 20) {
      breakdown.best += 1;
    } else if (centipawnLoss <= 60) {
      breakdown.inaccuracy += 1;
    } else if (centipawnLoss <= 130) {
      breakdown.mistake += 1;
    } else {
      breakdown.blunder += 1;
    }
  }

  return breakdown;
}

function calculateRatingDelta(
  playerRating: number,
  botRating: number,
  result: string,
  playerColor: "w" | "b",
) {
  if (result === "*") {
    return 0;
  }

  const actualScore =
    result === "1/2-1/2"
      ? 0.5
      : (result === "1-0" && playerColor === "w") ||
          (result === "0-1" && playerColor === "b")
        ? 1
        : 0;

  const expectedScore = 1 / (1 + 10 ** ((botRating - playerRating) / 400));
  const kFactor = playerRating < 1600 ? 28 : playerRating < 2200 ? 20 : 16;

  return Math.round(kFactor * (actualScore - expectedScore));
}

function formatEval(score: number) {
  if (Math.abs(score) >= 10000) {
    return score > 0 ? "Mate for White" : "Mate for Black";
  }

  const normalized = score / 100;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}`;
}
