import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { Puzzle, Lightbulb, SkipForward, Target, Flame, Timer, Zap, ChevronRight, ChevronLeft, Trophy, RotateCcw, Flag, Settings, User, History, X, Menu, Star, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FEN_PUZZLES } from "@/lib/fen-puzzles-data";
import { LICHESS_PUZZLES } from "@/data/lichess-puzzles-converted";
import { MATE_IN_1_PUZZLES } from "@/data/mate-in-1-puzzles";
import { EXTRA_PUZZLES } from "@/data/extra-puzzles";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PuzzleData {
  fen: string;
  solution: string[];
  title: string;
  theme: string;
  rating: number;
  id?: string;
  disabled?: boolean;
}

function parseMoveCoord(move: string): { from: string; to: string } | null {
  const clean = move.replace(/[+#!?]/g, "");
  if (clean.length < 4) return null;
  return { from: clean.slice(0, 2), to: clean.slice(2, 4) };
}

const THEMES = [
  { id: "all", label: "Всі задачі", icon: Puzzle, color: "accent" },
  { id: "Мат в 1", label: "Мат в 1", icon: Target, color: "red" },
  { id: "Тактика", label: "Тактика", icon: Zap, color: "blue" },
  { id: "Вилка", label: "Вилка", icon: Zap, color: "purple" },
  { id: "Зв'язка", label: "Зв'язка", icon: Target, color: "green" },
  { id: "Жертва", label: "Жертва", icon: Flame, color: "orange" },
  { id: "Ендшпіль", label: "Ендшпіль", icon: Timer, color: "amber" },
  { id: "Дебют", label: "Дебют", icon: Star, color: "cyan" },
];

export default function PuzzlesPage() {
  const [puzzles, setPuzzles] = useState<PuzzleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [filter, setFilter] = useState("all");
  const [feedback, setFeedback] = useState<"neutral" | "correct" | "wrong">("neutral");
  const [highlightSquares, setHighlightSquares] = useState<{ squares: Square[]; type: "correct" | "wrong" } | undefined>();
  const [userRating, setUserRating] = useState(1500);
  const [bestStreak, setBestStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [currentFen, setCurrentFen] = useState("");
  const [opponentLastMove, setOpponentLastMove] = useState<{ from: string; to: string } | null>(null);
  const [mode, setMode] = useState<"classic" | "rush">("classic");
  const [rushTimeLeft, setRushTimeLeft] = useState(180);
  const [rushActive, setRushActive] = useState(false);
  const [rushScore, setRushScore] = useState(0);
  const [rushFails, setRushFails] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAttempts, setCorrectAttempts] = useState(0);
  const rushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Load puzzles
  useEffect(() => {
    const localPuzzles = FEN_PUZZLES.filter(p => !p.disabled);
    const allPuzzles = [...localPuzzles, ...MATE_IN_1_PUZZLES, ...EXTRA_PUZZLES, ...LICHESS_PUZZLES];
    const seenFen = new Set<string>();
    const unique = allPuzzles.filter(p => {
      if (seenFen.has(p.fen)) return false;
      seenFen.add(p.fen);
      return true;
    });
    setPuzzles(unique);
    const saved = localStorage.getItem("puzzle_rating");
    const savedBest = localStorage.getItem("puzzle_best_streak");
    if (saved) setUserRating(parseInt(saved));
    if (savedBest) setBestStreak(parseInt(savedBest));
    console.log(`✅ Завантажено ${unique.length} задач:`);
    console.log(`   - Локальні: ${localPuzzles.length}`);
    console.log(`   - Мати в 1: ${MATE_IN_1_PUZZLES.length}`);
    console.log(`   - Додаткові: ${EXTRA_PUZZLES.length}`);
    console.log(`   - Lichess: ${LICHESS_PUZZLES.length}`);
  }, []);

  // Rush timer
  useEffect(() => {
    if (rushActive && rushTimeLeft > 0) {
      rushTimerRef.current = setInterval(() => {
        setRushTimeLeft(t => {
          if (t <= 1) {
            clearInterval(rushTimerRef.current!);
            setRushActive(false);
            toast.info(`⏰ Час! Результат: ${rushScore}`);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(rushTimerRef.current!);
    }
  }, [rushActive, rushTimeLeft]);

  const filteredPuzzles = useMemo(() =>
    filter === "all" ? puzzles.filter(p => !p.disabled) : puzzles.filter(p => p.theme === filter && !p.disabled),
    [puzzles, filter]
  );

  const puzzle = filteredPuzzles[currentIndex % (filteredPuzzles.length || 1)];
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Init puzzle
  useEffect(() => {
    if (!puzzle) return;
    const moves = puzzle.solution.filter(s => s !== "--");
    setCurrentFen(puzzle.fen);
    setCurrentMoveIndex(0);
    setShowHint(false);
    setFeedback("neutral");
    setHighlightSquares(undefined);

    if (moves.length > 0) {
      const first = parseMoveCoord(moves[0]);
      if (first) {
        setIsAnimating(true);
        setOpponentLastMove(first);
        setTimeout(() => {
          try {
            const g = new Chess(puzzle.fen);
            const r = g.move({ from: first.from as any, to: first.to as any, promotion: "q" });
            if (r) { setCurrentFen(g.fen()); setCurrentMoveIndex(1); }
          } catch {}
          setOpponentLastMove(null);
          setIsAnimating(false);
          setPuzzleKey(k => k + 1);
        }, 700);
      }
    }
  }, [puzzle?.fen, currentIndex]);

  const puzzleTurn = useMemo(() => {
    if (!currentFen) return "w";
    return currentFen.split(" ")[1] || "w";
  }, [currentFen]);

  const handleSolve = useCallback((from: string, to: string): boolean => {
    if (!puzzle || isAnimating) return false;
    const moves = puzzle.solution.filter(s => s !== "--");
    const expected = moves[currentMoveIndex];

    if (!expected) {
      setSolved(s => s + 1);
      setCorrectAttempts(c => c + 1);
      setTotalAttempts(t => t + 1);
      const gain = Math.max(5, Math.round((puzzle.rating - userRating) * 0.05 + 10));
      const newR = userRating + gain;
      setUserRating(newR);
      localStorage.setItem("puzzle_rating", String(newR));
      setFeedback("correct");
      toast.success(`✓ Вирішено! +${gain}`);
      setTimeout(() => { setCurrentIndex(i => (i + 1) % filteredPuzzles.length); }, 1200);
      return true;
    }

    const clean = expected.replace(/[+#!?]/g, "");
    const coord = from + to;
    let san = "";
    try { const g = new Chess(currentFen); const m = g.move({ from: from as any, to: to as any, promotion: "q" }); if (m) san = m.san.replace(/[+#!?]/g, ""); } catch {}

    const isCorrect = coord === clean || coord === clean.slice(-4) || san === clean;
    if (!isCorrect) {
      setFeedback("wrong");
      setHighlightSquares({ squares: [from as Square, to as Square], type: "wrong" });
      setStreak(0);
      setTotalAttempts(t => t + 1);
      const loss = Math.max(3, Math.round(userRating * 0.01 + 5));
      setUserRating(Math.max(400, userRating - loss));
      localStorage.setItem("puzzle_rating", String(Math.max(400, userRating - loss)));
      toast.error(`Неправильно! -${loss}`);
      if (mode === "rush") {
        setRushFails(f => {
          if (f + 1 >= 3) {
            setRushActive(false);
            clearInterval(rushTimerRef.current!);
            toast.error(`💥 3 помилки! Результат: ${rushScore}`);
          }
          return f + 1;
        });
      }
      setTimeout(() => { setHighlightSquares(undefined); setFeedback("neutral"); }, 800);
      return false;
    }

    // Correct
    try {
      const g = new Chess(currentFen);
      const r = g.move({ from, to, promotion: "q" });
      if (r) setCurrentFen(g.fen());
    } catch {}

    setFeedback("correct");
    setHighlightSquares({ squares: [from as Square, to as Square], type: "correct" });
    const next = currentMoveIndex + 1;

    if (next < moves.length) {
      const opp = parseMoveCoord(moves[next]);
      if (opp) {
        setIsAnimating(true);
        setOpponentLastMove(opp);
        setTimeout(() => {
          try {
            const g = new Chess(currentFen);
            const r = g.move({ from: opp.from as any, to: opp.to as any, promotion: "q" });
            if (r) { setCurrentFen(g.fen()); setCurrentMoveIndex(next + 1); }
          } catch {}
          setOpponentLastMove(null);
          setFeedback("neutral");
          setHighlightSquares(undefined);
          setIsAnimating(false);
          setPuzzleKey(k => k + 1);
        }, 500);
      }
      setCurrentMoveIndex(next);
    } else {
      setSolved(s => s + 1);
      const ns = streak + 1;
      setStreak(ns);
      if (ns > bestStreak) { setBestStreak(ns); localStorage.setItem("puzzle_best_streak", String(ns)); }
      setCorrectAttempts(c => c + 1);
      setTotalAttempts(t => t + 1);
      const gain = Math.max(5, Math.round((puzzle.rating - userRating) * 0.05 + 10));
      setUserRating(userRating + gain);
      localStorage.setItem("puzzle_rating", String(userRating + gain));
      if (mode === "rush") setRushScore(s => s + 1);
      toast.success(`✓ Правильно! +${gain}`);
      setTimeout(() => setCurrentIndex(i => (i + 1) % filteredPuzzles.length), 1000);
    }
    return true;
  }, [puzzle, currentMoveIndex, currentFen, filteredPuzzles.length, isAnimating, streak, bestStreak, userRating, mode, rushScore]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const activeTheme = THEMES.find(t => t.id === filter);

  return (
    <div className="min-h-screen flex bg-transparent text-white">
      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 overflow-y-auto border-r border-white/[0.07] bg-[#0b1119]/88 backdrop-blur-xl"
            style={{ height: "100vh" }}
          >
            <div className="p-4 space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <User size={20} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{user?.user_metadata?.display_name || "Гравець"}</div>
                  <div className="text-xs text-muted-foreground">Рейтинг: <span className="text-accent font-bold">{userRating}</span></div>
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg hover:bg-muted/80">
                  <Settings size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Modes */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setMode("classic"); setRushActive(false); }}
                  className={`p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === "classic" ? "bg-accent/15 text-accent border border-accent/30" : "bg-muted text-muted-foreground"}`}>
                  <Target size={12} /> Класика
                </button>
                <button onClick={() => { setMode("rush"); setRushActive(true); setRushTimeLeft(180); setRushScore(0); setRushFails(0); }}
                  className={`p-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${mode === "rush" ? "bg-accent/15 text-accent border border-accent/30" : "bg-muted text-muted-foreground"}`}>
                  <Zap size={12} /> Rush
                </button>
              </div>

              {/* Themes */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Теми</div>
                <div className="space-y-1">
                  {THEMES.map(t => {
                    const count = t.id === "all" ? filteredPuzzles.length : puzzles.filter(p => p.theme === t.id).length;
                    return (
                      <button key={t.id} onClick={() => { setFilter(t.id); setCurrentIndex(0); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          filter === t.id ? "bg-accent/10 text-accent font-medium" : "text-muted-foreground hover:bg-muted/50"
                        }`}>
                        <t.icon size={14} className={filter === t.id ? "text-accent" : ""} />
                        <span className="flex-1 text-left">{t.label}</span>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="p-3 rounded-xl bg-muted/30 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Статистика</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Вирішено</span><br /><span className="font-bold text-primary text-lg">{solved}</span></div>
                  <div><span className="text-muted-foreground">Серія</span><br /><span className="font-bold text-accent text-lg"><Flame size={14} className="inline" /> {streak}</span></div>
                  <div><span className="text-muted-foreground">Точність</span><br /><span className="font-bold text-green-400 text-lg">{accuracy}%</span></div>
                  <div><span className="text-muted-foreground">Найкраща</span><br /><span className="font-bold text-yellow-400 text-lg">{bestStreak}</span></div>
                </div>
                {mode === "rush" && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">⏱️ Час</span>
                      <span className={`font-mono font-bold ${rushTimeLeft < 30 ? "text-destructive" : "text-foreground"}`}>{formatTime(rushTimeLeft)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Рахунок</span>
                      <span className="font-bold text-accent">{rushScore}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0,1,2].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < rushFails ? "bg-destructive" : "bg-muted"}`} />)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col min-h-screen bg-transparent">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.07] bg-[#0b1119]/70 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-muted/50">
              {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <Puzzle size={18} className="text-accent" />
              <span className="font-bold text-sm">Шахові задачі</span>
              {activeTheme && <span className="text-xs text-muted-foreground">· {activeTheme.label}</span>}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Рейтинг: <span className="text-accent font-bold">{userRating}</span></span>
            <span className="text-muted-foreground">#{currentIndex + 1} / {filteredPuzzles.length}</span>
          </div>
        </div>

        {/* Content: Board + Right Panel */}
        <div className="flex-1 flex items-center justify-center p-4 gap-6">
          {/* Board */}
          <div className="flex flex-col items-center gap-3">
            {isAnimating && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm animate-pulse">
                <RefreshCw size={14} className="animate-spin" /> Хід суперника...
              </div>
            )}
            {!isAnimating && puzzle && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${
                puzzleTurn === "w" ? "bg-white/10 border-white/20" : "bg-black/20 border-gray-600"
              }`}>
                <span className="text-lg">{puzzleTurn === "w" ? "♔" : "♚"}</span>
                {puzzleTurn === "w" ? "Хід білих" : "Хід чорних"}
              </div>
            )}
            <ChessBoard
              key={puzzleKey}
              initialFen={currentFen || puzzle?.fen}
              size={Math.min(520, typeof window !== "undefined" ? window.innerWidth - 400 : 520)}
              onMove={handleSolve}
              highlightSquares={highlightSquares || (opponentLastMove ? { squares: [opponentLastMove.from as Square, opponentLastMove.to as Square], type: "correct" } : undefined)}
              flipped={puzzleTurn === "b"}
              interactive={!isAnimating}
            />
          </div>

          {/* Right Panel */}
          {puzzle && (
            <div className="w-64 space-y-3">
              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <div className="font-bold">{puzzle.title}</div>
                    <div className="text-xs text-muted-foreground">Рейтинг: {puzzle.rating}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground">{puzzle.theme}</span>
              </div>

              <div className={`rounded-lg p-3 border text-sm font-semibold transition-all ${
                feedback === "correct" ? "text-primary border-primary/40 bg-primary/10" :
                feedback === "wrong" ? "text-destructive border-destructive/40 bg-destructive/10" :
                "text-muted-foreground border-border bg-card"
              }`}>
                {feedback === "correct" ? "✓ Правильно!" : feedback === "wrong" ? "✗ Невірно" : "Знайдіть найкращий хід"}
              </div>

              {showHint && puzzle.solution?.length > 0 && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-primary">💡 {puzzle.solution[currentMoveIndex] || puzzle.solution[0]}</p>
                </div>
              )}

              <div className="bg-card rounded-xl p-4 border border-border">
                <Progress value={((currentIndex % filteredPuzzles.length) / Math.min(filteredPuzzles.length, 10)) * 100} className="h-1.5 mb-2" />
                <div className="text-[10px] text-muted-foreground">Прогрес: {currentIndex % filteredPuzzles.length + 1}/{Math.min(filteredPuzzles.length, 10)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Panel */}
        <div className="px-4 py-3 border-t border-border bg-card/50">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowHint(true)} className="border-border">
              <Lightbulb size={14} className="mr-1.5" /> Підказка
            </Button>
            <Button size="sm" onClick={() => { setCurrentIndex(i => (i + 1) % filteredPuzzles.length); }} className="bg-accent text-accent-foreground">
              <ArrowRight size={14} className="mr-1.5" /> Далі
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(0)} className="border-border">
              <RotateCcw size={14} className="mr-1.5" /> З початку
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setStreak(0); setCurrentIndex(Math.floor(Math.random() * filteredPuzzles.length)); }} className="border-border">
              <Flag size={14} className="mr-1.5" /> Випадкова
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
