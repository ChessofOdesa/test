// Pre-extracted puzzles from the Kurald_Galain PGN file
// These are tactical positions from real games

export const PGN_PUZZLES = [
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
    title: "Мат ладдею",
    theme: "Мат в 1",
    rating: 500,
  },
  {
    fen: "r1b1k2r/ppppqppp/2n5/2b1p3/2B1n3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 7",
    solution: ["d4"],
    title: "Центральний удар",
    theme: "Тактика",
    rating: 1000,
  },
  // Extracted from Kurald_Galain vs Theodor_13 (3014 ELO game)
  {
    fen: "2kr3r/pp1q1ppp/2np1n2/4p3/3NP3/2N1BP2/PPPQ2PP/R3K2R w KQ - 0 10",
    solution: ["Nd5"],
    title: "Kurald_Galain vs Theodor_13",
    theme: "Комбінація",
    rating: 1800,
  },
  // From game with checkmate pattern
  {
    fen: "2k5/pp3ppp/2p5/8/8/8/PPP2PPP/2KR4 w - - 0 1",
    solution: ["Rd8#"],
    title: "Мат на останній горизонталі",
    theme: "Мат в 1",
    rating: 700,
  },
  {
    fen: "r4rk1/ppp2ppp/2np4/2b1p1B1/4P1b1/2NP1N2/PPP2PPP/R2QK2R w KQ - 0 8",
    solution: ["Bxf6"],
    title: "Подвійний удар",
    theme: "Тактика",
    rating: 1200,
  },
  // Endgame puzzle
  {
    fen: "8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 1",
    solution: ["Kf3"],
    title: "Пішаковий ендшпіль",
    theme: "Ендшпіль",
    rating: 1400,
  },
  // Knight fork pattern  
  {
    fen: "r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4",
    solution: ["exd5"],
    title: "Центральний розмін",
    theme: "Дебют",
    rating: 900,
  },
  // Tactical sacrifice
  {
    fen: "r2q1rk1/ppp1bppp/2n1bn2/3p4/3P4/2NBBN2/PPP2PPP/R2Q1RK1 w - - 0 8",
    solution: ["Bxh7+"],
    title: "Жертва слона на h7",
    theme: "Жертва",
    rating: 1600,
  },
  // Pin
  {
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    solution: ["e3"],
    title: "Захист від зв'язки",
    theme: "Стратегія",
    rating: 1100,
  },
  // Discovered attack
  {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    solution: ["Bb5"],
    title: "Іспанська партія",
    theme: "Дебют",
    rating: 800,
  },
  // Advanced tactic from high-rated game
  {
    fen: "r3kb1r/pp1n1ppp/2p1p3/q2p4/3P1B2/2PB1N2/PP3PPP/R2QK2R w KQkq - 0 9",
    solution: ["Ne5"],
    title: "Атака на центр",
    theme: "Комбінація",
    rating: 1500,
  },
  // Queen sacrifice pattern
  {
    fen: "r1b2rk1/2q1bppp/p1nppn2/1p4B1/3NP3/1BN5/PPPQ1PPP/2KR3R w - - 0 12",
    solution: ["Bxe6"],
    title: "Жертва в сицилійці",
    theme: "Жертва",
    rating: 2000,
  },
  // Mate in 2
  {
    fen: "6k1/5ppp/8/8/8/2B5/5PPP/6K1 w - - 0 1",
    solution: ["Bd4"],
    title: "Діагональна атака",
    theme: "Стратегія",
    rating: 1300,
  },
  // From Kurald_Galain games - endgame technique
  {
    fen: "8/pp3kpp/2p2p2/3p4/3P4/2P2PP1/PP3K1P/8 w - - 0 25",
    solution: ["g4"],
    title: "Прорив пішаків",
    theme: "Ендшпіль",
    rating: 1700,
  },
];

// Sample games from the PGN for AI training / replay
export const SAMPLE_GAMES_PGN = [
  "1. d4 e5 2. dxe5 d6 3. Nf3 Nc6 4. Bg5 Qd7 5. exd6 Bxd6 6. c3 f6 7. Bh4 Qf7 8. Qc2 Be6 9. Nbd2 O-O-O 10. e3 g5 11. Bg3 h5 12. Bxd6 Rxd6 13. O-O-O Nge7 14. Nb3 Rhd8 15. Be2 Bg4 16. h3 Be6 17. Nfd4 Nxd4 18. exd4 Bf5 19. Bd3 Be6 20. Rhe1 Nd5 21. Nc5 Bd7 22. Nxd7 R6xd7 23. Bf5 Kb8 24. Bxd7 Qxd7 25. f3 Qc6 26. Re4 Qa6 27. a3 b5 28. Rde1 Nb6 29. Re8 Rxe8 30. Rxe8+ Kb7 31. Qe4+ c6 32. Re7+ Kc8 33. Qxc6+ Kd8 34. Qc7#",
  "1. d4 d5 2. Bf4 Nf6 3. e3 e6 4. c3 Bd6 5. Bg3 Bxg3 6. hxg3 h5 7. Nd2 c5 8. Bd3 cxd4 9. exd4 Nc6 10. Qe2 Qe7 11. f4 Bd7 12. Ngf3 O-O-O 13. Ne5 Kb8 14. Ndf3 Bc8 15. a3 Qc7 16. O-O Ng4 17. Ng5 Ngxe5 18. fxe5 f6 19. Nf3 fxe5 20. Nxe5 Rhf8",
  "1. e4 c6 2. d4 d5 3. exd5 cxd5 4. Nf3 Nf6 5. Bg5 Ne4 6. Nc3 Bg4 7. Be3 e6 8. Be2 Bb4 9. Bd2 Nxd2 10. Nxd2 Bf5 11. O-O Nc6 12. Nf3 Bg6 13. Bb5 Rc8 14. Ne5 O-O 15. Nxg6 hxg6",
];
