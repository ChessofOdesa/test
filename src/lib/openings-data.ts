export interface Opening {
  name: string;
  eco: string;
  moves: string[];
  fen: string;
  description: string;
  popularity: number;
  difficulty: number;
  style: "aggressive" | "solid" | "positional" | "tactical" | "universal";
  lines: OpeningLine[];
}

export interface OpeningLine {
  name: string;
  moves: string[];
  fen: string;
  evaluation: string;
  comment: string;
}

export const OPENINGS: Opening[] = [
  // ============ ВІДКРИТІ ДЕБЮТИ (1.e4 e5) ============
  {
    name: "Італійська партія",
    eco: "C50",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    description: "Класичний дебют, один з найстаріших. Білі швидко розвивають слона і атакують f7.",
    popularity: 5,
    difficulty: 2,
    style: "tactical",
    lines: [
      { name: "Гіукко Піано", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"], fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", evaluation: "=", comment: "Спокійна рівна гра." },
      { name: "Захист двох коней", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"], fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", evaluation: "+=", comment: "Чорні контратакують e4." },
      { name: "Атака Фріда", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"], fen: "r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4", evaluation: "+=", comment: "Агресивний варіант з Nxf7." }
    ]
  },
  {
    name: "Гамбіт Еванса",
    eco: "C51",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"],
    fen: "r1bqk1nr/pppp1ppp/2n5/2b1p3/1PB1P3/5N2/P1PP1PPP/RNBQK2R b KQkq b3 0 4",
    description: "Гамбітний варіант Італійської. Білі жертвують пішака за темпи та ініціативу.",
    popularity: 3,
    difficulty: 3,
    style: "aggressive",
    lines: [
      { name: "Прийнятий гамбіт", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4"], fen: "r1bqk1nr/pppp1ppp/2n5/4p3/1bB1P3/5N2/P1PP1PPP/RNBQK2R w KQkq - 0 5", evaluation: "+=", comment: "Білі отримують ініціативу після c3." }
    ]
  },
  {
    name: "Шотландська партія",
    eco: "C45",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4"],
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq d3 0 3",
    description: "Білі негайно розкривають центр. Динамічна гра з раннім контактом.",
    popularity: 3,
    difficulty: 2,
    style: "tactical",
    lines: [
      { name: "Шотландський гамбіт", moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"], fen: "r1bqkbnr/pppp1ppp/2n5/8/2BpP3/5N2/PPP2PPP/RNBQK2R b KQkq - 1 4", evaluation: "=", comment: "Гамбітне продовження — білі жертвують пішака за розвиток." }
    ]
  },
  {
    name: "Партія чотирьох коней",
    eco: "C47",
    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
    description: "Симетричний розвиток. Солідна, але може стати нудною при нерішучій грі.",
    popularity: 2,
    difficulty: 2,
    style: "solid",
    lines: [
      { name: "Іспанський варіант", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5"], fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 5 4", evaluation: "=", comment: "Перехід в іспанські мотиви." }
    ]
  },
  {
    name: "Віденська партія",
    eco: "C25",
    moves: ["e4", "e5", "Nc3"],
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 1 2",
    description: "Гнучкий дебют, що може перейти у гамбіт (f4) або позиційну гру.",
    popularity: 2,
    difficulty: 2,
    style: "universal",
    lines: [
      { name: "Віденський гамбіт", moves: ["e4", "e5", "Nc3", "Nf6", "f4"], fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq f3 0 3", evaluation: "=", comment: "Гамбітне продовження з f4." }
    ]
  },
  {
    name: "Королівський гамбіт",
    eco: "C30",
    moves: ["e4", "e5", "f4"],
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4PP2/8/PPPP2PP/RNBQKBNR b KQkq f3 0 2",
    description: "Романтичний гамбіт! Білі жертвують пішака f за відкриття ліній і швидкий розвиток.",
    popularity: 3,
    difficulty: 3,
    style: "aggressive",
    lines: [
      { name: "Прийнятий", moves: ["e4", "e5", "f4", "exf4"], fen: "rnbqkbnr/pppp1ppp/8/8/4Pp2/8/PPPP2PP/RNBQKBNR w KQkq - 0 3", evaluation: "=", comment: "Класична лінія. Білі грають Nf3 і намагаються відіграти пішака." },
      { name: "Відхилений (Фалькбеєр)", moves: ["e4", "e5", "f4", "d5"], fen: "rnbqkbnr/ppp2ppp/8/3pp3/4PP2/8/PPPP2PP/RNBQKBNR w KQkq d6 0 3", evaluation: "=", comment: "Контргамбіт Фалькбеєра." }
    ]
  },
  {
    name: "Дебют слона",
    eco: "C23",
    moves: ["e4", "e5", "Bc4"],
    fen: "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2",
    description: "Простий розвиток слона. Менш амбітний ніж Nf3, але солідний.",
    popularity: 2,
    difficulty: 1,
    style: "solid",
    lines: []
  },
  {
    name: "Захист Петрова",
    eco: "C42",
    moves: ["e4", "e5", "Nf3", "Nf6"],
    fen: "rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    description: "Солідний симетричний захист. Чорні дзеркально копіюють розвиток білих.",
    popularity: 3,
    difficulty: 3,
    style: "solid",
    lines: [
      { name: "Класичний варіант", moves: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6"], fen: "rnbqkb1r/ppp2ppp/3p1n2/4N3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4", evaluation: "=", comment: "Головна лінія." }
    ]
  },
  {
    name: "Захист Філідора",
    eco: "C41",
    moves: ["e4", "e5", "Nf3", "d6"],
    fen: "rnbqkbnr/ppp2ppp/3p4/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
    description: "Старовинний захист. Чорні зміцнюють e5 через d6, але обмежують слона.",
    popularity: 2,
    difficulty: 2,
    style: "solid",
    lines: []
  },
  {
    name: "Іспанська партія (Руй Лопес)",
    eco: "C60",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    fen: "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    description: "Найпопулярніший дебют на вищому рівні. Білі тиснуть на коня c6.",
    popularity: 5,
    difficulty: 4,
    style: "positional",
    lines: [
      { name: "Захист Морфі", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"], fen: "r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4", evaluation: "=", comment: "Найпопулярніше продовження." },
      { name: "Берлінський захист", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"], fen: "r1bqkb1r/pppp1ppp/2n2n2/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", evaluation: "=", comment: "\"Берлінська стіна\". Часто веде до ендшпілю." },
      { name: "Маршалівський гамбіт", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "O-O", "c3", "d5"], fen: "r1bq1rk1/2p1bppp/p1n2n2/1p1pp3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - d6 0 9", evaluation: "=", comment: "Гамбітна атака Маршалла." }
    ]
  },

  // ============ НАПІВВІДКРИТІ ДЕБЮТИ (1.e4 …) ============
  {
    name: "Сицилійський захист",
    eco: "B20",
    moves: ["e4", "c5"],
    fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2",
    description: "Найпопулярніший захист на 1.e4. Асиметрична гостра боротьба.",
    popularity: 5,
    difficulty: 4,
    style: "tactical",
    lines: [
      { name: "Варіант Найдорфа", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], fen: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6", evaluation: "=", comment: "Улюблений варіант Фішера і Каспарова." },
      { name: "Варіант Дракона", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], fen: "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6", evaluation: "=", comment: "Чорні фіанкетують слона. Югославська атака — найгостріша." },
      { name: "Схевенінген", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"], fen: "rnbqkb1r/pp3ppp/3ppn2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6", evaluation: "=", comment: "Гнучка система. Чорні готують a6, Be7." }
    ]
  },
  {
    name: "Варіант Алапіна (Сицилійська)",
    eco: "B22",
    moves: ["e4", "c5", "c3"],
    fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b KQkq - 0 2",
    description: "Анти-сицилійський варіант. Білі готують d4 з підтримкою c3.",
    popularity: 3,
    difficulty: 2,
    style: "positional",
    lines: []
  },
  {
    name: "Атака Гранд-Прі (Сицилійська)",
    eco: "B21",
    moves: ["e4", "c5", "Nc3", "Nc6", "f4"],
    fen: "r1bqkbnr/pp1ppppp/2n5/2p5/4PP2/2N5/PPPP2PP/R1BQKBNR b KQkq f3 0 3",
    description: "Агресивний підхід проти Сицілійської з f4 та атакою на королівському фланзі.",
    popularity: 2,
    difficulty: 3,
    style: "aggressive",
    lines: []
  },
  {
    name: "Французький захист",
    eco: "C00",
    moves: ["e4", "e6"],
    fen: "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    description: "Солідний захист. Чорні будують міцну структуру, але обмежують білопільного слона.",
    popularity: 4,
    difficulty: 3,
    style: "solid",
    lines: [
      { name: "Варіант просування", moves: ["e4", "e6", "d4", "d5", "e5"], fen: "rnbqkbnr/ppp2ppp/4p3/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3", evaluation: "=", comment: "Білі захоплюють простір." },
      { name: "Варіант Вінавера", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"], fen: "rnbqk1nr/ppp2ppp/4p3/3p4/1b1PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4", evaluation: "=", comment: "Гострий варіант — тиск на c3." },
      { name: "Варіант Тарраша", moves: ["e4", "e6", "d4", "d5", "Nd2"], fen: "rnbqkbnr/ppp2ppp/4p3/3p4/3PP3/8/PPPN1PPP/R1BQKBNR b KQkq - 1 3", evaluation: "=", comment: "Позиційний підхід — без подвоєння пішаків." }
    ]
  },
  {
    name: "Захист Каро-Канн",
    eco: "B10",
    moves: ["e4", "c6"],
    fen: "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    description: "Один з найсолідніших захистів. Чорні готують d5 з підтримкою c6.",
    popularity: 4,
    difficulty: 2,
    style: "solid",
    lines: [
      { name: "Класичний варіант", moves: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"], fen: "rn1qkbnr/pp2pppp/2p5/5b2/3PN3/8/PPP2PPP/R1BQKBNR w KQkq - 1 5", evaluation: "=", comment: "Головна лінія — активний розвиток слона." },
      { name: "Варіант Панова", moves: ["e4", "c6", "d4", "d5", "exd5", "cxd5", "c4"], fen: "rnbqkbnr/pp2pppp/8/3p4/2PP4/8/PP3PPP/RNBQKBNR b KQkq c3 0 4", evaluation: "=", comment: "Перехід у ферзевий гамбіт." }
    ]
  },
  {
    name: "Захист Алехіна",
    eco: "B02",
    moves: ["e4", "Nf6"],
    fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    description: "Провокаційний захист. Чорні запрошують білих просувати пішаки, щоб потім контратакувати.",
    popularity: 2,
    difficulty: 3,
    style: "tactical",
    lines: [
      { name: "Варіант 4-х пішаків", moves: ["e4", "Nf6", "e5", "Nd5", "d4", "d6", "c4", "Nb6", "f4"], fen: "rnbqkb1r/ppp1pppp/1n1p4/4P3/2PP1P2/8/PP4PP/RNBQKBNR b KQkq f3 0 5", evaluation: "=", comment: "Білі будують масивний центр." }
    ]
  },
  {
    name: "Захист Пірца-Уфімцева",
    eco: "B07",
    moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"],
    fen: "rnbqkb1r/ppp1pp1p/3p1np1/8/3PP3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 4",
    description: "Гіпермодерний захист. Чорні фіанкетують слона і контратакують центр.",
    popularity: 3,
    difficulty: 3,
    style: "tactical",
    lines: []
  },
  {
    name: "Модерн (1...g6)",
    eco: "B06",
    moves: ["e4", "g6"],
    fen: "rnbqkbnr/pppppp1p/6p1/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    description: "Гіпермодерний підхід. Чорні фіанкетують без Nf6, гнучко вичікуючи.",
    popularity: 2,
    difficulty: 3,
    style: "positional",
    lines: []
  },
  {
    name: "Скандинавський захист",
    eco: "B01",
    moves: ["e4", "d5"],
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2",
    description: "Рішучий захист — чорні негайно атакують e4. Після exd5 Qxd5 ферзь виходить рано.",
    popularity: 3,
    difficulty: 2,
    style: "tactical",
    lines: [
      { name: "Варіант з Qd5", moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5"], fen: "rnb1kbnr/ppp1pppp/8/q7/8/2N5/PPPP1PPP/R1BQKBNR w KQkq - 2 4", evaluation: "+=", comment: "Головна лінія. Білі розвиваються з темпами." }
    ]
  },
  {
    name: "Захист Німцовича (1...Nc6)",
    eco: "B00",
    moves: ["e4", "Nc6"],
    fen: "r1bqkbnr/pppppppp/2n5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    description: "Рідкісний захист. Чорні розвивають коня і готують e5 або d5.",
    popularity: 1,
    difficulty: 2,
    style: "universal",
    lines: []
  },

  // ============ ЗАКРИТІ ДЕБЮТИ (1.d4) ============
  {
    name: "Ферзевий гамбіт",
    eco: "D06",
    moves: ["d4", "d5", "c4"],
    fen: "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq c3 0 2",
    description: "Один з основних дебютів. Білі пропонують пішака для контролю центру.",
    popularity: 5,
    difficulty: 3,
    style: "positional",
    lines: [
      { name: "Прийнятий ферзевий гамбіт", moves: ["d4", "d5", "c4", "dxc4"], fen: "rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", evaluation: "=", comment: "Чорні беруть пішака — білі легко відіграють." },
      { name: "Відхилений ферзевий гамбіт", moves: ["d4", "d5", "c4", "e6"], fen: "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", evaluation: "=", comment: "Солідний вибір." },
      { name: "Слов'янський захист", moves: ["d4", "d5", "c4", "c6"], fen: "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3", evaluation: "=", comment: "Солідний. Слон може вийти на f5." }
    ]
  },
  {
    name: "Напівслов'янський захист",
    eco: "D43",
    moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"],
    fen: "rnbqkb1r/pp3ppp/2p1pn2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 5",
    description: "Гібрид Слов'янського та Відхиленого ФГ. Дуже складний теоретично.",
    popularity: 4,
    difficulty: 4,
    style: "positional",
    lines: [
      { name: "Гамбіт Ботвиника", moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6", "Bg5", "dxc4", "e4"], fen: "rnbqkb1r/pp3ppp/2p1pn2/6B1/2pPP3/2N2N2/PP3PPP/R2QKB1R b KQkq - 0 6", evaluation: "=", comment: "Гостра теоретична лінія." }
    ]
  },
  {
    name: "Захист Чигоріна",
    eco: "D07",
    moves: ["d4", "d5", "c4", "Nc6"],
    fen: "r1bqkbnr/ppp1pppp/2n5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 1 3",
    description: "Рідкісний, але динамічний захист — кінь розвивається на c6.",
    popularity: 2,
    difficulty: 3,
    style: "tactical",
    lines: []
  },
  {
    name: "Контргамбіт Альбіна",
    eco: "D08",
    moves: ["d4", "d5", "c4", "e5"],
    fen: "rnbqkbnr/ppp2ppp/8/3pp3/2PP4/8/PP2PPPP/RNBQKBNR w KQkq e6 0 3",
    description: "Агресивний контргамбіт — чорні жертвують пішака за ініціативу.",
    popularity: 1,
    difficulty: 3,
    style: "aggressive",
    lines: []
  },

  // ============ ІНДІЙСЬКІ ЗАХИСТИ ============
  {
    name: "Захист Німцовича",
    eco: "E20",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PP2PPPP/R1BQKBNR w KQkq - 2 4",
    description: "Гіпермодерний дебют. Чорні контролюють центр фігурами.",
    popularity: 4,
    difficulty: 4,
    style: "positional",
    lines: [
      { name: "Класичний варіант", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "Qc2"], fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/2N5/PPQ1PPPP/R1B1KBNR b KQkq - 3 4", evaluation: "=", comment: "Білі запобігають подвоєнню пішаків." },
      { name: "Варіант Самиша", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "a3"], fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/P1N5/1P2PPPP/R1BQKBNR b KQkq - 0 4", evaluation: "=", comment: "Білі негайно запитують слона." }
    ]
  },
  {
    name: "Королівсько-Індійський захист",
    eco: "E60",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    fen: "rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N5/PP3PPP/R1BQKBNR w KQkq - 0 5",
    description: "Улюблений захист Фішера та Каспарова. Контратака на королівському фланзі.",
    popularity: 5,
    difficulty: 4,
    style: "aggressive",
    lines: [
      { name: "Класична система", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2"], fen: "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 3 6", evaluation: "=", comment: "Головна лінія — боротьба за e5 та d5." },
      { name: "Варіант Самиша", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3"], fen: "rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N2P2/PP4PP/R1BQKBNR b KQkq - 0 5", evaluation: "=", comment: "Агресивний план з Be3 і Qd2." }
    ]
  },
  {
    name: "Захист Грюнфельда",
    eco: "D70",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
    fen: "rnbqkb1r/ppp1pp1p/5np1/3p4/2PP4/2N5/PP2PPPP/R1BQKBNR w KQkq d6 0 4",
    description: "Чорні дозволяють білим центр, потім руйнують його. Улюблений Каспарова.",
    popularity: 4,
    difficulty: 5,
    style: "tactical",
    lines: [
      { name: "Розмінний варіант", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5"], fen: "rnbqkb1r/ppp1pp1p/6p1/8/3P4/2N5/PP2PPPP/R1BQKBNR w KQkq - 0 5", evaluation: "=", comment: "Білі будують центр e4+d4." }
    ]
  },
  {
    name: "Ферзевий індійський захист",
    eco: "E12",
    moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
    fen: "rnbqkb1r/p1pp1ppp/1p2pn2/8/2PP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 0 4",
    description: "Чорні фіанкетують ферзевого слона — контроль діагоналі a8-h1.",
    popularity: 3,
    difficulty: 3,
    style: "positional",
    lines: []
  },
  {
    name: "Бого-Індійський захист",
    eco: "E11",
    moves: ["d4", "Nf6", "c4", "e6", "Nf3", "Bb4+"],
    fen: "rnbqk2r/pppp1ppp/4pn2/8/1bPP4/5N2/PP2PPPP/RNBQKB1R w KQkq - 2 4",
    description: "Чорні дають шах слоном і змушують білих визначитись з центром.",
    popularity: 3,
    difficulty: 3,
    style: "solid",
    lines: []
  },

  // ============ ФЛАНГОВІ ДЕБЮТИ ============
  {
    name: "Англійський дебют",
    eco: "A10",
    moves: ["c4"],
    fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 1",
    description: "Гнучкий дебют. Контроль d5 без d4. Може перейти у багато систем.",
    popularity: 3,
    difficulty: 3,
    style: "universal",
    lines: [
      { name: "Зворотна Сицилійська", moves: ["c4", "e5"], fen: "rnbqkbnr/pppp1ppp/8/4p3/2P5/8/PP1PPPPP/RNBQKBNR w KQkq e6 0 2", evaluation: "=", comment: "Як Сицілійська, але з темпом більше." },
      { name: "Симетричний", moves: ["c4", "c5"], fen: "rnbqkbnr/pp1ppppp/8/2p5/2P5/8/PP1PPPPP/RNBQKBNR w KQkq c6 0 2", evaluation: "=", comment: "Симетрична боротьба за центр." }
    ]
  },
  {
    name: "Дебют Реті",
    eco: "A09",
    moves: ["Nf3"],
    fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq - 1 1",
    description: "Гіпермодерний дебют. Білі контролюють центр здалеку.",
    popularity: 3,
    difficulty: 3,
    style: "positional",
    lines: []
  },
  {
    name: "Дебют Берда",
    eco: "A02",
    moves: ["f4"],
    fen: "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq f3 0 1",
    description: "Голландська за білих. Контроль e5 через f4.",
    popularity: 1,
    difficulty: 3,
    style: "aggressive",
    lines: [
      { name: "Гамбіт Фрома", moves: ["f4", "e5"], fen: "rnbqkbnr/pppp1ppp/8/4p3/5P2/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2", evaluation: "=", comment: "Контргамбіт — гостра гра." }
    ]
  },
  {
    name: "Дебют Ларсена",
    eco: "A01",
    moves: ["b3"],
    fen: "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR b KQkq - 0 1",
    description: "Фіанкето ферзевого слона. Гнучкий позиційний підхід.",
    popularity: 1,
    difficulty: 3,
    style: "positional",
    lines: []
  },
  {
    name: "Сокольський (Орангутан)",
    eco: "A00",
    moves: ["b4"],
    fen: "rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq b3 0 1",
    description: "Ексцентричний дебют. Контроль c5 та фланговий розвиток.",
    popularity: 1,
    difficulty: 2,
    style: "tactical",
    lines: []
  },
  {
    name: "Гроб (1.g4)",
    eco: "A00",
    moves: ["g4"],
    fen: "rnbqkbnr/pppppppp/8/8/6P1/8/PPPPPP1P/RNBQKBNR b KQkq g3 0 1",
    description: "Провокаційний дебют. Слабка позиція короля, але несподіванки для суперника.",
    popularity: 1,
    difficulty: 1,
    style: "aggressive",
    lines: []
  },
  {
    name: "Лондонська система",
    eco: "D00",
    moves: ["d4", "d5", "Bf4"],
    fen: "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
    description: "Універсальний дебют. Простий план: Bf4, e3, Nf3, Bd3, O-O.",
    popularity: 4,
    difficulty: 1,
    style: "solid",
    lines: [
      { name: "Основна лінія", moves: ["d4", "d5", "Bf4", "Nf6", "e3", "c5"], fen: "rnbqkb1r/pp2pppp/5n2/2pp4/3P1B2/4P3/PPP2PPP/RN1QKBNR w KQkq c6 0 4", evaluation: "=", comment: "Стандартна позиція Лондонської." }
    ]
  },
];

export function getOpeningByMoves(movesSan: string[]): Opening | null {
  let bestMatch: Opening | null = null;
  let bestLength = 0;

  for (const opening of OPENINGS) {
    const len = opening.moves.length;
    if (len > movesSan.length) continue;
    const match = opening.moves.every((m, i) => m === movesSan[i]);
    if (match && len > bestLength) {
      bestMatch = opening;
      bestLength = len;
    }
    for (const line of opening.lines) {
      const lineLen = line.moves.length;
      if (lineLen > movesSan.length) continue;
      const lineMatch = line.moves.every((m, i) => m === movesSan[i]);
      if (lineMatch && lineLen > bestLength) {
        bestMatch = opening;
        bestLength = lineLen;
      }
    }
  }

  return bestMatch;
}

export function getOpeningRecommendations(rating: number): Opening[] {
  if (rating < 1200) {
    return OPENINGS.filter(o => o.difficulty <= 2);
  } else if (rating < 1600) {
    return OPENINGS.filter(o => o.difficulty <= 3);
  } else if (rating < 2000) {
    return OPENINGS.filter(o => o.difficulty <= 4);
  }
  return OPENINGS;
}
