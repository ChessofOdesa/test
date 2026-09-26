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
    title: "Початківець",
    range: "Уроки 1–15",
    subtitle: "Дошка, фігури, шах, мат та основи дебюту.",
    description: "Для тих, хто вивчає правила. Зрозумілі пояснення, підказки та практичні приклади.",
    includes: ["прості правила", "покрокові підказки", "наочні приклади", "перевірка знань"],
    coachStyle: "Короткі завдання з докладними поясненнями.",
  },
  amateur: {
    title: "Аматор",
    range: "Уроки 16–35",
    subtitle: "Тактика, ініціатива, плани, атака, захист і типові помилки.",
    description: "Для тих, хто знає правила та хоче краще розраховувати варіанти. Більше самостійних рішень і пояснень.",
    includes: ["тактика", "пошук найкращого ходу", "розбір помилок", "практичні плани"],
    coachStyle: "Спочатку самостійний розрахунок, потім пояснення.",
  },
  master: {
    title: "Досвідчений",
    range: "Уроки 36–50",
    subtitle: "Ендшпілі, стратегія, динамічна гра та розбір партій.",
    description: "Для досвідчених гравців. Складніші позиції та мінімум підказок.",
    includes: ["ендшпілі", "стратегічні плани", "глибокий розрахунок", "мінімум підказок"],
    coachStyle: "Увага до точності розрахунку та якості рішень.",
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
    title: "Ходи пішака",
    summary: "Пішак ходить уперед, б’є по діагоналі, не повертається назад і може пройти два поля з початкової позиції.",
    steps: [
      {
        kind: "explain",
        title: "Пішак іде вперед",
        text: "Пішак ходить прямо вперед. З початкового поля він може пройти на одне або два поля.",
        goal: "Побачити напрямок руху пішака перед вправою.",
        action: "Дошка поки неактивна. Розглянь зелені стрілки й продовжуй.",
        hints: ["Пішак іде в бік суперника.", "Зелені поля показують ходи вперед.", "По діагоналі пішак лише б’є."],
        reveal: "Пішак ходить прямо вперед, а б’є по діагоналі.",
        diagramType: "path",
        fen: LESSON_FENS[1],
        startSquare: "e2",
        demoSquares: ["e3", "e4", "d3", "f3"],
        captureSquares: ["d3", "f3"],
        arrows: [["e2", "e3", "#9fd35d"], ["e2", "e4", "#9fd35d"], ["e2", "d3", "#e0c85a"], ["e2", "f3", "#e0c85a"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: хід уперед",
        text: "Пересунь пішака на одне поле вперед до позначки.",
        goal: "Зробити звичайний хід пішака.",
        action: "Пересунь пішака з e2 на e3.",
        hints: ["Пішак ходить прямо вперед.", "Без взяття не ходи по діагоналі.", "Зроби хід e2–e3."],
        reveal: "Правильний хід: e2–e3.",
        diagramType: "challenge",
        fen: LESSON_FENS[1],
        startSquare: "e2",
        targetSquare: "e3",
        demoSquares: ["e3", "e4"],
        arrows: [["e2", "e3", "#9fd35d"]],
        expectedMove: "e2e3",
        errorText: "Пішак не ходить убік або назад. Спробуй e2–e3.",
        successText: "Правильно! Пішак може піти на одне поле вперед.",
      },
      {
        kind: "practice",
        title: "Вправа 2: взяття по діагоналі",
        text: "Пішак б’є по діагоналі. Побий фігуру на позначеному полі.",
        goal: "Застосувати правило взяття пішаком.",
        action: "Пересунь пішака з e4 на d5.",
        hints: ["Пішак не б’є прямо перед собою.", "Шукай фігуру на сусідньому полі по діагоналі.", "Зроби взяття e4:d5."],
        reveal: "Правильне взяття: e4:d5.",
        diagramType: "capture",
        fen: "7k/8/8/3n4/4P3/8/8/4K3 w - - 0 1",
        startSquare: "e4",
        targetSquare: "d5",
        captureSquares: ["d5"],
        arrows: [["e4", "d5", "#e0c85a"]],
        expectedMove: "e4d5",
        errorText: "Пішак б’є по діагоналі, а не прямо.",
        successText: "Правильно! Пішак побив фігуру по діагоналі.",
      },
      {
        kind: "practice",
        title: "Вправа 3: шлях перекрито",
        text: "Пішак не може пройти через фігуру на e3. Знайди взяття по діагоналі.",
        goal: "Побачити перешкоду й знайти дозволене взяття.",
        action: "Поле попереду зайняте. Побий фігуру на f3.",
        hints: ["Червоне поле e3 перекриває шлях.", "Коли поле попереду зайняте, пішак не піде прямо.", "Зроби взяття e2:f3."],
        reveal: "Правильне взяття: e2:f3.",
        diagramType: "blocked",
        fen: "7k/8/8/8/8/4pn2/4P3/4K3 w - - 0 1",
        startSquare: "e2",
        targetSquare: "f3",
        blockedSquares: ["e3"],
        captureSquares: ["f3"],
        arrows: [["e2", "f3", "#e0c85a"]],
        expectedMove: "e2f3",
        errorText: "Попереду стоїть фігура. Пішак не може пройти крізь неї.",
        successText: "Добре! Коли шлях перекрито, пішак може лише побити фігуру по діагоналі.",
      },
      {
        kind: "complete",
        title: "Підсумок про пішака",
        text: "Пішак ходить уперед, б’є по діагоналі й не ходить назад. Із початкового поля він може пройти два поля, якщо шлях вільний.",
        goal: "Пригадати правила руху пішака.",
        action: "Заверши урок.",
        hints: ["Хід прямо вперед.", "Взяття по діагоналі.", "Назад ходити не можна."],
        reveal: "Урок про пішака завершено.",
        diagramType: "success",
        fen: "7k/8/8/8/4P3/8/8/4K3 b - - 0 1",
        successText: "Тепер ти знаєш основні ходи пішака.",
      },
    ],
  },
  2: {
    title: "Ходи тури",
    summary: "Тура ходить по горизонталі й вертикалі, б’є на прямих лініях і не перестрибує через фігури.",
    steps: [
      {
        kind: "explain",
        title: "Тура ходить по прямих",
        text: "Тура рухається по вільній горизонталі або вертикалі.",
        goal: "Побачити чотири напрямки руху тури.",
        action: "Дошка поки неактивна. Простеж за прямими стрілками.",
        hints: ["Уяви знак плюс від поля тури.", "По діагоналі тура не ходить.", "Фігура на шляху зупиняє туру."],
        reveal: "Тура ходить лише по горизонталі й вертикалі.",
        diagramType: "path",
        fen: "7k/8/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        demoSquares: ["d1", "d2", "d3", "d5", "d6", "d7", "d8", "a4", "b4", "c4", "e4", "f4", "g4", "h4"],
        arrows: [["d4", "d8", "#9fd35d"], ["d4", "d1", "#9fd35d"], ["d4", "a4", "#9fd35d"], ["d4", "h4", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: хід по вертикалі",
        text: "Пересунь туру вгору по прямій до позначки.",
        goal: "Виконати довгий хід турою по вертикалі.",
        action: "Пересунь туру з d4 на d8.",
        hints: ["Залишайся на вертикалі d.", "Рухайся прямо вгору.", "Зроби хід d4–d8."],
        reveal: "Правильний хід: d4–d8.",
        diagramType: "challenge",
        fen: "7k/8/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "d8",
        demoSquares: ["d5", "d6", "d7", "d8"],
        arrows: [["d4", "d8", "#9fd35d"]],
        expectedMove: "d4d8",
        errorText: "Тура не ходить по діагоналі. Залишайся на вертикалі d.",
        successText: "Правильно! Тура може пройти кілька вільних полів по прямій.",
      },
      {
        kind: "practice",
        title: "Вправа 2: взяття на одній вертикалі",
        text: "Побий фігуру на тій самій вертикалі, що й тура.",
        goal: "Виконати взяття турою по прямій.",
        action: "Пересунь туру з d4 на d7.",
        hints: ["Ціль стоїть на вертикалі d.", "Тура зупиниться на полі побитої фігури.", "Зроби взяття d4:d7."],
        reveal: "Правильне взяття: d4:d7.",
        diagramType: "capture",
        fen: "7k/3b4/8/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "d7",
        captureSquares: ["d7"],
        arrows: [["d4", "d7", "#e0c85a"]],
        expectedMove: "d4d7",
        errorText: "Тура б’є лише на своїй горизонталі або вертикалі.",
        successText: "Правильно! Тура побила фігуру по прямій.",
      },
      {
        kind: "practice",
        title: "Вправа 3: шлях перекрито",
        text: "Тура не перестрибує через фігури. Обери вільну горизонталь.",
        goal: "Помітити перекриту вертикаль.",
        action: "Фігура на d6 перекриває шлях угору. Пересунь туру на h4.",
        hints: ["Тура не може пройти крізь фігуру.", "Горизонталь праворуч вільна.", "Зроби хід d4–h4."],
        reveal: "Правильний хід: d4–h4.",
        diagramType: "blocked",
        fen: "7k/8/3P4/8/3R4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "h4",
        blockedSquares: ["d6"],
        demoSquares: ["e4", "f4", "g4", "h4"],
        arrows: [["d4", "h4", "#9fd35d"]],
        expectedMove: "d4h4",
        errorText: "Тура не перестрибує через фігури.",
        successText: "Добре! Для ходу турі потрібна вільна пряма лінія.",
      },
      {
        kind: "complete",
        title: "Підсумок про туру",
        text: "Тура ходить по горизонталі та вертикалі, б’є на цих лініях і не перестрибує через фігури.",
        goal: "Пригадати правила руху тури.",
        action: "Заверши урок.",
        hints: ["Лише прямі лінії.", "Без ходів по діагоналі.", "Без перестрибування."],
        reveal: "Урок про туру завершено.",
        diagramType: "success",
        fen: "7k/8/8/8/7R/8/8/4K3 b - - 1 1",
        successText: "Тепер ти знаєш основні ходи тури.",
      },
    ],
  },
  3: {
    title: "Ходи слона",
    summary: "Слон ходить по діагоналі, завжди залишається на полях одного кольору й не перестрибує через фігури.",
    steps: [
      {
        kind: "explain",
        title: "Слон ходить по діагоналі",
        text: "Слон рухається лише по діагоналях і залишається на полях одного кольору.",
        goal: "Побачити всі діагоналі від поля слона.",
        action: "Дошка поки неактивна. Простеж за діагональними стрілками.",
        hints: ["По прямій слон не ходить.", "Слон не змінює колір поля.", "Фігура на шляху перекриває діагональ."],
        reveal: "Слон ходить лише по діагоналі.",
        diagramType: "path",
        fen: "k7/8/8/8/3B4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        demoSquares: ["a1", "b2", "c3", "e5", "f6", "g7", "h8", "a7", "b6", "c5", "e3", "f2", "g1"],
        arrows: [["d4", "h8", "#9fd35d"], ["d4", "a7", "#9fd35d"], ["d4", "a1", "#9fd35d"], ["d4", "g1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: хід по діагоналі",
        text: "Пересунь слона по діагоналі до позначки.",
        goal: "Виконати хід слоном по діагоналі.",
        action: "Пересунь слона з d4 на g7.",
        hints: ["Рухайся по одній діагоналі.", "Ціль має той самий колір поля.", "Зроби хід d4–g7."],
        reveal: "Правильний хід: d4–g7.",
        diagramType: "challenge",
        fen: "k7/8/8/8/3B4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "g7",
        demoSquares: ["e5", "f6", "g7"],
        arrows: [["d4", "g7", "#9fd35d"]],
        expectedMove: "d4g7",
        errorText: "Слон ходить по діагоналі, а не по прямій.",
        successText: "Правильно! Слон пройшов по діагоналі.",
      },
      {
        kind: "practice",
        title: "Вправа 2: взяття по діагоналі",
        text: "Побий фігуру на діагоналі слона.",
        goal: "Виконати взяття слоном.",
        action: "Пересунь слона з c3 на g7.",
        hints: ["Фігура стоїть на діагоналі.", "По горизонталі слон не ходить.", "Зроби взяття c3:g7."],
        reveal: "Правильне взяття: c3:g7.",
        diagramType: "capture",
        fen: "k7/6n1/8/8/8/2B5/8/4K3 w - - 0 1",
        startSquare: "c3",
        targetSquare: "g7",
        captureSquares: ["g7"],
        arrows: [["c3", "g7", "#e0c85a"]],
        expectedMove: "c3g7",
        errorText: "Слон б’є по діагоналі.",
        successText: "Правильно! Слон побив фігуру по діагоналі.",
      },
      {
        kind: "practice",
        title: "Вправа 3: перекрита діагональ",
        text: "Слон не перестрибує через фігури. Знайди вільну діагональ.",
        goal: "Побачити, яка діагональ перекрита.",
        action: "Фігура на d4 перекриває шлях. Пересунь слона на b2.",
        hints: ["Фігура зупиняє рух у напрямку d4.", "Обери вільну діагональ.", "Зроби хід c3–b2."],
        reveal: "Правильний хід: c3–b2.",
        diagramType: "blocked",
        fen: "k7/8/8/8/3P4/2B5/8/4K3 w - - 0 1",
        startSquare: "c3",
        targetSquare: "b2",
        blockedSquares: ["d4"],
        demoSquares: ["b2"],
        arrows: [["c3", "b2", "#9fd35d"]],
        expectedMove: "c3b2",
        errorText: "Слон не може пройти крізь фігуру на d4.",
        successText: "Добре! Слон може йти лише вільною діагоналлю.",
      },
      {
        kind: "complete",
        title: "Підсумок про слона",
        text: "Слон ходить і б’є по діагоналі, залишається на полях одного кольору й не перестрибує через фігури.",
        goal: "Пригадати правила руху слона.",
        action: "Заверши урок.",
        hints: ["Лише діагоналі.", "Поля одного кольору.", "Без перестрибування."],
        reveal: "Урок про слона завершено.",
        diagramType: "success",
        fen: "k7/8/8/8/8/8/1B6/4K3 b - - 1 1",
        successText: "Тепер ти знаєш основні ходи слона.",
      },
    ],
  },
  4: {
    title: "Ходи коня",
    summary: "Кінь ходить літерою Г, перестрибує через фігури й після кожного ходу потрапляє на поле іншого кольору.",
    steps: [
      {
        kind: "explain",
        title: "Кінь ходить літерою Г",
        text: "Кінь проходить два поля в одному напрямку й одне вбік. Він може перестрибувати через фігури.",
        goal: "Побачити всі вісім можливих полів для коня.",
        action: "Дошка поки неактивна. Розглянь позначені поля.",
        hints: ["Кінь не ковзає по лінії.", "Кінь перестрибує через фігури.", "Після ходу змінюється колір поля."],
        reveal: "Кінь ходить літерою Г.",
        diagramType: "path",
        fen: LESSON_FENS[4],
        startSquare: "d4",
        demoSquares: ["b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5"],
        arrows: [["d4", "f5", "#9fd35d"], ["d4", "f3", "#9fd35d"], ["d4", "c6", "#9fd35d"], ["d4", "b5", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: хід літерою Г",
        text: "Пересунь коня на позначене поле.",
        goal: "Виконати хід конем літерою Г.",
        action: "Пересунь коня з d4 на f5.",
        hints: ["Два поля в одному напрямку й одне вбік.", "Позначене поле доступне коневі.", "Зроби хід d4–f5."],
        reveal: "Правильний хід: d4–f5.",
        diagramType: "challenge",
        fen: LESSON_FENS[4],
        startSquare: "d4",
        targetSquare: "f5",
        demoSquares: ["f5"],
        arrows: [["d4", "f5", "#9fd35d"]],
        expectedMove: "d4f5",
        errorText: "Кінь ходить літерою Г, а не по прямій.",
        successText: "Правильно! Це хід коня літерою Г.",
      },
      {
        kind: "practice",
        title: "Вправа 2: стрибок через фігури",
        text: "Інші фігури не перекривають шлях коневі. Стрибни на позначене поле.",
        goal: "Побачити, як кінь перестрибує через фігури.",
        action: "Пересунь коня з d4 на f3.",
        hints: ["Фігури довкола не блокують коня.", "Знайди поле на відстані ходу літерою Г.", "Зроби хід d4–f3."],
        reveal: "Правильний хід: d4–f3.",
        diagramType: "blocked",
        fen: "7k/8/8/3P4/2PNP3/3P4/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "f3",
        blockedSquares: ["c4", "d3", "d5", "e4"],
        arrows: [["d4", "f3", "#9fd35d"]],
        expectedMove: "d4f3",
        errorText: "Кінь перестрибує через фігури. Шукай хід літерою Г.",
        successText: "Правильно! Кінь перестрибнув через фігури.",
      },
      {
        kind: "practice",
        title: "Вправа 3: зміна кольору поля",
        text: "Після кожного ходу кінь опиняється на полі іншого кольору.",
        goal: "Побачити зміну кольору після стрибка.",
        action: "Пересунь коня з f3 на h4.",
        hints: ["Колір поля зміниться після ходу.", "Пам’ятай про хід літерою Г.", "Зроби хід f3–h4."],
        reveal: "Правильний хід: f3–h4.",
        diagramType: "challenge",
        fen: "7k/8/8/8/8/5N2/8/4K3 w - - 0 1",
        startSquare: "f3",
        targetSquare: "h4",
        demoSquares: ["h4"],
        arrows: [["f3", "h4", "#9fd35d"]],
        expectedMove: "f3h4",
        errorText: "Цей хід не відповідає руху коня літерою Г.",
        successText: "Добре! Кінь стрибнув на поле іншого кольору.",
      },
      {
        kind: "complete",
        title: "Підсумок про коня",
        text: "Кінь ходить літерою Г, перестрибує через фігури й після ходу змінює колір поля.",
        goal: "Пригадати правила руху коня.",
        action: "Заверши урок.",
        hints: ["Хід літерою Г.", "Кінь перестрибує.", "Колір поля змінюється."],
        reveal: "Урок про коня завершено.",
        diagramType: "success",
        fen: "7k/8/8/8/7N/8/8/4K3 b - - 1 1",
        successText: "Тепер ти знаєш основні ходи коня.",
      },
    ],
  },
  5: {
    title: "Ходи ферзя",
    summary: "Ферзь поєднує ходи тури й слона: рухається по прямій або діагоналі, але не перестрибує через фігури.",
    steps: [
      {
        kind: "explain",
        title: "Ферзь поєднує ходи тури й слона",
        text: "Ферзь ходить по горизонталі та вертикалі, як тура, і по діагоналі, як слон.",
        goal: "Побачити всі напрямки руху ферзя.",
        action: "Дошка поки неактивна. Порівняй прямі й діагональні стрілки.",
        hints: ["Ферзь контролює багато ліній.", "Ходить лише по прямій або діагоналі.", "Фігура на шляху зупиняє ферзя."],
        reveal: "Ферзь поєднує ходи тури й слона.",
        diagramType: "path",
        fen: LESSON_FENS[5],
        startSquare: "d4",
        demoSquares: ["d8", "d1", "a4", "h4", "a1", "h8", "a7", "g1"],
        arrows: [["d4", "h8", "#9fd35d"], ["d4", "d8", "#9fd35d"], ["d4", "h4", "#9fd35d"], ["d4", "a1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: хід по прямій",
        text: "Пересунь ферзя по прямій до позначки.",
        goal: "Скористатися ходом ферзя по вертикалі.",
        action: "Пересунь ферзя з d4 на d8.",
        hints: ["Залишайся на вертикалі d.", "Рухайся прямо вгору.", "Зроби хід d4–d8."],
        reveal: "Правильний хід: d4–d8.",
        diagramType: "challenge",
        fen: LESSON_FENS[5],
        startSquare: "d4",
        targetSquare: "d8",
        demoSquares: ["d5", "d6", "d7", "d8"],
        arrows: [["d4", "d8", "#9fd35d"]],
        expectedMove: "d4d8",
        errorText: "Ферзь ходить по прямій або діагоналі. Тут обери вертикаль d.",
        successText: "Правильно! Ферзь може ходити, як тура.",
      },
      {
        kind: "practice",
        title: "Вправа 2: взяття по діагоналі",
        text: "Побий фігуру на діагоналі ферзя.",
        goal: "Скористатися ходом ферзя по діагоналі.",
        action: "Пересунь ферзя з d4 на h8.",
        hints: ["Ціль стоїть на діагоналі.", "Ферзь може ходити, як слон.", "Зроби взяття d4:h8."],
        reveal: "Правильне взяття: d4:h8.",
        diagramType: "capture",
        fen: "k6n/8/8/8/3Q4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "h8",
        captureSquares: ["h8"],
        arrows: [["d4", "h8", "#e0c85a"]],
        expectedMove: "d4h8",
        errorText: "У цій позиції ферзь може побити фігуру по діагоналі.",
        successText: "Правильно! Ферзь побив фігуру по діагоналі.",
      },
      {
        kind: "practice",
        title: "Вправа 3: шлях перекрито",
        text: "Ферзь не перестрибує через фігури. Знайди вільну діагональ.",
        goal: "Побачити перекриту вертикаль.",
        action: "Фігура на d6 перекриває шлях угору. Пересунь ферзя на a1.",
        hints: ["Ферзь не може пройти крізь d6.", "Обери вільну діагональ.", "Зроби хід d4–a1."],
        reveal: "Правильний хід: d4–a1.",
        diagramType: "blocked",
        fen: "k7/8/3P4/8/3Q4/8/8/4K3 w - - 0 1",
        startSquare: "d4",
        targetSquare: "a1",
        blockedSquares: ["d6"],
        demoSquares: ["c3", "b2", "a1"],
        arrows: [["d4", "a1", "#9fd35d"]],
        expectedMove: "d4a1",
        errorText: "Ферзь не може перестрибнути через фігуру.",
        successText: "Добре! Для ходу ферзю потрібна вільна пряма або діагональ.",
      },
      {
        kind: "complete",
        title: "Підсумок про ферзя",
        text: "Ферзь ходить по прямій та діагоналі, але не перестрибує через фігури.",
        goal: "Пригадати правила руху ферзя.",
        action: "Заверши урок.",
        hints: ["Ходи тури й слона.", "Прямі та діагоналі.", "Без перестрибування."],
        reveal: "Урок про ферзя завершено.",
        diagramType: "success",
        fen: "k7/8/8/8/8/8/8/Q3K3 b - - 1 1",
        successText: "Тепер ти знаєш основні ходи ферзя.",
      },
    ],
  },
  6: {
    title: "Ходи короля",
    summary: "Король ходить на одне поле в будь-якому напрямку, але не може стати під шах.",
    steps: [
      {
        kind: "explain",
        title: "Король ходить на одне поле",
        text: "Король може перейти на одне сусіднє поле в будь-якому напрямку, якщо це поле безпечне.",
        goal: "Побачити сусідні поля короля.",
        action: "Дошка поки неактивна. Розглянь ходи на одне поле.",
        hints: ["Король рухається лише на одне поле.", "Можна йти в будь-якому напрямку.", "Не можна ставати під шах."],
        reveal: "Король ходить на одне безпечне поле в будь-якому напрямку.",
        diagramType: "path",
        fen: "7k/8/8/8/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        demoSquares: ["d3", "e3", "f3", "d4", "f4", "d5", "e5", "f5"],
        arrows: [["e4", "d5", "#9fd35d"], ["e4", "e5", "#9fd35d"], ["e4", "f5", "#9fd35d"], ["e4", "d4", "#9fd35d"], ["e4", "f4", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: крок королем",
        text: "Пересунь короля на одне поле до позначки.",
        goal: "Виконати простий хід королем.",
        action: "Пересунь короля з e4 на e5.",
        hints: ["Лише одне поле.", "Позначка прямо над королем.", "Зроби хід e4–e5."],
        reveal: "Правильний хід: e4–e5.",
        diagramType: "challenge",
        fen: "7k/8/8/8/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "e5",
        demoSquares: ["e5"],
        arrows: [["e4", "e5", "#9fd35d"]],
        expectedMove: "e4e5",
        errorText: "Король ходить лише на одне поле.",
        successText: "Правильно! Король перейшов на одне поле.",
      },
      {
        kind: "practice",
        title: "Вправа 2: безпечне взяття",
        text: "Король може побити сусідню фігуру, якщо поле не атаковане.",
        goal: "Безпечно побити фігуру королем.",
        action: "Пересунь короля з e4 на f5.",
        hints: ["Фігура стоїть на сусідньому полі.", "Поле f5 безпечне для короля.", "Зроби взяття e4:f5."],
        reveal: "Правильне взяття: e4:f5.",
        diagramType: "capture",
        fen: "7k/8/8/5p2/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "f5",
        captureSquares: ["f5"],
        arrows: [["e4", "f5", "#e0c85a"]],
        expectedMove: "e4f5",
        errorText: "Король може бити лише на сусідньому полі.",
        successText: "Правильно! Король побив фігуру на безпечному полі.",
      },
      {
        kind: "practice",
        title: "Вправа 3: уникни шаху",
        text: "Король не може перейти на поле під ударом. Поле e5 контролює чорна тура.",
        goal: "Знайти безпечний хід королем.",
        action: "Пересунь короля з e4 на d4.",
        hints: ["Поле e5 під ударом тури.", "Не став короля під шах.", "Зроби хід e4–d4."],
        reveal: "Правильний хід: e4–d4.",
        diagramType: "blocked",
        fen: "7k/8/8/r7/4K3/8/8/8 w - - 0 1",
        startSquare: "e4",
        targetSquare: "d4",
        dangerSquares: ["e5"],
        demoSquares: ["d4"],
        arrows: [["e4", "d4", "#9fd35d"]],
        expectedMove: "e4d4",
        errorText: "Король не може стати під шах. Уникай поля e5.",
        successText: "Добре! Безпека короля важливіша за напрямок ходу.",
      },
      {
        kind: "complete",
        title: "Підсумок про короля",
        text: "Король ходить на одне поле та не може переходити на атаковане поле.",
        goal: "Пригадати правило безпеки короля.",
        action: "Заверши урок.",
        hints: ["Один крок.", "Будь-який напрямок.", "Не ставай під шах."],
        reveal: "Урок про короля завершено.",
        diagramType: "success",
        fen: "7k/8/8/8/3K4/8/8/8 b - - 1 1",
        successText: "Тепер ти знаєш основні ходи короля.",
      },
    ],
  },
  7: {
    title: "Рокіровка",
    summary: "Під час рокіровки король переходить на два поля, а тура стає поруч. Потрібні вільний шлях і безпечні поля короля.",
    steps: [
      {
        kind: "explain",
        title: "Рокіровка: король і тура",
        text: "Рокіровка — особливий хід: король переходить на два поля, а тура стає поруч. Король і ця тура ще не рухалися; між ними немає фігур, король не під шахом і не проходить через атаковане поле.",
        goal: "Побачити спільний хід короля й тури.",
        action: "Дошка поки неактивна. Простеж за стрілками рокіровки.",
        hints: ["Між королем і турою потрібен вільний шлях.", "Король переходить на два поля.", "Тура стає поруч із королем."],
        reveal: "Коротка рокіровка: король e1–g1, тура h1–f1.",
        diagramType: "path",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        demoSquares: ["f1", "g1", "h1"],
        arrows: [["e1", "g1", "#9fd35d"], ["h1", "f1", "#9fd35d"]],
      },
      {
        kind: "practice",
        title: "Вправа 1: коротка рокіровка",
        text: "Зроби коротку рокіровку, щоб наблизити туру до центру й захистити короля.",
        goal: "Виконати коротку рокіровку.",
        action: "Пересунь короля з e1 на g1.",
        hints: ["Починай хід королем, а не турою.", "Король переходить на два поля.", "Зроби хід e1–g1."],
        reveal: "Правильний хід: e1–g1.",
        diagramType: "challenge",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "g1",
        demoSquares: ["f1", "g1"],
        arrows: [["e1", "g1", "#9fd35d"], ["h1", "f1", "#9fd35d"]],
        expectedMove: "e1g1",
        errorText: "Для рокіровки пересунь короля на два поля.",
        successText: "Правильно! Король зробив рокіровку, а тура стала поруч.",
      },
      {
        kind: "practice",
        title: "Вправа 2: довга рокіровка",
        text: "За вільного й безпечного шляху можна рокірувати в інший бік.",
        goal: "Виконати довгу рокіровку.",
        action: "Пересунь короля з e1 на c1.",
        hints: ["Рухай короля в бік тури на a1.", "Король стане на c1.", "Зроби хід e1–c1."],
        reveal: "Правильний хід: e1–c1.",
        diagramType: "challenge",
        fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "c1",
        demoSquares: ["d1", "c1", "a1"],
        arrows: [["e1", "c1", "#9fd35d"], ["a1", "d1", "#9fd35d"]],
        expectedMove: "e1c1",
        errorText: "Під час довгої рокіровки король переходить з e1 на c1.",
        successText: "Правильно! Після довгої рокіровки тура стала на d1.",
      },
      {
        kind: "practice",
        title: "Вправа 3: одна сторона перекрита",
        text: "Якщо між королем і турою є фігура, рокіровка в цей бік неможлива.",
        goal: "Помітити перекритий шлях для рокіровки.",
        action: "Слон на f1 заважає короткій рокіровці. Зроби довгу.",
        hints: ["Поле f1 зайняте слоном.", "Поглянь у бік вільної тури.", "Зроби хід e1–c1."],
        reveal: "Правильний хід: e1–c1.",
        diagramType: "blocked",
        fen: "r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1",
        startSquare: "e1",
        targetSquare: "c1",
        blockedSquares: ["f1"],
        demoSquares: ["d1", "c1"],
        arrows: [["e1", "c1", "#9fd35d"], ["a1", "d1", "#9fd35d"]],
        expectedMove: "e1c1",
        errorText: "Фігура на f1 заважає короткій рокіровці.",
        successText: "Добре! Для рокіровки між королем і турою має бути вільний шлях.",
      },
      {
        kind: "complete",
        title: "Підсумок про рокіровку",
        text: "Під час рокіровки король і тура рухаються одним ходом, якщо виконано умови: вони ще не ходили, шлях вільний, а король не під шахом і не проходить через атаковані поля.",
        goal: "Пригадати умови рокіровки.",
        action: "Заверши урок.",
        hints: ["Король переходить на два поля.", "Тура стає поруч.", "Шлях і поля короля мають бути безпечними."],
        reveal: "Урок про рокіровку завершено.",
        diagramType: "success",
        fen: "r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1",
        successText: "Тепер ти знаєш, як виконується рокіровка.",
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
  const practical = type !== "theory" && type !== "review" && Boolean(SOLUTION_MOVES[id]);

  return [
    {
      id: `${id}-explain`,
      kind: "explain",
      title: "Ідея",
      text:
        level === "beginner"
          ? `У цьому кроці дивимось на тему “${title}” дуже просто: що змінюється на дошці і чому це важливо.`
          : `У цьому кроці шукаємо, як тема “${title}” змінює оцінку позиції або план гри.`,
      goal: "Зрозуміти головну ідею перед ходом.",
      action: "Прочитай коротке пояснення і переходь далі.",
      hints,
      reveal: `Головну ідею теми «${title}» варто знайти на дошці перед переходом далі.`,
    },
    {
      id: `${id}-demo`,
      kind: "demo",
      title: "Приклад",
      text: "Подивись на позицію та спробуй знайти два кандидатні ходи самостійно.",
      goal: "Побачити кандидатні ходи.",
      action: "Назви подумки 2 кандидатні ходи.",
      hints,
      reveal: "Сильний кандидатний хід зазвичай покращує найгіршу фігуру або створює конкретну загрозу.",
    },
    {
      id: `${id}-task`,
      kind: practical ? "task" : "check",
      title: practical ? "Твій хід" : "Перевірка ідеї",
      text: practical
        ? "Зроби хід на дошці. Якщо складно, скористайся підказкою."
        : "Поясни ідею своїми словами, потім відкрий розв’язок для перевірки.",
      goal: "Закріпити ідею дією.",
      action: practical ? "Зроби хід або скористайся підказкою." : "Покажи розв’язок, щоб перевірити своє пояснення.",
      hints,
      reveal: SOLUTION_MOVES[id]
        ? `Правильний напрямок: ${SOLUTION_MOVES[id].slice(0, 2)}-${SOLUTION_MOVES[id].slice(2, 4)}.`
        : "Тут важливіше пояснити план: активність фігур, безпека короля і слабкі поля.",
    },
    {
      id: `${id}-check`,
      kind: "check",
      title: "Підсумок",
      text: "Тепер коротко перевір: що змінилось після правильного ходу і яка ідея переходить у наступний крок.",
      goal: "Навчитись пояснювати не тільки хід, а й причину.",
      action: "Порівняй своє пояснення з розв’язком праворуч.",
      hints,
      reveal: "Сильний хід має ідею, наслідок і наступний план.",
    },
    {
      id: `${id}-complete`,
      kind: "complete",
      title: "Завершення",
      text: "Підсумуй вивчене й переходь до наступного уроку.",
      goal: "Закрити урок і відкрити наступний.",
      action: "Натисни «Завершити» праворуч.",
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
    lastFeedback: "Оберіть рівень, щоб розпочати шаховий курс.",
  };
}
