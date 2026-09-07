import { type BoardTheme } from "@/contexts/BoardSettingsContext";
import { type AILevel } from "@/lib/chessAI";
import { type Square } from "chess.js";
export type BehaviorTier = "Beginner" | "Intermediate" | "Advanced" | "Master" | "Adaptive" | "Engine";
export type BotQuoteEvent = "intro" | "playerStrongMove" | "playerMistake" | "botAttack" | "botWin" | "playerWin" | "draw";
export type BotProfile = {
    id: string;
    name: string;
    rating: number;
    character: string;
    style: string;
    description: string;
    shortLine: string;
    intro: string;
    flag: string | null;
    behaviorTier: BehaviorTier;
    aiLevel: AILevel;
    moveDelay: [
        number,
        number
    ];
    avatarTheme: {
        base: string;
        accent: string;
        ink: string;
        glow: string;
    };
};
export type TimeControlId = string;
export type SideChoice = "w" | "b" | "random";
export type EngineMode = "stockfish" | "fallback";
export type Arrow = [
    Square,
    Square,
    string?
];
export type ReviewInsight = {
    ply: number;
    move: string;
    label: "Blunder" | "Mistake" | "Inaccuracy";
    swing: number;
    suggestion: string | null;
};
export type ReviewMove = {
    san: string;
    from: Square;
    to: Square;
};
export const PLAY_BOARD_THEME: BoardTheme = {
    id: "play-bots",
    name: "Одеська синя",
    light: "#dce4f0",
    dark: "#7289ac",
};
export const STOCKFISH_MOVE_TIMEOUT_MS = 1400;
export const STOCKFISH_EVAL_TIMEOUT_MS = 900;
export const STOCKFISH_HINT_TIMEOUT_MS = 1200;
export const TIME_CONTROLS: Array<{
    id: TimeControlId;
    label: string;
    description: string;
    minutes: number | null;
}> = [
    { id: "unlimited", label: "Без годинника", description: "Спокійна тренувальна партія", minutes: null },
    { id: "1m", label: "1 хвилина", description: "Bullet", minutes: 1 },
    { id: "3m", label: "3 хвилини", description: "Швидкий бліц", minutes: 3 },
    { id: "5m", label: "5 хвилин", description: "Класичний бліц", minutes: 5 },
    { id: "10m", label: "10 хвилин", description: "Рапід", minutes: 10 },
    { id: "30m", label: "30 хвилин", description: "Довга партія", minutes: 30 },
];
export const PLAYER_SIDE_OPTIONS: Array<{
    value: SideChoice;
    label: string;
}> = [
    { value: "w", label: "Білі" },
    { value: "b", label: "Чорні" },
    { value: "random", label: "Випадково" },
];
export const SHARED_QUOTES: Record<Exclude<BotQuoteEvent, "intro">, string[]> = {
    playerStrongMove: [
        "О, це вже було розумно.",
        "Гарний удар по позиції.",
        "Ти не просто граєш — ти будуєш.",
        "Це був дуже чистий хід.",
        "Тепер мені цікавіше.",
    ],
    playerMistake: [
        "Тиша… і фігура вже під боєм.",
        "Ти відкрив двері, я зайду.",
        "Один необережний хід — і все змінилось.",
        "Моя улюблена мить: коли позиція тріщить.",
        "Тут пахне тактикою.",
    ],
    botAttack: [
        "Я не поспішаю. Я наближаюсь.",
        "Атака почалась ще кілька ходів тому.",
        "Тепер твій король слухає мене.",
        "На дошці стало гаряче.",
        "Я знайшов слабке місце.",
    ],
    botWin: [
        "Чисто. Холодно. Ефективно.",
        "Дякую за партію. Наступного разу буде складніше.",
        "Я не виграв випадково.",
        "Позиція все сказала сама.",
        "Ще одна партія — і ще один шанс.",
    ],
    playerWin: [
        "Ого. Це було красиво.",
        "Ти знайшов мій слабкий хід.",
        "Добре зіграно. Я це запам’ятаю.",
        "Сьогодні ти був точніший.",
        "Реванш?",
    ],
    draw: [
        "Рівновага теж буває красивою.",
        "Нічия, але напруга була справжня.",
        "Ми обидва втримали позицію.",
    ],
};
export const PIECE_VALUES: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 0,
};
export const PIECE_ICONS: Record<"w" | "b", Record<string, string>> = {
    w: { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" },
    b: { p: "p", n: "n", b: "b", r: "r", q: "q", k: "k" },
};
export const BOTS: BotProfile[] = [
    {
        id: "andriy",
        name: "Андрій",
        rating: 250,
        character: "новачок",
        style: "випадковий",
        description: "робить прості та іноді випадкові ходи",
        shortLine: "Я ще не чемпіон. Але сьогодні можу здивувати.",
        intro: "Я ще не чемпіон. Але сьогодні можу здивувати.",
        flag: "🇺🇦",
        behaviorTier: "Beginner",
        aiLevel: 1,
        moveDelay: [250, 520],
        avatarTheme: { base: "#5a4737", accent: "#f7b267", ink: "#efe6dc", glow: "#f59e0b" },
    },
    {
        id: "olena",
        name: "Олена",
        rating: 400,
        character: "спокійний",
        style: "захисний",
        description: "намагається захищати свої фігури",
        shortLine: "Спокій — це теж зброя.",
        intro: "Спокій — це теж зброя.",
        flag: "🇺🇦",
        behaviorTier: "Beginner",
        aiLevel: 1,
        moveDelay: [280, 560],
        avatarTheme: { base: "#523c57", accent: "#c084fc", ink: "#f5f3ff", glow: "#8b5cf6" },
    },
    {
        id: "ivan",
        name: "Іван",
        rating: 600,
        character: "обережний",
        style: "захисний",
        description: "уникає втрати фігур",
        shortLine: "Я не поспішаю. Я чекаю на твою помилку.",
        intro: "Я не поспішаю. Я чекаю на твою помилку.",
        flag: "🇺🇦",
        behaviorTier: "Beginner",
        aiLevel: 2,
        moveDelay: [300, 620],
        avatarTheme: { base: "#1f4d48", accent: "#2dd4bf", ink: "#e6fffb", glow: "#14b8a6" },
    },
    {
        id: "sofiia",
        name: "Софія",
        rating: 800,
        character: "терплячий",
        style: "позиційний",
        description: "намагається контролювати центр",
        shortLine: "Почнемо тихо, а далі подивимось, хто витримає.",
        intro: "Почнемо тихо, а далі подивимось, хто витримає.",
        flag: "🇺🇦",
        behaviorTier: "Intermediate",
        aiLevel: 2,
        moveDelay: [320, 660],
        avatarTheme: { base: "#284267", accent: "#7dd3fc", ink: "#eff6ff", glow: "#38bdf8" },
    },
    {
        id: "maksym",
        name: "Максим",
        rating: 1000,
        character: "логічний",
        style: "позиційний",
        description: "правильно розвиває фігури",
        shortLine: "На дошці немає випадковостей — тільки рішення.",
        intro: "На дошці немає випадковостей — тільки рішення.",
        flag: "🇺🇦",
        behaviorTier: "Intermediate",
        aiLevel: 3,
        moveDelay: [340, 700],
        avatarTheme: { base: "#454c27", accent: "#bef264", ink: "#f7fee7", glow: "#84cc16" },
    },
    {
        id: "dmytro",
        name: "Дмитро",
        rating: 1200,
        character: "агресивний",
        style: "атакуючий",
        description: "любить атакувати короля",
        shortLine: "Я відкриваю полювання.",
        intro: "Я відкриваю полювання.",
        flag: "🇺🇦",
        behaviorTier: "Intermediate",
        aiLevel: 4,
        moveDelay: [360, 740],
        avatarTheme: { base: "#5e3023", accent: "#fb7185", ink: "#fff1f2", glow: "#e11d48" },
    },
    {
        id: "mariia",
        name: "Марія",
        rating: 1400,
        character: "розумний",
        style: "позиційний",
        description: "добре розвиває позицію",
        shortLine: "Один хід — це ще не план. Подивимось далі.",
        intro: "Один хід — це ще не план. Подивимось далі.",
        flag: "🇺🇦",
        behaviorTier: "Advanced",
        aiLevel: 4,
        moveDelay: [380, 780],
        avatarTheme: { base: "#433165", accent: "#f9a8d4", ink: "#fdf2f8", glow: "#ec4899" },
    },
    {
        id: "pavlo",
        name: "Павло",
        rating: 1600,
        character: "тактичний",
        style: "атакуючий",
        description: "використовує тактичні удари",
        shortLine: "Мої комбінації не люблять поспіху.",
        intro: "Мої комбінації не люблять поспіху.",
        flag: "🇺🇦",
        behaviorTier: "Advanced",
        aiLevel: 5,
        moveDelay: [400, 820],
        avatarTheme: { base: "#274556", accent: "#60a5fa", ink: "#eff6ff", glow: "#2563eb" },
    },
    {
        id: "kateryna",
        name: "Катерина",
        rating: 1800,
        character: "швидкий",
        style: "активний",
        description: "грає активні позиції",
        shortLine: "Сьогодні я граю не фігурами — темпом.",
        intro: "Сьогодні я граю не фігурами — темпом.",
        flag: "🇺🇦",
        behaviorTier: "Advanced",
        aiLevel: 5,
        moveDelay: [420, 860],
        avatarTheme: { base: "#624137", accent: "#fdba74", ink: "#fff7ed", glow: "#f97316" },
    },
    {
        id: "viktor",
        name: "Віктор",
        rating: 2000,
        character: "стратегічний",
        style: "позиційний",
        description: "контролює слабкі поля",
        shortLine: "Центр — мій. Спробуй забрати.",
        intro: "Центр — мій. Спробуй забрати.",
        flag: "🇺🇦",
        behaviorTier: "Master",
        aiLevel: 6,
        moveDelay: [450, 900],
        avatarTheme: { base: "#304838", accent: "#4ade80", ink: "#f0fdf4", glow: "#22c55e" },
    },
    {
        id: "oleksandr",
        name: "Олександр",
        rating: 2200,
        character: "сильний",
        style: "атакуючий",
        description: "проводить складні атаки",
        shortLine: "Ти прийшов грати. Я — перевіряти.",
        intro: "Ти прийшов грати. Я — перевіряти.",
        flag: "🇺🇦",
        behaviorTier: "Master",
        aiLevel: 6,
        moveDelay: [480, 960],
        avatarTheme: { base: "#45355a", accent: "#a78bfa", ink: "#f5f3ff", glow: "#8b5cf6" },
    },
    {
        id: "taras",
        name: "Тарас",
        rating: 2400,
        character: "холоднокровний",
        style: "універсальний",
        description: "грає дуже стабільно",
        shortLine: "Тиха позиція — найгучніша пастка.",
        intro: "Тиха позиція — найгучніша пастка.",
        flag: "🇺🇦",
        behaviorTier: "Master",
        aiLevel: 7,
        moveDelay: [520, 1020],
        avatarTheme: { base: "#26374e", accent: "#93c5fd", ink: "#eff6ff", glow: "#3b82f6" },
    },
    {
        id: "bohdan",
        name: "Богдан",
        rating: 2600,
        character: "дуже сильний",
        style: "стратегічний",
        description: "майже не робить помилок",
        shortLine: "Помилка в дебюті — це вже історія.",
        intro: "Помилка в дебюті — це вже історія.",
        flag: "🇺🇦",
        behaviorTier: "Adaptive",
        aiLevel: 7,
        moveDelay: [540, 1060],
        avatarTheme: { base: "#35412b", accent: "#86efac", ink: "#f0fdf4", glow: "#16a34a" },
    },
    {
        id: "illia",
        name: "Гросмейстер Ілля",
        rating: 2800,
        character: "елітний",
        style: "універсальний",
        description: "грає як гросмейстер",
        shortLine: "Ласкаво просимо в партію без зайвих шансів.",
        intro: "Ласкаво просимо в партію без зайвих шансів.",
        flag: "🇺🇦",
        behaviorTier: "Master",
        aiLevel: 8,
        moveDelay: [560, 1100],
        avatarTheme: { base: "#4a2f3b", accent: "#f9a8d4", ink: "#fdf2f8", glow: "#db2777" },
    },
    {
        id: "engine",
        name: "Шаховий Двигун",
        rating: 3000,
        character: "комп’ютерний інтелект",
        style: "ідеальний",
        description: "максимально сильна гра",
        shortLine: "Аналіз завершено. Тепер ходи ти.",
        intro: "Аналіз завершено. Тепер ходи ти.",
        flag: null,
        behaviorTier: "Engine",
        aiLevel: 8,
        moveDelay: [620, 1180],
        avatarTheme: { base: "#16222d", accent: "#67e8f9", ink: "#ecfeff", glow: "#06b6d4" },
    },
];
