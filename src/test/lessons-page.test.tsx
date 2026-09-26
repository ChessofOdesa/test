import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import Lessons from "@/pages/Lessons";
import { LESSON_LEVELS, createDefaultLessonProgress } from "@/data/lesson-levels";
import { filterLevelLessons, firstAvailableLesson, readProgress, sanitizeProgress } from "@/features/lessons/model";

vi.mock("@/components/ChessBoard", () => ({
  default: ({ onMove, interactive }: { onMove: (from: string, to: string) => boolean; interactive: boolean }) => (
    <div data-testid="lesson-board">
      <button type="button" disabled={!interactive} onClick={() => onMove("e2", "e3")}>Хід e2–e3</button>
    </div>
  ),
}));

afterEach(() => { cleanup(); localStorage.clear(); });

describe("Lessons course and player flow", () => {
  it("keeps an explicit unselected level and recommends the next incomplete lesson", () => {
    expect(sanitizeProgress({ ...createDefaultLessonProgress(), selectedLevel: null }).selectedLevel).toBeNull();
    expect(firstAvailableLesson("beginner", [1, 2]).id).toBe(3);
    expect(firstAvailableLesson("beginner", LESSON_LEVELS.filter((lesson) => lesson.level === "beginner").map((lesson) => lesson.id)).id).toBe(15);
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
