// Mate-in-1 puzzles from Lichess
// 2026-04-11T16:16:50.833Z
// Player must find the move that leads to mate in 1
// Total puzzles: 1500

export interface MateIn1Puzzle {
  fen: string;
  solution: string[];
  title: string;
  theme: string;
  rating: number;
}

export const MATE_IN_1_PUZZLES: MateIn1Puzzle[] = [
  {
    "fen": "2kr1b1r/p1p2pp1/2pqb3/7p/3N2n1/2NPB3/PPP2PPP/R2Q1RK1 w - - 2 13",
    "solution": [
      "d4e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "6Qk/p1p3pp/4N3/1p6/2q1r1n1/2B5/PP4PP/3R1R1K b - - 0 28",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 581
  },
  {
    "fen": "8/3B2pp/p5k1/2p3P1/1p1p1K2/8/1P6/8 b - - 0 38",
    "solution": [
      "c5c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1584
  },
  {
    "fen": "r6r/1pNk1ppp/2np4/b3p3/4P1b1/N1Q5/P4PPP/R3KB1R w KQ - 3 18",
    "solution": [
      "c7a8"
    ],
    "title": "Мат Бодена",
    "theme": "Мат в 1",
    "rating": 819
  },
  {
    "fen": "r4rk1/pp3ppp/3b4/2p1pPB1/7N/2PP3n/PP4PP/R2Q1RqK w - - 5 18",
    "solution": [
      "f1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 876
  },
  {
    "fen": "r3k2r/pb1p1ppp/1b4q1/1Q2P3/8/2NP1Pn1/PP4PP/R1B2R1K w kq - 1 17",
    "solution": [
      "h2g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1211
  },
  {
    "fen": "r5k1/pp4pp/4p1q1/4p3/3n4/P5P1/1PP2Q1P/2KR1R2 w - - 4 24",
    "solution": [
      "f2e3"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 925
  },
  {
    "fen": "1qr2rk1/1p1p1ppp/pB2p1n1/7n/2P1P3/1Q2NP1P/PP2B1Pb/3R1RK1 w - - 1 20",
    "solution": [
      "g1f2"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1101
  },
  {
    "fen": "7k/p4R1p/3p3r/2pN1n2/2PbBBb1/3P2P1/P3r3/5R1K w - - 1 28",
    "solution": [
      "f4h6"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 854
  },
  {
    "fen": "4r1k1/1p2R1p1/p2p2Pp/P1pP4/5q2/1R3p2/1P1Q3P/5B1K b - - 0 34",
    "solution": [
      "f4d2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1231
  },
  {
    "fen": "8/6k1/2R4p/5p1P/5P1K/6P1/8/r7 w - - 2 58",
    "solution": [
      "c6b6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 567
  },
  {
    "fen": "2r2rk1/5ppp/bq2p3/p1ppP1N1/Pb1P2P1/1P2P2P/2QN4/2R1K2R b K - 1 18",
    "solution": [
      "c5d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1035
  },
  {
    "fen": "8/3pk3/R7/1R2Pp1p/2PPnKr1/8/8/8 w - - 4 43",
    "solution": [
      "f4f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1730
  },
  {
    "fen": "r4rk1/1pp2ppp/p2p4/2bPp3/2P1Pn1q/P1N2B2/1P3P2/R1BQK1R1 w Q - 1 15",
    "solution": [
      "c1f4"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 1054
  },
  {
    "fen": "3r1Q1k/pp4pp/2p5/6q1/5R2/2P5/P1P2PPP/3rR1K1 b - - 8 27",
    "solution": [
      "d8f8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 568
  },
  {
    "fen": "3r4/R7/2p5/p1P2p2/1p4k1/nP6/P2KNP2/8 w - - 3 41",
    "solution": [
      "d2e3"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 1299
  },
  {
    "fen": "r6k/1b3pp1/p1q1pn1p/2p5/P1B5/1PN4Q/2P1RP1P/R4Kr1 w - - 2 26",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 920
  },
  {
    "fen": "r2r2k1/2q1bpp1/3p1n1p/1ppN4/1P1BP3/P5Q1/4RPPP/R5K1 b - - 1 20",
    "solution": [
      "f6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 459
  },
  {
    "fen": "2q3k1/4br1p/6RQ/1p1n2p1/7P/1P4P1/1B2PP2/6K1 b - - 0 27",
    "solution": [
      "h7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1451
  },
  {
    "fen": "5kr1/ppR3p1/3R3p/8/1r1n4/8/1P3PPP/2K5 b - - 4 31",
    "solution": [
      "d4b5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 832
  },
  {
    "fen": "r3kb1r/ppqn1ppp/4pn2/1Q2Nb2/3P4/8/PP2PPPP/RNB1KB1R w KQkq - 4 9",
    "solution": [
      "e5d7"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1448
  },
  {
    "fen": "r1b1kb1Q/ppp4p/6pB/3P4/2pn4/8/PPP1qPPP/RN1K3R w q - 2 13",
    "solution": [
      "d1c1"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 883
  },
  {
    "fen": "7r/ppp2kp1/2nb1pp1/3p3r/3P2q1/2PQB2P/PP3PP1/R3R1K1 w - - 0 18",
    "solution": [
      "h3g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 612
  },
  {
    "fen": "2kr1br1/ppBb1ppp/8/3P2Q1/3n2n1/5N2/PP3qPP/RN2R2K b - - 0 16",
    "solution": [
      "d4f3"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1020
  },
  {
    "fen": "3r1n2/1bp1bkpp/p1q2n2/1p6/3P4/P1N3B1/1PP2PPP/R2QR1K1 w - - 5 18",
    "solution": [
      "d1e2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 624
  },
  {
    "fen": "rn2q1k1/pp3ppp/2pb4/3p1B2/2Pn4/1Q3N2/PP3PPP/R1B4K w - - 0 15",
    "solution": [
      "f3d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 536
  },
  {
    "fen": "2kr3r/pp1n2pp/2QB1bp1/5q2/2B5/8/PPP2PPP/3R1RK1 b - - 0 17",
    "solution": [
      "b7c6"
    ],
    "title": "Мат Бодена",
    "theme": "Мат в 1",
    "rating": 721
  },
  {
    "fen": "r4rk1/2q2ppp/3pp3/4Pb1N/pp6/1B4Q1/PPP3PP/1K1RR3 b - - 0 21",
    "solution": [
      "a4b3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 901
  },
  {
    "fen": "8/6pp/4N1k1/5p2/5P2/5rPb/4R2P/6K1 w - - 0 35",
    "solution": [
      "e6g5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 404
  },
  {
    "fen": "6k1/2p2ppp/pnp5/B7/2P3PP/1P1bPPR1/r6r/3R2K1 b - - 1 29",
    "solution": [
      "d3e2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 473
  },
  {
    "fen": "r3k2r/ppp2p1p/2n1pp2/7q/2PN2b1/2BP1Pb1/PP2B1P1/R2Q1RK1 w kq - 1 16",
    "solution": [
      "f3g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 782
  },
  {
    "fen": "Q5k1/p1p3p1/5rP1/8/3P4/7P/q3r3/B4RK1 b - - 1 34",
    "solution": [
      "f6f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 471
  },
  {
    "fen": "rn2kb1r/pp2pppp/2p2n2/4q3/8/2N4Q/PPPPBPPP/R1B1K2R b KQkq - 2 8",
    "solution": [
      "g7g6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 869
  },
  {
    "fen": "rn2k2r/pp2bp1p/2p1pNp1/6B1/5P2/7P/PPP4P/2K1RR2 b - - 3 17",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1248
  },
  {
    "fen": "6k1/pb2r1pN/1n4Bp/3p4/1P2pR2/P7/3R1PPP/2r3K1 w - - 2 30",
    "solution": [
      "d2d1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 706
  },
  {
    "fen": "rqnr2k1/5ppp/p2p4/4Q3/8/1P5P/PBP2PP1/R2R2K1 b - - 2 23",
    "solution": [
      "d6e5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 687
  },
  {
    "fen": "2kr2r1/ppb2ppp/3qbn2/2Np2B1/P7/2P2Q1P/1PB2PP1/R4RK1 w - - 5 18",
    "solution": [
      "c5e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 756
  },
  {
    "fen": "2r3k1/7p/6q1/p1Np4/Qp2pr2/P4P2/1PR2P1K/5R2 w - - 0 36",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 892
  },
  {
    "fen": "rn2kb1r/pp2pppp/2p2n2/8/3q2b1/1Q6/PPP2PPP/RNB1KBNR w KQkq - 0 7",
    "solution": [
      "b3b7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 743
  },
  {
    "fen": "2rq1rk1/1p3p1p/p1pn2p1/P2p4/1P1PnP2/3NP3/5PBP/R1Q3RK w - - 2 22",
    "solution": [
      "d3c5"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 834
  },
  {
    "fen": "rn2k2Q/5p2/2p1p1r1/1q4p1/8/8/4NPPP/3R1K1R b q - 5 23",
    "solution": [
      "e8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 892
  },
  {
    "fen": "2r3kR/Q7/5q2/1brpN3/5Pp1/4P1P1/6K1/1B6 b - - 2 43",
    "solution": [
      "f6h8"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 987
  },
  {
    "fen": "r4rk1/pbp3pp/1p1pp3/6B1/2PPp2q/3nP2P/PP3P2/R2QKBR1 w Q - 8 16",
    "solution": [
      "f1d3"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 830
  },
  {
    "fen": "4r3/3R1pkp/6p1/1P6/1b6/5B2/1P1p1PPP/3R2K1 w - - 0 36",
    "solution": [
      "d1d2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 727
  },
  {
    "fen": "8/6kp/4b1q1/1p6/1PpPp2Q/2P1P3/r2N2P1/5RK1 w - - 7 34",
    "solution": [
      "d2e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1126
  },
  {
    "fen": "r1bqkb1r/pp1pnppp/2n1p3/1N6/5B2/8/PPP1PPPP/R2QKBNR b KQkq - 4 6",
    "solution": [
      "e6e5"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1033
  },
  {
    "fen": "8/5k2/1P4R1/6PK/1r6/8/8/8 w - - 1 58",
    "solution": [
      "h5h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 745
  },
  {
    "fen": "rnb2rk1/pp3p1p/3p2Pb/4p1q1/3pQ3/8/PPP1PPP1/RN2KBNR w KQ - 1 12",
    "solution": [
      "g1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 989
  },
  {
    "fen": "3r4/1p4p1/2pBkbBp/p1P5/3rp3/P7/1PK2P2/4R3 b - - 1 31",
    "solution": [
      "e6d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1489
  },
  {
    "fen": "3rk2r/p1p2pp1/1p6/2pQ1b2/2Pn1P2/8/PP1P1KBq/R1B1R3 b - - 3 25",
    "solution": [
      "e8f8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 745
  },
  {
    "fen": "r5nr/ppp3p1/3bBk1p/4nP2/3p4/8/PPPN1P1P/R1B1K2R b KQ - 1 15",
    "solution": [
      "g8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 780
  },
  {
    "fen": "2k4r/pp3pp1/4pn2/2np2p1/8/1B1P1Pq1/PPPN1R2/R2Q3K w - - 6 20",
    "solution": [
      "f2h2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 765
  },
  {
    "fen": "r1bq1rk1/5ppp/p2p1b2/1p1Pn3/1P2Q3/P1NB3P/1B3PP1/R4RK1 b - - 2 17",
    "solution": [
      "c8b7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 487
  },
  {
    "fen": "b4b1r/3k1ppp/p2p4/1p2p3/3nq3/N1P1B3/PP3PPP/R2Q1RK1 w - - 1 16",
    "solution": [
      "c3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1063
  },
  {
    "fen": "r3kb1r/p4pp1/b1p4p/n3p3/4N3/2Nq1Q2/PP1P1PPP/R1B2RK1 w kq - 0 14",
    "solution": [
      "f3f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 510
  },
  {
    "fen": "r1bk3r/ppp1np1p/3p2pP/1N2P1q1/2BP1n2/8/PPP3P1/R1BQ2KR w - - 1 14",
    "solution": [
      "e5d6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 967
  },
  {
    "fen": "1r2R1k1/2Q4p/pp6/2p2n2/P2P1P1q/2P4P/2PB2b1/4R1K1 b - - 0 29",
    "solution": [
      "b8e8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 840
  },
  {
    "fen": "3r1k1r/5p1p/b2q1p2/P2Np3/Bp2P3/2b2P2/3Q2PP/1R2K2R w K - 4 24",
    "solution": [
      "d5c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 578
  },
  {
    "fen": "8/8/1R3pkp/1pP5/1P3PKP/r7/8/8 w - - 2 48",
    "solution": [
      "b6b5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "r4rk1/pb3ppp/1p2p3/3q4/3N4/2PQ3P/PP3PP1/R4RK1 w - - 1 18",
    "solution": [
      "d3c2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 633
  },
  {
    "fen": "rn3q1r/4pk1p/2pp1np1/p5Q1/1p1PPNP1/5P2/PPP5/R4KNR b - - 0 17",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1156
  },
  {
    "fen": "2kr4/1pp5/p1b2R1n/2PpP3/3B2p1/2P1Q1Pp/PPq4P/5RK1 w - - 3 27",
    "solution": [
      "f6h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 831
  },
  {
    "fen": "r6r/1q2bpk1/7p/p1p1pPpn/Pp2P1nP/1P1B1N2/2P3P1/2BRR1QK w - - 7 30",
    "solution": [
      "c1b2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1018
  },
  {
    "fen": "2r3k1/5p1p/4pP2/3p3P/8/5P2/p1b3P1/2R3K1 b - - 0 30",
    "solution": [
      "c2b1"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 493
  },
  {
    "fen": "2k2bn1/ppp2Nrp/2b1p3/3q2BQ/8/8/PP3PPP/RN3RK1 w - - 5 18",
    "solution": [
      "b1c3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 673
  },
  {
    "fen": "rnbk3r/pppp1Bpp/8/5p2/4p3/2PP4/P1P2PPP/R1B1K2R b KQ - 0 13",
    "solution": [
      "h8f8"
    ],
    "title": "Мат двома слонами",
    "theme": "Мат в 1",
    "rating": 879
  },
  {
    "fen": "r2q1rk1/ppp2ppp/2n5/3p2N1/3P4/1B5P/P1Q1bPP1/R1B2RK1 b - - 2 16",
    "solution": [
      "e2f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 771
  },
  {
    "fen": "Q4n1k/p2b2pp/3b4/2p5/4pq2/2Pn3P/PP1NBPP1/R1B2RK1 w - - 1 23",
    "solution": [
      "d2e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1339
  },
  {
    "fen": "1r3rk1/2p1Nppb/p2nq3/1p2p1Pp/4Qn1P/2P1N3/PPB2P1K/3R2R1 b - - 5 28",
    "solution": [
      "e6e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "3k2r1/pR5R/3r4/4p1q1/7Q/3Pn1PP/PP5K/8 b - - 0 27",
    "solution": [
      "g5h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1182
  },
  {
    "fen": "r1b2rk1/ppb5/2p4p/2Ppqpp1/1P6/2N1P3/P3BPPP/2RQ1RK1 w - - 0 16",
    "solution": [
      "e2d3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 533
  },
  {
    "fen": "r1b1k1nr/1pp2p2/p7/1B1q3p/6p1/4PP2/PPPQ1P2/2KR3R b kq - 1 17",
    "solution": [
      "d5b5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 419
  },
  {
    "fen": "r3r3/1kpRnqpp/p4p2/Qp2P2P/1N6/4Pb2/PPP3P1/2K2R2 b - - 0 22",
    "solution": [
      "e7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1362
  },
  {
    "fen": "7k/6p1/8/4p3/Pp1b4/1P3b1q/3Q2P1/5RK1 w - - 0 45",
    "solution": [
      "d2d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 893
  },
  {
    "fen": "4r2k/p6p/1p3R2/2p5/2P5/1P4R1/r5PP/2K5 w - - 0 32",
    "solution": [
      "f6f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 895
  },
  {
    "fen": "r1bqkb1r/pp2pppp/2p2n2/2PnN3/2BP1B2/8/PP3PPP/RN1QR1K1 b kq - 2 12",
    "solution": [
      "d5f4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1261
  },
  {
    "fen": "6r1/7p/2pk1p2/P2p4/P2KbP2/4P3/4NR1P/8 w - - 1 35",
    "solution": [
      "e2c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 675
  },
  {
    "fen": "6k1/5ppp/5Bq1/8/p3R3/P6P/2r2QB1/R5K1 b - - 0 29",
    "solution": [
      "c2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 723
  },
  {
    "fen": "5rk1/p4ppp/4p3/1Q6/1P1BN1b1/8/Pq3PPP/R1r1KB1R w KQ - 2 18",
    "solution": [
      "a1c1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 649
  },
  {
    "fen": "q5kr/p4p2/3Bb1p1/4p2p/5n2/2P5/P1Q2PPP/3R1RK1 w - - 4 21",
    "solution": [
      "d6e5"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 917
  },
  {
    "fen": "5r1k/5r2/2b2RQp/1p1p2p1/1q4P1/8/8/1B3R1K b - - 0 36",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1509
  },
  {
    "fen": "r4rk1/4p1bp/3p2p1/q1pP1P2/4QP2/4B3/1p5P/1BKR3R w - - 0 22",
    "solution": [
      "c1c2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1312
  },
  {
    "fen": "1rbr1k2/p4ppp/2B5/2pR1NP1/2P5/P7/7P/4R1K1 b - - 0 27",
    "solution": [
      "d8d5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1125
  },
  {
    "fen": "4Q3/6pk/p3p2p/5p2/1p1P2P1/4q2P/2B1n2B/7K w - - 0 35",
    "solution": [
      "g4f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1565
  },
  {
    "fen": "3r1rk1/3b1pp1/7p/8/N2Qp1n1/1P6/PB1q1PP1/R5K1 b - - 1 25",
    "solution": [
      "d7a4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 921
  },
  {
    "fen": "4R3/1k2R3/3K2p1/1P6/1P6/2rp3r/8/8 b - - 3 45",
    "solution": [
      "b7b6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 923
  },
  {
    "fen": "3r2k1/pQ3ppp/4R1n1/2q5/2P5/2B3P1/P4PBP/6K1 b - - 0 24",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 999
  },
  {
    "fen": "5rk1/ppq3pR/4p1r1/3p4/8/2P4Q/PP3RPP/6K1 b - - 0 22",
    "solution": [
      "c7c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 986
  },
  {
    "fen": "6Qk/6pp/p2B4/2pP4/P1q5/6P1/2P1p2P/5RK1 b - - 0 26",
    "solution": [
      "h8g8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 471
  },
  {
    "fen": "r1b2k1r/pp4p1/2pq2p1/3p4/3p4/1N6/PPP2PPP/R2Q1RK1 w - - 0 17",
    "solution": [
      "d1d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 917
  },
  {
    "fen": "5r1k/1pq3p1/2p2P1p/3pPQ2/1p1P4/7P/1rB4K/5R2 b - - 1 35",
    "solution": [
      "f8f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 803
  },
  {
    "fen": "1rb4r/pp1nb1pp/5nk1/3Np3/2q1P3/2N2Q2/PPP2PPP/R1B1K2R b KQ - 4 12",
    "solution": [
      "f6d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1291
  },
  {
    "fen": "rnb1k1nr/1ppp1ppp/8/p1bPp3/4P2q/2PB4/PP3PPP/RNBQK1NR w KQkq - 3 6",
    "solution": [
      "g1f3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 594
  },
  {
    "fen": "2r4k/5p2/4pNp1/6Pp/q6P/7r/2PQ4/1RKN4 w - - 2 37",
    "solution": [
      "d2b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 710
  },
  {
    "fen": "2r3k1/5ppp/2P5/8/5P2/P5Pn/6BP/R3R1qK w - - 6 32",
    "solution": [
      "e1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 940
  },
  {
    "fen": "r4knb/1bpp4/p1n1pq2/1p4NQ/3PP3/2N5/PPP2PP1/2KR1B2 b - - 3 15",
    "solution": [
      "f6h6"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1048
  },
  {
    "fen": "r3r2k/p2n1p1R/5n2/qp3Q2/3P4/B3Pp2/P4P1P/1B5K b - - 0 23",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1139
  },
  {
    "fen": "1R6/3k1Q2/p2b1p2/2r1p3/3n4/P6P/5PP1/4qBK1 b - - 1 40",
    "solution": [
      "d7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1100
  },
  {
    "fen": "2k2b1r/pp3ppp/1n6/BN2p1P1/2Q1Nn1P/8/PP3P2/2KR4 b - - 0 24",
    "solution": [
      "b6c4"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1545
  },
  {
    "fen": "R5k1/3r2pp/3N4/1nP5/6P1/1P3P2/P2K2n1/8 b - - 1 30",
    "solution": [
      "d7d8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 702
  },
  {
    "fen": "rn2qrk1/ppp2N1p/3pPpB1/3n4/6b1/8/P1QN1PPP/R4RK1 b - - 0 18",
    "solution": [
      "h7g6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 748
  },
  {
    "fen": "r6r/2pk1ppp/p1np4/1pbBpN1q/4P1b1/5N2/PPPP1PRK/R1BQ4 w - - 12 18",
    "solution": [
      "h2g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 751
  },
  {
    "fen": "5r2/5p1k/4nP2/4N1p1/8/6P1/6K1/R7 b - - 1 78",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1229
  },
  {
    "fen": "6rk/7p/R2N3P/1r6/1P5K/P7/8/8 b - - 4 50",
    "solution": [
      "b5d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 815
  },
  {
    "fen": "8/5K1p/1p4pk/8/3brp2/5R2/8/8 b - - 5 50",
    "solution": [
      "g6g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 842
  },
  {
    "fen": "r2qkbnr/pp5p/8/4Nb2/3p4/1QN5/PP2PPPP/R3KB1R b KQkq - 1 12",
    "solution": [
      "d4c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1505
  },
  {
    "fen": "3kRr2/3n1B1p/2pP4/p1n5/Ppp5/8/1P3PPP/4R1K1 b - - 8 32",
    "solution": [
      "f8e8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 865
  },
  {
    "fen": "r4rk1/p1p1R1pp/2p2p2/5P2/6Q1/1P5P/q5PK/8 b - - 1 30",
    "solution": [
      "a2b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1048
  },
  {
    "fen": "5r1k/2p3Rp/3p4/p2Pn3/1p2B3/1P6/PKP2r1P/6R1 b - - 1 28",
    "solution": [
      "f2e2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1114
  },
  {
    "fen": "rn1qk2r/pb3ppp/5n2/2b5/7N/2N1p1P1/PP1PPP1P/R1BQKB1R w KQkq - 0 9",
    "solution": [
      "h4g2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1239
  },
  {
    "fen": "4r3/pp2rkp1/2p5/P2p2pP/R4bP1/2NQ4/1PP2P2/3Kq2R w - - 3 25",
    "solution": [
      "h1e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 423
  },
  {
    "fen": "2k3r1/pp5p/4p3/2p2p2/2P5/P4P1q/1PQ1RR1b/7K w - - 0 32",
    "solution": [
      "f2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1048
  },
  {
    "fen": "r1bk4/pppp3p/2n5/2b1prN1/8/1B6/PPPP2PP/RNB2RK1 w - - 1 14",
    "solution": [
      "g1h1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 599
  },
  {
    "fen": "5k1r/p3Rpbp/3N2p1/4nbB1/2P5/3rP3/q4PPP/3Q1RK1 b - - 2 16",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1083
  },
  {
    "fen": "3r1b1r/2pn4/1p1p3p/2kP2qn/Q3Pp2/4Bp2/1P4PP/4R1K1 b - - 3 26",
    "solution": [
      "f4e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1276
  },
  {
    "fen": "8/4k2p/Q1p1p3/p2pP1r1/q7/P6P/1P3PK1/2R2R2 w - - 1 28",
    "solution": [
      "g2f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1355
  },
  {
    "fen": "2kr2nr/pp2nppp/2pp4/2b2PP1/4NPq1/3B1R2/PPP4P/R2QB2K w - - 5 18",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1058
  },
  {
    "fen": "r4rk1/pbp1n1pp/1p1p4/3Pp1N1/2B4P/2PQ4/PP3qP1/R2K3R b - - 1 17",
    "solution": [
      "f2g2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 913
  },
  {
    "fen": "r4rk1/ppp2pn1/2np4/q2N4/3PP3/5P2/PPP5/1K1R1B1R b - - 2 18",
    "solution": [
      "c6b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 868
  },
  {
    "fen": "6k1/6b1/p1r1p2p/1pN4r/3P3q/2P2Q2/P4PP1/1R2R1K1 w - - 2 31",
    "solution": [
      "f3c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 879
  },
  {
    "fen": "8/1R5R/4kpp1/4p3/4P2K/5P1P/r7/6r1 b - - 10 40",
    "solution": [
      "a2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1513
  },
  {
    "fen": "7k/pp5p/4r1pP/5pP1/3Q1n2/P1P5/KP6/5q2 b - - 1 35",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 995
  },
  {
    "fen": "r4rk1/pb2ppb1/1q6/6PQ/8/2NP1N2/PPnK1PP1/R6R b - - 1 16",
    "solution": [
      "c2a1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1068
  },
  {
    "fen": "8/8/8/8/8/4K3/1k3Q2/1q6 b - - 5 53",
    "solution": [
      "b2c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1045
  },
  {
    "fen": "r4b1r/pppqpkpp/6B1/7Q/2PP4/2N1P2P/PP4P1/R5K1 b - - 0 15",
    "solution": [
      "f7g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 963
  },
  {
    "fen": "2r2k1Q/p4pp1/1p2p1n1/4P1B1/q7/2r4R/P4PP1/4R1K1 b - - 3 28",
    "solution": [
      "g6h8"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 885
  },
  {
    "fen": "2r2rQk/6pp/p6N/1p1p4/2pq4/P6P/1P3PP1/4R1K1 b - - 9 36",
    "solution": [
      "f8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 994
  },
  {
    "fen": "3q1r1k/1b3ppp/p3p3/7N/1p1bp3/4B1Q1/PPr2PPP/R3R1K1 b - - 1 23",
    "solution": [
      "d4e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1161
  },
  {
    "fen": "8/8/n1R4p/P5p1/r4p1k/7P/5PK1/8 b - - 5 50",
    "solution": [
      "a4a5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 583
  },
  {
    "fen": "rnb2rk1/5ppp/p2q4/1p1P4/2p3n1/2N2N2/PP2BPPP/R2Q1RK1 w - - 0 14",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 526
  },
  {
    "fen": "8/8/8/P6p/8/2RnkN2/r7/3K4 w - - 1 60",
    "solution": [
      "f3e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1648
  },
  {
    "fen": "6k1/5pp1/4p2p/1p1bPP2/1P1P1KP1/1r6/3B1R1P/8 w - - 0 37",
    "solution": [
      "f5f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1392
  },
  {
    "fen": "5r1k/pp4pp/5r2/4Q3/3P4/4NpN1/Pq5P/2R2R1K w - - 0 29",
    "solution": [
      "e3d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 842
  },
  {
    "fen": "r5k1/4p2p/p5p1/1p1b2Q1/2p5/P4qN1/1P3P2/R2R2Kr w - - 2 28",
    "solution": [
      "g3h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 896
  },
  {
    "fen": "3r1rk1/p3R2p/bp1P2p1/2P5/7Q/P2q1P1P/6P1/2R3K1 b - - 5 34",
    "solution": [
      "b6c5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 795
  },
  {
    "fen": "5r1k/Q6p/1pb3p1/4q3/4p3/1BP2p1P/PP4P1/5RK1 b - - 0 30",
    "solution": [
      "f3g2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 848
  },
  {
    "fen": "2kr4/1p4pp/p1p1b3/Q3Bq2/8/4PB2/1PP2PPP/1K6 b - - 2 24",
    "solution": [
      "g7g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1134
  },
  {
    "fen": "3N3k/pQ5p/4p1p1/3q4/8/2b1P1P1/P3RPKP/4n3 w - - 1 28",
    "solution": [
      "g2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1323
  },
  {
    "fen": "4r1k1/6pp/1R3p2/P7/1P1p4/2b3BP/5PP1/5K2 w - - 2 31",
    "solution": [
      "g3f4"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 421
  },
  {
    "fen": "2r5/p4p1k/1p1pq3/2p2p2/7R/2Q4P/1P3PP1/6K1 b - - 1 34",
    "solution": [
      "h7g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 505
  },
  {
    "fen": "r1br1N1k/ppp2BbQ/2n2n1p/q7/3P4/2N5/PPP2PPP/R1B2RK1 b - - 6 15",
    "solution": [
      "f6h7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 945
  },
  {
    "fen": "rn4k1/pp1q1r2/2pp2B1/3P4/2PB2b1/8/P2K1PP1/7R b - - 1 21",
    "solution": [
      "c6d5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1381
  },
  {
    "fen": "8/pp3Q1p/1n2B1pk/8/6Pq/7P/PPP2P2/2K5 w - - 10 31",
    "solution": [
      "f2f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 605
  },
  {
    "fen": "3r2k1/5pp1/2p3np/2b5/1p2P1b1/1BN3B1/1PP3PP/4KR2 w - - 0 21",
    "solution": [
      "c3a4"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 609
  },
  {
    "fen": "1Q6/5p1k/4b1pp/4RB2/3p2KP/6P1/P3q3/5r2 w - - 2 45",
    "solution": [
      "e5e2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 951
  },
  {
    "fen": "5k2/p1p4p/1pPpBp2/2qP3b/8/2PQ4/P6P/7K w - - 0 33",
    "solution": [
      "d3h7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 890
  },
  {
    "fen": "r1bqkn1r/ppb1n1pp/2p1pB2/4N3/3PN3/3B4/PPPQ1PPP/R3K2R b KQkq - 0 12",
    "solution": [
      "g7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 950
  },
  {
    "fen": "r2k1r2/pp1nRR2/2pP1N1p/8/3P3p/8/PPP3P1/6K1 b - - 0 24",
    "solution": [
      "f8f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1256
  },
  {
    "fen": "r1b1k1nr/ppp2ppp/3p2q1/4R1B1/2B2P2/7P/P5P1/1N1Q2K1 b kq - 0 14",
    "solution": [
      "d6e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 869
  },
  {
    "fen": "r1b1k2r/p1p2ppp/1pN2n2/2n1b3/2B1P3/P1N5/1PP2PPP/R1BR2K1 b kq - 0 13",
    "solution": [
      "e5c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 718
  },
  {
    "fen": "6k1/5ppp/4p1b1/1N1pP3/1P1n4/r7/5PPP/2R2BK1 b - - 0 25",
    "solution": [
      "d4b5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 473
  },
  {
    "fen": "4k2r/1bq2pb1/4p3/1p4p1/2pn4/R4N2/1P2BPPP/3Q1RK1 w k - 2 17",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 967
  },
  {
    "fen": "7k/1p2R3/p3N3/3p4/2n5/2P5/PPK4r/8 w - - 3 36",
    "solution": [
      "c2d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1430
  },
  {
    "fen": "1kr1r3/1pp4p/p2b2p1/3N1p2/P7/3P1Q1P/2R2PP1/2R1q1K1 w - - 7 27",
    "solution": [
      "c1e1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 544
  },
  {
    "fen": "4b1k1/1r2P2p/p1p3pP/6q1/3Q4/PB6/1PP3P1/1K6 b - - 0 36",
    "solution": [
      "b7b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1106
  },
  {
    "fen": "r4rk1/pb1p2pp/1p2p1q1/2b5/2P5/P1N1B2P/1P2BPP1/R2Q1RK1 w - - 5 18",
    "solution": [
      "d1d7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 888
  },
  {
    "fen": "4rr1k/ppp3pp/3b1p2/7Q/5q2/1PBB3P/P1P3P1/5RK1 b - - 13 26",
    "solution": [
      "f4g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 962
  },
  {
    "fen": "r1r3k1/2p3p1/p2p3p/Pp1Pp3/4P3/3P1p1q/R1Q2P1N/4R1K1 w - - 0 28",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 850
  },
  {
    "fen": "rnb1k2r/ppB2p2/8/3p2p1/3Q2np/2N2NK1/PPP1B1PP/R6R w kq - 0 14",
    "solution": [
      "g3h3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 791
  },
  {
    "fen": "r5rk/pp3p2/5p1p/q2n1N1Q/8/8/P4PPP/R2R2K1 b - - 5 21",
    "solution": [
      "d5f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1116
  },
  {
    "fen": "2r2rk1/6pp/p1q5/1pn2p2/1B1pPP2/3Pn1QB/1PP2R1P/6RK b - - 3 24",
    "solution": [
      "f8f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "8/2R5/6pk/p3p2p/4Nq2/5n1P/P2R2P1/7K w - - 0 41",
    "solution": [
      "d2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1056
  },
  {
    "fen": "r5k1/ppp1p1b1/4N1Q1/3pq1Bp/7P/8/PPPN1rP1/2KR4 w - - 1 17",
    "solution": [
      "d2f3"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 952
  },
  {
    "fen": "r1b1k2r/1p3p2/p1pqp3/2b2Ppp/4P1n1/2NB3P/PPP3P1/R2QBR1K w kq - 1 15",
    "solution": [
      "d1f3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1018
  },
  {
    "fen": "1br2rk1/ppqn2pp/4p3/1P6/P3B3/8/1B3PPP/R2Q1RK1 w - - 1 18",
    "solution": [
      "a1c1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 777
  },
  {
    "fen": "r2q1k1r/pbp1bppp/1p2pn2/1B2N3/3P1Q2/8/PPP2PPP/R1B2RK1 b - - 5 12",
    "solution": [
      "f6d5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 492
  },
  {
    "fen": "3k1b1r/1p1n1ppp/1B6/1p6/8/5K2/PPr2PPP/3RR3 b - - 1 19",
    "solution": [
      "d8c8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 835
  },
  {
    "fen": "2kr4/1p3p2/1P6/Q1ppP3/3NnPqp/8/P5KP/2R1R3 w - - 1 29",
    "solution": [
      "g2h1"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 988
  },
  {
    "fen": "rnb1k2r/p1p2ppp/1p3n2/2b1N1B1/3qP3/3P4/PPP3PP/RN1QKB1R w KQkq - 1 8",
    "solution": [
      "e5f3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1086
  },
  {
    "fen": "r5k1/1b1pn1p1/1p5p/pq1PN2B/4P3/P6Q/6PP/R4r1K w - - 0 26",
    "solution": [
      "a1f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 577
  },
  {
    "fen": "2r1r1k1/1bpn1ppp/p4n2/1p6/1P4q1/P3PN2/1BB1QPPP/3R1RK1 w - - 6 18",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1001
  },
  {
    "fen": "r1b1k1nr/pppp1ppp/5q2/2b1n3/4P3/2N2N2/PPPP2PP/R1BQKB1R w KQkq - 0 6",
    "solution": [
      "f3e5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1087
  },
  {
    "fen": "r1bq2kr/1p2b1pp/p2pN3/4p3/2B1P3/5Q2/PP3PPP/2RR2K1 b - - 0 17",
    "solution": [
      "c8e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 805
  },
  {
    "fen": "r3k3/ppP2pp1/8/3Nn3/1bP3p1/4P1Pq/PP2N1K1/R1BQ1R2 w q - 3 18",
    "solution": [
      "g2f2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 994
  },
  {
    "fen": "3rrbk1/2p3R1/1p2q2Q/3p4/1P6/2B4P/6P1/3R2K1 b - - 0 33",
    "solution": [
      "f8g7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 923
  },
  {
    "fen": "r2q1r2/pp3pk1/2np1Np1/2pN1b2/2B4Q/3P4/PPP3PP/R5K1 b - - 1 17",
    "solution": [
      "f5e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "8/Q5b1/p2kp3/1p2qpN1/1P6/P7/4nPP1/5K2 b - - 5 46",
    "solution": [
      "d6d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1448
  },
  {
    "fen": "5rk1/1q3r1p/3p2RQ/3p4/3B4/2P2P2/P5PP/6K1 b - - 0 30",
    "solution": [
      "h7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 988
  },
  {
    "fen": "rq2kb1r/1b1p1pp1/p3pn2/1p5p/4P1n1/1NN1BB2/PPP1QPPP/R4RK1 w kq - 2 14",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 933
  },
  {
    "fen": "6k1/1q4p1/p2P2B1/8/5Q1P/6P1/P6K/4r3 w - - 5 36",
    "solution": [
      "f4f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 726
  },
  {
    "fen": "5rk1/p1p3p1/bp2p2p/5p2/2qPB3/2P5/2Q2PPP/R4RK1 w - - 0 24",
    "solution": [
      "a1a4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1244
  },
  {
    "fen": "2r2r1k/1pP3pp/p3b3/P7/1P5Q/4q1P1/6PK/RB6 b - - 4 37",
    "solution": [
      "c8c7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 780
  },
  {
    "fen": "8/pp3k1p/3B2p1/2P5/1P6/4n2P/P4qP1/2Q4K w - - 0 33",
    "solution": [
      "h1h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1381
  },
  {
    "fen": "r1bq1rk1/1p3pp1/p2bp2p/8/4Q3/2PB4/PP3PPP/R1B2RK1 b - - 0 13",
    "solution": [
      "b7b5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1331
  },
  {
    "fen": "8/2rkb3/1p6/6P1/5q2/3R4/Q1P1K3/8 b - - 4 37",
    "solution": [
      "d7c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1654
  },
  {
    "fen": "r3r1k1/ppp2p2/1b5Q/3PP2n/2B3bq/2N5/PP4PP/R4R1K w - - 1 18",
    "solution": [
      "f1f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1115
  },
  {
    "fen": "8/5ppk/p1Q4p/2R4P/1q2P3/5P2/1P4P1/1K1n4 w - - 2 45",
    "solution": [
      "c5c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 703
  },
  {
    "fen": "4b2k/R7/p4q2/2P1r2p/3QP1pP/1B6/P5p1/6KR w - - 0 36",
    "solution": [
      "h1h2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 958
  },
  {
    "fen": "r2b2r1/p2P1p2/1pNQ1p1k/6qp/5R2/P2B3P/1P3PP1/6K1 w - - 2 28",
    "solution": [
      "c6d8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 863
  },
  {
    "fen": "r2q1rk1/pb2bpp1/2p1p3/4P3/2nP3p/P1PQBN1P/2B2PP1/R4RK1 b - - 5 18",
    "solution": [
      "c4e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "k2r3r/pp6/6R1/3P2Pp/2P2B1n/P1N4q/1P3P2/R2Q2K1 w - - 1 24",
    "solution": [
      "d1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1060
  },
  {
    "fen": "3q4/1p6/p4N2/5QPk/4Pn2/2P4r/1P3K2/8 b - - 4 40",
    "solution": [
      "h5h4"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1039
  },
  {
    "fen": "2r4k/p4qpp/1p2R3/2p3Q1/8/7P/PB3PP1/6K1 b - - 0 29",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 671
  },
  {
    "fen": "r2q1b1k/ppp3Bp/3pPp2/2n1n3/4P2P/1B3P2/PPP3Q1/2K3RR b - - 0 23",
    "solution": [
      "f8g7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 543
  },
  {
    "fen": "r3k3/1p4R1/3pQ3/pP2p3/4q3/4Pr2/8/7K b - - 4 38",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1119
  },
  {
    "fen": "r2q1rk1/1b3pp1/p3p3/3n2b1/1pnN1P2/3Q4/PPP1NB2/1K1R1B1R b - - 2 20",
    "solution": [
      "d5f4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 746
  },
  {
    "fen": "r1b5/pp1nkpr1/2q1p3/8/8/3B4/P1P1NPPP/R2Q1RK1 w - - 3 18",
    "solution": [
      "e2d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 679
  },
  {
    "fen": "r2Rrk1q/p3Np2/1pp5/8/P1Q1P1pP/2P2P2/1P3bP1/3R3K w - - 5 34",
    "solution": [
      "d8a8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1188
  },
  {
    "fen": "r3k2r/ppp2p1p/3b1p2/4p3/8/2PB4/bPPQ1PPP/2KR3R w kq - 0 14",
    "solution": [
      "b2b3"
    ],
    "title": "Мат двома слонами",
    "theme": "Мат в 1",
    "rating": 1119
  },
  {
    "fen": "8/2k3pp/4p3/1R3p2/1Pr2K1P/6P1/5P2/8 w - - 7 37",
    "solution": [
      "f4e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1270
  },
  {
    "fen": "r1bq1rBk/pp2npp1/4p3/3p4/3P2n1/2P2NP1/PPQN1PP1/R3K2R b KQ - 2 13",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 769
  },
  {
    "fen": "1r2r3/pp3pk1/2pp2p1/1P2p2p/2P1N1nq/3PP3/P2Q1PB1/1R3RK1 w - - 0 23",
    "solution": [
      "e4g3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 940
  },
  {
    "fen": "5rk1/pp5p/2p1P1p1/3pN3/5r2/2P4Q/PP4PP/R4q1K w - - 2 25",
    "solution": [
      "a1f1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 600
  },
  {
    "fen": "r1b2kn1/pppp2p1/2n2p2/2b1p2Q/2B1q3/4N2N/PPPPK2P/R1B5 b - - 1 13",
    "solution": [
      "c5e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1113
  },
  {
    "fen": "6rk/3R3p/4P2r/1p3p2/p7/P1P5/1P3RpK/4Q3 w - - 1 42",
    "solution": [
      "h2g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 612
  },
  {
    "fen": "6nk/pRQ4p/6p1/5p2/4p3/2b2nP1/q4PKP/5B2 b - - 3 31",
    "solution": [
      "c3d4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 810
  },
  {
    "fen": "r3k2r/pp3p2/1qN1p2p/3p4/P7/8/1PP2bPP/R2QKB1R w KQkq - 0 17",
    "solution": [
      "e1d2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "r5rk/4qp1p/p4N1Q/1p2p3/3pP3/1P1P3P/1PP3P1/5RK1 b - - 2 23",
    "solution": [
      "g8g6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 900
  },
  {
    "fen": "1k1r3r/ppqn2p1/2p1p1p1/8/1B1PQ3/2P5/PP3PPP/R3K2R w KQ - 1 18",
    "solution": [
      "e1g1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 549
  },
  {
    "fen": "8/P6p/6p1/1k6/3pq3/1PP5/6PP/3Q2K1 w - - 0 35",
    "solution": [
      "d1d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 971
  },
  {
    "fen": "3r4/p1P1kppp/4pn2/qB2B3/4P3/2N4P/PP3PP1/3R2K1 b - - 0 22",
    "solution": [
      "d8c8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1285
  },
  {
    "fen": "1n1q2rk/p3b1p1/1pr1p1RB/2p1P3/4N3/2PP1N1P/P3B2K/6R1 b - - 0 28",
    "solution": [
      "g7h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1287
  },
  {
    "fen": "2rq1rk1/pb2bppp/np2p3/3pP3/3Pn3/P1NQB3/1P1N1PPP/1BR2RK1 b - - 2 16",
    "solution": [
      "e4c3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 696
  },
  {
    "fen": "r2q1rk1/2p1nppp/pbn5/1p1pP3/3P2b1/2NQ1N2/PPB2PPP/R1B2RK1 b - - 2 12",
    "solution": [
      "g4f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 668
  },
  {
    "fen": "1r6/p7/1p3k1K/P2p2pR/2p5/2P3P1/2P3P1/1R6 w - - 3 36",
    "solution": [
      "h5g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 613
  },
  {
    "fen": "3r2k1/pp3ppp/4p3/2N5/7q/1Q3P2/PP1r2PP/3RR2K w - - 3 24",
    "solution": [
      "d1d2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 977
  },
  {
    "fen": "4rrk1/pb4pp/1pq2p2/4p3/1BPb4/3P3P/P3QPPN/1R2R1K1 w - - 0 24",
    "solution": [
      "b4f8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1030
  },
  {
    "fen": "r1bqr1k1/p4pPp/2p1p3/2bpn2Q/8/2NB4/PPP3PP/R1B2R1K b - - 2 15",
    "solution": [
      "e5d3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 980
  },
  {
    "fen": "r2q1rk1/pp2bp1b/2p1p2Q/3nP2N/2B5/2P5/PP3PPP/R3R1K1 b - - 2 20",
    "solution": [
      "e7g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1154
  },
  {
    "fen": "1k2Rr2/p1pp4/1p1b4/3Q1pP1/qP3P2/2P4P/6K1/4R3 b - - 5 41",
    "solution": [
      "f8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 998
  },
  {
    "fen": "3rkb1r/pppqp1pp/2n5/1Q3p2/4N3/1P2P3/PBP2PPP/R3KB1R w KQk - 0 12",
    "solution": [
      "e4c5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1035
  },
  {
    "fen": "r2q1rk1/pp1n3p/2p3pQ/5Nb1/2P1p3/1P2P1P1/PB3PBP/R2R2K1 b - - 0 19",
    "solution": [
      "g5h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 859
  },
  {
    "fen": "r1b2r1k/1pp1b1pp/p1np2q1/3Qp3/1PB1P3/P3BN1P/2P2PP1/R2R3K b - - 6 17",
    "solution": [
      "f8f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 646
  },
  {
    "fen": "1r2kbnr/3b1ppp/pq1pp3/8/2pNPPP1/P1N1B3/1PPQ3P/2KR3R w k - 1 14",
    "solution": [
      "f4f5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 504
  },
  {
    "fen": "8/2p2rkp/1p4p1/p2PQ3/2P3P1/1P1q1B1P/P1n3K1/8 b - - 7 41",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1201
  },
  {
    "fen": "7Q/5p2/6p1/R3pk1p/P2q3K/7P/5PP1/7r w - - 2 41",
    "solution": [
      "g2g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1727
  },
  {
    "fen": "1r5r/3b4/pk2P3/1p2Q1Np/4BP2/1P5n/P5PP/R5qK w - - 5 36",
    "solution": [
      "a1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 994
  },
  {
    "fen": "8/8/1p6/8/knp5/7R/pK6/8 b - - 3 52",
    "solution": [
      "b6b5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 648
  },
  {
    "fen": "N4rk1/pp3ppp/5n2/3pq3/8/2P5/PP3PPP/R1BQ2K1 w - - 0 18",
    "solution": [
      "d1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 699
  },
  {
    "fen": "r2qkbr1/pp2pp1p/5n2/2p1Nb2/2Q5/4B3/PPnN1PPP/R2K1B1R b q - 1 12",
    "solution": [
      "c2a1"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 1165
  },
  {
    "fen": "3r1Q1k/p5pp/1p2p3/6PP/4P3/8/PPPr4/1K3R2 b - - 2 26",
    "solution": [
      "d8f8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 442
  },
  {
    "fen": "rn2Q1k1/pb1q1p1p/1p1p2pB/3P3n/8/2bB1N1P/PP3PP1/4R1K1 b - - 1 18",
    "solution": [
      "d7e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 420
  },
  {
    "fen": "5k2/R4p2/P6p/5p1N/r3p3/2p5/2P1R1P1/2K5 w - - 1 44",
    "solution": [
      "h5g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 573
  },
  {
    "fen": "rn3rk1/pb2qppp/1p2p3/2p5/1nP5/1PQ1PN2/PB2BPPP/R4RK1 b - - 4 13",
    "solution": [
      "b8c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 448
  },
  {
    "fen": "q7/3kbpp1/4p3/1p1pP3/2pPb1P1/1PP1B3/1Q3P1r/R5K1 w - - 0 28",
    "solution": [
      "a1a8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1288
  },
  {
    "fen": "rnbq1rk1/pp4pp/4p3/3pNp1Q/2pPn3/2PBP1P1/PP1N1PP1/R3K2R b KQ - 1 11",
    "solution": [
      "d8e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1021
  },
  {
    "fen": "r4rk1/4qppp/b3p3/pp1pP3/3P4/3Q4/PPB2PPP/R4RK1 b - - 1 17",
    "solution": [
      "b5b4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 667
  },
  {
    "fen": "3r4/1pB3kp/2b1Pp2/1pN2RpK/1P6/7P/6r1/8 w - - 0 34",
    "solution": [
      "c7d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1656
  },
  {
    "fen": "2r1rk2/pp1R3p/1b4p1/6B1/4p2P/1B6/PP3PP1/6K1 b - - 0 31",
    "solution": [
      "c8c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1392
  },
  {
    "fen": "4kb2/2p4p/ppN1P1p1/8/2P5/r2n2P1/2K4P/3R4 b - - 3 34",
    "solution": [
      "d3c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 551
  },
  {
    "fen": "3r2rk/1b3p1Q/p1q2Pp1/1p6/6P1/P2BR3/1PP2R1P/6K1 b - - 0 28",
    "solution": [
      "h8h7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 975
  },
  {
    "fen": "r3k2r/1pp5/p1b1pq1b/3p2Np/3P1BnP/8/PPP2PP1/RN1QK2R w KQkq - 0 14",
    "solution": [
      "f4e5"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 955
  },
  {
    "fen": "1r1r3k/p2qR1pp/b1p5/2p3Q1/8/2PPR2P/PP3PP1/6K1 b - - 2 26",
    "solution": [
      "d7d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1174
  },
  {
    "fen": "r1q2rk1/1p1b1pbp/p2p2n1/2p2N2/P3PR2/2NP2QP/1PP3BK/R7 b - - 4 20",
    "solution": [
      "g6f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 989
  },
  {
    "fen": "3r1rk1/pp6/5pb1/2p2q2/8/P2P4/1PP4Q/2K3RR b - - 1 27",
    "solution": [
      "c5c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1880
  },
  {
    "fen": "rn3k1r/pp2p2p/2p2np1/8/2B5/4q3/PQP3PP/RN3K1R b - - 3 14",
    "solution": [
      "f6e4"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 636
  },
  {
    "fen": "6k1/pQ3pp1/7p/8/3P4/6Pb/PPr2r1P/2R3K1 w - - 0 25",
    "solution": [
      "c1c2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 938
  },
  {
    "fen": "r2qkbnr/1p2pppp/p1n5/4N3/2BP2b1/8/PP3PPP/RNBQ1RK1 b kq - 3 8",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1191
  },
  {
    "fen": "rnb1k2r/bpqp1pp1/p3p3/7p/4P1n1/1NNB3P/PPP2PP1/R1BQ1R1K w kq - 1 11",
    "solution": [
      "d1e2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 662
  },
  {
    "fen": "5R1k/4q2p/3Np1bP/4P3/3P2P1/2n5/8/5QK1 b - - 6 45",
    "solution": [
      "e7f8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 474
  },
  {
    "fen": "r2qkbnr/pp1np2p/2p2pp1/3p1N2/3P1B2/4P3/PPPN1PPP/R2QKB1R b KQkq - 0 7",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 665
  },
  {
    "fen": "r4r2/p1p2k1R/6R1/3n1pB1/1q1Pb3/8/1P2Q1PP/6K1 b - - 2 35",
    "solution": [
      "f7g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1139
  },
  {
    "fen": "rb3rk1/5ppp/p1pqbn2/2Np4/1P2p3/P3P3/1B1PBPPP/2RQ1RK1 w - - 2 18",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 618
  },
  {
    "fen": "8/8/1P4p1/3B3p/R3P3/5PkP/1q4P1/R6K w - - 1 46",
    "solution": [
      "b6b7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 966
  },
  {
    "fen": "2r5/p3b1k1/8/4pp1K/2Pp2p1/6P1/P1P1Rq1P/R2Q4 w - - 4 29",
    "solution": [
      "e2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "r3kb1r/1p3ppp/p1n5/2p1q3/B3P1n1/2NP4/PP2N1PP/R1BQK2R w KQkq - 0 13",
    "solution": [
      "e1g1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 599
  },
  {
    "fen": "r2qr3/p2n1kp1/b1pb1n1p/8/1p1P1N2/1Q3N1P/PP3PP1/R1B1R1K1 b - - 1 16",
    "solution": [
      "f7f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1105
  },
  {
    "fen": "r2qkb1r/1p2pppp/p2p1n2/2p1N2b/P1B1P3/3P3P/1PPN1PP1/R1BQ1RK1 b kq - 0 9",
    "solution": [
      "h5d1"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 1060
  },
  {
    "fen": "2k5/1p5R/3K4/P5r1/8/1p6/8/8 b - - 1 46",
    "solution": [
      "g5b5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1320
  },
  {
    "fen": "4k3/4p2R/1pp1P1p1/8/3pN3/4b3/rPP3PP/5K2 b - - 2 25",
    "solution": [
      "a2b2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 733
  },
  {
    "fen": "r2q1rk1/pp1bnpp1/2n1p3/2b1P1NQ/3p4/P7/1P3PPP/RNB2RK1 b - - 3 13",
    "solution": [
      "e7g6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 792
  },
  {
    "fen": "r3k2r/1ppqb2p/p1b1N1p1/3pPR2/3P2Q1/2P5/PP4PP/RNB3K1 b kq - 0 14",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1299
  },
  {
    "fen": "8/1b2R1kp/p7/3p2P1/PP1n2KP/2r5/3N4/8 b - - 5 46",
    "solution": [
      "g7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1128
  },
  {
    "fen": "6k1/4pp2/3p2p1/8/1P1QP2p/5Pqb/6r1/2R2BK1 w - - 0 38",
    "solution": [
      "f1g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 651
  },
  {
    "fen": "8/8/3R4/1P3k2/2Bb2pK/8/7r/8 w - - 1 63",
    "solution": [
      "h4g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1675
  },
  {
    "fen": "r1b2rk1/pp3ppp/2p1pn2/8/2P5/n5Q1/PP1BN1PP/Kq1R1B1R w - - 10 22",
    "solution": [
      "d1b1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1068
  },
  {
    "fen": "1r6/3R2p1/p5kp/1p2p2N/2Pn2K1/1P6/P5PP/8 b - - 2 30",
    "solution": [
      "b5c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1050
  },
  {
    "fen": "8/3k1r2/p7/1p3p1P/3Q1PPB/P1n4K/1b1p4/3q4 b - - 10 55",
    "solution": [
      "d7e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1100
  },
  {
    "fen": "b4rk1/p1q2pbp/4p1p1/1PPp4/7r/1Q2BP2/P1N3PP/4RR1K w - - 5 31",
    "solution": [
      "e3f2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 839
  },
  {
    "fen": "r4r1k/1ppq2p1/1pnp1nQp/4pN2/4P3/3PB2P/PPP2RP1/R5K1 b - - 11 18",
    "solution": [
      "c6e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1125
  },
  {
    "fen": "rnb1k1nB/ppp2p1p/8/8/7q/1P3pb1/P1PPP2P/RN1QKB1R w KQq - 0 9",
    "solution": [
      "h2g3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1084
  },
  {
    "fen": "r1r3k1/1b3ppp/4p3/p2q4/1p1n4/3P1N1P/2PN1PP1/R2QR1K1 w - - 2 20",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 894
  },
  {
    "fen": "r1b2rk1/p2n2bp/4pqp1/2pp4/5PPP/2N1B3/PPPQ4/2KR1B1R w - - 0 16",
    "solution": [
      "c3d5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 534
  },
  {
    "fen": "6rk/1R6/6Pp/p1p5/6K1/7r/3b4/8 b - - 5 43",
    "solution": [
      "h3h1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 753
  },
  {
    "fen": "4Qb1r/pp2R1k1/2pq1p2/8/3p4/1BP4P/PP1B2P1/6K1 b - - 0 32",
    "solution": [
      "f8e7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1126
  },
  {
    "fen": "2r4Q/p4k1R/1p2p3/3b1rq1/3P4/P1P5/3n1PPP/R5K1 b - - 4 28",
    "solution": [
      "f7g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1431
  },
  {
    "fen": "r1b4r/p1B1ppbp/2p2np1/kp6/N2RP3/8/PPP2PPP/2K2B1R b - - 1 13",
    "solution": [
      "a5a6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 805
  },
  {
    "fen": "r2q1rk1/pp1b1pb1/2n1p3/3n2NP/3P4/3QB3/PP2BPP1/2KR3R b - - 2 18",
    "solution": [
      "d5e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 667
  },
  {
    "fen": "3R4/2p1k3/4p1p1/1p2P2p/1P6/8/4rr2/3R2K1 b - - 7 41",
    "solution": [
      "e7f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1069
  },
  {
    "fen": "2kr1bnr/ppp2ppp/8/8/8/q4N2/bPPBPPPP/2KR1B1R w - - 0 11",
    "solution": [
      "b2a3"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 721
  },
  {
    "fen": "r1bq1rk1/pp2bppp/4p3/3pn2N/1P1Q4/2P5/PB2BPPP/R4RK1 b - - 5 16",
    "solution": [
      "e5c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1083
  },
  {
    "fen": "1r6/8/3bkN2/2p5/P2pp3/3P3P/R4PP1/6K1 w - - 2 47",
    "solution": [
      "f6e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 702
  },
  {
    "fen": "r1b1kb1r/pp1n1ppp/R3p3/1NppP1B1/3P4/3B1N2/1qP2PPP/3QK2R b Kkq - 0 11",
    "solution": [
      "b7a6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1163
  },
  {
    "fen": "3r1rk1/p1p1R1pp/1pq5/8/2PP4/PN4Pb/1P1Q1P1P/4R1K1 w - - 1 27",
    "solution": [
      "d2g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1017
  },
  {
    "fen": "r3q2k/7p/p3p1BQ/1p2P3/P7/2p2b2/1P3P1K/6R1 b - - 0 31",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 990
  },
  {
    "fen": "6k1/5p2/1p2pn2/3pN3/1P1P1Pp1/P3r1Pp/2q1RP1P/6K1 w - - 0 32",
    "solution": [
      "e2c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 458
  },
  {
    "fen": "7k/6p1/2p4p/p3P3/P7/1P1Bq2P/2P3P1/5R1K b - - 0 32",
    "solution": [
      "e3e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 437
  },
  {
    "fen": "2r2rk1/p2bbpp1/2n1pn1p/q3P1N1/3P1B1P/2PQ4/P2N1PP1/R3K2R b KQ - 0 16",
    "solution": [
      "f6d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 763
  },
  {
    "fen": "rn1q2k1/p1pp2pB/1p2pb2/6NQ/3P4/2P5/PP3P2/R3K2b b Q - 5 20",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 929
  },
  {
    "fen": "rn2k2r/ppq2p2/2p1pp2/8/2BN2p1/3P4/PPPB1P2/R2Q1RbK w kq - 4 16",
    "solution": [
      "h1g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 672
  },
  {
    "fen": "2k5/r5p1/2K2p1p/8/7P/p7/8/4R3 b - - 7 61",
    "solution": [
      "a3a2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 686
  },
  {
    "fen": "2r5/p2bk1Q1/1p2p3/3nN3/3P4/8/Pq3PPP/4R1K1 b - - 0 25",
    "solution": [
      "e7d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1299
  },
  {
    "fen": "r3kb1r/ppp2ppp/8/2p1Pb2/3Pn2q/3B1P2/PPP3PP/RNBQK2R w KQkq - 1 9",
    "solution": [
      "e1e2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 941
  },
  {
    "fen": "3b4/pp2kprp/8/1Bp5/4R3/1P6/P4PPP/1K6 b - - 0 22",
    "solution": [
      "e7f8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 466
  },
  {
    "fen": "5b1k/pQ6/5BBp/5P2/3q2p1/7P/6PK/8 b - - 0 36",
    "solution": [
      "d4f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 630
  },
  {
    "fen": "r5k1/6p1/2N3pp/3p4/P2P4/1P5n/6PP/5RqK w - - 7 34",
    "solution": [
      "f1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 988
  },
  {
    "fen": "r4rk1/pb2bpp1/4pn1p/2pqN3/3p3B/3P3P/PPP1NPP1/1R1Q1RK1 w - - 2 15",
    "solution": [
      "h4g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 543
  },
  {
    "fen": "Q3R3/1R3ppk/7p/8/2p5/2P5/1Pr4r/4K3 w - - 3 54",
    "solution": [
      "b7f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1275
  },
  {
    "fen": "3rk2r/p3nppp/1pp5/q7/1B2QRP1/4P2P/P7/4KR2 b k - 11 30",
    "solution": [
      "a5d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 928
  },
  {
    "fen": "r5rk/1p3p1p/1b1p1p2/pP1P3q/P1P1Pn2/3B1NK1/5P2/R2Q3R w - - 8 28",
    "solution": [
      "g3f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1784
  },
  {
    "fen": "r1b1k2r/pp3ppp/2p1pn2/4P1B1/Pbp5/2N1P3/1P3PPP/3RKB1R b Kkq - 0 10",
    "solution": [
      "f6e4"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 636
  },
  {
    "fen": "rn1r4/pp2k3/8/2b4N/4p1Q1/1B6/PPP2qPP/R1BK3R w - - 2 17",
    "solution": [
      "c1d2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1460
  },
  {
    "fen": "4k1nr/r1pp1ppq/1p2p3/2b5/2P1PP2/pPNP1nP1/P2B1N1P/R2Q1RKB w k - 3 21",
    "solution": [
      "d1f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 778
  },
  {
    "fen": "r1k4r/pp3Qp1/2nb3p/1B2q3/4N3/8/PP3PPP/R4RK1 w - - 1 18",
    "solution": [
      "b5c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "k1r2n2/p2r1pp1/P1BBp2p/4P3/2P5/2K4P/5PP1/1R6 b - - 0 34",
    "solution": [
      "c8c6"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 560
  },
  {
    "fen": "6R1/p4q2/2p4p/6pk/6P1/8/P4r1P/6QK b - - 0 42",
    "solution": [
      "h5h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 854
  },
  {
    "fen": "r2qkb1r/1p1npppp/p4n2/8/2BP2b1/1Q3N2/PP1N1PPP/R1B1K2R b KQkq - 1 9",
    "solution": [
      "b7b5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1209
  },
  {
    "fen": "r4r1k/1pp1NppR/3p4/p3n3/4P3/1PPP2P1/1P1K2P1/3R4 b - - 0 22",
    "solution": [
      "h8h7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 611
  },
  {
    "fen": "r1bqk2r/pp2bpp1/2p1pn1p/4N3/3PNQ2/2P3P1/PP3PBP/R3K2R b KQkq - 4 13",
    "solution": [
      "f6e4"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 836
  },
  {
    "fen": "2r3q1/1p6/p2p3R/3PpkP1/4np2/3B4/PP6/1K4R1 b - - 5 31",
    "solution": [
      "g8d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1268
  },
  {
    "fen": "5k2/5pp1/3P2p1/2pP4/5PP1/4nBbP/2r5/BR5K b - - 0 35",
    "solution": [
      "g3f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1500
  },
  {
    "fen": "rnb2rk1/pp1p1ppp/4p3/4P3/3b1Pnq/2N5/PPPNB1PP/R1BQ1R1K w - - 2 12",
    "solution": [
      "g2g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1101
  },
  {
    "fen": "r6r/ppp1kBp1/2np4/4p3/4P1p1/P2P3q/1PPN1P2/R2Q1RK1 w - - 0 17",
    "solution": [
      "d1g4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 727
  },
  {
    "fen": "r1b2k1r/pppp2pp/2n5/4q1N1/2Q1P3/8/P4PPP/R1B2RK1 b - - 2 15",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 982
  },
  {
    "fen": "3r1rk1/pp4b1/2p2p2/5P1p/6n1/2N2B2/PPP1Q1Pq/3RR1K1 w - - 2 26",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 936
  },
  {
    "fen": "Q6k/7p/6p1/8/3b4/4q3/PP5B/2r2R1K b - - 3 32",
    "solution": [
      "h8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1342
  },
  {
    "fen": "1r4kQ/3b4/3qp1p1/3p3R/p2P3P/2P3P1/P4P2/6K1 b - - 1 32",
    "solution": [
      "g8f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1353
  },
  {
    "fen": "r4b2/1p3R2/3kp1p1/1B1p1b2/P2P4/8/1PP1N2r/2K1R3 b - - 1 27",
    "solution": [
      "a8c8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 846
  },
  {
    "fen": "6k1/Q7/6p1/2p4p/P6P/1P3qPK/2P5/8 w - - 1 46",
    "solution": [
      "a7c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1483
  },
  {
    "fen": "8/8/3R2k1/6P1/1p3K2/8/8/1r6 b - - 3 59",
    "solution": [
      "g6h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 546
  },
  {
    "fen": "3r2k1/p1p2ppp/2B1b3/4q3/N6Q/3n4/P4PPP/5RK1 b - - 5 20",
    "solution": [
      "d3f4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1056
  },
  {
    "fen": "3k3r/2R2p2/p7/1p4P1/3PpB2/5bP1/P5r1/4RK2 w - - 13 32",
    "solution": [
      "e1c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1051
  },
  {
    "fen": "6k1/ppp2pp1/7p/8/2R5/2Pr4/Pr4PP/1R5K w - - 0 26",
    "solution": [
      "b1b2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 717
  },
  {
    "fen": "r1b3k1/1pq3b1/p2N2Q1/2PB4/1P1p4/3Pp3/P4rpP/R5KR b - - 1 30",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1425
  },
  {
    "fen": "8/Q4pk1/1Pq3p1/8/4RKP1/4RP1P/P7/6r1 w - - 9 43",
    "solution": [
      "a7c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1074
  },
  {
    "fen": "5rk1/p4ppp/7q/4p3/1PP2b2/P4Q2/3r2PP/2B1RR1K w - - 3 23",
    "solution": [
      "c1d2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 831
  },
  {
    "fen": "r4bnr/ppq1kQp1/2p1Pn1p/3p4/3P3P/8/PPP5/RNB1K1NR b KQ - 4 14",
    "solution": [
      "e7d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1080
  },
  {
    "fen": "2k5/8/1K1Q4/2P5/8/8/8/1q6 w - - 13 67",
    "solution": [
      "b6c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 925
  },
  {
    "fen": "1Q6/2Pk4/p3pp1p/3q2p1/1p6/1P2P1P1/5P1P/6K1 b - - 2 42",
    "solution": [
      "d5c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1021
  },
  {
    "fen": "8/8/8/1P5R/4bk2/4R2P/5P2/r5K1 w - - 1 43",
    "solution": [
      "g1h2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 453
  },
  {
    "fen": "6k1/5ppp/1P2p3/3p4/3n4/6P1/1r4bP/R5K1 b - - 0 33",
    "solution": [
      "g2e4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 663
  },
  {
    "fen": "r5k1/R3Qppp/1p2p3/3q4/3P4/4P3/2r2PPP/5RK1 b - - 0 23",
    "solution": [
      "a8a7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1216
  },
  {
    "fen": "r4rk1/pbq2p1p/1pnbpnp1/6N1/3PN3/P6Q/1PB2PPP/R1B2RK1 b - - 5 16",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1175
  },
  {
    "fen": "rnb1k2r/ppp2p1p/4p3/8/3N2Bq/2NP2b1/PPP2PP1/R1BQ1R1K w kq - 1 13",
    "solution": [
      "h1g1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 964
  },
  {
    "fen": "r6r/N2k1pQ1/4p2p/1Nbp4/P3n3/8/2P3PP/R3R1qK w - - 2 26",
    "solution": [
      "e1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 836
  },
  {
    "fen": "1q2r1Qk/4B1bp/6pN/p1pN4/8/8/P1P2PPP/1r1R2K1 b - - 8 25",
    "solution": [
      "e8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1205
  },
  {
    "fen": "r3kb1r/1p2pppp/pqnp4/3P4/B3n1b1/5N2/PP1B1PPP/RN1QK2R w KQkq - 0 11",
    "solution": [
      "d5c6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1375
  },
  {
    "fen": "8/8/p4nk1/Pp2Br2/8/2P3PK/1P2Qr1P/8 w - - 5 46",
    "solution": [
      "e2e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 934
  },
  {
    "fen": "r4rk1/pb3ppp/2q2n2/4p1B1/8/2PB4/P1Q2PPP/R2R2K1 w - - 4 16",
    "solution": [
      "g5f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 624
  },
  {
    "fen": "4kr2/1R6/p1pKP3/P1r2P2/8/8/8/8 b - - 1 49",
    "solution": [
      "c5f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1373
  },
  {
    "fen": "r3k2r/pp3pp1/2pqpn2/2N3p1/2P5/8/PPP1QPPP/R4RK1 w kq - 1 15",
    "solution": [
      "c5b7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 735
  },
  {
    "fen": "r3k2r/pp3pp1/4p3/3pqnp1/PPP5/8/4NPPP/R2Q1RK1 w kq - 0 21",
    "solution": [
      "c4d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1007
  },
  {
    "fen": "1r2k1nr/3b1ppp/3Qp3/8/8/B3P1P1/5P1P/1q3RK1 b k - 0 24",
    "solution": [
      "b1b6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1141
  },
  {
    "fen": "6k1/p1p2pp1/1p1b3p/3Pq3/2P5/5Q1P/P1R3P1/7K w - - 3 31",
    "solution": [
      "c2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1717
  },
  {
    "fen": "8/p4p1p/2p1p3/5p2/5k1P/5P2/PPP2KP1/8 b - - 2 27",
    "solution": [
      "e6e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 920
  },
  {
    "fen": "r3r1k1/1pp2pp1/p1bb3p/6q1/2P5/1P2P2P/PBQN1PP1/R4RK1 w - - 1 16",
    "solution": [
      "f2f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 575
  },
  {
    "fen": "5k2/3R2p1/4Kp1p/3p4/2r3P1/5P2/6P1/8 b - - 2 41",
    "solution": [
      "d5d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 975
  },
  {
    "fen": "B2Qnk1r/p1p2pp1/6q1/2b5/5B2/2P2Np1/PP2P2P/R4R1K w - - 0 19",
    "solution": [
      "b2b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1119
  },
  {
    "fen": "2q1rbk1/5p1p/2p2np1/3p1P2/1p1P4/3BP2P/1PQ1NP2/6RK w - - 0 24",
    "solution": [
      "f5g6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 534
  },
  {
    "fen": "8/6p1/4k1N1/5R1P/4n1PK/8/5P2/r7 w - - 11 60",
    "solution": [
      "f2f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 603
  },
  {
    "fen": "rn1qkbnr/ppp1ppp1/3p3p/4N3/2B1P1b1/8/PPPP1PPP/RNBQK2R b KQkq - 1 4",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1104
  },
  {
    "fen": "r4rk1/1bppbppp/p1q5/1p2P3/3p1Q2/1B1P1N2/PPP2PPP/R4RK1 w - - 1 18",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 515
  },
  {
    "fen": "r2q1rk1/1ppbbpp1/2np1n1p/1B6/4N3/2Q1PN2/PBP2PPP/R3K2R b KQ - 4 12",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 550
  },
  {
    "fen": "r2q3r/ppp2k1p/5np1/8/4p1b1/4Q3/PPP2PPP/RNB1K2R w KQ - 2 13",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 490
  },
  {
    "fen": "4r1k1/p2Q2bp/4p1p1/1p2r1B1/8/1P5n/P5PP/4RRqK w - - 4 26",
    "solution": [
      "f1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1179
  },
  {
    "fen": "2kr3r/pp1nqpb1/2P2n2/7p/2B3b1/2N1B1Q1/PPP2PPP/R4RK1 b - - 0 14",
    "solution": [
      "b7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 945
  },
  {
    "fen": "8/8/R7/5k2/3r3p/6pP/6P1/6K1 w - - 4 70",
    "solution": [
      "a6a7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "5k2/3R4/3P2K1/2p3P1/1p1r4/8/8/8 b - - 0 57",
    "solution": [
      "c5c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1449
  },
  {
    "fen": "4r2k/R7/1p6/5ppp/3P1P1K/4P3/PP2QPq1/2R5 w - - 0 32",
    "solution": [
      "f4g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1874
  },
  {
    "fen": "3Q3k/6pp/8/2p1q3/P3p3/3p3P/1rr2PP1/1R3RK1 b - - 3 29",
    "solution": [
      "e5e8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 502
  },
  {
    "fen": "7r/p1Q2k1p/1p4p1/2pq1r2/3p4/2PP4/PP3P1P/4RRK1 b - - 4 24",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1003
  },
  {
    "fen": "r3r1k1/p4ppp/2p5/3p4/3bbPP1/2N4q/PPPQ3N/4RRK1 w - - 2 22",
    "solution": [
      "d2d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1034
  },
  {
    "fen": "8/8/p7/k1Q5/2K5/8/8/7q b - - 1 52",
    "solution": [
      "a5a4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 966
  },
  {
    "fen": "8/p1P5/3p2k1/P1Pq1p1p/1P3Q1P/6P1/5RK1/1r6 w - - 3 45",
    "solution": [
      "g2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 881
  },
  {
    "fen": "r1b2k1r/pppq1ppp/1n6/1B1PQ1B1/8/2P5/P4PPP/R3K2R b KQ - 2 15",
    "solution": [
      "d7d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1235
  },
  {
    "fen": "3k4/6Q1/6n1/7p/p1q1P1pP/P1B5/1P5P/7K w - - 6 39",
    "solution": [
      "g7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 669
  },
  {
    "fen": "r2q1rk1/pb2p1b1/1p1pNnQ1/2p4p/3P3P/2P1P1B1/PP3P2/R3K1R1 b Q - 2 17",
    "solution": [
      "d8e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "2bR2k1/2q3pp/5p2/1pb1pN2/2p1P1Q1/2P3P1/1P3PBP/6K1 b - - 0 29",
    "solution": [
      "c7d8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 576
  },
  {
    "fen": "r1bqk2r/ppp1n1p1/2np1p1p/4pP1Q/2B1P3/2b3N1/PPPP2PP/R1B2RK1 b kq - 1 9",
    "solution": [
      "e8d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 886
  },
  {
    "fen": "r1bq1r1k/1pp3p1/p1np3B/2b4Q/4p3/P2P3P/BPP2PPN/R4RK1 b - - 0 15",
    "solution": [
      "g7h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 480
  },
  {
    "fen": "2kr3r/2pbqpb1/p2p3p/1p1Q2p1/3N4/BP2P2P/P1P2PP1/2R2RK1 b - - 0 21",
    "solution": [
      "g7d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 943
  },
  {
    "fen": "3r1r1k/ppp2pnp/3b3Q/4q3/2B1N1R1/P4P2/1P5P/2K5 b - - 2 22",
    "solution": [
      "e5h5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 896
  },
  {
    "fen": "8/5k1R/5p2/2K2Npp/4P3/5P2/8/3r2n1 b - - 3 57",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1054
  },
  {
    "fen": "r3kbnr/pp3ppp/4q3/2p1P3/8/1PB5/2PQ1PPP/2KRR3 b kq - 4 18",
    "solution": [
      "a8d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 452
  },
  {
    "fen": "r3kb1r/pp1qp1p1/2npNp2/7p/4Q3/6P1/PPP1PPKP/R1B2R2 b kq - 3 13",
    "solution": [
      "h5h4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1024
  },
  {
    "fen": "r2qkb1r/p1pnp2p/1p4N1/5p1Q/3P4/2N5/PPP2PbP/R1B1K2R b KQkq - 0 11",
    "solution": [
      "h7g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 862
  },
  {
    "fen": "3Q4/p3Nppk/1p2q2p/2p1b3/2P1p3/4P2P/PP3PP1/6K1 b - - 13 35",
    "solution": [
      "e5f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 830
  },
  {
    "fen": "1rbR1rk1/5pp1/p3p2p/1p6/4B3/8/PPP2PPP/2KR4 b - - 1 18",
    "solution": [
      "f8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 673
  },
  {
    "fen": "r2qkb1r/pp1Npppp/4b3/1Np5/Q1P5/8/PP1P1PPP/R1B1R1K1 b kq - 0 13",
    "solution": [
      "e6d7"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1280
  },
  {
    "fen": "3q1r1k/6pp/3p2p1/pppP4/5RP1/3P4/PPPQ4/2K5 b - - 0 25",
    "solution": [
      "d8g5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 480
  },
  {
    "fen": "5rk1/p2b3p/qp1Q1pp1/3N3n/4P3/5P2/P3N1PP/1Rr4K w - - 0 28",
    "solution": [
      "e2c1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 619
  },
  {
    "fen": "8/1p4kp/5Qp1/3pP2r/4qP2/8/P1rB1R2/6K1 b - - 2 34",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1756
  },
  {
    "fen": "7R/p4Q2/6pk/2p1r3/2P1b3/1P4P1/Pq5P/6K1 b - - 2 54",
    "solution": [
      "h6g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1548
  },
  {
    "fen": "6k1/2p2pp1/4p1np/1R6/3Pb3/2P2NB1/5PPP/r5K1 w - - 1 24",
    "solution": [
      "f3e1"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 679
  },
  {
    "fen": "r1b1k1nr/pp1p1pbp/4p1p1/2pPP3/4q3/2P5/PP1K2PP/RNBQ1BNR w kq - 0 9",
    "solution": [
      "d5d6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1571
  },
  {
    "fen": "r1b5/ppp3pp/3k4/4p2Q/1q5P/3B4/P2KR3/4R3 w - - 9 30",
    "solution": [
      "d2e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1435
  },
  {
    "fen": "r4rk1/pb3pbp/2q1p1p1/8/N2p1B2/1P1B4/P1P2nPP/1R1QR1K1 w - - 0 18",
    "solution": [
      "g1f2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1154
  },
  {
    "fen": "1nkr1b1r/pppb4/4p1p1/PP3p1q/2PP2p1/6P1/5PBP/RNBQ1RK1 w - - 2 19",
    "solution": [
      "c1f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 514
  },
  {
    "fen": "rnbq1rk1/1pp1bppn/p2pp3/6PQ/2PPP3/2N5/PP1N1PP1/R3KB1R b KQ - 2 10",
    "solution": [
      "e7g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 578
  },
  {
    "fen": "r1bq1b1r/pp1n1kpp/2p1pn2/6N1/8/8/PPPPQPPP/R1B1KB1R b KQ - 1 8",
    "solution": [
      "f7e7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 976
  },
  {
    "fen": "2r3k1/p4p2/1p4pp/3p4/3Bq3/P6P/5QP1/5RK1 b - - 1 36",
    "solution": [
      "c8c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 600
  },
  {
    "fen": "8/1pp2p2/p4qp1/1kR4p/1P6/7P/5PP1/1R4K1 b - - 4 36",
    "solution": [
      "b5a4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1154
  },
  {
    "fen": "r3kb1r/1p3p2/p2p4/3QpPB1/P5P1/5P2/1Pq5/R4RK1 w kq - 0 22",
    "solution": [
      "d5b7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 887
  },
  {
    "fen": "1r6/1r3pkp/qR2p1p1/2pP4/4P3/5P2/6PP/1R5K w - - 0 27",
    "solution": [
      "b6a6"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 725
  },
  {
    "fen": "r2q1rk1/pbpn1p1n/1p1pp2Q/7P/4P3/2NP2R1/PPP1BPP1/R3K3 b Q - 6 17",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 981
  },
  {
    "fen": "Bn2k2r/p3pp1p/3p2p1/8/8/2P3b1/P1QB1P1q/3RR1K1 w k - 5 23",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 917
  },
  {
    "fen": "r1bq1b1r/1ppk1Qp1/p1n1p2p/3n1p2/3PN3/2PB2B1/PP3PPP/R3K1NR b KQ - 3 11",
    "solution": [
      "f8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1145
  },
  {
    "fen": "3r1k1r/1Q4pp/p1n5/qp6/8/2K1PN2/1PP2PPP/3R1B1R w - - 5 18",
    "solution": [
      "b2b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 851
  },
  {
    "fen": "2r2rk1/5ppn/p1b4p/1pb1qP1N/2pp2Q1/P6P/BPP3PN/4RR1K b - - 1 24",
    "solution": [
      "h7f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1635
  },
  {
    "fen": "2kr3r/ppp1n2p/2nb1p2/3pN1pq/3P4/2P5/PPQN1P2/R1B1RBK1 w - - 0 15",
    "solution": [
      "e5c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1130
  },
  {
    "fen": "8/1R6/1p3kpp/8/5PKP/Pr6/8/8 w - - 0 39",
    "solution": [
      "b7c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 953
  },
  {
    "fen": "8/p4R1p/1p4k1/4p3/5n2/PN2KP2/2r4P/8 w - - 1 32",
    "solution": [
      "f7a7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1474
  },
  {
    "fen": "1r6/p1p2n2/1pk2Pp1/6r1/8/2N5/PPP4K/3R1R2 w - - 2 24",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1182
  },
  {
    "fen": "4qr2/1p1R4/p2Q2pk/4P2p/3P1n1P/8/PP5K/8 b - - 0 35",
    "solution": [
      "e8e6"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1014
  },
  {
    "fen": "r1q1k2r/pp3ppp/1n2b3/6N1/1bpPQB2/4P3/PP2KPPP/2R4R b kq - 4 15",
    "solution": [
      "e8g8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1099
  },
  {
    "fen": "rn1q1rk1/1b2bpp1/p3p2p/1pp1P3/3P4/2NQ1N2/PPB2PPP/3R1RK1 b - - 1 14",
    "solution": [
      "c5c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 553
  },
  {
    "fen": "8/p2R2pp/1p2Bp2/4pP2/6P1/4k2P/P1P4r/4K3 w - - 2 34",
    "solution": [
      "e1d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 981
  },
  {
    "fen": "5k2/p4p1p/1p4p1/8/4P3/2r5/P4PPP/1R4K1 w - - 0 23",
    "solution": [
      "b1b2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 414
  },
  {
    "fen": "r4nk1/pp5p/2pBp2K/2Pp2P1/3Q4/7P/PPB1q3/8 b - - 1 31",
    "solution": [
      "e2c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1057
  },
  {
    "fen": "2r2k2/R4B1p/1p2p3/8/4P3/1P2P1P1/P2r3P/6K1 w - - 1 24",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 726
  },
  {
    "fen": "r6k/ppp2B2/3p1b1p/4p2r/2P1Pp2/P2P1n2/1P3PRq/R4Q1K w - - 0 27",
    "solution": [
      "g2h2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 949
  },
  {
    "fen": "rn1qkbnr/pp2pppb/2p4p/7P/2P1N3/3B1N2/PP2QPP1/R1B1K2R b KQkq - 0 10",
    "solution": [
      "b8d7"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1120
  },
  {
    "fen": "8/ppQ3p1/2b1p1k1/3q1n2/3P4/4B3/5PPP/R5K1 w - - 3 28",
    "solution": [
      "c7f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 721
  },
  {
    "fen": "r2q2k1/ppp3p1/2npbn1B/2bNp3/4P3/3P2Q1/PPP2PPP/R4RK1 b - - 0 13",
    "solution": [
      "e6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 596
  },
  {
    "fen": "3r2kr/p5pp/1p2Q3/2pNP3/3n4/4B3/PP4PP/5RK1 b - - 0 26",
    "solution": [
      "d4e6"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 713
  },
  {
    "fen": "r1bq1r1k/pp2p2p/3p1nRQ/2p5/8/1B1P4/PPP2bPP/RNB4K b - - 3 15",
    "solution": [
      "f6g8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1584
  },
  {
    "fen": "4r1k1/1p3p2/1r5p/Q3p1p1/2P5/3P1PPb/P4qNP/R2R3K w - - 2 27",
    "solution": [
      "a5d2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1300
  },
  {
    "fen": "r3r1k1/p1p2ppp/4b3/7q/6n1/2BP4/PPP2RPP/RN3QK1 w - - 10 17",
    "solution": [
      "f2e2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 958
  },
  {
    "fen": "5rk1/5Qpp/1r3p2/6q1/1PB4n/P6P/5PP1/3R1R1K b - - 0 22",
    "solution": [
      "f8f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 827
  },
  {
    "fen": "rn1Br1k1/pp3ppp/2p5/3p3b/3P4/5B1P/PPP2PP1/RN2R1K1 b - - 0 14",
    "solution": [
      "h5f3"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 584
  },
  {
    "fen": "R7/8/5p2/8/8/1P3k1K/Pr6/8 w - - 2 46",
    "solution": [
      "h3h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 668
  },
  {
    "fen": "r2q2k1/4p1b1/5pN1/2p2Qp1/8/1p1P2P1/1PPK2P1/7R b - - 1 28",
    "solution": [
      "b3c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1507
  },
  {
    "fen": "6rk/p1RR2p1/4qp1Q/4p3/6Pn/P4P2/1P6/K7 b - - 0 44",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 592
  },
  {
    "fen": "r2qr1k1/pp4pp/5bn1/3p2N1/Q4Bb1/2N5/PP1R1PPP/4R1K1 w - - 6 19",
    "solution": [
      "c3d5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1078
  },
  {
    "fen": "3R1k2/nbp1q1p1/4PpQp/pp6/6P1/P3p3/1P2BbP1/1K5R b - - 2 29",
    "solution": [
      "e7d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1051
  },
  {
    "fen": "8/8/8/7p/5Kpk/7P/6P1/8 b - - 1 54",
    "solution": [
      "g4h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1249
  },
  {
    "fen": "4q1k1/pppb1p1p/3p2pb/3P4/2PQ1P2/2B2BP1/PP5P/6K1 b - - 1 24",
    "solution": [
      "h6g7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1010
  },
  {
    "fen": "2r3k1/pR5p/3bpq1p/3p4/8/P2Q1NP1/5P1P/6K1 b - - 2 30",
    "solution": [
      "c8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 683
  },
  {
    "fen": "3rk1nr/p4pp1/2p4p/1p2b3/6b1/1P3N2/1PP2PPP/RNB1K2R w KQk - 0 13",
    "solution": [
      "f3e5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 560
  },
  {
    "fen": "1k1Qr3/p1p3p1/Bpb2r1p/8/2P5/2q5/P4PPP/3R1RK1 b - - 4 22",
    "solution": [
      "e8d8"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 811
  },
  {
    "fen": "1r6/R5p1/p1b1k3/2P5/8/2n1P3/1R3PpP/6K1 w - - 0 31",
    "solution": [
      "b2b8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 522
  },
  {
    "fen": "rb2k2r/1pqn2pp/2p1pn2/p2p2B1/1P1P4/2P2Q1P/P2NBPP1/R4RK1 w kq - 2 14",
    "solution": [
      "b4a5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 634
  },
  {
    "fen": "8/3r2pp/R7/3pkP2/6P1/4K3/7P/8 b - - 0 42",
    "solution": [
      "h7h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 989
  },
  {
    "fen": "7r/1p6/2p3R1/2PpR3/5b1k/6P1/p4P1K/8 b - - 0 39",
    "solution": [
      "f4g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 968
  },
  {
    "fen": "4k3/pp6/6P1/2pPn3/3b2BQ/PPq5/K2R4/8 w - - 1 38",
    "solution": [
      "d2e2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 947
  },
  {
    "fen": "r4rk1/1p1b1p2/p3p1p1/q2pN2p/5Q1P/2N3R1/nPP2PP1/2K1R3 w - - 0 21",
    "solution": [
      "c3a2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "1rb1k2r/b5p1/p2pPp1p/qp1n4/7N/1P6/P4PPP/R1BQR1K1 w k - 0 19",
    "solution": [
      "d1d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 520
  },
  {
    "fen": "r7/bp6/4kNQ1/1b2Pp1p/p2R1P1N/P1q2K2/6PP/7R w - - 5 31",
    "solution": [
      "f3f2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1496
  },
  {
    "fen": "8/p4pkp/6p1/3Qb3/5q2/3P3P/P1r2PP1/1R3RK1 w - - 0 33",
    "solution": [
      "d5e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1097
  },
  {
    "fen": "5r2/p3p1kp/1p4p1/4rp2/2P5/3P1Q1P/R3K1P1/2q2BNR w - - 7 32",
    "solution": [
      "e2f2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1156
  },
  {
    "fen": "1r3b2/8/4R3/2p3pp/3k1p2/P1N5/2K2PPP/8 b - - 1 43",
    "solution": [
      "f8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1250
  },
  {
    "fen": "r7/3r1kp1/8/4B2R/7R/p6P/5PP1/2n2K2 w - - 8 33",
    "solution": [
      "h4c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 478
  },
  {
    "fen": "6Qk/pp2B1pp/1q1b4/2pP4/2P1r3/1P5P/P5P1/3R1RK1 b - - 0 28",
    "solution": [
      "h8g8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 741
  },
  {
    "fen": "rn3rk1/1bp2ppp/p3pb2/3q4/3P4/2P5/P1B1NPPP/R1BQ1RK1 w - - 3 14",
    "solution": [
      "d1d3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 516
  },
  {
    "fen": "r1bqkbr1/pp2np1N/2np2pp/4B3/4P3/8/PPP2PPP/RN1QKB1R b KQq - 0 10",
    "solution": [
      "c6e5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1431
  },
  {
    "fen": "r1b1Q1kr/pp1p1p2/5Bnp/1q4p1/5p2/8/PPP3PP/2KR3R b - - 1 20",
    "solution": [
      "g8h7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1316
  },
  {
    "fen": "r1b1kb1r/pp2pppp/1qnp4/6B1/3NP1n1/2N5/PPP2PPP/R2QKB1R w KQkq - 6 8",
    "solution": [
      "d4b3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 794
  },
  {
    "fen": "4kb2/Bp6/p4p2/4p3/8/2PQ2P1/PP3K1r/3R3q w - - 7 29",
    "solution": [
      "f2e3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1253
  },
  {
    "fen": "7q/1r2pQ2/2p5/p1B1P1pB/3P1k2/2p1b3/P1P3P1/7K b - - 1 37",
    "solution": [
      "f4e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 987
  },
  {
    "fen": "r2qkb1r/p5pp/2p1p3/3p1n2/3P4/2P2Q1P/PP4P1/RNB2RK1 b kq - 3 16",
    "solution": [
      "f5h4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1236
  },
  {
    "fen": "r4rk1/1pp2Bp1/pbnp2P1/4p1q1/PP2P1b1/1QPP4/R4PP1/1N2K2R b K - 0 15",
    "solution": [
      "f8f7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 915
  },
  {
    "fen": "r2qnr1k/pppb2pp/2n2b1B/3NN3/8/P5QP/1PP1B1P1/R4RK1 b - - 0 18",
    "solution": [
      "f6e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1439
  },
  {
    "fen": "6N1/1R5p/3pk1p1/6n1/4P1P1/7P/7r/5K2 b - - 14 39",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 600
  },
  {
    "fen": "rnbqk2r/pp3ppp/3b4/2p5/2B2n2/2N2Q2/PP1PN1PP/R1B1K2R b KQkq - 3 9",
    "solution": [
      "f4e2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1283
  },
  {
    "fen": "2r3k1/1Q3ppp/8/8/4B3/2q1P3/r3RPPP/4R1K1 w - - 0 24",
    "solution": [
      "e2a2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 679
  },
  {
    "fen": "R7/8/2p2r1k/P4p1p/3PpP1q/6p1/3B2Qr/6RK w - - 0 43",
    "solution": [
      "g2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 574
  },
  {
    "fen": "r2q1rk1/1b2bpp1/2p1p2p/1pPp4/1P4Q1/P3P2P/1B1N1PP1/R3R1K1 b - - 0 18",
    "solution": [
      "b7c8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "rnbqkb1r/ppppp2p/8/5p1p/2PPP3/8/PP3PP1/RNBQKBN1 b Qkq - 0 6",
    "solution": [
      "f5e4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 413
  },
  {
    "fen": "4r1k1/pp1n1b1p/2pB1rp1/q2nNp2/2pP3Q/8/PPB2PPP/R2KR3 w - - 10 20",
    "solution": [
      "e5f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 757
  },
  {
    "fen": "rnbq2kr/ppp1n3/3p3p/4P1p1/4Pp2/1QP5/PP4PP/RNB2RK1 b - - 1 11",
    "solution": [
      "g8h7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 778
  },
  {
    "fen": "5r2/1p2k1p1/2p3R1/p2pP1R1/3P4/2P5/PP2Kr2/8 w - - 7 39",
    "solution": [
      "e2d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1080
  },
  {
    "fen": "rn1q1knr/p1ppp1bP/1p6/4N2Q/3P4/3B4/PPP2P1P/RNB1K2b b Q - 1 9",
    "solution": [
      "g8f6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 815
  },
  {
    "fen": "r3k2r/pb1p1ppp/1p3nq1/2n5/5Q2/NPP1PN1P/PB2BPP1/R4RK1 w kq - 3 17",
    "solution": [
      "f3e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 556
  },
  {
    "fen": "r1b2rk1/p4pp1/1bp1p2p/4N3/1PPq4/P2B3P/5PP1/R2QK2R w KQ - 1 18",
    "solution": [
      "e5c6"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 1209
  },
  {
    "fen": "2r5/6pk/5p1p/5P2/3P1P1N/bP4P1/P2q3P/1K1R4 w - - 0 41",
    "solution": [
      "d1d2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 456
  },
  {
    "fen": "8/8/3p1k2/R2P3K/5P2/3r2P1/8/8 w - - 1 63",
    "solution": [
      "g3g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 937
  },
  {
    "fen": "5r1k/6rn/2Qp3p/5b2/4p1B1/P7/5qPP/R3R1NK w - - 2 38",
    "solution": [
      "g4f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 925
  },
  {
    "fen": "r1b1k2r/pp1p1ppp/1qn1pB2/8/4P3/5N2/PPPN1bPP/R2QKB1R w KQkq - 0 9",
    "solution": [
      "e1e2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 770
  },
  {
    "fen": "rk2q3/ppb4p/2nN1p2/5Q2/1P1P1B2/5N2/P4PPP/6K1 b - - 0 24",
    "solution": [
      "c7d6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 965
  },
  {
    "fen": "r3kb1r/pR1n1ppp/2p1p3/8/2B2P2/4BR2/q1P3PP/3Q2K1 b kq - 2 14",
    "solution": [
      "a2c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1075
  },
  {
    "fen": "r1b2rk1/pp3ppp/2p2q2/4n2Q/3NB3/1P2P1P1/P4P1P/R4RK1 b - - 3 16",
    "solution": [
      "c8g4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 734
  },
  {
    "fen": "rq3rk1/2p2ppp/4pn2/p2pP3/b7/1PP1P1P1/P1QN1PP1/2KR3R b - - 0 17",
    "solution": [
      "f6d7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 591
  },
  {
    "fen": "8/1Q4pk/P5p1/2p5/8/6bq/8/3R1R1K w - - 2 42",
    "solution": [
      "h1g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 933
  },
  {
    "fen": "r1bk1b1r/p1p3pp/2Qp4/6p1/3p1q2/P2B4/1P3PPP/R2KR3 b - - 0 17",
    "solution": [
      "a8b8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 790
  },
  {
    "fen": "7k/8/3P2rp/1pb1ppq1/8/3Q4/B1P3PP/5R1K w - - 1 30",
    "solution": [
      "d6d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1108
  },
  {
    "fen": "3r4/p1p2pk1/1p3p1p/5P2/2N2bP1/1B5P/PPP5/1K3R2 w - - 4 26",
    "solution": [
      "f1f4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 639
  },
  {
    "fen": "2r1k2r/1p2pp1p/p2p4/4nPp1/3Q4/2q2PB1/P1P3PP/2KR1R2 w k - 0 18",
    "solution": [
      "g3e5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1039
  },
  {
    "fen": "r1bqkbnr/ppppp2p/2n3N1/7Q/4p3/8/PPPP1PPP/RNB1KB1R b KQkq - 0 5",
    "solution": [
      "h7g6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "8/1pN2pk1/p5p1/8/1b6/3n1Q2/PP3nPP/6RK w - - 1 30",
    "solution": [
      "f3f2"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 783
  },
  {
    "fen": "r2q3r/1p3Qpk/2p2n1p/p2n1N1P/3P1P2/2P5/PP1B2P1/2K1R3 b - - 4 25",
    "solution": [
      "d8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1051
  },
  {
    "fen": "2rk1b1r/pQ1bp1pp/3pP3/5q2/2n2N2/7P/PP1B1PP1/R4RK1 b - - 0 21",
    "solution": [
      "c4d2"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1205
  },
  {
    "fen": "3R2k1/4np2/p3b1rp/4B3/7p/5B2/1Pr3P1/4R1K1 b - - 4 38",
    "solution": [
      "g8h7"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 800
  },
  {
    "fen": "8/4kp1R/3bp1P1/3p4/5P2/4r3/2B5/6K1 b - - 0 36",
    "solution": [
      "e7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1336
  },
  {
    "fen": "5Q2/3kp3/1pp4P/8/4p3/pPq1P3/P1P3P1/1K6 w - - 2 37",
    "solution": [
      "b1c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1448
  },
  {
    "fen": "r4rk1/pbp1bp1p/1p2pnp1/3q2N1/3P3Q/3BB3/PPP3PP/R4RK1 w - - 2 14",
    "solution": [
      "f1f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1145
  },
  {
    "fen": "r1q1rbk1/1ppb1pp1/p1n2n1p/8/2PP1B2/P2Q1N1P/2B2PP1/RN3RK1 b - - 4 16",
    "solution": [
      "f6h5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 675
  },
  {
    "fen": "r1b1k1nr/pppp1Npp/4nq2/2b5/2B1P3/8/PPP2PPP/RNBQK2R w KQkq - 1 7",
    "solution": [
      "f7h8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1044
  },
  {
    "fen": "2k4r/pp4p1/2n5/2p1p2p/3pP1nq/3P4/PPPB2P1/R2Q1RK1 w - - 0 19",
    "solution": [
      "d1f3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 904
  },
  {
    "fen": "r2qkb1r/1pp2pp1/p2p3p/3Pp3/1P2Pn2/P2B4/1BPN1P1K/R2Q1Rn1 w kq - 0 15",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 625
  },
  {
    "fen": "2r3k1/4npp1/1r2p1p1/p2p4/1nPP2P1/qP3N1P/P1QN1P2/1K1R3R w - - 1 22",
    "solution": [
      "c2c1"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 888
  },
  {
    "fen": "r4rk1/pp3ppp/2p1bq2/4pn2/4Q3/P2B4/1PP2PPP/2KR2NR b - - 3 16",
    "solution": [
      "f5d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 445
  },
  {
    "fen": "2kr2r1/p4p2/1p5p/2p1Pp1P/2Pp1P1Q/3P1q2/PP6/1K1R2R1 w - - 1 28",
    "solution": [
      "g1g8"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1051
  },
  {
    "fen": "b3RQ2/p1p2ppk/7p/8/8/3P3P/PPP1NP1K/4q1q1 w - - 0 26",
    "solution": [
      "e2g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 874
  },
  {
    "fen": "r3Q1k1/pq3ppp/2p5/2pb2N1/8/6P1/PP1P1P1P/R1B1R1K1 b - - 0 17",
    "solution": [
      "a8e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 437
  },
  {
    "fen": "rqb1kb1r/p2n1p1p/1p1N2p1/1N1p4/3B4/3B2P1/PPP2P1P/R3R1K1 b kq - 1 16",
    "solution": [
      "e8d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 835
  },
  {
    "fen": "8/8/8/2R5/P4pB1/6b1/1P3pK1/4k3 w - - 1 46",
    "solution": [
      "c5c8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 927
  },
  {
    "fen": "r1b5/1p1p1Qkp/p1np1p1N/6q1/P2p4/3B4/1PP2PPP/R5K1 b - - 0 19",
    "solution": [
      "g7h6"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 750
  },
  {
    "fen": "3Q4/7k/6p1/P3BpP1/5P1p/4P2P/2r1K3/7q w - - 9 53",
    "solution": [
      "e2d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 791
  },
  {
    "fen": "r1b1k2r/pp3p2/1qp2p1p/3Pn3/N7/5P2/PPP2bPP/1R1QKBNR w Kkq - 3 12",
    "solution": [
      "e1e2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 753
  },
  {
    "fen": "2kr4/1bq2pQ1/p3p3/2pp4/6R1/2P4r/P1P1BP1P/1R4K1 w - - 0 21",
    "solution": [
      "e2f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 695
  },
  {
    "fen": "4r2k/p6p/1p4pP/2p1Q3/2Pp1R2/6PK/P1P5/8 b - - 6 41",
    "solution": [
      "e8e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 490
  },
  {
    "fen": "7k/pp3Qpp/2bq1p2/8/3r4/8/PP4PP/2K1R3 b - - 3 26",
    "solution": [
      "d6d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1436
  },
  {
    "fen": "5qr1/3R1Qbk/p5p1/1p5R/2p4P/P7/1PP3P1/7K b - - 0 38",
    "solution": [
      "g6h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1117
  },
  {
    "fen": "1r5r/5pp1/1p1Qp1k1/p2p4/P2P2q1/1RP5/1P3PP1/4RK2 w - - 0 34",
    "solution": [
      "d6g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1038
  },
  {
    "fen": "rr2k3/2p2PQ1/2n5/2n1p1p1/2Pp4/p2P4/P4PK1/8 b - - 0 39",
    "solution": [
      "e8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1211
  },
  {
    "fen": "4r2k/pb1Q1npp/1p6/8/8/5P2/P5PP/6K1 b - - 0 25",
    "solution": [
      "f7d8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 465
  },
  {
    "fen": "6k1/1p6/3p1n1q/1P1PpQ2/P3P1p1/3Bb1P1/2N5/6K1 w - - 1 50",
    "solution": [
      "g1g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 955
  },
  {
    "fen": "rn3b1r/pp2pkp1/2pq1n2/3p4/3P1NpP/3Q4/PPP2P2/RNB1K2R b KQ - 3 11",
    "solution": [
      "g7g5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 884
  },
  {
    "fen": "r2qkbnr/pp1bnppp/3p4/1Np5/Q3P3/2PB4/PP3PPP/RNB1K2R b KQkq - 1 9",
    "solution": [
      "a7a6"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1023
  },
  {
    "fen": "r4rBk/ppp2pp1/2nqp3/3p4/3P2b1/2P1PNP1/PPQn1PP1/R3K2R b KQ - 2 14",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 835
  },
  {
    "fen": "6r1/pp6/2bBRnk1/5p1p/P2N2q1/3Q4/2P2PPP/R5K1 w - - 4 36",
    "solution": [
      "h2h3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 992
  },
  {
    "fen": "r2q1rk1/4nppp/p2p1P2/2pNb3/1p2P1Q1/3B3P/P1P3P1/1R3R1K b - - 0 22",
    "solution": [
      "e7d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1445
  },
  {
    "fen": "r1bq1k1r/pppp2p1/2n2n1p/2b3BB/4P3/1Qp2N2/P4PPP/RN3RK1 b - - 1 11",
    "solution": [
      "h6g5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 667
  },
  {
    "fen": "6rk/1p4p1/p4pQ1/8/P4q2/2P3RP/6PK/8 b - - 2 41",
    "solution": [
      "g8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 755
  },
  {
    "fen": "8/1R3pk1/4q1p1/2Pp2p1/4n3/8/1Q5P/5K2 b - - 5 41",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1316
  },
  {
    "fen": "8/8/3p4/2pPbQ2/P5Pk/1P5P/3q4/5B1K w - - 5 38",
    "solution": [
      "f5f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1076
  },
  {
    "fen": "rr6/Q4Rp1/k3p2q/2Bp4/P6p/7P/2P3P1/6K1 b - - 0 27",
    "solution": [
      "a8a7"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 719
  },
  {
    "fen": "1n4k1/6p1/p5r1/1p2Qp1q/8/1P2P3/P4P1P/R1B2RK1 w - - 1 25",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 871
  },
  {
    "fen": "2kr3r/ppp2p2/3bb2p/1P4p1/P1PpNq2/3P1B2/5PPP/R2Q1RK1 w - - 2 18",
    "solution": [
      "a4a5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 600
  },
  {
    "fen": "r1b2rk1/pppp1ppp/2n2q1n/2b1P1N1/2Bp4/3Q4/PPP2PPP/RNB2RK1 b - - 0 8",
    "solution": [
      "c6e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1093
  },
  {
    "fen": "2r3k1/q5pp/4Qp2/8/1Ppb4/5PPP/7K/4BB2 b - - 0 39",
    "solution": [
      "g8h8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1074
  },
  {
    "fen": "r1bqk1nr/pppp3p/2n2pp1/3Q4/2BBP3/8/PPP2PPP/RN2K2R b KQkq - 1 9",
    "solution": [
      "c6b4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 949
  },
  {
    "fen": "7k/p5b1/1p2p1p1/2q1P3/3r4/3B4/P3Q1P1/3R3K w - - 1 28",
    "solution": [
      "d3g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1135
  },
  {
    "fen": "2R1Q3/3r2p1/5p1p/3bp1k1/4q3/6BP/5PPK/8 w - - 10 39",
    "solution": [
      "e8d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 939
  },
  {
    "fen": "1r1q1rk1/1bp1npp1/1p1p1n1p/p2P4/2PQN3/1P4P1/PB3PBP/R4RK1 b - - 1 15",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 762
  },
  {
    "fen": "2krr3/1pp3p1/p4p2/5P2/5P1B/7P/PPQp2R1/1R1KqB2 w - - 3 30",
    "solution": [
      "h4e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 406
  },
  {
    "fen": "r3r1k1/pb1n1pp1/4p2p/1ppq4/3P2nP/2P3P1/PPBB2PN/R1Q2RK1 w - - 0 18",
    "solution": [
      "h2g4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 630
  },
  {
    "fen": "4r1k1/1b3ppp/8/7Q/4qP2/1P1r3P/P5P1/R3BB1K w - - 0 32",
    "solution": [
      "f1d3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1206
  },
  {
    "fen": "2n2r1k/p1q4p/2P2bp1/2Q1N3/3P4/7P/P4PP1/5RK1 b - - 1 24",
    "solution": [
      "f6e5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 693
  },
  {
    "fen": "r1bq1rk1/ppp3p1/7p/4pp1Q/2PPp3/P3P1P1/1PnNKPP1/3R1B1R w - - 0 15",
    "solution": [
      "d4e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1219
  },
  {
    "fen": "5rk1/5pp1/p1r1p1bp/BpnpP3/8/P1P2P2/1P4PP/2KR1B1R w - - 0 21",
    "solution": [
      "a5b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1005
  },
  {
    "fen": "3r2k1/1p3ppp/p1p5/8/3R4/1P4P1/P3RP1P/2K5 b - - 0 28",
    "solution": [
      "d8d4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 643
  },
  {
    "fen": "r3k2r/1bqp1p2/pp2p3/2b3P1/2PnPBp1/2N5/PPB3P1/R2Q1RK1 w kq - 0 16",
    "solution": [
      "f4c7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 985
  },
  {
    "fen": "6k1/R7/6K1/7P/8/6p1/8/7r b - - 3 58",
    "solution": [
      "g3g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1161
  },
  {
    "fen": "2r1k3/pR2R3/6pp/1p4r1/1Pp1P3/5P2/P4K2/2q5 b - - 5 42",
    "solution": [
      "e8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1183
  },
  {
    "fen": "6k1/pp3ppp/2p1b3/8/2PR4/3P2PP/P5BK/4r3 b - - 0 29",
    "solution": [
      "e1e2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 683
  },
  {
    "fen": "5R2/1r4p1/1r2p1p1/2pp2kp/8/3K4/8/6R1 b - - 1 41",
    "solution": [
      "g5h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 739
  },
  {
    "fen": "r2q3k/3b1prQ/2pp1Nn1/ppnPp3/2P1P1P1/2N2P2/PP6/R3KB1R b KQ - 0 20",
    "solution": [
      "g7h7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1136
  },
  {
    "fen": "Q7/6pk/7p/6PP/8/pq6/5PK1/8 b - - 0 39",
    "solution": [
      "a3a2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1275
  },
  {
    "fen": "2r2rk1/1b2bppp/pNq1pn2/1pp5/2PP4/4P3/PB2BPPP/2RQ1RK1 w - - 2 18",
    "solution": [
      "b6c8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 798
  },
  {
    "fen": "3r4/3p3R/3Pk1p1/3NPn2/ppr2P2/3R4/PK6/8 b - - 7 40",
    "solution": [
      "c4d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1617
  },
  {
    "fen": "rn3rk1/1bp2pp1/p3p2p/1p1q4/3PN3/3BP1P1/PPQ2PP1/2R1R1K1 w - - 2 18",
    "solution": [
      "e4c3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 538
  },
  {
    "fen": "r3k2r/ppp2pp1/2p5/2b1q2p/2B1P1n1/2N5/PPPPQPP1/R1B2RK1 w kq - 2 11",
    "solution": [
      "e2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "8/2k5/1b1p1p2/p1PQ1P2/1p1PP3/1P5q/6R1/5R1K w - - 8 39",
    "solution": [
      "g2h2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 731
  },
  {
    "fen": "3rrR1k/8/p4P1p/1p2BB1b/1P3P2/2PP4/p1NK4/8 b - - 1 36",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 815
  },
  {
    "fen": "r1b1k2r/ppp2pp1/2p2n2/2b1N2p/3qP3/2N4P/PPPP1PP1/R1BQK2R w KQkq - 1 8",
    "solution": [
      "e5f3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 955
  },
  {
    "fen": "3rkbnr/pp1b1ppp/2n5/2pBP3/4NP2/5N2/PP4PP/R1B1K2R b KQk - 6 12",
    "solution": [
      "g8e7"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1278
  },
  {
    "fen": "2r3k1/5ppp/2R5/p2B4/1p3P2/1P1b2P1/q2P1P1P/4Q1K1 b - - 0 25",
    "solution": [
      "c8c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 848
  },
  {
    "fen": "8/3Q1pkp/6p1/1p6/4NP2/4q1P1/1p4BP/2r3RK w - - 1 36",
    "solution": [
      "e4g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 599
  },
  {
    "fen": "r1b1kb1r/pppnqppp/2n5/4P1B1/2Bp4/1Q3N2/PP3PPP/RN3RK1 b kq - 2 9",
    "solution": [
      "e7b4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1054
  },
  {
    "fen": "3r1rk1/pp3p1p/2npqp2/4pN2/4P3/2P3Q1/P4PPP/R4RK1 b - - 6 17",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "r4r2/pp1n2bk/1q1pp1R1/7p/3PP2P/6R1/PPPQB3/2K5 b - - 2 20",
    "solution": [
      "g7d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1251
  },
  {
    "fen": "2r2rk1/pb3pp1/1p2pn1p/3q4/P1NP4/3BP3/2Q2PPP/R4RK1 w - - 1 18",
    "solution": [
      "c2e2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 697
  },
  {
    "fen": "r2q1bk1/1bpp1p2/p4P1p/1p6/7p/2PQ1N2/PPB2PPP/4R1K1 b - - 0 19",
    "solution": [
      "d8f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 716
  },
  {
    "fen": "r2qkb2/pp1bpp1p/3p4/3Qp3/2B5/2N5/PPP2PrP/2KR3R b q - 1 12",
    "solution": [
      "g2g8"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 520
  },
  {
    "fen": "2kr4/Q6R/2q1p3/1r2Pp2/5P2/2P3Pp/3P3P/1R4K1 w - - 7 38",
    "solution": [
      "b1b5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1295
  },
  {
    "fen": "r2q1bnr/pb2p1p1/nk5p/1p6/3PpB2/1QN5/PPP2PPP/2KR3R b - - 1 15",
    "solution": [
      "a8c8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1597
  },
  {
    "fen": "4rQ1k/6pp/3p4/3P4/8/2P3B1/PP3R2/4qBK1 b - - 2 32",
    "solution": [
      "e8f8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 487
  },
  {
    "fen": "6k1/5ppp/q3p3/p2B4/P4r2/1P4P1/Q6P/4NK2 w - - 0 32",
    "solution": [
      "f1g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 955
  },
  {
    "fen": "rn3rk1/pbp2ppp/1p2p3/3qNnB1/3P4/2PB4/P1P1QPPP/R4RK1 w - - 1 13",
    "solution": [
      "g5f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 628
  },
  {
    "fen": "1r4k1/q4pp1/2Q5/1BK1p1B1/1PP5/6P1/5P2/8 w - - 1 47",
    "solution": [
      "c5d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1523
  },
  {
    "fen": "2R5/8/5Kpk/7p/8/3n4/8/8 b - - 15 66",
    "solution": [
      "d3f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 516
  },
  {
    "fen": "1br2rk1/ppq1nppp/8/5b2/2PP3N/PB1n4/1BQN1PPP/R4RK1 w - - 5 18",
    "solution": [
      "h4f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1113
  },
  {
    "fen": "3q1k2/5p1p/p2p4/4B1r1/Np2bQ2/1P4N1/1Pr5/R4RK1 b - - 0 25",
    "solution": [
      "d6e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 680
  },
  {
    "fen": "rr4k1/1b3ppp/2np1q2/pQ2p3/Pp2P3/3P1N2/1P2BPPP/R4RK1 b - - 7 18",
    "solution": [
      "c6d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 867
  },
  {
    "fen": "r7/pp6/4N3/3p1p2/B5n1/2QP2k1/PPP2q2/R1K1q3 w - - 0 35",
    "solution": [
      "c3e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 408
  },
  {
    "fen": "2k2b1r/1pp2Npp/p3pn2/8/8/6P1/PPP1KP1P/3R4 b - - 0 17",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 721
  },
  {
    "fen": "2k5/p1p2ppp/2R5/8/8/6Pb/PPQ1qb1P/R5K1 w - - 0 22",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1188
  },
  {
    "fen": "4k3/p1p4R/1p2K3/3p1P2/1P6/P1r5/8/8 b - - 1 46",
    "solution": [
      "d5d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 804
  },
  {
    "fen": "r3kbnr/pp3pp1/2p1p3/7q/2P3p1/2N3P1/PP2BP2/R1BQ1RK1 w kq - 1 14",
    "solution": [
      "e2g4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 585
  },
  {
    "fen": "3rR2k/p4ppp/2p5/3p1N2/8/8/P1q2PPP/4R1K1 b - - 1 24",
    "solution": [
      "d8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 621
  },
  {
    "fen": "2r2rk1/pp3p1p/q2p2pP/6P1/2R5/2Q1P3/4KP2/3R1B2 b - - 0 29",
    "solution": [
      "c8c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 788
  },
  {
    "fen": "2kr1br1/1p1q4/B1p1pp2/N2n1bp1/3P3p/1QP4P/PP3PPB/R4RK1 b - - 0 20",
    "solution": [
      "b7a6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1238
  },
  {
    "fen": "r2qr1k1/1p1n2p1/p1p1b2p/3P1p2/8/2B3Q1/PPPN2PP/R4RK1 b - - 0 18",
    "solution": [
      "c6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1266
  },
  {
    "fen": "r3k1r1/2p2p2/p1pp1p2/2b1p2p/4P3/2PP3q/PP1N1P1N/R2Q1RK1 w q - 2 15",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 961
  },
  {
    "fen": "r6k/1pq3pp/p1n5/4Np1b/7Q/1B6/PP3PPP/3R2K1 b - - 0 23",
    "solution": [
      "h5d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1479
  },
  {
    "fen": "1k6/1P2r3/PK6/2N1B3/8/8/8/8 b - - 4 80",
    "solution": [
      "e7e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 448
  },
  {
    "fen": "r4rk1/1p4p1/2pp3p/p1bPp3/2P1Pp2/2N4K/PP2Bq2/R2Q3R w - - 0 26",
    "solution": [
      "d1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1086
  },
  {
    "fen": "6r1/p5rk/1p2p3/2p2p1p/2P1pP2/PP4Pq/4QBNP/5RK1 b - - 1 34",
    "solution": [
      "h5h4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 693
  },
  {
    "fen": "r5k1/6pp/p3N3/3p4/2q1p3/4P1P1/1Q3P1P/6K1 b - - 2 28",
    "solution": [
      "c4c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 745
  },
  {
    "fen": "8/1b5p/p7/6pk/4p3/PP1pP3/6KQ/2q5 b - - 1 55",
    "solution": [
      "h5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1318
  },
  {
    "fen": "2rr2k1/1q1nbppp/3pp3/1p2n3/1P1QPP2/4N1P1/PB2N1KP/2RR4 b - - 0 23",
    "solution": [
      "e5c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 724
  },
  {
    "fen": "8/pp2Npk1/6pp/8/7P/2P3q1/PP1r2B1/RQ3K2 w - - 0 30",
    "solution": [
      "b1e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1178
  },
  {
    "fen": "7k/6R1/p6p/1p1p4/1P4Q1/P1r1q3/4p1PP/4Rr1K w - - 4 43",
    "solution": [
      "e1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1274
  },
  {
    "fen": "3B4/p7/2bk1p1p/3q2pP/2pp2P1/5P2/4QK2/8 b - - 1 36",
    "solution": [
      "d4d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1096
  },
  {
    "fen": "1R6/5pkp/4pNp1/P3P1P1/8/4rn2/1P6/2K5 b - - 2 33",
    "solution": [
      "e3e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 898
  },
  {
    "fen": "r3k2N/ppp3pp/8/2bBp3/7q/3PB3/PPP1b1PP/RN4KR w q - 0 14",
    "solution": [
      "e3c5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 861
  },
  {
    "fen": "3rr2k/5ppp/p4Q2/1p1P3b/3BP3/1B3P2/P3K3/6R1 b - - 0 25",
    "solution": [
      "g7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 865
  },
  {
    "fen": "4r1k1/pp4pp/2pb1p1B/3p4/3P2Q1/1P1N3P/P1P2PP1/4q1K1 w - - 4 30",
    "solution": [
      "d3e1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 537
  },
  {
    "fen": "8/B1p4r/2k1p3/4RpP1/P5p1/1P2R1P1/2PP2K1/7r w - - 1 45",
    "solution": [
      "g2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1097
  },
  {
    "fen": "4r2r/1ppk4/p1b1p1p1/5pq1/P1BP3p/4P2P/2P2PP1/R1Q2RK1 w - - 1 26",
    "solution": [
      "f2f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 687
  },
  {
    "fen": "2Q5/p4r1k/3P3p/7q/P7/2p3p1/6P1/4R1K1 w - - 2 49",
    "solution": [
      "c8c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1076
  },
  {
    "fen": "3rk2r/1p2n2p/p1n2p1b/4p3/4Q3/6BP/PPP2PP1/2K2B1R w k - 2 16",
    "solution": [
      "c1b1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 736
  },
  {
    "fen": "8/1b6/pk2p3/1p1pb3/1P2P3/P1PBK1P1/3R1Prr/1N1R4 w - - 0 35",
    "solution": [
      "f2f4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1272
  },
  {
    "fen": "2rr1k2/5Pp1/2p4p/1pP1N3/1P6/6P1/6KP/5R2 b - - 0 32",
    "solution": [
      "d8d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 975
  },
  {
    "fen": "8/pp5k/1n2p2N/2p3n1/2P4P/1P2R3/Prr5/6RK w - - 1 35",
    "solution": [
      "h4g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 699
  },
  {
    "fen": "r6k/pR5p/2p2N2/4n3/3p4/7P/2q3P1/4R2K b - - 0 32",
    "solution": [
      "c2d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1020
  },
  {
    "fen": "5rk1/5pp1/p2b1q1p/8/2pNQ3/6Pb/PpB2P1P/1R3RK1 b - - 3 25",
    "solution": [
      "h3f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 559
  },
  {
    "fen": "2rR3k/1q3prp/pp2p3/4Qp2/2P5/1P5P/P4PP1/3R2K1 b - - 7 29",
    "solution": [
      "c8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 833
  },
  {
    "fen": "4r1k1/1pr2pp1/4q1np/p2pPN2/b1pP3P/4P1Q1/1P4P1/2R2RK1 b - - 0 28",
    "solution": [
      "g6e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 729
  },
  {
    "fen": "8/1R3pk1/6p1/1p1N2Kp/7P/5P2/1r4P1/8 w - - 7 51",
    "solution": [
      "f3f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 449
  },
  {
    "fen": "6k1/2R4p/6p1/5p2/4nP2/4NK2/r5PP/8 w - - 3 40",
    "solution": [
      "g2g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1006
  },
  {
    "fen": "1Q3k2/1p2qpp1/p1p4p/4P3/PP3PP1/7P/8/6K1 b - - 3 30",
    "solution": [
      "e7d8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1043
  },
  {
    "fen": "5rk1/p2Q4/3p3p/1p1P2p1/3b2P1/6qP/PP1N2N1/5RK1 w - - 1 33",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1599
  },
  {
    "fen": "r1b4r/ppp1nk1p/2pb1Np1/6B1/2B5/5P2/PPP2P1P/R3K1R1 b Q - 4 14",
    "solution": [
      "f7f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1558
  },
  {
    "fen": "6k1/Qr3ppp/3q1n2/1p2p3/4P3/3P1KPP/5PB1/8 w - - 0 27",
    "solution": [
      "a7b7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 739
  },
  {
    "fen": "5N1k/4q1p1/p1p4p/1p1n1Q2/8/7P/5PPK/8 b - - 1 35",
    "solution": [
      "e7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1171
  },
  {
    "fen": "rn2k2r/ppq2pp1/2p1pnp1/8/4N3/P2P1B2/1PP2PP1/R1BQ1RbK w kq - 4 14",
    "solution": [
      "h1g1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 593
  },
  {
    "fen": "8/8/Q6p/2R3pk/5n2/4pN1b/1r5K/8 w - - 2 57",
    "solution": [
      "h2g3"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 817
  },
  {
    "fen": "8/p3kpp1/8/3R1r2/8/4P1Q1/PPr4n/5K1R w - - 8 32",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1210
  },
  {
    "fen": "2r1k2r/pp2bpp1/4p3/P2pP2p/1P1NnP2/2Pq4/3B2PP/R2Q1R1K w k - 1 21",
    "solution": [
      "d2e1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1225
  },
  {
    "fen": "1r1q1rk1/ppp1ppbp/2n3p1/5b2/8/P1N1PNP1/1P1PKPBP/2RQ3R w - - 3 13",
    "solution": [
      "h1e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 889
  },
  {
    "fen": "r3k2r/1bp2ppp/p3pn2/1p1qN3/3P4/3QP3/PPB2PPP/R4RK1 w kq - 0 15",
    "solution": [
      "a1c1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 516
  },
  {
    "fen": "r1bq1rk1/pp2ppb1/3p2p1/6NB/2Pn4/2NQ2P1/PP3PP1/R3K2R b KQ - 1 13",
    "solution": [
      "g6h5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 561
  },
  {
    "fen": "8/1Q4R1/4p1pk/3p4/3Pn3/4P1qP/PP4P1/5rK1 w - - 0 33",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1325
  },
  {
    "fen": "2kr3r/pppq1pp1/5n1p/3P4/2Bb1P2/1QN2P2/P6P/1R3R1K b - - 3 20",
    "solution": [
      "d4c3"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 607
  },
  {
    "fen": "5k2/1bpq1pQ1/p2p1p2/3P1N2/8/5P1P/P7/4K3 b - - 2 31",
    "solution": [
      "f8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 755
  },
  {
    "fen": "1k1r2nr/ppp2ppp/3b4/1P2qb2/Q7/2P1BB2/P3PP1P/RN3RK1 w - - 1 14",
    "solution": [
      "f3g2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 572
  },
  {
    "fen": "rn3rk1/p4pp1/1p5p/2p1q3/4B3/2P2Q2/PP3PPP/R1B3K1 w - - 1 17",
    "solution": [
      "e4a8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 717
  },
  {
    "fen": "1k1Q3r/ppp3p1/2p5/4q2p/8/2N4P/PP4P1/3R3K b - - 5 25",
    "solution": [
      "h8d8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 656
  },
  {
    "fen": "1r2r1k1/pB3ppp/5q2/2p5/1nNp1n2/1P3N1P/P1P2PP1/R2QR1K1 b - - 0 20",
    "solution": [
      "b8b7"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 952
  },
  {
    "fen": "3r1rk1/5p1p/2p2R2/4q1P1/p3p3/P2BQ3/2P3P1/2KR4 w - - 1 27",
    "solution": [
      "d3e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1042
  },
  {
    "fen": "r7/8/7R/6PK/7P/6k1/8/8 w - - 1 54",
    "solution": [
      "g5g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 621
  },
  {
    "fen": "5r2/4k3/2b1p3/1p1pK3/pP1P1pp1/P1P3P1/4B2P/2R5 w - - 0 65",
    "solution": [
      "g3f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 845
  },
  {
    "fen": "r5k1/pp3ppp/2n1r3/8/8/2N1qB2/PPQ3PP/R4K1R w - - 2 20",
    "solution": [
      "a1e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 441
  },
  {
    "fen": "8/4Rpk1/Rp1p1rp1/2p3r1/P1P5/3P4/2P4P/6K1 w - - 1 29",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 598
  },
  {
    "fen": "5Qk1/5pp1/q1p2P2/p1P1P3/6p1/P6r/3R3B/7K b - - 1 39",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 600
  },
  {
    "fen": "7r/1R3k2/6pp/3P1n2/5P2/r7/7P/4RK2 b - - 0 29",
    "solution": [
      "f7g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 928
  },
  {
    "fen": "8/4R3/3p1p2/3P1P2/4P1pk/1r2K3/7P/8 w - - 3 50",
    "solution": [
      "e3f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 675
  },
  {
    "fen": "2r3k1/8/p2p1BpQ/P2q4/2b5/5N1P/1P2r1P1/R6K b - - 0 31",
    "solution": [
      "d5f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 806
  },
  {
    "fen": "k6r/P2r1pp1/2q5/B1b1n3/3p1P2/3P2Pp/2P1Q2P/RR4K1 w - - 0 31",
    "solution": [
      "e2e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 706
  },
  {
    "fen": "r3rnk1/6P1/p7/3p4/8/Q1p5/2P3R1/2K1q1R1 w - - 1 34",
    "solution": [
      "g1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 688
  },
  {
    "fen": "r1b1kb1r/p2n1p2/q1N1P2p/8/Npp1n2P/6B1/PP3PP1/R2QKB1R b KQkq - 0 16",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 951
  },
  {
    "fen": "4r1k1/p7/1p2r2p/3Q2p1/8/2P1q2P/P3K1P1/2R2R2 w - - 0 30",
    "solution": [
      "e2d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1071
  },
  {
    "fen": "4r3/8/P6p/2R2P2/1P3k2/2P5/5r2/2K3R1 w - - 3 48",
    "solution": [
      "g1g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1085
  },
  {
    "fen": "1r1k1bnr/1bppq2p/p4p2/1p4BQ/3p4/1B6/PPPN1PPP/R3R1K1 b - - 5 15",
    "solution": [
      "e7g7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 653
  },
  {
    "fen": "r1b1k1r1/ppp2p1p/2q2B2/2b1Pn2/1PP1K2N/8/P5PP/R2Q1B1R w q - 1 17",
    "solution": [
      "e4f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1378
  },
  {
    "fen": "8/pp2p2k/2n2bN1/8/4p1bP/3r4/5PP1/1RB2K1R w - - 3 24",
    "solution": [
      "g6f4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 446
  },
  {
    "fen": "3r4/R3bp2/4p1k1/4P1p1/1Pp1NnP1/5rK1/2R2P2/8 w - - 0 36",
    "solution": [
      "g3f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 722
  },
  {
    "fen": "2R2bk1/5p1p/3p1p1Q/3P4/7P/q5P1/4R1K1/2n5 b - - 0 43",
    "solution": [
      "c1e2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 585
  },
  {
    "fen": "1k1r4/ppp3Qp/2q5/8/8/3P1P2/PPP1r2P/2KR2R1 w - - 0 18",
    "solution": [
      "g1g2"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 936
  },
  {
    "fen": "r4rk1/pb3p1p/2q2bp1/2p5/N2p4/1P1B4/P1P2PPP/1R1QR1K1 w - - 0 18",
    "solution": [
      "d3c4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 672
  },
  {
    "fen": "kR6/p1p4p/2Pp2p1/1p1r4/1P6/8/P4PPP/4R1K1 b - - 0 30",
    "solution": [
      "a8b8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 529
  },
  {
    "fen": "2r2rk1/1R4pp/p7/2Np4/8/4b3/P1R3PP/3Q1q1K w - - 2 30",
    "solution": [
      "d1f1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 457
  },
  {
    "fen": "6rk/pp2p2p/1n1p1nq1/2pP1R2/3b4/2NQ4/PPPB2PP/5R1K w - - 3 21",
    "solution": [
      "c3e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1121
  },
  {
    "fen": "3rr1k1/p4ppp/1pp5/3bP1q1/8/2PP3P/PP2QBP1/R4RK1 w - - 2 23",
    "solution": [
      "d3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 841
  },
  {
    "fen": "r1b1k2r/1pp2ppp/p1n5/4p1q1/3pP1P1/1NPP3P/PP2NKP1/R2Q1B1R w kq - 0 12",
    "solution": [
      "e2g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 787
  },
  {
    "fen": "r4rk1/p3pp1p/b1p3pQ/3p4/8/2P4R/Pq3PPP/RN4K1 b - - 1 17",
    "solution": [
      "b2a1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 666
  },
  {
    "fen": "r2qr2k/pppb1R2/3p2Qp/8/3Pp3/P1P1P1P1/7P/R5K1 b - - 3 23",
    "solution": [
      "d8g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 998
  },
  {
    "fen": "8/6k1/1n2pr2/1R4Kp/p6P/P7/1P2R3/8 w - - 0 43",
    "solution": [
      "b5b6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 789
  },
  {
    "fen": "r1b1qrk1/pppp1p1p/1b3QpB/4p3/2n1P3/2P2N2/PP3PPP/RN2K2R b KQ - 1 12",
    "solution": [
      "e8e6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 872
  },
  {
    "fen": "3Q4/7p/P7/6pk/8/5pPK/5P1P/8 w - - 2 60",
    "solution": [
      "a6a7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 541
  },
  {
    "fen": "rnq4r/ppN1kppp/4pB2/8/4b3/5Q2/PPP3PP/2KR2NR b - - 0 15",
    "solution": [
      "g7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1510
  },
  {
    "fen": "2kr3r/pp3pQp/2n1b3/1B6/4PB2/2N5/PPP1NbPP/3q1K1n w - - 0 16",
    "solution": [
      "c3d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 934
  },
  {
    "fen": "2rR1Q2/2r2p1k/4bBpp/1p5q/8/8/P4PPP/5RK1 b - - 7 35",
    "solution": [
      "c8d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1091
  },
  {
    "fen": "r4rk1/ppqn1ppp/2pb1p2/8/3Pb1PN/4B2P/PPPQBP2/R4RK1 w - - 5 14",
    "solution": [
      "e2d3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 765
  },
  {
    "fen": "5rk1/pp3p2/3p2p1/2pP4/2P1Pn1p/4RP1q/PP2NQrP/4R2K w - - 2 29",
    "solution": [
      "e2f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 906
  },
  {
    "fen": "r2qk2r/pppb2p1/2n1pbQp/8/8/P1N1BN1P/1PP2PP1/R3K2R b KQq - 3 14",
    "solution": [
      "e8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1125
  },
  {
    "fen": "r4r1k/p5pp/1np2n2/1p3B2/2pPR3/P2q2BQ/5PPP/R5K1 b - - 2 25",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1168
  },
  {
    "fen": "r3kb1r/1bqp1pp1/p3p3/1p5p/3QP1n1/2N1BB1P/PPP2PP1/R4RK1 w kq - 1 13",
    "solution": [
      "a1d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1270
  },
  {
    "fen": "5r2/4r1k1/3p1pbp/1Pp5/2P5/P2PqR1B/4P2p/1R2QK2 w - - 0 32",
    "solution": [
      "h3g2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1323
  },
  {
    "fen": "r1bqk1r1/ppp2p2/1bnp1n1p/4p1pQ/2B1P2N/2PPB2P/PP3PP1/RN3RK1 b q - 1 10",
    "solution": [
      "b6e3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1046
  },
  {
    "fen": "4k3/4bpp1/1p2b3/3pPpr1/1Pq2N2/1Rn5/P1Q2P1P/2B2RK1 w - - 2 30",
    "solution": [
      "g1h1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 829
  },
  {
    "fen": "5r2/pp6/5p1p/3q3k/8/5R2/P5Q1/7K b - - 2 38",
    "solution": [
      "f8g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1252
  },
  {
    "fen": "4k1r1/3rp3/8/1Q3R1p/4pB1P/P1P3PK/1P6/4q3 w - - 3 29",
    "solution": [
      "f5d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1128
  },
  {
    "fen": "r6k/pp1nbBpp/2p5/4q3/6n1/1Q2B3/PP4PP/RN3RK1 w - - 0 17",
    "solution": [
      "e3f2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 774
  },
  {
    "fen": "3q3k/6pp/p7/6N1/4Q3/2N5/Pr5P/7K b - - 1 30",
    "solution": [
      "b2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1283
  },
  {
    "fen": "rn1qkbnr/pp2pp1b/2p1P2p/3p2pQ/3P3N/8/PPP2PPP/RNB1KB1R b KQkq - 1 7",
    "solution": [
      "g8f6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 573
  },
  {
    "fen": "r1b3k1/qp3p2/2pbn2Q/p2p4/P2P3P/1N1B4/1PP2PP1/R5K1 b - - 0 19",
    "solution": [
      "d6f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 975
  },
  {
    "fen": "6k1/p4pp1/2p5/8/PPQ4p/5r1q/3r2P1/3B2RK w - - 0 34",
    "solution": [
      "g2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 859
  },
  {
    "fen": "2kr1bnr/ppp2ppp/3qb3/8/1n6/P1Q2N2/1PP1PPPP/RNB1KB1R w KQ - 3 9",
    "solution": [
      "a3b4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 423
  },
  {
    "fen": "2kr1b1r/1p1n1pp1/p1N1p1b1/2p4p/3PPB1P/1PP2P2/6P1/R3KB1R b KQ - 1 16",
    "solution": [
      "b7c6"
    ],
    "title": "Мат Бодена",
    "theme": "Мат в 1",
    "rating": 931
  },
  {
    "fen": "r2qkbnr/1b1p1ppp/p3p3/n3P3/2p1N3/5N2/PPPPQPPP/R1B2RK1 b kq - 2 10",
    "solution": [
      "g8e7"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "r4rk1/2pn1ppp/2pb4/p2P4/1P1Pp3/P3P1Pq/1BQNbP1P/R3NRK1 w - - 1 17",
    "solution": [
      "d2e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1119
  },
  {
    "fen": "5rk1/2p2pp1/2p1n1rp/p2qP3/3P4/PPP1Q2P/1B4P1/R4R1K w - - 1 28",
    "solution": [
      "b3b4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 743
  },
  {
    "fen": "rnb2rk1/p1p2pP1/3qpb1p/8/3PQ3/3B1N2/PpP2PP1/1K1R3R b - - 1 16",
    "solution": [
      "f6g7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 457
  },
  {
    "fen": "2r4k/pB4p1/1b1B4/1b5p/5P2/6P1/P6P/7K w - - 0 27",
    "solution": [
      "b7c8"
    ],
    "title": "Мат двома слонами",
    "theme": "Мат в 1",
    "rating": 797
  },
  {
    "fen": "5rk1/p2rbppp/1pb1p3/n2q4/3P1B2/2P2N2/PPQ1BPPP/R4RK1 w - - 5 15",
    "solution": [
      "f3e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 422
  },
  {
    "fen": "2r5/p3kp2/4p3/q2pP2p/6p1/NP1b4/PQ3PPP/3R2K1 w - - 0 27",
    "solution": [
      "d1d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 749
  },
  {
    "fen": "r1bq1rk1/ppp2ppp/3p1n2/2nPp3/1bP1P3/2N2P2/PP1B2PP/R2QKBNR w KQ - 1 8",
    "solution": [
      "g1e2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 687
  },
  {
    "fen": "r1b1k1nr/pp2ppbp/2N1q1p1/2p5/8/1P3B2/PBP2P1P/RN1Q1K1R b kq - 5 12",
    "solution": [
      "g7b2"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 434
  },
  {
    "fen": "1r1Rn1rk/2p1P2p/pp4p1/8/1PP2p2/b6P/5BP1/5RK1 b - - 2 29",
    "solution": [
      "e8d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 942
  },
  {
    "fen": "5rk1/pp2rppp/1q6/2b3Q1/8/P1B2BPb/1PR2P1P/R5K1 b - - 6 21",
    "solution": [
      "f8e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 634
  },
  {
    "fen": "5rk1/p4ppp/2p5/2Np3n/P2P3q/2P2P2/1PbQ2PP/4R2K w - - 0 26",
    "solution": [
      "d2c2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1268
  },
  {
    "fen": "2r2rk1/6pp/1q2p3/p1ppP1N1/3P1p1P/2PQ2n1/PP4P1/R1B3K1 b - - 3 23",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 552
  },
  {
    "fen": "r1bq1b1r/ppp1nQpp/2nkpp2/3p1P2/3P4/2NBP3/PPP3PP/R1B1K1NR b KQ - 2 8",
    "solution": [
      "e7f5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1092
  },
  {
    "fen": "1rb2r1k/p6p/1p6/2p4Q/2PpB3/3Pn3/PP2R1PP/4RqK1 w - - 3 28",
    "solution": [
      "e1f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 891
  },
  {
    "fen": "r1b2k1r/1p2q1p1/p1nBpnQp/3p1pN1/3P4/P1P5/4BPPP/R4RK1 b - - 7 17",
    "solution": [
      "e7d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1282
  },
  {
    "fen": "r2qr1k1/pb2np1Q/1p3b2/2p3N1/8/P2P2P1/1P2PPBP/R4RK1 b - - 1 18",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1061
  },
  {
    "fen": "2kr3r/ppp2p2/2pbb2p/6p1/3N1q2/2NP3P/PPP1QPP1/R4RK1 w - - 2 15",
    "solution": [
      "d4e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 791
  },
  {
    "fen": "r4rk1/p1pqnppp/2p1P3/3p4/N2Qp1b1/1P2P3/PBP2PPP/R4RK1 b - - 0 14",
    "solution": [
      "d7e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 506
  },
  {
    "fen": "3rr1n1/3q3k/2p4p/1p3p1Q/p7/2BP2KP/P1P5/R4R2 b - - 1 29",
    "solution": [
      "g8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1049
  },
  {
    "fen": "r1b2rk1/pppn1p2/3p1q2/6P1/3P4/2PQP3/PP2N1P1/R3K2R b KQ - 0 17",
    "solution": [
      "f6g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 630
  },
  {
    "fen": "7k/p5p1/1p5b/5B1Q/1P3q1p/7P/5PP1/7K b - - 0 38",
    "solution": [
      "a7a5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 714
  },
  {
    "fen": "r4rk1/ppqbppbp/3p1np1/3N4/2PQ4/1P4P1/PB2PPBP/R4RK1 b - - 4 12",
    "solution": [
      "f6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 821
  },
  {
    "fen": "3k1r2/1b3P2/q3p2Q/3pN2P/8/1p2R3/1Pr3B1/2K4R w - - 0 32",
    "solution": [
      "c1b1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 921
  },
  {
    "fen": "8/3nR3/kpq2p2/2p2B2/p1Pp1P2/3N2Pp/PP5P/6K1 w - - 0 33",
    "solution": [
      "f5d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 906
  },
  {
    "fen": "r3k1r1/p6p/2p2p1n/3qp3/Q2p4/N2P1P2/PP3P1P/2R2RK1 w q - 2 16",
    "solution": [
      "g1h1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 611
  },
  {
    "fen": "3r1bk1/1b1p1p1p/p1q1pPp1/1pr5/7Q/1BN1B3/PPP2PPP/R4RK1 w - - 8 19",
    "solution": [
      "e3c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 454
  },
  {
    "fen": "2r3k1/1p4pp/p3b3/4p3/1P6/6P1/2KQB2P/q2R3R w - - 3 25",
    "solution": [
      "c2d3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1665
  },
  {
    "fen": "1rb2r1k/1p2bpp1/p1B1p2p/4q1Nn/2p4P/P1N1B1P1/1PQ2P2/2KR3R b - - 0 17",
    "solution": [
      "b7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1315
  },
  {
    "fen": "2r3k1/1br2p2/pp2pQp1/3qN2p/3P2P1/P6R/1P3P1P/4R1K1 w - - 0 28",
    "solution": [
      "g4h5"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1120
  },
  {
    "fen": "6k1/1p3pp1/p1pQ3p/8/2P1nnq1/1P3NN1/1P4PP/6K1 w - - 1 29",
    "solution": [
      "g3e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1061
  },
  {
    "fen": "r2qr1Qk/ppp3pp/2n5/4N3/3P4/2P5/P4PPP/R3K2R b KQ - 2 16",
    "solution": [
      "e8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 906
  },
  {
    "fen": "8/5p2/2N1p3/2p3p1/4kbQp/8/P1rq2PP/5R1K b - - 9 32",
    "solution": [
      "f7f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1100
  },
  {
    "fen": "4r3/p4kpp/1pn5/P1pq1nN1/8/2B2P2/6P1/R3Q1K1 b - - 4 34",
    "solution": [
      "f7g8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 549
  },
  {
    "fen": "2R5/5pkp/1p5q/p5p1/8/Q4B2/PP3PPK/4r3 w - - 1 35",
    "solution": [
      "h2g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 895
  },
  {
    "fen": "r2qkb1r/pp2np1p/2npp1b1/2p3p1/2B1P1N1/3P1P1P/PPPN2P1/R1B1QRK1 b kq - 2 11",
    "solution": [
      "h7h5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 738
  },
  {
    "fen": "1rb2rk1/1pN2pp1/pn2p2p/3pq3/1P6/P3P3/2Q2PPP/1BR1K2R b K - 5 18",
    "solution": [
      "b6c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 874
  },
  {
    "fen": "1r3r1k/1b5p/p1qbBnp1/4pNB1/3p4/7Q/PP3PPP/R4RK1 w - - 12 24",
    "solution": [
      "h3h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 838
  },
  {
    "fen": "2r1Q2k/2rP2pp/1q3p2/8/1p6/1B4PP/P4bK1/2RR4 b - - 1 38",
    "solution": [
      "c8e8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 832
  },
  {
    "fen": "r1bqkr2/4npQN/1pn1p1p1/p1p5/4P3/P1PP4/B1P2PPP/R3K2R b KQq - 6 17",
    "solution": [
      "f8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1128
  },
  {
    "fen": "1r6/5pBp/p7/1p6/4p1Pk/7P/bPP1B1K1/8 b - - 0 26",
    "solution": [
      "a2d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 752
  },
  {
    "fen": "r4rk1/ppp1q1p1/3p1pQn/3P2p1/3P2R1/3B3P/PP3PP1/R5K1 b - - 7 20",
    "solution": [
      "e7f7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 829
  },
  {
    "fen": "r4r2/2p2pp1/2p2q2/p1bn1b2/3k4/6QP/PPP2P2/R1BR2K1 b - - 5 21",
    "solution": [
      "d4c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1399
  },
  {
    "fen": "8/B2kbp1b/1Q1p1P2/1p6/1p2p1r1/2r5/P1P5/R4RK1 w - - 0 30",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1256
  },
  {
    "fen": "3Q1nk1/5p2/3Bp2p/2Pp2p1/P2P4/2N1P1qn/6P1/1R4K1 w - - 0 32",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 829
  },
  {
    "fen": "1qr1k3/1p4rp/p1n1Q3/8/8/P5P1/1P3PP1/2RR2K1 b - - 0 23",
    "solution": [
      "g7e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 997
  },
  {
    "fen": "r5k1/5p1p/p5p1/8/2Q5/1P4Nn/P5PP/R5qK w - - 8 30",
    "solution": [
      "a1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 938
  },
  {
    "fen": "2k5/2p4p/p1n5/5pp1/2N5/1R1r3P/1p3PPB/6K1 w - - 0 32",
    "solution": [
      "b3b2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 733
  },
  {
    "fen": "r4rk1/p2q3p/2p1Bpn1/1p5Q/8/2PP1P1R/PP3P1P/R6K b - - 0 27",
    "solution": [
      "d7e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 533
  },
  {
    "fen": "3r1rk1/1p1bqpp1/p3p2p/8/3PQ3/3B4/PP3PPP/3RR1K1 b - - 2 18",
    "solution": [
      "d7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 518
  },
  {
    "fen": "2q4k/2b3p1/R6p/p2Q4/Pp3pP1/1B5P/1P6/6K1 b - - 0 35",
    "solution": [
      "c8a6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 944
  },
  {
    "fen": "2rr2k1/1p3pp1/p3p2p/4q3/4p1Q1/P1P3RP/1P3PP1/4R1K1 b - - 3 28",
    "solution": [
      "e5f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1275
  },
  {
    "fen": "r2q2rk/pp3p1p/3p4/3Pn2Q/4P2R/2N5/PP4PP/6K1 b - - 2 22",
    "solution": [
      "d8g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 736
  },
  {
    "fen": "b1r3k1/3Rbppp/p1q1p3/1p6/8/1P2P2P/PB2QPP1/1B4K1 w - - 1 24",
    "solution": [
      "d7e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1040
  },
  {
    "fen": "4r1k1/1pp2ppp/1b2bn2/3q4/Q2PP3/5N2/4BPPP/B4RK1 b - - 0 17",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 592
  },
  {
    "fen": "3rr1k1/p6p/5Q2/q1p1Pp2/4b3/1PP1R3/P6P/R5K1 b - - 6 29",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1409
  },
  {
    "fen": "2b3k1/6p1/p1p1p2p/4QpqN/6P1/P4P1P/1P1r4/R5K1 b - - 0 32",
    "solution": [
      "g5h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1302
  },
  {
    "fen": "5k2/pp4p1/6b1/3B4/1P1P1b2/Pr6/8/2KR3R w - - 1 33",
    "solution": [
      "d1d2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1560
  },
  {
    "fen": "5rk1/4ppb1/p2p3p/3P1Q2/1p1q1P2/3P4/PP4PP/1K1RR3 w - - 1 22",
    "solution": [
      "e1e4"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "4Q3/6k1/8/p4Bp1/P2PQ3/4P3/5qK1/4b3 w - - 5 50",
    "solution": [
      "g2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1159
  },
  {
    "fen": "2kr3r/Bppnqpbp/3p1np1/3P4/4P3/2PQ1B2/PPK3R1/RN6 b - - 0 16",
    "solution": [
      "b7b6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1253
  },
  {
    "fen": "8/p1pb4/5k2/6q1/3P4/2P2BK1/P5R1/6R1 w - - 4 38",
    "solution": [
      "g3h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1041
  },
  {
    "fen": "2r3k1/p2p1ppp/b3p3/3pP3/8/1P4R1/q4PPP/Q5K1 w - - 0 22",
    "solution": [
      "a1a2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 497
  },
  {
    "fen": "r5k1/pb1p1r1p/1p2p3/2p1B3/5p1q/1P1P2N1/P1P1BQPP/5R1K b - - 1 19",
    "solution": [
      "f4g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 733
  },
  {
    "fen": "2r1nrk1/4qPp1/p1p3b1/np4NQ/8/7P/PP3PP1/R1B1R1K1 b - - 0 21",
    "solution": [
      "g6f7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 913
  },
  {
    "fen": "3r2k1/p1q2ppp/1p6/1Q1R4/2p3n1/2P1PN2/PP3PP1/6K1 b - - 0 22",
    "solution": [
      "d8d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 548
  },
  {
    "fen": "2b2rQk/3p2pp/p5nN/p1P5/1P5q/P4p2/5PPP/3R1RK1 b - - 5 30",
    "solution": [
      "f8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 942
  },
  {
    "fen": "4r1k1/6pp/2Q5/2Kp4/3Pp3/1N2Pq2/P3R3/8 b - - 0 33",
    "solution": [
      "f3e2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1059
  },
  {
    "fen": "3r4/5k1p/2p1p3/1p3p2/3r3P/1P2K3/2PN1PP1/2R4R w - - 2 32",
    "solution": [
      "d2f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1184
  },
  {
    "fen": "r2q1rk1/ppp2ppp/2nb4/3b1Q2/2NP4/2PBP3/PP4PP/R3K2R b KQ - 1 14",
    "solution": [
      "d5c4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 700
  },
  {
    "fen": "2rqr1k1/1b3ppQ/p1p2b1p/1pn5/3P4/5N2/PP3PPP/1BR1R1K1 b - - 1 18",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 796
  },
  {
    "fen": "1R5R/3kpr1p/3p4/3P1P2/2n1P3/2r5/5N2/1K6 b - - 5 44",
    "solution": [
      "f7g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1549
  },
  {
    "fen": "2rq1rk1/1b2bpp1/1np1pB1p/pp6/3P4/2NQPN2/PP3PPP/1BR2RK1 b - - 0 15",
    "solution": [
      "e7f6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 691
  },
  {
    "fen": "7k/4RN1P/1r6/6K1/8/8/8/1q6 b - - 1 56",
    "solution": [
      "h8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1707
  },
  {
    "fen": "8/1p3ppk/p3p3/4bq2/2P5/4B1pb/PPRQ1P1P/6KB w - - 0 27",
    "solution": [
      "f2g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 872
  },
  {
    "fen": "rr4k1/5pp1/7p/3p4/8/5P2/pRB2PKP/B7 b - - 5 37",
    "solution": [
      "a8a3"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 522
  },
  {
    "fen": "1R6/5Ppk/6p1/3b4/p3q3/6QP/6rK/8 w - - 0 42",
    "solution": [
      "g3g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 561
  },
  {
    "fen": "r2q1rk1/pp3ppp/2pbpB2/8/4Q3/1P1B3P/P1PP1PP1/R3K2R b KQ - 0 13",
    "solution": [
      "d8f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 731
  },
  {
    "fen": "3n2rk/pp4p1/3qp1Qp/5r2/2p3N1/1P5P/PB3PP1/5RK1 b - - 5 30",
    "solution": [
      "f5g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1585
  },
  {
    "fen": "r4rk1/ppp3pp/2n5/1B1p4/3P3n/2P1q1Pb/PP1N3P/R1BQ1R1K w - - 3 19",
    "solution": [
      "d2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1509
  },
  {
    "fen": "6k1/P1p2ppp/4p3/8/2n5/7P/1r4P1/3RK3 b - - 0 36",
    "solution": [
      "b2a2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 613
  },
  {
    "fen": "rn1qbr1k/1pp5/p2p3p/2bP4/2B2p1P/P2P1P2/1PP2PQ1/R3K1R1 b Q - 1 21",
    "solution": [
      "f8g8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 663
  },
  {
    "fen": "2kr3r/p1p1bp2/1pnp4/4p3/1PPPn1p1/P1NQP1Pp/1B3q1P/R4RNK w - - 0 20",
    "solution": [
      "f1f2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 531
  },
  {
    "fen": "r6k/1bp1n1q1/p2p1Q2/1p6/3P4/2P5/P1B2PPP/R3R1K1 w - - 1 25",
    "solution": [
      "f6e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 731
  },
  {
    "fen": "r3k1nr/pb1p1pQp/1p2p2B/2b5/2P1P3/2N5/PP3qPP/R2K1B1R b kq - 1 11",
    "solution": [
      "c5d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1029
  },
  {
    "fen": "4rrk1/pp3pp1/2np3p/q2p1QNP/8/PPp1P3/2P2PP1/R2K3R b - - 1 18",
    "solution": [
      "e8e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 881
  },
  {
    "fen": "2kr3r/pppB1pb1/4p2p/4n1p1/2QP4/6Bq/PPP2P1P/2KR2R1 b - - 0 16",
    "solution": [
      "e5d7"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 429
  },
  {
    "fen": "6k1/p4p2/P3p2Q/1p4P1/6q1/1KP5/1P6/8 w - - 0 46",
    "solution": [
      "h6f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1025
  },
  {
    "fen": "4B3/2R1b2p/4pkp1/5p2/1P3P2/r7/6PP/5K2 b - - 2 35",
    "solution": [
      "e7b4"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 832
  },
  {
    "fen": "1b3r1k/p5p1/4Q2p/3p2p1/5q2/5P2/P6P/4RR1K w - - 1 27",
    "solution": [
      "e6d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 991
  },
  {
    "fen": "2kr2r1/Bppq4/R2p3p/4p3/5b2/2PQ3P/2P2PP1/5RK1 b - - 0 31",
    "solution": [
      "b7a6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 769
  },
  {
    "fen": "r1b1r3/ppp2p2/3pk3/4n1B1/8/2N4Q/Pq4PK/5R2 b - - 9 28",
    "solution": [
      "f7f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1060
  },
  {
    "fen": "4rk2/ppp2p1p/2qp4/8/8/3K4/PPPP1Q1P/R1B3N1 w - - 0 17",
    "solution": [
      "c2c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1261
  },
  {
    "fen": "5r2/p7/3bk3/1Q2p3/4P3/2P3Pp/q3N2P/1R5K w - - 1 32",
    "solution": [
      "e2g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 997
  },
  {
    "fen": "4Rk2/4p2p/1p4pP/2p4q/2Q4b/8/8/3R1K2 b - - 0 37",
    "solution": [
      "f8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 984
  },
  {
    "fen": "r1bqr1k1/1p1n1p2/p1n1p2Q/2bpP2P/6P1/2NB1N2/PPP2P2/R4RK1 b - - 0 15",
    "solution": [
      "c5f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 834
  },
  {
    "fen": "r1b1k2r/pp5p/2nQ2p1/q4pN1/4p3/1B2P3/Pb1P1PPP/RN2K2R b KQkq - 1 17",
    "solution": [
      "b2a1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1142
  },
  {
    "fen": "r3k2r/ppp1qpp1/1bnp4/4pN1b/2B1P1n1/1QPP3P/PP1N2P1/R1B1RK2 w kq - 2 14",
    "solution": [
      "f5e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1218
  },
  {
    "fen": "rn1qkbnr/pp2pppp/2p5/4N3/2BP2b1/8/PPP3PP/RNBQK2R b KQkq - 2 6",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1003
  },
  {
    "fen": "6rk/7p/p4pqR/1p6/2p1p2Q/2Pr2P1/5PK1/1B6 b - - 1 45",
    "solution": [
      "g6g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 928
  },
  {
    "fen": "3r1k2/pb2rpq1/4p3/1P1n4/4B3/Q7/5PPP/3RR1K1 b - - 2 30",
    "solution": [
      "d5f4"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 915
  },
  {
    "fen": "r1b1k2r/ppqp1ppp/2p5/8/Bb1pP1n1/3P1N2/PPP2PPP/R1BQ1RK1 w kq - 8 10",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 818
  },
  {
    "fen": "3r4/2p4R/1p3p2/p1b1pNk1/6P1/1PP2PK1/P7/8 b - - 2 36",
    "solution": [
      "d8d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1736
  },
  {
    "fen": "2b1k1nr/3n1ppp/1q1Qp3/8/1B2P3/8/1PP2PPP/3K1B1R b k - 0 18",
    "solution": [
      "g8f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 868
  },
  {
    "fen": "r1b3k1/2p1qppp/p2b1n2/1p4B1/3P4/1BP4P/PP3PP1/RN1Q2K1 w - - 2 16",
    "solution": [
      "d1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 515
  },
  {
    "fen": "r3k2r/1bq1bppp/3ppn2/p5B1/1n1QPP2/1NN5/1PP1B1PP/2KR3R w kq - 0 15",
    "solution": [
      "c3b5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 780
  },
  {
    "fen": "rn2R1k1/1q4r1/3p1nQ1/p5N1/1ppP4/2P3P1/PP5P/R5K1 b - - 1 26",
    "solution": [
      "f6e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 972
  },
  {
    "fen": "2r2bk1/p2r1p1p/2b2np1/4B1q1/3P4/2PB4/PP1N1PPP/R2Q1RK1 w - - 7 20",
    "solution": [
      "f2f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 735
  },
  {
    "fen": "r3Q2k/q6p/7B/3P4/P7/1P3P2/KPb3P1/4R3 b - - 10 35",
    "solution": [
      "a8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "8/8/5p1p/5Qp1/8/6Pk/2pq1P1P/6K1 b - - 17 52",
    "solution": [
      "g5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1158
  },
  {
    "fen": "5r1k/1pR5/p5pp/8/4bP2/1Q4P1/P2q3P/2R4K w - - 1 32",
    "solution": [
      "h1g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1093
  },
  {
    "fen": "rn5r/ppp1kB1p/3p4/4P2Q/3q4/2N3p1/PPP4P/R4K1R w - - 0 15",
    "solution": [
      "e5e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1235
  },
  {
    "fen": "r3k2r/3bbpp1/pqN5/3p4/1P3Nn1/2P3pP/P5P1/R1BQK2R w KQkq - 1 21",
    "solution": [
      "c6e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1037
  },
  {
    "fen": "7r/2pR1pkr/1p2p1p1/4P3/1P3PPq/P1P2Q1p/3R2PB/6K1 w - - 13 34",
    "solution": [
      "f3h3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 839
  },
  {
    "fen": "r5k1/6B1/2p2QPp/b1Pp4/p7/P4pPq/1P1R3P/6K1 b - - 2 35",
    "solution": [
      "a5d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1226
  },
  {
    "fen": "r4rk1/ppp3pp/1b1pp2n/4p3/1P1PP3/2P1R3/P5PP/RNBQ1q1K w - - 2 15",
    "solution": [
      "d1f1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1156
  },
  {
    "fen": "r1b2rk1/pp4pp/2pb4/4p3/2P1B2q/8/PP4PP/R1BQR2K w - - 0 18",
    "solution": [
      "d1d6"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 820
  },
  {
    "fen": "r3kb1r/ppp3p1/2nq1np1/3p4/2PPp3/8/PP2BPPP/RNBQ1RK1 w kq - 1 11",
    "solution": [
      "c4c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 656
  },
  {
    "fen": "3r2rk/5p1Q/p4Pp1/3pPb2/2pP2B1/6R1/2q3PP/3R2K1 b - - 0 30",
    "solution": [
      "h8h7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1355
  },
  {
    "fen": "8/4kp2/1b4p1/p1pBP2p/1pK1PP1P/1P4Pb/PB6/8 w - - 6 38",
    "solution": [
      "b2c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1435
  },
  {
    "fen": "r1b1k1nr/ppp2ppp/1bB3q1/4p1B1/4P3/2P2N2/PP3PPP/RN1Q1RK1 b kq - 0 9",
    "solution": [
      "b7c6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 807
  },
  {
    "fen": "8/6pk/4B1rp/p4p2/5P1P/4QP1K/1q6/R6R w - - 7 44",
    "solution": [
      "e6f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 760
  },
  {
    "fen": "r2rb1k1/ppq4p/1np2NpQ/4Pp2/5P2/1P4P1/P5BP/2R2RK1 b - - 1 23",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1618
  },
  {
    "fen": "r2q1rk1/2pnNppb/p1n4p/1p1pP3/3P4/P1NQ3P/1PB2PP1/R1B1R1K1 b - - 0 18",
    "solution": [
      "d8e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 512
  },
  {
    "fen": "5r1k/p4p1p/q3p2Q/8/P7/1rp5/4RPPb/3R1K2 b - - 1 31",
    "solution": [
      "c3c2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 995
  },
  {
    "fen": "8/bp5p/3Nk1p1/p7/1pP1KP1P/r5P1/P1R5/8 w - - 2 42",
    "solution": [
      "d6b5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 767
  },
  {
    "fen": "1r3rk1/QP1n1ppp/R7/8/2p5/3b1P2/1P1B1pPP/2K1qB1R w - - 12 27",
    "solution": [
      "d2e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1000
  },
  {
    "fen": "r2q1r2/1p1nbpk1/2p3p1/p6p/P1BP1Q1P/6P1/1P3P2/R1B2RK1 b - - 2 17",
    "solution": [
      "f8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 875
  },
  {
    "fen": "1r4k1/R4p1p/3p2p1/2p1b3/P7/7P/5PP1/1r1R2K1 w - - 1 28",
    "solution": [
      "d1b1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 511
  },
  {
    "fen": "r2q1rk1/pb1n1ppB/1p2pn2/3p2N1/2PP4/4P3/P1Q2PPP/R1B2RK1 b - - 0 14",
    "solution": [
      "f6h7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1013
  },
  {
    "fen": "5rk1/pppR2p1/7r/3bP3/5Q2/1P3BP1/5P1p/2q4K w - - 9 37",
    "solution": [
      "f4c1"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 956
  },
  {
    "fen": "2rq1rk1/3bbpp1/p3p2p/n2pP3/1p1P4/1P1Q1NN1/P1BR1PPP/R5K1 b - - 5 21",
    "solution": [
      "d7b5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 863
  },
  {
    "fen": "2r2rk1/pb1nqppp/1p2p3/3n4/3P4/P1N5/1PQ1NPPP/1BR2RK1 b - - 1 16",
    "solution": [
      "e7g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 556
  },
  {
    "fen": "5rk1/5p1p/3p2p1/3N1n2/2Q5/1B4qP/PP2r1P1/3R1RbK w - - 4 25",
    "solution": [
      "c4e2"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 940
  },
  {
    "fen": "5r2/k5p1/Rp1Np2r/4Pp1p/1P1n1P2/8/6PP/5RK1 b - - 0 31",
    "solution": [
      "a7a6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 991
  },
  {
    "fen": "7k/1R5p/4Q1p1/8/5q2/1P5P/1P1rK1P1/8 w - - 2 34",
    "solution": [
      "e2e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1500
  },
  {
    "fen": "r2qbrk1/pp3ppp/2p1p3/3nP1b1/4B3/2N2NP1/PPPR1PK1/R6Q b - - 4 18",
    "solution": [
      "g5d2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1365
  },
  {
    "fen": "8/1ppk3R/p1p1p3/4P3/1QPPq3/KP3r2/6r1/8 b - - 7 55",
    "solution": [
      "d7e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1068
  },
  {
    "fen": "r3k1r1/pppq1p2/3p1p1p/8/1PBpP3/P2P4/2P2PK1/R2Q1R2 w q - 1 16",
    "solution": [
      "g2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1044
  },
  {
    "fen": "r1bq1r2/3nn1k1/5pB1/ppp1pPpN/3pP3/P2P4/1PP2NP1/R1Q2RK1 b - - 3 23",
    "solution": [
      "g7h6"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 887
  },
  {
    "fen": "5rk1/3bbppp/pqr1pB2/3p4/2pP4/P3PN1P/1PQ2PP1/1BR2RK1 b - - 0 18",
    "solution": [
      "e7f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 475
  },
  {
    "fen": "1b1rr2k/pp4pp/5p2/8/1PQNp3/P3P2q/1B3P2/R2R2K1 w - - 0 26",
    "solution": [
      "c4f1"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1355
  },
  {
    "fen": "r4rk1/ppb2p1p/2nqppb1/3p4/5PPN/1B1P3P/PPP1N3/R2Q1RK1 w - - 0 16",
    "solution": [
      "f4f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "3rrk2/R4pp1/1p5p/1Np5/2P5/2Pn4/2Q3PP/3RqK2 w - - 2 30",
    "solution": [
      "d1e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 872
  },
  {
    "fen": "r6r/1ppbk3/1b1p4/pP1Ppnq1/P1P1N3/3P2p1/4N1PP/R2Q1R1K w - - 0 24",
    "solution": [
      "e4g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1275
  },
  {
    "fen": "rbb2rk1/1p3pp1/p2q1n1p/3p4/3N3B/3B1Q2/PPP2PPP/R4R1K w - - 1 17",
    "solution": [
      "h4f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 823
  },
  {
    "fen": "8/p7/8/8/8/1P1KpR2/4r3/3k4 b - - 5 53",
    "solution": [
      "e2b2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1599
  },
  {
    "fen": "r1b2rk1/pp6/2p1p3/5p2/2PPp3/3BPPp1/PPQ3P1/3RRK1q w - - 6 22",
    "solution": [
      "f1e2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 972
  },
  {
    "fen": "2k1r3/ppp2pp1/2p5/QP5p/2P4P/3b4/6PR/4r2K w - - 0 31",
    "solution": [
      "a5e1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 622
  },
  {
    "fen": "r2q1rk1/1p2nppp/p7/3pPP1b/2nN4/P1PBB3/2P3QP/R3K1R1 b Q - 4 18",
    "solution": [
      "c4e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 796
  },
  {
    "fen": "r1b4k/p7/1qpQpr1p/1p2n3/2p1B2P/P1N2P2/1P6/2KR4 b - - 3 26",
    "solution": [
      "e5f7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 923
  },
  {
    "fen": "1r1r2k1/pp3pp1/2p4N/5P1Q/3q4/2n5/P4P1P/1R3KR1 b - - 1 26",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 677
  },
  {
    "fen": "r1b2qk1/p4Bpp/1pp2p2/8/3P1b2/1QP2N1P/PP3PP1/4R1K1 b - - 0 18",
    "solution": [
      "f8f7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 999
  },
  {
    "fen": "8/5n2/p3p3/1p6/1Pk3Np/2P5/P2K1P2/8 b - - 1 44",
    "solution": [
      "h4h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1570
  },
  {
    "fen": "r1bqr1k1/pp3ppB/1nn1p2p/4N3/3P4/B1P5/P1Q2PPP/R4RK1 b - - 3 15",
    "solution": [
      "g8h8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1010
  },
  {
    "fen": "r1b2rk1/ppp1q1pp/2nb4/3pN1B1/3P1Pn1/3B3Q/PP4PP/RN3K1R b - - 2 16",
    "solution": [
      "e7g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 868
  },
  {
    "fen": "r1bqr1k1/1p1n1ppB/p1p1pn1p/3p2N1/2PP3P/2P1P3/P1QB1PP1/R3K2R b KQ - 5 12",
    "solution": [
      "g8h8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 715
  },
  {
    "fen": "3r2k1/p2bb1p1/2nq2P1/1p1p1p1Q/2pPpP2/P1P1P3/1P4P1/R1B1K2R b KQ - 0 20",
    "solution": [
      "e7f6"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1490
  },
  {
    "fen": "r6k/p5pp/2Q5/1p1p4/8/8/PqP2PPP/3R2K1 b - - 0 23",
    "solution": [
      "b2a2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 825
  },
  {
    "fen": "4Qnk1/2p2p2/1p1q3p/4B1p1/4P2P/8/PP3PP1/5rK1 w - - 0 26",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1389
  },
  {
    "fen": "b6r/4Q1p1/p3p1k1/2p2p1p/5Rq1/P5BK/1P5P/8 w - - 2 38",
    "solution": [
      "f4g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1180
  },
  {
    "fen": "r2q4/ppp3p1/2nk3r/2p1p3/4P1Q1/2NP2P1/PPP5/R4RK1 b - - 3 18",
    "solution": [
      "d8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 987
  },
  {
    "fen": "4r1k1/1p3bpp/2pp4/1P1N1P2/2P1n3/4q3/1B4QP/5R1K b - - 1 27",
    "solution": [
      "c6d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1100
  },
  {
    "fen": "4r1k1/p4pp1/8/2RKb2Q/q2P4/2R1P3/8/8 w - - 0 41",
    "solution": [
      "d4e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1522
  },
  {
    "fen": "r4rk1/ppp2ppp/1b6/1Nq5/7R/3Q4/PPP3PP/R6K b - - 0 18",
    "solution": [
      "c5e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 831
  },
  {
    "fen": "B4rk1/p1p2ppp/2p5/8/4p2q/4Bb2/PPP3Q1/RN4K1 w - - 4 25",
    "solution": [
      "g2h2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1084
  },
  {
    "fen": "r2r2k1/2R3p1/5pNp/p4N2/Pn2P3/7P/1P4P1/6K1 b - - 3 28",
    "solution": [
      "g8h7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 936
  },
  {
    "fen": "r1b1k2r/ppppqppp/8/4n3/1bP5/1P5P/P2NPPP1/R2QKBNR w KQkq - 3 9",
    "solution": [
      "g1f3"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1429
  },
  {
    "fen": "rnbq1bkr/pppnp1pp/8/7Q/2B5/8/PPPP1PPP/RNB1K2R b KQ - 3 7",
    "solution": [
      "e7e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 811
  },
  {
    "fen": "r1b2r2/pp1p1p2/2n2q1k/3p2p1/5PP1/3B3Q/PPP4P/2KR3R b - - 1 20",
    "solution": [
      "h6g7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 677
  },
  {
    "fen": "r1bq1k1r/p2p1pb1/2B3pp/2p1Pp2/5B1P/2P2N2/PP1Q1PP1/R3K2R b KQ - 0 15",
    "solution": [
      "d7c6"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 550
  },
  {
    "fen": "6k1/5p2/1p4pp/p2Br3/P6n/1QP5/1P3P1P/1R2q1K1 w - - 4 32",
    "solution": [
      "b1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 518
  },
  {
    "fen": "r1b4k/7p/3p1P1P/2pN2p1/1bP2p2/2KB4/r4P2/6RR w - - 0 32",
    "solution": [
      "d5b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1231
  },
  {
    "fen": "8/6p1/1q2p2p/3kP3/1nR4Q/7P/r4PP1/6K1 b - - 0 39",
    "solution": [
      "b4c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1159
  },
  {
    "fen": "1r4k1/3q1pPp/3Pr3/p2B4/P5P1/1p1P3P/1P3Q2/5RK1 b - - 2 28",
    "solution": [
      "d7d6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 610
  },
  {
    "fen": "2k5/2p2R2/2Pp1p2/r3p1p1/8/1P1P4/2PK1P2/8 b - - 5 36",
    "solution": [
      "a5c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 798
  },
  {
    "fen": "5r2/p1pk4/1p2pB2/1q1n2P1/4Q3/2PP4/1P1K1P1P/3R3R w - - 5 31",
    "solution": [
      "h1e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 773
  },
  {
    "fen": "r2qk2r/ppp1nBpp/2np1p2/8/1b2P3/1QN2b2/PP1B1PPP/R4RK1 b kq - 1 11",
    "solution": [
      "e8d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 687
  },
  {
    "fen": "r3k2r/1p1b1pp1/p1p5/1qb1pP2/N3P1Q1/8/PPP3PP/R1B2R1K w kq - 3 17",
    "solution": [
      "a4c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 594
  },
  {
    "fen": "3q3r/2pn1pkn/3p4/1p1Pb1N1/1P4QP/3R2P1/5P2/4R1K1 b - - 5 30",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "r1bq1rk1/1p3ppp/p3p3/3pQ2n/3P2N1/3B4/PPP2PPP/R4RK1 b - - 6 15",
    "solution": [
      "g7g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1117
  },
  {
    "fen": "3r1r1k/1p4pp/p1p5/PbR1N3/1P1P1P2/4Q1P1/3R2KP/1q6 w - - 7 31",
    "solution": [
      "d4d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1109
  },
  {
    "fen": "r1b1k2r/1pp2pp1/p4n1p/4p2P/P1Pp2nR/1P2PqP1/3PNP2/RN1QKB2 w Qkq - 4 16",
    "solution": [
      "e2g1"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 1132
  },
  {
    "fen": "1r4r1/p6p/5Q2/2B3Rk/4PP2/1P5q/P3KP2/8 b - - 2 29",
    "solution": [
      "g8g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1247
  },
  {
    "fen": "r4r1k/1pqbp2n/2p3Q1/p2pN3/P2P3R/1PP1P2P/6P1/R5K1 b - - 4 24",
    "solution": [
      "d7f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1650
  },
  {
    "fen": "3r1rk1/pp1bqpp1/4p2p/4P3/3p4/2PQ2P1/P1B2PP1/3R1RK1 b - - 1 23",
    "solution": [
      "d4c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 664
  },
  {
    "fen": "1r1n3R/8/p2b1q1k/1p1B3P/2pP2Q1/2P3P1/PP3P2/6K1 b - - 1 30",
    "solution": [
      "f6h8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 880
  },
  {
    "fen": "r4rk1/pp2bpp1/2n1p2p/1q6/6PP/1PQ5/PB3P2/3RKN2 b - - 7 21",
    "solution": [
      "b5c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 859
  },
  {
    "fen": "r1bqkbnr/1pp1p1p1/p1n4p/3pNp2/3P1B2/4P3/PPPN1PPP/R2QKB1R b KQkq - 1 6",
    "solution": [
      "g7g5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1125
  },
  {
    "fen": "5k2/ppr1npp1/1q2p3/3pP3/3P3Q/5N2/PP3P1P/1R4K1 b - - 2 23",
    "solution": [
      "e7f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1508
  },
  {
    "fen": "8/1Np1k3/p3pp1p/6p1/P1P4r/1P6/3n1PR1/5BK1 w - - 1 37",
    "solution": [
      "b7c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1092
  },
  {
    "fen": "8/3b3p/3p2pQ/8/2P2P2/3P1Bk1/P6p/1r5K w - - 1 33",
    "solution": [
      "f3d1"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "rnbqrk1Q/pp1n2p1/4p3/2bpP1N1/8/8/PPP2PPP/RNB2RK1 b - - 6 14",
    "solution": [
      "f8e7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 775
  },
  {
    "fen": "r3kb1r/pp3pp1/1qn1P1np/3Q4/6PB/1P3p1P/P4PB1/R4RK1 b kq - 0 18",
    "solution": [
      "f3g2"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 937
  },
  {
    "fen": "r7/p7/bp2NQpk/2p5/3p4/3P4/PPP1K2P/q7 b - - 0 39",
    "solution": [
      "a1c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1733
  },
  {
    "fen": "r5k1/p2r1p1p/1p4R1/3q1N2/8/8/PQ4PP/5R1K b - - 0 32",
    "solution": [
      "f7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1290
  },
  {
    "fen": "rk6/p1R2Q2/2ppN2B/3q4/4K3/6rP/6P1/8 w - - 4 38",
    "solution": [
      "e4f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1355
  },
  {
    "fen": "rnb3rk/pp1q1p1p/2p1pN2/5n2/2BP4/P1P4Q/1P3PPP/R4RK1 b - - 0 18",
    "solution": [
      "d7d8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 615
  },
  {
    "fen": "3r1Q1k/p1n3np/1p2p1p1/2P5/1PPq2P1/P2B4/7P/1R3R1K b - - 6 28",
    "solution": [
      "d8f8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 522
  },
  {
    "fen": "r5k1/1p3p2/p2bpPp1/3p3R/P5Qp/3q3P/3B2P1/5R1K w - - 1 27",
    "solution": [
      "d2h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 486
  },
  {
    "fen": "6k1/4R1p1/8/7P/4b1Q1/5p2/1q4PK/8 w - - 0 54",
    "solution": [
      "g4e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 726
  },
  {
    "fen": "r1b2r2/1pq2p2/p1p2k2/2b5/8/3B2P1/PPPQ2KP/4R3 b - - 1 23",
    "solution": [
      "c5d4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1700
  },
  {
    "fen": "r1b1k2r/p4ppp/4p3/1Bb3B1/4n3/8/PP3PPP/RN1R2K1 b kq - 4 13",
    "solution": [
      "e8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 677
  },
  {
    "fen": "5r1k/3r1p1p/ppnp1R1Q/3q4/P7/1P4P1/2P4P/5RK1 b - - 1 29",
    "solution": [
      "c6e5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1151
  },
  {
    "fen": "4r3/6pp/1n5k/1pp1PP2/5K2/8/8/6R1 b - - 2 68",
    "solution": [
      "c5c4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1745
  },
  {
    "fen": "1q3rk1/p4p2/4pBnQ/3pn3/2pP4/2P5/P4PPP/4R1K1 b - - 1 25",
    "solution": [
      "e5g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1030
  },
  {
    "fen": "r2q1rk1/1pp2ppp/1bn5/p2b4/P2P1p2/2PQ1N1P/1PB2PP1/RN2R1K1 b - - 2 15",
    "solution": [
      "d5f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 634
  },
  {
    "fen": "rnbq3r/ppk1b2p/3pPQp1/PBp2p2/8/2N1B3/1P3PPP/R3K1NR b KQ - 0 16",
    "solution": [
      "e7f6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 741
  },
  {
    "fen": "r1b2rk1/pp3pb1/4p1pp/1P3n2/2q1NP2/2N4Q/1PP3PP/R1B2R1K w - - 0 17",
    "solution": [
      "b2b3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 733
  },
  {
    "fen": "4kb1r/6p1/r3p1P1/1pp5/3p4/1PnP3P/1BP4Q/1qKR1B1R w k - 3 28",
    "solution": [
      "c1d2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 948
  },
  {
    "fen": "Q1b2rk1/3p1p2/p1p4p/1p4p1/8/1BP3Pn/PP4PP/RN2R1qK w - - 8 21",
    "solution": [
      "e1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1019
  },
  {
    "fen": "5rk1/5pp1/p7/1p5R/2qPQ3/7P/6PK/8 b - - 7 46",
    "solution": [
      "b5b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 744
  },
  {
    "fen": "r1b1k1r1/1p1p1ppp/p1nBp3/q3N3/4P2Q/2P5/2P2PPP/2KR3R b q - 5 16",
    "solution": [
      "c6e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 793
  },
  {
    "fen": "6k1/pq5p/5Qp1/2p1Bp2/5P2/7P/3r2b1/6RK w - - 0 35",
    "solution": [
      "g1g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1082
  },
  {
    "fen": "rn3rk1/ppp3p1/4pq1p/8/Q2nB1b1/P1N2NP1/1P3PP1/2R1K2R w K - 0 18",
    "solution": [
      "f3d4"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 415
  },
  {
    "fen": "5r1k/3b1ppp/5N2/6P1/pp3P2/3Q4/qPP1R2P/2K5 b - - 1 30",
    "solution": [
      "d7g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 798
  },
  {
    "fen": "8/6pk/8/1QBq2p1/6Pn/7P/PP3PK1/8 w - - 3 32",
    "solution": [
      "g2f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1432
  },
  {
    "fen": "r1b2rk1/pppp1pp1/1bn4p/7n/2B1P2q/P1NP4/1PPBN1PP/R2Q1R1K w - - 5 13",
    "solution": [
      "e2f4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1230
  },
  {
    "fen": "6rk/R2R2pp/4b3/5p2/B3p3/r7/2P2PPP/6K1 w - - 1 29",
    "solution": [
      "d7e7"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 462
  },
  {
    "fen": "4r1k1/pp2rppp/2p2p2/3q4/3P1n2/2P3NP/PPQ2PP1/R3R1K1 w - - 2 18",
    "solution": [
      "e1e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1151
  },
  {
    "fen": "r1b3k1/1pq2p1p/p1pr1np1/8/1P6/5N1P/PQ3PP1/1BR1R1K1 b - - 1 23",
    "solution": [
      "f6d5"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 901
  },
  {
    "fen": "2kr3r/4q1pp/1Q3p2/3pp3/P7/2R1PP2/3P1P1P/6K1 b - - 0 23",
    "solution": [
      "c8d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1743
  },
  {
    "fen": "5Qk1/p4ppp/8/4Rn2/5P1q/PP5P/2P3P1/4R1K1 b - - 0 28",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 870
  },
  {
    "fen": "1rR3k1/p2Q1pp1/4p2p/3nP3/3pB2P/1q3NP1/1r3P2/4BK1R b - - 3 26",
    "solution": [
      "b8c8"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 618
  },
  {
    "fen": "2kr3r/ppp2pp1/2nb1n2/4q2p/3Np1b1/PP2P3/1BPNBPPP/R2Q1RK1 w - - 2 13",
    "solution": [
      "d4c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1476
  },
  {
    "fen": "1k1B4/ppp4p/2pbQ3/8/5q2/3P1P2/P1PN2PP/R4R1K w - - 4 20",
    "solution": [
      "d8g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 949
  },
  {
    "fen": "r4rk1/pp2bbpp/1qnp1p2/3p2B1/3P3Q/3B1N2/PPPN2PP/4RRK1 b - - 3 15",
    "solution": [
      "f6g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 869
  },
  {
    "fen": "7k/pp3Bqp/n4Q2/8/8/4P3/PP3P1P/4K1R1 b - - 1 27",
    "solution": [
      "g7f6"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 514
  },
  {
    "fen": "r3k3/1p3p1p/p1p1p3/3pPp2/2P1n2P/PP4r1/1BQ1Nq2/R2K2R1 w q - 0 23",
    "solution": [
      "g1g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 929
  },
  {
    "fen": "2r4k/6p1/p3p2p/3pPp2/P4P2/1Q6/2Bq2PP/1R5K w - - 1 34",
    "solution": [
      "c2d1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1465
  },
  {
    "fen": "r3k2r/pp1n1pp1/2pbp3/8/2PPB1Pq/4P3/PP3PP1/R1BQR1K1 w kq - 1 15",
    "solution": [
      "e4f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1348
  },
  {
    "fen": "3r3k/5p1p/p6b/4N2P/3NP3/3Kn3/P1r5/6R1 b - - 4 31",
    "solution": [
      "c2a2"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 806
  },
  {
    "fen": "3r2kr/p1p2ppp/8/8/3Q2bq/8/PPP2NPP/R1B1R1K1 b - - 2 18",
    "solution": [
      "d8d4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 426
  },
  {
    "fen": "r2q1rk1/pp1n1pp1/3b2Q1/4N2R/2Bp4/8/PPP3PP/RN4K1 b - - 0 15",
    "solution": [
      "d7e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1304
  },
  {
    "fen": "r2n1rk1/p1q2Ppp/1n1Np2B/1p6/2pP2Q1/2P3P1/PP3RbP/R5K1 b - - 0 20",
    "solution": [
      "d8f7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 978
  },
  {
    "fen": "r3nrk1/2pq2b1/1p1p2P1/p2Ppb2/2P2pBQ/2P4N/P4P2/2K3RR b - - 0 23",
    "solution": [
      "f5g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1278
  },
  {
    "fen": "r6r/ppp3R1/3pk3/4p2p/3bP3/3P1b2/PP1K1P2/6R1 b - - 2 23",
    "solution": [
      "d4b2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1081
  },
  {
    "fen": "r3bR1k/4N1b1/p2p2Qp/1pp5/2P1P3/3PP2P/1q4P1/5RK1 b - - 7 29",
    "solution": [
      "g7f8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 788
  },
  {
    "fen": "1k1r3r/1pp1qpp1/p2P1n2/2b1p1p1/4B3/1Q5P/PP3PP1/R3R1K1 b - - 0 18",
    "solution": [
      "e7d6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 862
  },
  {
    "fen": "rnb1k2r/pp3ppp/2P5/4p3/2Bq2n1/2NP4/PPP3PP/R1BQ2KR w kq - 1 11",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1132
  },
  {
    "fen": "r2qk2r/1pp3pp/1pp3n1/5bNQ/3P4/4B2P/PP3P2/R4RK1 b kq - 4 18",
    "solution": [
      "e8g8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 575
  },
  {
    "fen": "3k4/6Q1/1p1q3p/pB6/3p4/4r1PP/6PK/8 b - - 1 41",
    "solution": [
      "d6e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 968
  },
  {
    "fen": "r1b2rk1/pp3pp1/2n1pqn1/b2p2Np/3P3P/P1NQ2B1/1PP1BPP1/2KR3R b - - 3 13",
    "solution": [
      "g6f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 594
  },
  {
    "fen": "2r1k2r/pp2pp1p/1q1p1b2/3b4/4P3/8/PPPQ1PPP/1K1R1B1R w k - 0 14",
    "solution": [
      "e4d5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 713
  },
  {
    "fen": "8/8/1R6/1P3p2/5kpp/7P/6PK/1r6 w - - 0 47",
    "solution": [
      "b6b8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1005
  },
  {
    "fen": "rn3r2/1bb2pkp/2pqp1p1/p3N3/Pp1PB3/1P2P3/1BQ2PPP/2R2RK1 w - - 1 19",
    "solution": [
      "e5c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 730
  },
  {
    "fen": "r4rk1/ppnq1ppp/2pb4/5b2/3QpP2/PP2P1P1/1BP1N1BP/R4RK1 b - - 1 14",
    "solution": [
      "d6e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1049
  },
  {
    "fen": "1n5r/Q2nkppp/1p1bp3/1Bp1q3/1P2N3/P7/2PB1PPP/R1K1R3 w - - 3 18",
    "solution": [
      "e4d6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1150
  },
  {
    "fen": "6k1/p4pp1/P1p4p/3n4/8/1PrB3P/2P2KP1/4R3 b - - 5 29",
    "solution": [
      "d5b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 653
  },
  {
    "fen": "3b2r1/6rk/p7/1pPpNR2/6P1/2P4P/PP6/6K1 b - - 2 40",
    "solution": [
      "d8e7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1017
  },
  {
    "fen": "rnb2rk1/pp3p1p/6pB/q7/2p5/4P3/P2NBPPP/Q3K2R b K - 1 15",
    "solution": [
      "f8d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 768
  },
  {
    "fen": "rnb1rQ1k/pp5p/6pB/2p5/2PpP2q/3P2NP/PP4B1/R3NRK1 b - - 2 18",
    "solution": [
      "e8f8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 580
  },
  {
    "fen": "7R/2rp4/2pr2B1/p3R2p/1p4pk/P7/1PP2PKP/8 b - - 0 34",
    "solution": [
      "d6g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 594
  },
  {
    "fen": "5kr1/2R5/5K1p/8/6P1/8/8/8 b - - 4 61",
    "solution": [
      "g8g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1190
  },
  {
    "fen": "2r2rk1/ppqnbppp/3p4/3Pp1N1/8/2PQ1N2/PP3PPP/R4RK1 b - - 2 16",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 608
  },
  {
    "fen": "4q1k1/pp3pp1/2n2n1p/8/2Np4/1P1P1BPb/PBQ2P1P/6K1 w - - 0 22",
    "solution": [
      "c4d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 542
  },
  {
    "fen": "3r1r1k/ppp3pp/4Rn2/8/PqN5/1P5Q/5PPP/4R1K1 w - - 1 24",
    "solution": [
      "c4e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 780
  },
  {
    "fen": "1r1r4/1pq1kRp1/p1pNb2p/4P2Q/8/8/PPP2PPP/3R2K1 b - - 0 23",
    "solution": [
      "e6f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1006
  },
  {
    "fen": "2kr4/Qpp2B2/3q1n2/6B1/6b1/2P3P1/PP5r/R4RK1 w - - 0 21",
    "solution": [
      "g5f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 808
  },
  {
    "fen": "r4rk1/2R3pp/p3pp2/1p1q2n1/3P4/3NP1P1/PP3P1P/3Q1RK1 w - - 2 18",
    "solution": [
      "c7c5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1219
  },
  {
    "fen": "3r2k1/1bqr1pp1/p3p2p/1p2p1bN/4P1QP/2P3R1/PP1p1PP1/3R1BK1 b - - 0 24",
    "solution": [
      "g5f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 721
  },
  {
    "fen": "2k2b1r/1p3ppp/p1n5/B2r1P2/1P2nQ2/8/P1Pp1PPP/R3K2R w KQ - 0 18",
    "solution": [
      "e1d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1372
  },
  {
    "fen": "r5k1/pp3r2/4Q3/3R4/7N/2P3P1/PP3q1P/6K1 w - - 1 34",
    "solution": [
      "g1h1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 655
  },
  {
    "fen": "r2qr1k1/pp2bp1n/7Q/2pp4/8/1PNP1P1P/PP3P2/2KR2R1 b - - 2 17",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "r1b2rk1/pp3ppp/2n1p3/3p2N1/8/qB1QP3/P1P3PP/R4RK1 b - - 1 16",
    "solution": [
      "a3e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 638
  },
  {
    "fen": "r2k3r/p1p1qp1p/1p1p1p2/1B2P3/8/2P2Q2/P1P3PP/1R5K b - - 0 18",
    "solution": [
      "f6e5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 666
  },
  {
    "fen": "8/r7/6R1/5p1p/6k1/8/6PK/8 b - - 0 54",
    "solution": [
      "g4h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 830
  },
  {
    "fen": "1k2q3/1p3p2/1p3R2/p2p4/P2Pb3/1Q4P1/1P6/K7 w - - 0 29",
    "solution": [
      "b3b6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 450
  },
  {
    "fen": "rnbq3r/pppnk3/4p1Bp/3p2p1/3Q4/6B1/PPP2PPP/RN3RK1 b - - 0 13",
    "solution": [
      "b8c6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1234
  },
  {
    "fen": "rn2nrk1/ppqbbppp/4p3/2p1P1N1/2PP3P/2P3P1/P1Q2PB1/R1B2RK1 b - - 2 13",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 656
  },
  {
    "fen": "2kr2r1/1pp2p1p/2qp1p2/Qpb5/4P1b1/3B4/PPP2PPP/R4R1K b - - 3 15",
    "solution": [
      "g4d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 689
  },
  {
    "fen": "8/5kpp/pp1Q1p2/8/P2P2N1/1P3P2/2r1q2r/1R2R2K w - - 0 35",
    "solution": [
      "g4h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1821
  },
  {
    "fen": "r2q1rk1/ppp3b1/3p4/3Pp1Q1/2P1P1n1/2N5/PP3P2/R3K1R1 b Q - 1 18",
    "solution": [
      "g4f2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 883
  },
  {
    "fen": "r6r/pqkn1pp1/1p2pn1p/1B1N1b2/1Q1P4/4P3/PP3PPP/2R1K2R b K - 0 16",
    "solution": [
      "c7d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 932
  },
  {
    "fen": "r1q2rk1/p3n1pp/1pp5/n2pN1N1/8/4P3/PPQ2PPP/3R1K1R b - - 3 18",
    "solution": [
      "c8c7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 776
  },
  {
    "fen": "4rbk1/p3q1pp/2p2p2/1p6/3P1P2/PP2nBPb/1B1Q1K1P/R7 w - - 0 26",
    "solution": [
      "d2e3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 940
  },
  {
    "fen": "5Q2/5p1k/p4P1p/1p2P2P/2p3q1/4n3/PPP3P1/2Kr3R w - - 0 39",
    "solution": [
      "h1d1"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 623
  },
  {
    "fen": "5rk1/1pp3B1/4p3/Pn2N1Q1/1P1qP3/3P2nP/8/1R4K1 w - - 3 32",
    "solution": [
      "g1g2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1218
  },
  {
    "fen": "4rr1k/3q2p1/2p3PQ/p1P4P/1p1BR3/5P2/PP1K4/8 b - - 0 35",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 984
  },
  {
    "fen": "5rk1/P4pp1/7p/8/4P3/6Q1/r3q1PP/R4R1K w - - 2 26",
    "solution": [
      "a1a2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 602
  },
  {
    "fen": "r3k3/ppp3p1/3bp1b1/4q3/4P1Q1/2P5/PP1N2B1/R1B2RKr w q - 1 20",
    "solution": [
      "g2h1"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1347
  },
  {
    "fen": "2k4r/ppp3pp/3bp3/q7/3n4/8/PPP2PPP/R1BQ2K1 w - - 0 15",
    "solution": [
      "d1d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 590
  },
  {
    "fen": "rn4k1/p1p3pp/1p1pp2r/5p1q/2PP4/B1PBPK2/P2Q1P1P/6RR w - - 7 17",
    "solution": [
      "f3g2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1573
  },
  {
    "fen": "5rk1/6p1/2p5/p1Qp4/2b5/P5B1/6PP/4RqK1 w - - 10 37",
    "solution": [
      "e1f1"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 609
  },
  {
    "fen": "2rq1rk1/3n1ppp/p3pn2/1pb5/5B2/2PQ4/PPBN1PPP/R4RK1 b - - 8 15",
    "solution": [
      "f6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 602
  },
  {
    "fen": "r2qkb1r/pp1npppp/2p2n2/4N3/2B3b1/6N1/PPPP1PPP/R1BQK2R b KQkq - 6 7",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 962
  },
  {
    "fen": "6k1/pp6/8/5bN1/1pP2P2/1P5p/Pr1p4/R2K3R w - - 1 39",
    "solution": [
      "g5h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1367
  },
  {
    "fen": "2kr1bnr/1bp2ppp/p2p4/3N4/2QP2q1/4B3/PP1N1P2/R3KR2 b Q - 0 17",
    "solution": [
      "g4e6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1249
  },
  {
    "fen": "r4rk1/ppb2ppp/5n2/2p4q/2B5/1P2Pb2/P3QPPP/R1B2RK1 w - - 0 16",
    "solution": [
      "e2f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1547
  },
  {
    "fen": "8/pp3p2/2p2n1k/3p1QNq/3P1P2/2P3P1/PP1br3/R4K2 b - - 3 30",
    "solution": [
      "f6e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1535
  },
  {
    "fen": "8/3R1k2/pp4rp/b7/4R3/5P1K/8/8 b - - 6 47",
    "solution": [
      "f7g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1193
  },
  {
    "fen": "r5k1/pp4p1/3bp3/3P3p/2P5/PP5n/1B1QB1P1/R5qK w - - 2 26",
    "solution": [
      "a1g1"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 903
  },
  {
    "fen": "r1bqkbnr/pp1np1pp/2p2p2/3p4/3P3B/3BP3/PPP2PPP/RN1QK1NR b KQkq - 1 5",
    "solution": [
      "g7g5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 946
  },
  {
    "fen": "7k/1pq3p1/4R2p/pBP5/1P4R1/P1Q2r1P/5rP1/6K1 w - - 3 33",
    "solution": [
      "g2f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 815
  },
  {
    "fen": "6k1/4b1p1/4q1P1/2p1p2Q/2r4P/5PNK/1r6/R4R2 w - - 3 39",
    "solution": [
      "h5f5"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1229
  },
  {
    "fen": "8/3Q1k1p/q3r3/p5R1/1p6/1P5P/7K/8 b - - 4 49",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1000
  },
  {
    "fen": "r4rk1/1b1nqppp/4p3/pp1p4/2pP4/P1P1PN1P/1PQ2PP1/RB3RK1 b - - 6 18",
    "solution": [
      "b5b4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "r1b1k2r/pp1p1ppp/4n3/3B4/3q4/3n1PP1/3B3P/RN1Q1KNR w kq - 4 15",
    "solution": [
      "b1c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 871
  },
  {
    "fen": "6rk/6qp/5R2/8/8/2P3N1/1P4PP/5R1K w - - 3 44",
    "solution": [
      "g3h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 920
  },
  {
    "fen": "r1bq1rk1/ppp2ppp/3p4/n1bB4/4P3/2Q2N2/PB3PPP/3R1RK1 b - - 4 13",
    "solution": [
      "c7c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1346
  },
  {
    "fen": "2r4k/1p5P/p7/3NRb2/6p1/2K1P3/PP1R1rP1/8 w - - 4 27",
    "solution": [
      "c3d4"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 839
  },
  {
    "fen": "rn3bnr/ppN2p1p/5k2/4Q1p1/3P1Bb1/8/PPP4P/R3KB1q b Q - 1 19",
    "solution": [
      "f6g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1151
  },
  {
    "fen": "3r2k1/5pp1/4p2p/8/4n3/5P2/P1R3PP/2Rr2K1 w - - 1 30",
    "solution": [
      "c1d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 567
  },
  {
    "fen": "8/7R/4pNpP/8/P1r2P2/5kP1/1P6/5K2 w - - 2 43",
    "solution": [
      "h7g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 895
  },
  {
    "fen": "r1b1kb1r/ppp2Npp/2np1q2/4p3/2B1P1n1/2N3P1/PPPP1P1P/R1BQK2R w KQkq - 1 8",
    "solution": [
      "f7h8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1026
  },
  {
    "fen": "2rq1rk1/3b2b1/p1n2n1p/1ppB2N1/5P2/2PQ2PP/PPN5/R1B2RK1 b - - 0 22",
    "solution": [
      "f6d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1207
  },
  {
    "fen": "1r6/8/p2p2p1/2p1q1P1/4P1k1/P5RR/2P3PK/8 b - - 8 37",
    "solution": [
      "g4f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1239
  },
  {
    "fen": "5r1k/2pq1ppp/p1N1b3/3p4/1Q1Pn3/4P2P/PP3PP1/R3K2R b KQ - 0 18",
    "solution": [
      "d7c6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 587
  },
  {
    "fen": "r4rk1/p2p1p2/5BBp/pP6/2P5/4P2q/2Q2PR1/5K2 b - - 0 23",
    "solution": [
      "f7g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 436
  },
  {
    "fen": "r1b2rk1/1pp2pp1/p2bp2p/3P4/3qQ3/P1NB2P1/1PP2PP1/R3K2R b KQ - 2 14",
    "solution": [
      "d4f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 656
  },
  {
    "fen": "2k2r1r/pbpp2q1/1p1bppNp/8/3P4/2PB4/PP1N2PP/R2Q1RK1 w - - 2 16",
    "solution": [
      "g6h8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1166
  },
  {
    "fen": "r1b2rk1/2q2p2/p5p1/1ppp1n1p/3b1P2/P2P3P/BPP3PN/R1BQ1R1K w - - 2 18",
    "solution": [
      "c2c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 858
  },
  {
    "fen": "r4rk1/5pp1/8/1pp1P2p/5Q1P/qN4P1/2P5/1K1R3R w - - 0 28",
    "solution": [
      "f4c1"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1083
  },
  {
    "fen": "4r3/ppR5/3P2pk/3N2p1/2Bb2n1/1P5P/P5P1/1R4K1 w - - 1 32",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1379
  },
  {
    "fen": "8/pb2r2k/2n4p/1p3pp1/2p5/1PP2B2/P4PPP/R1BQq1K1 w - - 1 26",
    "solution": [
      "d1e1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 621
  },
  {
    "fen": "5rk1/pp6/3pp1pp/8/3pPn2/3P2NQ/PPP2qPP/R6K w - - 6 24",
    "solution": [
      "h3h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "r3r1k1/ppp2ppp/2n3q1/8/2BP1n2/2N2N1P/PP1Q1P2/R4RK1 w - - 1 15",
    "solution": [
      "g1h2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 781
  },
  {
    "fen": "r2b3k/1p3p1p/5p1B/p2qn3/3pR1Q1/1N4P1/PPP2P1P/5RK1 b - - 0 26",
    "solution": [
      "e5g4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 617
  },
  {
    "fen": "2rqkb1r/p2np3/3p2p1/3Q2Nn/1PP1P3/5P2/P6P/RN2K2R b KQk - 2 16",
    "solution": [
      "h5f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 655
  },
  {
    "fen": "r2q1rk1/1p2bppp/p1np4/6B1/2P1Q1b1/5N2/PPB2PPP/RN4K1 b - - 0 15",
    "solution": [
      "e7g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 966
  },
  {
    "fen": "r4rk1/1bqn1pp1/p3p2p/1p1pR3/3P4/1PP3P1/P1QN1PP1/1BR3K1 b - - 2 18",
    "solution": [
      "a8c8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 641
  },
  {
    "fen": "r4k1r/pp2Bppp/4nq2/1B6/8/2b3QP/P4PP1/3R1RK1 b - - 0 18",
    "solution": [
      "f8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 2008
  },
  {
    "fen": "b4rk1/pq3pR1/4p2R/1pp1P3/2p5/P3Q1P1/1P2P2P/6K1 b - - 0 31",
    "solution": [
      "g8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 789
  },
  {
    "fen": "r1b1r1k1/ppqn2pP/2nbp3/3pp1N1/3P1B2/2P5/PP2QPP1/R3K2R b KQ - 0 17",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 770
  },
  {
    "fen": "6k1/1q4pp/p3p3/Q3PpN1/1p1P1P2/2r3N1/P4K1P/8 b - - 11 35",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 635
  },
  {
    "fen": "7r/p4p2/1p2k1p1/8/2P2RKP/P3n3/8/7R w - - 0 47",
    "solution": [
      "g4g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1134
  },
  {
    "fen": "8/7p/3p2p1/3Pp3/3qP3/3k3P/6PK/3Q4 b - - 4 46",
    "solution": [
      "d3e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1332
  },
  {
    "fen": "2r2rk1/1b1n1pp1/p3p2p/qp1pP3/8/3BPNP1/PP1KQPP1/3R3R w - - 7 18",
    "solution": [
      "b2b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1468
  },
  {
    "fen": "r4k2/1p1b1pp1/p1n5/6N1/7P/1B6/PP3P2/4R1K1 b - - 0 24",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 908
  },
  {
    "fen": "r1b1kb1r/ppp3pp/2np1p2/4q3/2BNP1nP/8/PPP2PP1/RNBQ1RK1 w kq - 1 10",
    "solution": [
      "d4c6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 744
  },
  {
    "fen": "3rkb1r/1p2npp1/p6p/n1p1Pb2/P4B1P/2P2N2/1P1N1PP1/R1K2B1R w k - 1 14",
    "solution": [
      "d2c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 947
  },
  {
    "fen": "4r1k1/1pp2ppp/p1pb4/8/8/2PqB2Q/PP3PP1/RN3K2 w - - 1 17",
    "solution": [
      "f1g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1231
  },
  {
    "fen": "2r2r1k/7p/p6Q/2q4N/1n6/2pPR1P1/1PP4P/6K1 b - - 4 28",
    "solution": [
      "c8e8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 833
  },
  {
    "fen": "5rk1/p4p2/1p2P3/5p1p/5b2/3Q1P1q/PPR2P2/3R2K1 w - - 1 30",
    "solution": [
      "d3f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 939
  },
  {
    "fen": "r3nrk1/2q1bp2/2p1n2Q/3pPN2/8/2N3P1/P5BP/5RK1 b - - 2 23",
    "solution": [
      "c7e5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 961
  },
  {
    "fen": "8/8/7p/4Q1p1/6qk/6P1/7K/8 b - - 0 65",
    "solution": [
      "h4h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 907
  },
  {
    "fen": "2r3k1/1p3pp1/1r3b1p/2Np1P2/pq1P2PP/3B4/PP3Q2/1K1R3R w - - 2 30",
    "solution": [
      "d3c2"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 961
  },
  {
    "fen": "r1bn1r2/1pp1kB1p/pb2P1p1/5P2/P7/2P5/1P1B2PP/2KR1R2 b - - 0 18",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 879
  },
  {
    "fen": "r1bq1rk1/4bpp1/3p1n1p/p2N1P2/1p1QP3/1P6/PBP3PP/1K1R1B1R b - - 1 15",
    "solution": [
      "f6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 624
  },
  {
    "fen": "Q3k3/1R3p1p/2ppb3/3p4/2qr4/P4pP1/1PP2P1P/1K6 b - - 3 31",
    "solution": [
      "e6c8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 918
  },
  {
    "fen": "8/8/4p1p1/P2pP1k1/3P2pQ/6K1/5PP1/r1q5 b - - 1 48",
    "solution": [
      "g5f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1060
  },
  {
    "fen": "r4k2/p1p2p1B/bp2p3/7p/4Nbnq/5P2/P1Q2P1P/R2R2K1 w - - 3 22",
    "solution": [
      "e4g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1164
  },
  {
    "fen": "2r3r1/1pqk1p1p/p3pPp1/3P4/8/Q7/PP3PPP/2RR2K1 b - - 0 24",
    "solution": [
      "c7c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1659
  },
  {
    "fen": "1r4k1/3bb2P/pq5B/2p1P3/2P3Q1/P2P2P1/2p4P/5RK1 b - - 0 26",
    "solution": [
      "g8h7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 865
  },
  {
    "fen": "6k1/7p/2p3rP/8/1p5R/pP2p3/P1P5/2K5 w - - 0 38",
    "solution": [
      "h4b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1401
  },
  {
    "fen": "rnbqr1k1/ppp2pp1/3p4/b2nP1NQ/3P4/P7/1P1N1PPP/R1B1K2R b KQ - 3 12",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1432
  },
  {
    "fen": "3qrR1k/3r2pp/2p1p2n/1p1pP1N1/pP1P2P1/P1PQN2P/8/6RK b - - 0 40",
    "solution": [
      "e8f8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 793
  },
  {
    "fen": "8/7p/2p5/3q1pQ1/4p3/5kPP/3P1P2/6K1 b - - 2 35",
    "solution": [
      "d5d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1995
  },
  {
    "fen": "8/5k2/7K/R7/p2B2P1/1b6/8/5r2 w - - 3 59",
    "solution": [
      "g4g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 792
  },
  {
    "fen": "2r1Q1k1/1b3ppp/pp6/3q4/1P6/P2P4/5PPP/2R1R1K1 b - - 2 23",
    "solution": [
      "c8e8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 910
  },
  {
    "fen": "rn2qrk1/pppb1p1p/3p1bPQ/8/8/3B4/PPP1NPP1/R3K2R b KQ - 0 16",
    "solution": [
      "f7g6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1134
  },
  {
    "fen": "5r1k/2q2p2/ppp1bN1p/2p1P3/4Q3/8/PPn2PPP/5RK1 b - - 3 29",
    "solution": [
      "f8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 692
  },
  {
    "fen": "r1b1nrk1/pp2p2p/1q1b2p1/3P2N1/8/2N5/PP2B1P1/R1BQ2KR w - - 4 18",
    "solution": [
      "c1e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 724
  },
  {
    "fen": "1R6/8/8/8/6p1/8/r6k/5K2 b - - 3 73",
    "solution": [
      "g4g3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 764
  },
  {
    "fen": "4r1k1/1pp2pp1/3p1q2/p6R/2P3Q1/1P1BP3/1K3P2/8 w - - 1 24",
    "solution": [
      "b2a3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "r1b2Qk1/ppp1q2p/6pB/3Pp2n/8/P1N4P/1PP3P1/5RK1 b - - 5 22",
    "solution": [
      "e7f8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 722
  },
  {
    "fen": "b2r2k1/6Rp/1p2Nn2/4N3/2P1p3/1r6/5K2/8 b - - 0 37",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1065
  },
  {
    "fen": "5k2/R7/5K2/7p/7P/p4P2/8/r7 b - - 1 53",
    "solution": [
      "a3a2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 941
  },
  {
    "fen": "r1br2Qk/2qnb1pp/2p2p1N/p1p5/2P1NP2/2BP4/PP4PP/R4R1K b - - 6 20",
    "solution": [
      "d8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 878
  },
  {
    "fen": "4rQ1k/p5pp/1p5q/n7/3P2nN/2P1r1P1/PP2B2P/R4RK1 b - - 2 22",
    "solution": [
      "e8f8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 713
  },
  {
    "fen": "rn2k3/pp2n3/2p1p2Q/3p1qN1/7P/2N5/PPP2r2/2KR3R w q - 0 18",
    "solution": [
      "g5e6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1080
  },
  {
    "fen": "3r3r/p3k3/2p1n3/1p3P1K/8/3B1R2/P1P4P/R7 w - - 1 29",
    "solution": [
      "h5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1424
  },
  {
    "fen": "6k1/1ppn2p1/3p3p/3Np3/1PP5/6r1/3N3q/1R1QRK2 w - - 1 29",
    "solution": [
      "d2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1270
  },
  {
    "fen": "6k1/p4ppp/2p4q/3p4/3P4/2P2BQ1/Pr3P1p/4R2K b - - 0 27",
    "solution": [
      "h6d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 987
  },
  {
    "fen": "r2R3k/5prp/p3p3/1p6/8/1BQ2q2/PPP2PbP/2KR4 b - - 3 24",
    "solution": [
      "a8d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 756
  },
  {
    "fen": "3r4/R7/8/4R3/1P3p2/3k4/P3p1PP/2r1K3 w - - 2 43",
    "solution": [
      "e1f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1036
  },
  {
    "fen": "Q7/8/p5pp/2p2p1k/2Pb1P2/7K/6r1/8 b - - 0 49",
    "solution": [
      "g2c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 855
  },
  {
    "fen": "4r3/4r1pk/4p3/6R1/2BpR3/pPb5/P5PP/6K1 b - - 0 41",
    "solution": [
      "e6e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1092
  },
  {
    "fen": "6rk/1bq1rpp1/p3pN1Q/1p2P3/3N2R1/2P5/PP4nP/R5K1 b - - 0 26",
    "solution": [
      "g7h6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 512
  },
  {
    "fen": "3rr1k1/ppp1qppp/3b4/3P4/8/P4n1P/1PP2PP1/R1BQR1K1 w - - 0 16",
    "solution": [
      "d1f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 507
  },
  {
    "fen": "5k2/Q6p/1p2p3/1q6/3P4/P1PKP1P1/6P1/R7 w - - 1 34",
    "solution": [
      "d3e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1390
  },
  {
    "fen": "r2qkb1r/pppnpppp/2n5/1B6/3P4/2N2Q1P/PPP3P1/R1B2RK1 b kq - 4 9",
    "solution": [
      "c6d4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 711
  },
  {
    "fen": "r1b1kbnr/ppp1qppp/8/4PnB1/8/5N2/PPP2PPP/RN1Q1RK1 b kq - 4 9",
    "solution": [
      "e7e6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 482
  },
  {
    "fen": "2q3k1/6pp/2p1p2P/1p1r2b1/4R1Q1/8/1PP2PP1/2B3K1 b - - 2 24",
    "solution": [
      "g5c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1128
  },
  {
    "fen": "R7/2p1kp2/1pBp2p1/2bPP2p/3n1P2/3P2P1/5nKP/8 b - - 2 39",
    "solution": [
      "f2d3"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 707
  },
  {
    "fen": "r3qrk1/1pp1bppp/p3bB2/8/7Q/2NB1P1P/PP3P2/2KR3R b - - 0 18",
    "solution": [
      "e7f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 713
  },
  {
    "fen": "8/4q1pk/7p/p2Q1p2/b3p2P/2p5/1K1R1PP1/8 w - - 0 36",
    "solution": [
      "b2c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1515
  },
  {
    "fen": "r2qk2r/ppp3pp/2n1p1p1/3p2B1/3P2n1/4PPb1/PPPNB3/R2Q1KNR w kq - 0 13",
    "solution": [
      "g5d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1078
  },
  {
    "fen": "r4rk1/1bBn2pp/p3p3/5pb1/2BPq3/P3PN1P/5PP1/2RQ1RK1 w - - 1 18",
    "solution": [
      "f3g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 452
  },
  {
    "fen": "r4r2/p1qp1Nb1/npp1p2k/4P1Np/2PPB1PP/8/PP3P2/R4RK1 b - - 3 25",
    "solution": [
      "f8f7"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 665
  },
  {
    "fen": "r1b1r1k1/1q1p1ppp/p2Bp1n1/np2P3/3P4/2PQ4/P1BN1PPP/R4RK1 b - - 3 16",
    "solution": [
      "g6f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 727
  },
  {
    "fen": "r1b4r/1p1p1pp1/p1n1kb1p/4pN2/2P1P3/5N2/PP3PPP/2KR1B1R b - - 0 14",
    "solution": [
      "g7g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1109
  },
  {
    "fen": "r3r1k1/2p2ppp/pp1b3q/n7/3P2Q1/1P2P3/PB2BPPP/2R2RK1 w - - 5 19",
    "solution": [
      "e2d3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 766
  },
  {
    "fen": "3r2r1/p1kpn1Qp/Bpp5/8/4q3/8/PPP2PPP/3RR1K1 w - - 3 18",
    "solution": [
      "g7e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 935
  },
  {
    "fen": "r2kr3/pp1n4/3Q1p1p/3Pn3/2Pq2pP/1B2RpP1/PP6/4RK2 b - - 0 30",
    "solution": [
      "e5c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 700
  },
  {
    "fen": "r3Q2k/pb4p1/1pp4p/5B2/3q1b2/7P/PP2RPP1/4R1K1 b - - 2 25",
    "solution": [
      "a8e8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 562
  },
  {
    "fen": "r7/7R/6PK/5k1P/8/8/8/8 w - - 3 85",
    "solution": [
      "g6g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1118
  },
  {
    "fen": "1k4rr/ppp5/8/3pRn2/3P3p/2P2PqP/PPQ3P1/R5K1 w - - 0 24",
    "solution": [
      "c2f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 810
  },
  {
    "fen": "5k2/p7/1p1Q4/1P1p2p1/P2b2q1/2p4p/2B2P1P/5K2 b - - 3 49",
    "solution": [
      "f8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 969
  },
  {
    "fen": "4r1k1/6b1/p1Q3N1/1p3p1p/2p3nP/P7/5PP1/3Rq1K1 w - - 1 36",
    "solution": [
      "d1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 607
  },
  {
    "fen": "rn2k1r1/pp3p2/2pbp3/7p/3P3q/4BB1P/PPP2PK1/2RQ1R2 w q - 2 21",
    "solution": [
      "g2h1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 682
  },
  {
    "fen": "2k2r2/1pp4Q/p1nrp3/3pNn2/3P4/8/4q1PP/2R2RK1 b - - 4 26",
    "solution": [
      "c6e5"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 974
  },
  {
    "fen": "5r1k/ppp3p1/1bn3Qp/8/1q2B3/2NP2PP/PPP4K/5R2 b - - 6 20",
    "solution": [
      "f8f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1581
  },
  {
    "fen": "4rrk1/pb1nqppp/1p6/3p4/2pPn3/P1P2PB1/1PQ1N1PP/RB3RK1 b - - 0 18",
    "solution": [
      "e4g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1582
  },
  {
    "fen": "8/8/8/8/P1p2K2/2Q5/1r1r4/2k5 b - - 3 52",
    "solution": [
      "d2c2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1102
  },
  {
    "fen": "1r1r2k1/1p3ppp/pN1p4/1P4q1/P1PQ4/4Pn1b/1B3PPK/R4R2 w - - 0 22",
    "solution": [
      "g2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 871
  },
  {
    "fen": "r3R1kr/pp1Q2pp/8/6q1/5N2/P7/1PP2PPP/6K1 b - - 1 29",
    "solution": [
      "a8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 911
  },
  {
    "fen": "1k1r4/p7/1ppq3p/4pb2/PR2Q1P1/2P2P2/1P6/2KB4 w - - 0 35",
    "solution": [
      "g4f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 581
  },
  {
    "fen": "8/8/2p1RN2/4P1k1/3PK1P1/r7/4b3/8 w - - 7 52",
    "solution": [
      "e6c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1314
  },
  {
    "fen": "q3kb1r/p2npppp/5n2/2p5/2Pp2bN/2N3P1/PP1PPP1P/R1BQK2R w KQk - 0 9",
    "solution": [
      "c3b5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 653
  },
  {
    "fen": "r1bRk1nr/ppq3pp/6n1/2b1p1B1/2B5/5Q2/PPP2PPP/4R1K1 b kq - 1 16",
    "solution": [
      "c7d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1455
  },
  {
    "fen": "2r1Q2k/6p1/p6q/1p4N1/1P1P1p2/P1r4P/5PP1/4R1K1 b - - 10 33",
    "solution": [
      "c8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1569
  },
  {
    "fen": "2k5/1p1n1p1r/p3n1p1/3Rb1P1/4P3/1Pq1B2P/P1PQ2B1/2K5 w - - 6 29",
    "solution": [
      "d5d7"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1276
  },
  {
    "fen": "1k5r/pp3p2/4pR2/3pP1p1/1Q1P4/PP2q1K1/3N4/8 w - - 0 28",
    "solution": [
      "f6f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1430
  },
  {
    "fen": "2r3k1/4q1r1/3R1Q1R/p2Pp3/1Np5/2Pn4/PP6/K7 w - - 1 40",
    "solution": [
      "f6e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 935
  },
  {
    "fen": "2k2r2/ppp1n3/2b1p2p/6pB/PP1P2Q1/2P1P3/3B2PP/R4q1K w - - 5 23",
    "solution": [
      "a1f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 532
  },
  {
    "fen": "r4k1r/pp2q3/2pb1npp/4RbN1/8/1QN4P/PP1B1PP1/R5K1 b - - 0 19",
    "solution": [
      "e7e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 962
  },
  {
    "fen": "2r2r1k/5p1P/3p1ppQ/p7/8/5NP1/1q3PK1/7R b - - 1 34",
    "solution": [
      "c8c2"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 870
  },
  {
    "fen": "5rk1/7p/4p1pK/3bQ3/6P1/1P5P/3r4/8 b - - 9 45",
    "solution": [
      "d2f2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 767
  },
  {
    "fen": "3Q4/5pkp/4p1p1/p3b3/N3b3/1B4PP/PP3P1K/4q3 w - - 3 33",
    "solution": [
      "d8d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1277
  },
  {
    "fen": "1r1q1rk1/pP3ppp/3p4/4n3/2P5/2P1Bb2/P1Q1NPB1/R3K2R b KQ - 4 18",
    "solution": [
      "f3g2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 869
  },
  {
    "fen": "r1b2r2/pppnNpbk/3p2p1/6BP/3pqP2/4P2R/PPP1Q3/R3K1N1 b Q - 0 16",
    "solution": [
      "d7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1021
  },
  {
    "fen": "6k1/6p1/3N3p/p1P5/1r6/6Pb/5P1P/1R4K1 w - - 1 42",
    "solution": [
      "c5c6"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 713
  },
  {
    "fen": "rnbqk2r/ppp3pp/8/2bp2B1/4n3/2N2N2/PPP1PPPP/R2QKB1R w KQkq - 2 7",
    "solution": [
      "g5d8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1070
  },
  {
    "fen": "2k3rr/pppb2p1/3b4/4qpNp/6nP/2PB4/PP3PP1/R1BQ1RK1 w - - 0 17",
    "solution": [
      "g5f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 701
  },
  {
    "fen": "6k1/pp3pp1/2p5/6Pp/3p1P1b/PB1b3q/1P1QK3/3R4 w - - 0 28",
    "solution": [
      "d2d3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1431
  },
  {
    "fen": "r1b2rk1/p5qp/2p1p1p1/3p4/7Q/2PB4/P1P2PP1/R2K3R b - - 3 18",
    "solution": [
      "g7c3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 461
  },
  {
    "fen": "6k1/5pp1/R3p2p/4N3/4PK2/P4P2/2n3rP/8 w - - 2 34",
    "solution": [
      "a3a4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 944
  },
  {
    "fen": "6k1/q2r1p1p/p3N1pQ/3nP3/3P2P1/5R1P/5P2/6K1 b - - 2 36",
    "solution": [
      "f7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 918
  },
  {
    "fen": "1r4k1/pp1b2pp/8/2PNq3/1P3p2/P4Q2/5PPP/2R3K1 w - - 0 27",
    "solution": [
      "c1e1"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 456
  },
  {
    "fen": "r2qk2r/pp3p1p/2n1p1pB/3pN3/3Pn3/4PQ2/P4PPP/R4RK1 b kq - 3 15",
    "solution": [
      "e4d2"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 943
  },
  {
    "fen": "3R2rk/1bp4n/p4PQ1/4p3/P7/2q4P/5PP1/5RK1 b - - 2 38",
    "solution": [
      "g8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1242
  },
  {
    "fen": "r1b2r2/2q2pkp/p1n1pNpQ/1pp1n3/3pPB2/3B4/PPP2PPP/R3R1K1 b - - 3 18",
    "solution": [
      "g7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1494
  },
  {
    "fen": "5k2/4pp2/8/1P1P4/4P2n/6p1/4Nr2/3R1K2 w - - 2 47",
    "solution": [
      "f1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1534
  },
  {
    "fen": "5rk1/4pp2/p2p1bP1/3P2N1/2r2P1Q/8/q6P/5RK1 b - - 0 32",
    "solution": [
      "f6g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 950
  },
  {
    "fen": "2b1r2k/2p4p/p2b1ppB/1p1P4/3p4/PB5P/1PP2PP1/3R2K1 w - - 2 26",
    "solution": [
      "d1d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 473
  },
  {
    "fen": "r3rbk1/3n1pp1/bqp5/p2p1B2/3P4/7R/PP3PPP/RNBQ2K1 w - - 3 18",
    "solution": [
      "d1h5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1027
  },
  {
    "fen": "rn2kb1r/pQp1pppp/8/4q3/2b5/8/PP1PBPPP/R1B1K1NR b KQkq - 0 8",
    "solution": [
      "c4d5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1154
  },
  {
    "fen": "2b3k1/1p2b1pp/1pn1p3/rB1pN3/Pn1P4/BPK5/5rPP/RN5R w - - 0 17",
    "solution": [
      "e5c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1299
  },
  {
    "fen": "1R6/1P4p1/7p/5P2/8/5kP1/1r5P/6K1 w - - 1 46",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 812
  },
  {
    "fen": "r6r/pppk2pp/3pNn2/1N5b/3P4/8/PP3PPP/2R1R1K1 b - - 7 19",
    "solution": [
      "a8e8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1378
  },
  {
    "fen": "2bR1k1r/p3qp2/2p1p1p1/2p1P1QN/2P5/1P4P1/P4P2/6K1 b - - 16 35",
    "solution": [
      "e7d8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 742
  },
  {
    "fen": "1r1r4/2p2pkp/4pnp1/p3N3/3n3P/P2P4/B1P2PP1/K3R2R w - - 4 25",
    "solution": [
      "c2c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 878
  },
  {
    "fen": "rn3rQk/pp4pp/2p4N/q3p3/8/1PP1n3/P5PP/2KR2NR b - - 7 20",
    "solution": [
      "f8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1038
  },
  {
    "fen": "r1q2rk1/pp3ppp/1n6/2bpP1N1/2p2P2/2P3P1/PPQ3KP/R1B2R2 b - - 0 18",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 512
  },
  {
    "fen": "1R4k1/2r1pp2/3p2p1/q5b1/p2PP1B1/2P4Q/P1K5/8 b - - 2 30",
    "solution": [
      "g8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1151
  },
  {
    "fen": "8/1kp5/1p6/1q6/4Q3/8/5K2/8 b - - 3 57",
    "solution": [
      "b7a6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 759
  },
  {
    "fen": "2kr3r/ppp2ppp/5n2/3P4/2P1q3/5b2/P4PPP/R1BQR1K1 w - - 0 15",
    "solution": [
      "d1f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 640
  },
  {
    "fen": "2r2r2/5q1k/3p3p/1p3b2/2PQ4/P1N1P1R1/1p4PP/5RK1 b - - 1 31",
    "solution": [
      "f7c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1384
  },
  {
    "fen": "8/5p2/6p1/1p1R1k1p/1P3P1P/1r4P1/6K1/8 b - - 3 48",
    "solution": [
      "f5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 915
  },
  {
    "fen": "5k2/p4P2/1p6/2pR4/B1P3rp/8/PP1prRPb/6K1 w - - 0 40",
    "solution": [
      "g1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1439
  },
  {
    "fen": "1rr3k1/2qN1p2/b3pbpQ/n1p5/P1P2P2/P3P2R/1B4PP/R5K1 b - - 1 23",
    "solution": [
      "f6b2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1595
  },
  {
    "fen": "r4rk1/pp2ppbp/1qnp2p1/8/2P1P1n1/1PB2N2/P1B2PPP/R2QK2R w KQ - 1 14",
    "solution": [
      "c3g7"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 942
  },
  {
    "fen": "2kr4/ppp2p2/7p/n1Pp1b2/3P3P/P1N1rNp1/1P4P1/2KRR3 w - - 2 26",
    "solution": [
      "e1e3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 503
  },
  {
    "fen": "r1bqn2k/2p2Qpp/p1p2p2/2Pp4/1b1P1P2/1P2P3/PB1N2PP/R4RK1 b - - 0 18",
    "solution": [
      "b4d2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1350
  },
  {
    "fen": "4r1k1/2p2ppb/p1p4p/2P1q1b1/1P3NP1/P2p1P1P/3Q1BK1/4R3 b - - 8 37",
    "solution": [
      "e5f4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1040
  },
  {
    "fen": "4r1k1/3Q2pp/8/4p2q/5b2/3P4/PPP4P/R4R1K w - - 3 29",
    "solution": [
      "a1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 724
  },
  {
    "fen": "2r5/5k1p/4p1p1/1B1b2P1/1P3P2/p5RQ/P2R4/qK6 w - - 1 41",
    "solution": [
      "b1a1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 725
  },
  {
    "fen": "q2Q3k/1p4p1/3R1N1p/6r1/8/7P/PP3PP1/6K1 b - - 8 44",
    "solution": [
      "a8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 423
  },
  {
    "fen": "r3r1k1/pp3ppp/2q2b2/2p5/3n4/5N2/PPQ2PPP/1RB1R1K1 w - - 4 19",
    "solution": [
      "f3d4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1495
  },
  {
    "fen": "r4rk1/1ppq1ppn/p2p3p/4pN2/4PnQ1/P2P3P/RPP2PPN/5RK1 b - - 9 18",
    "solution": [
      "d7e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1042
  },
  {
    "fen": "rn3rk1/pp6/3pbq1p/2p4P/2P3pP/2P1P3/P2NB3/R2QK2R w KQ - 0 19",
    "solution": [
      "e2g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1556
  },
  {
    "fen": "8/1R6/P7/6p1/1P1B1b2/5k2/5P1r/5K2 w - - 2 42",
    "solution": [
      "f1e1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 839
  },
  {
    "fen": "2r2r1k/pb1n1ppp/2N1p1q1/1B6/3P1Q2/4P3/PP3PPP/2R2RK1 w - - 5 18",
    "solution": [
      "c6e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1119
  },
  {
    "fen": "r2k2r1/1p3p1p/p1qb1p2/8/4N3/1Q2P3/PP3PPP/R2R2K1 w - - 2 18",
    "solution": [
      "e4d6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 914
  },
  {
    "fen": "r5k1/1p3p1p/p1bppB2/4P2Q/P2p4/1B1P2r1/1PP4P/4qRK1 w - - 0 32",
    "solution": [
      "h2g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1029
  },
  {
    "fen": "5k2/2q2ppp/8/N2p1P2/B7/5P1n/1bP2P2/4QK2 b - - 0 31",
    "solution": [
      "b2c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 918
  },
  {
    "fen": "r3k3/ppp2p1p/3p4/3N3Q/4P2b/3P4/PPP2qrP/R1BK3R w q - 5 16",
    "solution": [
      "c1e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1481
  },
  {
    "fen": "r1n1kQ1r/pbpq2p1/1pn1p2p/3pP3/3P4/B1PB4/P1P3PP/R4RK1 b kq - 5 15",
    "solution": [
      "h8f8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1417
  },
  {
    "fen": "5rk1/pp1n2p1/2p4p/4p2b/2NpPb2/3P3q/PPP2rB1/RQ2N1RK w - - 0 28",
    "solution": [
      "g2h3"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 773
  },
  {
    "fen": "2kr1bnr/pb1p1ppp/1p4q1/2p1P3/P1BQ4/2N5/1PPB1PPP/4RRK1 w - - 0 14",
    "solution": [
      "d4f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 959
  },
  {
    "fen": "2r1b2k/pp3pbp/3Qp1p1/q1n5/1nPBPN2/5P2/P5PP/1BR2R1K b - - 2 21",
    "solution": [
      "g7d4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1077
  },
  {
    "fen": "1k2R1r1/ppq5/2p5/7r/PPpP1QpP/2P5/5P2/4R1K1 b - - 1 30",
    "solution": [
      "g8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 891
  },
  {
    "fen": "6rk/1Bp2p2/p2p1p2/1pb1p2P/3nP2N/3P2Pq/PPP1N3/R2QK3 w Q - 1 20",
    "solution": [
      "h4f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1431
  },
  {
    "fen": "6k1/p2n1p1p/7b/2pB1p1Q/2Pp1P2/BP4P1/P2q1r1P/R3r2K w - - 2 28",
    "solution": [
      "a1e1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 689
  },
  {
    "fen": "8/2k2p1r/1p2p2P/p2pPnP1/P2P1PKB/2P1n3/5R2/4R3 w - - 10 47",
    "solution": [
      "g4h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1557
  },
  {
    "fen": "7r/bB6/P7/5pk1/3r4/N1P2R2/5KP1/R7 w - - 0 41",
    "solution": [
      "f2g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 765
  },
  {
    "fen": "r1b3k1/p2p1R1p/1p4pB/1P6/2Bbq3/8/P5PP/2R4K b - - 0 27",
    "solution": [
      "c8b7"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1844
  },
  {
    "fen": "r4Qkr/pp3ppp/5nN1/3pb3/8/8/PP3PPP/4R1K1 b - - 6 27",
    "solution": [
      "a8f8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 939
  },
  {
    "fen": "r1bq1rk1/pp3pp1/n1p2b1p/3p4/3P4/2NQP3/PP3PPP/1BR1K1NR b K - 3 11",
    "solution": [
      "c8e6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 616
  },
  {
    "fen": "6k1/1pp1r2p/3pNb2/p2P1R2/2P5/1P6/P6P/7K b - - 0 28",
    "solution": [
      "f6e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 794
  },
  {
    "fen": "5r1k/pp4pp/2p3q1/8/1Q4n1/2P1P1P1/PP4BP/R5K1 b - - 2 22",
    "solution": [
      "g4e3"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "rn1q1k1r/pp2b3/2ppQp1p/4p2B/3P4/8/PPP1PP2/RN2K2R b KQ - 5 15",
    "solution": [
      "d8d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 792
  },
  {
    "fen": "r1b2rk1/ppq2pp1/2p1pb1p/3n2N1/4QP1P/3BB3/PPP3P1/2KR3R b - - 3 15",
    "solution": [
      "d5e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 715
  },
  {
    "fen": "2kr1b1r/ppp2ppp/2nq4/5b2/2B1n3/2P1QN1P/PP1N1PP1/R1B1K2R w KQ - 2 12",
    "solution": [
      "d2e4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1294
  },
  {
    "fen": "3Q1r2/1R3p2/3b1kpp/3B4/3p1P2/6P1/4P2P/6K1 b - - 0 30",
    "solution": [
      "f8d8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 723
  },
  {
    "fen": "r2q1bkr/1pp1n1pp/p1np4/6N1/3pP1Q1/2P5/PP3PPP/RNB2RK1 b - - 0 10",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "2r3k1/1b3pp1/p3p2p/q2nP3/4QP2/B1pBP3/6PP/R5K1 b - - 1 26",
    "solution": [
      "a5b6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 551
  },
  {
    "fen": "r4rk1/pp2bppp/2p1pnb1/8/1P2PP1N/2P3Pn/P1QN2BP/R1B1R1qK w - - 9 19",
    "solution": [
      "e1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 692
  },
  {
    "fen": "1R6/6pk/8/Bp6/4p3/P1N1Pn1p/5P1P/5b1K w - - 7 44",
    "solution": [
      "c3e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "r2qr1Qk/1p4p1/p1pb1n1N/8/3P3B/3B4/PP3PPP/R5K1 b - - 2 21",
    "solution": [
      "f6g8"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1123
  },
  {
    "fen": "2r2rkR/2qb1pP1/4p3/pp2P1P1/8/2p1PQ2/PP3P2/2KR4 b - - 2 26",
    "solution": [
      "g8g7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1171
  },
  {
    "fen": "r1bq1b1k/pp1nrQBp/2p3p1/1P2P1N1/2pP4/P1N5/2P2PP1/R3K2R b KQ - 6 18",
    "solution": [
      "f8g7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1055
  },
  {
    "fen": "1r3rnk/p3bNpp/b1p4N/q2p4/5P2/1P1pP3/PBP2RPP/R5K1 b - - 1 21",
    "solution": [
      "f8f7"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 667
  },
  {
    "fen": "2kr1b1r/Q1p2ppp/8/2p1N3/6b1/4B3/P3qPPP/5RK1 b - - 1 16",
    "solution": [
      "g4e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1041
  },
  {
    "fen": "1r1r1kR1/3qbp2/b2p3p/p1p4n/4P3/1BQ5/PB3PPP/R5K1 b - - 2 25",
    "solution": [
      "f8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1055
  },
  {
    "fen": "r1b3k1/1p4b1/1N3p1n/q7/3P1Q2/8/PP3PPP/4R1K1 w - - 1 25",
    "solution": [
      "b6a8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 857
  },
  {
    "fen": "8/4bk2/RR6/8/3P4/6B1/1PP1p1KP/3q4 w - - 0 37",
    "solution": [
      "b6b7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1133
  },
  {
    "fen": "2rqk2r/3n1ppp/p1pbp1b1/3pN3/N1PP2P1/5Q1P/PP1B1P2/2R1R1K1 b k - 0 17",
    "solution": [
      "g6e4"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 540
  },
  {
    "fen": "8/3R4/6pP/5pP1/5P2/4r1k1/8/6K1 w - - 1 61",
    "solution": [
      "h6h7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 610
  },
  {
    "fen": "4Q3/8/1p3rkp/p1p3p1/P1Pb4/5P2/6K1/8 b - - 3 47",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 862
  },
  {
    "fen": "6kb/2qRQp1p/4b1pB/p1p1p3/1p2P3/2P2P2/PPN3PP/6K1 b - - 0 26",
    "solution": [
      "c7d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 869
  },
  {
    "fen": "r3qrk1/p1p1bppp/1p3n2/3p2N1/3P3Q/3B4/PP3PPP/R4RK1 b - - 0 18",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 937
  },
  {
    "fen": "r3r1k1/6pp/2p3q1/pp6/4b3/4B2P/1PP2PP1/R2QR1K1 w - - 2 24",
    "solution": [
      "c2c3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 462
  },
  {
    "fen": "2r5/4N1pk/4p3/R7/1rb5/8/5PP1/5RK1 b - - 3 37",
    "solution": [
      "c8c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 617
  },
  {
    "fen": "5rk1/4bppp/3p4/1Qp5/4q3/3R4/1PP2PPP/2B3K1 w - - 0 18",
    "solution": [
      "b5b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 667
  },
  {
    "fen": "r4r1k/pp4p1/n1p5/2P1p1R1/1PB1P2n/7P/P1Q1Nq2/7K b - - 1 34",
    "solution": [
      "f8f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 949
  },
  {
    "fen": "6k1/ppp2p1p/2n3p1/2NB4/3P1QqP/2P3B1/PP3P2/1K2r3 w - - 4 29",
    "solution": [
      "b1c2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1323
  },
  {
    "fen": "r5k1/5ppp/6n1/p1P1p3/4QP2/7b/PP3R1P/R1Br2K1 w - - 1 22",
    "solution": [
      "f2f1"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 887
  },
  {
    "fen": "r1bq1rk1/5ppp/p1n1pP2/3p4/2pP4/6P1/PPQNBPP1/R3K2R b KQ - 0 15",
    "solution": [
      "d8f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 622
  },
  {
    "fen": "8/pppk4/3b4/5Q2/P2p1p2/7P/1PP2PP1/1r2rNK1 b - - 2 27",
    "solution": [
      "d7c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 957
  },
  {
    "fen": "rn2kbnr/p2Bp1pp/5p2/q1p1N3/4b3/2N5/PPP2PPP/R1BQK2R b KQkq - 0 8",
    "solution": [
      "b8d7"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "r1b1kb1r/ppqp1pQ1/4p3/7p/2B1P1n1/5P1P/PPP2P2/RNB2RK1 w kq - 1 13",
    "solution": [
      "g7h8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 654
  },
  {
    "fen": "5k2/5p2/p7/2q5/2N1Qp2/3R1Kr1/P4b2/1R6 w - - 2 44",
    "solution": [
      "f3f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1301
  },
  {
    "fen": "7k/5prp/p4Q2/8/8/3q4/PP4P1/4R1K1 b - - 2 33",
    "solution": [
      "d3d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 818
  },
  {
    "fen": "N1bk3r/pp1p1ppp/2n5/2b1P3/4P3/1RP2N2/q4PPP/3QKB1R w K - 1 15",
    "solution": [
      "f1c4"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 914
  },
  {
    "fen": "5n2/p3n2Q/2p2q2/2PpNkNp/3P1P2/8/P4PK1/8 b - - 6 39",
    "solution": [
      "f5f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1673
  },
  {
    "fen": "r2q1rk1/1pp2p2/p1np3Q/2bnp1N1/4P3/P2P4/1PP2PPP/R3K2R b KQ - 1 13",
    "solution": [
      "d8f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 911
  },
  {
    "fen": "1Q6/8/p3qppk/p2p3p/8/2P1rNN1/6K1/8 b - - 3 39",
    "solution": [
      "h5h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 921
  },
  {
    "fen": "4nk2/3bQ3/p4P2/1p3N2/3pqPP1/8/BP3K2/8 b - - 3 45",
    "solution": [
      "e4e7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1335
  },
  {
    "fen": "rn2kbnr/2q1pQ1p/2p1P1p1/1p1p4/p7/3P3P/PPP2PP1/RN2K2R b KQ - 1 13",
    "solution": [
      "e8d8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 807
  },
  {
    "fen": "r2qk2r/pp3pbp/2npp3/5R1Q/2B1n3/2P5/PP4PP/RNB3K1 b kq - 0 12",
    "solution": [
      "d6d5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 650
  },
  {
    "fen": "r1bq1rk1/pp4pp/2p1Pp2/2bpnQ2/8/3B4/PPP2PPP/RNB2RK1 b - - 2 13",
    "solution": [
      "d8e8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 903
  },
  {
    "fen": "rqb2k1r/1p2nppp/3p4/1B2N3/4P3/8/PP2QPPP/R2R2K1 b - - 0 16",
    "solution": [
      "d6e5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 522
  },
  {
    "fen": "r5k1/pb3pp1/1p2p2p/8/3N2n1/4P1q1/PP4P1/2RR1QK1 w - - 4 29",
    "solution": [
      "f1f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1572
  },
  {
    "fen": "3kr3/BBpn1pp1/1p6/2b1N2q/5Pb1/3Qn3/PPP2R1P/6K1 b - - 1 26",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1704
  },
  {
    "fen": "6k1/5p2/4p2K/2p4p/1b2P3/1Q4P1/1r5q/R1N5 b - - 1 41",
    "solution": [
      "b2b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1178
  },
  {
    "fen": "6k1/1p3q1p/6p1/p1pP2Q1/P1nb4/2N2PB1/1P2r2P/7K w - - 0 31",
    "solution": [
      "c3e2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 508
  },
  {
    "fen": "rn2r1k1/1b1n1ppp/ppqPp3/2p5/P1B5/3P1NB1/1PP3PP/R2Q1RK1 w - - 1 16",
    "solution": [
      "f3g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 461
  },
  {
    "fen": "r2q1r1k/pp2b1pp/8/2p1Np2/2BpP1b1/P2P4/2P2PK1/R1BQ3R b - - 1 17",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1582
  },
  {
    "fen": "8/p1pb4/3p1p2/3P2p1/3NPpP1/kBP2P2/P7/b1K5 b - - 5 41",
    "solution": [
      "a1c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1301
  },
  {
    "fen": "2kr3B/ppp2p1p/8/5bq1/4p3/8/PPP1QbPP/RK3B1R w - - 4 15",
    "solution": [
      "e2f2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 882
  },
  {
    "fen": "1r6/pp3Rpk/2n4p/8/2P5/3pqPP1/4p2P/QR5K b - - 1 30",
    "solution": [
      "d3d2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1157
  },
  {
    "fen": "r6k/ppp3pp/6q1/8/8/1QB5/PPP2rPP/2KRR3 w - - 0 18",
    "solution": [
      "b3b7"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 781
  },
  {
    "fen": "8/Q2R2pk/8/8/5n1p/2P3qP/PP4PK/8 w - - 3 32",
    "solution": [
      "h2h1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 848
  },
  {
    "fen": "Bn2r1k1/p4ppp/3p4/2p3bP/3p2P1/1P1Q4/1PP1N2q/R2NK3 w Q - 0 21",
    "solution": [
      "d1f2"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1783
  },
  {
    "fen": "2r2rk1/3q2p1/p2pb2p/1p2p1b1/P3Q3/1P1B3P/2PN1PP1/R2R2K1 b - - 0 20",
    "solution": [
      "d7f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 446
  },
  {
    "fen": "r4r1k/ppq3Rp/5P1Q/8/8/2PB3P/PP6/1K5n b - - 4 32",
    "solution": [
      "f8f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1010
  },
  {
    "fen": "6r1/p1p4k/5P1p/5R1P/2B2RK1/1P4P1/3r4/8 w - - 3 37",
    "solution": [
      "g4h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "2k2rq1/2pp2Bp/p7/1p6/4Q3/8/P4PPP/R5K1 b - - 0 22",
    "solution": [
      "g8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 837
  },
  {
    "fen": "1rr3Qk/6pp/7N/q4p2/6bb/P2PP1P1/5P1P/2B2KR1 b - - 7 28",
    "solution": [
      "c8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 920
  },
  {
    "fen": "r3qk2/5r2/p1NpBR2/1p1Pp3/P1P1PpQp/1P6/5P2/2K5 b - - 0 33",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1082
  },
  {
    "fen": "r2q1rk1/pp3ppp/8/5b2/2Pb1Pn1/PNNp3P/1P1P2PK/RQB2R2 w - - 3 18",
    "solution": [
      "h3g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 811
  },
  {
    "fen": "rn2k2r/pp2ppbp/3p4/4qP2/6n1/3B4/PPP1N1PP/R1BQK2R w KQkq - 5 12",
    "solution": [
      "e1g1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 816
  },
  {
    "fen": "r5k1/1b4pp/p4n2/1p2p3/1P3nP1/P1N5/2P1B2P/3R1RK1 w - - 1 21",
    "solution": [
      "g4g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1256
  },
  {
    "fen": "b2Q3k/5rpp/2q2N1B/3p4/3p4/3P4/1PP2PPP/6K1 b - - 0 29",
    "solution": [
      "f7f8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1071
  },
  {
    "fen": "rn1qk2r/ppp1ppb1/5n1p/4P1Q1/2B3b1/8/PPP2PPP/RNB1K1NR w KQkq - 0 9",
    "solution": [
      "g5f4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 485
  },
  {
    "fen": "r2qr1k1/ppp3b1/2n3p1/2P5/2Q4N/6p1/PP3PP1/RN3K1R b - - 0 18",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1067
  },
  {
    "fen": "r4rk1/p1p2ppp/1b1q4/1Qp5/3P2n1/1N2P3/PP4PP/R1B2R1K w - - 4 20",
    "solution": [
      "d4c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 797
  },
  {
    "fen": "rn2kb1r/pp2pppp/2p5/4q3/6n1/2N1N3/PPPP1PPP/R1BQK2R w KQkq - 3 10",
    "solution": [
      "e1g1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1003
  },
  {
    "fen": "6k1/3QrR1p/p1r2bp1/8/2q5/6P1/PP4PP/5R1K w - - 3 27",
    "solution": [
      "f7e7"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 692
  },
  {
    "fen": "8/p5k1/1p4pp/2p2p2/2Pp4/P2q3r/6P1/4Q1RK w - - 0 40",
    "solution": [
      "g2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1133
  },
  {
    "fen": "4r1k1/p4ppp/Q2b1n2/1N1p4/8/7P/PB3PPq/R4K2 w - - 6 21",
    "solution": [
      "a6d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 979
  },
  {
    "fen": "r1k1Rq2/ppr5/7p/1Q4pn/3P2b1/2P5/PP1N2PP/R5K1 b - - 1 22",
    "solution": [
      "f8e8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 488
  },
  {
    "fen": "8/8/8/7p/2k1Q2P/P2r4/1PK2P2/3r1b2 b - - 4 57",
    "solution": [
      "d3d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1281
  },
  {
    "fen": "2k5/ppp2ppp/8/2b1P2r/4NP2/4nRKP/PPP1r1P1/R7 w - - 0 21",
    "solution": [
      "e4c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1368
  },
  {
    "fen": "6k1/R7/1p2R2p/5pp1/2rP4/2r4P/5PP1/6K1 b - - 0 30",
    "solution": [
      "c4c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1117
  },
  {
    "fen": "rn1qkbnr/3ppppp/2p5/p7/1PB5/1Q3P2/PB1P1PPP/RN2K2R b KQkq - 1 7",
    "solution": [
      "a5b4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 790
  },
  {
    "fen": "2k4r/ppp2ppp/7r/3P4/2P1pbP1/2N1B2q/PP3P2/R2QR1K1 w - - 9 19",
    "solution": [
      "e3f4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 923
  },
  {
    "fen": "r3kb1r/3n1ppp/q1p1p3/p2pP3/5P2/2P5/PP2Q1PP/RNB2R1K w kq - 0 14",
    "solution": [
      "e2g4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 629
  },
  {
    "fen": "8/2p1k3/p7/1p6/2P1b3/1B2b2p/PQ4qP/7K w - - 0 36",
    "solution": [
      "b2g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1394
  },
  {
    "fen": "r2qrk1Q/2pb2p1/p1n1p3/1p1nP1N1/3P4/2P5/P2B1PPP/1R3RK1 b - - 6 20",
    "solution": [
      "f8e7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 864
  },
  {
    "fen": "r6r/pp1q1p1k/2pb1Q1p/3p1b2/3P1P2/3B2R1/PPP3PP/RN4K1 b - - 0 18",
    "solution": [
      "f5d3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1042
  },
  {
    "fen": "3r1k2/5pp1/2Nbb2p/8/Q2p1q2/5B2/PP4PP/3R3K w - - 3 26",
    "solution": [
      "c6d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 657
  },
  {
    "fen": "2b1k2r/r4ppp/p3pB2/1pb5/6q1/1B3Q2/PPP2PPP/3RR1K1 b k - 0 16",
    "solution": [
      "g4f3"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1042
  },
  {
    "fen": "r3k2r/1p2p1b1/p2p2p1/2qP2Bp/8/7P/PPP1Q1P1/1K3R1R b kq - 0 20",
    "solution": [
      "c5d5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 807
  },
  {
    "fen": "5rk1/ppp3pp/7r/3p4/8/2P3P1/PP1N1q1P/R2QR2K w - - 10 22",
    "solution": [
      "e1e2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1333
  },
  {
    "fen": "r1bq1k1r/p5b1/2pp1nBp/4p3/1P2Ppp1/1QP2NP1/P4P1P/R1B1RNK1 b - - 0 18",
    "solution": [
      "g4f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 647
  },
  {
    "fen": "k2r3r/ppp3pp/2R2p2/3q1b2/Q7/4BN2/P4PPP/1R4K1 b - - 0 17",
    "solution": [
      "d5c6"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 982
  },
  {
    "fen": "2r2rk1/pb2bp1p/1p1p2p1/2pP4/4P1q1/1PQ5/PB3PNP/R4R1K b - - 1 21",
    "solution": [
      "g4e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 525
  },
  {
    "fen": "2k2r2/pppb2pr/3bpq2/3pN2p/3PpB1P/2P1P3/PP3PP1/R2Q1K1R w - - 1 17",
    "solution": [
      "f4g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 499
  },
  {
    "fen": "r1b1kb1r/pp2pppp/2n2n2/2PNB3/8/5N2/PqP1PPPP/R2QKB1R b KQkq - 0 7",
    "solution": [
      "c6e5"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 1349
  },
  {
    "fen": "r1b2k1r/pp1pn3/3bpp1p/qN4pQ/B2pP3/3P4/PPP2PPP/1RB1R1K1 w - - 4 15",
    "solution": [
      "b5d6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 768
  },
  {
    "fen": "4rrQk/pbp3pp/1pn4N/8/3q2PP/3B4/PPP5/1K1R1R2 b - - 4 23",
    "solution": [
      "f8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 902
  },
  {
    "fen": "3r2k1/pp3p2/5P2/2p5/6qr/1P2Q3/P5PP/1B3R1K b - - 12 33",
    "solution": [
      "d8d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1300
  },
  {
    "fen": "7k/1p3qp1/pbp4p/2P5/4r3/1Q3P2/P1P3PP/7K w - - 0 29",
    "solution": [
      "b3f7"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 1168
  },
  {
    "fen": "8/2p1k3/N4p2/6pp/P3P3/2P2P2/1r4rP/R3RK2 w - - 0 33",
    "solution": [
      "a6c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 926
  },
  {
    "fen": "8/8/8/8/8/3r1k2/6R1/7K w - - 67 97",
    "solution": [
      "g2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 430
  },
  {
    "fen": "2kr3r/p1p1qppp/Qpn5/2N2P2/3P4/2P1p2B/PP3n2/R3K2R b KQ - 1 21",
    "solution": [
      "c8b8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 837
  },
  {
    "fen": "8/8/1R6/8/5Pn1/P4k2/1P5K/5r2 w - - 3 43",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1502
  },
  {
    "fen": "1k4r1/1p3pr1/p3p3/P4p2/2PP3p/R4q1b/5P1P/3QRB1K w - - 0 29",
    "solution": [
      "d1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 622
  },
  {
    "fen": "r1br3k/1p3Q2/p3pP1R/2p2n2/q4P2/2B5/1P6/1K2R3 b - - 0 30",
    "solution": [
      "f5h6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 906
  },
  {
    "fen": "r4rBk/p4pp1/1p6/4q3/6b1/1P2B1P1/P1Q2P2/R5KR b - - 2 23",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 826
  },
  {
    "fen": "8/4N2p/5P2/6p1/6n1/5k1K/7P/8 w - - 0 51",
    "solution": [
      "f6f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 956
  },
  {
    "fen": "6rk/2R4p/2Q5/2p2q2/7K/6P1/7P/8 w - - 10 46",
    "solution": [
      "c6c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1774
  },
  {
    "fen": "5rk1/pq2r1pp/1p2p3/4B1Q1/3P1N2/2P1PP2/PnP2K1P/4R1R1 w - - 14 30",
    "solution": [
      "f4e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1086
  },
  {
    "fen": "3Rq1rk/pb2nppp/1p2pn2/1P2N3/1BP5/4P3/2Q1BPPP/6K1 b - - 5 21",
    "solution": [
      "e8d8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 924
  },
  {
    "fen": "3r2k1/3r4/2p3p1/P7/4p2p/6qP/1Q2b1P1/B2RR1K1 b - - 4 34",
    "solution": [
      "d7d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1366
  },
  {
    "fen": "R7/P7/8/5p2/5k1p/8/6PK/r7 w - - 10 69",
    "solution": [
      "h2h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 926
  },
  {
    "fen": "8/8/KPk5/8/8/5P2/1r1p3P/3R4 w - - 2 47",
    "solution": [
      "b6b7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1451
  },
  {
    "fen": "4r1k1/5p1p/r3bBp1/pp1N4/8/8/PP3PPP/3RR1K1 b - - 0 24",
    "solution": [
      "e6d5"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 841
  },
  {
    "fen": "2Q5/k3r1R1/1pp5/p2p4/P2P4/2P2P2/5K1q/6R1 w - - 22 55",
    "solution": [
      "f2f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1033
  },
  {
    "fen": "8/4p2k/3p2p1/3q3p/7P/2Q1P1P1/5P2/6K1 b - - 1 45",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 491
  },
  {
    "fen": "r6k/6p1/p1b5/1p2PRq1/1P6/P6P/6rQ/4R1K1 w - - 0 42",
    "solution": [
      "h2g2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 840
  },
  {
    "fen": "2kb4/1pn3p1/1B4p1/1pP2p2/6r1/5K2/8/R2R4 b - - 3 38",
    "solution": [
      "c7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1396
  },
  {
    "fen": "r4r1k/1pp1q1p1/p1np1bPB/4p2Q/1P2P3/1BPP3P/P4P1K/R7 b - - 0 23",
    "solution": [
      "f6g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1565
  },
  {
    "fen": "8/p4R1p/k1p1Bp2/Pp3Pp1/1P6/K1P1P3/3r3P/1r6 b - - 7 34",
    "solution": [
      "d2h2"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1050
  },
  {
    "fen": "8/2R2R2/1p6/prk4p/7P/1r3PK1/1P6/8 b - - 3 42",
    "solution": [
      "c5b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 955
  },
  {
    "fen": "q3kb1r/p4p1p/1p2pp2/2p5/2p5/2N1P1P1/PP3PKP/R2QnR2 w k - 3 15",
    "solution": [
      "g2g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1117
  },
  {
    "fen": "3K4/8/2Bkpp2/p5p1/1r4P1/5P2/8/7R w - - 6 50",
    "solution": [
      "c6a8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 636
  },
  {
    "fen": "q3kb1r/p2n1ppp/4p3/5b2/3p3N/2P3P1/P2BPP1P/R2QK2R w KQk - 0 13",
    "solution": [
      "h4f5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 945
  },
  {
    "fen": "r2qkbnr/pp1bpppp/2np4/8/2B1P3/1Q6/PPP2PPP/RNB1K1NR b KQkq - 6 7",
    "solution": [
      "c6d4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 933
  },
  {
    "fen": "r1b1k1nr/ppp2p2/2qp2p1/3NN1p1/4P3/1P6/1PPP1bPP/R1BK3R w kq - 0 13",
    "solution": [
      "e5c6"
    ],
    "title": "Мат двома слонами",
    "theme": "Мат в 1",
    "rating": 882
  },
  {
    "fen": "r4r1k/ppp2qpp/2n1Bp2/2p1pN2/4P1Q1/3P3P/PPP2PP1/R4RK1 b - - 0 16",
    "solution": [
      "f7e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 578
  },
  {
    "fen": "r4qk1/p1bb4/2p4p/1P1p2p1/1PnP4/2PQ2PP/2B3P1/RN4K1 b - - 2 25",
    "solution": [
      "a8e8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1329
  },
  {
    "fen": "5Q2/5ppk/4p2p/3p4/3P3P/2P3R1/2q2rPK/8 b - - 5 37",
    "solution": [
      "c2e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 634
  },
  {
    "fen": "8/1p3k2/2p2p2/2Pb3P/1P1KpPB1/r6P/8/4R3 w - - 3 37",
    "solution": [
      "e1b1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1065
  },
  {
    "fen": "rnb5/pp1p2kp/1q2p1pQ/5r2/8/1P3N2/P1P3P1/RN3K1R b - - 1 16",
    "solution": [
      "g7f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1292
  },
  {
    "fen": "r1b2rk1/p1qpppbp/2p3pB/8/4P1n1/3B4/PPPQ1PPP/RN3RK1 w - - 10 11",
    "solution": [
      "h6g7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 613
  },
  {
    "fen": "r4rk1/pp3p2/4b1B1/2Ppn1NQ/8/2q5/P1P2PPP/R4RK1 b - - 0 17",
    "solution": [
      "e5g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 847
  },
  {
    "fen": "2r1k3/b4p2/4p1p1/8/P2P4/8/6PP/1Bq1R2K w - - 0 43",
    "solution": [
      "e1c1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 474
  },
  {
    "fen": "R1k5/2p1q3/1p2p3/1P3p2/2P3r1/1P3Q2/7P/7K b - - 3 33",
    "solution": [
      "c8d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1225
  },
  {
    "fen": "r2Qk1r1/ppp2qPp/2p1b3/2n1b1B1/8/8/PPP2PPP/RN1R2K1 b q - 1 15",
    "solution": [
      "a8d8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 828
  },
  {
    "fen": "rn1qk2r/ppp2ppp/4p3/3p1P2/3P1bn1/2N2P2/PPP1P2P/R2QKBNR w KQkq - 1 8",
    "solution": [
      "f3g4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 966
  },
  {
    "fen": "8/6bp/1ppkb3/p4p2/P1PnpP1B/1P2N2P/3N1KP1/8 b - - 7 35",
    "solution": [
      "d6c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1018
  },
  {
    "fen": "r4r1k/3R3p/2p2ppB/1pb1p3/p3Pn2/P4P2/B1P2R1P/1N5K b - - 0 27",
    "solution": [
      "c5f2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 985
  },
  {
    "fen": "3r3r/p1pkn1pp/Q1pppq2/8/N3P3/b4P2/1PPB2PP/2KR3R w - - 0 17",
    "solution": [
      "b2a3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 787
  },
  {
    "fen": "4rrk1/pp3pp1/2q1b2p/3p4/1P6/2nQ3P/P1B2PP1/2KRR3 b - - 1 26",
    "solution": [
      "c3d1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 891
  },
  {
    "fen": "r4rk1/1p2pp2/3p1Bpp/p2P4/2P1RP2/5N1n/PP4PP/R1Q2BqK w - - 5 23",
    "solution": [
      "f3g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1276
  },
  {
    "fen": "5rk1/1p5p/p1bqp1p1/3pN1P1/4P3/2R4P/P1Q3P1/7K w - - 2 32",
    "solution": [
      "e5c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 908
  },
  {
    "fen": "6k1/p4ppp/1p6/3pP3/3n4/Pq2R3/3B4/R1rK1Q2 w - - 4 35",
    "solution": [
      "d1c1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 898
  },
  {
    "fen": "r2qkb1r/pp3ppp/2n1p3/3pn1N1/3N1Q2/8/PPP2PPP/R1B2RK1 b kq - 1 12",
    "solution": [
      "e5g6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 830
  },
  {
    "fen": "2k2r2/pp2bBpp/8/2p1B3/4P1q1/2N2P2/PPP3PP/3R3K b - - 0 18",
    "solution": [
      "g4g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "r1b1kb1r/pp3pn1/2p1pBpp/4P3/2B3P1/5N2/PPP2P1P/3RK2R b Kkq - 0 15",
    "solution": [
      "h8g8"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 644
  },
  {
    "fen": "8/2p5/3p3k/p2P2Np/P3Bp1P/2b4K/1p2q3/6R1 b - - 9 54",
    "solution": [
      "c3f6"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 671
  },
  {
    "fen": "r5k1/pp2N2p/3p2p1/2pPn3/2P1P3/5Q2/PP1q4/1K4R1 b - - 4 30",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1215
  },
  {
    "fen": "3r1rk1/p6p/8/8/2Pp4/1P1R3b/P1Q4P/4RqK1 w - - 2 27",
    "solution": [
      "e1f1"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1027
  },
  {
    "fen": "r1b3k1/pp3ppn/8/2pr4/8/4P3/PPQ2PPP/R1B3K1 w - - 0 19",
    "solution": [
      "c2e4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 403
  },
  {
    "fen": "r2qn1k1/pppn2pp/4p2r/2b1Pp2/2P2Pb1/1PNB1NP1/PB4KP/R3QR2 w - - 3 17",
    "solution": [
      "f1h1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1222
  },
  {
    "fen": "6k1/p1q3pp/bp1p1b2/3r4/4Q3/1Pr1B1PP/P1P2P2/1RK4R b - - 3 24",
    "solution": [
      "a6d3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1456
  },
  {
    "fen": "6rk/1R1R2p1/1p5Q/p1p5/4p2P/1q4P1/5PK1/8 b - - 0 40",
    "solution": [
      "g7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 605
  },
  {
    "fen": "2kr2nr/ppp2pp1/7p/3P1b2/Q1P5/P1q1BN2/3R1PPP/4K2R b K - 3 18",
    "solution": [
      "d8e8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 580
  },
  {
    "fen": "r2q1rkQ/pp2ppb1/6p1/5b2/3B2n1/2N2P2/PPP5/2KR1B1R b - - 4 16",
    "solution": [
      "g7h8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1001
  },
  {
    "fen": "2kr4/p4p1p/1p2p1q1/2pnB3/8/1P3Q1P/P1P2PP1/1K1R4 b - - 6 34",
    "solution": [
      "d5b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1445
  },
  {
    "fen": "2rr3k/1pq1bQ1p/p1b1p1B1/4N3/8/2N1P2P/1P3PP1/2B1R1K1 b - - 0 24",
    "solution": [
      "h7g6"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 860
  },
  {
    "fen": "r1b1r1Qk/ppqnp1b1/2p2npN/6N1/3P3P/2P5/PP3PP1/R1B1K2R b KQ - 2 17",
    "solution": [
      "f6g8"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1304
  },
  {
    "fen": "1kr5/1pb2pp1/4p3/3qP2p/Q2p4/R5PK/5P1P/8 b - - 2 39",
    "solution": [
      "b7b6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1071
  },
  {
    "fen": "r4rk1/b1p2ppp/p4q2/1p1np1N1/1PPnQ3/1B1P4/P4PPP/RNB3K1 b - - 2 15",
    "solution": [
      "d5f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 703
  },
  {
    "fen": "r1b3k1/ppp2p1p/6p1/3p3r/1P1B3q/P3Pn2/2PNBPP1/R2Q1RK1 w - - 4 16",
    "solution": [
      "d2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 812
  },
  {
    "fen": "r1b1r1k1/pp2npp1/1q5p/3Q4/3P4/2PB1N2/PP3KPP/R1B1R3 b - - 0 16",
    "solution": [
      "e7d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 676
  },
  {
    "fen": "6k1/1p5p/p1b3p1/4Qp2/3B4/Pq3P1P/6P1/6K1 b - - 6 38",
    "solution": [
      "b3a3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1155
  },
  {
    "fen": "r1bk3r/1p3R1p/pR1Bp1p1/3p4/B1nP4/2K1P3/P4PPP/8 b - - 2 23",
    "solution": [
      "c4b6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1300
  },
  {
    "fen": "2rr1nk1/p2q1pp1/1p1Pp2p/1P6/R4P2/6P1/1Q5P/B2R1K2 b - - 2 34",
    "solution": [
      "c8c5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 641
  },
  {
    "fen": "8/6pp/2k5/rpp5/1P1pP3/2bN1P1P/1KP3P1/4R3 w - - 1 36",
    "solution": [
      "b2b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1293
  },
  {
    "fen": "r1b1k1nr/pppp1ppp/5q2/2b1p3/2P5/2NnP1P1/PP1PNPBP/R1BQK2R w KQkq - 3 7",
    "solution": [
      "e1f1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 873
  },
  {
    "fen": "2n5/3k2p1/3p3p/3Kp3/1N2P1PP/3P4/8/8 w - - 1 54",
    "solution": [
      "h4h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "r5k1/p4p1p/5p2/3p4/2p5/3B1q1b/PPP1r2K/R2Q1N2 w - - 0 21",
    "solution": [
      "d3e2"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1075
  },
  {
    "fen": "2rqk1nr/Q2b1ppp/4p3/1B1pN3/3P4/2P1P3/P2K1PPP/n1B4R b k - 0 15",
    "solution": [
      "d7b5"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 933
  },
  {
    "fen": "r4rk1/ppp2Rpp/2n5/4P3/2B5/2P2R1P/P1P3P1/6K1 b - - 0 18",
    "solution": [
      "c6e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 737
  },
  {
    "fen": "1rb2rk1/p1p2ppp/3p1q2/2pP4/2B5/P4P2/1PPQ2PP/2KR3R w - - 3 16",
    "solution": [
      "b2b3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 852
  },
  {
    "fen": "r1b1k1r1/pp3p1p/2n2Qp1/3qp1N1/1b4P1/8/PP2PPBP/R1B1K2R w KQq - 6 13",
    "solution": [
      "e1f1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 699
  },
  {
    "fen": "r2q1rk1/n1p2p2/pp1p3Q/3Pp3/P3B2b/7P/1PP2PP1/R4RK1 b - - 0 18",
    "solution": [
      "d8g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 909
  },
  {
    "fen": "2kr1r2/p1p1np1p/8/4P2Q/5P2/2B2N2/PP5P/K2q3R w - - 1 21",
    "solution": [
      "h1d1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 455
  },
  {
    "fen": "6QK/5q2/5k2/8/8/8/8/8 w - - 1 65",
    "solution": [
      "g8g7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 633
  },
  {
    "fen": "r4rk1/2p3pp/p1pbq3/6N1/2p5/4P1P1/PPQ2PP1/R4RK1 b - - 3 18",
    "solution": [
      "e6d5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 495
  },
  {
    "fen": "r2q1rk1/pb3p2/1ppp3Q/3Pp1P1/2P5/1P1P4/1P3PP1/R3K2R b KQ - 0 17",
    "solution": [
      "d8g5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 660
  },
  {
    "fen": "r3qrk1/2p1np2/1p1p3Q/pP1P2Np/P1P1P3/2Nn4/8/6K1 b - - 1 30",
    "solution": [
      "f7f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1052
  },
  {
    "fen": "5b1r/3Q1k2/p2pn1p1/q2Npb1p/7P/8/P1r2PP1/R4RK1 b - - 1 21",
    "solution": [
      "f7g8"
    ],
    "title": "Мат в кутку",
    "theme": "Мат в 1",
    "rating": 957
  },
  {
    "fen": "8/8/4R1kp/pp2P1p1/b2B4/3r1P2/6K1/8 b - - 0 39",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 680
  },
  {
    "fen": "8/8/P1R5/6P1/1p6/2p2kP1/r4P2/4K3 w - - 1 47",
    "solution": [
      "g5g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1463
  },
  {
    "fen": "1kqR1Q2/pp3p1p/8/8/8/1NP3rP/PPn1r1P1/1K4R1 b - - 8 25",
    "solution": [
      "c8d8"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 1128
  },
  {
    "fen": "8/p2k2p1/2p2p2/8/1B1r4/P4b1P/5P1P/2R3K1 w - - 1 35",
    "solution": [
      "c1c3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 657
  },
  {
    "fen": "7k/5Rnp/p3RNp1/1p6/3P2P1/P5KP/5r2/3n4 b - - 1 35",
    "solution": [
      "g7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1050
  },
  {
    "fen": "8/pp2k1R1/2r1P3/5P2/3K4/P7/r1p3P1/8 b - - 0 42",
    "solution": [
      "e7d6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 904
  },
  {
    "fen": "4r3/pp3kpp/2p2n2/6b1/3B4/3P2N1/PPP3Pn/1K5R w - - 0 28",
    "solution": [
      "h1h2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 569
  },
  {
    "fen": "r1bqr1k1/pp3ppp/2nb4/1Bpn2B1/8/3P1N2/PPPK1PPP/R2Q3R w - - 0 11",
    "solution": [
      "g5d8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 996
  },
  {
    "fen": "r2qkb1r/pp1np1pp/2p2n2/3p4/3P1B2/3Q1N2/PPP2PPP/RN3RK1 b kq - 1 8",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 621
  },
  {
    "fen": "r1b2b1r/ppp2p1p/n4k2/4Q3/3PPB2/8/PPP4P/R3KB1q b Q - 1 18",
    "solution": [
      "f6g6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 887
  },
  {
    "fen": "r2q1r1k/1pp4n/p1np2pQ/5b1N/1PP4P/P1N2P2/4B3/R3K1R1 b Q - 2 27",
    "solution": [
      "g6h5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 976
  },
  {
    "fen": "2r5/6Rp/R7/3K1k2/3P2P1/4rn2/7P/8 b - - 0 36",
    "solution": [
      "f5f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1132
  },
  {
    "fen": "r1bqk2r/p4pp1/5P1p/8/2p5/2b5/PPP3PP/R1BQR1K1 b kq - 1 13",
    "solution": [
      "e8f8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1219
  },
  {
    "fen": "4q2k/2Q4p/2p3p1/2p2rN1/3b1P2/3P3P/2P5/5R1K b - - 3 29",
    "solution": [
      "h7h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1064
  },
  {
    "fen": "rn1q1bkr/pp4pp/2p5/4N3/3pP1Q1/2P5/P4PPP/R1B1K2R b KQ - 0 11",
    "solution": [
      "d4c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 946
  },
  {
    "fen": "r3k2r/pp1qpp1p/2n1b1pB/2p5/6P1/2nP1N1P/PQP2PB1/R3K2R b KQkq - 1 14",
    "solution": [
      "c3d5"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 796
  },
  {
    "fen": "5rk1/p3q1pp/5p2/Qp3b2/3p4/4p1P1/PP1K1PBP/3R3R w - - 0 25",
    "solution": [
      "f2e3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1283
  },
  {
    "fen": "r3r1k1/3n1R1p/2pq2p1/p3P3/1p6/2n4Q/P1B3PP/4R2K b - - 0 24",
    "solution": [
      "d7e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 975
  },
  {
    "fen": "2krr3/pppnQ1pp/8/3p4/8/2qP4/P1P2PPP/1RBK1B1R w - - 1 15",
    "solution": [
      "e7b4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1402
  },
  {
    "fen": "r2q1rk1/ppp1ppbp/2bp1np1/2n5/2B1P1P1/1PQ2P1P/PBPPN3/RN2K2R b KQ - 2 11",
    "solution": [
      "f6e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 645
  },
  {
    "fen": "3q1rk1/2bbnpp1/1n2p2p/3pP3/2pP3N/2P3B1/2Q1NPPP/1B2K2R b K - 5 19",
    "solution": [
      "b6a4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 958
  },
  {
    "fen": "5R1k/1p2N1b1/2pp2Q1/r6p/3qP3/pPN5/P1P5/1K6 b - - 6 33",
    "solution": [
      "g7f8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 927
  },
  {
    "fen": "2r2r2/pp2ppkp/3pb1p1/3N2Pn/3QP3/5P2/qPP1B2P/2KR3R b - - 1 16",
    "solution": [
      "g7g8"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 843
  },
  {
    "fen": "2Nr2k1/1b2bppp/np2p3/8/2B3q1/1P3N2/P2n1PPP/2RQ1RK1 w - - 0 18",
    "solution": [
      "f3d2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 874
  },
  {
    "fen": "4rk2/p6p/1pn5/5r2/8/1BP1B3/PP3PP1/4RK2 b - - 9 31",
    "solution": [
      "c6a5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 857
  },
  {
    "fen": "8/8/p1qkp1Q1/6P1/PP3n2/8/5P2/4R1K1 w - - 1 50",
    "solution": [
      "g6f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1246
  },
  {
    "fen": "2kr3r/pppbq3/2np4/2bB1p1p/PP2P1pP/2PP4/6PK/RNBQ1R2 w - - 0 16",
    "solution": [
      "e4f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1857
  },
  {
    "fen": "8/1p4R1/1p2rB1p/2b2p1k/P5P1/4Pp1P/5P2/6K1 b - - 0 36",
    "solution": [
      "f5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1068
  },
  {
    "fen": "2N3k1/3p3p/p1p1p1pP/4P1q1/8/b1PQ4/P1K3P1/1r3B1R w - - 0 30",
    "solution": [
      "c2b1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 554
  },
  {
    "fen": "8/8/8/PR5p/6pk/5p2/2r2P2/6K1 b - - 3 49",
    "solution": [
      "h4h3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1231
  },
  {
    "fen": "1Q6/7k/6p1/P4p1p/1p5P/1P3qPK/5P2/8 w - - 0 38",
    "solution": [
      "b8b4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1406
  },
  {
    "fen": "6qr/pkp5/1pNp4/1P5p/2rpP1p1/Q7/P4PPP/5RK1 b - - 1 31",
    "solution": [
      "g8a8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1328
  },
  {
    "fen": "3R2nk/p6p/5rp1/1P1B4/6P1/8/8/4q1QK b - - 7 36",
    "solution": [
      "f6f1"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 833
  },
  {
    "fen": "7Q/8/1pN2k2/p1b2pp1/2P5/PP6/3q1PK1/8 b - - 13 43",
    "solution": [
      "f6g6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1355
  },
  {
    "fen": "rnb1k2r/pp3ppp/4p3/3p4/4nq1P/PN2BNb1/1PP1PPP1/R2QKB1R w KQkq - 3 11",
    "solution": [
      "e3f4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 832
  },
  {
    "fen": "rn4k1/pp4pp/3p4/2pP1b2/2r4q/5P2/PP2QN1P/K2R1B1R b - - 3 18",
    "solution": [
      "c4c2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 415
  },
  {
    "fen": "r3br1k/ppp1Nq1p/1b2p3/8/7Q/2P1pP2/PPB3PP/R3R1K1 b - - 8 24",
    "solution": [
      "f7f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1238
  },
  {
    "fen": "B1b2rk1/p1p2ppp/8/3p4/3bn3/8/PPP3PP/RNBQ1RqK w - - 2 14",
    "solution": [
      "f1g1"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 916
  },
  {
    "fen": "rR2n1k1/5ppp/pQ6/8/8/1P3q2/P4PPP/3R2K1 w - - 0 24",
    "solution": [
      "b8a8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "8/1p2k3/3qbbQ1/pBppp3/P2p4/2PP3r/1P6/R3R1K1 b - - 3 30",
    "solution": [
      "e5e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1353
  },
  {
    "fen": "2r3k1/5ppp/p3P3/1p6/2b1p3/P1Q1P3/3r1q2/K3R1R1 b - - 0 32",
    "solution": [
      "c4e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1059
  },
  {
    "fen": "2r2rk1/1pq1ppbp/p2p1np1/8/2PQ4/1P3BP1/PB2PP1P/2R2RK1 b - - 2 16",
    "solution": [
      "f6d7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 675
  },
  {
    "fen": "8/5k2/2b1p1r1/2B2r2/1P3n2/6P1/P3QP1P/4RRK1 w - - 1 32",
    "solution": [
      "e2a6"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 928
  },
  {
    "fen": "5rk1/1p3pp1/3q3p/1PNp4/1Q1N4/3B3P/r7/5RK1 w - - 1 24",
    "solution": [
      "d4f5"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 933
  },
  {
    "fen": "N5nr/pp2kpQp/3pb3/2b1p3/2BnP3/8/PPPP1qPP/R1BK2NR w - - 1 10",
    "solution": [
      "c4e6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1267
  },
  {
    "fen": "r4rk1/pp2Rq1p/2p2B1Q/5p2/2p5/7P/PP3PP1/3R2K1 b - - 2 20",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1179
  },
  {
    "fen": "rn1q1k1r/1bpn2b1/pp2Q1Bp/8/3P4/2P1B3/PP1N1PPP/R4RK1 b - - 0 14",
    "solution": [
      "d8f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1073
  },
  {
    "fen": "r2qr1k1/4bp1n/p2p3P/1p2pp2/4P2P/2P1N1Q1/PP3P2/R3K2R b KQ - 1 24",
    "solution": [
      "g8h8"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1074
  },
  {
    "fen": "r1bqk2r/ppp2ppp/8/2bnp1N1/8/1PN2Q2/1PPP1PPP/R1B1K2R b KQkq - 1 9",
    "solution": [
      "d5c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 830
  },
  {
    "fen": "1n4k1/p1pr1ppp/1p2p3/4q3/1PP5/P4B2/2Q2PPP/3R2K1 w - - 0 25",
    "solution": [
      "d1d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 750
  },
  {
    "fen": "r5k1/p1p2ppp/2p5/3b2q1/8/2N1r3/PPP1Q1PP/R3R1K1 w - - 0 16",
    "solution": [
      "e2e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 835
  },
  {
    "fen": "r1bqk2r/pppp1pp1/2n4p/3QP3/2B1P2b/6B1/PPP2PPP/RN2K2R b KQkq - 1 9",
    "solution": [
      "h4g3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1015
  },
  {
    "fen": "rnbq1b1r/5kp1/p2pB2p/8/3Nn3/1Q6/PP3PPP/R1B1K2R b KQ - 0 12",
    "solution": [
      "c8e6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 803
  },
  {
    "fen": "r4rk1/ppp2ppp/1B1p2q1/8/4P3/1BP2P1b/PP3P2/R2QR1K1 w - - 1 18",
    "solution": [
      "g1h2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 804
  },
  {
    "fen": "r4rk1/pbp2pBp/1p2p1p1/6q1/3P4/2PBn3/PP3PPP/RN1QR1K1 w - - 1 15",
    "solution": [
      "f2e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 851
  },
  {
    "fen": "2Q5/8/6pk/3p3p/4q2P/8/8/5K2 b - - 1 50",
    "solution": [
      "d5d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 566
  },
  {
    "fen": "r3k2r/ppp2ppp/2n5/8/2P2pq1/2NPnN2/PP2B3/R1Q1R2K w kq - 0 16",
    "solution": [
      "f3h2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 782
  },
  {
    "fen": "r1bqr1k1/p4pp1/7p/2Bp4/Q5n1/2PB2N1/PP3PPb/R4R1K b - - 3 17",
    "solution": [
      "d8h4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1244
  },
  {
    "fen": "r5k1/pbp3pp/1p1ppr2/5p1q/2PPn3/P1PBP2P/1BQ2nPN/5RRK w - - 0 18",
    "solution": [
      "f1f2"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1632
  },
  {
    "fen": "8/3k2bp/6p1/1N3b2/1PP1p3/1R2K3/r7/4R3 w - - 4 44",
    "solution": [
      "b5d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1230
  },
  {
    "fen": "1r1k4/8/3p3p/p1b2B2/2P5/3R4/Pr4PP/K3R3 w - - 1 37",
    "solution": [
      "e1e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 508
  },
  {
    "fen": "6k1/pp4r1/4P3/3pbQ2/8/1P4qP/P5P1/4R2K w - - 1 44",
    "solution": [
      "f5e5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 871
  },
  {
    "fen": "r5k1/pp4pp/8/4B3/1bP2r2/1P1b2q1/P2P4/Q3K1R1 w - - 0 24",
    "solution": [
      "g1g3"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1225
  },
  {
    "fen": "r2qrk2/3nb1p1/p2p2P1/nppQ4/8/7P/PPP2P2/RNB1R1K1 b - - 0 18",
    "solution": [
      "e7f6"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1130
  },
  {
    "fen": "5R1k/5Q1p/p5pq/1p3p2/1P6/4p3/P6N/7K b - - 0 34",
    "solution": [
      "h6f8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 449
  },
  {
    "fen": "3B2k1/pb4p1/1p5p/2b5/1PP5/8/P1Q1B1rP/6K1 w - - 0 26",
    "solution": [
      "g1f1"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1172
  },
  {
    "fen": "r2q2nk/pb3prQ/1p2p1p1/2p1n1N1/3pPNP1/3P1P2/PPP3B1/2KR3R b - - 0 20",
    "solution": [
      "g7h7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1174
  },
  {
    "fen": "5rk1/p1r2p1p/1p2NQp1/4n3/2P5/4q3/P5PP/R4R1K b - - 0 23",
    "solution": [
      "c7c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 843
  },
  {
    "fen": "rnbq1bkr/ppp3pp/8/4p3/4np2/1QP5/PP1P2PP/RNB2RK1 b - - 1 9",
    "solution": [
      "c8e6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 542
  },
  {
    "fen": "r4rk1/4bppp/pp2pP2/3qn3/4N3/6Q1/PPP3PP/R1B2R1K b - - 0 18",
    "solution": [
      "d5e4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 734
  },
  {
    "fen": "r1b2rk1/pp3p1p/4p1p1/2q4n/2P3N1/2Q5/P1B3PP/R4R1K b - - 4 22",
    "solution": [
      "b7b5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1190
  },
  {
    "fen": "2Q2nk1/1p3q1p/5p1B/8/3p4/PBP5/6PP/4b2K b - - 3 30",
    "solution": [
      "f7b3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 725
  },
  {
    "fen": "6R1/ppkn1Q2/2pb2r1/8/P7/3P2qP/1PPB2B1/R6K w - - 1 28",
    "solution": [
      "d2f4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1037
  },
  {
    "fen": "8/4p2p/2p1pkp1/p1Pr4/8/8/P1P2PPP/1R4K1 w - - 0 28",
    "solution": [
      "b1b2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 687
  },
  {
    "fen": "r4r2/1p1b1pp1/pq2N1k1/3pPp2/PP6/6Q1/6PP/RN5K b - - 1 20",
    "solution": [
      "g6h7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1297
  },
  {
    "fen": "r1b1k1nr/pppp2pp/2n5/8/8/2bQ4/PqP1PPPP/RN2KBNR w KQkq - 0 8",
    "solution": [
      "d3c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 998
  },
  {
    "fen": "5q1k/6p1/1p4Pp/8/2Qp4/2P4K/3r4/5R2 b - - 1 40",
    "solution": [
      "f8c8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 1043
  },
  {
    "fen": "1R1kr1r1/4b3/b7/q3P3/2QPN1P1/5N1P/2P1K3/8 b - - 0 31",
    "solution": [
      "d8d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1635
  },
  {
    "fen": "6k1/pp5p/3N2p1/3P4/8/1B5b/PP2nr1P/4R2K w - - 3 30",
    "solution": [
      "d6e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1226
  },
  {
    "fen": "1n3rk1/Q1p2ppp/3p4/1b1Pp3/8/8/PP1PBPqP/R1B1K1NR w KQ - 0 12",
    "solution": [
      "e2f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 941
  },
  {
    "fen": "4r1k1/5pbp/2r2NpB/p5P1/Pp1p3P/2p2K2/2P5/3RR3 b - - 5 35",
    "solution": [
      "g7f6"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 510
  },
  {
    "fen": "2K5/5R1B/b1pk2P1/3p4/8/2P5/1r6/8 w - - 12 52",
    "solution": [
      "c8d8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 763
  },
  {
    "fen": "8/1p3k2/p1p5/2Pp4/PP2p3/2K1Qq2/4N3/8 w - - 1 51",
    "solution": [
      "c3d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1153
  },
  {
    "fen": "r4rk1/4qpp1/7p/np1pPQ2/p1pP4/P1P5/1PB3PP/5RK1 b - - 0 23",
    "solution": [
      "e7g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1125
  },
  {
    "fen": "8/R3Np2/p5p1/7p/1P5P/5k2/r7/5K2 w - - 20 53",
    "solution": [
      "e7d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 800
  },
  {
    "fen": "2rqk2r/Q4ppp/2pb4/2P1pb2/8/1B1n1P2/PP4PP/R1B2KNR b k - 1 16",
    "solution": [
      "d6c5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1025
  },
  {
    "fen": "2R5/6k1/1p1p4/p2Pq1pp/2P4Q/2P1P2P/4r1P1/7K w - - 2 40",
    "solution": [
      "h4d4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 942
  },
  {
    "fen": "1R6/R6p/8/2pB4/3b4/2k5/Pr1r2PP/7K w - - 3 34",
    "solution": [
      "b8b2"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 930
  },
  {
    "fen": "4R1rk/5Q2/2Pp4/1q5K/6p1/2P2pP1/1P3P1P/8 w - - 0 36",
    "solution": [
      "h5h6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 913
  },
  {
    "fen": "2R3k1/1R4pr/3rp2p/p1p4n/P3P3/2P5/5KPP/8 b - - 4 31",
    "solution": [
      "d6d8"
    ],
    "title": "Мат з взяттям фігури",
    "theme": "Мат в 1",
    "rating": 424
  },
  {
    "fen": "4q1k1/7p/2pBN3/1pPp4/p1n5/2P2QP1/P4P2/6K1 b - - 0 30",
    "solution": [
      "e8e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 690
  },
  {
    "fen": "r2q1rk1/pp2n2p/2ppN1p1/1P3p2/2P1p3/P2PP1P1/5PBP/Q4RK1 b - - 0 18",
    "solution": [
      "d8d7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 983
  },
  {
    "fen": "1b6/2p5/P1B5/1P6/1K1P1Q1k/4P3/3n4/2q5 b - - 2 45",
    "solution": [
      "h4h5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1333
  },
  {
    "fen": "2r5/7R/p1p5/1kN5/1Pp3b1/P4n2/1K6/8 b - - 2 42",
    "solution": [
      "c8a8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 906
  },
  {
    "fen": "8/5pp1/p2bp2k/1p2q2p/2p2P1Q/P1P3NP/1P4PK/8 b - - 0 37",
    "solution": [
      "e5f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1402
  },
  {
    "fen": "5rk1/4q1p1/4p1P1/pp1bP3/2pPp3/P1P4Q/BP2K3/R7 b - - 4 35",
    "solution": [
      "e7g5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1187
  },
  {
    "fen": "r4r1k/1p1R2pn/p3Q3/8/8/1P6/P5PP/4Rq1K w - - 2 26",
    "solution": [
      "e1f1"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 435
  },
  {
    "fen": "3qkb1r/pb1pppp1/1p3n2/nN4B1/2r5/P3QNP1/1P2PPB1/R4RK1 b k - 4 15",
    "solution": [
      "a7a6"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 1147
  },
  {
    "fen": "r1bQ4/1p2Nr1k/3p2qp/p3p3/2B1P3/8/PPn5/1K5R b - - 1 27",
    "solution": [
      "g6e4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1075
  },
  {
    "fen": "r2r2Qk/pp4pp/2n5/q3p1N1/2B3b1/bRP1B3/P4PPP/5K1R b - - 4 19",
    "solution": [
      "d8g8"
    ],
    "title": "Задушливий мат",
    "theme": "Мат в 1",
    "rating": 826
  },
  {
    "fen": "r1b1kbnr/pppp1pp1/2n3qp/4P1B1/2Qp2PN/1B6/P2N1P1P/1R2K2R b Kkq - 2 13",
    "solution": [
      "g6h7"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 479
  },
  {
    "fen": "4r3/pppk1p1p/1n1q3B/8/3P2PQ/2PP2RP/P3r3/5RK1 w - - 7 27",
    "solution": [
      "g3f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 942
  },
  {
    "fen": "r1br2k1/p3b1pp/2p5/4pp2/8/2P1KP2/PP1NB1PP/R6R w - - 0 16",
    "solution": [
      "d2c4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1380
  },
  {
    "fen": "r2qr1k1/2p2ppp/bp1p4/p1bP4/6Q1/2B1P1P1/PP3PBP/R4RK1 b - - 2 16",
    "solution": [
      "a6f1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1089
  },
  {
    "fen": "3r3k/5R1p/p4ppB/1p1p1b2/8/P6P/1P3PP1/6K1 b - - 5 33",
    "solution": [
      "d8d6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 442
  },
  {
    "fen": "1Rb3k1/7p/2r5/4P3/5p2/3Pn1pP/1P2N1P1/6KN w - - 2 42",
    "solution": [
      "e2f4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 590
  },
  {
    "fen": "r1b1k2r/1pqp1ppp/p3p3/2b3B1/4P1n1/2NB1n1P/PPP2PP1/R2Q1RK1 w kq - 0 13",
    "solution": [
      "d1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1101
  },
  {
    "fen": "r1b3k1/ppp2ppp/2nq1B2/8/3P3Q/P1Pp1N2/2P3PP/4R1K1 b - - 0 16",
    "solution": [
      "d6f6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 836
  },
  {
    "fen": "8/5R1p/2p3k1/6p1/2B2pK1/1N2r3/P1P5/8 w - - 1 40",
    "solution": [
      "f7c7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 654
  },
  {
    "fen": "r5k1/4pp1p/1n1p2p1/2pP4/P3P3/1P1n1qPP/2QB1P2/4R1KR w - - 3 25",
    "solution": [
      "e1e3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 948
  },
  {
    "fen": "r1bqk2r/ppppnppp/8/4b2Q/2BNP3/8/PPP2PPP/RN2K2R b KQkq - 3 8",
    "solution": [
      "e5d4"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 664
  },
  {
    "fen": "8/p6k/1p3Qpp/6P1/2P3P1/1P4K1/P7/6q1 w - - 3 45",
    "solution": [
      "g3h4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1351
  },
  {
    "fen": "r4rk1/pbp2pp1/8/2pq1P1p/2p3Q1/B1P4P/P1P3P1/R4RK1 w - - 0 17",
    "solution": [
      "g4h5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1039
  },
  {
    "fen": "3R4/8/5K1k/6p1/4Pn2/7r/8/8 b - - 2 59",
    "solution": [
      "h3e3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 575
  },
  {
    "fen": "r1k1Rq1r/3p3p/pQn5/8/1pN5/8/P4PPP/6K1 b - - 6 26",
    "solution": [
      "f8e8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 822
  },
  {
    "fen": "r1bkq2r/pp1nb3/2n1p3/P1NpPp1p/2pP1Pp1/1NP5/1PB3PP/R1BQ1RK1 b - - 1 18",
    "solution": [
      "c4b3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1381
  },
  {
    "fen": "4r3/2p5/2Rb2k1/p4p2/P7/4B2P/5PP1/6K1 w - - 0 42",
    "solution": [
      "e3c5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 455
  },
  {
    "fen": "r2q1rk1/1b2bppp/1p1pp3/pN1nP3/Pn1PQB2/5N2/1P3PPP/1BRR2K1 b - - 2 17",
    "solution": [
      "d5f4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1476
  },
  {
    "fen": "rnb4k/pp3prp/2p2Q1p/b2pP3/3P3N/2PB3q/PP1N1PP1/R4RK1 w - - 2 20",
    "solution": [
      "h4f5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 834
  },
  {
    "fen": "3r1rk1/p3nppp/1ppq2b1/8/2P5/2Q2PP1/PB2P1BP/R4RK1 b - - 2 17",
    "solution": [
      "d6d2"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 620
  },
  {
    "fen": "2kr2r1/p2p1p1p/1p2p3/4qp2/2P2P2/P1N4b/1PQ1Bb1P/3R3K w - - 0 25",
    "solution": [
      "f4e5"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1236
  },
  {
    "fen": "5r1k/6bp/3p4/P2q4/1P6/4P1P1/6QP/2R2q1K w - - 0 35",
    "solution": [
      "c1f1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1010
  },
  {
    "fen": "6k1/R7/6K1/5p2/5P2/4r3/8/8 b - - 0 69",
    "solution": [
      "e3f3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1255
  },
  {
    "fen": "3rkb1r/ppN1p1pp/8/2p5/5PQ1/P2q4/1PnP2PP/1RB2R1K b - - 7 16",
    "solution": [
      "e8f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1144
  },
  {
    "fen": "r4rk1/pQ5p/4ppnB/8/3N4/3q3P/PP4P1/R6K b - - 1 20",
    "solution": [
      "d3d4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 835
  },
  {
    "fen": "4r1k1/ppp2ppp/4qn2/6r1/4P3/P1N1Q2P/1PP1BP2/R4R1K w - - 3 19",
    "solution": [
      "f2f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 847
  },
  {
    "fen": "6rk/p6p/q4b2/5p2/1P2pP2/P3P1B1/2RQ3P/7K w - - 4 38",
    "solution": [
      "d2d5"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 462
  },
  {
    "fen": "8/5p1k/p6p/4q3/4P3/P6Q/5r1P/6RK w - - 1 32",
    "solution": [
      "h3e3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 595
  },
  {
    "fen": "2r3k1/1B2ppbp/pq4p1/4P3/3r1P2/P4R2/1P2Q1PP/R5K1 w - - 1 21",
    "solution": [
      "b7c8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1522
  },
  {
    "fen": "r5k1/pp1qnrp1/2nbpN1B/2p1p3/3pP1QN/P2P4/1PP2PPP/R3K2R b KQ - 2 14",
    "solution": [
      "f7f6"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 613
  },
  {
    "fen": "5R2/5ppk/1p6/2pp3p/5P2/B1P1n1PN/PP2qPKP/7B w - - 7 28",
    "solution": [
      "g2g1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 577
  },
  {
    "fen": "5rk1/1b3B2/4pB2/1p1pP3/1PpP4/2P2p2/5K2/7R b - - 0 33",
    "solution": [
      "f8f7"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1033
  },
  {
    "fen": "3rk1nr/p1p2ppp/1p6/8/2Q1P3/4PRP1/PqP3BP/RN5K b k - 0 17",
    "solution": [
      "b2a1"
    ],
    "title": "Мат на f2/f7",
    "theme": "Мат в 1",
    "rating": 629
  },
  {
    "fen": "1r3rk1/p4pbp/1p4p1/2pq4/3P1B2/P5P1/1P2NPKP/1R1QnR2 w - - 5 20",
    "solution": [
      "g2g1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1042
  },
  {
    "fen": "r2q1rk1/1p1nbp2/p2p2p1/3P2P1/3B4/3Q1P2/PPP5/R3KB1R b KQ - 0 18",
    "solution": [
      "e7g5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1002
  },
  {
    "fen": "2k5/2n5/1p1n1N2/1p1PN3/2pK4/P1P5/1P6/8 w - - 3 51",
    "solution": [
      "f6e4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1184
  },
  {
    "fen": "r2qr1k1/ppp3bp/5pp1/4Nn2/1PQP4/P7/1B3PPP/3R1RK1 b - - 1 21",
    "solution": [
      "g8f8"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1218
  },
  {
    "fen": "4R3/1br2Q1k/p1pq2pp/2p5/6Nb/2NP4/PPP3P1/5R1K b - - 1 23",
    "solution": [
      "c7f7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1233
  },
  {
    "fen": "5k2/5Rr1/1p1N2Qp/3nP3/p2q4/8/6PP/7K b - - 0 43",
    "solution": [
      "g7f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 707
  },
  {
    "fen": "r1bq1r1k/1n4pp/2p5/1p2N2Q/1P6/PB1n3P/3N1bP1/R3R2K b - - 1 22",
    "solution": [
      "d3e1"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1584
  },
  {
    "fen": "r2q1r1k/ppp1bp2/2np1n2/4p1Q1/2B1P3/2NP1P1P/PPP2P2/R3K1R1 b Q - 0 13",
    "solution": [
      "f6h7"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 887
  },
  {
    "fen": "r1b1r1k1/ppp2pp1/3p1q1p/2b1p1n1/4P1P1/2PP1N1P/PP1N1P2/R1BQK2R w KQ - 7 14",
    "solution": [
      "f3g5"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 604
  },
  {
    "fen": "r1b3k1/p4p1p/2p3p1/3n4/8/6BP/P3qPP1/Q3R1K1 b - - 1 19",
    "solution": [
      "e2d3"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 651
  },
  {
    "fen": "8/1R5p/6k1/2p2p2/2Pb2p1/R4KP1/7P/4r3 w - - 0 41",
    "solution": [
      "f3g2"
    ],
    "title": "Оперний мат",
    "theme": "Мат в 1",
    "rating": 1225
  },
  {
    "fen": "4k1r1/3p1p2/p3bB2/1p1r1q2/1P5p/2Q5/1P3PPP/4R1K1 b - - 4 27",
    "solution": [
      "d7d6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1678
  },
  {
    "fen": "2kr3r/ppq2p2/2n1p3/6pp/1PPb1Pn1/P2P1B1P/R5P1/1NBQ1R1K w - - 0 16",
    "solution": [
      "h3g4"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 963
  },
  {
    "fen": "1k1r1b1r/ppp2ppp/1qn3b1/4P1Q1/2BP4/1PN3P1/P4P1P/R1B1R1K1 b - - 0 18",
    "solution": [
      "c6d4"
    ],
    "title": "Мат при атаці на ферзевому фланзі",
    "theme": "Мат в 1",
    "rating": 720
  },
  {
    "fen": "r2qk2r/ppp2ppp/2n5/4P3/4nN2/4Pb2/PPP3PP/R2QKB1R w KQkq - 0 10",
    "solution": [
      "d1f3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 915
  },
  {
    "fen": "6k1/2p3p1/2P5/6N1/1R2p1P1/6K1/5P2/4rb2 b - - 3 35",
    "solution": [
      "e4e3"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 742
  },
  {
    "fen": "8/p7/3k1p2/3p3B/1PpK3P/r7/4R3/8 w - - 1 53",
    "solution": [
      "h5g4"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 916
  },
  {
    "fen": "2r2rBk/5pp1/3p4/8/Pb3qP1/2P5/2Q4R/4K3 b - - 9 36",
    "solution": [
      "h8g8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 925
  },
  {
    "fen": "2r2rk1/1b1nqpp1/p1p1p2p/1p2P3/3PQ3/3B1N2/PP3PPP/2R2RK1 b - - 0 18",
    "solution": [
      "d7b6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 519
  },
  {
    "fen": "r2b1rk1/2qn1ppp/2p5/1pPp1N2/1P1Pp1QP/4P3/5PPN/R4RK1 b - - 2 23",
    "solution": [
      "a8a1"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1287
  },
  {
    "fen": "6k1/p3qppp/1p2p3/1N6/P1r1n3/3QP1P1/5PKP/R7 b - - 1 24",
    "solution": [
      "e7b7"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 537
  },
  {
    "fen": "2r2rk1/8/p3p1Q1/8/1b5P/2P5/1P3q2/2K3R1 b - - 0 29",
    "solution": [
      "g8h8"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 894
  },
  {
    "fen": "1n1r3r/1Qbk1ppp/P1p1pn2/7q/1P6/2N5/2PPNPPP/R1B2RK1 w - - 1 18",
    "solution": [
      "a6a7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 913
  },
  {
    "fen": "3rr1k1/pp3p2/5PB1/8/6nq/1PP3R1/2Q3PP/5RK1 w - - 1 29",
    "solution": [
      "g6f5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 749
  },
  {
    "fen": "8/5k1Q/1q1P2p1/1p1p1b2/2pP4/8/rP3P2/2R3K1 b - - 1 38",
    "solution": [
      "f7f6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1306
  },
  {
    "fen": "3K4/2R5/3Pk3/8/8/6r1/6P1/8 w - - 2 54",
    "solution": [
      "d6d7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1184
  },
  {
    "fen": "r2qkb1r/2p1nppp/p2p4/1p2N3/4P1b1/1B6/PPPP2PP/RNBQ1RK1 b kq - 0 9",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 1258
  },
  {
    "fen": "r1q1k1r1/1b3p1p/p1nPpQp1/3pN3/2pP4/8/P4PPP/R1B2RK1 b q - 1 20",
    "solution": [
      "c6e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1082
  },
  {
    "fen": "1br2rk1/ppq2ppp/2n1p3/6N1/3P2b1/3QPN2/PP2B1PP/R4RK1 b - - 6 15",
    "solution": [
      "g4f3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 845
  },
  {
    "fen": "4r1kR/8/8/pp3K2/1p1r4/8/P2n1P2/7R b - - 1 41",
    "solution": [
      "g8f7"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1055
  },
  {
    "fen": "8/pb1R2p1/7p/1qp1p3/6Q1/3R4/1P3kPP/7K w - - 10 41",
    "solution": [
      "g4d1"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1151
  },
  {
    "fen": "2k4r/2p2p2/pp2pn2/3p3q/3P2n1/2P1PQB1/PP3PKN/6R1 w - - 3 27",
    "solution": [
      "h2g4"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1506
  },
  {
    "fen": "2r3k1/pp1b1p1r/4pPpq/3pP3/3P2Q1/2P2R2/P1B4P/5RK1 w - - 7 25",
    "solution": [
      "f3g3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 875
  },
  {
    "fen": "4N3/7R/K2kpp2/P3p3/4P1P1/5r2/7p/6b1 b - - 3 45",
    "solution": [
      "d6c6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 709
  },
  {
    "fen": "6k1/3R4/3B3p/3P1p2/2pb4/3nqP2/1NQ3PP/5K2 w - - 1 35",
    "solution": [
      "b2c4"
    ],
    "title": "Мат (рівень майстра)",
    "theme": "Мат в 1",
    "rating": 1675
  },
  {
    "fen": "r2q1r1k/ppp3pp/5n2/b7/2Bp1NbQ/2P5/PP4PP/R1B2R1K b - - 0 18",
    "solution": [
      "d4c3"
    ],
    "title": "Мат в дебюті",
    "theme": "Мат в 1",
    "rating": 926
  },
  {
    "fen": "r1bq3r/ppnp1p2/3kp3/2p1QR1p/8/3P4/PPP3PP/RNb3K1 b - - 1 14",
    "solution": [
      "d6c6"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 922
  },
  {
    "fen": "5rk1/6p1/nq2pb1p/3p4/1P1P4/P5P1/4PnBP/1N1QR1K1 w - - 0 23",
    "solution": [
      "g1f2"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 940
  },
  {
    "fen": "3r1k2/p5pp/2p2p2/P7/1Rq5/8/1P3PPP/6K1 w - - 0 32",
    "solution": [
      "b4c4"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 520
  },
  {
    "fen": "r3kb1r/2q1p1p1/p2pPn1p/1p2Q3/8/3B4/PP3PPP/R1BR2K1 b kq - 0 15",
    "solution": [
      "d6e5"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 889
  },
  {
    "fen": "1q2k2r/3bn3/4ppp1/p1Q5/1r6/4P3/PP2BPPP/RNB2RK1 w k - 2 18",
    "solution": [
      "b2b3"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1033
  },
  {
    "fen": "1n3rk1/Q4ppp/1p6/6bb/4N3/P3P1R1/1q1B1P1P/R3K3 w Q - 0 21",
    "solution": [
      "d2c3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1363
  },
  {
    "fen": "1r2R1k1/p4ppp/1p6/3r1p2/P2P4/2P1R3/1P4PP/6K1 b - - 1 30",
    "solution": [
      "b8e8"
    ],
    "title": "Мат на останній горизонталі",
    "theme": "Мат в 1",
    "rating": 400
  },
  {
    "fen": "r4rk1/ppp2ppp/4b3/4P1q1/3RQ1Pn/2B4P/P1B2P2/5RK1 b - - 2 19",
    "solution": [
      "g5e5"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1622
  },
  {
    "fen": "r5r1/p4pnk/4P3/1pp2pR1/2p4P/2K1PN2/PP6/6R1 b - - 0 32",
    "solution": [
      "g7e6"
    ],
    "title": "Мат в ендшпілі",
    "theme": "Мат в 1",
    "rating": 1175
  },
  {
    "fen": "r1bq2k1/pp3rp1/2p2nQ1/7p/2BpP3/P1P4P/5P2/R1B1K1R1 b Q - 0 19",
    "solution": [
      "d8e7"
    ],
    "title": "Мат при атаці на короля",
    "theme": "Мат в 1",
    "rating": 1623
  },
  {
    "fen": "3k1r2/ppp4q/3bp3/4p1N1/3pP1P1/3P1K2/PPPQ1P1r/R6R w - - 10 25",
    "solution": [
      "f3g3"
    ],
    "title": "Мат в 1 хід",
    "theme": "Мат в 1",
    "rating": 1190
  }
];
