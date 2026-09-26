import { createDefaultLessonProgress, LEGACY_LESSON_PROGRESS_STORAGE_KEY, LESSON_LEVELS, LESSON_PROGRESS_STORAGE_KEY, type LessonLevel, type LessonProgressState, type LessonRecord } from "@/data/lesson-levels";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
export type LessonWorkspaceMode = "level-selection" | "course-map" | "lesson-mode" | "completion";
export type LessonStatus = "completed" | "locked" | "recommended" | "selected" | "skipped" | "open";
export type MoveState = "idle" | "success" | "wrong";
export type CourseFilter = "all" | "available" | "completed";
export function localDayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const LEVEL_ORDER: LessonLevel[] = ["beginner", "amateur", "master"];
export function isLessonLevel(value: unknown): value is LessonLevel {
    return value === "beginner" || value === "amateur" || value === "master";
}
export function levelFromLessonId(id: number): LessonLevel {
    return LESSON_LEVELS.find((lesson) => lesson.id === id)?.level || "beginner";
}
export function sanitizeProgress(raw: Partial<LessonProgressState> | null): LessonProgressState {
    const fallback = createDefaultLessonProgress();
    if (!raw)
        return fallback;
    const currentLessonId = Number.isFinite(raw.currentLessonId)
        ? Number(raw.currentLessonId)
        : fallback.currentLessonId;
    return {
        selectedLevel: raw.selectedLevel === null ? null : isLessonLevel(raw.selectedLevel) ? raw.selectedLevel : levelFromLessonId(currentLessonId),
        completedLessonIds: Array.isArray(raw.completedLessonIds) ? raw.completedLessonIds : [],
        skippedLessonIds: Array.isArray(raw.skippedLessonIds) ? raw.skippedLessonIds : [],
        xp: Number.isFinite(raw.xp) ? Number(raw.xp) : 0,
        streakDates: Array.isArray(raw.streakDates) ? raw.streakDates : [],
        currentLessonId,
        currentStepByLesson: raw.currentStepByLesson && typeof raw.currentStepByLesson === "object"
            ? raw.currentStepByLesson
            : {},
        hintLevelByLesson: raw.hintLevelByLesson && typeof raw.hintLevelByLesson === "object"
            ? raw.hintLevelByLesson
            : {},
        lastFeedback: raw.lastFeedback || fallback.lastFeedback,
    };
}
export function readProgress(): LessonProgressState {
    if (typeof window === "undefined")
        return createDefaultLessonProgress();
    try {
        const nextRaw = window.localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY);
        if (nextRaw)
            return sanitizeProgress(JSON.parse(nextRaw));
        const legacyRaw = window.localStorage.getItem(LEGACY_LESSON_PROGRESS_STORAGE_KEY);
        if (legacyRaw)
            return sanitizeProgress(JSON.parse(legacyRaw));
    }
    catch {
        return createDefaultLessonProgress();
    }
    return createDefaultLessonProgress();
}
export function writeProgress(progress: LessonProgressState) {
    if (typeof window === "undefined")
        return;
    window.localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}
export function normalizeMove(move: string | null) {
    return (move || "").toLowerCase().replace(/[^a-h1-8qrbn]/g, "");
}
export function compressFenRank(rank: string) {
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
export function createCleanLessonDiagramFen(fen: string | undefined, lessonId: number) {
    if (!fen || lessonId > 7)
        return undefined;
    const [placement, ...rest] = fen.split(" ");
    const keepPiece = (piece: string) => {
        if (!/[prnbqkPRNBQK]/.test(piece))
            return true;
        if (lessonId === 6)
            return piece !== "k";
        if (lessonId === 7)
            return piece === piece.toUpperCase();
        return piece !== "K" && piece !== "k";
    };
    const ranks = placement.split("/").map((rank) => {
        let expanded = "";
        for (const char of rank) {
            expanded += /\d/.test(char) ? "1".repeat(Number(char)) : char;
        }
        return compressFenRank(expanded
            .split("")
            .map((piece) => (keepPiece(piece) ? piece : "1"))
            .join(""));
    });
    return [ranks.join("/"), ...rest].join(" ");
}
export function getLevelLessons(level: LessonLevel | null) {
    return level ? LESSON_LEVELS.filter((lesson) => lesson.level === level) : [];
}
export function firstAvailableLesson(level: LessonLevel, completedLessonIds: number[]) {
    const lessons = getLevelLessons(level);
    return lessons.find((lesson, index) => !completedLessonIds.includes(lesson.id) &&
        (index === 0 || completedLessonIds.includes(lessons[index - 1].id))) || lessons[lessons.length - 1];
}
export function filterLevelLessons(lessons: LessonRecord[], query: string, filter: CourseFilter, completedLessonIds: number[]) {
    const search = query.trim().toLocaleLowerCase("uk");
    return lessons.filter((lesson) => {
        const matchesSearch = !search || `${lesson.title} ${lesson.shortDescription}`.toLocaleLowerCase("uk").includes(search);
        const completed = completedLessonIds.includes(lesson.id);
        const matchesFilter = filter === "all" || (filter === "completed" ? completed : !completed && isLessonUnlocked(lesson, completedLessonIds));
        return matchesSearch && matchesFilter;
    });
}
export function isLessonUnlocked(lesson: LessonRecord, completedLessonIds: number[]) {
    const lessons = getLevelLessons(lesson.level);
    const index = lessons.findIndex((item) => item.id === lesson.id);
    return index === 0 || completedLessonIds.includes(lessons[index - 1]?.id);
}
export function getLessonStatus(lesson: LessonRecord, selectedLessonId: number, progress: LessonProgressState, recommendedLessonId: number | null): LessonStatus {
    if (progress.completedLessonIds.includes(lesson.id))
        return "completed";
    if (!isLessonUnlocked(lesson, progress.completedLessonIds))
        return "locked";
    if (lesson.id === selectedLessonId)
        return "selected";
    if (progress.skippedLessonIds.includes(lesson.id))
        return "skipped";
    if (lesson.id === recommendedLessonId)
        return "recommended";
    return "open";
}
export function StatusBadge({ status }: {
    status: LessonStatus;
}) {
    const styles: Record<LessonStatus, string> = {
        completed: "border-emerald-400/35 bg-emerald-400/12 text-emerald-700",
        locked: "border-border bg-secondary text-muted-foreground",
        recommended: "border-amber-300/45 bg-amber-300/12 text-amber-700",
        selected: "border-primary/30 bg-accent text-primary",
        skipped: "border-orange-300/35 bg-orange-300/12 text-orange-700",
        open: "border-border bg-secondary text-muted-foreground",
    };
    const copy: Record<LessonStatus, string> = {
        completed: "Пройдено",
        locked: "Закрито",
        recommended: "Радимо",
        selected: "Обрано",
        skipped: "Не завершено",
        open: "Доступно",
    };
    return (<span className={cn("rounded-full border px-2.5 py-1 text-sm font-black uppercase tracking-[0.12em]", styles[status])}>
      {copy[status]}
    </span>);
}
export function StatCard({ icon: Icon, label, value, detail, }: {
    icon: typeof Trophy;
    label: string;
    value: string;
    detail: string;
}) {
    return (<div className="rounded-2xl border border-border bg-secondary p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-primary">
          <Icon className="h-4 w-4"/>
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>);
}
export function PrimaryButton({ children, onClick, disabled, }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (<button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-base font-black text-primary-foreground shadow-sm transition hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-45">
      {children}
    </button>);
}
