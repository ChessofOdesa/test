export type LessonLevel = "beginner" | "amateur" | "master";
export type LessonType = "theory" | "practice" | "puzzle" | "challenge" | "ai" | "review";
export type LessonStepKind = "explain" | "demo" | "practice" | "task" | "check" | "complete";
export type LessonDiagramType = "empty" | "path" | "capture" | "blocked" | "challenge" | "success";

export interface LessonStep {
  id: string;
  kind: LessonStepKind;
  title: string;
  text: string;
  goal: string;
  action: string;
  hints: [string, string, string];
  reveal: string;
  diagramType?: LessonDiagramType;
  fen?: string;
  startSquare?: string;
  targetSquare?: string;
  demoSquares?: string[];
  blockedSquares?: string[];
  captureSquares?: string[];
  dangerSquares?: string[];
  arrows?: Array<[string, string, string?]>;
  expectedMove?: string;
  errorText?: string;
  successText?: string;
}

export interface LessonRecord {
  id: number;
  level: LessonLevel;
  title: string;
  shortDescription: string;
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number;
  xp: number;
  type: LessonType;
  goal: string;
  steps: LessonStep[];
  fen?: string;
  solutionMove?: string;
}

export interface LessonProgressState {
  selectedLevel: LessonLevel | null;
  completedLessonIds: number[];
  skippedLessonIds: number[];
  xp: number;
  streakDates: string[];
  currentLessonId: number;
  currentStepByLesson: Record<string, number>;
  hintLevelByLesson: Record<string, number>;
  lastFeedback: string;
}

export const LESSON_PROGRESS_STORAGE_KEY = "chessmaster.lessons.progress.v2";
export const LEGACY_LESSON_PROGRESS_STORAGE_KEY = "chessmaster.lessons.progress.v1";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const LESSON_LEVEL_META: Record<
  LessonLevel,
  {
    title: string;
    range: string;
    subtitle: string;
    description: string;
    includes: string[];
    coachStyle: string;
  }
> = {
  beginner: {
    title: "Beginner",
    range: "Lessons 1–15",
    subtitle: "Learn the board, pieces, check, mate, and opening basics.",
    description: "For players who are just learning the rules. The pace is slow, hints are direct, and every concept is visual.",
    includes: ["simple rules", "large hints", "visual examples", "frequent checks"],
    coachStyle: "I will explain more and keep every task small.",
  },
  amateur: {
    title: "Amateur",
    range: "Lessons 16–35",
    subtitle: "Practice tactics, initiative, plans, attack, defense, and common mistakes.",
    description: "For players who know the basics and need more calculation. The coach gives fewer direct answers and more reasoning.",
    includes: ["tactics", "find-the-move tasks", "mistake review", "practical plans"],
    coachStyle: "I will ask you to think first, then explain the logic.",
  },
  master: {
    title: "Master",
    range: "Lessons 36–50",
    subtitle: "Study endgames, strategy, dynamic play, and complete game review.",
    description: "For experienced players. Positions are deeper, hints are minimal, and the focus is decision-making.",
    includes: ["endgames", "strategic plans", "deep analysis", "minimal hints"],
    coachStyle: "I will be concise and focus on strong chess decisions.",
  },
};

const TITLES = [
  "Як ходить пішак",
  "Як ходить тура",
  "Як ходить слон",
  "Як ходить кінь",
  "Як ходить ферзь",
  "Як ходить король",
  "Рокіровка",
  "Взяття на проході",
  "Шах",
  "Мат",
  "Мат в 1 хід",
  "Контроль центру",
  "Розвиток фігур",
  "Безпечний король",
  "Основи дебюту",
  "Вилка",
  "Зв’язка",
  "Подвійний удар",
  "Відкритий шах",
  "Відволікання",
  "Завлеcення",
  "Проміжний хід",
  "Жертва фігури",
  "Комбінації",
  "Слабкі поля",
  "Форпост",
  "Відкрита лінія",
  "Напіввідкрита лінія",
  "Активність фігур",
  "Ініціатива",
  "План у позиції",
  "Атака на короля",
  "Захист позиції",
  "Контратака",
  "Типові помилки",
  "Ендшпіль: король і пішак",
  "Опозиція",
  "Трикутник",
  "Цугцванг",
  "Ладейний ендшпіль",
  "Активний король",
  "Прохідний пішак",
  "Позиційна гра",
  "Довгостроковий план",
  "Слабкі пішаки",
  "Ізольований пішак",
  "Аналіз партій",
  "Стратегічне мислення",
  "Динамічна гра",
  "Повний розбір партії",
] as const;

const LESSON_FENS: Record<number, string> = {
  1: "7k/8/8/8/8/8/4P3/4K3 w - - 0 1",
  2: "7k/8/8/8/8/8/8/R3K3 w - - 0 1",
  3: "k7/8/8/8/8/2B5/8/4K3 w - - 0 1",
  4: "7k/8/8/8/3N4/8/8/4K3 w - - 0 1",
  5: "k7/8/8/8/3Q4/8/8/4K3 w - - 0 1",
  6: "7k/8/8/8/8/8/8/4K3 w - - 0 1",
  7: STARTING_FEN,
  8: "7k/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
  9: "4k3/8/8/8/4Q3/8/8/4K3 w - - 0 1",
  10: "6k1/6pp/8/8/8/8/6PP/5RK1 w - - 0 1",
  11: "6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1",
  16: "r1bqkbnr/pppppppp/2n5/8/4N3/8/PPPPPPPP/R1BQKBNR w KQkq - 2 2",
  17: "r3k2r/ppp2ppp/2n5/3q4/3B4/8/PPP2PPP/R3K2R w KQkq - 0 1",
  18: "rnbqkbnr/pppp1ppp/8/4p3/4N3/8/PPPPPPPP/R1BQKBNR w KQkq - 0 2",
  24: "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 5",
  31: "r2q1rk1/pp2bppp/2n1pn2/2pp4/3P4/2P1PN2/PP1NBPPP/R2Q1RK1 w - - 0 9",
  36: "8/8/8/3k4/3P4/4K3/8/8 w - - 0 1",
  37: "8/8/8/3k4/8/3K4/3P4/8 w - - 0 1",
  40: "8/8/8/8/8/1k6/6P1/4R1K1 w - - 0 1",
  47: STARTING_FEN,
  50: STARTING_FEN,
};

const SOLUTION_MOVES: Record<number, string> = {
  1: "e2e4",
  2: "a1a8",
  3: "c3h8",
  4: "d4f5",
  5: "d4h8",
  6: "e1f2",
  7: "e1g1",
  8: "e5d6",
  11: "h1a8",
  16: "e4f6",
  18: "e4f6",
  36: "e3f4",
  37: "d3e3",
};

function levelForId(id: number): LessonLevel {
  if (id <= 15) return "beginner";
  if (id <= 35) return "amateur";
  return "master";
}

function typeForId(id: number): LessonType {
  if (id <= 10) return "theory";
  if (id === 11 || id === 16 || id === 18 || id === 24) return "puzzle";
  if (id <= 35) return id % 5 === 0 ? "challenge" : "practice";
  if (id === 47 || id === 50) return "review";
  return id % 3 === 0 ? "ai" : "challenge";
}

function difficultyForLevel(level: LessonLevel): "Easy" | "Medium" | "Hard" {
  if (level === "beginner") return "Easy";
  if (level === "amateur") return "Medium";
  return "Hard";
}

function goalFor(title: string, level: LessonLevel): string {
  if (level === "beginner") {
    return `Побачити базову ідею теми “${title}” на дошці та зробити просту правильну дію.`;
  }

  if (level === "amateur") {
    return `Знайти практичну ідею “${title}”, пояснити її логіку та перевірити хід.`;
  }

  return `Розібрати тему “${title}” як сильний шахіст: оцінити позицію, план і наслідки.`;
}

function shortDescriptionFor(title: string, level: LessonLevel): string {
  if (level === "beginner") {
    return `Простий візуальний урок: ${title.toLowerCase()}.`;
  }

  if (level === "amateur") {
    return `Практичний урок із тактикою та самостійним пошуком: ${title.toLowerCase()}.`;
  }

  return `Глибокий урок для рішень у складній позиції: ${title.toLowerCase()}.`;
}

function hintsFor(title: string, level: LessonLevel): [string, string, string] {
  if (level === "beginner") {
    return [
      "Подивись на активну фігуру і клітини, які вона контролює.",
      "Знайди найбезпечніший хід, який відповідає темі уроку.",
      `Майже відповідь: шукай простий хід, який показує “${title}”.`,
    ];
  }

  if (level === "amateur") {
    return [
      "Шукай темп, незахищену фігуру або слабке поле.",
      "Перевір, чи можна атакувати дві цілі одночасно або виграти ініціативу.",
      `Майже відповідь: кандидатний хід повинен прямо використати тему “${title}”.`,
    ];
  }

  return [
    "Спочатку оціни короля, структуру пішаків і активність фігур.",
    "Порівняй довгостроковий план із негайним тактичним ресурсом.",
    `Майже відповідь: найсильніший хід повинен покращити позицію за темою “${title}”.`,
  ];
}

const BEGINNER_TRAINER_LESSONS: Record<
  number,
  {
    title: string;
    summary: string;
    steps: Array<Omit<LessonStep, "id">>;
  }
> = {
  1: {
    title: "Pawn Movement",
    summary: "Pawn moves forward, captures diagonally, cannot move backward, and may move two squares from the start.",
    steps: [
      {
        kind: "explain",
        title: "Pawn moves forward",
        text: "Pawn moves forward. From the starting rank it can move one or two squares.",
        goal: "See the forward path before moving.",
        action: "The board is locked. Follow the green arrows, then continue.",
        hints: ["Pawn moves toward the opponent.", "Green squares are forward moves.", "Diagonal squares are only for captures."],
        reveal: "A pawn moves straight forward, but captures diagonally.",
        diagramType: "path",
        fen: LESSON_FENS[1],
        startSquare: "e2",
        demoSquares: ["e3", "e4", "d3", "f3"],
        captureSquares: ["d3", "f3"],
        arrows: [["e2", "e3", "#9fd35d"], ["e2", "e4", "#9fd35d"], ["e2", "d3", "#e0c85a"], ["e2", "f3", "#e0c85a"]],
      },
      {
        kind: "practice",
        title: "Practice 1: move forward",
        text: "Move the pawn one square forward to the star.",
        goal: "Make a normal pawn move.",
        action: "Drag the pawn from e2 to e3.",
        hints: ["The pawn moves straight forward.", "Do not move diagonally unless capturing.", "Move e2-e3."],
        reveal: "Correct move: e2-e3.",
        diagramType: "challenge",
        fen: LESSON_FENS[1],
        startSquare: "e2",
        targetSquare: "e3",
        demoSquares: ["e3", "e4"],
        arrows: [["e2", "e3", "#9fd35d"]],
        expectedMove: "e2e3",
        errorText: "Pawn cannot move sideways or backward. Try e2-e3.",
        successText: "Correct. A pawn can move one square forward.",
      },
      {
        kind: "practice",
        title: "Practice 2: capture diagonally",
        text: "Pawn captures diagonally. Capture the piece on the star.",
        goal: "Use the pawn capture rule.",
        action: "Drag the pawn from e4 to d5.",
        hints: ["A pawn does not capture straight forward.", "Look one diagonal square ahead.", "Move e4xd5."],
        reveal: "Correct move: e4-d5.",
        diagramType: "capture",
        fen: "7k/8/8/3n4/4P3/8/8/4K3 w - - 0 1",
        startSquare: "e4",
        targetSquare: "d5",
        captureSquares: ["d5"],
        arrows: [["e4", "d5", "#e0c85a"]],
        expectedMove: "e4d5",
        errorText: "Pawn captures diagonally, not straight.",
        successText: "Correct. Pawns capture one square diagonally.",
      },
      {
        kind: "practice",
        title: "Practice 3: blocked pawn",
        text: "A pawn cannot move through a blocker. Use the diagonal capture instead.",
        goal: "Recognize a blocked pawn and find the legal capture.",
        action: "The forward square is blocked. Capture on f3.",
        hints: ["The red square blocks the pawn.", "A blocked pawn cannot go forward.", "Move e2xf3."],
        reveal: "Correct move: e2-f3.",
        diagramType: "blocked",
        fen: "7k/8/8/8/8/4pn2/4P3/4K3 w - - 0 1",
        startSquare: "e2",
        targetSquare: "f3",
        blockedSquares: ["e3"],
        captureSquares: ["f3"],
        arrows: [["e2", "f3", "#e0c85a"]],
        expectedMove: "e2f3",
        errorText: "The pawn is blocked forward. Pawns do not move backward.",
        successText: "Good. When blocked, a pawn needs a diagonal capture or it cannot move.",
      },
      {
        kind: "complete",
        title: "Pawn complete",
        text: "Good job! Pawns move forward, capture diagonally, do not move backward, and can move two squares from the start.",
        goal: "Remember the pawn rules.",
        action: "Finish the lesson.",
        hints: ["Forward move.", "Diagonal capture.", "No backward moves."],
        reveal: "Pawn lesson complete.",
        diagramType: "success",
        fen: "7k/8/8/8/4P3/8/8/4K3 b - - 0 1",
        successText: "Good job! Now you understand pawn movement.",
      },
    ],
  },
  2: {
    title: "Rook Movement",
    summary: "Rook moves horizontally and vertically, captures on straight lines, and cannot jump over pieces.",
    steps: [
      {
        kind: "explain",
        title: "Rook moves in straight lines",
        text: "Rook moves horizontally and vertically across open squares.",
        goal: "See the four straight directions.",
        action: "The board is locked. Watch the straight paths.",
        hints: ["Rooks move like a plus sign.", "No diagonal movement.", "A blocker stops the rook."],
        reveal: "Rook moves only in straight lines.",
        diagramType: "path",
        fen: "7k/8/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        demoSquares: ["d1", "d2", "d3", "d5", "d6", "d7", "d8", "a4", "b4", "c4", "e4", "f4", "g4", "h4"],
        arrows: [["d4", "d8", "#9fd35d"], ["d4", "d1", "#9fd35d"], ["d4", "a4", "#9fd35d"], ["d4", "h4", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: vertical move",
        text: "Move the rook straight up to the star.",
        goal: "Practice a long vertical rook move.",
        action: "Drag the rook from d4 to d8.",
        hints: ["Stay on the same file.", "Move straight up.", "Move d4-d8."],
        reveal: "Correct move: d4-d8.",
        diagramType: "challenge",
        fen: "7k/8/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "d8",
        demoSquares: ["d5", "d6", "d7", "d8"],
        arrows: [["d4", "d8", "#9fd35d"]],
        expectedMove: "d4d8",
        errorText: "Rook cannot move diagonally. Keep it on the same file.",
        successText: "Correct. Rooks can move far in a straight line.",
      },
      {
        kind: "practice",
        title: "Practice 2: straight capture",
        text: "Capture the piece on the same file.",
        goal: "Learn rook capture on a straight line.",
        action: "Drag the rook from d4 to d7.",
        hints: ["The target is on the same file.", "The rook stops on the captured piece.", "Move d4xd7."],
        reveal: "Correct move: d4-d7.",
        diagramType: "capture",
        fen: "7k/3b4/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "d7",
        captureSquares: ["d7"],
        arrows: [["d4", "d7", "#e0c85a"]],
        expectedMove: "d4d7",
        errorText: "Rook captures only on its rank or file.",
        successText: "Correct. The rook captures straight and stops there.",
      },
      {
        kind: "practice",
        title: "Practice 3: blocked path",
        text: "A rook cannot jump over a blocker. Choose the open straight line.",
        goal: "Avoid the blocked file.",
        action: "The red square blocks upward movement. Move to h4.",
        hints: ["The rook cannot pass the blocker.", "Try the open rank.", "Move d4-h4."],
        reveal: "Correct move: d4-h4.",
        diagramType: "blocked",
        fen: "7k/8/3P4/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "h4",
        blockedSquares: ["d6"],
        demoSquares: ["e4", "f4", "g4", "h4"],
        arrows: [["d4", "h4", "#9fd35d"]],
        expectedMove: "d4h4",
        errorText: "The rook cannot jump through pieces.",
        successText: "Good. Rooks need a clear straight path.",
      },
      {
        kind: "complete",
        title: "Rook complete",
        text: "Good job! Rooks move vertically and horizontally, capture straight, and cannot jump over pieces.",
        goal: "Remember the rook rule.",
        action: "Finish the lesson.",
        hints: ["Straight lines.", "No diagonal moves.", "No jumping."],
        reveal: "Rook lesson complete.",
        diagramType: "success",
        fen: "7k/8/8/8/7R/8/8/4K3 b - - 1 1",
        successText: "Good job! Now you understand rook movement.",
      },
    ],
  },
  3: {
    title: "Bishop Movement",
    summary: "Bishop moves diagonally, stays on one color, captures diagonally, and cannot jump.",
    steps: [
      {
        kind: "explain",
        title: "Bishop moves diagonally",
        text: "Bishop moves only on diagonals. It always stays on the same color squares.",
        goal: "See every diagonal line from the bishop.",
        action: "The board is locked. Follow the diagonal arrows.",
        hints: ["Bishop does not move straight.", "It stays on one color.", "Blockers stop the diagonal."],
        reveal: "Bishop moves diagonally only.",
        diagramType: "path",
        fen: "k7/8/8/8/3B4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        demoSquares: ["a1", "b2", "c3", "e5", "f6", "g7", "h8", "a7", "b6", "c5", "e3", "f2", "g1"],
        arrows: [["d4", "h8", "#9fd35d"], ["d4", "a7", "#9fd35d"], ["d4", "a1", "#9fd35d"], ["d4", "g1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: diagonal move",
        text: "Move the bishop along the diagonal to the star.",
        goal: "Practice bishop diagonal movement.",
        action: "Drag the bishop from d4 to g7.",
        hints: ["Stay on the diagonal.", "The target is the same color.", "Move d4-g7."],
        reveal: "Correct move: d4-g7.",
        diagramType: "challenge",
        fen: "k7/8/8/8/3B4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "g7",
        demoSquares: ["e5", "f6", "g7"],
        arrows: [["d4", "g7", "#9fd35d"]],
        expectedMove: "d4g7",
        errorText: "Bishop moves diagonally, not straight.",
        successText: "Correct. Bishops travel on diagonals.",
      },
      {
        kind: "practice",
        title: "Practice 2: diagonal capture",
        text: "Capture the piece on the diagonal.",
        goal: "Use bishop capture.",
        action: "Drag the bishop from c3 to g7.",
        hints: ["The capture is diagonal.", "Do not move straight.", "Move c3xg7."],
        reveal: "Correct move: c3-g7.",
        diagramType: "capture",
        fen: "k7/6n1/8/8/8/2B5/8/4K3 w - - 0 1",
        startSquare: "c3",
        targetSquare: "g7",
        captureSquares: ["g7"],
        arrows: [["c3", "g7", "#e0c85a"]],
        expectedMove: "c3g7",
        errorText: "Bishop captures along a diagonal.",
        successText: "Correct. The bishop captured diagonally.",
      },
      {
        kind: "practice",
        title: "Practice 3: blocked diagonal",
        text: "A bishop cannot jump over a blocker. Use another diagonal.",
        goal: "Recognize blocked diagonals.",
        action: "The red square blocks one diagonal. Move to b2.",
        hints: ["The blocker stops the long diagonal.", "Use a clear diagonal.", "Move c3-b2."],
        reveal: "Correct move: c3-b2.",
        diagramType: "blocked",
        fen: "k7/8/8/8/3P4/2B5/8/4K3 w - - 0 1",
        startSquare: "c3",
        targetSquare: "b2",
        blockedSquares: ["d4"],
        demoSquares: ["b2"],
        arrows: [["c3", "b2", "#9fd35d"]],
        expectedMove: "c3b2",
        errorText: "The bishop cannot pass through the blocker.",
        successText: "Good. Bishops need a clear diagonal.",
      },
      {
        kind: "complete",
        title: "Bishop complete",
        text: "Good job! Bishops move diagonally, stay on one color, capture diagonally, and cannot jump.",
        goal: "Remember the bishop rule.",
        action: "Finish the lesson.",
        hints: ["Diagonal only.", "Same color.", "No jumping."],
        reveal: "Bishop lesson complete.",
        diagramType: "success",
        fen: "k7/8/8/8/8/8/1B6/4K3 b - - 1 1",
        successText: "Good job! Now you understand bishop movement.",
      },
    ],
  },
  4: {
    title: "Knight Movement",
    summary: "Knight moves in an L shape, jumps over pieces, and changes square color.",
    steps: [
      {
        kind: "explain",
        title: "Knight moves in an L shape",
        text: "Knight moves two squares one way and one square sideways. It can jump over pieces.",
        goal: "See all eight landing squares.",
        action: "The board is locked. Look at the landing dots.",
        hints: ["Knight does not slide.", "It jumps.", "It changes color every move."],
        reveal: "Knight moves in an L shape.",
        diagramType: "path",
        fen: LESSON_FENS[4],
        startSquare: "d4",
        demoSquares: ["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"],
        arrows: [["d4", "f5", "#9fd35d"], ["d4", "f3", "#9fd35d"], ["d4", "c6", "#9fd35d"], ["d4", "b5", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: L-shape",
        text: "Jump the knight to the star.",
        goal: "Practice the L-shaped move.",
        action: "Drag the knight from d4 to f5.",
        hints: ["Two squares, then one sideways.", "The star is a knight landing square.", "Move d4-f5."],
        reveal: "Correct move: d4-f5.",
        diagramType: "challenge",
        fen: LESSON_FENS[4],
        startSquare: "d4",
        targetSquare: "f5",
        demoSquares: ["f5"],
        arrows: [["d4", "f5", "#9fd35d"]],
        expectedMove: "d4f5",
        errorText: "Knight moves in an L shape, not straight.",
        successText: "Correct. That is the knight's L-shaped jump.",
      },
      {
        kind: "practice",
        title: "Practice 2: jump over pieces",
        text: "Other pieces do not block a knight. Jump to the star.",
        goal: "Learn that knights can jump.",
        action: "Drag the knight from d4 to f3.",
        hints: ["The surrounding pieces do not matter.", "Find an L-shaped landing square.", "Move d4-f3."],
        reveal: "Correct move: d4-f3.",
        diagramType: "blocked",
        fen: "7k/8/8/3P4/2PNP3/3P4/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "f3",
        blockedSquares: ["c4", "d3", "d5", "e4"],
        arrows: [["d4", "f3", "#9fd35d"]],
        expectedMove: "d4f3",
        errorText: "Knights jump. Use an L-shaped landing square.",
        successText: "Correct. Knights can jump over pieces.",
      },
      {
        kind: "practice",
        title: "Practice 3: color change",
        text: "A knight always lands on the opposite color square.",
        goal: "See the color change after the jump.",
        action: "Move the knight from f3 to h4.",
        hints: ["The knight changes square color.", "Use the L shape.", "Move f3-h4."],
        reveal: "Correct move: f3-h4.",
        diagramType: "challenge",
        fen: "7k/8/8/8/8/5N2/8/4K3 w - - 0 1",
        startSquare: "f3",
        targetSquare: "h4",
        demoSquares: ["h4"],
        arrows: [["f3", "h4", "#9fd35d"]],
        expectedMove: "f3h4",
        errorText: "That is not the knight's L shape.",
        successText: "Good. The knight jumped to the opposite color.",
      },
      {
        kind: "complete",
        title: "Knight complete",
        text: "Good job! Knights move in an L shape, jump over pieces, and change square color.",
        goal: "Remember the knight rule.",
        action: "Finish the lesson.",
        hints: ["L shape.", "Jumping piece.", "Changes color."],
        reveal: "Knight lesson complete.",
        diagramType: "success",
        fen: "7k/8/8/8/7N/8/8/4K3 b - - 1 1",
        successText: "Good job! Now you understand knight movement.",
      },
    ],
  },
  5: {
    title: "Queen Movement",
    summary: "Queen combines rook and bishop movement, moves straight or diagonal, and cannot jump.",
    steps: [
      {
        kind: "explain",
        title: "Queen moves like rook + bishop",
        text: "Queen moves straight like a rook and diagonally like a bishop.",
        goal: "See all queen directions.",
        action: "The board is locked. Compare straight and diagonal lines.",
        hints: ["Queen has many lines.", "Straight or diagonal only.", "Blockers still stop the queen."],
        reveal: "Queen combines rook and bishop movement.",
        diagramType: "path",
        fen: LESSON_FENS[5],
        startSquare: "d4",
        demoSquares: ["d8", "d1", "a4", "h4", "a1", "h8", "a7", "g1"],
        arrows: [["d4", "h8", "#9fd35d"], ["d4", "d8", "#9fd35d"], ["d4", "h4", "#9fd35d"], ["d4", "a1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: straight queen move",
        text: "Move the queen straight to the star.",
        goal: "Use the queen's rook-like movement.",
        action: "Drag the queen from d4 to d8.",
        hints: ["Same file.", "Move straight up.", "Move d4-d8."],
        reveal: "Correct move: d4-d8.",
        diagramType: "challenge",
        fen: LESSON_FENS[5],
        startSquare: "d4",
        targetSquare: "d8",
        demoSquares: ["d5", "d6", "d7", "d8"],
        arrows: [["d4", "d8", "#9fd35d"]],
        expectedMove: "d4d8",
        errorText: "Queen moves straight or diagonal. Use the straight file.",
        successText: "Correct. The queen can move like a rook.",
      },
      {
        kind: "practice",
        title: "Practice 2: diagonal capture",
        text: "Capture the piece on the diagonal.",
        goal: "Use the queen's bishop-like movement.",
        action: "Drag the queen from d4 to h8.",
        hints: ["The target is diagonal.", "The queen can move like a bishop.", "Move d4xh8."],
        reveal: "Correct move: d4-h8.",
        diagramType: "capture",
        fen: "k6n/8/8/8/3Q4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "h8",
        captureSquares: ["h8"],
        arrows: [["d4", "h8", "#e0c85a"]],
        expectedMove: "d4h8",
        errorText: "The queen can capture diagonally here.",
        successText: "Correct. The queen captured on a diagonal.",
      },
      {
        kind: "practice",
        title: "Practice 3: queen blocked",
        text: "A queen is powerful, but she still cannot jump over pieces.",
        goal: "Avoid the blocked file.",
        action: "The red square blocks the file. Move diagonally to a1.",
        hints: ["The queen cannot pass through d6.", "Use a clear diagonal.", "Move d4-a1."],
        reveal: "Correct move: d4-a1.",
        diagramType: "blocked",
        fen: "k7/8/3P4/8/3Q4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "a1",
        blockedSquares: ["d6"],
        demoSquares: ["c3", "b2", "a1"],
        arrows: [["d4", "a1", "#9fd35d"]],
        expectedMove: "d4a1",
        errorText: "Even the queen cannot jump over blockers.",
        successText: "Good. Queens need clear straight or diagonal paths.",
      },
      {
        kind: "complete",
        title: "Queen complete",
        text: "Good job! Queen moves straight and diagonally, but cannot jump over pieces.",
        goal: "Remember the queen rule.",
        action: "Finish the lesson.",
        hints: ["Rook plus bishop.", "Many directions.", "No jumping."],
        reveal: "Queen lesson complete.",
        diagramType: "success",
        fen: "k7/8/8/8/8/8/8/Q3K3 b - - 1 1",
        successText: "Good job! Now you understand queen movement.",
      },
    ],
  },
  6: {
    title: "King Movement",
    summary: "King moves one square in any direction, but cannot move into check.",
    steps: [
      {
        kind: "explain",
        title: "King moves one square",
        text: "The king can move one square in any direction.",
        goal: "See the nearby king squares.",
        action: "The board is locked. Watch the one-square moves.",
        hints: ["King moves slowly.", "Only one square.", "Safety matters."],
        reveal: "King moves one square in any direction.",
        diagramType: "path",
        fen: "7k/8/8/8/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        demoSquares: ["d3", "e3", "f3", "d4", "f4", "d5", "e5", "f5"],
        arrows: [["e4", "d5", "#9fd35d"], ["e4", "e5", "#9fd35d"], ["e4", "f5", "#9fd35d"], ["e4", "d4", "#9fd35d"], ["e4", "f4", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: one-square move",
        text: "Move the king one square to the star.",
        goal: "Practice a simple king step.",
        action: "Drag the king from e4 to e5.",
        hints: ["Only one square.", "The star is directly above.", "Move e4-e5."],
        reveal: "Correct move: e4-e5.",
        diagramType: "challenge",
        fen: "7k/8/8/8/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "e5",
        demoSquares: ["e5"],
        arrows: [["e4", "e5", "#9fd35d"]],
        expectedMove: "e4e5",
        errorText: "King moves only one square.",
        successText: "Correct. The king moved one square.",
      },
      {
        kind: "practice",
        title: "Practice 2: safe capture",
        text: "The king can capture one square away if the square is safe.",
        goal: "Capture safely with the king.",
        action: "Drag the king from e4 to f5.",
        hints: ["The piece is one square away.", "The square is safe.", "Move e4xf5."],
        reveal: "Correct move: e4-f5.",
        diagramType: "capture",
        fen: "7k/8/8/5p2/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "f5",
        captureSquares: ["f5"],
        arrows: [["e4", "f5", "#e0c85a"]],
        expectedMove: "e4f5",
        errorText: "The king captures only one square away.",
        successText: "Correct. The king can capture on a safe nearby square.",
      },
      {
        kind: "practice",
        title: "Practice 3: avoid danger",
        text: "The king cannot move onto an attacked square. Avoid the red square.",
        goal: "Choose a safe king move.",
        action: "Move the king from e4 to d4.",
        hints: ["Red squares are dangerous.", "Do not move into check.", "Move e4-d4."],
        reveal: "Correct move: e4-d4.",
        diagramType: "blocked",
        fen: "7k/8/8/r7/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "d4",
        dangerSquares: ["e5"],
        demoSquares: ["d4"],
        arrows: [["e4", "d4", "#9fd35d"]],
        expectedMove: "e4d4",
        errorText: "King cannot move into check. Avoid the red square.",
        successText: "Good. King safety comes first.",
      },
      {
        kind: "complete",
        title: "King complete",
        text: "Good job! King moves one square and cannot move into check.",
        goal: "Remember king safety.",
        action: "Finish the lesson.",
        hints: ["One square.", "Any direction.", "Never into check."],
        reveal: "King lesson complete.",
        diagramType: "success",
        fen: "7k/8/8/8/3K4/8/8/8 b - - 1 1",
        successText: "Good job! Now you understand king movement.",
      },
    ],
  },
  7: {
    title: "Castling",
    summary: "Castling moves the king two squares and the rook next to it when the path is clear and safe.",
    steps: [
      {
        kind: "explain",
        title: "Castling moves king and rook",
        text: "Castling is a special move: the king moves two squares, and the rook jumps beside it.",
        goal: "See the king and rook move together.",
        action: "The board is locked. Watch the castling arrows.",
        hints: ["Path must be clear.", "King moves two squares.", "Rook lands beside the king."],
        reveal: "Kingside castling is e1-g1, with the rook moving h1-f1.",
        diagramType: "path",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        demoSquares: ["f1", "g1", "h1"],
        arrows: [["e1", "g1", "#9fd35d"], ["h1", "f1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Practice 1: castle kingside",
        text: "Castle kingside to protect your king.",
        goal: "Practice the basic castling move.",
        action: "Drag the king from e1 to g1.",
        hints: ["Move the king, not the rook.", "The king moves two squares.", "Move e1-g1."],
        reveal: "Correct move: e1-g1.",
        diagramType: "challenge",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "g1",
        demoSquares: ["f1", "g1"],
        arrows: [["e1", "g1", "#9fd35d"], ["h1", "f1", "#9fd35d"]],
        expectedMove: "e1g1",
        errorText: "For castling, move the king two squares.",
        successText: "Correct. The king castled and the rook moved beside it.",
      },
      {
        kind: "practice",
        title: "Practice 2: castle queenside",
        text: "Castling can also happen on the queenside when the path is clear.",
        goal: "Practice queenside castling.",
        action: "Drag the king from e1 to c1.",
        hints: ["Move the king toward the rook on a1.", "The king lands on c1.", "Move e1-c1."],
        reveal: "Correct move: e1-c1.",
        diagramType: "challenge",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "c1",
        demoSquares: ["d1", "c1", "a1"],
        arrows: [["e1", "c1", "#9fd35d"], ["a1", "d1", "#9fd35d"]],
        expectedMove: "e1c1",
        errorText: "Queenside castling moves the king from e1 to c1.",
        successText: "Correct. Queenside castling moves the rook to d1.",
      },
      {
        kind: "practice",
        title: "Practice 3: blocked castling",
        text: "You cannot castle through a blocked path. Choose the clear side.",
        goal: "Recognize blocked castling.",
        action: "Kingside is blocked. Castle queenside.",
        hints: ["The red square blocks kingside castling.", "Look to the clear rook.", "Move e1-c1."],
        reveal: "Correct move: e1-c1.",
        diagramType: "blocked",
        fen: "r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "c1",
        blockedSquares: ["f1"],
        demoSquares: ["d1", "c1"],
        arrows: [["e1", "c1", "#9fd35d"], ["a1", "d1", "#9fd35d"]],
        expectedMove: "e1c1",
        errorText: "A piece on f1 blocks kingside castling.",
        successText: "Good. Castling needs a clear path.",
      },
      {
        kind: "complete",
        title: "Castling complete",
        text: "Good job! Castling moves the king and rook together when the path is clear and safe.",
        goal: "Remember the castling idea.",
        action: "Finish the lesson.",
        hints: ["King moves two squares.", "Rook lands beside it.", "Path must be clear."],
        reveal: "Castling lesson complete.",
        diagramType: "success",
        fen: "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1",
        successText: "Good job! Now you know the basic castling idea.",
      },
    ],
  },
};

function makePieceMovementSteps(id: number): LessonStep[] | null {
  const lesson = BEGINNER_TRAINER_LESSONS[id];
  if (!lesson) return null;

  return lesson.steps.map((step, index) => ({
    ...step,
    id: `${id}-${step.kind}-${index + 1}`,
  }));
}

function makeSteps(id: number, title: string, level: LessonLevel, type: LessonType): LessonStep[] {
  const pieceMovementSteps = makePieceMovementSteps(id);
  if (pieceMovementSteps) return pieceMovementSteps;

  const hints = hintsFor(title, level);
  const practical = type !== "theory" && type !== "review";

  return [
    {
      id: `${id}-explain`,
      kind: "explain",
      title: "Idea",
      text:
        level === "beginner"
          ? `У цьому кроці дивимось на тему “${title}” дуже просто: що змінюється на дошці і чому це важливо.`
          : `У цьому кроці шукаємо, як тема “${title}” змінює оцінку позиції або план гри.`,
      goal: "Зрозуміти головну ідею перед ходом.",
      action: "Прочитай коротке пояснення і переходь далі.",
      hints,
      reveal: `Головна ідея: “${title}” має бути помітна на дошці до того, як ти натиснеш Check Move.`,
    },
    {
      id: `${id}-demo`,
      kind: "demo",
      title: "Example",
      text: "Подивись на позицію. AI Coach справа підкаже напрямок, але рішення лишається за тобою.",
      goal: "Побачити кандидатні ходи.",
      action: "Назви подумки 2 кандидатні ходи.",
      hints,
      reveal: "Сильний кандидатний хід зазвичай покращує найгіршу фігуру або створює конкретну загрозу.",
    },
    {
      id: `${id}-task`,
      kind: practical ? "task" : "check",
      title: practical ? "Your move" : "Quick check",
      text: practical
        ? "Зроби хід на дошці, а потім натисни Check Move справа."
        : "Поясни ідею своїми словами, потім відкрий Reveal для перевірки.",
      goal: "Закріпити ідею дією.",
      action: practical ? "Зроби хід або скористайся Hint." : "Натисни Reveal, якщо хочеш побачити формулювання.",
      hints,
      reveal: SOLUTION_MOVES[id]
        ? `Правильний напрямок: ${SOLUTION_MOVES[id].slice(0, 2)}-${SOLUTION_MOVES[id].slice(2, 4)}.`
        : "Тут важливіше пояснити план: активність фігур, безпека короля і слабкі поля.",
    },
    {
      id: `${id}-check`,
      kind: "check",
      title: "Review",
      text: "Тепер коротко перевір: що змінилось після правильного ходу і яка ідея переходить у наступний крок.",
      goal: "Навчитись пояснювати не тільки хід, а й причину.",
      action: "Використай AI Coach справа, якщо потрібне коротке резюме.",
      hints,
      reveal: "Сильний хід має ідею, наслідок і наступний план.",
    },
    {
      id: `${id}-complete`,
      kind: "complete",
      title: "Finish",
      text: "Урок завершено. Забери XP, подивись feedback і переходь до наступного рівня.",
      goal: "Закрити урок і відкрити наступний.",
      action: "Натисни Finish справа.",
      hints,
      reveal: "Готово. Повторити урок можна будь-коли з карти.",
    },
  ];
}

export const LESSON_LEVELS: LessonRecord[] = TITLES.map((title, index) => {
  const id = index + 1;
  const level = levelForId(id);
  const type = typeForId(id);
  const durationMinutes = level === "beginner" ? 5 + (id % 3) : level === "amateur" ? 8 + (id % 5) : 11 + (id % 6);
  const xp = level === "beginner" ? 20 + id : level === "amateur" ? 45 + id : 75 + id;

  return {
    id,
    level,
    title,
    shortDescription: shortDescriptionFor(title, level),
    difficulty: difficultyForLevel(level),
    durationMinutes,
    xp,
    type,
    goal: goalFor(title, level),
    steps: makeSteps(id, title, level, type),
    fen: LESSON_FENS[id] ?? STARTING_FEN,
    solutionMove: SOLUTION_MOVES[id],
  };
});

export function createDefaultLessonProgress(): LessonProgressState {
  return {
    selectedLevel: null,
    completedLessonIds: [],
    skippedLessonIds: [],
    xp: 0,
    streakDates: [],
    currentLessonId: 1,
    currentStepByLesson: {},
    hintLevelByLesson: {},
    lastFeedback: "Choose your level to start a structured chess course.",
  };
}
