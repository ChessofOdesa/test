import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Chess } from "chess.js";
import Lessons from "@/pages/Lessons";
import { LESSON_LEVELS, LESSON_PROGRESS_STORAGE_KEY, createDefaultLessonProgress } from "@/data/lesson-levels";
import { filterLevelLessons, firstAvailableLesson, getLessonAction, getLessonEntryStep, readProgress, sanitizeProgress } from "@/features/lessons/model";

vi.mock("@/components/ChessBoard", () => ({
  default: ({ onMove, interactive, targetSquares = [], highlightSquares, customArrows = [], size }: { onMove: (from: string, to: string, promotion?: string) => boolean; interactive: boolean; targetSquares?: string[]; highlightSquares?: { squares: string[] }; customArrows?: [string, string][]; size: number }) => size < 100 ? <div data-testid="lesson-preview" /> : (
    <div data-testid="lesson-board" data-size={size}>
      <button type="button" disabled={!interactive} onClick={() => onMove("e2", "e3")}>Хід e2–e3</button>
      <button type="button" disabled={!interactive} onClick={() => onMove("f1", "b5")}>Хід f1–b5</button>
      <button type="button" disabled={!interactive} onClick={() => onMove("f1", "c4")}>Хід f1–c4</button>
      <button type="button" disabled={!interactive} onClick={() => onMove("e1", "f1")}>Хід e1–f1</button>
      <button type="button" disabled={!interactive} onClick={() => onMove("e1", "g1")}>Хід e1–g1</button>
      <button type="button" disabled={!interactive} onClick={() => onMove("g7", "g8", "q")}>Хід g7–g8=Ф</button>
      <span data-testid="lesson-targets">{targetSquares.join(",")}</span>
      <span data-testid="lesson-highlights">{highlightSquares?.squares.join(",")}</span>
      <span data-testid="lesson-arrows">{customArrows.map(([from, to]) => `${from}-${to}`).join(",")}</span>
    </div>
  ),
}));

afterEach(() => { cleanup(); localStorage.clear(); });

describe("Lessons course and player flow", () => {
  it("keeps a 468px desktop board in a 504px host and fits smaller screens on resize", () => {
    const previousHeight = window.innerHeight;
    const previousWidth = window.innerWidth;
    const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 240 } as DOMRect);
    try {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: 707 });
      render(<Lessons />);
      fireEvent.click(screen.getByRole("button", { name: /Початківець/ }));
      expect(screen.getByTestId("lesson-board")).toHaveAttribute("data-size", "468");
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 600 });
      fireEvent.resize(window);
      expect(screen.getByTestId("lesson-board")).toHaveAttribute("data-size", "385");
    } finally {
      bounds.mockRestore();
      Object.defineProperty(window, "innerHeight", { configurable: true, value: previousHeight });
      Object.defineProperty(window, "innerWidth", { configurable: true, value: previousWidth });
    }
  });

  it("celebrates a first completion and a repeat without awarding XP twice", () => {
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify({
      ...createDefaultLessonProgress(), selectedLevel: "beginner", currentLessonId: 1, currentStepByLesson: { "1": 4 },
    }));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Продовжити урок 1:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Завершити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByRole("status")).toHaveClass("lessons-completion");
    expect(screen.getByText(/Отримано \d+ XP/)).toBeInTheDocument();
    const earned = readProgress().xp;

    fireEvent.click(screen.getByRole("button", { name: "Повторити урок" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    for (let exercise = 0; exercise < 3; exercise++) {
      fireEvent.click(screen.getByRole("button", { name: "Показати розв’язок" }));
      fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    }
    fireEvent.click(screen.getByRole("button", { name: "Завершити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByRole("status")).toHaveClass("lessons-completion");
    expect(screen.getByText("Повторення без додаткових XP")).toBeInTheDocument();
    expect(readProgress().xp).toBe(earned);
  });

  it("gives all 55 lessons unique authored practice after lesson thirteen, with legal moves and knowledge checks", () => {
    expect(LESSON_LEVELS).toHaveLength(55);
    const questions = new Set<string>();
    const moves = new Set<string>();
    for (const lesson of LESSON_LEVELS.slice(13)) {
      expect(lesson.steps).toHaveLength(5);
      const task = lesson.steps.find((step) => step.kind === "task");
      const check = lesson.steps.find((step) => step.quiz);
      expect(task?.expectedMove).toBeDefined();
      expect(check?.quiz).toBeDefined();
      expect(task?.targetRevealHint).toBe(2);
      expect(lesson.shortDescription).not.toMatch(/^Практичний урок|^Глибокий урок|^Простий візуальний урок/);
      const game = new Chess(task?.fen);
      const move = task!.expectedMove!;
      const played = game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] || "q" });
      expect(played).not.toBeNull();
      expect(task?.targetSquare).toBe(move.slice(2, 4));
      expect(check?.quiz?.options[check.quiz.correctIndex]).toBeTruthy();
      questions.add(check!.quiz!.question);
      moves.add(`${task?.fen}:${move}`);
    }
    expect(questions.size).toBe(42);
    expect(moves.size).toBe(42);
    expect(LESSON_LEVELS[13].steps[2].expectedMove).toBe("e1g1");
    expect(LESSON_LEVELS[52].steps[2].expectedMove).toBe("g7g8q");
    for (const id of [24, 54]) {
      const task = LESSON_LEVELS[id - 1].steps[2];
      const game = new Chess(task.fen);
      game.move({ from: task.expectedMove!.slice(0, 2), to: task.expectedMove!.slice(2, 4) });
      expect(game.isCheckmate()).toBe(true);
    }
  });

  it("explains a wrong move, hides the task target, and requires the knowledge check after lesson fourteen", () => {
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify({
      ...createDefaultLessonProgress(), selectedLevel: "beginner", currentLessonId: 14,
      completedLessonIds: Array.from({ length: 13 }, (_, index) => index + 1),
    }));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 14:/ }));
    expect(screen.getByRole("button", { name: "Показати каталог уроків" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Показати каталог уроків" }));
    expect(screen.getByRole("complementary", { name: "Каталог уроків" })).not.toHaveClass("is-mobile-collapsed");
    fireEvent.click(screen.getByRole("button", { name: "Згорнути каталог уроків" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    expect(screen.getByTestId("lesson-arrows")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Хід e1–f1" }));
    expect(screen.getByText(/Хід королем на f1 не вводить туру в гру/)).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-arrows")).toHaveTextContent("e1-g1");
    fireEvent.click(screen.getByRole("button", { name: "Хід e1–g1" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(screen.getByRole("group", { name: "Перевірка знань" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Продовжити" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Король і тура поміняються місцями" }));
    expect(screen.getByRole("button", { name: "Продовжити" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Король опиниться на g1, тура — на f1" }));
    expect(screen.getByRole("button", { name: "Продовжити" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Завершити" }));
    expect(screen.getByText(/Урок «Безпечний король» пройдено/)).toBeInTheDocument();
    expect(readProgress().completedLessonIds).toContain(14);
  });

  it("recognizes promotion as the expected move in the new lesson", () => {
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify({
      ...createDefaultLessonProgress(), selectedLevel: "master", currentLessonId: 53,
      completedLessonIds: Array.from({ length: 17 }, (_, index) => 36 + index),
    }));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 53:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Хід g7–g8=Ф" }));
    expect(screen.getByRole("button", { name: "Продовжити" })).toBeEnabled();
  });
  it("keeps the first thirteen lessons readable in Ukrainian and their practice moves legal", () => {
    const ukrainian = /[А-Яа-яІіЇїЄєҐґ]/;
    for (const lesson of LESSON_LEVELS.slice(0, 13)) {
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
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));

    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toHaveTextContent("e8");
  });

  it("models lesson twelve with a legal central move and progressive target reveal", () => {
    const lesson = LESSON_LEVELS[11];
    const practice = lesson.steps.find((step) => step.expectedMove === "d2d4");
    const position = new Chess(practice?.fen ?? lesson.fen);
    const move = position.move({ from: "d2", to: "d4" });

    expect(lesson.title).toBe("Контроль центру");
    expect(practice?.targetRevealHint).toBe(2);
    expect(move?.san).toBe("d4");
    expect(position.get("d4")).toMatchObject({ color: "w", type: "p" });
    expect(position.fen()).toBe("rnbqkbnr/ppp1pppp/3p4/8/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 2");

    const progress = {
      ...createDefaultLessonProgress(),
      selectedLevel: "beginner" as const,
      completedLessonIds: Array.from({ length: 11 }, (_, index) => index + 1),
      currentLessonId: 12,
    };
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 12:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));

    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toHaveTextContent("d4");
  });

  it("teaches development with Bc4 and keeps the answer hidden after a wrong move", () => {
    const lesson = LESSON_LEVELS[12];
    const practice = lesson.steps.find((step) => step.expectedMove === "f1c4");
    const position = new Chess(practice?.fen ?? lesson.fen);
    expect(lesson.title).toBe("Розвиток фігур");
    expect(practice?.targetRevealHint).toBe(2);
    expect(position.get("f3")).toMatchObject({ color: "w", type: "n" });
    expect(position.move({ from: "f1", to: "c4" })?.san).toBe("Bc4");
    expect(position.get("c4")).toMatchObject({ color: "w", type: "b" });
    expect(position.isAttacked("f7", "w")).toBe(true);
    expect(position.fen()).toBe(lesson.steps[3].fen);

    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify({
      ...createDefaultLessonProgress(), selectedLevel: "beginner",
      completedLessonIds: Array.from({ length: 12 }, (_, index) => index + 1), currentLessonId: 13,
    }));
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 13:/ }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    fireEvent.click(within(screen.getByTestId("lesson-board")).getByRole("button", { name: "Хід f1–b5" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-targets")).toBeEmptyDOMElement();
    expect(screen.getByTestId("lesson-highlights")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "Підказка" }));
    expect(screen.getByTestId("lesson-targets")).toHaveTextContent("c4");
    fireEvent.click(within(screen.getByTestId("lesson-board")).getByRole("button", { name: "Хід f1–c4" }));
    expect(screen.getByTestId("lesson-highlights")).toHaveTextContent("c4");
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 4 із 5")).toBeInTheDocument();
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
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();

    cleanup();
    const completed = { ...unfinished, completedLessonIds: [1], currentStepByLesson: { "1": 4 } };
    expect(getLessonAction(lesson, completed)).toBe("repeat");
    expect(getLessonEntryStep(lesson, completed)).toBe(0);
    localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(completed));
    render(<Lessons />);
    expect(screen.getByRole("button", { name: "Повторити урок" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: /Повторити урок 1:/ }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 1 із 5")).toBeInTheDocument();

    expect(getLessonEntryStep(lesson, { ...fresh, currentStepByLesson: { "1": -8 } })).toBe(0);
    expect(getLessonEntryStep(lesson, { ...fresh, currentStepByLesson: { "1": 999 } })).toBe(0);
  });

  it("filters only matching and genuinely available lessons", () => {
    const lessons = LESSON_LEVELS.filter((lesson) => lesson.level === "beginner");
    expect(filterLevelLessons(lessons, "Як ходить тура", "all", []).map((lesson) => lesson.id)).toEqual([2]);
    expect(filterLevelLessons(lessons, "", "available", [1]).map((lesson) => lesson.id)).toEqual([2]);
    expect(filterLevelLessons(lessons, "", "completed", [1]).map((lesson) => lesson.id)).toEqual([1]);
    expect(filterLevelLessons(lessons, "", "all", [], "Дебют").map((lesson) => lesson.id)).toEqual([12, 13, 14, 15]);
  });

  it("searches the course and waits for the learner after a correct move", () => {
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Початківець/ }));
    const search = screen.getByRole("textbox", { name: "Пошук уроків" });
    fireEvent.change(search, { target: { value: "Як ходить тура" } });
    expect(screen.getByText("Показано 1 із 15 уроків")).toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /Почати урок 1:/ }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 1 із 5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 2 із 5")).toBeInTheDocument();
    fireEvent.click(within(screen.getByTestId("lesson-board")).getByRole("button", { name: "Хід e2–e3" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 2 із 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Продовжити" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Продовжити" }));
    expect(within(screen.getByRole("main", { name: "Робоча область уроку" })).getByText("Крок 3 із 5")).toBeInTheDocument();
    expect(readProgress().currentStepByLesson["1"]).toBe(2);
  });

  it("shows the same catalog, board, and step guide for all three course levels", () => {
    render(<Lessons />);
    fireEvent.click(screen.getByRole("button", { name: /Початківець/ }));

    const catalog = screen.getByRole("complementary", { name: "Каталог уроків" });
    const workspace = screen.getByRole("main", { name: "Робоча область уроку" });
    const guide = screen.getByRole("complementary", { name: "Пояснення та кроки уроку" });
    expect(within(catalog).getAllByTestId("lesson-preview")).toHaveLength(15);
    expect(within(workspace).getByTestId("lesson-board")).toBeInTheDocument();
    expect(within(guide).getByRole("list").children).toHaveLength(5);
    expect(within(catalog).getByRole("button", { name: /Почати урок 2:/ })).toBeDisabled();

    fireEvent.click(within(catalog).getByRole("button", { name: "Аматор" }));
    expect(within(catalog).getAllByTestId("lesson-preview")).toHaveLength(20);
    fireEvent.click(within(catalog).getByRole("button", { name: /Почати урок 16:/ }));
    expect(within(workspace).getByText("Крок 1 із 5")).toBeInTheDocument();
    expect(within(guide).getByRole("button", { name: "Показати розв’язок" })).toBeEnabled();

    fireEvent.click(within(catalog).getByRole("button", { name: "Досвідчений" }));
    expect(within(catalog).getAllByTestId("lesson-preview")).toHaveLength(20);
    fireEvent.click(within(catalog).getByRole("button", { name: /Почати урок 36:/ }));
    expect(within(workspace).getByText("Крок 1 із 5")).toBeInTheDocument();
    expect(within(guide).getByRole("list").children).toHaveLength(5);
  });
});
