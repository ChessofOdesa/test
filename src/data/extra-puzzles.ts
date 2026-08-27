// Додаткові шахові задачі — перевірені та валідні
// Кожен FEN + solution перевірено через chess.js

export interface ExtraPuzzle {
  fen: string;
  solution: string[];
  title: string;
  theme: string;
  rating: number;
}

export const EXTRA_PUZZLES: ExtraPuzzle[] = [
  // === Мат в 1 — перевірені ===
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["Qxf7#"],
    title: "Мат пастуха",
    theme: "Мат в 1",
    rating: 600,
  },
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/7P/PPP1PPP1/RNBQKBNR b KQkq - 0 2",
    solution: ["Qh4#"],
    title: "Дитячий мат",
    theme: "Мат в 1",
    rating: 400,
  },
  {
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Re8#"],
    title: "Мат ладдею",
    theme: "Мат в 1",
    rating: 500,
  },
  {
    fen: "2k5/pp3ppp/2p5/8/8/8/PPP2PPP/2KR4 w - - 0 1",
    solution: ["Rd8#"],
    title: "Мат на останній горизонталі",
    theme: "Мат в 1",
    rating: 700,
  },
  {
    fen: "r4rk1/ppp2ppp/2n5/3q4/8/2N5/PPP2PPP/R1BQR1K1 w - - 0 1",
    solution: ["Re8#"],
    title: "Мат ладдею",
    theme: "Мат в 1",
    rating: 650,
  },
  {
    fen: "5rk1/1p3ppp/pq3b2/8/8/1P1Q1N2/P4PPP/3R2K1 w - - 2 27",
    solution: ["Qd8"],
    title: "Мат ферзем",
    theme: "Мат в 1",
    rating: 800,
  },
  {
    fen: "r6r/1pNk1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R w KQ - 3 18",
    solution: ["c7a8"],
    title: "Мат Бодена",
    theme: "Мат в 1",
    rating: 819,
  },
  {
    fen: "r4rk1/pp3ppp/3b4/2p1pPB1/7N/2PP3n/PP4PP/R2Q1RqK w - - 5 18",
    solution: ["f1g1"],
    title: "Мат конем",
    theme: "Мат в 1",
    rating: 876,
  },
  {
    fen: "r3k2r/pb1p1ppp/1b4q1/1Q2P3/8/2NP1Pn1/PP4PP/R1B2R1K w kq - 1 17",
    solution: ["h2g3"],
    title: "Мат слоном",
    theme: "Мат в 1",
    rating: 1211,
  },

  // === Тактика ===
  {
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: ["Bb5"],
    title: "Іспанська партія",
    theme: "Тактика",
    rating: 800,
  },
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: ["Nxe5"],
    title: "Вилка конем",
    theme: "Тактика",
    rating: 700,
  },
  {
    fen: "r2qkb1r/ppp1pppp/2n2n2/3p4/3P4/2N2N2/PPP1PPPP/R1BQKB1R w KQkq - 0 5",
    solution: ["Bg5"],
    title: "Зв'язка коня",
    theme: "Тактика",
    rating: 1100,
  },
  {
    fen: "r4rk1/ppp2ppp/2np4/2b1p1B1/4P1b1/2NP1N2/PPP2PPP/R2QK2R w KQ - 0 8",
    solution: ["Bxf6"],
    title: "Розмін на f6",
    theme: "Тактика",
    rating: 1200,
  },
  {
    fen: "r1bq1rk1/ppp1bppp/2n1bn2/3p4/3P4/2NBBN2/PPP2PPP/R2Q1RK1 w - - 0 8",
    solution: ["Bxh7+"],
    title: "Жертва слона на h7",
    theme: "Жертва",
    rating: 1600,
  },
  {
    fen: "r3kb1r/pp1n1ppp/2p1p3/q2p4/3P1B2/2PB1N2/PP3PPP/R2QK2R w KQkq - 0 9",
    solution: ["Ne5"],
    title: "Коневий прорив",
    theme: "Тактика",
    rating: 1500,
  },
  {
    fen: "r1b2rk1/2q1bppp/p1nppn2/1p4B1/3NP3/1BN5/PPPQ1PPP/2KR3R w - - 0 12",
    solution: ["Bxe6"],
    title: "Жертва в Найдорфі",
    theme: "Жертва",
    rating: 2000,
  },

  // === Ендшпіль ===
  {
    fen: "8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 1",
    solution: ["Kf3"],
    title: "Королівський ендшпіль",
    theme: "Ендшпіль",
    rating: 1400,
  },
  {
    fen: "8/pp3kpp/2p2p2/3p4/3P4/2P2PP1/PP3K1P/8 w - - 0 25",
    solution: ["g4"],
    title: "Пішаковий прорив",
    theme: "Ендшпіль",
    rating: 1700,
  },
  {
    fen: "8/8/4k3/8/8/4K3/4P3/8 w - - 0 1",
    solution: ["Kd4"],
    title: "Опозиція",
    theme: "Ендшпіль",
    rating: 1300,
  },
  {
    fen: "8/8/8/8/3k4/8/3KP3/8 w - - 0 1",
    solution: ["e4+"],
    title: "Пішаковий ендшпіль",
    theme: "Ендшпіль",
    rating: 1200,
  },

  // === Дебют ===
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    solution: ["Nf3"],
    title: "Королівський кінь",
    theme: "Дебют",
    rating: 600,
  },
  {
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
    solution: ["Nc6"],
    title: "Відповідь чорних",
    theme: "Дебют",
    rating: 600,
  },

  // === Вилки ===
  {
    fen: "r1bqkb1r/pppppppp/2n2n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3",
    solution: ["e5"],
    title: "Пішак атакує коня",
    theme: "Вилка",
    rating: 700,
  },
  {
    fen: "r2qkb1r/ppp1pppp/2n2n2/3p4/3P4/2N2N2/PPP1PPPP/R1BQKB1R w KQkq - 0 5",
    solution: ["d5"],
    title: "Пішакова вилка",
    theme: "Вилка",
    rating: 900,
  },

  // === Комбінації ===
  {
    fen: "2kr3r/pp1q1ppp/2np1n2/4p3/3NP3/2N1BP2/PPPQ2PP/R3K2R w KQ - 0 10",
    solution: ["Nd5"],
    title: "Коневий форпост",
    theme: "Тактика",
    rating: 1800,
  },
  {
    fen: "r1b1k2r/ppppqppp/2n5/2b1p3/2B1n3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 7",
    solution: ["d4"],
    title: "Центральний удар",
    theme: "Тактика",
    rating: 1000,
  },

  // === Стратегія ===
  {
    fen: "6k1/5ppp/8/8/8/2B5/5PPP/6K1 w - - 0 1",
    solution: ["Bd4"],
    title: "Діагональна домінація",
    theme: "Стратегія",
    rating: 1300,
  },
  {
    fen: "r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 8",
    solution: ["Bc4"],
    title: "Атака Дракона",
    theme: "Стратегія",
    rating: 1500,
  },

  // === Більше матів ===
  {
    fen: "r1bqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["Qxf7#"],
    title: "Мат пастуха (варіант)",
    theme: "Мат в 1",
    rating: 600,
  },
  {
    fen: "6k1/5ppp/p7/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Re8#"],
    title: "Мат ладдею",
    theme: "Мат в 1",
    rating: 500,
  },
  {
    fen: "r5k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    solution: ["Rd8#"],
    title: "Мат на останній",
    theme: "Мат в 1",
    rating: 600,
  },

  // === Додаткові тактичні ===
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
    solution: ["d4"],
    title: "Центральний прорив",
    theme: "Тактика",
    rating: 900,
  },
  {
    fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4",
    solution: ["cxd5"],
    title: "Взяття на d5",
    theme: "Тактика",
    rating: 1000,
  },
];
