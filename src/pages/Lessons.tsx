import ChessBoard from "@/components/ChessBoard";
import { Progress } from "@/components/ui/progress";
import { LESSON_LEVEL_META, LESSON_LEVELS, type LessonLevel, type LessonProgressState, type LessonRecord } from "@/data/lesson-levels";
import { createCleanLessonDiagramFen, firstAvailableLesson, getLessonStatus, getLevelLessons, isLessonUnlocked, LessonWorkspaceMode, LEVEL_ORDER, MoveState, normalizeMove, PrimaryButton, readProgress, StatCard, StatusBadge, TODAY_KEY, writeProgress } from '@/features/lessons/model';
import { cn } from "@/lib/utils";
import { Chess, type Square } from "chess.js";
import { ArrowLeft, ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, Eye, Flame, GraduationCap, Lock, Medal, Play, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
export default function Lessons() {
    const [progress, setProgress] = useState<LessonProgressState>(() => readProgress());
    const [mode, setMode] = useState<LessonWorkspaceMode>(() => (readProgress().selectedLevel ? "course-map" : "level-selection"));
    const [selectedLessonId, setSelectedLessonId] = useState(() => readProgress().currentLessonId || 1);
    const [stepIndex, setStepIndex] = useState(0);
    const [boardFen, setBoardFen] = useState(LESSON_LEVELS[0].fen);
    const [boardSize, setBoardSize] = useState(560);
    const [lastMove, setLastMove] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [moveState, setMoveState] = useState<MoveState>("idle");
    const [completionLessonId, setCompletionLessonId] = useState<number | null>(null);
    useEffect(() => {
        writeProgress(progress);
    }, [progress]);
    useEffect(() => {
        const syncBoardSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const maxByHeight = Math.max(320, height - 148);
            const maxByWidth = width < 640 ? width - 34 : width < 1180 ? 500 : 640;
            setBoardSize(Math.round(Math.min(maxByHeight, maxByWidth)));
        };
        syncBoardSize();
        window.addEventListener("resize", syncBoardSize);
        return () => window.removeEventListener("resize", syncBoardSize);
    }, []);
    const selectedLevel = progress.selectedLevel;
    const levelLessons = useMemo(() => getLevelLessons(selectedLevel), [selectedLevel]);
    const selectedLesson = useMemo(() => LESSON_LEVELS.find((lesson) => lesson.id === selectedLessonId) || levelLessons[0] || LESSON_LEVELS[0], [levelLessons, selectedLessonId]);
    const recommendedLesson = selectedLevel ? firstAvailableLesson(selectedLevel, progress.completedLessonIds) : null;
    const selectedStatus = getLessonStatus(selectedLesson, selectedLessonId, progress, recommendedLesson?.id ?? null);
    const lockedSelectedLesson = selectedStatus === "locked";
    const selectedStep = selectedLesson.steps[Math.min(stepIndex, selectedLesson.steps.length - 1)];
    const hintLevel = Math.min(3, Math.max(0, progress.hintLevelByLesson[String(selectedLesson.id)] || 0));
    const completedTotal = progress.completedLessonIds.length;
    const totalProgress = Math.round((completedTotal / LESSON_LEVELS.length) * 100);
    const levelCompleted = levelLessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
    const levelProgress = levelLessons.length ? Math.round((levelCompleted / levelLessons.length) * 100) : 0;
    const lessonProgress = Math.round(((stepIndex + 1) / selectedLesson.steps.length) * 100);
    const levelMeta = selectedLevel ? LESSON_LEVEL_META[selectedLevel] : null;
    const completionLesson = completionLessonId ? LESSON_LEVELS.find((lesson) => lesson.id === completionLessonId) : selectedLesson;
    const nextLesson = completionLesson
        ? getLevelLessons(completionLesson.level).find((lesson) => lesson.id > completionLesson.id)
        : null;
    const currentExpectedMove = selectedStep.expectedMove || selectedLesson.solutionMove;
    const targetSquare = selectedStep.targetSquare || currentExpectedMove?.slice(2, 4);
    const lessonDisplayFen = useMemo(() => (mode === "lesson-mode" ? createCleanLessonDiagramFen(boardFen, selectedLesson.id) : undefined), [boardFen, mode, selectedLesson.id]);
    const canContinueFromTask = !currentExpectedMove || moveState === "success" || revealed;
    const primaryLessonDisabled = (selectedStep.kind === "practice" || selectedStep.kind === "task") && !canContinueFromTask;
    const isPracticeStep = selectedStep.kind === "practice" || selectedStep.kind === "task";
    const boardInteractive = isPracticeStep && moveState !== "success";
    useEffect(() => {
        setBoardFen(selectedStep.fen || selectedLesson.fen);
        setLastMove(null);
        setRevealed(false);
        setMoveState("idle");
    }, [selectedLesson.fen, selectedLesson.id, selectedStep.fen, selectedStep.id]);
    const updateProgress = (updater: (current: LessonProgressState) => LessonProgressState) => {
        setProgress((current) => updater(current));
    };
    const setFeedback = (message: string) => {
        updateProgress((current) => ({ ...current, lastFeedback: message }));
    };
    const selectLevel = (level: LessonLevel) => {
        const firstLesson = firstAvailableLesson(level, progress.completedLessonIds);
        updateProgress((current) => ({
            ...current,
            selectedLevel: level,
            currentLessonId: firstLesson.id,
            lastFeedback: `${LESSON_LEVEL_META[level].title} selected. Lessons now match your level.`,
        }));
        setSelectedLessonId(firstLesson.id);
        setStepIndex(0);
        setMode("course-map");
    };
    const changeLevel = () => {
        setMode("level-selection");
        setFeedback("Оберіть рівень перед початком курсу.");
    };
    const selectLesson = (lesson: LessonRecord) => {
        setSelectedLessonId(lesson.id);
        setStepIndex(progress.currentStepByLesson[String(lesson.id)] || 0);
        if (!isLessonUnlocked(lesson, progress.completedLessonIds)) {
            setFeedback("Спочатку пройдіть попередній урок.");
            return;
        }
        updateProgress((current) => ({
            ...current,
            currentLessonId: lesson.id,
            lastFeedback: `${lesson.title} selected. Press Start Lesson on the right.`,
        }));
    };
    const startLesson = () => {
        if (!selectedLevel || lockedSelectedLesson) {
            setFeedback("Спочатку оберіть доступний урок.");
            return;
        }
        const savedStep = progress.currentStepByLesson[String(selectedLesson.id)] || 0;
        const nextStepIndex = Math.min(savedStep, selectedLesson.steps.length - 1);
        setStepIndex(nextStepIndex);
        setBoardFen(selectedLesson.steps[nextStepIndex]?.fen || selectedLesson.fen);
        setLastMove(null);
        setMoveState("idle");
        setRevealed(false);
        setMode("lesson-mode");
        updateProgress((current) => ({
            ...current,
            currentLessonId: selectedLesson.id,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: savedStep },
            lastFeedback: selectedLesson.steps[savedStep]?.action || selectedLesson.goal,
        }));
    };
    const previewLesson = () => {
        setFeedback(`${selectedLesson.title}: ${selectedLesson.shortDescription}`);
    };
    const nextStep = () => {
        if (mode !== "lesson-mode")
            return;
        if (stepIndex >= selectedLesson.steps.length - 1) {
            finishLesson();
            return;
        }
        const next = stepIndex + 1;
        setStepIndex(next);
        setBoardFen(selectedLesson.steps[next]?.fen || selectedLesson.fen);
        setRevealed(false);
        setMoveState("idle");
        updateProgress((current) => ({
            ...current,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: next },
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: 0 },
            lastFeedback: selectedLesson.steps[next]?.action || "Добре, тепер дивись на наступний крок.",
        }));
    };
    const openLessonStep = (next: number, feedback: string) => {
        setStepIndex(next);
        setBoardFen(selectedLesson.steps[next]?.fen || selectedLesson.fen);
        setRevealed(false);
        setMoveState("idle");
        setLastMove(null);
        updateProgress((current) => ({
            ...current,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: next },
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: 0 },
            lastFeedback: feedback,
        }));
    };
    const previousStep = () => {
        if (mode !== "lesson-mode")
            return;
        const previous = Math.max(stepIndex - 1, 0);
        setStepIndex(previous);
        setBoardFen(selectedLesson.steps[previous]?.fen || selectedLesson.fen);
        setRevealed(false);
        setMoveState("idle");
        updateProgress((current) => ({
            ...current,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: previous },
            lastFeedback: "Відкрито попередній крок.",
        }));
    };
    const showHint = () => {
        if (mode !== "lesson-mode")
            return;
        const nextHint = Math.min(hintLevel + 1, 3);
        updateProgress((current) => ({
            ...current,
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: nextHint },
            lastFeedback: selectedStep.hints[nextHint - 1] || "Спробуйте ще раз із підказкою.",
        }));
    };
    const revealAnswer = () => {
        if (mode !== "lesson-mode")
            return;
        setRevealed(true);
        setMoveState("success");
        if (isPracticeStep && currentExpectedMove) {
            setLastMove(currentExpectedMove);
            try {
                const game = new Chess(selectedStep.fen || selectedLesson.fen);
                const move = game.move({
                    from: currentExpectedMove.slice(0, 2),
                    to: currentExpectedMove.slice(2, 4),
                    promotion: currentExpectedMove[4] || "q",
                });
                if (move) {
                    setBoardFen(game.fen());
                }
            }
            catch {
                setBoardFen(selectedStep.fen || selectedLesson.fen);
            }
        }
        updateProgress((current) => ({
            ...current,
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: 3 },
            lastFeedback: selectedStep.reveal,
        }));
    };
    const finishLesson = () => {
        const alreadyCompleted = progress.completedLessonIds.includes(selectedLesson.id);
        const nextInLevel = getLevelLessons(selectedLesson.level).find((lesson) => lesson.id > selectedLesson.id);
        updateProgress((current) => ({
            ...current,
            completedLessonIds: alreadyCompleted ? current.completedLessonIds : [...current.completedLessonIds, selectedLesson.id],
            skippedLessonIds: current.skippedLessonIds.filter((id) => id !== selectedLesson.id),
            xp: alreadyCompleted ? current.xp : current.xp + selectedLesson.xp,
            streakDates: current.streakDates.includes(TODAY_KEY) ? current.streakDates : [...current.streakDates, TODAY_KEY],
            currentLessonId: nextInLevel?.id ?? selectedLesson.id,
            currentStepByLesson: {
                ...current.currentStepByLesson,
                [selectedLesson.id]: selectedLesson.steps.length - 1,
            },
            lastFeedback: `Good job. ${selectedLesson.title} completed.`,
        }));
        setCompletionLessonId(selectedLesson.id);
        setMode("completion");
    };
    const continueAfterCompletion = () => {
        if (nextLesson) {
            setSelectedLessonId(nextLesson.id);
            setMode("course-map");
            setFeedback(`${nextLesson.title} is unlocked. Start it from the right panel.`);
            return;
        }
        setMode("course-map");
        setFeedback("Рівень пройдено. Повторіть уроки або оберіть наступний рівень.");
    };
    const reviewLesson = () => {
        const lesson = completionLesson || selectedLesson;
        setSelectedLessonId(lesson.id);
        setStepIndex(0);
        setBoardFen(lesson.steps[0]?.fen || lesson.fen);
        setMoveState("idle");
        setMode("lesson-mode");
        setFeedback("Повторення розпочато з першого кроку.");
    };
    const handleBoardMove = (from: string, to: string, promotion = "q") => {
        if (!boardInteractive) {
            setFeedback("Спочатку прочитайте пояснення. Практика буде на наступному кроці.");
            return false;
        }
        try {
            const game = new Chess(boardFen);
            const move = game.move({ from, to, promotion });
            if (!move) {
                setFeedback("Неможливий хід. Оберіть інше поле.");
                return false;
            }
            const played = `${from}${to}${promotion === "q" ? "" : promotion}`;
            if (isPracticeStep && currentExpectedMove) {
                if (normalizeMove(played) === normalizeMove(currentExpectedMove)) {
                    setMoveState("success");
                    setBoardFen(game.fen());
                    setLastMove(played);
                    setFeedback(selectedStep.successText || "Це правильний хід.");
                    const next = Math.min(stepIndex + 1, selectedLesson.steps.length - 1);
                    if (next !== stepIndex) {
                        window.setTimeout(() => {
                            openLessonStep(next, selectedLesson.steps[next]?.action || selectedStep.successText || "Правильно.");
                        }, 650);
                    }
                    return true;
                }
                else {
                    setMoveState("wrong");
                    setBoardFen(selectedStep.fen || selectedLesson.fen);
                    setLastMove(null);
                    updateProgress((current) => ({
                        ...current,
                        hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: Math.max(1, hintLevel) },
                        lastFeedback: selectedStep.errorText || "Спробуй ще раз. Подивись на підказку справа.",
                    }));
                    return false;
                }
            }
            else {
                setBoardFen(game.fen());
                setLastMove(played);
                setFeedback("Хід записано. Можна продовжувати.");
                return true;
            }
        }
        catch {
            setFeedback("Цей хід неможливий у поточній позиції.");
            return false;
        }
    };
    const currentCoachText = mode === "level-selection"
        ? "Спочатку оберіть рівень."
        : mode === "course-map"
            ? "Оберіть урок на карті курсу."
            : mode === "completion"
                ? "Готово. Повторіть матеріал або перейдіть до наступного уроку."
                : moveState === "success"
                    ? selectedStep.successText || "Готово! Основну ідею засвоєно."
                    : moveState === "wrong"
                        ? "Скористайтеся підказкою та спробуйте ще раз."
                        : selectedStep.text;
    return (<div className="min-h-screen overflow-hidden bg-transparent text-foreground">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[18%] top-[-18%] h-[420px] w-[420px] rounded-full bg-primary blur-[120px]"/>
        <div className="absolute right-[6%] bottom-[-16%] h-[420px] w-[420px] rounded-full bg-secondary blur-[130px]"/>
      </div>

      <div className="relative grid h-screen grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:overflow-hidden xl:p-5">
        <main className="min-w-0 overflow-y-auto rounded-2xl border border-border bg-card shadow-sm backdrop-blur">
          {mode === "level-selection" ? (<div className="grid min-h-full place-items-center p-5">
              <section className="w-full max-w-4xl rounded-2xl border border-border bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-6 text-center shadow-sm">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-accent text-primary">
                  <GraduationCap className="h-8 w-8"/>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">Уроки</h1>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  
                  Оберіть рівень і переходьте до практики. Прогрес зберігається в цьому браузері.
                </p>
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  {LEVEL_ORDER.map((level) => (<button key={level} type="button" onClick={() => selectLevel(level)} className="rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-accent text-primary">
                        <BookOpen className="h-5 w-5"/>
                      </div>
                      <h2 className="text-xl font-black text-foreground">{LESSON_LEVEL_META[level].title}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{LESSON_LEVEL_META[level].description}</p>
                      <div className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-primary">
                        {LESSON_LEVEL_META[level].range}
                      </div>
                    </button>))}
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-4">
                  <StatCard icon={Target} label="Прогрес" value={`${totalProgress}%`} detail={`${completedTotal}/50 lessons`}/>
                  <StatCard icon={Flame} label="Серія" value={`${progress.streakDates.length}`} detail="study days"/>
                  <StatCard icon={Zap} label="XP" value={`${progress.xp}`} detail="earned XP"/>
                  <StatCard icon={Medal} label="System" value="50" detail="structured lessons"/>
                </div>
              </section>
            </div>) : mode === "course-map" ? (<div className="space-y-5 p-5">
              <section className="rounded-2xl border border-border bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      <Target className="h-4 w-4"/>
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].range : "Course"}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].title : "Lessons"}  карта курсу
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].subtitle : "Спочатку оберіть рівень."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary p-4 text-right">
                    <div className="text-2xl font-black text-foreground">{levelProgress}%</div>
                    <div className="text-xs font-semibold text-muted-foreground">{levelCompleted}/{levelLessons.length}  пройдено</div>
                  </div>
                </div>
                <Progress value={levelProgress} className="mt-5 h-2 bg-secondary"/>
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {levelLessons.map((lesson) => {
                const status = getLessonStatus(lesson, selectedLessonId, progress, recommendedLesson?.id ?? null);
                const locked = status === "locked";
                return (<button key={lesson.id} type="button" onClick={() => selectLesson(lesson)} className={cn("group min-h-[185px] rounded-2xl border p-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-primary", locked
                        ? "cursor-not-allowed border-border bg-secondary opacity-55"
                        : status === "selected"
                            ? "border-sky-300/35 bg-sky-300/10 shadow-sm"
                            : "border-border bg-secondary hover:-translate-y-0.5 hover:border-primary hover:bg-secondary")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-sm font-black text-foreground">
                          {locked ? <Lock className="h-4 w-4 text-muted-foreground"/> : lesson.id}
                        </div>
                        <StatusBadge status={status}/>
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-base font-black text-foreground">{lesson.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{lesson.shortDescription}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-1">{lesson.difficulty}</span>
                        <span className="rounded-full bg-secondary px-2 py-1">{lesson.durationMinutes} min</span>
                        <span className="rounded-full bg-accent px-2 py-1 text-primary">{lesson.xp} XP</span>
                      </div>
                    </button>);
            })}
              </section>
            </div>) : mode === "lesson-mode" ? (<div className="grid min-h-full place-items-center p-2 md:p-4">
              <section className="relative w-fit max-w-full rounded-2xl border border-border bg-secondary p-3 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <h1 className="text-lg font-black text-foreground">{selectedLesson.title}</h1>
                    <p className="text-xs text-muted-foreground">
                      
                      Крок {stepIndex + 1} of {selectedLesson.steps.length}
                    </p>
                  </div>
                  <span className="rounded-full border border-primary bg-accent px-3 py-1 text-xs font-bold text-primary">
                    {lessonProgress}%
                  </span>
                </div>
                <div className="relative">
                  <ChessBoard key={`${selectedLesson.id}-${selectedStep.id}`} initialFen={boardFen} displayFen={lessonDisplayFen} size={boardSize} onMove={handleBoardMove} interactive={boardInteractive} showLegalMoves={boardInteractive} showLastMove annotationSquares={selectedStep.demoSquares ? (selectedStep.demoSquares as Square[]) : []} targetSquares={targetSquare && selectedStep.kind === "practice" ? ([targetSquare] as Square[]) : []} startSquares={selectedStep.startSquare ? ([selectedStep.startSquare] as Square[]) : []} blockedSquares={selectedStep.blockedSquares ? (selectedStep.blockedSquares as Square[]) : []} captureSquares={selectedStep.captureSquares ? (selectedStep.captureSquares as Square[]) : []} dangerSquares={selectedStep.dangerSquares ? (selectedStep.dangerSquares as Square[]) : []} customArrows={selectedStep.arrows ? (selectedStep.arrows as [
            Square,
            Square
        ][]) : []} enableMoveSounds highlightSquares={targetSquare && moveState !== "idle"
                ? { squares: [targetSquare] as Square[], type: moveState === "success" ? "correct" : "wrong" }
                : undefined} lastMoveSquares={lastMove ? ([lastMove.slice(0, 2), lastMove.slice(2, 4)] as Square[]) : []} customLightSquareStyle={{ background: "linear-gradient(135deg, #dbeaf0, #f1f7f8)" }} customDarkSquareStyle={{ background: "linear-gradient(135deg, #6590a2, #8ab1c1)" }} customBoardStyle={{ borderRadius: 4, boxShadow: "0 24px 70px rgba(0,0,0,0.42)" }}/>
                  {selectedStep.kind === "complete" ? (<div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-md bg-secondary backdrop-blur-[1.5px]">
                      <div className="absolute h-48 w-48 rounded-full border border-border animate-ping"/>
                      <div className="absolute h-32 w-32 rounded-full bg-primary blur-2xl animate-pulse"/>
                      <div className="relative text-center drop-shadow-sm">
                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-muted text-foreground shadow-sm motion-safe:animate-bounce">
                          <Trophy className="h-12 w-12"/>
                        </div>
                        <h2 className="mt-4 text-3xl font-black text-foreground">{selectedLesson.title}</h2>
                        <p className="mt-1 rounded-full bg-primary px-4 py-1 text-sm font-black text-primary-foreground">Урок пройдено</p>
                      </div>
                    </div>) : null}
                </div>
                <Progress value={lessonProgress} className="mt-3 h-2 bg-secondary"/>
              </section>
            </div>) : (<div className="grid min-h-full place-items-center p-5">
              <section className="w-full max-w-3xl rounded-2xl border border-primary bg-primary p-8 text-center shadow-sm">
                <div className="relative mx-auto grid h-24 w-24 place-items-center">
                  <div className="absolute inset-0 rounded-2xl bg-primary blur-xl animate-pulse"/>
                  <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm motion-safe:animate-bounce">
                    <Trophy className="h-10 w-10"/>
                  </div>
                </div>
                <h1 className="mt-6 text-4xl font-black text-foreground">{completionLesson?.title}</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-primary">
                  Урок пройдено. Ти отримав XP і відкрив наступний крок курсу.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <StatCard icon={Zap} label="XP earned" value={`${completionLesson?.xp || 0}`} detail="added once"/>
                  <StatCard icon={Flame} label="Серія" value={`${progress.streakDates.length}`} detail="study days"/>
                  <StatCard icon={ChevronRight} label="Далі" value={nextLesson ? `${nextLesson.id}` : "Done"} detail={nextLesson?.title || "Level complete"}/>
                </div>
              </section>
            </div>)}
        </main>

        <aside className="max-xl:sticky max-xl:bottom-0 max-xl:z-20 max-xl:max-h-[78vh] min-h-[620px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm backdrop-blur xl:h-[calc(100vh-40px)]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              {mode === "lesson-mode" || mode === "completion" ? (<button type="button" onClick={() => setMode("course-map")} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground" aria-label="До карти уроків">
                  <ArrowLeft className="h-5 w-5"/>
                </button>) : (<span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
                  <Brain className="h-5 w-5"/>
                </span>)}
              <div className="text-center">
                <h2 className="text-lg font-black text-foreground">
                  {mode === "lesson-mode" || mode === "completion" ? selectedLesson.title : "Lessons"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {mode === "level-selection" ? "Choose your level" : mode === "course-map" ? "Course control" : "Coach panel"}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground">
                <Sparkles className="h-5 w-5"/>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {mode === "level-selection" ? (<div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-secondary p-4">
                    <h3 className="mb-3 text-sm font-black text-foreground">Оберіть рівень</h3>
                    <p className="mb-4 text-sm leading-6 text-muted-foreground">
                      Спочатку система питає твій рівень. Після цього показуються тільки відповідні уроки.
                    </p>
                    <div className="space-y-2">
                      {LEVEL_ORDER.map((level) => (<button key={level} type="button" onClick={() => selectLevel(level)} className="w-full rounded-2xl border border-border bg-secondary p-3 text-left transition hover:border-primary hover:bg-secondary">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-foreground">{LESSON_LEVEL_META[level].title}</span>
                            <span className="text-sm font-bold text-primary">{LESSON_LEVEL_META[level].range}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{LESSON_LEVEL_META[level].description}</p>
                        </button>))}
                    </div>
                  </section>
                </div>) : mode === "course-map" ? (<div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-secondary p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-foreground">Обраний рівень</h3>
                      <button type="button" onClick={() => setMode("level-selection")} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-sm font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                        
                        Змінити
                      </button>
                    </div>
                    <p className="text-sm font-black text-foreground">{selectedLevel ? LESSON_LEVEL_META[selectedLevel].title : "No level"}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedLevel ? LESSON_LEVEL_META[selectedLevel].description : "Спочатку оберіть рівень."}</p>
                    <Progress value={levelProgress} className="mt-4 h-2 bg-secondary"/>
                  </section>

                  <section className="rounded-2xl border border-border bg-secondary p-4">
                    <h3 className="mb-3 text-sm font-black text-foreground">Обраний урок</h3>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-foreground">{selectedLesson.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedLesson.goal}</p>
                      </div>
                      <StatusBadge status={selectedStatus}/>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-border bg-secondary p-2">
                        <div className="text-sm uppercase tracking-[0.14em] text-muted-foreground">Час</div>
                        <div className="mt-1 text-xs font-black text-foreground">{selectedLesson.durationMinutes}m</div>
                      </div>
                      <div className="rounded-xl border border-border bg-secondary p-2">
                        <div className="text-sm uppercase tracking-[0.14em] text-muted-foreground">XP</div>
                        <div className="mt-1 text-xs font-black text-foreground">{selectedLesson.xp}</div>
                      </div>
                      <div className="rounded-xl border border-border bg-secondary p-2">
                        <div className="text-sm uppercase tracking-[0.14em] text-muted-foreground">Рівень</div>
                        <div className="mt-1 text-xs font-black text-foreground">{selectedLesson.difficulty}</div>
                      </div>
                    </div>
                  </section>

                  <PrimaryButton onClick={startLesson} disabled={lockedSelectedLesson}>
                    <Play className="h-5 w-5"/>
                    
                    Почати урок
                  </PrimaryButton>
                  <button type="button" onClick={previewLesson} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold text-muted-foreground transition hover:bg-secondary">
                    <Eye className="h-4 w-4"/>
                    
                    Переглянути
                  </button>
                </div>) : mode === "lesson-mode" ? (<div className="flex h-full flex-col">
                  <section className="flex items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl">
                      🙂 
                    </div>
                    <div className="relative rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm">
                      <div className="absolute left-[-10px] top-5 h-0 w-0 border-y-[9px] border-r-[12px] border-y-transparent border-r-white"/>
                      {currentCoachText}
                    </div>
                  </section>

                  <section className="mt-5 rounded-2xl border border-border bg-secondary p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-foreground">{selectedStep.title}</h3>
                      <span className="text-xs font-bold text-primary">
                        {stepIndex + 1}/{selectedLesson.steps.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedStep.goal}</p>
                    {hintLevel > 0 ? (<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-700">
                        <span className="font-black">Підказка {hintLevel}: </span>
                        {selectedStep.hints[hintLevel - 1]}
                      </div>) : null}
                    {revealed ? (<div className="mt-3 rounded-xl border border-primary bg-accent p-3 text-xs leading-5 text-primary">
                        <span className="font-black">Розв’язок: </span>
                        {selectedStep.reveal}
                      </div>) : null}
                  </section>

                  <section className="mt-auto space-y-3 pt-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm font-black text-foreground">
                        <span>Випробування {stepIndex + 1}/{selectedLesson.steps.length}</span>
                        <span>{lessonProgress}%</span>
                      </div>
                      <Progress value={lessonProgress} className="h-3 bg-secondary"/>
                    </div>

                    {selectedStep.kind !== "practice" || canContinueFromTask ? (<PrimaryButton onClick={nextStep} disabled={primaryLessonDisabled}>
                        {selectedStep.kind === "complete" ? (<>
                            <CheckCircle2 className="h-5 w-5"/>
                            
                            Завершити
                          </>) : (<>
                            
                            Продовжити
                            <ArrowRight className="h-5 w-5"/>
                          </>)}
                      </PrimaryButton>) : null}

                    {selectedStep.kind === "practice" ? (<div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={previousStep} disabled={stepIndex === 0} className="h-10 rounded-xl border border-border bg-secondary text-xs font-bold text-muted-foreground transition hover:bg-secondary disabled:opacity-35">
                          
                          Назад
                        </button>
                        <button type="button" onClick={showHint} disabled={hintLevel >= 3} className="h-10 rounded-xl border border-border bg-secondary text-xs font-bold text-muted-foreground transition hover:bg-secondary disabled:opacity-35">
                          
                          Підказка
                        </button>
                        <button type="button" onClick={revealAnswer} className="h-10 rounded-xl border border-border bg-secondary text-xs font-bold text-muted-foreground transition hover:bg-secondary">
                          
                          Показати розв’язок
                        </button>
                      </div>) : null}
                  </section>
                </div>) : (<div className="flex h-full flex-col">
                  <section className="flex items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-3xl">
                      🙂 
                    </div>
                    <div className="relative rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm">
                      <div className="absolute left-[-10px] top-5 h-0 w-0 border-y-[9px] border-r-[12px] border-y-transparent border-r-white"/>
                      
                      Готово! Основну ідею уроку засвоєно.
                    </div>
                  </section>

                  <section className="mt-auto space-y-3 pt-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm font-black text-foreground">
                        <span>Випробування {selectedLesson.steps.length}/{selectedLesson.steps.length}</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="h-3 bg-secondary"/>
                    </div>
                    <PrimaryButton onClick={continueAfterCompletion}>
                      
                      Продовжити
                      <ArrowRight className="h-5 w-5"/>
                    </PrimaryButton>
                    <button type="button" onClick={reviewLesson} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary text-sm font-bold text-muted-foreground transition hover:bg-secondary">
                      <RotateCcw className="h-4 w-4"/>
                      
                      Повторити урок
                    </button>
                  </section>
                </div>)}
            </div>
          </div>
        </aside>
      </div>
    </div>);
}
