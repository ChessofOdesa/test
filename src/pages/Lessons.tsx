import ChessBoard from "@/components/ChessBoard";
import { Progress } from "@/components/ui/progress";
import { LESSON_LEVEL_META, LESSON_LEVELS, type LessonLevel, type LessonProgressState, type LessonRecord, type LessonTopic } from "@/data/lesson-levels";
import { createCleanLessonDiagramFen, filterLevelLessons, firstAvailableLesson, getLessonAction, getLessonEntryStep, getLessonStatus, getLevelLessons, isLessonUnlocked, localDayKey, type CourseFilter, type LessonAction, type LessonWorkspaceMode, LEVEL_ORDER, type MoveState, normalizeMove, PrimaryButton, readProgress, StatCard, writeProgress } from '@/features/lessons/model';
import { cn } from "@/lib/utils";
import { Chess, type Square } from "chess.js";
import { ArrowRight, BarChart3, Check, CheckCircle2, ChevronLeft, ChevronRight, Eye, Flame, Lightbulb, List, Lock, Medal, RotateCcw, Search, Target, Trophy, Zap } from "lucide-react";
import { LessonsIcon } from "@/components/icons/chess";
import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/lessons-workspace.css";
const difficultyLabel = { Easy: "Початковий", Medium: "Середній", Hard: "Складний" } as const;
const lessonActionLabel: Record<LessonAction, string> = {
    start: "Почати",
    continue: "Продовжити",
    repeat: "Повторити",
};
export default function Lessons() {
    const [progress, setProgress] = useState<LessonProgressState>(() => readProgress());
    const [mode, setMode] = useState<LessonWorkspaceMode>(() => (readProgress().selectedLevel ? "course-map" : "level-selection"));
    const [selectedLessonId, setSelectedLessonId] = useState(() => readProgress().currentLessonId || 1);
    const [stepIndex, setStepIndex] = useState(0);
    const [boardFen, setBoardFen] = useState(LESSON_LEVELS[0].fen);
    const [boardSize, setBoardSize] = useState(320);
    const [lastMove, setLastMove] = useState<string | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [moveState, setMoveState] = useState<MoveState>("idle");
    const [boardError, setBoardError] = useState("");
    const [completionLessonId, setCompletionLessonId] = useState<number | null>(null);
    const [completionAwardedXp, setCompletionAwardedXp] = useState(0);
    const [courseSearch, setCourseSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState<CourseFilter>("all");
    const [courseTopic, setCourseTopic] = useState<LessonTopic | "all">("all");
    const [catalogExpanded, setCatalogExpanded] = useState(false);
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
    const boardHostRef = useRef<HTMLElement>(null);
    useEffect(() => {
        writeProgress(progress);
    }, [progress]);
    useEffect(() => {
        if (mode === "level-selection") return;
        const syncBoardSize = () => {
            const width = boardHostRef.current?.clientWidth || window.innerWidth;
            const boardTop = boardHostRef.current?.getBoundingClientRect().top || 0;
            const heightForBoard = Math.max(230, window.innerHeight - boardTop - 82);
            setBoardSize(Math.round(Math.max(230, Math.min(width - 2, 500, heightForBoard))));
        };
        syncBoardSize();
        const observer = typeof ResizeObserver !== "undefined" && boardHostRef.current ? new ResizeObserver(syncBoardSize) : null;
        if (boardHostRef.current && observer) observer.observe(boardHostRef.current);
        window.addEventListener("resize", syncBoardSize);
        return () => { observer?.disconnect(); window.removeEventListener("resize", syncBoardSize); };
    }, [mode]);
    const selectedLevel = progress.selectedLevel;
    const levelLessons = useMemo(() => getLevelLessons(selectedLevel), [selectedLevel]);
    const availableTopics = useMemo(() => [...new Set(levelLessons.map((lesson) => lesson.topic))], [levelLessons]);
    const visibleLessons = useMemo(() => filterLevelLessons(levelLessons, courseSearch, courseFilter, progress.completedLessonIds, courseTopic), [levelLessons, courseSearch, courseFilter, courseTopic, progress.completedLessonIds]);
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
    const levelMeta = selectedLevel ? LESSON_LEVEL_META[selectedLevel] : null;
    const completionLesson = completionLessonId ? LESSON_LEVELS.find((lesson) => lesson.id === completionLessonId) : selectedLesson;
    const nextLesson = completionLesson
        ? getLevelLessons(completionLesson.level).find((lesson) => lesson.id > completionLesson.id)
        : null;
    const currentExpectedMove = selectedStep.expectedMove || selectedLesson.solutionMove;
    const targetSquare = selectedStep.targetSquare || currentExpectedMove?.slice(2, 4);
    const lessonDisplayFen = useMemo(() => (mode === "lesson-mode" ? createCleanLessonDiagramFen(boardFen, selectedLesson.id) : undefined), [boardFen, mode, selectedLesson.id]);
    const canContinueFromTask = !currentExpectedMove || moveState === "success" || revealed;
    const quizSolved = selectedStep.quiz && selectedQuizAnswer === selectedStep.quiz.correctIndex;
    const primaryLessonDisabled = (selectedStep.kind === "practice" || selectedStep.kind === "task") && !canContinueFromTask || Boolean(selectedStep.quiz && !quizSolved && !revealed);
    const isPracticeStep = selectedStep.kind === "practice" || selectedStep.kind === "task";
    const practiceTargetSquares = targetSquare && isPracticeStep && (hintLevel >= (selectedStep.targetRevealHint ?? 0) || revealed)
        ? [targetSquare as Square]
        : [];
    const boardInteractive = mode === "lesson-mode" && isPracticeStep && !revealed && moveState !== "success";
    const showPracticeMarkers = !isPracticeStep || hintLevel >= (selectedStep.targetRevealHint ?? 0) || revealed || moveState === "success";
    useEffect(() => {
        setBoardFen(selectedStep.fen || selectedLesson.fen);
        setLastMove(null);
        setRevealed(false);
        setMoveState("idle");
        setBoardError("");
        setSelectedQuizAnswer(null);
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
            lastFeedback: `Обрано рівень «${LESSON_LEVEL_META[level].title}».`,
        }));
        setSelectedLessonId(firstLesson.id);
        setStepIndex(0);
        setCourseSearch("");
        setCourseFilter("all");
        setCourseTopic("all");
        setCatalogExpanded(false);
        setMode("course-map");
    };
    const startLesson = (lesson: LessonRecord = selectedLesson) => {
        if (!selectedLevel || !isLessonUnlocked(lesson, progress.completedLessonIds)) {
            setFeedback("Спочатку оберіть доступний урок.");
            return;
        }
        const nextStepIndex = getLessonEntryStep(lesson, progress);
        setSelectedLessonId(lesson.id);
        setStepIndex(nextStepIndex);
        setBoardFen(lesson.steps[nextStepIndex]?.fen || lesson.fen);
        setLastMove(null);
        setMoveState("idle");
        setBoardError("");
        setRevealed(false);
        setSelectedQuizAnswer(null);
        setCatalogExpanded(false);
        setMode("lesson-mode");
        updateProgress((current) => ({
            ...current,
            currentLessonId: lesson.id,
            currentStepByLesson: { ...current.currentStepByLesson, [lesson.id]: nextStepIndex },
            hintLevelByLesson: { ...current.hintLevelByLesson, [lesson.id]: 0 },
            lastFeedback: lesson.steps[nextStepIndex]?.action || lesson.goal,
        }));
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
        setLastMove(null);
        setRevealed(false);
        setMoveState("idle");
        setBoardError("");
        setSelectedQuizAnswer(null);
        updateProgress((current) => ({
            ...current,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: next },
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: 0 },
            lastFeedback: selectedLesson.steps[next]?.action || "Добре, тепер дивись на наступний крок.",
        }));
    };
    const previousStep = () => {
        if (mode !== "lesson-mode")
            return;
        const previous = Math.max(stepIndex - 1, 0);
        setStepIndex(previous);
        setBoardFen(selectedLesson.steps[previous]?.fen || selectedLesson.fen);
        setLastMove(null);
        setRevealed(false);
        setMoveState("idle");
        setBoardError("");
        setSelectedQuizAnswer(null);
        updateProgress((current) => ({
            ...current,
            currentStepByLesson: { ...current.currentStepByLesson, [selectedLesson.id]: previous },
            hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: 0 },
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
        if (selectedStep.quiz) setSelectedQuizAnswer(selectedStep.quiz.correctIndex);
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
        setCompletionAwardedXp(alreadyCompleted ? 0 : selectedLesson.xp);
        const nextInLevel = getLevelLessons(selectedLesson.level).find((lesson) => lesson.id > selectedLesson.id);
        updateProgress((current) => ({
            ...current,
            completedLessonIds: alreadyCompleted ? current.completedLessonIds : [...current.completedLessonIds, selectedLesson.id],
            skippedLessonIds: current.skippedLessonIds.filter((id) => id !== selectedLesson.id),
            xp: alreadyCompleted ? current.xp : current.xp + selectedLesson.xp,
            streakDates: current.streakDates.includes(localDayKey()) ? current.streakDates : [...current.streakDates, localDayKey()],
            currentLessonId: nextInLevel?.id ?? selectedLesson.id,
            currentStepByLesson: {
                ...current.currentStepByLesson,
                [selectedLesson.id]: selectedLesson.steps.length - 1,
            },
            lastFeedback: `Урок «${selectedLesson.title}» пройдено.`,
        }));
        setCompletionLessonId(selectedLesson.id);
        setMode("completion");
    };
    const continueAfterCompletion = () => {
        setCatalogExpanded(true);
        if (nextLesson) {
            setSelectedLessonId(nextLesson.id);
            setMode("course-map");
            setFeedback(`Урок «${nextLesson.title}» відкрито. Оберіть його в каталозі або натисніть «Почати урок».`);
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
        setBoardError("");
        setSelectedQuizAnswer(null);
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
            const played = `${from}${to}${move.promotion || ""}`;
            if (isPracticeStep && currentExpectedMove) {
                if (normalizeMove(played) === normalizeMove(currentExpectedMove)) {
                    setMoveState("success");
                    setBoardError("");
                    setBoardFen(game.fen());
                    setLastMove(played);
                    setFeedback(selectedStep.successText || "Це правильний хід.");
                    return true;
                }
                else {
                    setMoveState("wrong");
                    const error = selectedStep.mistakeFeedback?.[played] || selectedStep.errorText || "Спробуй ще раз. Подивись на підказку справа.";
                    setBoardError(error);
                    setBoardFen(selectedStep.fen || selectedLesson.fen);
                    setLastMove(null);
                    updateProgress((current) => ({
                        ...current,
                        hintLevelByLesson: { ...current.hintLevelByLesson, [selectedLesson.id]: Math.max(1, hintLevel) },
                        lastFeedback: error,
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
    const answerQuiz = (answer: number) => {
        if (mode !== "lesson-mode" || !selectedStep.quiz || revealed) return;
        setSelectedQuizAnswer(answer);
        const correct = answer === selectedStep.quiz.correctIndex;
        setFeedback(correct ? selectedStep.quiz.feedback : "Спробуй іншу відповідь. Згадай ідею ходу на дошці.");
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
                        ? boardError
                        : selectedStep.text;
    const previewStep = mode === "course-map" ? selectedLesson.steps[0] : selectedStep;
    const previewFen = mode === "course-map" ? previewStep.fen || selectedLesson.fen : boardFen;
    const displayFen = mode !== "course-map"
        ? lessonDisplayFen
        : createCleanLessonDiagramFen(previewFen, selectedLesson.id);
    return (
        <div className="lessons-page">
            <div className="lessons-container">
                <h1 className="lessons-heading">Уроки</h1>
                <section className="lessons-progress" aria-label="Прогрес навчання">
                    <span className="lessons-progress-icon"><LessonsIcon size={25} aria-hidden="true" /></span>
                    <div className="lessons-progress-name">
                        <strong>{levelMeta?.title || "Шахові уроки"}</strong>
                        <span>{levelMeta?.range || `${LESSON_LEVELS.length} уроків у програмі`}</span>
                    </div>
                    <Progress value={selectedLevel ? levelProgress : totalProgress} className="lessons-progress-bar" />
                    <span className="lessons-progress-count">
                        {selectedLevel ? `${levelCompleted} із ${levelLessons.length}` : `${completedTotal} із ${LESSON_LEVELS.length}`}
                    </span>
                    <div className="lessons-progress-note">
                        <BarChart3 size={26} aria-hidden="true" />
                        <span>{levelMeta?.coachStyle || "Обери рівень і почни тренуватися."}</span>
                    </div>
                </section>

                {mode === "level-selection" ? (
                    <section className="lessons-choose" aria-label="Вибір рівня">
                        <h2>Оберіть рівень</h2>
                        <p>Уроки відкриваються послідовно. Прогрес зберігається в цьому браузері.</p>
                        <div className="lessons-level-cards">
                            {LEVEL_ORDER.map((level) => (
                                <button type="button" key={level} onClick={() => selectLevel(level)} className="lessons-level-card">
                                    <span className="lessons-progress-icon"><LessonsIcon size={24} aria-hidden="true" /></span>
                                    <strong>{LESSON_LEVEL_META[level].title}</strong>
                                    <span>{LESSON_LEVEL_META[level].description}</span>
                                    <small>{LESSON_LEVEL_META[level].range} <ArrowRight size={17} aria-hidden="true" /></small>
                                </button>
                            ))}
                        </div>
                        <div className="lessons-stats">
                            <StatCard icon={Target} label="Прогрес" value={`${totalProgress}%`} detail={`${completedTotal}/${LESSON_LEVELS.length} уроків`} />
                            <StatCard icon={Flame} label="Дні навчання" value={`${progress.streakDates.length}`} detail="із заняттями" />
                            <StatCard icon={Zap} label="Досвід" value={`${progress.xp}`} detail="отримано XP" />
                            <StatCard icon={Medal} label="Курс" value={`${LESSON_LEVELS.length}`} detail="уроків у програмі" />
                        </div>
                    </section>
                ) : (
                    <div className="lessons-workspace">
                        {mode === "lesson-mode" ? <button type="button" className="lessons-mobile-catalog-toggle" aria-controls="lessons-catalog" aria-expanded={catalogExpanded}
                            onClick={() => setCatalogExpanded((open) => !open)}><List size={18} aria-hidden="true" /> {catalogExpanded ? "Згорнути каталог уроків" : "Показати каталог уроків"}</button> : null}
                        <aside id="lessons-catalog" className={cn("lessons-catalog", mode === "lesson-mode" && !catalogExpanded && "is-mobile-collapsed")} aria-label="Каталог уроків">
                            <div className="lessons-level-switch" aria-label="Рівень курсу">
                                {LEVEL_ORDER.map((level) => (
                                    <button key={level} type="button" onClick={() => selectLevel(level)} aria-pressed={selectedLevel === level}>
                                        {LESSON_LEVEL_META[level].title}
                                    </button>
                                ))}
                            </div>
                            <label className="lessons-search">
                                <Search size={19} aria-hidden="true" />
                                <span className="sr-only">Пошук уроків</span>
                                <input type="text" inputMode="search" value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder="Знайти урок" />
                            </label>
                            <div className="lessons-filter" aria-label="Статус уроків">
                                {([['all', 'Усі'], ['available', 'Доступні'], ['completed', 'Пройдені']] as const).map(([filter, label]) => (
                                    <button key={filter} type="button" onClick={() => setCourseFilter(filter)} aria-pressed={courseFilter === filter}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <div className="lessons-topics" role="group" aria-label="Теми уроків">
                                {(["all", ...availableTopics] as const).map((topic) => (
                                    <button key={topic} type="button" onClick={() => setCourseTopic(topic)} aria-pressed={courseTopic === topic}>{topic === "all" ? "Усі теми" : topic}</button>
                                ))}
                            </div>
                            <p className="lessons-result-count" aria-live="polite">Показано {visibleLessons.length} із {levelLessons.length} уроків</p>
                            <div className="lessons-catalog-scroll">
                                {visibleLessons.map((lesson) => {
                                    const status = getLessonStatus(lesson, selectedLessonId, progress, recommendedLesson?.id ?? null);
                                    const locked = status === "locked";
                                    const action = getLessonAction(lesson, progress);
                                    const active = lesson.id === selectedLessonId;
                                    return (
                                        <div key={lesson.id} className={cn("lessons-catalog-card", active && "is-active", locked && "is-locked")}>
                                            <button type="button" onClick={() => startLesson(lesson)} disabled={locked}
                                                aria-label={`${lessonActionLabel[action]} урок ${lesson.id}: ${lesson.title}`}
                                                aria-current={active ? "true" : undefined} className="lessons-card-activate">
                                                <span className="lessons-card-number" aria-hidden="true">
                                                    {locked ? <Lock size={15} /> : status === "completed" ? <Check size={18} /> : lesson.id}
                                                </span>
                                                <span className="lessons-card-copy">
                                                    <strong>{lesson.title}</strong>
                                                    <span>{lesson.shortDescription}</span>
                                                    <small className="lessons-card-topic">{lesson.topic}</small>
                                                    {status === "completed" ? <small>Пройдено</small> : action === "continue" ? <small>Продовжити</small> : null}
                                                </span>
                                            </button>
                                            <span className="lessons-card-preview" aria-hidden="true">
                                                <ChessBoard initialFen={lesson.steps[0]?.fen || lesson.fen}
                                                    displayFen={createCleanLessonDiagramFen(lesson.steps[0]?.fen || lesson.fen, lesson.id)}
                                                    size={64} interactive={false} allowArrows={false} showLegalMoves={false} showChecks={false} showLastMove={false}
                                                    customLightSquareStyle={{ background: "#edf2f7" }} customDarkSquareStyle={{ background: "#91aac1" }}
                                                    customBoardStyle={{ borderRadius: 6 }} />
                                            </span>
                                        </div>
                                    );
                                })}
                                {visibleLessons.length === 0 ? <p className="lessons-empty">За цим запитом уроків немає. Змініть пошук або фільтр.</p> : null}
                            </div>
                        </aside>

                        <main className="lessons-stage" aria-label="Робоча область уроку">
                            <div className="lessons-stage-header">
                                <div>
                                    <h2>{selectedLesson.title}</h2>
                                    <p>{mode === "completion" ? "Урок завершено" : mode === "lesson-mode" ? `Крок ${stepIndex + 1} із ${selectedLesson.steps.length}` : selectedLesson.shortDescription}</p>
                                </div>
                                {mode === "lesson-mode" ? (
                                    <div className="lessons-step-nav">
                                        <button type="button" onClick={previousStep} disabled={stepIndex === 0} aria-label="Попередній крок"><ChevronLeft size={22} /></button>
                                        <button type="button" onClick={nextStep} disabled={primaryLessonDisabled} aria-label={stepIndex === selectedLesson.steps.length - 1 ? "Завершити урок" : "Наступний крок"}><ChevronRight size={22} /></button>
                                    </div>
                                ) : null}
                            </div>
                            {mode === "lesson-mode" ? <p className="lessons-mobile-context">{selectedStep.quiz?.question || selectedStep.text}</p> : null}
                            <section ref={boardHostRef} className="lessons-board-host" aria-label={`Шахівниця уроку ${selectedLesson.title}`}>
                                <ChessBoard key={`${selectedLesson.id}-${mode === "lesson-mode" ? selectedStep.id : "preview"}`}
                                    initialFen={previewFen} displayFen={displayFen} size={boardSize}
                                    onMove={handleBoardMove} interactive={boardInteractive} showLegalMoves={boardInteractive} showLastMove
                                    playerColor={boardInteractive ? (selectedStep.fen || selectedLesson.fen).split(" ")[1] as "w" | "b" : undefined}
                                    showDragTargets={boardInteractive} animationDuration={90}
                                    customDropSquareStyle={{ backgroundColor: "rgba(30, 126, 239, .3)", boxShadow: "inset 0 0 0 3px #1678ea" }}
                                    annotationSquares={mode === "lesson-mode" && showPracticeMarkers && selectedStep.demoSquares ? selectedStep.demoSquares as Square[] : []}
                                    targetSquares={mode === "lesson-mode" ? practiceTargetSquares : []}
                                    startSquares={mode === "lesson-mode" && selectedStep.startSquare ? [selectedStep.startSquare as Square] : []}
                                    blockedSquares={mode === "lesson-mode" && selectedStep.blockedSquares ? selectedStep.blockedSquares as Square[] : []}
                                    captureSquares={mode === "lesson-mode" && selectedStep.captureSquares ? selectedStep.captureSquares as Square[] : []}
                                    dangerSquares={mode === "lesson-mode" && selectedStep.dangerSquares ? selectedStep.dangerSquares as Square[] : []}
                                    customArrows={mode === "lesson-mode" && showPracticeMarkers && selectedStep.arrows ? selectedStep.arrows as [Square, Square][] : []}
                                    enableMoveSounds highlightSquares={targetSquare && mode === "lesson-mode" && moveState === "success"
                                        ? { squares: [targetSquare as Square], type: "correct" } : undefined}
                                    lastMoveSquares={lastMove && mode === "lesson-mode" ? [lastMove.slice(0, 2), lastMove.slice(2, 4)] as Square[] : []}
                                    customLightSquareStyle={{ background: "#eef1e9" }} customDarkSquareStyle={{ background: "#7196b5" }}
                                    customBoardStyle={{ borderRadius: 6, boxShadow: "0 4px 18px rgba(27,49,80,.12)", touchAction: boardInteractive ? "none" : "auto" }} />
                            </section>
                            {mode === "completion" ? (
                                <div className="lessons-completion" role="status" aria-live="polite">
                                    <span className="lessons-confetti" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
                                    <Trophy size={26} aria-hidden="true" />
                                    <span><strong>Урок «{completionLesson?.title}» пройдено!</strong><small>{completionAwardedXp ? `+${completionAwardedXp} XP · ` : ""}{nextLesson ? `Далі: ${nextLesson.title}.` : "Рівень завершено."}</small></span>
                                </div>
                            ) : mode === "lesson-mode" && isPracticeStep && !canContinueFromTask ? (
                                <p className="lessons-board-instruction">{selectedStep.action} Перетягніть фігуру на поле або натисніть фігуру й потім поле.</p>
                            ) : null}
                            <PrimaryButton onClick={mode === "course-map" ? () => startLesson() : mode === "completion" ? continueAfterCompletion : nextStep}
                                disabled={mode === "course-map" ? lockedSelectedLesson : mode === "lesson-mode" && primaryLessonDisabled}>
                                {mode === "course-map" ? `${lessonActionLabel[getLessonAction(selectedLesson, progress)]} урок`
                                    : mode === "completion" ? "Продовжити"
                                        : selectedStep.kind === "complete" ? "Завершити" : "Продовжити"}
                                {mode === "lesson-mode" && selectedStep.kind === "complete" ? <CheckCircle2 size={19} aria-hidden="true" /> : <ArrowRight size={19} aria-hidden="true" />}
                            </PrimaryButton>
                            {mode === "lesson-mode" && primaryLessonDisabled ? <p className="lessons-continue-note">{selectedStep.quiz ? "Оберіть правильну відповідь або перегляньте пояснення, щоб продовжити." : "Зробіть хід на шахівниці або перегляньте розв’язок, щоб продовжити."}</p> : null}
                        </main>

                        <aside className="lessons-guide" aria-label="Пояснення та кроки уроку">
                            <div className="lessons-guide-card">
                                {mode === "completion" ? (
                                    <>
                                        <span className="lessons-guide-eyebrow"><Trophy size={16} /> Урок пройдено</span>
                                        <h2>{completionLesson?.title}</h2>
                                        <p>Можна перейти до наступного уроку або повторити цей.</p>
                                        <div className="lessons-reward"><Zap size={19} /> {completionAwardedXp ? `Отримано ${completionAwardedXp} XP` : "Повторення без додаткових XP"}</div>
                                        <button type="button" className="lessons-guide-button" onClick={reviewLesson}><RotateCcw size={18} /> Повторити урок</button>
                                    </>
                                ) : mode === "course-map" ? (
                                    <>
                                        <span className="lessons-guide-eyebrow">Урок {selectedLesson.id} · {difficultyLabel[selectedLesson.difficulty]}</span>
                                        <h2>{selectedLesson.title}</h2>
                                        <p>{selectedLesson.goal}</p>
                                        <div className="lessons-lesson-facts"><span>{selectedLesson.durationMinutes} хв</span><span>{selectedLesson.xp} XP</span></div>
                                        <p className="lessons-guide-tip">Оберіть урок у каталозі або натисніть кнопку під шахівницею.</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="lessons-guide-eyebrow">Крок {stepIndex + 1} із {selectedLesson.steps.length}</span>
                                        <h2>{selectedStep.title}</h2>
                                        <p>{selectedStep.text}</p>
                                        <p className="lessons-step-goal">{selectedStep.goal}</p>
                                        {selectedStep.quiz ? (
                                            <div className="lessons-quiz" role="group" aria-label="Перевірка знань">
                                                <strong>{selectedStep.quiz.question}</strong>
                                                {selectedStep.quiz.options.map((answer, index) => (
                                                    <button type="button" key={answer} onClick={() => answerQuiz(index)} disabled={Boolean(quizSolved || revealed)}
                                                        className={cn(selectedQuizAnswer === index && (index === selectedStep.quiz?.correctIndex ? "is-correct" : "is-wrong"))}>
                                                        {answer}
                                                    </button>
                                                ))}
                                                {selectedQuizAnswer !== null ? <p role="status" aria-live="polite">{quizSolved || revealed ? selectedStep.quiz.feedback : "Ще не так. Перевір пояснення й спробуй знову."}</p> : null}
                                            </div>
                                        ) : null}
                                        {moveState !== "idle" || revealed ? <p className="lessons-feedback" role="status" aria-live="polite">{currentCoachText}</p> : null}
                                        {hintLevel > 0 ? <p className="lessons-hint" role="status"><strong>Підказка {hintLevel}:</strong> {selectedStep.hints[hintLevel - 1]}</p> : null}
                                        {revealed ? <p className="lessons-reveal" role="status"><strong>Розв’язок:</strong> {selectedStep.reveal}</p> : null}
                                        <div className="lessons-help-actions">
                                            <button type="button" onClick={showHint} disabled={hintLevel >= 3 || selectedStep.kind === "complete"}><Lightbulb size={19} /> Підказка</button>
                                            <button type="button" onClick={revealAnswer} disabled={revealed || selectedStep.kind === "complete"}><Eye size={19} /> Показати розв’язок</button>
                                        </div>
                                    </>
                                )}
                                <div className="lessons-timeline">
                                    <h3>Кроки уроку</h3>
                                    <ol>
                                        {selectedLesson.steps.map((step, index) => {
                                            const done = mode === "completion" || mode === "lesson-mode" && index < stepIndex;
                                            const current = mode !== "completion" && index === (mode === "lesson-mode" ? stepIndex : 0);
                                            return <li key={step.id} className={cn(done && "is-done", current && "is-current")} aria-current={current ? "step" : undefined}>
                                                <span className="lessons-timeline-mark" aria-hidden="true">{done ? <Check size={14} /> : index + 1}</span>
                                                <span>{step.title}</span>
                                            </li>;
                                        })}
                                    </ol>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
