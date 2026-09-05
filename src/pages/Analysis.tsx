import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Chess, type PieceSymbol } from "chess.js";
import { Chessboard } from "react-chessboard";
import type { BoardPosition, Piece, Square } from "react-chessboard/dist/chessboard/types";
import { useSearchParams } from "react-router-dom";
import {
  Archive,
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CloudUpload,
  Compass,
  Copy,
  FolderClock,
  FlipVertical,
  Layers3,
  Link2,
  Loader2,
  PencilLine,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings,
  UserRound,
  Upload,
} from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import EvalBar from "@/components/EvalBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BOARD_THEMES, useBoardSettings, type BoardTheme } from "@/contexts/BoardSettingsContext";
import { playChessSound, type ChessSoundType } from "@/hooks/useChessSounds";
import { OPENINGS, type Opening, type OpeningLine } from "@/lib/openings-data";
import { parsePGN } from "@/lib/pgnParser";
import analyzeFenWithStockfish, { type AnalyzeResult, type EngineBackend, type EngineLine } from "@/lib/stockfish";
import {
  buildGrowthSummary,
  markNotebookEntryStatus,
  readGrowthState,
  recordGameReview,
  type GrowthMoveClassification,
  type NotebookStatus,
  type ReviewedMove,
} from "@/lib/growth-system";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MoveNag = "!!" | "!" | "!?" | "?!" | "?" | "??" | null;
type MoveClassification = "best" | "excellent" | "good" | "inaccuracy" | "mistake" | "blunder";
type AnalysisArrow = [Square, Square, string?];
type GamePhase = "Opening" | "Middlegame" | "Endgame";

type AnalysisMoveNode = {
  id: string;
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  comment: string;
  nag: MoveNag;
  classification: MoveClassification | null;
  evalLoss: number | null;
  engineEval: number | null;
  engineMate: number | null;
  bestMoveSan: string | null;
  alternatives: string[];
  explanation: string;
  arrows: AnalysisArrow[];
  children: AnalysisMoveNode[];
};

type AnalysisSnapshot = {
  headers: Record<string, string>;
  rootFen: string;
  currentPath: number[] | null;
  mainline: AnalysisMoveNode[];
};

type AnalysisRecord = AnalysisSnapshot & {
  historyStack: AnalysisSnapshot[];
  futureStack: AnalysisSnapshot[];
};

type EngineSummary = {
  backend?: EngineBackend;
  fen: string;
  scoreCp: number | null;
  scoreMate: number | null;
  numericScore: number;
  bestMoveUci: string | null;
  bestMoveSan: string | null;
  pvSan: string[];
  lines: EngineLine[];
  lineSan: string[];
  depth: number;
  nodes?: number | null;
  timeMs?: number | null;
};

type OpeningMatch = {
  opening: Opening;
  line: OpeningLine | null;
  matchedPly: number;
};

type RenderedMove = {
  path: number[];
  node: AnalysisMoveNode;
  depth: number;
};

type MovePairSlot = {
  path: number[];
  node: AnalysisMoveNode;
};

type MovePair = {
  number: number;
  white: MovePairSlot | null;
  black: MovePairSlot | null;
};

type AnalysisReportMode = "overview" | "report" | "critical";

type CoachTone = "best" | "good" | "neutral" | "warning" | "danger" | "system";

type CoachEntry = {
  id: string;
  moveId: string;
  title: string;
  text: string;
  detail: string;
  tone: CoachTone;
  moveLabel: string;
};

type AnalysisToolMode =
  | "import"
  | "class"
  | "openings"
  | "collections"
  | "course"
  | "history"
  | "editor";

type AnalysisRunPhase =
  | "idle"
  | "importing"
  | "initializing"
  | "analyzingPosition"
  | "analyzingGame"
  | "complete"
  | "error";

type AnalysisSessionSnapshot = {
  id: string;
  title: string;
  source: string;
  createdAt: string;
  snapshot: AnalysisSnapshot;
};

type ParsedAnalysisImport = {
  record: AnalysisRecord;
  sourceType: "fen" | "pgn";
  message: string;
};

type PersistedAnalysisSettings = {
  flipped: boolean;
  showCoordinates: boolean;
  soundEnabled: boolean;
  moveAnimation: boolean;
  highlightMoves: boolean;
  showLastMove: boolean;
  engineDepth: number;
  themeId: string;
};

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ANALYSIS_BOARD_THEME: BoardTheme = {
  id: "analysis-cinematic-blue",
  name: "Cinematic Analysis",
  light: "#dcecf2",
  dark: "#6e99ad",
};
const NAG_OPTIONS: MoveNag[] = ["!!", "!", "!?", "?!", "?", "??"];
const ANALYSIS_SETTINGS_STORAGE_KEY = "analysis.workspace.settings.v1";
const ANALYSIS_SESSIONS_STORAGE_KEY = "analysis.workspace.sessions.v1";
const DEFAULT_ANALYSIS_SETTINGS: PersistedAnalysisSettings = {
  flipped: false,
  showCoordinates: true,
  soundEnabled: true,
  moveAnimation: true,
  highlightMoves: true,
  showLastMove: true,
  engineDepth: 12,
  themeId: ANALYSIS_BOARD_THEME.id,
};
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};
const EDITOR_PIECES: Array<{ value: Piece; label: string }> = [
  { value: "wK", label: "White king" },
  { value: "wQ", label: "White queen" },
  { value: "wR", label: "White rook" },
  { value: "wB", label: "White bishop" },
  { value: "wN", label: "White knight" },
  { value: "wP", label: "White pawn" },
  { value: "bK", label: "Black king" },
  { value: "bQ", label: "Black queen" },
  { value: "bR", label: "Black rook" },
  { value: "bB", label: "Black bishop" },
  { value: "bN", label: "Black knight" },
  { value: "bP", label: "Black pawn" },
];
let nodeIdCounter = 0;

function nextNodeId() {
  nodeIdCounter += 1;
  return `analysis-node-${nodeIdCounter}`;
}

function cloneNodes(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
  return nodes.map((node) => ({
    ...node,
    arrows: [...node.arrows],
    alternatives: [...node.alternatives],
    children: cloneNodes(node.children),
  }));
}

function toSnapshot(record: AnalysisRecord | AnalysisSnapshot): AnalysisSnapshot {
  return {
    headers: { ...record.headers },
    rootFen: record.rootFen,
    currentPath: record.currentPath ? [...record.currentPath] : null,
    mainline: cloneNodes(record.mainline),
  };
}

function createRecord(rootFen = START_FEN): AnalysisRecord {
  return {
    headers: {},
    rootFen,
    currentPath: null,
    mainline: [],
    historyStack: [],
    futureStack: [],
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseAnalysisImport(text: string): ParsedAnalysisImport {
  const value = text.trim();
  if (!value) {
    throw new Error("Paste a valid FEN or PGN.");
  }

  try {
    const chess = new Chess(value);
    return {
      record: createRecord(chess.fen()),
      sourceType: "fen",
      message: "FEN loaded. Analyzing the current position.",
    };
  } catch {
    // Try PGN next.
  }

  try {
    const nextRecord = buildRecordFromPgn(value);
    return {
      record: nextRecord,
      sourceType: "pgn",
      message: `PGN loaded. Preparing ${nextRecord.mainline.length} moves for review.`,
    };
  } catch {
    throw new Error("Paste a valid FEN or PGN.");
  }
}

function readAnalysisSettings(): PersistedAnalysisSettings {
  if (typeof window === "undefined") {
    return DEFAULT_ANALYSIS_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(ANALYSIS_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ANALYSIS_SETTINGS;
    }

    return { ...DEFAULT_ANALYSIS_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_ANALYSIS_SETTINGS;
  }
}

function readStoredSessions(): AnalysisSessionSnapshot[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ANALYSIS_SESSIONS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveStoredSessions(sessions: AnalysisSessionSnapshot[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ANALYSIS_SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions.slice(0, 12)),
  );
}

function makeSessionTitle(record: AnalysisRecord) {
  const opening = findOpening(record.mainline);
  if (opening) {
    return opening.line?.name || opening.opening.name;
  }

  if (record.mainline.length > 0) {
    return `${record.mainline.length} moves`;
  }

  return record.rootFen === START_FEN ? "Starting position" : "Custom position";
}

function restoreRecord(snapshot: AnalysisSnapshot, historyStack: AnalysisSnapshot[] = [], futureStack: AnalysisSnapshot[] = []): AnalysisRecord {
  return {
    ...toSnapshot(snapshot),
    historyStack,
    futureStack,
  };
}

function isSamePath(a: number[] | null, b: number[] | null) {
  if (a === b) {
    return true;
  }

  if (!a || !b || a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

function getNodeByPath(nodes: AnalysisMoveNode[], path: number[] | null): AnalysisMoveNode | null {
  if (!path || path.length === 0) {
    return null;
  }

  let node: AnalysisMoveNode | undefined = nodes[path[0]];
  for (let index = 1; index < path.length; index += 1) {
    node = node?.children[path[index]];
  }

  return node ?? null;
}

function updateNodeAtPath(
  nodes: AnalysisMoveNode[],
  path: number[],
  mutator: (node: AnalysisMoveNode) => void,
): AnalysisMoveNode[] {
  const nextNodes = cloneNodes(nodes);
  let node: AnalysisMoveNode | undefined = nextNodes[path[0]];

  for (let index = 1; index < path.length; index += 1) {
    node = node?.children[path[index]];
  }

  if (node) {
    mutator(node);
  }

  return nextNodes;
}

function removeNodeAtPath(nodes: AnalysisMoveNode[], path: number[]): AnalysisMoveNode[] {
  const nextNodes = cloneNodes(nodes);

  if (path.length === 1) {
    nextNodes.splice(path[0], 1);
    return nextNodes;
  }

  let parent = nextNodes[path[0]];
  for (let index = 1; index < path.length - 1; index += 1) {
    parent = parent.children[path[index]];
  }

  parent.children.splice(path[path.length - 1], 1);
  return nextNodes;
}

function renderMoves(nodes: AnalysisMoveNode[], depth = 0, prefixPath: number[] = []): RenderedMove[] {
  return nodes.flatMap((node, index) => {
    const path = [...prefixPath, index];
    return [
      { path, node, depth },
      ...renderMoves(node.children, depth + 1, path),
    ];
  });
}

function getCurrentFen(record: AnalysisRecord) {
  const node = getNodeByPath(record.mainline, record.currentPath);
  return node?.fenAfter || record.rootFen;
}

function getLastMove(record: AnalysisRecord) {
  return getNodeByPath(record.mainline, record.currentPath);
}

function getPreviousPath(path: number[] | null) {
  if (!path || path.length === 0) {
    return null;
  }

  if (path.length === 1) {
    return path[0] === 0 ? null : [path[0] - 1];
  }

  return path.slice(0, -1);
}

function getNextPath(record: AnalysisRecord, path: number[] | null): number[] | null {
  if (record.mainline.length === 0) {
    return null;
  }

  if (!path) {
    return [0];
  }

  if (path.length === 1) {
    if (path[0] < record.mainline.length - 1) {
      return [path[0] + 1];
    }

    const current = record.mainline[path[0]];
    return current.children[0] ? [...path, 0] : null;
  }

  const current = getNodeByPath(record.mainline, path);
  return current?.children[0] ? [...path, 0] : null;
}

function getLastPath(record: AnalysisRecord): number[] | null {
  if (record.currentPath) {
    let current = [...record.currentPath];
    let next = getNextPath(record, current);

    while (next) {
      current = next;
      next = getNextPath(record, current);
    }

    return current;
  }

  if (record.mainline.length === 0) {
    return null;
  }

  let current: number[] | null = [record.mainline.length - 1];
  let next = getNextPath(record, current);

  while (next) {
    current = next;
    next = getNextPath(record, current);
  }

  return current;
}

function boardPositionFromFen(fen: string): BoardPosition {
  const chess = new Chess(fen);
  const position: BoardPosition = {};

  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = chess.board()[rank][file];
      if (!piece) {
        continue;
      }

      const square = `${String.fromCharCode(97 + file)}${8 - rank}` as Square;
      position[square] = `${piece.color}${piece.type.toUpperCase()}` as Piece;
    }
  }

  return position;
}

function boardPositionToFen(position: BoardPosition, turn: "w" | "b") {
  const chess = new Chess();
  chess.clear();

  for (const [square, piece] of Object.entries(position) as Array<[Square, Piece]>) {
    const color = piece[0] as "w" | "b";
    const type = piece[1].toLowerCase() as PieceSymbol;
    chess.put({ type, color }, square);
  }

  const boardFen = chess.fen().split(" ").slice(0, 1)[0];
  return `${boardFen} ${turn} - - 0 1`;
}

function uciToSan(fen: string, uci: string | null) {
  if (!uci || uci.length < 4) {
    return null;
  }

  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) || "q",
    });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

function uciPvToSan(fen: string, pv: string[]) {
  try {
    const chess = new Chess(fen);
    const sanMoves: string[] = [];

    for (const uci of pv) {
      if (uci.length < 4) {
        break;
      }

      const move = chess.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: (uci[4] as "q" | "r" | "b" | "n" | undefined) || "q",
      });

      if (!move) {
        break;
      }

      sanMoves.push(move.san);
    }

    return sanMoves;
  } catch {
    return [];
  }
}

function numericScoreFromEngine(result: AnalyzeResult) {
  if (result.scoreMate != null) {
    return result.scoreMate > 0 ? 10000 : -10000;
  }

  return result.scoreCp ?? 0;
}

function classificationFromLoss(loss: number, playedBestMove: boolean): MoveClassification {
  if (playedBestMove) {
    return "best";
  }

  if (loss <= 18) {
    return "excellent";
  }

  if (loss >= 260) {
    return "blunder";
  }

  if (loss >= 120) {
    return "mistake";
  }

  if (loss >= 45) {
    return "inaccuracy";
  }

  return "good";
}

function classificationLabel(classification: MoveClassification | null) {
  if (!classification) {
    return "Pending";
  }

  return {
    best: "Best move",
    excellent: "Excellent",
    good: "Good move",
    inaccuracy: "Inaccuracy",
    mistake: "Mistake",
    blunder: "Blunder",
  }[classification];
}

function classificationClasses(classification: MoveClassification | null) {
  return {
    best: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    excellent: "border-cyan-400/30 bg-cyan-500/10 text-cyan-100",
    good: "border-sky-400/30 bg-sky-500/10 text-sky-100",
    inaccuracy: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    mistake: "border-orange-400/30 bg-orange-500/10 text-orange-100",
    blunder: "border-rose-400/30 bg-rose-500/10 text-rose-100",
  }[classification || "good"];
}

function explanationForMove(classification: MoveClassification, color: "w" | "b", bestMoveSan: string | null) {
  const side = color === "w" ? "White" : "Black";

  if (classification === "best") {
    return `${side} matched the engine's first choice and kept the position under control.`;
  }

  if (classification === "excellent") {
    return `${side} found a very strong continuation and stayed almost perfectly aligned with the engine.`;
  }

  if (classification === "good") {
    return `${side} stayed close to the engine line, but there was still a sharper continuation available.`;
  }

  if (classification === "inaccuracy") {
    return `${side} drifted from the strongest continuation. ${bestMoveSan ? `Stockfish preferred ${bestMoveSan}.` : ""}`.trim();
  }

  if (classification === "mistake") {
    return `${side} gave up a meaningful chunk of the evaluation. ${bestMoveSan ? `The cleaner move was ${bestMoveSan}.` : ""}`.trim();
  }

  return `${side} sharply changed the evaluation. ${bestMoveSan ? `Stockfish wanted ${bestMoveSan} instead.` : ""}`.trim();
}

function formatAnalysisError(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error || "");
  const message = rawMessage.replace(/\s+/g, " ").trim();

  if (!message) {
    return "Analysis failed. Try again.";
  }

  if (
    /timed out|unavailable|failed to analyze|bridge|worker|stockfish|spawn/i.test(message)
  ) {
    return "Engine is unavailable or too slow right now. Start the local Stockfish bridge and try again.";
  }

  if (/invalid fen|invalid position/i.test(message)) {
    return "Invalid position for analysis. Check the FEN and try again.";
  }

  if (/valid fen or pgn|invalid pgn|malformed/i.test(message)) {
    return "Paste a valid PGN or FEN before starting analysis.";
  }

  return message.length > 150 ? `${message.slice(0, 147)}...` : message;
}

function materialCount(fen: string) {
  const chess = new Chess(fen);
  const white = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const black = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  chess.board().forEach((rank) => {
    rank.forEach((piece) => {
      if (!piece || piece.type === "k") {
        return;
      }

      const target = piece.color === "w" ? white : black;
      target[piece.type as keyof typeof target] += 1;
    });
  });

  const whitePoints = Object.entries(white).reduce(
    (total, [key, count]) => total + PIECE_VALUES[key as PieceSymbol] * count,
    0,
  );
  const blackPoints = Object.entries(black).reduce(
    (total, [key, count]) => total + PIECE_VALUES[key as PieceSymbol] * count,
    0,
  );

  return { white, black, whitePoints, blackPoints, diff: whitePoints - blackPoints };
}

function determinePhase(fen: string, plyCount: number): GamePhase {
  const material = materialCount(fen);
  const nonPawnMaterial = material.whitePoints + material.blackPoints - (material.white.p + material.black.p);

  if (plyCount <= 16 && nonPawnMaterial >= 34) {
    return "Opening";
  }

  if (nonPawnMaterial <= 14) {
    return "Endgame";
  }

  return "Middlegame";
}

function collectNodes(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
  return nodes.flatMap((node) => [node, ...collectNodes(node.children)]);
}

function calculateAccuracy(nodes: AnalysisMoveNode[]) {
  const reviewed = collectNodes(nodes).filter((node) => node.evalLoss != null);
  if (reviewed.length === 0) {
    return 100;
  }

  const totalLoss = reviewed.reduce((sum, node) => sum + (node.evalLoss || 0), 0);
  return Math.max(0, Math.min(100, Math.round(100 - totalLoss / reviewed.length / 12)));
}

function averageCentipawnLoss(nodes: AnalysisMoveNode[]) {
  const reviewed = collectNodes(nodes).filter((node) => node.evalLoss != null);
  if (reviewed.length === 0) {
    return 0;
  }

  const totalLoss = reviewed.reduce((sum, node) => sum + (node.evalLoss || 0), 0);
  return Math.round(totalLoss / reviewed.length);
}

function countLabels(nodes: AnalysisMoveNode[]) {
  const counts = {
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  collectNodes(nodes).forEach((node) => {
    if (node.classification === "best") {
      counts.best += 1;
    }
    if (node.classification === "excellent") {
      counts.excellent += 1;
    }
    if (node.classification === "good") {
      counts.good += 1;
    }
    if (node.classification === "inaccuracy") {
      counts.inaccuracy += 1;
    }
    if (node.classification === "mistake") {
      counts.mistake += 1;
    }
    if (node.classification === "blunder") {
      counts.blunder += 1;
    }
  });

  return counts;
}

function buildMovePairs(nodes: AnalysisMoveNode[]): MovePair[] {
  const pairs: MovePair[] = [];

  nodes.forEach((node, nodeIndex) => {
    const pairIndex = node.moveNumber - 1;
    if (!pairs[pairIndex]) {
      pairs[pairIndex] = {
        number: node.moveNumber,
        white: null,
        black: null,
      };
    }

    if (node.color === "w") {
      pairs[pairIndex].white = { path: [nodeIndex], node };
    } else {
      pairs[pairIndex].black = { path: [nodeIndex], node };
    }
  });

  return pairs.filter(Boolean);
}

function formatCp(score: number | null) {
  if (score == null) {
    return "-";
  }

  if (Math.abs(score) >= 10000) {
    return score > 0 ? "+M" : "-M";
  }

  const pawns = score / 100;
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

function coachToneClasses(tone: CoachTone) {
  return {
    best: "border-emerald-400/30 bg-emerald-500/10 text-emerald-50",
    good: "border-sky-400/30 bg-sky-500/10 text-sky-50",
    neutral: "border-white/10 bg-white/[0.04] text-white",
    warning: "border-amber-400/30 bg-amber-500/10 text-amber-50",
    danger: "border-rose-400/30 bg-rose-500/10 text-rose-50",
    system: "border-[#7fa650]/30 bg-[#7fa650]/10 text-[#edf8df]",
  }[tone];
}

function buildCoachEntry(
  node: AnalysisMoveNode | null,
  openingMatch: OpeningMatch | null,
  gamePhase: GamePhase,
): CoachEntry {
  if (!node) {
    return {
      id: "coach-intro",
      moveId: "intro",
      title: "Analysis ready",
      text: "Import a game, paste a FEN, or select a move to get a practical explanation of the position.",
      detail: openingMatch
        ? `Current opening: ${openingMatch.opening.name}.`
        : `Engine lines, plans, and tactical mistakes will appear here as soon as analysis starts.`,
      tone: "neutral",
      moveLabel: "No move selected",
    };
  }

  const moveLabel = `${node.color === "w" ? `${node.moveNumber}.` : `${node.moveNumber}...`} ${node.san}`;
  const bestMove = node.bestMoveSan ? ` Best move was ${node.bestMoveSan}.` : "";

  if (node.classification === "best") {
    return {
      id: `${node.id}-best`,
      moveId: node.id,
      title: "Great move",
      text: "Strong move. You improved coordination and kept the position under control.",
      detail: node.explanation || `This is a precise ${gamePhase.toLowerCase()} decision.${bestMove}`,
      tone: "best",
      moveLabel,
    };
  }

  if (node.classification === "excellent") {
    return {
      id: `${node.id}-excellent`,
      moveId: node.id,
      title: "Excellent move",
      text: "Very strong move. You stayed extremely close to the engine and improved your position cleanly.",
      detail: node.explanation || `This move keeps the plan sharp and preserves the best practical chances.${bestMove}`,
      tone: "best",
      moveLabel,
    };
  }

  if (node.classification === "good") {
    return {
      id: `${node.id}-good`,
      moveId: node.id,
      title: "Good move",
      text: "This move is playable and keeps your position healthy, but there was still a sharper continuation.",
      detail: node.explanation || `You stayed close to the engine line.${bestMove}`,
      tone: "good",
      moveLabel,
    };
  }

  if (node.classification === "inaccuracy") {
    return {
      id: `${node.id}-inaccuracy`,
      moveId: node.id,
      title: "Inaccuracy",
      text: "This move is slightly loose. You lost time or gave the opponent a cleaner plan.",
      detail: node.explanation || `The engine preferred a more accurate continuation.${bestMove}`,
      tone: "warning",
      moveLabel,
    };
  }

  if (node.classification === "mistake") {
    return {
      id: `${node.id}-mistake`,
      moveId: node.id,
      title: "Mistake",
      text: "This move changes the evaluation in a meaningful way and gives your opponent more freedom.",
      detail: node.explanation || `You weakened the position or gave up initiative.${bestMove}`,
      tone: "warning",
      moveLabel,
    };
  }

  if (node.classification === "blunder") {
    return {
      id: `${node.id}-blunder`,
      moveId: node.id,
      title: "Blunder",
      text: "Serious mistake. This move drops too much value or allows a tactical shot.",
      detail: node.explanation || `Material, king safety, or initiative was lost here.${bestMove}`,
      tone: "danger",
      moveLabel,
    };
  }

  return {
    id: `${node.id}-pending`,
    moveId: node.id,
    title: "Analyzing move...",
    text: "I am still checking the tactical details of this position.",
    detail: bestMove ? `Current best line:${bestMove}` : "Stockfish is calculating the best continuation.",
    tone: "neutral",
    moveLabel,
  };
}

function findOpening(mainline: AnalysisMoveNode[]): OpeningMatch | null {
  const sanMoves = mainline.map((node) => node.san);
  let best: OpeningMatch | null = null;

  for (const opening of OPENINGS) {
    const openingMatch = opening.moves.every((move, index) => sanMoves[index] === move);
    if (!openingMatch) {
      continue;
    }

    const candidate: OpeningMatch = {
      opening,
      line: null,
      matchedPly: opening.moves.length,
    };

    for (const line of opening.lines) {
      const lineMatch = line.moves.every((move, index) => sanMoves[index] === move);
      if (lineMatch && line.moves.length > candidate.matchedPly) {
        candidate.line = line;
        candidate.matchedPly = line.moves.length;
      }
    }

    if (!best || candidate.matchedPly > best.matchedPly) {
      best = candidate;
    }
  }

  return best;
}

function formatResult(result: string | undefined) {
  if (result === "1-0") {
    return "White won";
  }
  if (result === "0-1") {
    return "Black won";
  }
  if (result === "1/2-1/2") {
    return "Draw";
  }
  return "In progress";
}

function buildPgn(record: AnalysisRecord) {
  const headers = Object.entries({
    Event: record.headers.Event || "Analysis session",
    Site: record.headers.Site || "ChessMasterUA",
    Date: record.headers.Date || new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    White: record.headers.White || "White",
    Black: record.headers.Black || "Black",
    Result: record.headers.Result || "*",
    ...(record.rootFen !== START_FEN ? { FEN: record.rootFen, SetUp: "1" } : {}),
  })
    .map(([key, value]) => `[${key} "${value}"]`)
    .join("\n");

  const body = record.mainline
    .map((node) => {
      const prefix = node.color === "w" ? `${node.moveNumber}. ` : "";
      const nag = node.nag ? ` ${node.nag}` : "";
      const comment = node.comment.trim() ? ` {${node.comment.trim()}}` : "";
      return `${prefix}${node.san}${nag}${comment}`;
    })
    .join(" ")
    .trim();

  return `${headers}\n\n${body} ${record.headers.Result || "*"}`.trim();
}

function buildShareUrl(record: AnalysisRecord) {
  if (typeof window === "undefined") {
    return "";
  }

  const pgn = buildPgn(record);
  const url = new URL(`${window.location.origin}/analysis`);
  url.searchParams.set("pgn", pgn);
  return url.toString();
}

function createMoveNode(
  move: {
    san: string;
    from: string;
    to: string;
    color: "w" | "b";
    promotion?: string;
  },
  fenBefore: string,
  fenAfter: string,
  ply: number,
): AnalysisMoveNode {
  return {
    id: nextNodeId(),
    ply,
    moveNumber: Math.floor((ply + 1) / 2),
    color: move.color,
    san: move.san,
    uci: `${move.from}${move.to}${move.promotion || ""}`,
    fenBefore,
    fenAfter,
    comment: "",
    nag: null,
    classification: null,
    evalLoss: null,
    engineEval: null,
    engineMate: null,
    bestMoveSan: null,
    alternatives: [],
    explanation: "",
    arrows: [],
    children: [],
  };
}

function buildRecordFromPgn(pgnText: string): AnalysisRecord {
  const parsed = parsePGN(pgnText);
  const headers = parsed[0]?.headers ?? {};
  const rootFen = headers.FEN || START_FEN;
  const chess = new Chess();
  chess.loadPgn(pgnText);

  const moveHistory = chess.history({ verbose: true }) as Array<{
    san: string;
    from: string;
    to: string;
    color: "w" | "b";
    promotion?: string;
  }>;

  const replay = new Chess(rootFen);
  const mainline = moveHistory.map((move, index) => {
    const fenBefore = replay.fen();
    replay.move({
      from: move.from,
      to: move.to,
      promotion: (move.promotion as "q" | "r" | "b" | "n" | undefined) || "q",
    });
    return createMoveNode(move, fenBefore, replay.fen(), index + 1);
  });

  return {
    headers,
    rootFen,
    currentPath: mainline.length > 0 ? [mainline.length - 1] : null,
    mainline,
    historyStack: [],
    futureStack: [],
  };
}

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const {
    theme,
    pieceStyle,
    showCoordinates: savedCoordinates,
    setTheme,
    setPieceStyle,
    setShowCoordinates,
  } = useBoardSettings();
  const initialBoardPrefsRef = useRef({
    theme,
    pieceStyle,
    showCoordinates: savedCoordinates,
  });
  const engineCacheRef = useRef(new Map<string, EngineSummary>());
  const analysisRunRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedQueryRef = useRef<string | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const coachScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const commentEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const persistedSettingsRef = useRef(readAnalysisSettings());

  const [record, setRecord] = useState<AnalysisRecord>(() => createRecord());
  const [boardBaseSize, setBoardBaseSize] = useState(560);
  const [flipped, setFlipped] = useState(persistedSettingsRef.current.flipped);
  const [showCoordinatesEnabled, setShowCoordinatesEnabled] = useState(persistedSettingsRef.current.showCoordinates);
  const [highlightMoves, setHighlightMoves] = useState(persistedSettingsRef.current.highlightMoves);
  const [showLastMoveEnabled, setShowLastMoveEnabled] = useState(persistedSettingsRef.current.showLastMove);
  const [soundEnabled, setSoundEnabled] = useState(persistedSettingsRef.current.soundEnabled);
  const [moveAnimationEnabled, setMoveAnimationEnabled] = useState(persistedSettingsRef.current.moveAnimation);
  const [engineDepth, setEngineDepth] = useState(persistedSettingsRef.current.engineDepth);
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState("Paste a PGN or FEN to start analysis.");
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisRunPhase>("idle");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("Ready to analyze.");
  const [analyzedMoveCount, setAnalyzedMoveCount] = useState(0);
  const [totalMoveCount, setTotalMoveCount] = useState(0);
  const [canStopAnalysis, setCanStopAnalysis] = useState(false);
  const [liveDepth, setLiveDepth] = useState<number | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"analysis" | "gameInfo">("analysis");
  const [analysisReportMode, setAnalysisReportMode] = useState<AnalysisReportMode>("overview");
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<AnalysisToolMode>("import");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isImportDragging, setImportDragging] = useState(false);
  const [isManualAnalysisRunning, setManualAnalysisRunning] = useState(false);
  const [isFenDialogOpen, setFenDialogOpen] = useState(false);
  const [isPgnDialogOpen, setPgnDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [variationMode, setVariationMode] = useState(false);
  const [fenDraft, setFenDraft] = useState("");
  const [pgnDraft, setPgnDraft] = useState("");
  const [quickImportDraft, setQuickImportDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [currentEngine, setCurrentEngine] = useState<EngineSummary | null>(null);
  const [backgroundAnalysisBusy, setBackgroundAnalysisBusy] = useState(false);
  const [editorPosition, setEditorPosition] = useState<BoardPosition>(boardPositionFromFen(START_FEN));
  const [editorTurn, setEditorTurn] = useState<"w" | "b">("w");
  const [selectedPalettePiece, setSelectedPalettePiece] = useState<Piece | "eraser" | null>(null);
  const [coachStatus, setCoachStatus] = useState("Load a game or position to start the coach.");
  const [coachFeed, setCoachFeed] = useState<CoachEntry[]>([]);
  const [storedSessions, setStoredSessions] = useState<AnalysisSessionSnapshot[]>(() => readStoredSessions());
  const [growthState, setGrowthState] = useState(() => readGrowthState());
  const coachEventKeyRef = useRef("empty");
  const manualAnalysisRunRef = useRef({ runId: 0, cancelled: false });

  const commitRecordChange = useCallback((mutator: (draft: AnalysisSnapshot) => void) => {
    setRecord((current) => {
      const previousSnapshot = toSnapshot(current);
      const nextSnapshot = toSnapshot(current);
      mutator(nextSnapshot);
      return restoreRecord(
        nextSnapshot,
        [...current.historyStack.slice(-39), previousSnapshot],
        [],
      );
    });
  }, []);

  const mutateRecordSilently = useCallback((mutator: (draft: AnalysisSnapshot) => void) => {
    setRecord((current) => {
      const nextSnapshot = toSnapshot(current);
      mutator(nextSnapshot);
      return restoreRecord(nextSnapshot, current.historyStack, current.futureStack);
    });
  }, []);

  const emitSound = useCallback(
    (type: ChessSoundType) => {
      if (!soundEnabled) {
        return;
      }
      playChessSound(type);
    },
    [soundEnabled],
  );

  useEffect(() => {
    const previous = initialBoardPrefsRef.current;
    setTheme(ANALYSIS_BOARD_THEME);
    setPieceStyle("unicode");

    return () => {
      setTheme(previous.theme);
      setPieceStyle(previous.pieceStyle);
      setShowCoordinates(previous.showCoordinates);
    };
  }, [setPieceStyle, setShowCoordinates, setTheme]);

  useEffect(() => {
    setShowCoordinates(showCoordinatesEnabled);
  }, [setShowCoordinates, showCoordinatesEnabled]);

  useEffect(() => {
    const selectedTheme =
      [ANALYSIS_BOARD_THEME, ...BOARD_THEMES].find((item) => item.id === persistedSettingsRef.current.themeId) ||
      ANALYSIS_BOARD_THEME;
    setTheme(selectedTheme);
  }, [setTheme]);

  useEffect(() => {
    const payload: PersistedAnalysisSettings = {
      flipped,
      showCoordinates: showCoordinatesEnabled,
      soundEnabled,
      moveAnimation: moveAnimationEnabled,
      highlightMoves,
      showLastMove: showLastMoveEnabled,
      engineDepth,
      themeId: theme.id,
    };
    window.localStorage.setItem(ANALYSIS_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  }, [
    engineDepth,
    flipped,
    highlightMoves,
    moveAnimationEnabled,
    showCoordinatesEnabled,
    showLastMoveEnabled,
    soundEnabled,
    theme.id,
  ]);

  useEffect(() => {
    const syncBoardSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 640) {
        setBoardBaseSize(Math.max(248, Math.min(352, width - 28, height - 210)));
        return;
      }

      if (width < 1024) {
        setBoardBaseSize(Math.max(420, Math.min(560, width - 72, height - 220)));
        return;
      }

      const widthBound = width - 780;
      const heightBound = height - 170;
      setBoardBaseSize(Math.max(500, Math.min(560, widthBound, heightBound)));
    };

    syncBoardSize();
    window.addEventListener("resize", syncBoardSize);
    return () => window.removeEventListener("resize", syncBoardSize);
  }, []);

  const renderedMoves = useMemo(() => renderMoves(record.mainline), [record.mainline]);
  const currentNode = useMemo(() => getLastMove(record), [record]);
  const currentFen = useMemo(() => getCurrentFen(record), [record]);
  const currentMoveIndex = useMemo(
    () => renderedMoves.findIndex((entry) => isSamePath(entry.path, record.currentPath)),
    [record.currentPath, renderedMoves],
  );
  const material = useMemo(() => materialCount(currentFen), [currentFen]);
  const gamePhase = useMemo(() => determinePhase(currentFen, currentNode?.ply || record.mainline.length), [currentFen, currentNode?.ply, record.mainline.length]);
  const openingMatch = useMemo(() => findOpening(record.mainline), [record.mainline]);
  const accuracy = useMemo(() => calculateAccuracy(record.mainline), [record.mainline]);
  const acpl = useMemo(() => averageCentipawnLoss(record.mainline), [record.mainline]);
  const counts = useMemo(() => countLabels(record.mainline), [record.mainline]);
  const boardSize = useMemo(
    () => Math.max(230, Math.round(boardBaseSize)),
    [boardBaseSize],
  );
  const currentEvalScore = currentNode?.engineEval ?? currentEngine?.numericScore ?? 0;
  const currentMateLabel =
    currentNode?.engineMate != null
        ? `${currentNode.engineMate > 0 ? "+" : ""}M${currentNode.engineMate}`
        : currentEngine?.scoreMate != null
          ? `${currentEngine.scoreMate > 0 ? "+" : ""}M${currentEngine.scoreMate}`
          : null;
  const currentBestMove =
    currentNode?.bestMoveSan || currentEngine?.bestMoveSan || null;
  const currentPv =
    currentNode?.alternatives?.length
      ? currentNode.alternatives
      : currentEngine?.lineSan.length
        ? currentEngine.lineSan
        : currentEngine?.pvSan.length
          ? currentEngine.pvSan
        : [];
  const mainlinePairs = useMemo(() => buildMovePairs(record.mainline), [record.mainline]);
  const currentArrows = useMemo<AnalysisArrow[]>(() => {
    if (currentNode?.arrows?.length) {
      return currentNode.arrows;
    }

    if (currentEngine?.bestMoveUci && currentEngine.bestMoveUci.length >= 4) {
      return [
        [
          currentEngine.bestMoveUci.slice(0, 2) as Square,
          currentEngine.bestMoveUci.slice(2, 4) as Square,
          "#81B64C",
        ],
      ];
    }

    return [];
  }, [currentEngine?.bestMoveUci, currentNode?.arrows]);
  const lastMoveSquares = currentNode ? [currentNode.uci.slice(0, 2) as Square, currentNode.uci.slice(2, 4) as Square] : [];
  const isEmptyState = record.mainline.length === 0 && record.rootFen === START_FEN;

  useEffect(() => {
    setCommentDraft(currentNode?.comment || "");
  }, [currentNode?.id, currentNode?.comment]);

  useEffect(() => {
    const queryPgn = searchParams.get("pgn");
    const queryFen = searchParams.get("fen");

    if (queryPgn && loadedQueryRef.current !== queryPgn) {
      loadedQueryRef.current = queryPgn;
      try {
        const nextRecord = buildRecordFromPgn(queryPgn);
        setRecord(nextRecord);
        setPgnDraft(queryPgn);
        setAnalysisStatus(`Loaded ${nextRecord.mainline.length} moves from the shared PGN.`);
        toast.success("PGN loaded into Analysis.");
      } catch {
        toast.error("Could not load the shared PGN.");
      }
      return;
    }

    if (queryFen && loadedQueryRef.current !== queryFen) {
      loadedQueryRef.current = queryFen;
      try {
        const chess = new Chess(queryFen);
        setRecord(createRecord(chess.fen()));
        setFenDraft(chess.fen());
        setAnalysisStatus("FEN loaded. You can start exploring or add a new line.");
        toast.success("FEN loaded into Analysis.");
      } catch {
        toast.error("Could not load the shared FEN.");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const viewport = coachScrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport instanceof HTMLDivElement && typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [coachFeed]);

  const getEngineForFen = useCallback(async (
    fen: string,
    depth = 12,
    onOutput?: (line: string) => void,
    options: { multiPv?: number; sessionId?: string; timeoutMs?: number; preferCloud?: boolean } = {},
  ) => {
    const multiPv = options.multiPv ?? 1;
    const timeoutMs = options.timeoutMs ?? 16_000;
    const key = `${options.preferCloud ? "cloud" : "local"}:${depth}:${multiPv}:${fen}`;
    const cached = engineCacheRef.current.get(key);
    if (cached) {
      return cached;
    }

    const result = await analyzeFenWithStockfish(fen, depth, onOutput, timeoutMs, {
      multiPv,
      sessionId: options.sessionId ?? "analysis",
      timeoutMs,
      preferCloud: options.preferCloud,
    });
    const lines = result.lines ?? [];
    const summary: EngineSummary = {
      backend: result.backend,
      fen,
      scoreCp: result.scoreCp,
      scoreMate: result.scoreMate,
      numericScore: numericScoreFromEngine(result),
      bestMoveUci: result.bestmove,
      bestMoveSan: uciToSan(fen, result.bestmove),
      pvSan: uciPvToSan(fen, result.pv).slice(0, 5),
      lines,
      lineSan: lines
        .map((line) => uciPvToSan(fen, line.pv).slice(0, 5).join(" "))
        .filter(Boolean),
      depth: result.depth ?? depth,
      nodes: result.nodes,
      timeMs: result.timeMs,
    };

    engineCacheRef.current.set(key, summary);
    return summary;
  }, []);

  useEffect(() => {
    if (!analysisEnabled) {
      return;
    }

    let cancelled = false;
    setAnalysisStatus("Analyzing current position...");

    getEngineForFen(currentFen, engineDepth, undefined, {
      multiPv: 3,
      preferCloud: true,
    })
      .then((summary) => {
        if (cancelled) {
          return;
        }

        setCurrentEngine(summary);
        setAnalysisStatus(summary.bestMoveSan ? `Best move: ${summary.bestMoveSan}` : "Position analyzed.");
      })
      .catch((error) => {
        console.error(error);
        if (cancelled) {
          return;
        }
        setCurrentEngine(null);
        setAnalysisStatus("Stockfish is unavailable in this browser session.");
      });

    return () => {
      cancelled = true;
    };
  }, [analysisEnabled, currentFen, engineDepth, getEngineForFen]);

  useEffect(() => {
    if (!analysisEnabled || renderedMoves.length === 0) {
      return;
    }

    const pending = renderedMoves.filter(
      ({ node }) => node.engineEval == null || node.bestMoveSan == null,
    );

    if (pending.length === 0) {
      return;
    }

    const runId = ++analysisRunRef.current;
    setBackgroundAnalysisBusy(true);

    void (async () => {
      for (const { path, node } of pending) {
        if (runId !== analysisRunRef.current) {
          return;
        }

        try {
          const before = await getEngineForFen(node.fenBefore, 10, undefined, {
            multiPv: 3,
            sessionId: "analysis-background",
          });
          const after = await getEngineForFen(node.fenAfter, 10, undefined, {
            sessionId: "analysis-background",
          });
          if (runId !== analysisRunRef.current) {
            return;
          }

          const playedBestMove = before.bestMoveSan === node.san;
          const evalLoss =
            node.color === "w"
              ? Math.max(0, before.numericScore - after.numericScore)
              : Math.max(0, after.numericScore - before.numericScore);
          const classification = classificationFromLoss(evalLoss, playedBestMove);
          const explanation = explanationForMove(classification, node.color, before.bestMoveSan);

          mutateRecordSilently((draft) => {
            draft.mainline = updateNodeAtPath(draft.mainline, path, (target) => {
              target.classification = classification;
              target.evalLoss = Math.round(evalLoss);
              target.engineEval = after.scoreCp ?? after.numericScore;
              target.engineMate = after.scoreMate;
              target.bestMoveSan = before.bestMoveSan;
              target.alternatives = before.lineSan.length ? before.lineSan.slice(0, 3) : before.pvSan.slice(0, 3);
              target.explanation = explanation;
              target.arrows =
                before.bestMoveUci && before.bestMoveUci.length >= 4
                  ? [[before.bestMoveUci.slice(0, 2) as Square, before.bestMoveUci.slice(2, 4) as Square, "#81B64C"]]
                  : [];
            });
          });
        } catch (error) {
          console.error(error);
          if (runId !== analysisRunRef.current) {
            return;
          }
        }
      }

      if (runId === analysisRunRef.current) {
        setBackgroundAnalysisBusy(false);
      }
    })();

    return () => {
      analysisRunRef.current += 1;
      setBackgroundAnalysisBusy(false);
    };
  }, [analysisEnabled, getEngineForFen, mutateRecordSilently, renderedMoves]);

  useEffect(() => {
    if (!isAutoPlaying) {
      if (autoplayTimerRef.current) {
        window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      return;
    }

    autoplayTimerRef.current = window.setInterval(() => {
      setRecord((current) => {
        const nextPath = getNextPath(current, current.currentPath);
        if (!nextPath) {
          setIsAutoPlaying(false);
          return current;
        }
        return { ...current, currentPath: nextPath };
      });
    }, 900);

    return () => {
      if (autoplayTimerRef.current) {
        window.clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [isAutoPlaying]);

  useEffect(() => {
    const isPristineWorkspace = !currentNode && record.mainline.length === 0 && record.rootFen === START_FEN;

    if (isPristineWorkspace) {
      setCoachFeed([]);
      setCoachStatus("Load a PGN, FEN, or play a move to wake the coach.");
      coachEventKeyRef.current = "empty";
      return;
    }

    const entry = buildCoachEntry(currentNode, openingMatch, gamePhase);
    const key = `${entry.id}:${currentBestMove || "none"}:${currentPv.join("|")}`;

    if (coachEventKeyRef.current === key) {
      return;
    }

    setCoachStatus(currentNode ? "Analyzing move..." : "Ready for analysis.");

    const timer = window.setTimeout(() => {
      setCoachFeed((current) => {
        if (current[0]?.id === entry.id) {
          return current;
        }

        return [entry, ...current.filter((item) => item.moveId !== entry.moveId).slice(0, 11)];
      });
      setCoachStatus(currentNode ? `Reviewed ${entry.moveLabel}` : "Select a move to get coach feedback.");
      coachEventKeyRef.current = key;
    }, currentNode ? 950 : 120);

    return () => window.clearTimeout(timer);
  }, [
    currentBestMove,
    currentNode,
    currentPv,
    gamePhase,
    openingMatch,
    record.mainline.length,
    record.rootFen,
  ]);

  const latestCoachEntry =
    currentNode && coachFeed[0]?.moveId !== currentNode.id
      ? buildCoachEntry(currentNode, openingMatch, gamePhase)
      : coachFeed[0] ?? buildCoachEntry(currentNode, openingMatch, gamePhase);
  const coachHistory = coachFeed.slice(1);

  const rememberCurrentSession = useCallback(
    (source = "Workspace") => {
      const session: AnalysisSessionSnapshot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: makeSessionTitle(record),
        source,
        createdAt: new Date().toISOString(),
        snapshot: toSnapshot(record),
      };

      setStoredSessions((current) => {
        const next = [session, ...current].slice(0, 12);
        saveStoredSessions(next);
        return next;
      });
    },
    [record],
  );

  const restoreSession = useCallback((session: AnalysisSessionSnapshot) => {
    setRecord(restoreRecord(session.snapshot, [], []));
    setCurrentEngine(null);
    setEditorOpen(false);
    setVariationMode(false);
    setActiveTool("class");
    setAnalysisPhase("idle");
    setAnalysisProgress(0);
    setAnalyzedMoveCount(0);
    setTotalMoveCount(session.snapshot.mainline.length);
    setAnalysisMessage("Session restored. Ready to analyze.");
    setAnalysisError("");
    setAnalysisStatus(`Restored ${session.title}.`);
    toast.success("Analysis session restored.");
  }, []);

  const updateNotebookStatus = useCallback((entryId: string, status: NotebookStatus) => {
    setGrowthState(markNotebookEntryStatus(entryId, status));
    toast.success(status === "fixed" ? "Mistake marked as fixed." : "Notebook status updated.");
  }, []);

  const persistGameReview = useCallback((reviewRecord: AnalysisRecord, source: string) => {
    const reviewedMoves: ReviewedMove[] = collectNodes(reviewRecord.mainline)
      .filter((node) => node.classification)
      .map((node) => ({
        id: node.id,
        ply: node.ply,
        moveNumber: node.moveNumber,
        color: node.color,
        san: node.san,
        fenBefore: node.fenBefore,
        fenAfter: node.fenAfter,
        classification: node.classification as GrowthMoveClassification | null,
        evalLoss: node.evalLoss,
        engineEval: node.engineEval,
        bestMoveSan: node.bestMoveSan,
        explanation: node.explanation,
      }));

    if (reviewedMoves.length === 0) {
      return;
    }

    const opening = findOpening(reviewRecord.mainline);
    const nextGrowth = recordGameReview({
      title: makeSessionTitle(reviewRecord),
      source,
      openingName: opening?.line?.name || opening?.opening.name || "Unknown opening",
      eco: opening?.opening.eco || "—",
      result: reviewRecord.headers.Result || "*",
      accuracy: calculateAccuracy(reviewRecord.mainline),
      acpl: averageCentipawnLoss(reviewRecord.mainline),
      counts: countLabels(reviewRecord.mainline),
      reviewedMoves,
      pgnPreview: buildPgn(reviewRecord).replace(/\s+/g, " ").slice(0, 240),
    });
    setGrowthState(nextGrowth);
  }, []);

  const resetAnalysisRunView = useCallback((message = "Ready to analyze.") => {
    manualAnalysisRunRef.current.cancelled = true;
    setManualAnalysisRunning(false);
    setBackgroundAnalysisBusy(false);
    setCanStopAnalysis(false);
    setAnalysisPhase("idle");
    setAnalysisProgress(0);
    setAnalyzedMoveCount(0);
    setTotalMoveCount(0);
    setLiveDepth(null);
    setAnalysisMessage(message);
    setAnalysisError("");
  }, []);

  const handleStartAnalysis = useCallback(async () => {
    if (isManualAnalysisRunning) {
      return;
    }

    const runId = manualAnalysisRunRef.current.runId + 1;
    manualAnalysisRunRef.current = { runId, cancelled: false };

    setActiveTool("class");
    setAnalysisReportMode("overview");
    setSelectedCandidateIndex(0);
    setAnalysisEnabled(false);
    setManualAnalysisRunning(true);
    setBackgroundAnalysisBusy(true);
    setCanStopAnalysis(true);
    setLiveDepth(null);
    setAnalysisError("");
    setAnalysisProgress(3);
    setAnalyzedMoveCount(0);
    setTotalMoveCount(record.mainline.length);
    setAnalysisPhase("initializing");
    setAnalysisMessage("Initializing engine...");
    setAnalysisStatus("Initializing engine...");

    const ensureActiveRun = () => {
      if (manualAnalysisRunRef.current.cancelled || manualAnalysisRunRef.current.runId !== runId) {
        throw new Error("Analysis stopped.");
      }
    };

    const handleEngineLine = (line: string) => {
      const depthMatch = line.match(/\bdepth\s+(\d+)/);
      const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
      const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
      if (depthMatch) {
        const depth = Number(depthMatch[1]);
        const evalText = mateMatch
          ? `M${mateMatch[1]}`
          : cpMatch
            ? `${(Number(cpMatch[1]) / 100).toFixed(1)}`
            : "";
        setLiveDepth(depth);
        setAnalysisMessage(`Analyzing depth ${depth}${evalText ? `, eval ${evalText}` : ""}...`);
      }
    };

    try {
      let workingRecord = record;

      if (quickImportDraft.trim()) {
        setAnalysisPhase("importing");
        setAnalysisMessage("Reading position...");
        setAnalysisStatus("Reading pasted PGN/FEN...");
        const parsed = parseAnalysisImport(quickImportDraft);
        rememberCurrentSession("Before start analysis import");
        workingRecord = parsed.record;
        setRecord(workingRecord);
        setEditorPosition(boardPositionFromFen(workingRecord.rootFen));
        if (parsed.sourceType === "fen") {
          setFenDraft(quickImportDraft.trim());
        } else {
          setPgnDraft(quickImportDraft);
        }
        setAnalysisStatus(parsed.message);
        await sleep(120);
      }

      ensureActiveRun();

      const workingMoves = renderMoves(workingRecord.mainline);
      const workingFen = getCurrentFen(workingRecord);
      const reviewDepth = Math.min(engineDepth, 12);

      setTotalMoveCount(workingMoves.length);
      setAnalysisPhase(workingMoves.length > 0 ? "analyzingGame" : "analyzingPosition");
      setAnalysisMessage(workingMoves.length > 0 ? "Preparing move review..." : "Preparing position analysis...");
      setAnalysisProgress(workingMoves.length > 0 ? 8 : 18);
      await sleep(120);
      ensureActiveRun();

      const summary = await getEngineForFen(workingFen, engineDepth, handleEngineLine, {
        multiPv: 3,
        sessionId: `analysis-manual-${runId}`,
        preferCloud: true,
      });
      ensureActiveRun();
      setCurrentEngine(summary);
      setAnalysisProgress(workingMoves.length > 0 ? 18 : 76);

      const workingSnapshot = toSnapshot(workingRecord);

      if (workingMoves.length > 0) {
        for (let index = 0; index < workingMoves.length; index += 1) {
          ensureActiveRun();
          const { path, node } = workingMoves[index];
          setAnalyzedMoveCount(index + 1);
          setAnalysisMessage(`Analyzing move ${index + 1} / ${workingMoves.length}...`);
          setAnalysisProgress(Math.min(94, 18 + Math.round(((index + 1) / workingMoves.length) * 72)));

          const before = await getEngineForFen(node.fenBefore, reviewDepth, handleEngineLine, {
            multiPv: 3,
            sessionId: `analysis-manual-${runId}`,
          });
          ensureActiveRun();
          const after = await getEngineForFen(node.fenAfter, reviewDepth, handleEngineLine, {
            sessionId: `analysis-manual-${runId}`,
          });
          ensureActiveRun();

          const playedBestMove = before.bestMoveSan === node.san;
          const evalLoss =
            node.color === "w"
              ? Math.max(0, before.numericScore - after.numericScore)
              : Math.max(0, after.numericScore - before.numericScore);
          const classification = classificationFromLoss(evalLoss, playedBestMove);
          const explanation = explanationForMove(classification, node.color, before.bestMoveSan);

          workingSnapshot.mainline = updateNodeAtPath(workingSnapshot.mainline, path, (target) => {
            target.classification = classification;
            target.evalLoss = Math.round(evalLoss);
            target.engineEval = after.scoreCp ?? after.numericScore;
            target.engineMate = after.scoreMate;
            target.bestMoveSan = before.bestMoveSan;
            target.alternatives = before.lineSan.length ? before.lineSan.slice(0, 3) : before.pvSan.slice(0, 3);
            target.explanation = explanation;
            target.arrows =
              before.bestMoveUci && before.bestMoveUci.length >= 4
                ? [[before.bestMoveUci.slice(0, 2) as Square, before.bestMoveUci.slice(2, 4) as Square, "#81B64C"]]
                : [];
          });
          workingSnapshot.currentPath = path;
          setCurrentEngine(after);
          setRecord(restoreRecord(workingSnapshot, [], []));
          await sleep(65);
        }
      }

      ensureActiveRun();
      const finalRecord = restoreRecord(workingSnapshot, [], []);
      setRecord(finalRecord);
      setAnalysisProgress(100);
      setAnalysisPhase("complete");
      setAnalysisReportMode("overview");
      setAnalysisMessage("Analysis complete.");
      setAnalysisEnabled(false);
      const finalNode = getLastMove(finalRecord);
      const entry =
        finalNode
          ? buildCoachEntry(finalNode, findOpening(workingSnapshot.mainline), determinePhase(getCurrentFen(finalRecord), finalNode.ply))
          : {
              id: `position-review-${Date.now()}`,
              moveId: "position",
              title: "Position review",
              text: summary.numericScore > 35
                ? "White has the more comfortable position and should keep improving active pieces."
                : summary.numericScore < -35
                  ? "Black has the more comfortable position and can keep pressing with active moves."
                  : "The position is close to equal. Small improvements and piece activity matter most.",
              detail: summary.bestMoveSan
                ? `Better move: ${summary.bestMoveSan}. Plan: follow the main line ${summary.pvSan.slice(0, 4).join(" / ") || "and keep the position coordinated"}.`
                : "Plan: improve piece activity and avoid weakening your king.",
              tone: "system" as const,
              moveLabel: "Current position",
            };
      setCoachFeed((current) => [entry, ...current.filter((item) => item.moveId !== entry.moveId)].slice(0, 12));
      setCoachStatus(finalNode ? `Reviewed ${entry.moveLabel}` : "Position reviewed.");
      setAnalysisStatus(
        summary.bestMoveSan
          ? `Analysis complete. Best move: ${summary.bestMoveSan}.`
          : "Analysis complete. No engine move was returned.",
      );
      rememberCurrentSession("Engine analysis");
      persistGameReview(finalRecord, quickImportDraft.trim() ? "Imported review" : "Analysis workspace");
      toast.success("Analysis updated.");
    } catch (error) {
      const message = formatAnalysisError(error);
      if (message === "Analysis stopped.") {
        setAnalysisPhase("idle");
        setAnalysisMessage("Analysis stopped.");
        setAnalysisStatus("Analysis stopped.");
        toast.info("Analysis stopped.");
      } else {
        setAnalysisPhase("error");
        setAnalysisError(message);
        setAnalysisMessage("Analysis failed. Try again.");
        setAnalysisStatus("Analysis failed. Try again.");
        toast.error(message);
      }
    } finally {
      setManualAnalysisRunning(false);
      setBackgroundAnalysisBusy(false);
      setCanStopAnalysis(false);
    }
  }, [
    engineDepth,
    getEngineForFen,
    isManualAnalysisRunning,
    quickImportDraft,
    record,
    rememberCurrentSession,
    persistGameReview,
  ]);

  const handleStopAnalysis = useCallback(() => {
    manualAnalysisRunRef.current.cancelled = true;
    setManualAnalysisRunning(false);
    setBackgroundAnalysisBusy(false);
    setCanStopAnalysis(false);
    setAnalysisPhase("idle");
    setAnalysisMessage("Analysis stopped.");
    setAnalysisStatus("Analysis stopped.");
    toast.info("Analysis stopped.");
  }, []);

  const handleLoadFen = useCallback(() => {
    try {
      const chess = new Chess(fenDraft.trim());
      rememberCurrentSession("Before FEN import");
      setRecord(createRecord(chess.fen()));
      setCurrentEngine(null);
      setEditorPosition(boardPositionFromFen(chess.fen()));
      setFenDialogOpen(false);
      setActiveTool("class");
      resetAnalysisRunView("FEN loaded. Ready to analyze.");
      setAnalysisStatus("FEN loaded. You can continue analysis from this position.");
      emitSound("gameStart");
      toast.success("FEN loaded.");
    } catch {
      toast.error("Invalid FEN string.");
    }
  }, [emitSound, fenDraft, rememberCurrentSession, resetAnalysisRunView]);

  const handleLoadPgn = useCallback(() => {
    try {
      const nextRecord = buildRecordFromPgn(pgnDraft.trim());
      rememberCurrentSession("Before PGN import");
      setRecord(nextRecord);
      setCurrentEngine(null);
      setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
      setPgnDialogOpen(false);
      setActiveTool("class");
      resetAnalysisRunView(`PGN loaded. ${nextRecord.mainline.length} moves ready.`);
      setAnalysisStatus(`Loaded ${nextRecord.mainline.length} moves. Press start to run review.`);
      emitSound("gameStart");
      toast.success("PGN loaded.");
    } catch {
      toast.error("Invalid PGN text.");
    }
  }, [emitSound, pgnDraft, rememberCurrentSession, resetAnalysisRunView]);

  const handleImportGame = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!/\.(pgn|txt|fen)$/.test(lowerName)) {
      toast.error("Only PGN, FEN, or plain text files are supported.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      setQuickImportDraft(text);

      try {
        const chess = new Chess(text.trim());
        rememberCurrentSession(`Before ${file.name}`);
        setRecord(createRecord(chess.fen()));
        setCurrentEngine(null);
        setEditorPosition(boardPositionFromFen(chess.fen()));
        setFenDraft(text.trim());
        setActiveTool("class");
        resetAnalysisRunView("FEN file imported. Ready to analyze.");
        setAnalysisStatus(`Imported position from ${file.name}.`);
        emitSound("gameStart");
        toast.success("FEN file imported.");
        return;
      } catch {
        // Not a FEN file; try PGN below.
      }

      const nextRecord = buildRecordFromPgn(text);
      rememberCurrentSession(`Before ${file.name}`);
      setRecord(nextRecord);
      setCurrentEngine(null);
      setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
      setPgnDraft(text);
      setActiveTool("class");
      resetAnalysisRunView(`Imported ${nextRecord.mainline.length} moves. Ready to analyze.`);
      setAnalysisStatus(`Imported ${nextRecord.mainline.length} moves from ${file.name}.`);
      emitSound("gameStart");
      toast.success("Game imported.");
    } catch {
      toast.error("This file does not contain a valid PGN or FEN.");
    } finally {
      event.target.value = "";
    }
  }, [emitSound, rememberCurrentSession, resetAnalysisRunView]);

  const applyQuickImport = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) {
        setPgnDialogOpen(true);
        return;
      }

      try {
        const chess = new Chess(value);
        rememberCurrentSession("Before quick FEN import");
        setRecord(createRecord(chess.fen()));
        setCurrentEngine(null);
        setEditorPosition(boardPositionFromFen(chess.fen()));
        setFenDraft(value);
        setActiveTool("class");
        resetAnalysisRunView("FEN loaded. Ready to analyze.");
        setAnalysisStatus("FEN loaded. You can continue analysis from this position.");
        emitSound("gameStart");
        toast.success("FEN loaded.");
        return;
      } catch {
        // Try PGN next.
      }

      try {
        const nextRecord = buildRecordFromPgn(value);
        rememberCurrentSession("Before quick PGN import");
        setRecord(nextRecord);
        setCurrentEngine(null);
        setEditorPosition(boardPositionFromFen(nextRecord.rootFen));
        setPgnDraft(value);
        setActiveTool("class");
        resetAnalysisRunView(`PGN loaded. ${nextRecord.mainline.length} moves ready.`);
        setAnalysisStatus(`Loaded ${nextRecord.mainline.length} moves. Press start to run review.`);
        emitSound("gameStart");
        toast.success("PGN loaded.");
      } catch {
        toast.error("Paste a valid FEN or PGN.");
      }
    },
    [emitSound, rememberCurrentSession, resetAnalysisRunView],
  );

  const handleQuickDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setImportDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) {
        return;
      }

      if (!/\.(pgn|txt|fen)$/.test(file.name.toLowerCase())) {
        toast.error("Drop a PGN, FEN, or plain text file.");
        return;
      }

      const text = await file.text();
      setQuickImportDraft(text);
      applyQuickImport(text);
    },
    [applyQuickImport],
  );

  const handleNewAnalysis = useCallback(() => {
    rememberCurrentSession("Before new analysis");
    setRecord(createRecord());
    setCurrentEngine(null);
    setEditorOpen(false);
    setVariationMode(false);
    setFenDraft("");
    setPgnDraft("");
    setQuickImportDraft("");
    setCommentDraft("");
    setActiveTool("import");
    setEditorPosition(boardPositionFromFen(START_FEN));
    setEditorTurn("w");
    resetAnalysisRunView("Fresh analysis workspace ready.");
    setAnalysisStatus("Paste a PGN or FEN to start analysis.");
    setCoachStatus("Load a game or position to start the coach.");
    setCoachFeed([]);
    coachEventKeyRef.current = "empty";
    toast.success("Started a fresh analysis workspace.");
  }, [rememberCurrentSession, resetAnalysisRunView]);

  const exportPgn = useCallback(() => {
    const pgn = buildPgn(record);
    const blob = new Blob([pgn], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "analysis.pgn";
    link.click();
    URL.revokeObjectURL(url);
  }, [record]);

  const copyCurrentFen = useCallback(async () => {
    await navigator.clipboard.writeText(currentFen);
    toast.success("FEN copied.");
  }, [currentFen]);

  const copyCurrentPgn = useCallback(async () => {
    await navigator.clipboard.writeText(buildPgn(record));
    toast.success("PGN copied.");
  }, [record]);

  const shareAnalysis = useCallback(async () => {
    const url = buildShareUrl(record);
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied.");
  }, [record]);

  const handleExplainMore = useCallback(() => {
    const entry = buildCoachEntry(currentNode, openingMatch, gamePhase);
    const expanded: CoachEntry = {
      ...entry,
      id: `${entry.id}-deep`,
      title: `${entry.title} - deeper look`,
      text: currentNode?.explanation || entry.text,
      detail: currentPv.length > 0 ? `Candidate line: ${currentPv.join(" / ")}` : entry.detail,
    };
    setCoachFeed((current) => [expanded, ...current].slice(0, 12));
    setCoachStatus("Expanded explanation ready.");
  }, [currentNode, currentPv, gamePhase, openingMatch]);

  const handleShowBestMove = useCallback(() => {
    if (!currentBestMove) {
      toast.info("Best move is still being calculated.");
      return;
    }

    setAnalysisStatus(`Showing best move: ${currentBestMove}`);
    setCoachFeed((current) => [
      {
        id: `bestmove-${currentNode?.id || "root"}`,
        moveId: currentNode?.id || "root",
        title: "Best move highlighted",
        text: `The engine wants ${currentBestMove}. The board now highlights that idea with an arrow.`,
        detail: currentPv.length > 0 ? `Main line: ${currentPv.join(" / ")}` : "Follow the green arrow on the board.",
        tone: "system" as const,
        moveLabel: currentNode ? `${currentNode.moveNumber}${currentNode.color === "w" ? "." : "..."} ${currentNode.san}` : "Position",
      },
      ...current,
    ].slice(0, 12));
  }, [currentBestMove, currentNode, currentPv]);

  const navigateTo = useCallback((path: number[] | null) => {
    setRecord((current) => ({ ...current, currentPath: path ? [...path] : null }));
  }, []);

  const handleShowBlunder = useCallback(() => {
    const blunders = renderedMoves.filter((entry) => entry.node.classification === "blunder");
    if (blunders.length === 0) {
      toast.info("No blunders detected in this analysis yet.");
      return;
    }

    const currentIndex = currentMoveIndex;
    const target =
      blunders.find((entry) => renderedMoves.findIndex((candidate) => candidate.node.id === entry.node.id) > currentIndex) ||
      blunders[0];

    navigateTo(target.path);
    setRightPanelTab("analysis");
    setAnalysisReportMode("critical");
    setAnalysisStatus(`Jumped to blunder: ${target.node.san}`);
    setCoachFeed((current) => [
      {
        id: `blunder-focus-${target.node.id}`,
        moveId: target.node.id,
        title: "Blunder review",
        text: target.node.explanation || "This move changed the evaluation too much and deserves a closer review.",
        detail: target.node.bestMoveSan ? `Better move: ${target.node.bestMoveSan}.` : "Review the highlighted move and compare it with the engine line.",
        tone: "danger" as const,
        moveLabel: `${target.node.color === "w" ? `${target.node.moveNumber}.` : `${target.node.moveNumber}...`} ${target.node.san}`,
      },
      ...current,
    ].slice(0, 12));
  }, [currentMoveIndex, navigateTo, renderedMoves]);

  const moveToFirst = useCallback(() => {
    navigateTo(record.mainline.length > 0 ? [0] : null);
  }, [navigateTo, record.mainline.length]);

  const moveBackward = useCallback(() => {
    navigateTo(getPreviousPath(record.currentPath));
  }, [navigateTo, record.currentPath]);

  const moveForward = useCallback(() => {
    navigateTo(getNextPath(record, record.currentPath));
  }, [navigateTo, record]);

  const moveToLast = useCallback(() => {
    navigateTo(getLastPath(record));
  }, [navigateTo, record]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveBackward();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveForward();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        moveToFirst();
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        moveToLast();
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setIsAutoPlaying((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveBackward, moveForward, moveToFirst, moveToLast]);

  const handleUndo = useCallback(() => {
    setRecord((current) => {
      const previous = current.historyStack[current.historyStack.length - 1];
      if (!previous) {
        return current;
      }

      const future = [...current.futureStack, toSnapshot(current)];
      return restoreRecord(previous, current.historyStack.slice(0, -1), future);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRecord((current) => {
      const next = current.futureStack[current.futureStack.length - 1];
      if (!next) {
        return current;
      }

      const history = [...current.historyStack, toSnapshot(current)];
      return restoreRecord(next, history, current.futureStack.slice(0, -1));
    });
  }, []);

  const handleDeleteCurrentMove = useCallback(() => {
    if (!record.currentPath) {
      return;
    }

    commitRecordChange((draft) => {
      draft.mainline = removeNodeAtPath(draft.mainline, draft.currentPath || []);
      draft.currentPath = getPreviousPath(draft.currentPath);
    });
    toast.success("Move deleted.");
  }, [commitRecordChange, record.currentPath]);

  const handleFocusComment = useCallback(() => {
    setRightPanelTab("analysis");
    window.setTimeout(() => {
      commentEditorRef.current?.focus();
    }, 50);
  }, []);

  const handleSaveComment = useCallback(() => {
    if (!record.currentPath) {
      return;
    }

    commitRecordChange((draft) => {
      draft.mainline = updateNodeAtPath(draft.mainline, draft.currentPath || [], (node) => {
        node.comment = commentDraft;
      });
    });
    toast.success("Comment saved.");
  }, [commentDraft, commitRecordChange, record.currentPath]);

  const handleSetNag = useCallback((nag: MoveNag) => {
    if (!record.currentPath) {
      return;
    }

    commitRecordChange((draft) => {
      draft.mainline = updateNodeAtPath(draft.mainline, draft.currentPath || [], (node) => {
        node.nag = node.nag === nag ? null : nag;
      });
    });
  }, [commitRecordChange, record.currentPath]);

  const appendAnalysisMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
      if (!record.currentPath && record.mainline.length > 0) {
        toast.info("Select a move before starting a new variation from the root.");
        return false;
      }

      const chess = new Chess(currentFen);

      try {
        const move = chess.move({ from, to, promotion: promotion || "q" });
        if (!move) {
          return false;
        }

        const nextNode = createMoveNode(
          {
            san: move.san,
            from: move.from,
            to: move.to,
            color: move.color,
            promotion: move.promotion,
          },
          currentFen,
          chess.fen(),
          (currentNode?.ply || 0) + 1,
        );

        commitRecordChange((draft) => {
          if (!draft.currentPath) {
            draft.mainline.push(nextNode);
            draft.currentPath = [0];
            return;
          }

          const path = draft.currentPath;
          const appendAsVariation = variationMode || path.length > 1 || path[0] < draft.mainline.length - 1;

          if (!appendAsVariation && path.length === 1 && path[0] === draft.mainline.length - 1) {
            draft.mainline.push(nextNode);
            draft.currentPath = [draft.mainline.length - 1];
            return;
          }

          draft.mainline = updateNodeAtPath(draft.mainline, path, (node) => {
            node.children.push(nextNode);
          });
          draft.currentPath = [...path, getNodeByPath(draft.mainline, path)?.children.length ? getNodeByPath(draft.mainline, path)!.children.length - 1 : 0];
        });

        setVariationMode(false);
        setAnalysisStatus(`Added ${move.san} to the analysis tree.`);
        emitSound(move.captured ? "capture" : move.san.includes("+") ? "check" : "move");
        return true;
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Illegal move.");
        return false;
      }
    },
    [commitRecordChange, currentFen, currentNode?.ply, emitSound, variationMode],
  );

  const handleBoardMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => appendAnalysisMove(from, to, promotion),
    [appendAnalysisMove],
  );

  const handleEditorDrop = useCallback((sourceSquare: Square, targetSquare: Square, piece: Piece) => {
    setEditorPosition((current) => {
      const next = { ...current };
      delete next[sourceSquare];
      next[targetSquare] = piece;
      return next;
    });
    return true;
  }, []);

  const handleEditorDropOffBoard = useCallback((sourceSquare: Square) => {
    setEditorPosition((current) => {
      const next = { ...current };
      delete next[sourceSquare];
      return next;
    });
  }, []);

  const handleEditorSquareClick = useCallback((square: Square) => {
    if (!selectedPalettePiece) {
      return;
    }

    setEditorPosition((current) => {
      const next = { ...current };
      if (selectedPalettePiece === "eraser") {
        delete next[square];
      } else {
        next[square] = selectedPalettePiece;
      }
      return next;
    });
  }, [selectedPalettePiece]);

  const applyEditorAsRoot = useCallback(() => {
    try {
      const fen = boardPositionToFen(editorPosition, editorTurn);
      const chess = new Chess(fen);
      rememberCurrentSession("Before editor apply");
      setRecord(createRecord(chess.fen()));
      setAnalysisStatus("Editor position applied as a new analysis root.");
      toast.success("Editor position applied.");
    } catch {
      toast.error("Editor position is invalid. Keep exactly one white king and one black king.");
    }
  }, [editorPosition, editorTurn, rememberCurrentSession]);

  const handleOpenEditorFromCurrent = useCallback(() => {
    setEditorOpen(true);
    setEditorPosition(boardPositionFromFen(currentFen));
    setAnalysisStatus("Editor mode enabled for the current position.");
  }, [currentFen]);

  const handleResetToStartPosition = useCallback(() => {
    rememberCurrentSession("Before reset");
    setRecord(createRecord());
    setCurrentEngine(null);
    setEditorOpen(false);
    setVariationMode(false);
    setCommentDraft("");
    setEditorPosition(boardPositionFromFen(START_FEN));
    setEditorTurn("w");
    setActiveTool("import");
    resetAnalysisRunView("Start position ready.");
    setAnalysisStatus("Returned to the standard start position.");
    setCoachStatus("Load a game or position to start the coach.");
    setCoachFeed([]);
    coachEventKeyRef.current = "empty";
    toast.success("Start position loaded.");
  }, [rememberCurrentSession, resetAnalysisRunView]);

  const handleClearBoardEditor = useCallback(() => {
    setEditorOpen(true);
    setEditorPosition({});
    setAnalysisStatus("Board cleared. Build a custom position in editor mode.");
    toast.info("Board cleared.");
  }, []);

  const currentMoveLabel = currentNode
    ? `${currentNode.color === "w" ? `${currentNode.moveNumber}.` : `${currentNode.moveNumber}...`} ${currentNode.san}`
    : "Start position";
  const sideToMove = currentFen.split(" ")[1] === "b" ? "b" : "w";
  const whitePlayerName = record.headers.White || "White";
  const blackPlayerName = record.headers.Black || "Black";
  const whitePlayerMeta = record.headers.WhiteElo || "Study board";
  const blackPlayerMeta =
    record.headers.BlackElo ||
    (currentEngine?.backend === "cloud"
      ? "Lichess Cloud"
      : currentEngine?.backend === "native"
        ? "Native Stockfish"
        : "Browser Stockfish");
  const materialBalance =
    material.diff > 0 ? `White +${material.diff}` : material.diff < 0 ? `Black +${Math.abs(material.diff)}` : "Equal";
  const openingSummary = openingMatch?.line?.comment || openingMatch?.opening.description || "Load a game to detect the opening plan.";
  const positionSourceLabel =
    record.mainline.length > 0 ? "Imported game" : record.rootFen !== START_FEN ? "Custom position" : "Standard position";
  const isPristineWorkspace = record.mainline.length === 0 && record.rootFen === START_FEN && !currentNode;
  const evaluationVerdict =
    currentMateLabel
      ? currentEvalScore >= 0
        ? "White winning"
        : "Black winning"
      : currentEvalScore > 35
        ? "White better"
        : currentEvalScore < -35
          ? "Black better"
          : "Equal";
  const topMoveCounts = [
    { label: "Best", value: counts.best, tone: "best" as const },
    { label: "Excellent", value: counts.excellent, tone: "excellent" as const },
    { label: "Good", value: counts.good, tone: "good" as const },
    { label: "Inaccuracy", value: counts.inaccuracy, tone: "inaccuracy" as const },
    { label: "Mistake", value: counts.mistake, tone: "mistake" as const },
    { label: "Blunder", value: counts.blunder, tone: "blunder" as const },
  ];
  const analysisIsRunning =
    analysisPhase === "importing" ||
    analysisPhase === "initializing" ||
    analysisPhase === "analyzingPosition" ||
    analysisPhase === "analyzingGame" ||
    isManualAnalysisRunning;
  const reviewedMoveCount = useMemo(
    () => collectNodes(record.mainline).filter((node) => node.classification).length,
    [record.mainline],
  );
  const resultMoveRows = useMemo(() => renderedMoves.slice(0, 36), [renderedMoves]);
  const resultMovePairs = useMemo(() => mainlinePairs.slice(0, 28), [mainlinePairs]);
  const evalGraphPoints = useMemo(() => {
    const reviewed = collectNodes(record.mainline).filter((node) => node.engineEval != null);
    if (reviewed.length === 0) {
      return [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ];
    }

    const visible = reviewed.slice(-42);
    const maxIndex = Math.max(1, visible.length - 1);
    return visible.map((node, index) => {
      const score = Math.max(-500, Math.min(500, node.engineEval || 0));
      return {
        x: (index / maxIndex) * 100,
        y: 50 - (score / 500) * 42,
      };
    });
  }, [record.mainline]);
  const evalGraphPolyline = evalGraphPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const gameInfoRows = [
    { label: "Opening", value: openingMatch?.opening.name || "Unknown" },
    { label: "ECO", value: openingMatch?.opening.eco || "—" },
    { label: "Result", value: record.headers.Result || "*" },
    { label: "Time", value: record.headers.TimeControl || "—" },
    { label: "Accuracy", value: `${accuracy}%` },
    { label: "Source", value: positionSourceLabel },
  ];
  const progressLabel =
    totalMoveCount > 0
      ? `${analyzedMoveCount} / ${totalMoveCount}`
      : analysisPhase === "complete"
        ? "Current position"
        : "Preparing";
  const displayEngineStatusLabel =
    analysisIsRunning
      ? "Analyzing"
      : currentEngine
        ? currentEngine.backend === "cloud"
          ? "Lichess Cloud"
          : currentEngine.backend === "native"
            ? "Native engine"
            : "Browser engine"
        : analysisPhase === "error"
          ? "Engine error"
          : analysisEnabled
            ? "Engine unavailable"
            : "Ready";
  const cleanEngineDepthLabel = currentEngine?.depth ? `Depth ${currentEngine.depth}` : "Depth -";
  const finalMoveProgressLabel =
    record.mainline.length > 0
      ? currentMoveIndex >= 0
        ? `Move ${currentMoveIndex + 1} / ${renderedMoves.length}`
        : `Start | ${renderedMoves.length} moves`
      : "No moves yet";
  const topPlayer = flipped
    ? { label: "Білі", name: whitePlayerName, meta: whitePlayerMeta, color: "white" as const }
    : { label: "Чорні", name: blackPlayerName, meta: blackPlayerMeta, color: "black" as const };
  const bottomPlayer = flipped
    ? { label: "Чорні", name: blackPlayerName, meta: blackPlayerMeta, color: "black" as const }
    : { label: "Білі", name: whitePlayerName, meta: whitePlayerMeta, color: "white" as const };
  const hasEngineEval =
    currentEngine?.numericScore != null ||
    currentNode?.engineEval != null ||
    currentMateLabel != null;
  const evalLabel = currentMateLabel || (hasEngineEval ? formatCp(currentEvalScore) : "--");
  const evalPercent = Math.max(8, Math.min(92, 50 + currentEvalScore / 18));
  const evalWhitePercent = hasEngineEval ? evalPercent : 50;
  const evalBlackPercent = 100 - evalWhitePercent;
  const evalTopSegment = flipped
    ? { color: "#f4f4f2", height: evalWhitePercent }
    : { color: "#101010", height: evalBlackPercent };
  const evalBottomSegment = flipped
    ? { color: "#101010", height: evalBlackPercent }
    : { color: "#f4f4f2", height: evalWhitePercent };
  const positionClass =
    currentMateLabel
      ? "Forced tactical position"
      : Math.abs(currentEvalScore) < 35
        ? "Balanced position"
        : currentEvalScore > 0
          ? "White pressure"
          : "Black pressure";
  const growthSummary = useMemo(() => buildGrowthSummary(growthState), [growthState]);
  const notebookPreview = useMemo(
    () => growthState.mistakeNotebook.filter((entry) => entry.status !== "fixed").slice(0, 3),
    [growthState.mistakeNotebook],
  );
  const trainingPlanPreview = useMemo(
    () => growthState.trainingPlan.filter((item) => !item.completed).slice(0, 3),
    [growthState.trainingPlan],
  );
  const activeSession = storedSessions[0] || null;
  const analysisModeLabel =
    activeTool === "class"
      ? "Клас позиції"
      : activeTool === "openings"
        ? "База дебютів"
        : activeTool === "collections"
          ? "Колекції партій"
          : activeTool === "course"
            ? "Навчальний курс"
            : activeTool === "history"
              ? "Історія партій"
              : activeTool === "editor"
                ? "Редактор позиції"
                : "Імпорт партії";
  const primaryActionDisabled = analysisIsRunning || backgroundAnalysisBusy;
  const themeOptions = [ANALYSIS_BOARD_THEME, ...BOARD_THEMES];
  const analysisPanelTitle = analysisReportMode === "overview" ? "Аналіз" : "Аналіз партії";
  const reviewedNodes = useMemo(() => collectNodes(record.mainline), [record.mainline]);
  const candidateRows = useMemo(() => {
    const engineLines = currentEngine?.lines?.slice(0, 5) || [];

    if (engineLines.length > 0) {
      return engineLines.map((line, index) => {
        const sanLine = uciPvToSan(currentFen, line.pv).slice(0, 9);
        return {
          id: `line-${line.multipv || index + 1}`,
          score:
            line.scoreMate != null
              ? `${line.scoreMate > 0 ? "+" : ""}M${line.scoreMate}`
              : formatCp(line.scoreCp),
          text: sanLine.join(" ") || line.pv.slice(0, 8).join(" ") || "Engine line pending",
          isPrimary: index === 0,
        };
      });
    }

    return [
      {
        id: "line-current",
        score: evalLabel,
        text: currentPv.slice(0, 8).join(" ") || currentBestMove || "Engine line pending",
        isPrimary: true,
      },
    ];
  }, [currentBestMove, currentEngine?.lines, currentFen, currentPv, evalLabel]);

  useEffect(() => {
    if (selectedCandidateIndex >= candidateRows.length) {
      setSelectedCandidateIndex(0);
    }
  }, [candidateRows.length, selectedCandidateIndex]);

  const classificationBySide = useMemo<Record<MoveClassification, { w: number; b: number }>>(() => {
    const empty = {
      best: { w: 0, b: 0 },
      excellent: { w: 0, b: 0 },
      good: { w: 0, b: 0 },
      inaccuracy: { w: 0, b: 0 },
      mistake: { w: 0, b: 0 },
      blunder: { w: 0, b: 0 },
    };

    reviewedNodes.forEach((node) => {
      if (node.classification) {
        empty[node.classification][node.color] += 1;
      }
    });

    return empty;
  }, [reviewedNodes]);

  const sideAccuracy = useMemo(() => {
    const scoreFor = (color: "w" | "b") => {
      const sideNodes = reviewedNodes.filter((node) => node.color === color && node.evalLoss != null);
      if (sideNodes.length === 0) {
        return 100;
      }

      const loss = sideNodes.reduce((sum, node) => sum + (node.evalLoss || 0), 0) / sideNodes.length;
      return Math.max(0, Math.min(100, Math.round((100 - loss / 12) * 10) / 10));
    };

    return {
      white: scoreFor("w"),
      black: scoreFor("b"),
    };
  }, [reviewedNodes]);

  const classificationReportRows: Array<{
    label: string;
    icon: string;
    key: MoveClassification;
  }> = [
    { label: "Неймовірно", icon: "!!", key: "excellent" },
    { label: "Чудово", icon: "!", key: "good" },
    { label: "Найкращий", icon: "★", key: "best" },
    { label: "Помилка", icon: "?", key: "inaccuracy" },
    { label: "Хиба", icon: "×", key: "mistake" },
    { label: "Груба помилка", icon: "??", key: "blunder" },
  ];

  const criticalMoveEntry = useMemo(
    () =>
      renderedMoves.find((entry) => entry.node.classification === "blunder") ||
      renderedMoves.find((entry) => entry.node.classification === "mistake") ||
      renderedMoves.find((entry) => entry.node.classification === "inaccuracy") ||
      renderedMoves[0] ||
      null,
    [renderedMoves],
  );
  const keyMomentRows = useMemo(
    () =>
      renderedMoves
        .filter((entry) =>
          entry.node.classification === "blunder" ||
          entry.node.classification === "mistake" ||
          entry.node.classification === "inaccuracy" ||
          entry.node.classification === "best",
        )
        .slice(0, 10),
    [renderedMoves],
  );
  const criticalMove = criticalMoveEntry?.node || currentNode;
  const criticalMoveText = criticalMove
    ? `${criticalMove.color === "w" ? `${criticalMove.moveNumber}.` : `${criticalMove.moveNumber}...`} ${criticalMove.san}`
    : "Current position";
  const criticalQuality =
    criticalMove?.classification === "blunder"
      ? "є грубою помилкою"
      : criticalMove?.classification === "mistake"
        ? "є помилкою"
        : criticalMove?.classification === "inaccuracy"
          ? "є неточністю"
          : "є ключовим моментом";
  const criticalBetterMove = criticalMove?.bestMoveSan || currentBestMove || "Pending";
  const graphMoveRows = useMemo(
    () => renderedMoves.filter((entry) => entry.node.engineEval != null).slice(-42),
    [renderedMoves],
  );

  const handleCandidateSelect = useCallback((index: number) => {
    const row = candidateRows[index];
    if (!row) {
      return;
    }

    setSelectedCandidateIndex(index);
    setCoachFeed((current) => [
      {
        id: `candidate-${row.id}`,
        moveId: currentNode?.id || "candidate",
        title: index === 0 ? "Main engine line" : "Candidate line",
        text: `Selected line ${row.score}: ${row.text}`,
        detail: "The board keeps the current position while the coach explains this candidate continuation.",
        tone: index === 0 ? ("system" as const) : ("neutral" as const),
        moveLabel: currentMoveLabel,
      },
      ...current,
    ].slice(0, 12));
  }, [candidateRows, currentMoveLabel, currentNode?.id]);

  const handleReportJump = useCallback(
    (classification: MoveClassification) => {
      const target = renderedMoves.find((entry) => entry.node.classification === classification);
      if (!target) {
        toast.info(`No ${classificationLabel(classification).toLowerCase()} moves found.`);
        return;
      }

      navigateTo(target.path);
      setAnalysisReportMode(classification === "blunder" || classification === "mistake" ? "critical" : "overview");
    },
    [navigateTo, renderedMoves],
  );

  const openCriticalReview = useCallback(() => {
    if (criticalMoveEntry) {
      navigateTo(criticalMoveEntry.path);
    }
    setAnalysisReportMode("critical");
  }, [criticalMoveEntry, navigateTo]);

  const handleNextKeyMoment = useCallback(() => {
    if (keyMomentRows.length === 0) {
      toast.info("No key moments detected yet.");
      return;
    }

    const currentIndex = keyMomentRows.findIndex((entry) => isSamePath(entry.path, record.currentPath));
    const next = keyMomentRows[currentIndex >= 0 ? (currentIndex + 1) % keyMomentRows.length : 0];
    navigateTo(next.path);
    setAnalysisReportMode("critical");
  }, [keyMomentRows, navigateTo, record.currentPath]);

  return (
    <div className="relative min-h-screen overflow-y-auto bg-transparent text-white lg:overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pgn,.txt,.fen"
        className="hidden"
        onChange={handleImportGame}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[22vw] min-w-[210px] opacity-0 blur-[1px] grayscale"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 42%, transparent), radial-gradient(circle at 32% 36%, rgba(255,255,255,0.16), transparent 26%), linear-gradient(180deg, #262626, #080808)",
        }}
      >
        <div className="absolute left-[-32px] top-[14%] text-[210px] font-black leading-none text-white/12">♞</div>
        <div className="absolute bottom-[10%] left-[16px] text-[170px] font-black leading-none text-white/10">♜</div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[24vw] min-w-[230px] opacity-0 blur-[2px] grayscale"
        style={{
          background:
            "linear-gradient(270deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03) 44%, transparent), radial-gradient(circle at 68% 62%, rgba(255,255,255,0.15), transparent 28%), linear-gradient(180deg, #242424, #060606)",
        }}
      >
        <div className="absolute right-[-44px] top-[20%] text-[220px] font-black leading-none text-white/10">♚</div>
        <div className="absolute bottom-[8%] right-[22px] text-[170px] font-black leading-none text-white/10">♟</div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,166,80,0.08),transparent_42%),linear-gradient(90deg,rgba(8,13,20,0.38),transparent_24%,transparent_76%,rgba(8,13,20,0.42))]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-[1160px] flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:gap-8 xl:gap-9">
          <section className="flex shrink-0 flex-col gap-2">
            <div className="ml-10 flex h-10 items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info(`${topPlayer.label}: ${topPlayer.name} · ${topPlayer.meta}`)}
                className="grid h-10 w-10 place-items-center rounded-[4px] bg-white/20 text-[#1d1d1d] shadow-inner shadow-white/10 transition hover:bg-white/28 focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
                aria-label={`${topPlayer.label} player information`}
              >
                <UserRound className="h-7 w-7 fill-[#1b1b1b] stroke-[#1b1b1b]" />
              </button>
              <button
                type="button"
                onClick={() => toast.info(`${topPlayer.label}: ${topPlayer.name} · ${topPlayer.meta}`)}
                className="text-[19px] font-extrabold text-white drop-shadow transition hover:text-[#d8e9ff] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
              >
                {topPlayer.label}
              </button>
            </div>

            <div className="flex items-end gap-3">
              <div
                className="relative mb-0 overflow-hidden rounded-[1px] border border-black/20 bg-[#f4f4f2]"
                style={{ width: 29, height: boardSize }}
                title={hasEngineEval ? `Evaluation ${evalLabel} · ${evaluationVerdict}` : "Engine evaluation pending"}
              >
                <div
                  className="absolute inset-x-0 top-0 transition-all duration-300"
                  style={{
                    height: `${evalTopSegment.height}%`,
                    backgroundColor: evalTopSegment.color,
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 transition-all duration-300"
                  style={{
                    height: `${evalBottomSegment.height}%`,
                    backgroundColor: evalBottomSegment.color,
                  }}
                />
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold"
                  style={{ color: flipped ? "#f4f4f2" : "#1c1c1c" }}
                >
                  {evalLabel}
                </span>
              </div>

              <div className="relative">
                <div className="absolute -right-10 -top-12 flex items-center gap-1 text-white/55">
                  <button
                    type="button"
                    onClick={() => setFlipped((value) => !value)}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                    aria-label="Flip board"
                  >
                    <FlipVertical className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
                    aria-label="Open analysis settings"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
                {editorOpen ? (
                  <Chessboard
                    id="analysis-editor"
                    position={editorPosition}
                    boardWidth={boardSize}
                    boardOrientation={flipped ? "black" : "white"}
                    dropOffBoardAction="trash"
                    onPieceDrop={handleEditorDrop}
                    onPieceDropOffBoard={handleEditorDropOffBoard}
                    onSquareClick={handleEditorSquareClick}
                    showBoardNotation={showCoordinatesEnabled}
                    animationDuration={moveAnimationEnabled ? 240 : 0}
                    customDarkSquareStyle={{
                      background: "linear-gradient(135deg, rgba(104,148,169,0.96), rgba(88,128,147,0.98)), radial-gradient(circle at 20% 15%, rgba(255,255,255,0.18), transparent 38%)",
                    }}
                    customLightSquareStyle={{
                      background: "linear-gradient(135deg, rgba(226,241,246,0.98), rgba(196,222,231,0.96)), radial-gradient(circle at 28% 18%, rgba(255,255,255,0.42), transparent 40%)",
                    }}
                    customBoardStyle={{
                      borderRadius: 2,
                      boxShadow: "0 28px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)",
                    }}
                  />
                ) : (
                  <ChessBoard
                    initialFen={currentFen}
                    size={boardSize}
                    onMove={handleBoardMove}
                    interactive={!isAutoPlaying}
                    flipped={flipped}
                    showLegalMoves={highlightMoves}
                    showLastMove={showLastMoveEnabled}
                    showChecks
                    customArrows={currentArrows}
                    allowArrows
                    lastMoveSquares={lastMoveSquares}
                    animationDuration={moveAnimationEnabled ? 180 : 0}
                    customDarkSquareStyle={{
                      background: "linear-gradient(135deg, rgba(104,148,169,0.96), rgba(88,128,147,0.98)), radial-gradient(circle at 20% 15%, rgba(255,255,255,0.18), transparent 38%)",
                    }}
                    customLightSquareStyle={{
                      background: "linear-gradient(135deg, rgba(226,241,246,0.98), rgba(196,222,231,0.96)), radial-gradient(circle at 28% 18%, rgba(255,255,255,0.42), transparent 40%)",
                    }}
                    customBoardStyle={{
                      borderRadius: 2,
                      boxShadow: "0 28px 70px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.08)",
                    }}
                  />
                )}
              </div>
            </div>

            <div className="ml-10 flex h-10 items-center gap-3">
              <button
                type="button"
                onClick={() => toast.info(`${bottomPlayer.label}: ${bottomPlayer.name} · ${bottomPlayer.meta}`)}
                className="grid h-10 w-10 place-items-center rounded-[4px] bg-white/85 text-[#d9d9d9] shadow-inner shadow-white/20 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
                aria-label={`${bottomPlayer.label} player information`}
              >
                <UserRound className="h-7 w-7 fill-[#d9d9d9] stroke-[#d9d9d9]" />
              </button>
              <button
                type="button"
                onClick={() => toast.info(`${bottomPlayer.label}: ${bottomPlayer.name} · ${bottomPlayer.meta}`)}
                className="text-[19px] font-extrabold text-white drop-shadow transition hover:text-[#d8e9ff] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
              >
                {bottomPlayer.label}
              </button>
            </div>
          </section>

          <aside className="w-full max-w-[400px] overflow-hidden rounded-[4px] border border-white/5 bg-[#151515]/88 shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-md lg:w-[392px]">
            <div className="relative bg-black/22 px-3 py-2.5 text-center shadow-inner shadow-white/[0.03]">
              {analysisPhase === "complete" && analysisReportMode !== "overview" ? (
                <button
                  type="button"
                  onClick={() => setAnalysisReportMode("overview")}
                  className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
                  aria-label="Back to analysis overview"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
              <div className="inline-flex items-center justify-center gap-2 text-[20px] font-extrabold text-white">
                <Search className="h-4 w-4 rounded-full bg-[#c9e5f7] p-0.5 text-[#334554]" />
                {analysisPanelTitle}
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
                aria-label="Analysis panel settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 p-2.5">
              {analysisIsRunning ? (
                <div className="rounded-[10px] border border-[#7fa650]/24 bg-black/24 p-3 shadow-inner shadow-white/[0.03]" aria-live="polite">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#a9cf7c]">Analyzing</p>
                      <p className="mt-1 text-[15px] font-bold text-white">{analysisMessage}</p>
                    </div>
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#9dcc67]" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7fa650] to-[#b8df7e] transition-all duration-300"
                      style={{ width: `${Math.max(4, analysisProgress)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[12px] font-semibold text-white/62">
                    <span>{progressLabel}</span>
                    <span>{liveDepth ? `Depth ${liveDepth}` : "Engine warmup"}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="h-9 animate-pulse rounded-[8px] border border-white/8 bg-white/[0.055]" />
                    ))}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-12 animate-pulse rounded-[8px] border border-white/8 bg-white/[0.045]" />
                      <div className="h-12 animate-pulse rounded-[8px] border border-white/8 bg-white/[0.045]" />
                    </div>
                  </div>
                  {canStopAnalysis ? (
                    <button
                      type="button"
                      onClick={handleStopAnalysis}
                      className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.055] text-[13px] font-bold text-white/78 transition hover:bg-white/[0.09] hover:text-white"
                    >
                      <Pause className="h-4 w-4" />
                      Stop analysis
                    </button>
                  ) : null}
                </div>
              ) : analysisPhase === "complete" || analysisPhase === "error" ? (
                <div className="space-y-2">
                  {analysisPhase === "error" ? (
                    <div className="max-w-full overflow-hidden rounded-[10px] border border-rose-400/25 bg-rose-500/10 p-3 text-[13px] text-rose-50">
                      <p className="font-extrabold">Analysis failed. Try again.</p>
                      <p className="mt-1 max-h-20 overflow-y-auto break-words text-rose-50/72">
                        {analysisError || "The board and previous data were kept intact."}
                      </p>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-5 gap-1.5">
                    <button type="button" onClick={() => setPgnDialogOpen(true)} className="grid h-8 place-items-center rounded-[7px] border border-white/10 bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white" aria-label="Import PGN">
                      <Upload className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setFenDialogOpen(true)} className="grid h-8 place-items-center rounded-[7px] border border-white/10 bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white" aria-label="Paste FEN">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setFlipped((value) => !value)} className="grid h-8 place-items-center rounded-[7px] border border-white/10 bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white" aria-label="Flip board">
                      <FlipVertical className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={copyCurrentFen} className="grid h-8 place-items-center rounded-[7px] border border-white/10 bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white" aria-label="Copy FEN">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={handleOpenEditorFromCurrent} className="grid h-8 place-items-center rounded-[7px] border border-white/10 bg-white/[0.045] text-white/70 transition hover:bg-white/[0.09] hover:text-white" aria-label="Edit position">
                      <PencilLine className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-white/[0.055] p-1 text-[12px] font-extrabold">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool("class");
                        setAnalysisReportMode("overview");
                      }}
                      className={cn("h-8 rounded-[8px] text-white/64 transition hover:bg-white/[0.08] hover:text-white", analysisReportMode === "overview" && activeTool !== "openings" && "bg-black/45 text-white shadow-inner shadow-black/40")}
                    >
                      Аналіз
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalysisReportMode("report")}
                      className={cn("h-8 rounded-[8px] text-white/64 transition hover:bg-white/[0.08] hover:text-white", analysisReportMode === "report" && "bg-black/45 text-white shadow-inner shadow-black/40")}
                    >
                      Партії
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTool("openings");
                        setAnalysisReportMode("overview");
                      }}
                      className={cn("h-8 rounded-[8px] text-white/64 transition hover:bg-white/[0.08] hover:text-white", analysisReportMode === "overview" && activeTool === "openings" && "bg-black/45 text-white shadow-inner shadow-black/40")}
                    >
                      До бази деб'ютів
                    </button>
                  </div>

                  {analysisReportMode === "overview" ? (
                    <div className="space-y-2">
                      <div className="rounded-[10px] border border-white/10 bg-black/22 p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-bold text-white/52">
                          <span>{activeTool === "openings" ? openingMatch?.opening.name || "Unknown opening" : "Аналіз"}</span>
                          <span>depth={currentEngine?.depth || liveDepth || 0} | Stockfish 18</span>
                        </div>
                        <div className="space-y-1.5">
                          {activeTool === "openings" ? (
                            <div className="rounded-[8px] border border-[#7fa650]/25 bg-[#7fa650]/10 p-2 text-[12px] text-white/82">
                              <p className="font-extrabold text-white">{openingMatch?.opening.name || "Opening line not found"}</p>
                              <p className="mt-1 text-white/58">ECO {openingMatch?.opening.eco || "—"} · {openingSummary}</p>
                            </div>
                          ) : null}
                          {candidateRows.map((row, index) => (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => handleCandidateSelect(index)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-[7px] border px-2 py-1.5 text-left text-[12px] transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40",
                                selectedCandidateIndex === index
                                  ? "border-[#7fa650]/45 bg-[#7fa650]/12"
                                  : "border-white/8 bg-white/[0.035]",
                              )}
                            >
                              <span className={cn("shrink-0 rounded-[5px] px-1.5 py-0.5 text-[12px] font-black", row.isPrimary ? "bg-white text-black" : "bg-white/12 text-white")}>
                                {row.score}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-semibold text-white/82">{row.text}</span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/38" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[10px] border border-white/10 bg-black/20 p-2.5">
                        <div className="mb-2 flex items-center justify-between text-[12px] font-extrabold text-white">
                          <span>Білі - Чорні</span>
                          <span className="text-[11px] text-white/45">{record.headers.Result || "*"}</span>
                        </div>
                        <div className="max-h-[126px] space-y-1 overflow-y-auto pr-1">
                          {resultMovePairs.length > 0 ? resultMovePairs.slice(0, 14).map((pair) => (
                            <div key={pair.number} className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-[12px]">
                              <span className="text-white/42">{pair.number}.</span>
                              {[pair.white, pair.black].map((slot, index) =>
                                slot ? (
                                  <button
                                    key={slot.node.id}
                                    type="button"
                                    onClick={() => navigateTo(slot.path)}
                                    className={cn("truncate rounded-[6px] px-2 py-1 text-left font-extrabold transition hover:bg-white/[0.08]", isSamePath(slot.path, record.currentPath) ? "bg-[#7fa650]/16 text-[#d9f6b7]" : "text-white/78")}
                                  >
                                    {slot.node.san}
                                  </button>
                                ) : <span key={`empty-overview-${pair.number}-${index}`} />,
                              )}
                            </div>
                          )) : (
                            <p className="rounded-[8px] border border-white/8 bg-white/[0.035] p-3 text-[12px] text-white/66">Current position. Best move: <span className="font-bold text-white">{currentBestMove || "Pending"}</span></p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-[10px] border border-[#7fa650]/20 bg-[#7fa650]/[0.07] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[12px] font-extrabold text-white">Growth system</p>
                            <p className="text-[11px] font-semibold text-white/48">
                              {growthSummary.reviewCount} reviews · {growthSummary.openMistakeCount} open mistakes
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleShowBlunder}
                            className="rounded-[7px] border border-rose-400/25 bg-rose-500/12 px-2 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-rose-500/18"
                          >
                            Review mistakes
                          </button>
                        </div>

                        <div className="mt-2 grid gap-2">
                          {notebookPreview.length > 0 ? (
                            notebookPreview.map((entry) => (
                              <div key={entry.id} className="rounded-[8px] border border-white/8 bg-black/20 p-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate text-[12px] font-extrabold text-white">
                                    {entry.moveNumber}. {entry.san} · {classificationLabel(entry.classification)}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => updateNotebookStatus(entry.id, "fixed")}
                                    className="shrink-0 rounded-[6px] border border-[#7fa650]/35 bg-[#7fa650]/18 px-2 py-1 text-[10px] font-bold text-white transition hover:bg-[#7fa650]/26"
                                  >
                                    Fixed
                                  </button>
                                </div>
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/60">
                                  Best: {entry.bestMoveSan || "pending"} · {entry.explanation}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-[8px] border border-white/8 bg-black/16 p-2 text-[11px] text-white/58">
                              No notebook mistakes yet. Run Game Review to collect real mistakes.
                            </p>
                          )}
                        </div>

                        <div className="mt-2 rounded-[8px] border border-white/8 bg-black/16 p-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/42">Today&apos;s training plan</p>
                          <div className="mt-1 space-y-1">
                            {trainingPlanPreview.map((item) => (
                              <div key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="truncate font-bold text-white/78">{item.title}</span>
                                <span className={cn("shrink-0 rounded-full px-2 py-0.5 font-extrabold", item.priority === "high" ? "bg-rose-500/16 text-rose-100" : "bg-white/10 text-white/60")}>
                                  {item.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={handleNewAnalysis} className="h-9 rounded-[8px] border border-white/10 bg-white/[0.06] text-[12px] font-extrabold text-white/78 transition hover:bg-white/[0.1] hover:text-white">Новинка</button>
                        <button type="button" onClick={() => { rememberCurrentSession("Manual save"); toast.success("Analysis saved."); }} className="h-9 rounded-[8px] border border-white/10 bg-white/[0.06] text-[12px] font-extrabold text-white/78 transition hover:bg-white/[0.1] hover:text-white">Зберегти</button>
                        <button type="button" onClick={() => setAnalysisReportMode("report")} className="h-9 rounded-[8px] border border-[#7fa650]/30 bg-[#7fa650]/14 text-[12px] font-extrabold text-white transition hover:bg-[#7fa650]/22">Розбір</button>
                      </div>
                    </div>
                  ) : null}

                  {analysisReportMode === "report" ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[10px] bg-white/88 text-[#252525] shadow-lg shadow-black/30">
                          <UserRound className="h-10 w-10 fill-[#c9c9c9] stroke-[#363636]" />
                        </div>
                        <button
                          type="button"
                          onClick={handleExplainMore}
                          className="relative min-h-14 flex-1 rounded-[8px] bg-white px-3 py-2 text-left text-[12px] font-semibold leading-5 text-[#1d1d1d] shadow-lg shadow-black/25 transition hover:brightness-95"
                        >
                          <span className="absolute -left-2 top-5 h-4 w-4 rotate-45 bg-white" />
                          {record.mainline.length > 0
                            ? `Game report ready. ${whitePlayerName} scored ${sideAccuracy.white}, ${blackPlayerName} scored ${sideAccuracy.black}.`
                            : `Position analysis ready. ${evaluationVerdict} with best move ${currentBestMove || "pending"}.`}
                        </button>
                      </div>

                      <button type="button" onClick={() => graphMoveRows[graphMoveRows.length - 1] && navigateTo(graphMoveRows[graphMoveRows.length - 1].path)} className="w-full rounded-[8px] border border-white/8 bg-white/90 p-0 transition hover:brightness-95">
                        <svg viewBox="0 0 100 34" className="h-[70px] w-full rounded-[8px]" preserveAspectRatio="none" aria-label="Evaluation graph">
                          <rect x="0" y="0" width="100" height="34" fill="rgba(20,20,20,0.22)" />
                          <line x1="0" y1="17" x2="100" y2="17" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
                          <polyline points={evalGraphPolyline} fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                          {evalGraphPoints.map((point, index) => (
                            <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={index === evalGraphPoints.length - 1 ? 1.8 : 1.2} fill={index === evalGraphPoints.length - 1 ? "#ef4444" : "#b88a62"} />
                          ))}
                        </svg>
                      </button>

                      <div className="grid grid-cols-[1fr_1fr] gap-2 text-center">
                        <button type="button" onClick={() => toast.info("Showing white report focus.")} className={cn("rounded-[8px] border p-2 transition hover:bg-white/[0.08]", sideAccuracy.white >= sideAccuracy.black ? "border-[#7fa650]/45 bg-[#7fa650]/14" : "border-white/10 bg-white/[0.04]")}>
                          <p className="text-[11px] font-bold text-white/72">Білі</p>
                          <p className="mt-1 text-[20px] font-black text-white">{sideAccuracy.white}</p>
                        </button>
                        <button type="button" onClick={() => toast.info("Showing black report focus.")} className={cn("rounded-[8px] border p-2 transition hover:bg-white/[0.08]", sideAccuracy.black > sideAccuracy.white ? "border-[#7fa650]/45 bg-[#7fa650]/14" : "border-white/10 bg-white/[0.04]")}>
                          <p className="text-[11px] font-bold text-white/72">Чорні</p>
                          <p className="mt-1 text-[20px] font-black text-white">{sideAccuracy.black}</p>
                        </button>
                      </div>

                      <div className="rounded-[10px] border border-white/10 bg-black/20 p-2.5">
                        <div className="space-y-1.5">
                          {classificationReportRows.map((row) => (
                            <button
                              key={row.label}
                              type="button"
                              onClick={() => handleReportJump(row.key)}
                              className="grid w-full grid-cols-[1fr_38px_34px_38px] items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] font-extrabold text-white/82 transition hover:bg-white/[0.07]"
                            >
                              <span>{row.label}</span>
                              <span className="text-center text-[#52d6ba]">{classificationBySide[row.key].w}</span>
                              <span className={cn("mx-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px]", classificationClasses(row.key))}>{row.icon}</span>
                              <span className="text-center text-[#52d6ba]">{classificationBySide[row.key].b}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="button" onClick={openCriticalReview} className="flex h-12 w-full items-center justify-center rounded-[8px] bg-gradient-to-b from-[#79bf4a] to-[#5da73d] text-[17px] font-black text-white shadow-[0_12px_24px_rgba(78,153,44,0.24)] transition hover:brightness-110">
                        Розпочати розбір
                      </button>
                    </div>
                  ) : null}

                  {analysisReportMode === "critical" ? (
                    <div className="space-y-2">
                      <div className="rounded-[10px] bg-white p-3 text-[#202020] shadow-xl shadow-black/25">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-black">
                              <span className="mr-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] text-white">??</span>
                              {criticalMoveText} {criticalQuality}
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-[#363636]">{criticalMove?.explanation || latestCoachEntry.detail}</p>
                          </div>
                          <span className="shrink-0 rounded-[6px] bg-[#f3f3f3] px-2 py-1 text-[12px] font-black text-[#313131]">{currentMateLabel || evalLabel}</span>
                        </div>
                        <button type="button" onClick={handleShowBestMove} className="mt-3 rounded-[7px] bg-[#eeeeee] px-3 py-2 text-[12px] font-black text-[#282828] transition hover:bg-[#e0e0e0]">
                          Show Checkmate
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={handleShowBestMove} className="h-9 rounded-[7px] border border-white/10 bg-white/[0.08] text-[12px] font-extrabold text-white transition hover:bg-white/[0.13]">Best move</button>
                        <button type="button" onClick={() => criticalMoveEntry && navigateTo(criticalMoveEntry.path)} className="h-9 rounded-[7px] border border-white/10 bg-white/[0.08] text-[12px] font-extrabold text-white transition hover:bg-white/[0.13]">Repeat</button>
                        <button type="button" onClick={handleNextKeyMoment} className="h-9 rounded-[7px] border border-[#7fa650]/35 bg-[#7fa650]/22 text-[12px] font-extrabold text-white transition hover:bg-[#7fa650]/30">Next</button>
                      </div>

                      <div className="rounded-[10px] border border-white/10 bg-black/20 p-2.5">
                        <div className="max-h-[142px] space-y-1 overflow-y-auto pr-1">
                          {(keyMomentRows.length > 0 ? keyMomentRows : resultMoveRows.slice(0, 8)).map(({ path, node }) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => navigateTo(path)}
                              className={cn("grid w-full grid-cols-[28px_1fr_auto] items-center gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12px] transition hover:bg-white/[0.07]", isSamePath(path, record.currentPath) && "bg-white/[0.08]")}
                            >
                              <span className="text-white/45">{node.moveNumber}.</span>
                              <span className={cn("truncate font-extrabold", node.classification === "blunder" ? "text-rose-200" : node.classification === "best" ? "text-emerald-200" : "text-white/82")}>{node.san}</span>
                              <span className={cn("rounded-full border px-1.5 py-0.5 text-[10px] font-black", classificationClasses(node.classification))}>{classificationLabel(node.classification).replace(" move", "")}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="button" onClick={() => setAnalysisReportMode("report")} className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.08] text-[13px] font-black text-white transition hover:bg-white/[0.13]">
                        <ChevronLeft className="h-4 w-4" />
                        Ключові моменти
                      </button>

                      <svg viewBox="0 0 100 28" className="h-14 w-full rounded-[8px] border border-white/8 bg-white/90" preserveAspectRatio="none" aria-label="Critical evaluation graph">
                        <line x1="0" y1="14" x2="100" y2="14" stroke="rgba(0,0,0,0.24)" strokeWidth="1" />
                        <polyline points={evalGraphPolyline} fill="none" stroke="#5f5f5f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        <line x1="84" y1="0" x2="84" y2="28" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                      </svg>

                      <div className="grid grid-cols-4 gap-2">
                        <button type="button" onClick={moveToFirst} className="h-10 rounded-[8px] bg-white/[0.07] text-white/70 transition hover:bg-white/[0.12]"><ChevronsLeft className="mx-auto h-4 w-4" /></button>
                        <button type="button" onClick={moveBackward} className="h-10 rounded-[8px] bg-white/[0.07] text-white/70 transition hover:bg-white/[0.12]"><ChevronLeft className="mx-auto h-4 w-4" /></button>
                        <button type="button" onClick={() => setIsAutoPlaying((value) => !value)} className="h-10 rounded-[8px] bg-white/[0.07] text-white/70 transition hover:bg-white/[0.12]">{isAutoPlaying ? <Pause className="mx-auto h-4 w-4" /> : <Play className="mx-auto h-4 w-4" />}</button>
                        <button type="button" onClick={moveForward} className="h-10 rounded-[8px] bg-white/[0.07] text-white/70 transition hover:bg-white/[0.12]"><ChevronRight className="mx-auto h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : null}

                  <div className="hidden">
                    {topMoveCounts.map((item) => (
                      <div key={item.label} className={cn("rounded-[8px] border px-2 py-2 text-center", classificationClasses(item.tone))}>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-80">{item.label}</p>
                        <p className="mt-1 text-lg font-black text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden rounded-[10px] border border-white/10 bg-black/22 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-white/45">Evaluation summary</p>
                        <p className="mt-1 text-[19px] font-black text-white">{evalLabel} · {evaluationVerdict}</p>
                        <p className="mt-1 truncate text-[11px] font-semibold text-white/48">{displayEngineStatusLabel}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <EvalBar
                          score={currentEvalScore}
                          height={68}
                          mateLabel={currentMateLabel}
                          orientation={flipped ? "white-top" : "white-bottom"}
                          className="scale-90 origin-right"
                        />
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-white/65">
                          {cleanEngineDepthLabel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div className="rounded-[8px] border border-white/8 bg-white/[0.045] p-2">
                        <p className="text-white/45">Best move</p>
                        <p className="mt-1 truncate font-extrabold text-white">{currentBestMove || "Pending"}</p>
                      </div>
                      <div className="rounded-[8px] border border-white/8 bg-white/[0.045] p-2">
                        <p className="text-white/45">Reviewed</p>
                        <p className="mt-1 font-extrabold text-white">{reviewedMoveCount || (currentEngine ? 1 : 0)} moves</p>
                      </div>
                    </div>
                    <div className="mt-2 rounded-[8px] border border-white/8 bg-white/[0.035] p-2 text-[12px] text-white/72">
                      <p className="font-bold text-white/45">Alternatives</p>
                      <p className="mt-1 line-clamp-2">{currentPv.slice(0, 5).join(" / ") || "Engine line pending."}</p>
                    </div>
                  </div>

                  <div className="hidden rounded-[10px] border border-white/10 bg-black/22 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-extrabold text-white">Move review</p>
                      <span className="text-[11px] font-bold text-white/45">{finalMoveProgressLabel}</span>
                    </div>
                    <div className="mt-2 max-h-[154px] space-y-1.5 overflow-y-auto pr-1">
                      {resultMovePairs.length > 0 ? (
                        resultMovePairs.map((pair) => (
                          <div key={pair.number} className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-[12px]">
                            <span className="text-center text-[11px] font-bold text-white/38">{pair.number}</span>
                            {[pair.white, pair.black].map((slot, index) =>
                              slot ? (
                                <button
                                  key={slot.node.id}
                                  type="button"
                                  onClick={() => navigateTo(slot.path)}
                                  className={cn(
                                    "min-w-0 rounded-[8px] border px-2 py-1.5 text-left transition hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40",
                                    isSamePath(slot.path, record.currentPath)
                                      ? "border-[#7fa650]/45 bg-[#7fa650]/12"
                                      : "border-white/8 bg-white/[0.025]",
                                  )}
                                >
                                  <span className="block truncate font-extrabold text-white">{slot.node.san}</span>
                                  <span className={cn("mt-1 inline-flex max-w-full rounded-full border px-1.5 py-0.5 text-[9px] font-extrabold", classificationClasses(slot.node.classification))}>
                                    {classificationLabel(slot.node.classification).replace(" move", "")}
                                  </span>
                                </button>
                              ) : (
                                <span key={`empty-${pair.number}-${index}`} />
                              ),
                            )}
                          </div>
                        ))
                      ) : resultMoveRows.length > 0 ? (
                        resultMoveRows.map(({ path, node }) => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => navigateTo(path)}
                            className={cn(
                              "flex w-full items-center justify-between gap-2 rounded-[8px] border px-2 py-1.5 text-left text-[12px] transition hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40",
                              isSamePath(path, record.currentPath)
                                ? "border-[#7fa650]/45 bg-[#7fa650]/12"
                                : "border-white/8 bg-white/[0.025]",
                            )}
                          >
                            <span className="truncate font-bold text-white">
                              {node.color === "w" ? `${node.moveNumber}.` : `${node.moveNumber}...`} {node.san}
                            </span>
                            <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-extrabold", classificationClasses(node.classification))}>
                              {classificationLabel(node.classification)}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-[8px] border border-white/8 bg-white/[0.035] p-3 text-[12px] text-white/70">
                          Current position analyzed. Best move: <span className="font-bold text-white">{currentBestMove || "Pending"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden rounded-[10px] border border-white/10 bg-black/22 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-extrabold text-white">Evaluation graph</p>
                      <span className="text-[11px] font-bold text-white/45">{reviewedMoveCount ? `${reviewedMoveCount} reviewed` : "Idle"}</span>
                    </div>
                    <svg viewBox="0 0 100 100" className="mt-2 h-16 w-full overflow-visible rounded-[8px] border border-white/8 bg-white/[0.03]" preserveAspectRatio="none" aria-label="Evaluation graph">
                      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                      <polyline
                        points={evalGraphPolyline}
                        fill="none"
                        stroke="#9dcc67"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  <div className={cn("hidden rounded-[10px] border p-3", coachToneClasses(latestCoachEntry.tone))}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-extrabold text-white">AI Coach</p>
                        <p className="mt-0.5 text-[11px] font-bold text-white/55">{latestCoachEntry.moveLabel}</p>
                      </div>
                      <BrainCircuit className="h-4 w-4 shrink-0 text-white/65" />
                    </div>
                    <div className="mt-2 space-y-1.5 text-[12px] leading-5 text-white/82">
                      <p><span className="font-extrabold text-white">Idea:</span> {latestCoachEntry.text}</p>
                      <p><span className="font-extrabold text-white">Problem:</span> {currentNode?.classification === "mistake" || currentNode?.classification === "blunder" ? latestCoachEntry.detail : "No major tactical problem is forced in the current line."}</p>
                      <p><span className="font-extrabold text-white">Better move:</span> {currentBestMove || currentNode?.bestMoveSan || "Pending"}</p>
                      <p><span className="font-extrabold text-white">Plan:</span> {currentPv.slice(0, 4).join(" / ") || openingSummary}</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      <button type="button" onClick={handleExplainMore} className="rounded-[7px] border border-white/10 bg-white/[0.06] px-2 py-2 text-[11px] font-extrabold text-white transition hover:bg-white/[0.1]">Explain</button>
                      <button type="button" onClick={handleShowBestMove} className="rounded-[7px] border border-[#7fa650]/35 bg-[#7fa650]/18 px-2 py-2 text-[11px] font-extrabold text-white transition hover:bg-[#7fa650]/26">Best</button>
                      <button type="button" onClick={handleShowBlunder} className="rounded-[7px] border border-rose-400/25 bg-rose-500/12 px-2 py-2 text-[11px] font-extrabold text-white transition hover:bg-rose-500/18">Blunder</button>
                    </div>
                  </div>

                  <div className="hidden rounded-[10px] border border-white/10 bg-black/22 p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-extrabold text-white">Game info</p>
                      <span className="text-[11px] font-bold text-white/45">{gamePhase}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {gameInfoRows.map((item) => (
                        <div key={item.label} className="rounded-[8px] border border-white/8 bg-white/[0.035] px-2 py-1.5">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/38">{item.label}</p>
                          <p className="mt-1 truncate text-[11px] font-bold text-white/78">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
              <button
                type="button"
                onClick={() => {
                  setActiveTool("class");
                  setRightPanelTab("analysis");
                }}
                className={cn(
                  "flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[16px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.14] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40 active:translate-y-px",
                  activeTool === "class" && "border-[#7fa650]/45 bg-[#7fa650]/12",
                )}
              >
                <BarChart3 className="h-5 w-5 text-[#b7d88b]" />
                Клас
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("openings")}
                className={cn(
                  "flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[15px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.14] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40 active:translate-y-px",
                  activeTool === "openings" && "border-[#7fa650]/45 bg-[#7fa650]/12",
                )}
              >
                <Compass className="h-5 w-5 text-[#d9d9d9]" />
                До бази деб'ютів
              </button>
              <button
                type="button"
                onClick={() => setActiveTool("collections")}
                className={cn(
                  "flex h-[46px] w-full items-center justify-center gap-2.5 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] text-[15px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.22)] transition hover:bg-white/[0.14] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40 active:translate-y-px",
                  activeTool === "collections" && "border-[#7fa650]/45 bg-[#7fa650]/12",
                )}
              >
                <Layers3 className="h-5 w-5 text-[#9dcc67]" />
                Колекції партій
              </button>

              <div
                className={cn(
                  "overflow-hidden rounded-[8px] border bg-black/18 shadow-inner shadow-white/[0.03] transition",
                  isImportDragging ? "border-[#7fa650]/70 bg-[#7fa650]/10" : "border-white/10",
                )}
                onDragEnter={() => setImportDragging(true)}
                onDragLeave={() => setImportDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setImportDragging(true);
                }}
                onDrop={handleQuickDrop}
              >
                {activeTool === "import" ? (
                  <Textarea
                    value={quickImportDraft}
                    onChange={(event) => setQuickImportDraft(event.target.value)}
                    placeholder="Paste your FEN, PGN(s), or drag & drop your PGN file here."
                    className="min-h-[88px] resize-none border-0 bg-transparent px-3 py-2 text-[13px] text-white placeholder:text-white/36 focus-visible:ring-0"
                    aria-label="Paste PGN or FEN"
                  />
                ) : (
                  <div className="min-h-[88px] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-extrabold text-white">{analysisModeLabel}</p>
                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/70">
                        {positionSourceLabel}
                      </span>
                    </div>

                    {activeTool === "class" ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-white/78">
                        <div className="rounded-[7px] border border-white/8 bg-white/[0.04] p-2">
                          <p className="text-white/45">Position</p>
                          <p className="font-bold text-white">{positionClass}</p>
                        </div>
                        <div className="rounded-[7px] border border-white/8 bg-white/[0.04] p-2">
                          <p className="text-white/45">Evaluation</p>
                          <p className="font-bold text-white">{evalLabel} · {evaluationVerdict}</p>
                        </div>
                        <div className="rounded-[7px] border border-white/8 bg-white/[0.04] p-2">
                          <p className="text-white/45">Best move</p>
                          <p className="font-bold text-white">{currentBestMove || "Pending"}</p>
                        </div>
                        <div className="rounded-[7px] border border-white/8 bg-white/[0.04] p-2">
                          <p className="text-white/45">Accuracy</p>
                          <p className="font-bold text-white">{accuracy}% · ACPL {acpl}</p>
                        </div>
                      </div>
                    ) : activeTool === "openings" ? (
                      <div className="mt-3 space-y-2 text-[13px] text-white/75">
                        <p><span className="text-white/45">Opening:</span> {openingMatch?.opening.name || "Unknown line"}</p>
                        <p><span className="text-white/45">ECO:</span> {openingMatch?.opening.eco || "—"}</p>
                        <p className="max-h-10 overflow-hidden">{openingSummary}</p>
                      </div>
                    ) : activeTool === "collections" ? (
                      <div className="mt-3 space-y-2 text-[13px] text-white/75">
                        {storedSessions.length > 0 ? (
                          storedSessions.slice(0, 2).map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => restoreSession(session)}
                              className="flex w-full items-center justify-between rounded-[7px] border border-white/8 bg-white/[0.04] px-2 py-2 text-left transition hover:bg-white/[0.08]"
                            >
                              <span className="truncate font-bold text-white">{session.title}</span>
                              <span className="text-[11px] text-white/45">{session.source}</span>
                            </button>
                          ))
                        ) : (
                          <p>No saved analyses yet. Start analysis to save this session locally.</p>
                        )}
                      </div>
                    ) : activeTool === "course" ? (
                      <div className="mt-3 space-y-2 text-[13px] text-white/75">
                        <p>Course mode is ready for lesson positions. Current board stays safe until a lesson is selected.</p>
                        <button
                          type="button"
                          onClick={() => toast.info("Course library will use your real lessons when available.")}
                          className="rounded-[7px] border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.1]"
                        >
                          Browse lessons
                        </button>
                      </div>
                    ) : activeTool === "history" ? (
                      <div className="mt-3 space-y-2 text-[13px] text-white/75">
                        {storedSessions.length > 0 ? (
                          <p>{storedSessions.length} local analysis sessions are available. Use Load Previous or Collections to restore one.</p>
                        ) : (
                          <p>No previous analysis history yet.</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-[13px] text-white/75">
                        <p>Editor mode is {editorOpen ? "enabled" : "available"}. Place pieces, clear the board, or apply a custom FEN setup.</p>
                        <button
                          type="button"
                          onClick={applyEditorAsRoot}
                          disabled={!editorOpen}
                          className="rounded-[7px] border border-white/10 bg-white/[0.06] px-3 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Apply editor position
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-10 w-full items-center justify-center gap-2 border-t border-white/8 bg-white/[0.045] text-[14px] font-extrabold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <CloudUpload className="h-4 w-4" />
                  Вивантажити файл
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTool("collections")}
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-[13px] font-extrabold leading-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/[0.14]"
                >
                  <Archive className="h-4 w-4 shrink-0 text-[#e2a941]" />
                  <span>Збережені розбори партій</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("course");
                    toast.info("Course loader is ready. Real lessons will appear when available.");
                  }}
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-[13px] font-extrabold leading-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/[0.14]"
                >
                  <Link2 className="h-4 w-4 shrink-0 text-[#c7c7c7]" />
                  <span>Завантажити курс</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool("history")}
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-[13px] font-extrabold leading-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/[0.14]"
                >
                  <FolderClock className="h-4 w-4 shrink-0 text-[#f0d48e]" />
                  <span>Історія партій</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool("editor");
                    handleOpenEditorFromCurrent();
                  }}
                  className="flex h-[46px] items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-gradient-to-b from-white/[0.11] to-white/[0.055] px-2 text-center text-[13px] font-extrabold leading-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:bg-white/[0.14]"
                >
                  <PencilLine className="h-4 w-4 shrink-0 text-[#f3df93]" />
                  <span>Встановити позицію</span>
                </button>
              </div>
                </>
              )}

              <button
                type="button"
                onClick={() => void handleStartAnalysis()}
                disabled={primaryActionDisabled}
                className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[8px] bg-gradient-to-b from-[#79bf4a] to-[#5da73d] text-[18px] font-extrabold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_26px_rgba(78,153,44,0.24)] transition hover:brightness-110 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
              >
                {primaryActionDisabled ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {primaryActionDisabled ? "Analyzing..." : analysisPhase === "complete" ? "Re-analyze" : "Розпочати аналіз"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!activeSession) {
                    toast.info("No previous analysis session yet.");
                    return;
                  }
                  restoreSession(activeSession);
                }}
                disabled={!activeSession || analysisIsRunning}
                className="flex items-center gap-2 px-3 pb-1 pt-1 text-[12px] font-semibold text-white/55 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" />
                Load Previous
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#191c22] text-white">
          <DialogHeader>
            <DialogTitle>Analysis settings</DialogTitle>
            <DialogDescription className="text-[#a0a7b2]">
              Changes apply immediately and are saved for this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <SettingToggle
              title="Flip board"
              description="Swap white and black sides on the board."
              checked={flipped}
              onCheckedChange={setFlipped}
            />
            <SettingToggle
              title="Coordinates"
              description="Show a-h and 1-8 board notation."
              checked={showCoordinatesEnabled}
              onCheckedChange={setShowCoordinatesEnabled}
            />
            <SettingToggle
              title="Sound"
              description="Play move, capture, and check sounds."
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
            <SettingToggle
              title="Move animation"
              description="Animate piece movement on the board."
              checked={moveAnimationEnabled}
              onCheckedChange={setMoveAnimationEnabled}
            />
            <SettingToggle
              title="Legal move dots"
              description="Highlight available destination squares."
              checked={highlightMoves}
              onCheckedChange={setHighlightMoves}
            />
            <SettingToggle
              title="Last move"
              description="Highlight the last move after navigation."
              checked={showLastMoveEnabled}
              onCheckedChange={setShowLastMoveEnabled}
            />
          </div>

          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-sm font-semibold text-white">Engine depth</p>
            <p className="mt-1 text-xs text-[#a0a7b2]">Higher depth is slower but gives stronger analysis.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[8, 10, 12, 14, 16].map((depth) => (
                <button
                  key={depth}
                  type="button"
                  onClick={() => setEngineDepth(depth)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40",
                    engineDepth === depth
                      ? "border-[#7fa650]/55 bg-[#7fa650]/20 text-white"
                      : "border-white/10 bg-white/[0.04] text-[#c7ced6] hover:bg-white/[0.08]",
                  )}
                >
                  Depth {depth}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-white/8 bg-white/[0.03] p-3">
            <p className="text-sm font-semibold text-white">Board theme</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={cn(
                    "flex items-center justify-between rounded-[14px] border px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40",
                    theme.id === option.id
                      ? "border-[#7fa650]/55 bg-[#7fa650]/15 text-white"
                      : "border-white/10 bg-white/[0.04] text-[#d0d6de] hover:bg-white/[0.08]",
                  )}
                >
                  <span>{option.name}</span>
                  <span className="flex overflow-hidden rounded-full border border-white/10">
                    <span className="h-4 w-4" style={{ background: option.light }} />
                    <span className="h-4 w-4" style={{ background: option.dark }} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isFenDialogOpen} onOpenChange={setFenDialogOpen}>
        <DialogContent className="max-w-xl border-white/10 bg-[#191c22] text-white">
          <DialogHeader>
            <DialogTitle>Paste FEN</DialogTitle>
            <DialogDescription className="text-[#a0a7b2]">
              Load a single position and start a new analysis from that exact board state.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={fenDraft}
            onChange={(event) => setFenDraft(event.target.value)}
            placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            className="min-h-[120px] border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFenDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button onClick={handleLoadFen} className="bg-[#7fa650] text-white hover:bg-[#90b862]">
              Apply FEN
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPgnDialogOpen} onOpenChange={setPgnDialogOpen}>
        <DialogContent className="max-w-3xl border-white/10 bg-[#191c22] text-white">
          <DialogHeader>
            <DialogTitle>Load PGN</DialogTitle>
            <DialogDescription className="text-[#a0a7b2]">
              Paste the PGN of a game and Analysis will rebuild the move list, opening, and engine review.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pgnDraft}
            onChange={(event) => setPgnDraft(event.target.value)}
            placeholder='[Event "Training"]'
            className="min-h-[220px] border-white/10 bg-white/5 font-mono text-sm text-white placeholder:text-[#7d8591]"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#a0a7b2]">
              You can load plain PGN, PGN with headers, or a shared `?pgn=` link.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPgnDialogOpen(false)}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button onClick={handleLoadPgn} className="bg-[#7fa650] text-white hover:bg-[#90b862]">
                Analyze PGN
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalysisPlayerStrip({
  side,
  name,
  meta,
  active,
  accent,
}: {
  side: "white" | "black";
  name: string;
  meta: string;
  active: boolean;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-[#13161b] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
            side === "white"
              ? "border-[#d7b98d] bg-[#f0d9b5] text-[#5d3d11]"
              : "border-white/10 bg-[#262b33] text-[#f3f4f6]",
          )}
        >
          {side === "white" ? "W" : "B"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{name}</p>
          <p className="truncate text-xs text-[#97a0ab]">{meta}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            active ? "bg-[#7fa650] text-white" : "bg-white/[0.04] text-[#c7ced6]",
          )}
        >
          {active ? "To move" : "Waiting"}
        </span>
        <span className="hidden rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#c7ced6] sm:inline-flex">
          {accent}
        </span>
      </div>
    </div>
  );
}

function IconActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#d0d6de] transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
    >
      {icon}
    </button>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-[#a0a7b2]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 min-w-[72px] items-center justify-center gap-2 rounded-[14px] border border-white/8 bg-[#191c22] px-3 py-2 text-[12px] font-semibold text-white transition hover:border-[#7fa650]/40 hover:bg-[#23272f] focus:outline-none focus:ring-2 focus:ring-[#7fa650]/40"
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a919b]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-white">{value}</p>
    </div>
  );
}

function InspectorSummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: MoveClassification;
}) {
  return (
    <div className={cn("rounded-[16px] border px-3 py-3", classificationClasses(tone))}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MoveTreeItem({
  node,
  depth,
  isActive,
  onClick,
  onNagChange,
  onCommentShortcut,
}: {
  node: AnalysisMoveNode;
  depth: number;
  isActive: boolean;
  onClick: () => void;
  onNagChange: (nag: MoveNag) => void;
  onCommentShortcut: () => void;
}) {
  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full rounded-[14px] border px-3 py-2 text-left transition",
          isActive
            ? "border-[#7fa650]/50 bg-[#7fa650]/10"
            : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              {node.color === "w" ? `${node.moveNumber}. ` : `${node.moveNumber}... `}
              {node.san}
              {node.nag ? ` ${node.nag}` : ""}
            </p>
            <p className="mt-1 text-xs text-[#a0a7b2]">
              {node.bestMoveSan ? `Best: ${node.bestMoveSan}` : "Pending engine review"}
            </p>
          </div>
          <div className={cn("rounded-full border px-2 py-0.5 text-[11px] font-semibold", classificationClasses(node.classification))}>
            {classificationLabel(node.classification)}
          </div>
        </div>
      </button>

      {isActive ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-2 pb-2">
          {NAG_OPTIONS.map((nag) => (
            <button
              key={nag}
              type="button"
              onClick={() => onNagChange(nag)}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#d0d6de] transition hover:bg-white/10"
            >
              {nag}
            </button>
          ))}
          <button
            type="button"
            onClick={onCommentShortcut}
            className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-[#d0d6de] transition hover:bg-white/10"
          >
            Comment
          </button>
        </div>
      ) : null}
    </div>
  );
}
