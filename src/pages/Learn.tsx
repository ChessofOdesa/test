import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Square } from "chess.js";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Flame,
  GraduationCap,
  Lock,
  Play,
  Puzzle,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Users,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ChessBoard from "@/components/ChessBoard";
import PgnViewer from "@/components/PgnViewer";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  COURSES,
  type Course,
  type Lesson as CourseLesson,
  type LessonStep as CourseLessonStep,
} from "@/lib/courses-data";
import {
  AUDIENCE_SEGMENTS,
  COURSE_CATEGORY_LABELS,
  LEARNING_FEATURES,
  LESSON_FLOW,
  PROGRAM_LEVELS,
  getCoursesForProgramLevel,
  getProgramLevelById,
  type ProgramLevel,
  type ProgramLevelId,
} from "@/data/lesson-program";
import { getLessonStage2Meta } from "@/data/lesson-stage2";

type LessonPanel = "intro" | "theory" | "practice" | "quiz" | "homework";
type QuizAnswerMap = Record<number, number>;
type ContinueTarget = {
  level: ProgramLevel;
  course: Course;
  lesson: CourseLesson;
  lessonIndex: number;
};

type BoardFeedbackState = {
  type: "idle" | "correct" | "wrong";
  message: string;
};

const COMPLETED_STORAGE_KEY = "chess_lessons_completed";
const XP_STORAGE_KEY = "chess_lessons_xp";
const STREAK_STORAGE_KEY = "chess_lessons_streak_dates";

const CLAMP_TWO_LINES = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

const LEVEL_AUDIENCE_MAP: Record<ProgramLevelId, string[]> = {
  starter: ["kids-6-8", "adults-beginner"],
  novice: ["kids-9-12", "adults-beginner"],
  intermediate: ["teens-13-plus", "self-taught"],
  high: ["teens-13-plus", "self-taught"],
  expert: ["self-taught", "teens-13-plus"],
};

const LEARNING_TRACKS = [
  { title: "Основи", status: "live" },
  { title: "Тактика", status: "live" },
  { title: "Дебюти", status: "live" },
  { title: "Міттельшпіль", status: "live" },
  { title: "Кінцівки", status: "live" },
  { title: "Головоломки", status: "live" },
  { title: "Відеоуроки", status: "soon" },
  { title: "Аналіз партій", status: "soon" },
] as const;

const PANEL_META: Record<
  LessonPanel,
  { title: string; subtitle: string; icon: typeof Sparkles }
> = {
  intro: {
    title: "Вступ",
    subtitle: "мета й структура уроку",
    icon: Sparkles,
  },
  theory: {
    title: "Теорія",
    subtitle: "коротко й по суті",
    icon: BookOpen,
  },
  practice: {
    title: "Практика",
    subtitle: "ходи й розв'язання",
    icon: Target,
  },
  quiz: {
    title: "Вікторина",
    subtitle: "самоперевірка",
    icon: Puzzle,
  },
  homework: {
    title: "Домашнє",
    subtitle: "закріпити після уроку",
    icon: GraduationCap,
  },
};

const CATEGORY_META: Record<
  NonNullable<Course["category"]>,
  { icon: typeof BookOpen; tone: string }
> = {
  basics: {
    icon: BookOpen,
    tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  },
  openings: {
    icon: GraduationCap,
    tone: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  },
  tactics: {
    icon: Swords,
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  strategy: {
    icon: Brain,
    tone: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  },
  endgame: {
    icon: Trophy,
    tone: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  },
  attack: {
    icon: Target,
    tone: "border-red-400/20 bg-red-400/10 text-red-300",
  },
  psychology: {
    icon: Shield,
    tone: "border-teal-400/20 bg-teal-400/10 text-teal-300",
  },
  master: {
    icon: Crown,
    tone: "border-yellow-400/20 bg-yellow-400/10 text-yellow-200",
  },
};

function formatMinutes(minutes?: number) {
  if (!minutes) return "15-20 хв";
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} год ${rest} хв` : `${hours} год`;
}

function getCourseDuration(course: Course) {
  return course.lessons.reduce((sum, lesson) => sum + (lesson.estimatedMinutes ?? 20), 0);
}

function getCourseCategoryLabel(course: Course) {
  return course.category ? COURSE_CATEGORY_LABELS[course.category] : "Курс";
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function computeLearningStreak(dates: string[]) {
  if (!dates.length) return 0;
  const normalized = new Set(dates);
  const cursor = new Date();
  let streak = 0;

  while (true) {
    const stamp = cursor.toISOString().slice(0, 10);
    if (!normalized.has(stamp)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function isLessonUnlocked(course: Course, lessonIndex: number, completedLessons: Set<number>) {
  if (lessonIndex <= 0) return true;
  return completedLessons.has(course.lessons[lessonIndex - 1].id);
}

function getFirstOpenLesson(course: Course, completedLessons: Set<number>) {
  return (
    course.lessons.find(
      (lesson, index) =>
        isLessonUnlocked(course, index, completedLessons) &&
        !completedLessons.has(lesson.id),
    ) ??
    course.lessons.find((_, index) => isLessonUnlocked(course, index, completedLessons)) ??
    course.lessons[0]
  );
}

function findPanelStepIndex(lesson: CourseLesson, panel: LessonPanel) {
  if (panel === "intro" || panel === "homework") return 0;

  if (panel === "theory") {
    return lesson.steps.findIndex((step) => !step.type || step.type === "theory");
  }

  if (panel === "practice") {
    return lesson.steps.findIndex((step) => step.type && step.type !== "theory" && step.type !== "quiz");
  }

  return lesson.steps.findIndex((step) => step.quizOptions?.length);
}

function buildHomework(course: Course, lesson: CourseLesson, levelTitle: string) {
  const baseTasks = [
    `Своїми словами коротко сформулюй головну ідею уроку «${lesson.title}».`,
    "Повернись до прикладу на дошці та відтворюй головний план без підказок.",
  ];

  if (course.category === "tactics") {
    return [
      ...baseTasks,
      "Розв'яжи ще 5 задач на той самий мотив і познач, де саме сумнівався.",
    ];
  }

  if (course.category === "openings") {
    return [
      ...baseTasks,
      "Програй перші 8-10 ходів цієї схеми за білих і за чорних без підглядання.",
    ];
  }

  if (course.category === "endgame") {
    return [
      ...baseTasks,
      "Повтори техніку завершення кінцівки й доведи позицію до правильного результату.",
    ];
  }

  if (course.category === "psychology" || course.category === "master") {
    return [
      ...baseTasks,
      `Запиши одну практичну думку: як ця тема допоможе тобі на рівні «${levelTitle}».`,
    ];
  }

  return [
    ...baseTasks,
    "Підготуй один власний приклад з партії або аналізу, де ця тема реально працює.",
  ];
}

function getEarnedBadges(completedCount: number, totalXP: number, streak: number) {
  const badges: string[] = [];

  if (completedCount >= 1) badges.push("Перший урок");
  if (completedCount >= 5) badges.push("Темп навчання");
  if (totalXP >= 500) badges.push("Академія в русі");
  if (streak >= 3) badges.push("Серія");
  if (completedCount >= 12) badges.push("Системний гравець");

  return badges;
}

function ProgressRing({
  value,
  size = 88,
  caption,
  accent = "#81B64C",
}: {
  value: number;
  size?: number;
  caption?: string;
  accent?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  const strokeWidth = 8;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeValue / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-lg font-extrabold text-white">
          {Math.round(safeValue)}%
        </div>
        {caption ? (
          <div className="font-ui-mono text-[10px] uppercase tracking-[0.18em] text-[#94A08F]">
            {caption}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="lesson-surface-soft lesson-card-hover rounded-[22px] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">{label}</div>
          <div className="mt-2 font-display text-2xl font-extrabold text-white">{value}</div>
          <div className="mt-1 text-sm text-[#C9D0C5]">{hint}</div>
        </div>
        <div className="rounded-2xl border border-[#81B64C]/20 bg-[#81B64C]/10 p-2 text-[#B8E26D]">
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Learn() {
  const [selectedLevelId, setSelectedLevelId] = useState<ProgramLevelId>(PROGRAM_LEVELS[0].id);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<LessonPanel>("intro");
  const [boardStepIndex, setBoardStepIndex] = useState(0);
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerMap>({});
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [totalXP, setTotalXP] = useState(0);
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [boardSize, setBoardSize] = useState(360);
  const [boardFeedback, setBoardFeedback] = useState<BoardFeedbackState>({
    type: "idle",
    message: "",
  });
  const [solvedMoveTasks, setSolvedMoveTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedCompleted = localStorage.getItem(COMPLETED_STORAGE_KEY);
    const savedXP = localStorage.getItem(XP_STORAGE_KEY);
    const savedDates = localStorage.getItem(STREAK_STORAGE_KEY);

    if (savedCompleted) {
      setCompletedLessons(new Set<number>(JSON.parse(savedCompleted)));
    }
    if (savedXP) {
      setTotalXP(parseInt(savedXP, 10));
    }
    if (savedDates) {
      setCompletionDates(JSON.parse(savedDates));
    }
  }, []);

  useEffect(() => {
    const updateBoardSize = () => {
      const width = window.innerWidth;
      if (width < 390) {
        setBoardSize(Math.max(260, width - 32));
        return;
      }
      if (width < 768) {
        setBoardSize(Math.min(340, width - 40));
        return;
      }
      if (width < 1280) {
        setBoardSize(320);
        return;
      }
      setBoardSize(360);
    };

    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    return () => window.removeEventListener("resize", updateBoardSize);
  }, []);

  const selectedLevel = getProgramLevelById(selectedLevelId)!;
  const levelCourses = useMemo(() => getCoursesForProgramLevel(selectedLevelId), [selectedLevelId]);

  useEffect(() => {
    if (!levelCourses.length) {
      setSelectedCourseId(null);
      return;
    }

    if (!selectedCourseId || !levelCourses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(levelCourses[0].id);
    }
  }, [levelCourses, selectedCourseId]);

  const selectedCourse =
    levelCourses.find((course) => course.id === selectedCourseId) ?? levelCourses[0] ?? null;
  const selectedLesson =
    selectedCourse?.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const lessonStage2Meta = useMemo(
    () => (selectedLesson ? getLessonStage2Meta(selectedLesson.id) : undefined),
    [selectedLesson],
  );
  const boardSteps = selectedLesson?.steps ?? [];
  const boardStep = boardSteps[boardStepIndex] ?? null;
  const boardStepMeta = boardStep ? lessonStage2Meta?.steps?.[boardStepIndex] : undefined;
  const firstMoveCheckIndex = useMemo(() => {
    if (!lessonStage2Meta?.steps) return -1;

    return Object.entries(lessonStage2Meta.steps)
      .map(([index, meta]) => ({ index: Number(index), meta }))
      .sort((a, b) => a.index - b.index)
      .find((entry) => entry.meta.moveCheck)?.index ?? -1;
  }, [lessonStage2Meta]);
  const boardTaskKey =
    selectedLesson && boardStepMeta?.moveCheck ? `${selectedLesson.id}:${boardStepIndex}` : null;
  const boardTaskSolved = boardTaskKey ? solvedMoveTasks.has(boardTaskKey) : false;

  useEffect(() => {
    setActivePanel("intro");
    setBoardStepIndex(0);
    setPracticeChecked(false);
    setQuizAnswers({});
    setBoardFeedback({ type: "idle", message: "" });
  }, [selectedLessonId, selectedCourseId]);

  useEffect(() => {
    setBoardFeedback({ type: "idle", message: "" });
  }, [activePanel, boardStepIndex]);

  useEffect(() => {
    if (!selectedLesson) return;

    if (activePanel === "practice" && firstMoveCheckIndex >= 0) {
      setBoardStepIndex(firstMoveCheckIndex);
      return;
    }

    const matchingIndex = findPanelStepIndex(selectedLesson, activePanel);
    if (matchingIndex >= 0) {
      setBoardStepIndex(matchingIndex);
    }
  }, [activePanel, firstMoveCheckIndex, selectedLesson]);

  const totalLessons = useMemo(
    () => COURSES.reduce((sum, course) => sum + course.lessons.length, 0),
    [],
  );

  const completedCount = useMemo(() => {
    const allIds = new Set(COURSES.flatMap((course) => course.lessons.map((lesson) => lesson.id)));
    return Array.from(completedLessons).filter((id) => allIds.has(id)).length;
  }, [completedLessons]);

  const overallProgress = totalLessons ? (completedCount / totalLessons) * 100 : 0;
  const learningStreak = computeLearningStreak(completionDates);
  const earnedBadges = getEarnedBadges(completedCount, totalXP, learningStreak);

  const selectedAudienceSegments = useMemo(() => {
    const ids = LEVEL_AUDIENCE_MAP[selectedLevelId] ?? [];
    return AUDIENCE_SEGMENTS.filter((segment) => ids.includes(segment.id));
  }, [selectedLevelId]);

  const selectedCourseProgress = selectedCourse
    ? selectedCourse.lessons.filter((lesson) => completedLessons.has(lesson.id)).length
    : 0;

  const levelLessonCount = levelCourses.reduce((sum, course) => sum + course.lessons.length, 0);
  const levelCompletedCount = levelCourses
    .flatMap((course) => course.lessons)
    .filter((lesson) => completedLessons.has(lesson.id)).length;
  const selectedLevelProgress = levelLessonCount ? (levelCompletedCount / levelLessonCount) * 100 : 0;

  const recommendedCourse = useMemo(() => {
    if (!levelCourses.length) return null;

    return (
      levelCourses.find((course) =>
        course.lessons.some(
          (lesson, index) =>
            isLessonUnlocked(course, index, completedLessons) &&
            !completedLessons.has(lesson.id),
        ),
      ) ?? levelCourses[0]
    );
  }, [completedLessons, levelCourses]);

  const continueTarget = useMemo<ContinueTarget | null>(() => {
    for (const level of PROGRAM_LEVELS) {
      const courses = getCoursesForProgramLevel(level.id);

      for (const course of courses) {
        const lessonIndex = course.lessons.findIndex(
          (lesson, index) =>
            isLessonUnlocked(course, index, completedLessons) &&
            !completedLessons.has(lesson.id),
        );

        if (lessonIndex >= 0) {
          return {
            level,
            course,
            lesson: course.lessons[lessonIndex],
            lessonIndex,
          };
        }
      }
    }

    return null;
  }, [completedLessons]);

  const openCourseDetails = (course: Course) => {
    setSelectedCourseId(course.id);
    setSelectedLessonId(null);

    requestAnimationFrame(() => {
      document.getElementById("course-detail")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const startCourse = (course: Course) => {
    const lesson = getFirstOpenLesson(course, completedLessons);
    setSelectedCourseId(course.id);
    setSelectedLessonId(lesson?.id ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openLesson = (course: Course, lesson: CourseLesson, lessonIndex: number) => {
    if (!isLessonUnlocked(course, lessonIndex, completedLessons)) {
      toast("Спершу завершіть попередній урок цього курсу.");
      return;
    }

    setSelectedCourseId(course.id);
    setSelectedLessonId(lesson.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const answerQuiz = (stepIndex: number, answerIndex: number) => {
    setQuizAnswers((current) => ({ ...current, [stepIndex]: answerIndex }));
  };

  const theorySteps =
    selectedLesson?.steps.filter((step) => !step.type || step.type === "theory") ?? [];
  const practiceSteps =
    selectedLesson?.steps.filter(
      (step) => step.type && step.type !== "theory" && step.type !== "quiz",
    ) ?? [];
  const quizItems =
    selectedLesson?.steps
      .map((step, index) => (step.quizOptions?.length ? { step, index } : null))
      .filter(
        (
          item,
        ): item is { step: CourseLessonStep; index: number } => item !== null,
      ) ?? [];

  const quizCorrect = quizItems.filter(
    ({ step, index }) => quizAnswers[index] === step.quizAnswer,
  ).length;
  const quizScore = quizItems.length ? Math.round((quizCorrect / quizItems.length) * 100) : 0;

  const canCompleteLesson = selectedLesson
    ? completedLessons.has(selectedLesson.id) ||
      practiceChecked ||
      quizScore >= 80 ||
      (!practiceSteps.length && !quizItems.length)
    : false;
  const boardHighlightSquares =
    boardStepMeta?.moveCheck && (boardTaskSolved || boardFeedback.type !== "idle")
      ? {
          squares: [boardStepMeta.moveCheck.from, boardStepMeta.moveCheck.to] as Square[],
          type: boardFeedback.type === "wrong" ? "wrong" : ("correct" as const),
        }
      : undefined;
  const boardTaskMessage = boardStepMeta?.moveCheck
    ? boardTaskSolved
      ? boardStepMeta.moveCheck.successMessage
      : boardFeedback.message ||
        `Завдання: зроби хід ${boardStepMeta.moveCheck.from}-${boardStepMeta.moveCheck.to} на дошці праворуч.`
    : "";

  const handleBoardMove = (from: string, to: string) => {
    if (!boardStepMeta?.moveCheck) return true;

    const { moveCheck } = boardStepMeta;
    const success = from === moveCheck.from && to === moveCheck.to;

    if (success) {
      setBoardFeedback({ type: "correct", message: moveCheck.successMessage });
      setPracticeChecked(true);

      if (boardTaskKey) {
        setSolvedMoveTasks((current) => {
          const updated = new Set(current);
          updated.add(boardTaskKey);
          return updated;
        });
      }

      return true;
    }

    setBoardFeedback({ type: "wrong", message: moveCheck.failureMessage });
    return false;
  };

  const handleCompleteLesson = () => {
    if (!selectedLesson) return;

    if (!canCompleteLesson && !completedLessons.has(selectedLesson.id)) {
      toast("Завершіть практику або наберіть 80% у вікторині, щоб відкрити наступний урок.");
      return;
    }

    const updated = new Set(completedLessons);
    if (updated.has(selectedLesson.id)) {
      toast.success("Урок уже завершено.");
      return;
    }

    const gainedXP = selectedLesson.xp ?? 0;
    const nextXP = totalXP + gainedXP;
    const today = getTodayStamp();
    const nextDates = completionDates.includes(today) ? completionDates : [...completionDates, today];

    updated.add(selectedLesson.id);
    setCompletedLessons(updated);
    setTotalXP(nextXP);
    setCompletionDates(nextDates);

    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify([...updated]));
    localStorage.setItem(XP_STORAGE_KEY, String(nextXP));
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(nextDates));

    toast.success(`Урок завершено. +${gainedXP} XP`);
  };

  if (selectedLesson && selectedCourse) {
    const lessonIndex = selectedCourse.lessons.findIndex((lesson) => lesson.id === selectedLesson.id);
    const nextLesson =
      lessonIndex < selectedCourse.lessons.length - 1 ? selectedCourse.lessons[lessonIndex + 1] : null;
    const homeworkTasks = buildHomework(selectedCourse, selectedLesson, selectedLevel.title);
    const currentCategoryTone = selectedCourse.category
      ? CATEGORY_META[selectedCourse.category].tone
      : "border-white/10 bg-white/5 text-white";
    const currentCategoryIcon = selectedCourse.category
      ? CATEGORY_META[selectedCourse.category].icon
      : BookOpen;
    const CategoryIcon = currentCategoryIcon;

    return (
      <div className="min-h-screen bg-background pb-28 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="container space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSelectedLessonId(null)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#C9D0C5] transition-colors hover:text-white"
            >
              <ChevronLeft size={16} />
              До курсів
            </button>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#94A08F]">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {selectedLevel.title}
              </span>
              <span>{selectedCourse.title}</span>
              <span>
                урок {lessonIndex + 1}/{selectedCourse.lessons.length}
              </span>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_380px]">
            <aside className="order-3 space-y-4 xl:order-1 xl:sticky xl:top-6 xl:self-start">
              <div className="lesson-surface rounded-[28px] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[#94A08F]">курс</div>
                    <h2 className="mt-2 font-display text-xl font-extrabold text-white">
                      {selectedCourse.title}
                    </h2>
                  </div>
                  <ProgressRing
                    value={
                      selectedCourse.lessons.length
                        ? (selectedCourseProgress / selectedCourse.lessons.length) * 100
                        : 0
                    }
                    size={72}
                    caption="курс"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                      currentCategoryTone,
                    )}
                  >
                    <CategoryIcon size={14} />
                    {getCourseCategoryLabel(selectedCourse)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]">
                    {formatMinutes(getCourseDuration(selectedCourse))}
                  </div>
                </div>
              </div>

              <div className="lesson-surface-soft rounded-[26px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">Уроки курсу</div>
                  <div className="font-ui-mono text-xs uppercase tracking-[0.16em] text-[#94A08F]">
                    {selectedCourseProgress}/{selectedCourse.lessons.length}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {selectedCourse.lessons.map((lesson, index) => {
                    const unlocked = isLessonUnlocked(selectedCourse, index, completedLessons);
                    const done = completedLessons.has(lesson.id);
                    const active = lesson.id === selectedLesson.id;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => openLesson(selectedCourse, lesson, index)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                          active
                            ? "lesson-pill-active border-[#81B64C]/35 bg-[#81B64C]/10"
                            : "border-white/8 bg-white/[0.03] hover:border-[#81B64C]/25",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                              done
                                ? "border-[#81B64C]/25 bg-[#81B64C]/15 text-[#B8E26D]"
                                : unlocked
                                  ? "border-white/10 bg-white/5 text-[#C9D0C5]"
                                  : "border-white/8 bg-white/[0.04] text-[#707B73]",
                            )}
                          >
                            {done ? <CheckCircle2 size={14} /> : unlocked ? index + 1 : <Lock size={12} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{lesson.title}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#94A08F]">
                              <span>{formatMinutes(lesson.estimatedMinutes)}</span>
                              <span>{lesson.xp ?? 0} XP</span>
                            </div>
                            {!unlocked ? (
                              <div className="mt-2 text-xs text-[#BFA58A]">
                                Спершу завершiть попередній урок
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="order-1 space-y-4 xl:order-2">
              <section className="lesson-surface rounded-[30px] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-1.5 text-xs text-[#B8E26D]">
                      <Sparkles size={14} />
                      {completedLessons.has(selectedLesson.id)
                        ? "Пройдено"
                        : lessonIndex === 0
                          ? "Швидкий старт"
                          : "Наступний крок"}
                    </div>
                    <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                      {selectedLesson.title}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#C9D0C5]">
                      {selectedLesson.anchor ?? selectedLesson.summary}
                    </p>
                  </div>

                  <div className="lesson-surface-soft rounded-[24px] p-4">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Тривалість</div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-white">
                          <Clock3 size={16} className="text-[#B8E26D]" />
                          {formatMinutes(selectedLesson.estimatedMinutes)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Нагорода</div>
                        <div className="mt-2 flex items-center gap-2 text-sm text-white">
                          <Trophy size={16} className="text-[#B8E26D]" />
                          {selectedLesson.xp ?? 0} XP
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]">
                    Рівень: {selectedLevel.title}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]">
                    Категорія: {getCourseCategoryLabel(selectedCourse)}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]">
                    Формат: інтерактивний урок
                  </div>
                </div>
              </section>

              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-2 rounded-[24px] border border-white/8 bg-white/[0.03] p-2">
                  {(Object.entries(PANEL_META) as Array<[LessonPanel, (typeof PANEL_META)[LessonPanel]]>).map(
                    ([panelId, meta]) => {
                      const Icon = meta.icon;
                      const isActive = activePanel === panelId;

                      return (
                        <button
                          key={panelId}
                          onClick={() => setActivePanel(panelId)}
                          className={cn(
                            "lesson-card-hover inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-left",
                            isActive
                              ? "lesson-pill-active border border-[#81B64C]/25 bg-[#81B64C]/12 text-white"
                              : "border border-transparent bg-transparent text-[#94A08F] hover:text-white",
                          )}
                        >
                          <Icon size={16} className={isActive ? "text-[#B8E26D]" : "text-[#94A08F]"} />
                          <span>
                            <span className="block text-sm font-semibold">{meta.title}</span>
                            <span className="block text-[11px] uppercase tracking-[0.16em] text-[#94A08F]">
                              {meta.subtitle}
                            </span>
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <motion.section
                key={activePanel}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="lesson-surface rounded-[30px] p-5 md:p-6"
              >
                {activePanel === "intro" ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="lesson-surface-soft rounded-[22px] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Ціль уроку</div>
                        <div className="mt-3 text-sm leading-7 text-[#C9D0C5]">
                          {selectedLesson.summary}
                        </div>
                      </div>
                      <div className="lesson-surface-soft rounded-[22px] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Що перевіряємо</div>
                        <div className="mt-3 text-sm leading-7 text-[#C9D0C5]">
                          {selectedLevel.assessment}
                        </div>
                      </div>
                      <div className="lesson-surface-soft rounded-[22px] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Перехід далі</div>
                        <div className="mt-3 text-sm leading-7 text-[#C9D0C5]">
                          {selectedLevel.progressGate}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {LESSON_FLOW.map((step, index) => (
                        <div
                          key={step.id}
                          className="lesson-surface-soft rounded-[20px] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 text-sm font-semibold text-[#B8E26D]">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{step.title}</div>
                              <div className="mt-1 text-sm text-[#94A08F]">{step.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activePanel === "theory" ? (
                  <div className="space-y-4">
                    {(theorySteps.length ? theorySteps : selectedLesson.steps.slice(0, 2)).map((step) => (
                      <article
                        key={step.title}
                        className="lesson-surface-soft rounded-[22px] p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-white">{step.title}</div>
                            <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                              {step.explanation}
                            </div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#94A08F]">
                            {step.description}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {activePanel === "practice" ? (
                  <div className="space-y-4">
                    {boardStepMeta?.moveCheck ? (
                      <article className="lesson-surface-soft rounded-[22px] p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">Хід на дошці</div>
                            <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                              Перетягни фігуру на правій дошці та виконай навчальний хід{" "}
                              <span className="font-ui-mono text-[#B8E26D]">
                                {boardStepMeta.moveCheck.from}-{boardStepMeta.moveCheck.to}
                              </span>
                              . Після правильного рішення практика зарахується автоматично.
                            </div>
                          </div>
                          <div
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs font-semibold",
                              boardTaskSolved
                                ? "bg-[#6FCF97]/15 text-[#8EE5B3]"
                                : "bg-white/5 text-[#C9D0C5]",
                            )}
                          >
                            {boardTaskSolved ? "Зараховано" : "Очікує хід"}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "mt-4 rounded-2xl border px-4 py-3 text-sm",
                            boardTaskSolved || boardFeedback.type === "correct"
                              ? "border-[#6FCF97]/25 bg-[#6FCF97]/10 text-[#DDF8E7]"
                              : boardFeedback.type === "wrong"
                                ? "border-[#C0392B]/25 bg-[#C0392B]/10 text-[#F7C7C1]"
                                : "border-white/8 bg-white/[0.03] text-[#C9D0C5]",
                          )}
                        >
                          {boardTaskMessage}
                        </div>
                      </article>
                    ) : null}

                    {practiceSteps.length ? (
                      <>
                        {practiceSteps.map((step) => (
                          <article
                            key={step.title}
                            className="lesson-surface-soft rounded-[22px] p-5"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">{step.title}</div>
                                <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                                  {step.explanation}
                                </div>
                              </div>
                              {step.hint ? (
                                <div className="rounded-2xl border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-2 text-xs text-[#B8E26D]">
                                  Підказка: {step.hint}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        ))}

                        <div className="lesson-surface-soft rounded-[22px] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">Практичний блок</div>
                              <div className="mt-1 text-sm text-[#94A08F]">
                                {boardStepMeta?.moveCheck
                                  ? "Цей урок містить контрольний хід. Після правильного рішення прогрес зарахується автоматично."
                                  : "Відпрацюй приклади на дошці, а потім зафіксуй виконання."}
                              </div>
                            </div>
                            {boardStepMeta?.moveCheck ? (
                              <div
                                className={cn(
                                  "rounded-2xl border px-3 py-2 text-xs",
                                  boardTaskSolved
                                    ? "border-[#6FCF97]/25 bg-[#6FCF97]/10 text-[#8EE5B3]"
                                    : "border-white/8 bg-white/[0.03] text-[#94A08F]",
                                )}
                              >
                                {boardTaskSolved ? "Практика зарахована" : "Рішення очікується на дошці"}
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => setPracticeChecked(true)}
                                className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                              >
                                <CheckCircle2 size={16} className="mr-2" />
                                Позначити практику
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="lesson-surface-soft rounded-[22px] p-5">
                        <div className="text-sm font-semibold text-white">
                          {boardStepMeta?.moveCheck ? "Керована практика" : "Практика у вільному режимі"}
                        </div>
                        <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                          {boardStepMeta?.moveCheck
                            ? "У цьому уроці немає окремого списку практичних позицій, тому ключове завдання винесене на праву дошку. Виконай потрібний хід і одразу побачиш результат."
                            : "У цьому уроці основний акцент на демонстрації ідей. Використай дошку праворуч, щоб самостійно прокрутити приклади й перевірити хід думки."}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {activePanel === "quiz" ? (
                  <div className="space-y-4">
                    {quizItems.length ? (
                      <>
                        {quizItems.map(({ step, index }, questionIndex) => (
                          <article
                            key={`${step.title}-${index}`}
                            className="lesson-surface-soft rounded-[22px] p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">
                                  питання {questionIndex + 1}
                                </div>
                                <div className="mt-2 text-lg font-semibold text-white">{step.title}</div>
                                <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                                  {step.explanation}
                                </div>
                              </div>
                              {quizAnswers[index] !== undefined ? (
                                <div
                                  className={cn(
                                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                                    quizAnswers[index] === step.quizAnswer
                                      ? "bg-[#6FCF97]/15 text-[#8EE5B3]"
                                      : "bg-[#C0392B]/15 text-[#F59B92]",
                                  )}
                                >
                                  {quizAnswers[index] === step.quizAnswer ? "Вірно" : "Перевір ще раз"}
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-2">
                              {step.quizOptions?.map((option, answerIndex) => {
                                const selected = quizAnswers[index] === answerIndex;
                                const showCorrect = quizAnswers[index] !== undefined && answerIndex === step.quizAnswer;

                                return (
                                  <button
                                    key={option}
                                    onClick={() => answerQuiz(index, answerIndex)}
                                    className={cn(
                                      "rounded-2xl border px-4 py-3 text-left text-sm transition-all",
                                      showCorrect
                                        ? "border-[#6FCF97]/35 bg-[#6FCF97]/12 text-white"
                                        : selected
                                          ? "border-[#C0392B]/25 bg-[#C0392B]/10 text-white"
                                          : "border-white/8 bg-white/[0.03] text-[#C9D0C5] hover:border-[#81B64C]/25",
                                    )}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          </article>
                        ))}

                        <div className="lesson-surface-soft rounded-[22px] p-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Результат</div>
                              <div className="mt-2 font-display text-3xl font-extrabold text-white">
                                {quizScore}%
                              </div>
                              <div className="mt-1 text-sm text-[#C9D0C5]">
                                {quizCorrect} з {quizItems.length} правильних відповідей
                              </div>
                            </div>
                            <div className="max-w-[220px] text-sm leading-7 text-[#94A08F]">
                              Для завершення уроку тут потрібен результат від 80% або виконана практика.
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="lesson-surface-soft rounded-[22px] p-5">
                        <div className="text-sm font-semibold text-white">Швидка самоперевірка</div>
                        <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                          У цьому уроці немає окремої вікторини. Перевір себе, чи можеш пояснити головну ідею
                          та відтворити приклад на дошці.
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {activePanel === "homework" ? (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {homeworkTasks.map((task, index) => (
                        <div
                          key={task}
                          className="lesson-surface-soft rounded-[22px] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 text-sm font-semibold text-[#B8E26D]">
                              {index + 1}
                            </div>
                            <div className="text-sm leading-7 text-[#C9D0C5]">{task}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="lesson-surface-soft rounded-[22px] p-5">
                      <div className="text-sm font-semibold text-white">Що відкриється далі</div>
                      <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                        Після завершення уроку система порадить наступний крок у межах цього курсу або рівня.
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.section>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
                <div className="text-sm text-[#C9D0C5]">
                  {completedLessons.has(selectedLesson.id)
                    ? "Урок уже зараховано. Можна переходити далі."
                    : "Завершіть практику або вікторину, щоб зарахувати урок."}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedLessonId(null)}
                    className="h-11 rounded-2xl border-white/10 bg-transparent text-[#C9D0C5] hover:bg-white/5 hover:text-white"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    До курсу
                  </Button>
                  <Button
                    onClick={handleCompleteLesson}
                    className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Завершити урок
                  </Button>
                  {nextLesson ? (
                    <Button
                      onClick={() => openLesson(selectedCourse, nextLesson, lessonIndex + 1)}
                      variant="outline"
                      className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      Наступний
                      <ArrowRight size={16} className="ml-2" />
                    </Button>
                  ) : null}
                </div>
              </div>

              {completedLessons.has(selectedLesson.id) && nextLesson ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lesson-surface rounded-[28px] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-1.5 text-xs text-[#B8E26D]">
                        <WandSparkles size={14} />
                        Наступний крок
                      </div>
                      <div className="mt-3 font-display text-2xl font-extrabold text-white">
                        {nextLesson.title}
                      </div>
                      <div className="mt-2 text-sm text-[#C9D0C5]">
                        Перейди без зайвого скролу прямо до наступного уроку курсу.
                      </div>
                    </div>

                    <Button
                      onClick={() => openLesson(selectedCourse, nextLesson, lessonIndex + 1)}
                      className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                    >
                      Відкрити далі
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </div>

            <aside className="order-2 space-y-4 xl:order-3 xl:sticky xl:top-6 xl:self-start">
              <div className="lesson-surface rounded-[30px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Діаграма</div>
                    <div className="mt-2 text-lg font-semibold text-white">
                      {boardStep?.title ?? "Позиція уроку"}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]">
                    крок {boardStepIndex + 1}/{Math.max(boardSteps.length, 1)}
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <ChessBoard
                    key={`${selectedLesson.id}-${boardStepIndex}-${boardStep?.fen ?? "board"}`}
                    initialFen={boardStep?.fen}
                    size={boardSize}
                    interactive={activePanel === "practice"}
                    onMove={
                      activePanel === "practice" && boardStepMeta?.moveCheck && !boardTaskSolved
                        ? handleBoardMove
                        : undefined
                    }
                    annotationSquares={boardStepMeta?.circles}
                    customArrows={boardStepMeta?.arrows}
                    allowArrows={activePanel === "practice"}
                    highlightSquares={boardHighlightSquares}
                  />
                </div>

                <div className="mt-4 rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-white">
                    {boardStep?.description ?? "Навчальна позиція"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                    {boardStep?.explanation ??
                      "Перемикай кроки й пов'язуй пояснення з позицією на дошці."}
                  </div>
                  {boardStep?.hint ? (
                    <div className="mt-3 rounded-2xl border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-2 text-xs text-[#B8E26D]">
                      Підказка: {boardStep.hint}
                    </div>
                  ) : null}
                  {boardStepMeta?.focus ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-[#C9D0C5]">
                      Фокус уроку: {boardStepMeta.focus}
                    </div>
                  ) : null}
                  {boardStepMeta?.moveCheck ? (
                    <div
                      className={cn(
                        "mt-3 rounded-2xl border px-3 py-2 text-xs",
                        boardTaskSolved || boardFeedback.type === "correct"
                          ? "border-[#6FCF97]/25 bg-[#6FCF97]/10 text-[#CFF7DE]"
                          : boardFeedback.type === "wrong"
                            ? "border-[#C0392B]/25 bg-[#C0392B]/10 text-[#F7C7C1]"
                            : "border-white/10 bg-white/[0.04] text-[#C9D0C5]",
                      )}
                    >
                      {boardTaskMessage}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setBoardStepIndex((current) => Math.max(0, current - 1))}
                    disabled={boardStepIndex === 0}
                    className="h-11 flex-1 rounded-2xl border-white/10 bg-transparent text-[#C9D0C5] hover:bg-white/5 hover:text-white"
                  >
                    <ChevronLeft size={16} className="mr-2" />
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setBoardStepIndex((current) =>
                        Math.min(boardSteps.length - 1, current + 1),
                      )
                    }
                    disabled={boardStepIndex >= boardSteps.length - 1}
                    className="h-11 flex-1 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Далі
                    <ChevronRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>

              <div className="lesson-surface-soft rounded-[26px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">Кроки уроку</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[#94A08F]">
                    {lessonStage2Meta ? "Stage 2 live" : "Stage 1 live"}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {boardSteps.map((step, index) => {
                    const stepMeta = lessonStage2Meta?.steps?.[index];
                    const stepTaskKey =
                      selectedLesson && stepMeta?.moveCheck ? `${selectedLesson.id}:${index}` : null;
                    const stepSolved = stepTaskKey ? solvedMoveTasks.has(stepTaskKey) : false;

                    return (
                      <button
                        key={`${step.title}-${index}`}
                        onClick={() => setBoardStepIndex(index)}
                        className={cn(
                          "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                          index === boardStepIndex
                            ? "lesson-pill-active border-[#81B64C]/35 bg-[#81B64C]/10"
                            : "border-white/8 bg-white/[0.03] hover:border-[#81B64C]/25",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-[#C9D0C5]">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white">{step.title}</div>
                            <div className="mt-1 text-xs text-[#94A08F]">{step.description}</div>
                            {stepMeta?.moveCheck || stepMeta?.arrows || stepMeta?.circles ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {stepMeta?.moveCheck ? (
                                  <span
                                    className={cn(
                                      "rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.14em]",
                                      stepSolved
                                        ? "bg-[#6FCF97]/12 text-[#8EE5B3]"
                                        : "bg-[#81B64C]/12 text-[#B8E26D]",
                                    )}
                                  >
                                    {stepSolved ? "хід виконано" : "хід"}
                                  </span>
                                ) : null}
                                {stepMeta?.arrows?.length ? (
                                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#94A08F]">
                                    стрілки
                                  </span>
                                ) : null}
                                {stepMeta?.circles?.length ? (
                                  <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#94A08F]">
                                    фокус
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {lessonStage2Meta?.pgn ? (
                <div className="lesson-surface-soft rounded-[26px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {lessonStage2Meta.pgnTitle ?? "PGN-плейбек"}
                      </div>
                      {lessonStage2Meta.pgnDescription ? (
                        <div className="mt-1 text-xs leading-6 text-[#94A08F]">
                          {lessonStage2Meta.pgnDescription}
                        </div>
                      ) : null}
                    </div>
                    <div className="rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[#B8E26D]">
                      Stage 2
                    </div>
                  </div>

                  <div className="mt-3 lesson-pgn">
                    <PgnViewer pgn={lessonStage2Meta.pgn} className="lesson-pgn__viewer" />
                  </div>
                </div>
              ) : null}

              <div className="lesson-surface-soft rounded-[26px] p-4">
                <div className="text-sm font-semibold text-white">Інтерактивність дошки</div>
                <div className="mt-3 space-y-3 text-sm">
                  <div
                    className={cn(
                      "rounded-2xl border p-3 text-[#C9D0C5]",
                      lessonStage2Meta
                        ? "border-[#81B64C]/18 bg-[#81B64C]/10"
                        : "border-white/8 bg-white/[0.03]",
                    )}
                  >
                    <div className="font-semibold text-white">Stage 1</div>
                    <div className="mt-1">Базова дошка, step navigation, highlight логіки уроку.</div>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl border p-3",
                      lessonStage2Meta
                        ? "border-[#81B64C]/18 bg-[#81B64C]/10 text-[#C9D0C5]"
                        : "border-white/8 bg-white/[0.03] text-[#94A08F]",
                    )}
                  >
                    <div className="font-semibold text-white">Stage 2</div>
                    <div className="mt-1">
                      PGN playback, позначки, стрілки, фокус-клітини та контрольні ходи просто в уроці.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-[#94A08F]">
                    <div className="font-semibold text-white">Stage 3</div>
                    <div className="mt-1">Stockfish, розгалуження варіантів, анотації та глибший аналіз.</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>

        <div className="fixed inset-x-4 bottom-4 z-30 sm:hidden">
          <div className="rounded-[22px] border border-white/10 bg-[#1d211f]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur">
            {nextLesson && completedLessons.has(selectedLesson.id) ? (
              <Button
                onClick={() => openLesson(selectedCourse, nextLesson, lessonIndex + 1)}
                className="h-12 w-full rounded-2xl bg-[#81B64C] text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
              >
                Наступний урок
                <ArrowRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCompleteLesson}
                className="h-12 w-full rounded-2xl bg-[#81B64C] text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
              >
                Завершити урок
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12 pt-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="container space-y-6"
      >
        <section className="lesson-surface overflow-hidden rounded-[32px] p-5 md:p-6">
          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#B8E26D]">
                <WandSparkles size={14} />
                Уроки без зайвого скролу
              </div>

              <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                Оберіть свій рівень і запускайте курс одразу
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#C9D0C5] md:text-base">
                Вкладка перебудована як компактна академія: рівні, курси, прогрес і старт уроку
                знаходяться в одному керованому екрані.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {continueTarget ? (
                  <Button
                    onClick={() =>
                      openLesson(continueTarget.course, continueTarget.lesson, continueTarget.lessonIndex)
                    }
                    className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                  >
                    <Play size={16} className="mr-2" />
                    Продовжити навчання
                  </Button>
                ) : recommendedCourse ? (
                  <Button
                    onClick={() => startCourse(recommendedCourse)}
                    className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                  >
                    <Play size={16} className="mr-2" />
                    Почати зараз
                  </Button>
                ) : null}
                {selectedCourse ? (
                  <Button
                    variant="outline"
                    onClick={() => openCourseDetails(selectedCourse)}
                    className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                  >
                    Переглянути курс
                  </Button>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={BookOpen}
                  label="курсів"
                  value={String(COURSES.length)}
                  hint="у всіх рівнях програми"
                />
                <StatCard
                  icon={Trophy}
                  label="уроків"
                  value={String(totalLessons)}
                  hint={`${completedCount} завершено`}
                />
                <StatCard
                  icon={Users}
                  label="аудиторії"
                  value={String(AUDIENCE_SEGMENTS.length)}
                  hint="діти, підлітки, дорослі"
                />
                <StatCard
                  icon={Flame}
                  label="ваш XP"
                  value={String(totalXP)}
                  hint={learningStreak ? `серія ${learningStreak} дн.` : "почніть серію"}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {recommendedCourse ? (
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="lesson-surface-soft lesson-card-hover rounded-[28px] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#81B64C]/18 bg-[#81B64C]/10 px-3 py-1.5 text-xs text-[#B8E26D]">
                        <Sparkles size={14} />
                        Рекомендовано для тебе
                      </div>
                      <h2 className="mt-3 font-display text-2xl font-extrabold text-white">
                        {recommendedCourse.title}
                      </h2>
                    </div>
                    <ProgressRing
                      value={
                        recommendedCourse.lessons.length
                          ? (recommendedCourse.lessons.filter((lesson) => completedLessons.has(lesson.id)).length /
                              recommendedCourse.lessons.length) *
                            100
                          : 0
                      }
                      caption="курс"
                    />
                  </div>

                  <p className="mt-3 text-sm leading-7 text-[#C9D0C5]" style={CLAMP_TWO_LINES}>
                    {recommendedCourse.description}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#94A08F]">Уроків</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {recommendedCourse.lessons.length}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-[#94A08F]">Тривалість</div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {formatMinutes(getCourseDuration(recommendedCourse))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => startCourse(recommendedCourse)}
                      className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                    >
                      <Play size={16} className="mr-2" />
                      Почати
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openCourseDetails(recommendedCourse)}
                      className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      Переглянути уроки
                    </Button>
                  </div>
                </motion.div>
              ) : null}

              <div className="lesson-surface-soft rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Загальний прогрес</div>
                    <div className="mt-2 font-display text-3xl font-extrabold text-white">
                      {completedCount}/{totalLessons}
                    </div>
                  </div>
                  <ProgressRing value={overallProgress} caption="всього" />
                </div>

                <Progress value={overallProgress} className="mt-4 h-2 bg-white/10" />

                <div className="mt-4 flex flex-wrap gap-2">
                  {earnedBadges.length ? (
                    earnedBadges.slice(0, 4).map((badge) => (
                      <div
                        key={badge}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]"
                      >
                        <Star size={12} className="text-[#B8E26D]" />
                        {badge}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[#94A08F]">
                      Завершіть перший урок, щоб запустити прогрес і бейджі.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="lesson-surface rounded-[28px] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BarChart3 size={16} className="text-[#B8E26D]" />
                Рівні програми
              </div>

              <div className="mt-4 space-y-2">
                {PROGRAM_LEVELS.map((level) => {
                  const courses = getCoursesForProgramLevel(level.id);
                  const done = courses
                    .flatMap((course) => course.lessons)
                    .filter((lesson) => completedLessons.has(lesson.id)).length;
                  const total = courses.reduce((sum, course) => sum + course.lessons.length, 0);
                  const value = total ? (done / total) * 100 : 0;
                  const active = level.id === selectedLevelId;

                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedLevelId(level.id)}
                      className={cn(
                        "lesson-card-hover w-full rounded-[22px] border px-4 py-4 text-left",
                        active
                          ? "lesson-pill-active border-[#81B64C]/35 bg-[#81B64C]/10"
                          : "border-white/8 bg-white/[0.03] hover:border-[#81B64C]/25",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{level.title}</div>
                          <div className="mt-1 text-xs text-[#94A08F]">{level.subtitle}</div>
                        </div>
                        <div className="font-ui-mono text-xs text-[#94A08F]">{level.ratingLabel}</div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-[#94A08F]">Прогрес</span>
                        <span className="font-semibold text-white">
                          {done}/{total}
                        </span>
                      </div>
                      <Progress value={value} className="mt-2 h-2 bg-white/10" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lesson-surface-soft rounded-[26px] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Users size={16} className="text-[#B8E26D]" />
                Кому підходить
              </div>

              <div className="mt-4 space-y-3">
                {selectedAudienceSegments.map((segment) => (
                  <div key={segment.id} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="text-sm font-semibold text-white">{segment.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#94A08F]">{segment.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section className="lesson-surface rounded-[30px] p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-xs uppercase tracking-[0.24em] text-[#94A08F]">
                    {selectedLevel.ratingLabel}
                  </div>
                  <h2 className="mt-3 font-display text-3xl font-extrabold text-white md:text-4xl">
                    {selectedLevel.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#C9D0C5] md:text-base">
                    {selectedLevel.description}
                  </p>
                </div>
                <ProgressRing value={selectedLevelProgress} caption="рівень" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {selectedLevel.goals.slice(0, 3).map((goal) => (
                  <div key={goal} className="lesson-surface-soft rounded-[22px] p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 p-2 text-[#B8E26D]">
                        <CheckCircle2 size={14} />
                      </div>
                      <div className="text-sm leading-7 text-[#C9D0C5]">{goal}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {selectedLevel.ageGroups.map((group) => (
                  <div
                    key={group}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]"
                  >
                    {group}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {LEARNING_TRACKS.map((track) => (
                  <div
                    key={track.title}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs",
                      track.status === "live"
                        ? "border-[#81B64C]/20 bg-[#81B64C]/10 text-[#B8E26D]"
                        : "border-white/10 bg-white/5 text-[#94A08F]",
                    )}
                  >
                    {track.title}
                    {track.status === "soon" ? " · скоро" : ""}
                  </div>
                ))}
              </div>
            </section>

            <section className="lesson-surface rounded-[30px] p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-[#94A08F]">Курси рівня</div>
                  <h3 className="mt-2 font-display text-2xl font-extrabold text-white">
                    Усі курси видно відразу
                  </h3>
                  <p className="mt-2 text-sm text-[#94A08F]">
                    Без довгого скролу вниз: обираєте рівень, бачите курси, запускаєте урок.
                  </p>
                </div>
                <div className="font-ui-mono text-xs uppercase tracking-[0.16em] text-[#94A08F]">
                  {levelCourses.length} курс(и)
                </div>
              </div>

              <div className="mt-5 grid gap-4 2xl:grid-cols-2">
                {levelCourses.map((course) => {
                  const doneCount = course.lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
                  const value = course.lessons.length ? (doneCount / course.lessons.length) * 100 : 0;
                  const categoryTone = course.category
                    ? CATEGORY_META[course.category].tone
                    : "border-white/10 bg-white/5 text-white";
                  const CategoryIcon = course.category
                    ? CATEGORY_META[course.category].icon
                    : BookOpen;

                  return (
                    <motion.article
                      key={course.id}
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "lesson-surface-soft lesson-card-hover rounded-[26px] p-5",
                        selectedCourse?.id === course.id && "border-[#81B64C]/25 bg-[#81B64C]/[0.07]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs",
                              categoryTone,
                            )}
                          >
                            <CategoryIcon size={14} />
                            {getCourseCategoryLabel(course)}
                          </div>
                          <h4 className="mt-3 text-xl font-semibold text-white">{course.title}</h4>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#C9D0C5]">
                          {selectedLevel.title}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-[#C9D0C5]" style={CLAMP_TWO_LINES}>
                        {course.description}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#94A08F]">Уроки</div>
                          <div className="mt-2 text-base font-semibold text-white">{course.lessons.length}</div>
                        </div>
                        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#94A08F]">Час</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {formatMinutes(getCourseDuration(course))}
                          </div>
                        </div>
                        <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-3 text-center">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-[#94A08F]">Прогрес</div>
                          <div className="mt-2 text-base font-semibold text-white">
                            {doneCount}/{course.lessons.length}
                          </div>
                        </div>
                      </div>

                      <Progress value={value} className="mt-4 h-2 bg-white/10" />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {course.lessons.slice(0, 3).map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#94A08F]"
                          >
                            {lesson.title}
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button
                          onClick={() => startCourse(course)}
                          className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                        >
                          <Play size={16} className="mr-2" />
                          Почати
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openCourseDetails(course)}
                          className="h-11 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          Переглянути уроки
                        </Button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </section>

            {selectedCourse ? (
              <section id="course-detail" className="lesson-surface rounded-[30px] p-5 md:p-6">
                <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 px-3 py-1.5 text-xs text-[#B8E26D]">
                          <Sparkles size={14} />
                          Рівень 2: сторінка курсу
                        </div>
                        <h3 className="mt-3 font-display text-3xl font-extrabold text-white">
                          {selectedCourse.title}
                        </h3>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#C9D0C5]">
                          {selectedCourse.description}
                        </p>
                      </div>

                      <ProgressRing
                        value={
                          selectedCourse.lessons.length
                            ? (selectedCourseProgress / selectedCourse.lessons.length) * 100
                            : 0
                        }
                        caption="курс"
                      />
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="lesson-surface-soft rounded-[22px] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Для кого</div>
                        <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                          {selectedLevel.ageGroups.join(", ")}
                        </div>
                      </div>
                      <div className="lesson-surface-soft rounded-[22px] p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-[#94A08F]">Критерій переходу</div>
                        <div className="mt-2 text-sm leading-7 text-[#C9D0C5]">
                          {selectedLevel.progressGate}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedAudienceSegments.flatMap((segment) => segment.focus).slice(0, 6).map((focus) => (
                        <div
                          key={focus}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C9D0C5]"
                        >
                          {focus}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Button
                        onClick={() => startCourse(selectedCourse)}
                        className="h-11 rounded-2xl bg-[#81B64C] px-5 text-sm font-semibold text-[#182114] hover:bg-[#6FA040]"
                      >
                        <Play size={16} className="mr-2" />
                        Почати курс
                      </Button>
                    </div>

                    <div className="mt-6 max-h-[920px] space-y-3 overflow-y-auto pr-1">
                      {selectedCourse.lessons.map((lesson, index) => {
                        const unlocked = isLessonUnlocked(selectedCourse, index, completedLessons);
                        const done = completedLessons.has(lesson.id);
                        const isNext =
                          !done &&
                          unlocked &&
                          selectedCourse.lessons
                            .slice(0, index)
                            .every((item) => completedLessons.has(item.id));

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => openLesson(selectedCourse, lesson, index)}
                            className={cn(
                              "lesson-card-hover w-full rounded-[22px] border px-4 py-4 text-left",
                              done
                                ? "border-[#81B64C]/20 bg-[#81B64C]/10"
                                : unlocked
                                  ? "border-white/8 bg-white/[0.03] hover:border-[#81B64C]/25"
                                  : "border-white/8 bg-white/[0.02]",
                            )}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                                    done
                                      ? "border-[#81B64C]/25 bg-[#81B64C]/15 text-[#B8E26D]"
                                      : unlocked
                                        ? "border-white/10 bg-white/5 text-[#C9D0C5]"
                                        : "border-white/8 bg-white/[0.04] text-[#707B73]",
                                  )}
                                >
                                  {done ? <CheckCircle2 size={15} /> : unlocked ? index + 1 : <Lock size={13} />}
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-white">{lesson.title}</div>
                                    {done ? (
                                      <span className="rounded-full bg-[#6FCF97]/15 px-2.5 py-1 text-[11px] text-[#8EE5B3]">
                                        Пройдено
                                      </span>
                                    ) : isNext ? (
                                      <span className="rounded-full bg-[#81B64C]/15 px-2.5 py-1 text-[11px] text-[#B8E26D]">
                                        Наступний крок
                                      </span>
                                    ) : !unlocked ? (
                                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#94A08F]">
                                        Закрито
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[#C9D0C5]">
                                        Новий
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-sm leading-7 text-[#94A08F]">
                                    {lesson.anchor ?? lesson.summary}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#94A08F]">
                                    <span>{formatMinutes(lesson.estimatedMinutes)}</span>
                                    <span>{lesson.xp ?? 0} XP</span>
                                  </div>
                                </div>
                              </div>

                              {!unlocked ? (
                                <div className="max-w-[220px] text-right text-xs text-[#BFA58A]">
                                  Завершіть попередній урок, щоб відкрити цей блок.
                                </div>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="lesson-surface-soft rounded-[24px] p-4">
                      <div className="text-sm font-semibold text-white">Формат кожного уроку</div>
                      <div className="mt-3 grid gap-2">
                        {LESSON_FLOW.map((step, index) => (
                          <div
                            key={step.id}
                            className="flex items-start gap-3 rounded-[18px] border border-white/8 bg-white/[0.03] p-3"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#81B64C]/20 bg-[#81B64C]/10 text-xs font-semibold text-[#B8E26D]">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{step.title}</div>
                              <div className="mt-1 text-xs leading-6 text-[#94A08F]">{step.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lesson-surface-soft rounded-[24px] p-4">
                      <div className="text-sm font-semibold text-white">Інтерактивність і якість UX</div>
                      <div className="mt-3 space-y-3">
                        {LEARNING_FEATURES.map((feature) => (
                          <div
                            key={feature.title}
                            className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">{feature.title}</div>
                                <div className="mt-1 text-sm leading-6 text-[#94A08F]">
                                  {feature.description}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
                                  feature.status === "strengthened"
                                    ? "bg-[#81B64C]/15 text-[#B8E26D]"
                                    : "bg-white/5 text-[#94A08F]",
                                )}
                              >
                                {feature.status === "strengthened" ? "оновлено" : "активно"}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
