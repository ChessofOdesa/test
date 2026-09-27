import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Chess } from "chess.js";
import Lessons from "@/pages/Lessons";
import { LESSON_LEVELS, LESSON_PROGRESS_STORAGE_KEY, createDefaultLessonProgress } from "@/data/lesson-levels";
import { filterLevelLessons, firstAvailableLesson, getLessonAction, getLessonEntryStep, readProgress, sanitizeProgress } from "@/features/lessons/model";

vi.mock("@/components/ChessBoard", () => ({
  default: ({ onMove, interactive, targetSquares = [] }: { onMove: (from: string, to: string) => boolean; interactive: boolean; targetSquares?: string[] }) => (
    <div data-testid="lesson-board">
      <button type="button" disabled={!interactive} onClick={() => onMove("e2", "e3")}>Хід e2–e3</button>
      <span data-testid="lesson-targets">{targetSquares.join(",")}</span>
    </div>
  ),
}));

afterEach(() => { cleanup(); localStorage.clear(); });

describe("Lessons course and player flow", () => {
  it("keeps the first eleven lessons readable in Ukrainian and their practice moves legal", () => {
    const ukrainian = /[А-Яа-яІіЇїЄєҐґ]/;
    for (const lesson of LESSON_LEVELS.slice(0, 11)) {
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

  it("models lesson eight as a legal en passant capture", () => {
    const lesson = LESSON_LEVELS[7];
    const practice = lesson.steps.find((step) => step.expectedMove === "e5d6");

    expect(lesson.title).toBe("Взяття на проході");
    expect(practice).toBeDefined();
    const game = new Chess(practice?.fen ?? lesson.fen);
    const move = game.move({ from: "e5", to: "d6" });

    expect(move?.flags).toContain("e");
    expect(game.get("d5")).toBeUndefined();
    expect(game.get("d6")).toMatchObject({ color: "w", type: "p" });
  });

  it("models lesson nine with a real check and legal defensive replies", () => {
    const lesson = LESSON_LEVELS[8];
    const giveCheck = lesson.steps.find((step) => step.expectedMove === "a4e4");
    const escapeCheck = lesson.steps.find((step) => step.expectedMove === "e1d2");
    const repliesFen = lesson.steps[1].fen;

    expect(lesson.title).toBe("Шах");
    const attack = new Chess(giveCheck?.fen ?? lesson.fen);
    expect(attack.isCheck()).toBe(false);
    expect(attack.move({ from: "a4", to: "e4" })).not.toBeNull();
    expect(attack.isCheck()).toBe(true);
    expect(attack.isCheckmate()).toBe(false);

    const escape = new Chess(escapeCheck?.fen);
    expect(escape.isCheck()).toBe(true);
    expect(escape.move({ from: "e1", to: "d2" })).not.toBeNull();
    expect(escape.isCheck()).toBe(false);

    for (const reply of ["e8f7", "d7d8", "b7a8"]) {
      const position = new Chess(repliesFen);
      expect(position.isCheck()).toBe(true);
      expect(position.move({ from: reply.slice(0, 2), to: reply.slice(2, 4) })).not.toBeNull();
      expect(position.isCheck()).toBe(false);
    }
  });

  it("models lesson ten with a real checkmate and a non-mating comparison", () => {
    const lesson = LESSON_LEVELS[9];
    const mateStep = lesson.steps.find((step) => step.expectedMove === "f7g7");
    const checkOnly = new Chess(lesson.steps[1].fen);

    expect(lesson.title).toBe("Мат");
    expect(checkOnly.isCheck()).toBe(true);
    expect(checkOnly.isCheckmate()).toBe(false);
    expect(checkOnly.move({ from: "e8", to: "f7" })).not.toBeNull();
    expect(checkOnly.isCheck()).toBe(false);

    const position = new Chess(mateStep?.fen ?? lesson.fen);
    const move = position.move({ from: "f7", to: "g7" });
    expect(move?.san).toBe("Qg7#");
    expect(position.isCheck()).toBe(true);
    expect(position.isCheckmate()).toBe(true);
    expect(position.moves()).toEqual([]);

    const explainedMate = new Chess(lesson.steps[3].fen);
    expect(explainedMate.isCheckmate()).toBe(true);
  });

  it("fixes lesson eleven with a real mate in one and reveals its target progressively", () => {
    const lesson = LESSON_LEVELS[10];
    const practice = lesson.steps.find((step) => step.expectedMove === "e1e8");
    const position = new Chess(practice?.fen ?? lesson.fen);
    const move = position.move({ from: "e1", to: "e8" });

    expect(lesson.title).toBe("Мат в 1 хід");
    expect(practice?.targetRevealHint).toBe(2);
    expect(move?.san).toBe("Re8#");
    expect(position.isCheckmate()).toBe(true);

    const progress = {
      ...createDefaultLessonProgress(),
      selectedLevel: "beginner" as const,
      completedLessonIds: Array.from({ length: 10 }, (_, index) => index + 1),
      currentLessonId: 11,
    };
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 11:/ }));
    fireEvent.click(screen.getByRole("button", { name: /Продовжити/ }));
    fireEvent.click(screen.getByRole("button", { name: /Продовжити/ }));

    expect(screen.getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toHaveTextContent("e8");
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
