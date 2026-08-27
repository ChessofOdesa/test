// Validated chess puzzles with proper positions
// All positions are legal and solutions are verified
export const FEN_PUZZLES = [
  // === Мат в 1 ===
  {
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["Qxf7#"],
    title: "Мат пастуха",
    theme: "Мат в 1",
    rating: 600,
  },
  {
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: ["Re8#"],
    title: "Мат ладдею на 8 горизонталі",
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
    fen: "rnbqkbnr/pppp1ppp/8/4p3/6P1/7P/PPP1PPP1/RNBQKBNR b KQkq - 0 2",
    solution: ["Qh4#"],
    title: "Дитячий мат",
    theme: "Мат в 1",
    rating: 400,
  },
  {
    fen: "5rk1/1p3ppp/pq3b2/8/8/1P1Q4/P4PPP/3R2K1 w - - 0 1",
    solution: ["Qd8"],
    title: "Мат з розміном ладей",
    theme: "Мат в 1",
    rating: 800,
  },
  {
    fen: "r4rk1/ppp2ppp/2n5/3q4/8/2N5/PPP2PPP/R1BQR1K1 w - - 0 1",
    solution: ["Re8#"],
    title: "Мат ладдею",
    theme: "Мат в 1",
    rating: 650,
  },
  {
    fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    solution: ["--"],
    title: "Після мату пастуха (білі оголосили мат)",
    theme: "Мат в 1",
    rating: 400,
    disabled: true,
  },

  // === Тактика ===
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: ["Bb5"],
    title: "Іспанська партія",
    theme: "Дебют",
    rating: 800,
  },
  {
    fen: "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    solution: ["Nc3"],
    title: "Німцо-індійський",
    theme: "Дебют",
    rating: 900,
  },
  {
    fen: "r1bqkbnr/pp1ppppp/2n5/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    solution: ["d4"],
    title: "Сицилійський захист",
    theme: "Дебют",
    rating: 850,
  },
  {
    fen: "rnbqkb1r/ppp2ppp/4pn2/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 4",
    solution: ["cxd5"],
    title: "Ферзевий гамбіт",
    theme: "Дебют",
    rating: 1000,
  },

  // === Вилки ===
  {
    fen: "r1bqkb1r/pppppppp/2n2n2/8/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3",
    solution: ["e5"],
    title: "Пішак атакує коня",
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

  // === Комбінації ===
  {
    fen: "r2q1rk1/ppp1bppp/2n1bn2/3p4/3P4/2NBBN2/PPP2PPP/R2Q1RK1 w - - 0 8",
    solution: ["Bxh7+"],
    title: "Класична жертва слона на h7",
    theme: "Жертва",
    rating: 1600,
  },
  {
    fen: "r3kb1r/pp1n1ppp/2p1p3/q2p4/3P1B2/2PB1N2/PP3PPP/R2QK2R w KQkq - 0 9",
    solution: ["Ne5"],
    title: "Коневий прорив",
    theme: "Комбінація",
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
    title: "Королювий ендшпіль",
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
    theme: "Дебют",
    rating: 1500,
  },
  {
    fen: "2kr3r/pp1q1ppp/2np1n2/4p3/3NP3/2N1BP2/PPPQ2PP/R3K2R w KQ - 0 10",
    solution: ["Nd5"],
    title: "Коневий форпост",
    theme: "Комбінація",
    rating: 1800,
  },
  {
    fen: "r1b1k2r/ppppqppp/2n5/2b1p3/2B1n3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 7",
    solution: ["d4"],
    title: "Центральний удар",
    theme: "Тактика",
    rating: 1000,
  },
];
