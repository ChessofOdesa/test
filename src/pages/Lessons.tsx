import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Flame,
  GraduationCap,
  Lightbulb,
  Lock,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  createDefaultLessonProgress,
  LEGACY_LESSON_PROGRESS_STORAGE_KEY,
  LESSON_LEVEL_META,
  LESSON_LEVELS,
  LESSON_PROGRESS_STORAGE_KEY,
  type LessonLevel,
  type LessonProgressState,
  type LessonRecord,
} from "@/data/lesson-levels";

type LessonWorkspaceMode = "level-selection" | "course-map" | "lesson-mode" | "completion";
type LessonStatus = "completed" | "locked" | "recommended" | "selected" | "skipped" | "open";
type MoveState = "idle" | "success" | "wrong";

const TODAY_KEY = new Date().toISOString().slice(0, 10);
const LEVEL_ORDER: LessonLevel[] = ["beginner", "amateur", "master"];

function isLessonLevel(value: unknown): value is LessonLevel {
  return value === "beginner" || value === "amateur" || value === "master";
}

function levelFromLessonId(id: number): LessonLevel {
  return LESSON_LEVELS.find((lesson) => lesson.id === id)?.level || "beginner";
}

function sanitizeProgress(raw: Partial<LessonProgressState> | null): LessonProgressState {
  const fallback = createDefaultLessonProgress();

  if (!raw) return fallback;

  const currentLessonId = Number.isFinite(raw.currentLessonId)
    ? Number(raw.currentLessonId)
    : fallback.currentLessonId;

  return {
    selectedLevel: isLessonLevel(raw.selectedLevel) ? raw.selectedLevel : levelFromLessonId(currentLessonId),
    completedLessonIds: Array.isArray(raw.completedLessonIds) ? raw.completedLessonIds : [],
    skippedLessonIds: Array.isArray(raw.skippedLessonIds) ? raw.skippedLessonIds : [],
    xp: Number.isFinite(raw.xp) ? Number(raw.xp) : 0,
    streakDates: Array.isArray(raw.streakDates) ? raw.streakDates : [],
    currentLessonId,
    currentStepByLesson:
      raw.currentStepByLesson && typeof raw.currentStepByLesson === "object"
        ? raw.currentStepByLesson
        : {},
    hintLevelByLesson:
      raw.hintLevelByLesson && typeof raw.hintLevelByLesson === "object"
        ? raw.hintLevelByLesson
        : {},
    lastFeedback: raw.lastFeedback || fallback.lastFeedback,
  };
}

function readProgress(): LessonProgressState {
  if (typeof window === "undefined") return createDefaultLessonProgress();

  try {
    const nextRaw = window.localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY);
    if (nextRaw) return sanitizeProgress(JSON.parse(nextRaw));

    const legacyRaw = window.localStorage.getItem(LEGACY_LESSON_PROGRESS_STORAGE_KEY);
    if (legacyRaw) return sanitizeProgress(JSON.parse(legacyRaw));
  } catch {
    return createDefaultLessonProgress();
  }

  return createDefaultLessonProgress();
}

function writeProgress(progress: LessonProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function normalizeMove(move: string | null) {
  return (move || "").toLowerCase().replace(/[^a-h1-8qrbn]/g, "");
}

function compressFenRank(rank: string) {
  let next = "";
  let empty = 0;

  for (const square of rank) {
    if (square === "1") {
      empty += 1;
      continue;
    }

    if (empty > 0) {
      next += String(empty);
      empty = 0;
    }

    next += square;
  }

  return next + (empty > 0 ? String(empty) : "");
}

function createCleanLessonDiagramFen(fen: string | undefined, lessonId: number) {
  if (!fen || lessonId > 7) return undefined;

  const [placement, ...rest] = fen.split(" ");
  const keepPiece = (piece: string) => {
    if (!/[prnbqkPRNBQK]/.test(piece)) return true;
    if (lessonId === 6) return piece !== "k";
    if (lessonId === 7) return piece === piece.toUpperCase();
    return piece !== "K" && piece !== "k";
  };

  const ranks = placement.split("/").map((rank) => {
    let expanded = "";
    for (const char of rank) {
      expanded += /\d/.test(char) ? "1".repeat(Number(char)) : char;
    }

    return compressFenRank(
      expanded
        .split("")
        .map((piece) => (keepPiece(piece) ? piece : "1"))
        .join(""),
    );
  });

  return [ranks.join("/"), ...rest].join(" ");
}

function getLevelLessons(level: LessonLevel | null) {
  return level ? LESSON_LEVELS.filter((lesson) => lesson.level === level) : [];
}

function firstAvailableLesson(level: LessonLevel, completedLessonIds: number[]) {
  const lessons = getLevelLessons(level);
  return (
    lessons.find((lesson, index) => index === 0 || completedLessonIds.includes(lessons[index - 1].id)) ||
    lessons[0]
  );
}

function isLessonUnlocked(lesson: LessonRecord, completedLessonIds: number[]) {
  const lessons = getLevelLessons(lesson.level);
  const index = lessons.findIndex((item) => item.id === lesson.id);
  return index === 0 || completedLessonIds.includes(lessons[index - 1]?.id);
}

function getLessonStatus(
  lesson: LessonRecord,
  selectedLessonId: number,
  progress: LessonProgressState,
  recommendedLessonId: number | null,
): LessonStatus {
  if (progress.completedLessonIds.includes(lesson.id)) return "completed";
  if (!isLessonUnlocked(lesson, progress.completedLessonIds)) return "locked";
  if (lesson.id === selectedLessonId) return "selected";
  if (progress.skippedLessonIds.includes(lesson.id)) return "skipped";
  if (lesson.id === recommendedLessonId) return "recommended";
  return "open";
}

function StatusBadge({ status }: { status: LessonStatus }) {
  const styles: Record<LessonStatus, string> = {
    completed: "border-emerald-400/35 bg-emerald-400/12 text-emerald-100",
    locked: "border-white/8 bg-white/[0.04] text-white/35",
    recommended: "border-amber-300/45 bg-amber-300/12 text-amber-100",
    selected: "border-sky-300/40 bg-sky-300/12 text-sky-100",
    skipped: "border-orange-300/35 bg-orange-300/12 text-orange-100",
    open: "border-white/10 bg-white/[0.05] text-white/65",
  };

  const copy: Record<LessonStatus, string> = {
    completed: "Completed",
    locked: "Locked",
    recommended: "Recommended",
    selected: "Selected",
    skipped: "Incomplete",
    open: "Open",
  };

  return (
    <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", styles[status])}>
      {copy[status]}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="mb-3 flex items-center gap-2 text-[#a7b7c7]">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#82b64d]/12 text-[#a9d77d]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-[#98a4b3]">{detail}</div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#82b64d] px-5 text-base font-black text-white shadow-[0_18px_48px_rgba(130,182,77,0.24)] transition hover:bg-[#8fc75a] focus:outline-none focus:ring-2 focus:ring-[#c8ed9d]/70 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

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
  const selectedLesson = useMemo(
    () => LESSON_LEVELS.find((lesson) => lesson.id === selectedLessonId) || levelLessons[0] || LESSON_LEVELS[0],
    [levelLessons, selectedLessonId],
  );
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
  const lessonDisplayFen = useMemo(
    () => (mode === "lesson-mode" ? createCleanLessonDiagramFen(boardFen, selectedLesson.id) : undefined),
    [boardFen, mode, selectedLesson.id],
  );
  const canContinueFromTask = !currentExpectedMove || moveState === "success" || revealed;
  const primaryLessonDisabled =
    (selectedStep.kind === "practice" || selectedStep.kind === "task") && !canContinueFromTask;
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
    setFeedback("Choose your player level before starting the course.");
  };

  const selectLesson = (lesson: LessonRecord) => {
    setSelectedLessonId(lesson.id);
    setStepIndex(progress.currentStepByLesson[String(lesson.id)] || 0);

    if (!isLessonUnlocked(lesson, progress.completedLessonIds)) {
      setFeedback("This lesson is locked. Complete the previous lesson first.");
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
      setFeedback("Select an unlocked lesson first.");
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
    if (mode !== "lesson-mode") return;

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
    if (mode !== "lesson-mode") return;
    const previous = Math.max(stepIndex - 1, 0);
    setStepIndex(previous);
    setBoardFen(selectedLesson.steps[previous]?.fen || selectedLesson.fen);
    setRevealed(false);
    setMoveState("idle");
    updateProgress((current) => ({
      ...current,
      currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: previous },
      lastFeedback: "Previous step opened.",
    }));
  };

  const showHint = () => {
    if (mode !== "lesson-mode") return;
    const nextHint = Math.min(hintLevel + 1, 3);
    updateProgress((current) => ({
      ...current,
      hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: nextHint },
      lastFeedback: selectedStep.hints[nextHint - 1] || "Try again with the new hint.",
    }));
  };

  const revealAnswer = () => {
    if (mode !== "lesson-mode") return;
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
      } catch {
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
    setFeedback("Level complete. Review lessons or choose another level.");
  };

  const reviewLesson = () => {
    const lesson = completionLesson || selectedLesson;
    setSelectedLessonId(lesson.id);
    setStepIndex(0);
    setBoardFen(lesson.steps[0]?.fen || lesson.fen);
    setMoveState("idle");
    setMode("lesson-mode");
    setFeedback("Review mode started from step 1.");
  };

  const handleBoardMove = (from: string, to: string, promotion = "q") => {
    if (!boardInteractive) {
      setFeedback("First watch the explanation. Practice starts on the next step.");
      return false;
    }

    try {
      const game = new Chess(boardFen);
      const move = game.move({ from, to, promotion });
      if (!move) {
        setFeedback("Illegal move. Try another square.");
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
              openLessonStep(next, selectedLesson.steps[next]?.action || selectedStep.successText || "Correct.");
            }, 650);
          }
          return true;
        } else {
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
      } else {
        setBoardFen(game.fen());
        setLastMove(played);
        setFeedback("Move recorded. Continue when you are ready.");
        return true;
      }
    } catch {
      setFeedback("This move cannot be played from the current position.");
      return false;
    }
  };

  const currentCoachText =
    mode === "level-selection"
      ? "Choose your player level first."
      : mode === "course-map"
        ? "Select a lesson from the map. Then start it here."
        : mode === "completion"
          ? "Good job. Review or continue to the next lesson."
          : moveState === "success"
            ? selectedStep.successText || "Good job! Now you know the key idea."
            : moveState === "wrong"
              ? "Not yet. Use the hint and try the idea again."
              : selectedStep.text;

  return (
    <div className="min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[18%] top-[-18%] h-[420px] w-[420px] rounded-full bg-[#7fa650]/8 blur-[120px]" />
        <div className="absolute right-[6%] bottom-[-16%] h-[420px] w-[420px] rounded-full bg-[#466996]/10 blur-[130px]" />
      </div>

      <div className="relative grid h-screen grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_380px] xl:overflow-hidden xl:p-5">
        <main className="min-w-0 overflow-y-auto rounded-[26px] border border-white/10 bg-[#151a20]/92 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur">
          {mode === "level-selection" ? (
            <div className="grid min-h-full place-items-center p-5">
              <section className="w-full max-w-4xl rounded-[30px] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[22px] bg-[#82b64d]/14 text-[#c8ed9d]">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Lessons</h1>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#b8c3cf]">
                  Choose your level and start learning step by step.
                </p>
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  {LEVEL_ORDER.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => selectLevel(level)}
                      className="rounded-[24px] border border-white/10 bg-[#11161d]/80 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#82b64d]/40 hover:bg-[#18211d] focus:outline-none focus:ring-2 focus:ring-[#82b64d]/60"
                    >
                      <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[#82b64d]/12 text-[#c8ed9d]">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-black text-white">{LESSON_LEVEL_META[level].title}</h2>
                      <p className="mt-2 text-sm leading-6 text-[#aeb8c5]">{LESSON_LEVEL_META[level].description}</p>
                      <div className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#c8ed9d]">
                        {LESSON_LEVEL_META[level].range}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-7 grid gap-3 md:grid-cols-4">
                  <StatCard icon={Target} label="Progress" value={`${totalProgress}%`} detail={`${completedTotal}/50 lessons`} />
                  <StatCard icon={Flame} label="Streak" value={`${progress.streakDates.length}`} detail="study days" />
                  <StatCard icon={Zap} label="XP" value={`${progress.xp}`} detail="earned XP" />
                  <StatCard icon={Medal} label="System" value="50" detail="structured lessons" />
                </div>
              </section>
            </div>
          ) : mode === "course-map" ? (
            <div className="space-y-5 p-5">
              <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.075] to-white/[0.025] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#82b64d]/25 bg-[#82b64d]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#c8ed9d]">
                      <Target className="h-4 w-4" />
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].range : "Course"}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].title : "Lessons"} course map
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#b8c3cf]">
                      {selectedLevel ? LESSON_LEVEL_META[selectedLevel].subtitle : "Choose a level first."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-right">
                    <div className="text-2xl font-black text-white">{levelProgress}%</div>
                    <div className="text-xs font-semibold text-[#98a4b3]">{levelCompleted}/{levelLessons.length} completed</div>
                  </div>
                </div>
                <Progress value={levelProgress} className="mt-5 h-2 bg-white/10" />
              </section>

              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {levelLessons.map((lesson) => {
                  const status = getLessonStatus(lesson, selectedLessonId, progress, recommendedLesson?.id ?? null);
                  const locked = status === "locked";

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => selectLesson(lesson)}
                      className={cn(
                        "group min-h-[185px] rounded-[22px] border p-4 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#82b64d]/60",
                        locked
                          ? "cursor-not-allowed border-white/6 bg-white/[0.025] opacity-55"
                          : status === "selected"
                            ? "border-sky-300/35 bg-sky-300/10 shadow-[0_18px_50px_rgba(56,189,248,0.12)]"
                            : "border-white/10 bg-white/[0.045] hover:-translate-y-0.5 hover:border-[#82b64d]/35 hover:bg-white/[0.075]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/25 text-sm font-black text-white">
                          {locked ? <Lock className="h-4 w-4 text-white/45" /> : lesson.id}
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <h3 className="mt-4 line-clamp-2 text-base font-black text-white">{lesson.title}</h3>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#aeb8c5]">{lesson.shortDescription}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/55">
                        <span className="rounded-full bg-white/[0.05] px-2 py-1">{lesson.difficulty}</span>
                        <span className="rounded-full bg-white/[0.05] px-2 py-1">{lesson.durationMinutes} min</span>
                        <span className="rounded-full bg-[#82b64d]/12 px-2 py-1 text-[#c8ed9d]">{lesson.xp} XP</span>
                      </div>
                    </button>
                  );
                })}
              </section>
            </div>
          ) : mode === "lesson-mode" ? (
            <div className="grid min-h-full place-items-center p-2 md:p-4">
              <section className="relative w-fit max-w-full rounded-[24px] border border-white/10 bg-black/18 p-3 shadow-[0_26px_80px_rgba(0,0,0,0.32)]">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <h1 className="text-lg font-black text-white">{selectedLesson.title}</h1>
                    <p className="text-xs text-[#98a4b3]">
                      Step {stepIndex + 1} of {selectedLesson.steps.length}
                    </p>
                  </div>
                  <span className="rounded-full border border-[#82b64d]/25 bg-[#82b64d]/10 px-3 py-1 text-xs font-bold text-[#c8ed9d]">
                    {lessonProgress}%
                  </span>
                </div>
                <div className="relative">
                  <ChessBoard
                    key={`${selectedLesson.id}-${selectedStep.id}`}
                    initialFen={boardFen}
                    displayFen={lessonDisplayFen}
                    size={boardSize}
                    onMove={handleBoardMove}
                    interactive={boardInteractive}
                    showLegalMoves={boardInteractive}
                    showLastMove
                    annotationSquares={selectedStep.demoSquares ? (selectedStep.demoSquares as any) : []}
                    targetSquares={targetSquare && selectedStep.kind === "practice" ? ([targetSquare] as any) : []}
                    startSquares={selectedStep.startSquare ? ([selectedStep.startSquare] as any) : []}
                    blockedSquares={selectedStep.blockedSquares ? (selectedStep.blockedSquares as any) : []}
                    captureSquares={selectedStep.captureSquares ? (selectedStep.captureSquares as any) : []}
                    dangerSquares={selectedStep.dangerSquares ? (selectedStep.dangerSquares as any) : []}
                    customArrows={selectedStep.arrows ? (selectedStep.arrows as any) : []}
                    enableMoveSounds
                    highlightSquares={
                      targetSquare && moveState !== "idle"
                        ? { squares: [targetSquare] as any, type: moveState === "success" ? "correct" : "wrong" }
                        : undefined
                    }
                    lastMoveSquares={lastMove ? ([lastMove.slice(0, 2), lastMove.slice(2, 4)] as any) : []}
                    customLightSquareStyle={{ background: "linear-gradient(135deg, #dbeaf0, #f1f7f8)" }}
                    customDarkSquareStyle={{ background: "linear-gradient(135deg, #6590a2, #8ab1c1)" }}
                    customBoardStyle={{ borderRadius: 4, boxShadow: "0 24px 70px rgba(0,0,0,0.42)" }}
                  />
                  {selectedStep.kind === "complete" ? (
                    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-md bg-black/58 backdrop-blur-[1.5px]">
                      <div className="absolute h-48 w-48 rounded-full border border-[#f6d44f]/45 animate-ping" />
                      <div className="absolute h-32 w-32 rounded-full bg-[#82b64d]/25 blur-2xl animate-pulse" />
                      <div className="relative text-center drop-shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
                        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-[#f6d44f] text-white shadow-[0_18px_50px_rgba(246,212,79,0.32)] motion-safe:animate-bounce">
                          <Trophy className="h-12 w-12" />
                        </div>
                        <h2 className="mt-4 text-3xl font-black text-white">{selectedLesson.title}</h2>
                        <p className="mt-1 rounded-full bg-[#82b64d]/80 px-4 py-1 text-sm font-black text-white">Урок пройдено</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Progress value={lessonProgress} className="mt-3 h-2 bg-white/10" />
              </section>
            </div>
          ) : (
            <div className="grid min-h-full place-items-center p-5">
              <section className="w-full max-w-3xl rounded-[30px] border border-[#82b64d]/25 bg-[#82b64d]/10 p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
                <div className="relative mx-auto grid h-24 w-24 place-items-center">
                  <div className="absolute inset-0 rounded-[30px] bg-[#82b64d]/35 blur-xl animate-pulse" />
                  <div className="relative grid h-20 w-20 place-items-center rounded-[28px] bg-[#82b64d] text-white shadow-[0_18px_48px_rgba(130,182,77,0.25)] motion-safe:animate-bounce">
                    <Trophy className="h-10 w-10" />
                  </div>
                </div>
                <h1 className="mt-6 text-4xl font-black text-white">{completionLesson?.title}</h1>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#dcefd0]">
                  Урок пройдено. Ти отримав XP і відкрив наступний крок курсу.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <StatCard icon={Zap} label="XP earned" value={`${completionLesson?.xp || 0}`} detail="added once" />
                  <StatCard icon={Flame} label="Streak" value={`${progress.streakDates.length}`} detail="study days" />
                  <StatCard icon={ChevronRight} label="Next" value={nextLesson ? `${nextLesson.id}` : "Done"} detail={nextLesson?.title || "Level complete"} />
                </div>
              </section>
            </div>
          )}
        </main>

        <aside className="max-xl:sticky max-xl:bottom-0 max-xl:z-20 max-xl:max-h-[78vh] min-h-[620px] overflow-hidden rounded-[26px] border border-white/10 bg-[#121417]/95 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur xl:h-[calc(100vh-40px)]">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
              {mode === "lesson-mode" || mode === "completion" ? (
                <button
                  type="button"
                  onClick={() => setMode("course-map")}
                  className="grid h-9 w-9 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Back to lesson map"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#82b64d]/12 text-[#c8ed9d]">
                  <Brain className="h-5 w-5" />
                </span>
              )}
              <div className="text-center">
                <h2 className="text-lg font-black text-white">
                  {mode === "lesson-mode" || mode === "completion" ? selectedLesson.title : "Lessons"}
                </h2>
                <p className="text-xs text-[#98a4b3]">
                  {mode === "level-selection" ? "Choose your level" : mode === "course-map" ? "Course control" : "Coach panel"}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-full text-white/40">
                <Sparkles className="h-5 w-5" />
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {mode === "level-selection" ? (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h3 className="mb-3 text-sm font-black text-white">Оберіть рівень</h3>
                    <p className="mb-4 text-sm leading-6 text-[#aeb8c5]">
                      Спочатку система питає твій рівень. Після цього показуються тільки відповідні уроки.
                    </p>
                    <div className="space-y-2">
                      {LEVEL_ORDER.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => selectLevel(level)}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:border-[#82b64d]/40 hover:bg-white/[0.065]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-black text-white">{LESSON_LEVEL_META[level].title}</span>
                            <span className="text-[11px] font-bold text-[#c8ed9d]">{LESSON_LEVEL_META[level].range}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-[#aeb8c5]">{LESSON_LEVEL_META[level].description}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              ) : mode === "course-map" ? (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-white">Selected Level</h3>
                      <button
                        type="button"
                        onClick={() => setMode("level-selection")}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-sm font-black text-white">{selectedLevel ? LESSON_LEVEL_META[selectedLevel].title : "No level"}</p>
                    <p className="mt-1 text-xs leading-5 text-[#aeb8c5]">{selectedLevel ? LESSON_LEVEL_META[selectedLevel].description : "Choose a level first."}</p>
                    <Progress value={levelProgress} className="mt-4 h-2 bg-white/10" />
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h3 className="mb-3 text-sm font-black text-white">Selected Lesson</h3>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{selectedLesson.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#aeb8c5]">{selectedLesson.goal}</p>
                      </div>
                      <StatusBadge status={selectedStatus} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-xl border border-white/8 bg-black/18 p-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Time</div>
                        <div className="mt-1 text-xs font-black text-white">{selectedLesson.durationMinutes}m</div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-black/18 p-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">XP</div>
                        <div className="mt-1 text-xs font-black text-white">{selectedLesson.xp}</div>
                      </div>
                      <div className="rounded-xl border border-white/8 bg-black/18 p-2">
                        <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">Level</div>
                        <div className="mt-1 text-xs font-black text-white">{selectedLesson.difficulty}</div>
                      </div>
                    </div>
                  </section>

                  <PrimaryButton onClick={startLesson} disabled={lockedSelectedLesson}>
                    <Play className="h-5 w-5" />
                    Start Lesson
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={previewLesson}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-bold text-white/75 transition hover:bg-white/[0.08]"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                </div>
              ) : mode === "lesson-mode" ? (
                <div className="flex h-full flex-col">
                  <section className="flex items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-white/10 text-3xl">
                      🙂 
                    </div>
                    <div className="relative rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#111318] shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                      <div className="absolute left-[-10px] top-5 h-0 w-0 border-y-[9px] border-r-[12px] border-y-transparent border-r-white" />
                      {currentCoachText}
                    </div>
                  </section>

                  <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-black text-white">{selectedStep.title}</h3>
                      <span className="text-xs font-bold text-[#c8ed9d]">
                        {stepIndex + 1}/{selectedLesson.steps.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#aeb8c5]">{selectedStep.goal}</p>
                    {hintLevel > 0 ? (
                      <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                        <span className="font-black">Hint {hintLevel}: </span>
                        {selectedStep.hints[hintLevel - 1]}
                      </div>
                    ) : null}
                    {revealed ? (
                      <div className="mt-3 rounded-xl border border-[#82b64d]/25 bg-[#82b64d]/10 p-3 text-xs leading-5 text-[#e8f8d7]">
                        <span className="font-black">Reveal: </span>
                        {selectedStep.reveal}
                      </div>
                    ) : null}
                  </section>

                  <section className="mt-auto space-y-3 pt-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm font-black text-white">
                        <span>Випробування {stepIndex + 1}/{selectedLesson.steps.length}</span>
                        <span>{lessonProgress}%</span>
                      </div>
                      <Progress value={lessonProgress} className="h-3 bg-white/10" />
                    </div>

                    {selectedStep.kind !== "practice" || canContinueFromTask ? (
                      <PrimaryButton onClick={nextStep} disabled={primaryLessonDisabled}>
                        {selectedStep.kind === "complete" ? (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            Finish
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </PrimaryButton>
                    ) : null}

                    {selectedStep.kind === "practice" ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={previousStep}
                          disabled={stepIndex === 0}
                          className="h-10 rounded-xl border border-white/10 bg-white/[0.045] text-xs font-bold text-white/70 transition hover:bg-white/[0.08] disabled:opacity-35"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={showHint}
                          disabled={hintLevel >= 3}
                          className="h-10 rounded-xl border border-white/10 bg-white/[0.045] text-xs font-bold text-white/70 transition hover:bg-white/[0.08] disabled:opacity-35"
                        >
                          Hint
                        </button>
                        <button
                          type="button"
                          onClick={revealAnswer}
                          className="h-10 rounded-xl border border-white/10 bg-white/[0.045] text-xs font-bold text-white/70 transition hover:bg-white/[0.08]"
                        >
                          Reveal
                        </button>
                      </div>
                    ) : null}
                  </section>
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <section className="flex items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[22px] bg-white/10 text-3xl">
                      🙂 
                    </div>
                    <div className="relative rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#111318] shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                      <div className="absolute left-[-10px] top-5 h-0 w-0 border-y-[9px] border-r-[12px] border-y-transparent border-r-white" />
                      Good job! Now you know the key idea of this lesson.
                    </div>
                  </section>

                  <section className="mt-auto space-y-3 pt-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm font-black text-white">
                        <span>Випробування {selectedLesson.steps.length}/{selectedLesson.steps.length}</span>
                        <span>100%</span>
                      </div>
                      <Progress value={100} className="h-3 bg-white/10" />
                    </div>
                    <PrimaryButton onClick={continueAfterCompletion}>
                      Continue
                      <ArrowRight className="h-5 w-5" />
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={reviewLesson}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-bold text-white/75 transition hover:bg-white/[0.08]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Review Lesson
                    </button>
                  </section>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
