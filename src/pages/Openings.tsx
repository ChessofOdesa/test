import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { BookOpen, ChevronRight, RotateCcw, Star, Shield, Swords, Target, Zap } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import { OPENINGS, type Opening, type OpeningLine } from "@/lib/openings-data";
import { readGrowthState, recordOpeningDrill } from "@/lib/growth-system";
import { Button } from "@/components/ui/button";
import { playChessSound } from "@/hooks/useChessSounds";

const STYLE_ICONS: Record<string, typeof Swords> = {
  aggressive: Zap,
  solid: Shield,
  positional: Target,
  tactical: Swords,
  universal: Star,
};

const STYLE_LABELS: Record<string, string> = {
  aggressive: "Агресивний",
  solid: "Солідний",
  positional: "Позиційний",
  tactical: "Тактичний",
  universal: "Універсальний",
};

export default function Openings() {
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [selectedLine, setSelectedLine] = useState<OpeningLine | null>(null);
  const [trainerStep, setTrainerStep] = useState(0);
  const [trainerGame, setTrainerGame] = useState(() => new Chess());
  const [trainerKey, setTrainerKey] = useState(0);
  const [filter, setFilter] = useState<string>("all");
  const [growthState, setGrowthState] = useState(() => readGrowthState());

  const startTrainer = useCallback((opening: Opening, line?: OpeningLine) => {
    const moves = line ? line.moves : opening.moves;
    const game = new Chess();
    setTrainerGame(game);
    setTrainerStep(0);
    setSelectedLine(line || null);
    setSelectedOpening(opening);
    setTrainerKey(k => k + 1);
    playChessSound("gameStart");

    // Auto-play first move for demonstration
    if (moves.length > 0) {
      setTimeout(() => {
        const g = new Chess();
        g.move(moves[0]);
        setTrainerGame(g);
        setTrainerStep(1);
        setTrainerKey(k => k + 1);
        playChessSound("move");
      }, 500);
    }
  }, []);

  const handleTrainerMove = useCallback((from: string, to: string) => {
    const moves = selectedLine ? selectedLine.moves : selectedOpening?.moves || [];
    const expectedMove = moves[trainerStep];
    if (!expectedMove) return false;

    const testGame = new Chess(trainerGame.fen());
    try {
      const move = testGame.move({ from, to, promotion: "q" });
      if (move && move.san === expectedMove) {
        setTrainerGame(testGame);
        setTrainerStep(s => s + 1);
        playChessSound("move");

        if (trainerStep + 1 >= moves.length && selectedOpening) {
          setGrowthState(recordOpeningDrill(selectedOpening.name, selectedLine?.name || "Main line", true));
        }

        // Auto-play next opponent move
        const nextMove = moves[trainerStep + 1];
        if (nextMove) {
          setTimeout(() => {
            const g = new Chess(testGame.fen());
            g.move(nextMove);
            setTrainerGame(g);
            setTrainerStep(s => s + 1);
            setTrainerKey(k => k + 1);
            playChessSound("move");
            if (trainerStep + 2 >= moves.length && selectedOpening) {
              setGrowthState(recordOpeningDrill(selectedOpening.name, selectedLine?.name || "Main line", true));
            }
          }, 400);
        }
        return true;
      } else {
        playChessSound("illegal");
        if (selectedOpening) {
          setGrowthState(recordOpeningDrill(selectedOpening.name, selectedLine?.name || "Main line", false));
        }
      }
    } catch {
      playChessSound("illegal");
      if (selectedOpening) {
        setGrowthState(recordOpeningDrill(selectedOpening.name, selectedLine?.name || "Main line", false));
      }
    }
    return false;
  }, [trainerGame, trainerStep, selectedOpening, selectedLine]);

  const resetTrainer = () => {
    if (selectedOpening) {
      startTrainer(selectedOpening, selectedLine || undefined);
    }
  };

  const filteredOpenings = filter === "all" ? OPENINGS : OPENINGS.filter(o => o.style === filter);
  const currentMoves = selectedLine ? selectedLine.moves : selectedOpening?.moves || [];
  const isComplete = trainerStep >= currentMoves.length;
  const totalCompletedDrills = growthState.openingProgress.reduce((sum, item) => sum + item.completed, 0);
  const totalOpeningAttempts = growthState.openingProgress.reduce((sum, item) => sum + item.attempts, 0);
  const selectedOpeningProgress = selectedOpening
    ? growthState.openingProgress.find(
        (item) => item.openingName === selectedOpening.name && item.lineName === (selectedLine?.name || "Main line"),
      )
    : null;
  const openingNotebookMistakes = growthState.mistakeNotebook.filter((entry) => entry.tags.includes("opening")).slice(0, 4);

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <BookOpen className="text-primary" /> Дебютний тренер
            </h1>
            <p className="text-muted-foreground font-body mt-1">Вивчайте дебюти та їх варіанти з інтерактивною дошкою</p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground">Trainer progress</p>
              <p className="mt-2 text-2xl font-display font-bold text-foreground">{totalCompletedDrills}</p>
              <p className="text-xs text-muted-foreground">completed drills from {totalOpeningAttempts} attempts</p>
            </div>
            <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground">Current line</p>
              <p className="mt-2 text-lg font-display font-bold text-foreground">
                {selectedOpeningProgress ? `${selectedOpeningProgress.completed}/${selectedOpeningProgress.attempts}` : "No attempts"}
              </p>
              <p className="text-xs text-muted-foreground">successes / attempts for selected opening</p>
            </div>
            <div className="rounded-xl border border-border bg-gradient-card p-4 shadow-card">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-muted-foreground">From Game Review</p>
              <p className="mt-2 text-lg font-display font-bold text-foreground">{openingNotebookMistakes.length} opening fixes</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {openingNotebookMistakes[0]?.openingName || "Review a game to create targeted drills"}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { key: "all", label: "Усі" },
              { key: "tactical", label: "Тактичні" },
              { key: "solid", label: "Солідні" },
              { key: "positional", label: "Позиційні" },
              { key: "universal", label: "Універсальні" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary/15 text-primary border border-gold/30"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
            {/* Openings list */}
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {filteredOpenings.map((opening) => {
                const StyleIcon = STYLE_ICONS[opening.style] || Star;
                const isSelected = selectedOpening?.name === opening.name;
                return (
                  <motion.div
                    key={opening.name}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-card rounded-xl p-4 border cursor-pointer transition-all ${
                      isSelected ? "border-gold/40 shadow-gold" : "border-border hover:border-gold/20"
                    }`}
                    onClick={() => startTrainer(opening)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-sm">{opening.name}</h3>
                        <span className="text-[10px] text-muted-foreground font-body">{opening.eco}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <StyleIcon size={12} className="text-primary" />
                        <span className="text-[10px] text-muted-foreground font-body">{STYLE_LABELS[opening.style]}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-body mb-2 line-clamp-2">{opening.description}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} className={i < opening.popularity ? "text-primary fill-primary" : "text-muted-foreground/30"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body">
                        Складність: {opening.difficulty}/5
                      </span>
                    </div>

                    {/* Lines */}
                    <AnimatePresence>
                      {isSelected && opening.lines.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-border space-y-1.5 overflow-hidden"
                        >
                          <span className="text-[10px] text-muted-foreground font-body uppercase tracking-wider">Варіанти</span>
                          {opening.lines.map((line) => (
                            <button
                              key={line.name}
                              onClick={(e) => { e.stopPropagation(); startTrainer(opening, line); }}
                              className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-body transition-all ${
                                selectedLine?.name === line.name
                                  ? "bg-primary/10 text-primary"
                                  : "text-secondary-foreground hover:bg-secondary"
                              }`}
                            >
                              <span>{line.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground">{line.evaluation}</span>
                                <ChevronRight size={12} />
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Board */}
            <div className="flex flex-col items-center gap-3">
              {selectedOpening ? (
                <>
                  <div className="text-center">
                    <h2 className="font-display font-semibold text-foreground text-lg">
                      {selectedLine ? selectedLine.name : selectedOpening.name}
                    </h2>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {isComplete ? "✅ Завершено! Ви вивчили цю лінію." : `Хід ${trainerStep + 1} з ${currentMoves.length}`}
                    </p>
                  </div>

                  <ChessBoard
                    key={trainerKey}
                    initialFen={trainerGame.fen()}
                    size={Math.min(420, typeof window !== "undefined" ? window.innerWidth - 48 : 420)}
                    onMove={handleTrainerMove}
                    interactive={!isComplete && trainerStep % 2 === 0}
                  />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetTrainer} className="font-body border-border">
                      <RotateCcw size={14} className="mr-1" /> Заново
                    </Button>
                  </div>

                  {/* Expected move hint */}
                  {!isComplete && (
                    <div className="bg-gradient-card rounded-lg p-3 border border-border text-center max-w-[420px]">
                      <p className="text-xs text-muted-foreground font-body">
                        {trainerStep % 2 === 0
                          ? `Зіграйте: ${currentMoves[trainerStep]}`
                          : "Очікуйте хід суперника..."}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gradient-card rounded-xl p-12 border border-border text-center">
                  <BookOpen size={48} className="text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-foreground mb-2">Оберіть дебют</h3>
                  <p className="text-sm text-muted-foreground font-body">
                    Натисніть на будь-який дебют зліва, щоб почати тренування
                  </p>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="space-y-4">
              {selectedOpening && (
                <>
                  <div className="bg-gradient-card rounded-xl p-5 border border-border shadow-card">
                    <h3 className="font-display font-semibold text-foreground mb-2">Про дебют</h3>
                    <p className="text-sm text-muted-foreground font-body">{selectedOpening.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body">{STYLE_LABELS[selectedOpening.style]}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-body">{selectedOpening.eco}</span>
                    </div>
                  </div>

                  {selectedLine && (
                    <div className="bg-gradient-card rounded-xl p-5 border border-border shadow-card">
                      <h3 className="font-display font-semibold text-foreground mb-2">Коментар</h3>
                      <p className="text-sm text-muted-foreground font-body">{selectedLine.comment}</p>
                      <div className="mt-2">
                        <span className="text-xs text-primary font-body font-semibold">Оцінка: {selectedLine.evaluation}</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-card rounded-xl p-5 border border-border shadow-card">
                    <h3 className="font-display font-semibold text-foreground mb-2">Ходи</h3>
                    <div className="flex flex-wrap gap-1">
                      {currentMoves.map((move, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-1 rounded font-body ${
                            i < trainerStep
                              ? "bg-primary/15 text-primary"
                              : i === trainerStep
                              ? "bg-primary/30 text-primary font-semibold border border-gold/30"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ""}{move}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
