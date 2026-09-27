import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Chess } from "chess.js";
import Lessons from "@/pages/Lessons";
import { LESSON_LEVELS, LESSON_PROGRESS_STORAGE_KEY, createDefaultLessonProgress } from "@/data/lesson-levels";
import { filterLevelLessons, firstAvailableLesson, getLessonAction, getLessonEntryStep, readProgress, sanitizeProgress } from "@/features/lessons/model";

vi.mock("@/components/ChessBoard", () => ({
  default: ({ onMove, interactive }: { onMove: (from: string, to: string) => boolean; interactive: boolean }) => (
    <div data-testid="lesson-board">
      <button type="button" disabled={!interactive} onClick={() => onMove("e2", "e3")}>Хід e2–e3</button>
    </div>
  ),
}));

afterEach(() => { cleanup(); localStorage.clear(); });

describe("Lessons course and player flow", () => {
  it("keeps the first seven lessons readable in Ukrainian and their practice moves legal", () => {
    const ukrainian = /[А-Яа-яІіЇїЄєҐґ]/;
    for (const lesson of LESSON_LEVELS.slice(0, 7)) {
      expect(lesson.steps).toHaveLength(5);
      for (const step of lesson.steps) {
        const copy = [step.title, step.text, step.goal, step.action, ...step.hints, step.reveal, step.errorText, step.successText].filter(Boolean);
        for (const phrase of copy) expect(phrase).toMatch(ukrainian);
        if (!step.expectedMove) continue;
        expect(step.targetSquare).toBe(step.expectedMove.slice(2, 4));
        const game = new Chess(step.fen ?? lesson.fen);
        const move = game.move({ from: step.expectedMove.slice(0, 2), to: step.expectedMove.slice(2, 4) });
        expect(move).not.toBeNull();
      }
    }
  });

  it("keeps an explicit unselected level and recommends the next incomplete lesson", () => {
    expect(sanitizeProgress({ ...createDefaultLessonProgress(), selectedLevel: null }).selectedLevel).toBeNull();
    expect(firstAvailableLesson("beginner", [1, 2]).id).toBe(3);
    expect(firstAvailableLesson("beginner", LESSON_LEVELS.filter((lesson) => lesson.level === "beginner").map((lesson) => lesson.id)).id).toBe(15);
  });

  it("starts new lessons, resumes unfinished lessons, and safely restarts completed lessons", () => {
    const lesson = LESSON_LEVELS[0];
    const fresh = { ...createDefaultLessonProgress(), selectedLevel: "beginner" as const };
    expect(getLessonAction(lesson, fresh)).toBe("start");
    expect(getLessonEntryStep(lesson, fresh)).toBe(0);

    const unfinished = { ...fresh, currentStepByLesson: { "1": 2 } };
    expect(getLessonAction(lesson, unfinished)).toBe("continue");
    expect(getLessonEntryStep(lesson, unfinished)).toBe(2);
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(unfinished));
    render(<Lessons />);
    expect(screen.getByRole("button", { name: "Продовжити урок" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Продовжити урок 1:/ }));
    expect(screen.getByText("Крок 3 із 5")).toBeInTheDocument();

    cleanup();
    const completed = { ...unfinished, completedLessonIds: [1], currentStepByLesson: { "1": 4 } };
    expect(getLessonAction(lesson, completed)).toBe("repeat");
    expect(getLessonEntryStep(lesson, completed)).toBe(0);
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(completed));
    render(<Lessons />);
    expect(screen.getByRole("button", { name: "Повторити урок" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Повторити урок 1:/ }));
    expect(screen.getByText("Крок 1 із 5")).toBeInTheDocument();

    expect(getLessonEntryStep(lesson, { ...fresh, currentStepByLesson: { "1": -8 } })).toBe(0);
    expect(getLessonEntryStep(lesson, { ...fresh, currentStepByLesson: { "1": 999 } })).toBe(0);
  });

  it("filters only matching and genuinely available lessons", () => {
    const lessons = LESSON_LEVELS.filter((lesson) => lesson.level === "beginner");
    expect(filterLevelLessons(lessons, "пішак", "all", []).map((lesson) => lesson.id)).toEqual([1]);
    expect(filterLevelLessons(lessons, "", "available", [1]).map((lesson) => lesson.id)).toEqual([2]);
    expect(filterLevelLessons(lessons, "", "completed", [1]).map((lesson) => lesson.id)).toEqual([1]);
  });

  it("searches the course and waits for the learner after a correct move", () => {
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Початківець/ }));
    const search = screen.getByRole("textbox", { name: "Пошук уроків" });
    fireEvent.change(search, { target: { value: "тура" } });
    expect(screen.getByText("Показано 1 із 15 уроків")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 1:/ }));
    expect(screen.getByText("Крок 1 із 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Продовжити/ }));
    expect(screen.getByText("Крок 2 із 5")).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId("lesson-board")).getByRole("button", { name: "Хід e2–e3" }));
    expect(screen.getByText("Крок 2 із 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Продовжити/ })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Продовжити/ }));
    expect(screen.getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(readProgress().currentStepByLesson["1"]).toBe(2);
  });
});
