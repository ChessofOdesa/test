import { type BoardTheme } from "@/contexts/BoardSettingsContext";
import { OPENINGS, type Opening, type OpeningLine } from "@/lib/openings-data";
import { parsePGN } from "@/lib/pgnParser";
import { type AnalyzeResult, type EngineBackend, type EngineLine } from "@/lib/stockfish";
import { Chess, type PieceSymbol } from "chess.js";
import type { BoardPosition, Piece, Square } from "react-chessboard/dist/chessboard/types";
export type MoveNag = "!!" | "!" | "!?" | "?!" | "?" | "??" | null;
import type { MoveClassification } from "./scoring";
export type { MoveClassification } from "./scoring";
export { classificationFromLoss } from "./scoring";
export type AnalysisArrow = [
    Square,
    Square,
    string?
];
export type GamePhase = "Opening" | "Middlegame" | "Endgame";
export type AnalysisMoveNode = {
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
export type AnalysisSnapshot = {
    headers: Record<string, string>;
    rootFen: string;
    currentPath: number[] | null;
    mainline: AnalysisMoveNode[];
};
export type AnalysisRecord = AnalysisSnapshot & {
    historyStack: AnalysisSnapshot[];
    futureStack: AnalysisSnapshot[];
};
export type EngineSummary = {
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
export type OpeningMatch = {
    opening: Opening;
    line: OpeningLine | null;
    matchedPly: number;
};
export type RenderedMove = {
    path: number[];
    node: AnalysisMoveNode;
    depth: number;
};
export type MovePairSlot = {
    path: number[];
    node: AnalysisMoveNode;
};
export type MovePair = {
    number: number;
    white: MovePairSlot | null;
    black: MovePairSlot | null;
};
export type AnalysisReportMode = "overview" | "report" | "critical";
export type CoachTone = "best" | "good" | "neutral" | "warning" | "danger" | "system";
export type CoachEntry = {
    id: string;
    moveId: string;
    title: string;
    text: string;
    detail: string;
    tone: CoachTone;
    moveLabel: string;
};
export type AnalysisToolMode = "import" | "class" | "openings" | "collections" | "course" | "history" | "editor";
export type AnalysisRunPhase = "idle" | "importing" | "initializing" | "analyzingPosition" | "analyzingGame" | "complete" | "error";
export type AnalysisSessionSnapshot = {
    id: string;
    title: string;
    source: string;
    createdAt: string;
    snapshot: AnalysisSnapshot;
};
export type ParsedAnalysisImport = {
    record: AnalysisRecord;
    sourceType: "fen" | "pgn";
    message: string;
};
export type PersistedAnalysisSettings = {
    flipped: boolean;
    showCoordinates: boolean;
    soundEnabled: boolean;
    moveAnimation: boolean;
    highlightMoves: boolean;
    showLastMove: boolean;
    engineDepth: number;
    themeId: string;
};
export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const ANALYSIS_BOARD_THEME: BoardTheme = {
    id: "analysis-cinematic-blue",
    name: "Cinematic Analysis",
    light: "#dcecf2",
    dark: "#6e99ad",
};
export const NAG_OPTIONS: MoveNag[] = ["!!", "!", "!?", "?!", "?", "??"];
export const ANALYSIS_SETTINGS_STORAGE_KEY = "analysis.workspace.settings.v1";
export const ANALYSIS_SESSIONS_STORAGE_KEY = "analysis.workspace.sessions.v1";
export const DEFAULT_ANALYSIS_SETTINGS: PersistedAnalysisSettings = {
    flipped: false,
    showCoordinates: true,
    soundEnabled: true,
    moveAnimation: true,
    highlightMoves: true,
    showLastMove: true,
    engineDepth: 12,
    themeId: ANALYSIS_BOARD_THEME.id,
};
export const PIECE_VALUES: Record<PieceSymbol, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
};
export const EDITOR_PIECES: Array<{
    value: Piece;
    label: string;
}> = [
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
export let nodeIdCounter = 0;
export function nextNodeId() {
    nodeIdCounter += 1;
    return `analysis-node-${nodeIdCounter}`;
}
export function cloneNodes(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
    return nodes.map((node) => ({
        ...node,
        arrows: [...node.arrows],
        alternatives: [...node.alternatives],
        children: cloneNodes(node.children),
    }));
}
export function toSnapshot(record: AnalysisRecord | AnalysisSnapshot): AnalysisSnapshot {
    return {
        headers: { ...record.headers },
        rootFen: record.rootFen,
        currentPath: record.currentPath ? [...record.currentPath] : null,
        mainline: cloneNodes(record.mainline),
    };
}
export function createRecord(rootFen = START_FEN): AnalysisRecord {
    return {
        headers: {},
        rootFen,
        currentPath: null,
        mainline: [],
        historyStack: [],
        futureStack: [],
    };
}
export function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}
export function parseAnalysisImport(text: string): ParsedAnalysisImport {
    const value = text.trim();
    if (!value) {
        throw new Error("Вставте правильний FEN або PGN.");
    }
    try {
        const chess = new Chess(value);
        return {
            record: createRecord(chess.fen()),
            sourceType: "fen",
            message: "FEN loaded. Analyzing the current position.",
        };
    }
    catch {
        // Try PGN next.
    }
    try {
        const nextRecord = buildRecordFromPgn(value);
        return {
            record: nextRecord,
            sourceType: "pgn",
            message: `PGN loaded. Preparing ${nextRecord.mainline.length} moves for review.`,
        };
    }
    catch {
        throw new Error("Вставте правильний FEN або PGN.");
    }
}
export function readAnalysisSettings(): PersistedAnalysisSettings {
    if (typeof window === "undefined") {
        return DEFAULT_ANALYSIS_SETTINGS;
    }
    try {
        const raw = window.localStorage.getItem(ANALYSIS_SETTINGS_STORAGE_KEY);
        if (!raw) {
            return DEFAULT_ANALYSIS_SETTINGS;
        }
        return { ...DEFAULT_ANALYSIS_SETTINGS, ...JSON.parse(raw) };
    }
    catch {
        return DEFAULT_ANALYSIS_SETTINGS;
    }
}
export function readStoredSessions(): AnalysisSessionSnapshot[] {
    if (typeof window === "undefined") {
        return [];
    }
    try {
        const raw = window.localStorage.getItem(ANALYSIS_SESSIONS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
    }
    catch {
        return [];
    }
}
export function saveStoredSessions(sessions: AnalysisSessionSnapshot[]) {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(ANALYSIS_SESSIONS_STORAGE_KEY, JSON.stringify(sessions.slice(0, 12)));
}
export function makeSessionTitle(record: AnalysisRecord) {
    const opening = findOpening(record.mainline);
    if (opening) {
        return opening.line?.name || opening.opening.name;
    }
    if (record.mainline.length > 0) {
        return `${record.mainline.length} moves`;
    }
    return record.rootFen === START_FEN ? "Starting position" : "Custom position";
}
export function restoreRecord(snapshot: AnalysisSnapshot, historyStack: AnalysisSnapshot[] = [], futureStack: AnalysisSnapshot[] = []): AnalysisRecord {
    return {
        ...toSnapshot(snapshot),
        historyStack,
        futureStack,
    };
}
export function isSamePath(a: number[] | null, b: number[] | null) {
    if (a === b) {
        return true;
    }
    if (!a || !b || a.length !== b.length) {
        return false;
    }
    return a.every((value, index) => value === b[index]);
}
export function getNodeByPath(nodes: AnalysisMoveNode[], path: number[] | null): AnalysisMoveNode | null {
    if (!path || path.length === 0) {
        return null;
    }
    let node: AnalysisMoveNode | undefined = nodes[path[0]];
    for (let index = 1; index < path.length; index += 1) {
        node = node?.children[path[index]];
    }
    return node ?? null;
}
export function updateNodeAtPath(nodes: AnalysisMoveNode[], path: number[], mutator: (node: AnalysisMoveNode) => void): AnalysisMoveNode[] {
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
export function removeNodeAtPath(nodes: AnalysisMoveNode[], path: number[]): AnalysisMoveNode[] {
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
export function renderMoves(nodes: AnalysisMoveNode[], depth = 0, prefixPath: number[] = []): RenderedMove[] {
    return nodes.flatMap((node, index) => {
        const path = [...prefixPath, index];
        return [
            { path, node, depth },
            ...renderMoves(node.children, depth + 1, path),
        ];
    });
}
export function getCurrentFen(record: AnalysisRecord) {
    const node = getNodeByPath(record.mainline, record.currentPath);
    return node?.fenAfter || record.rootFen;
}
export function getLastMove(record: AnalysisRecord) {
    return getNodeByPath(record.mainline, record.currentPath);
}
export function getPreviousPath(path: number[] | null) {
    if (!path || path.length === 0) {
        return null;
    }
    if (path.length === 1) {
        return path[0] === 0 ? null : [path[0] - 1];
    }
    return path.slice(0, -1);
}
export function getNextPath(record: AnalysisRecord, path: number[] | null): number[] | null {
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
export function getLastPath(record: AnalysisRecord): number[] | null {
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
export function boardPositionFromFen(fen: string): BoardPosition {
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
export function boardPositionToFen(position: BoardPosition, turn: "w" | "b") {
    const chess = new Chess();
    chess.clear();
    for (const [square, piece] of Object.entries(position) as Array<[
        Square,
        Piece
    ]>) {
        const color = piece[0] as "w" | "b";
        const type = piece[1].toLowerCase() as PieceSymbol;
        chess.put({ type, color }, square);
    }
    const boardFen = chess.fen().split(" ").slice(0, 1)[0];
    return `${boardFen} ${turn} - - 0 1`;
}
export function uciToSan(fen: string, uci: string | null) {
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
    }
    catch {
        return null;
    }
}
export function uciPvToSan(fen: string, pv: string[]) {
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
    }
    catch {
        return [];
    }
}
export function numericScoreFromEngine(result: AnalyzeResult) {
    if (result.scoreMate != null) {
        return result.scoreMate > 0 ? 10000 : -10000;
    }
    return result.scoreCp ?? 0;
}
export function classificationLabel(classification: MoveClassification | null) {
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
export function classificationClasses(classification: MoveClassification | null) {
    return {
        best: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
        excellent: "border-cyan-400/30 bg-cyan-500/10 text-cyan-700",
        good: "border-sky-400/30 bg-sky-500/10 text-sky-100",
        inaccuracy: "border-amber-400/30 bg-amber-500/10 text-amber-700",
        mistake: "border-orange-400/30 bg-orange-500/10 text-orange-700",
        blunder: "border-rose-400/30 bg-rose-500/10 text-rose-700",
    }[classification || "good"];
}
export function explanationForMove(classification: MoveClassification, color: "w" | "b", bestMoveSan: string | null) {
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
export function formatAnalysisError(error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error || "");
    const message = rawMessage.replace(/\s+/g, " ").trim();
    if (!message) {
        return "Не вдалося завершити аналіз. Спробуйте ще раз.";
    }
    if (/timed out|unavailable|failed to analyze|bridge|worker|stockfish|spawn/i.test(message)) {
        return "Stockfish недоступний. Оновіть сторінку й повторіть спробу.";
    }
    if (/invalid fen|invalid position/i.test(message)) {
        return "Неправильна позиція. Перевірте FEN.";
    }
    if (/valid fen or pgn|invalid pgn|malformed/i.test(message)) {
        return "Вставте правильний PGN або FEN перед аналізом.";
    }
    return message.length > 150 ? `${message.slice(0, 147)}...` : message;
}
export function materialCount(fen: string) {
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
    const whitePoints = Object.entries(white).reduce((total, [key, count]) => total + PIECE_VALUES[key as PieceSymbol] * count, 0);
    const blackPoints = Object.entries(black).reduce((total, [key, count]) => total + PIECE_VALUES[key as PieceSymbol] * count, 0);
    return { white, black, whitePoints, blackPoints, diff: whitePoints - blackPoints };
}
export function determinePhase(fen: string, plyCount: number): GamePhase {
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
export function collectNodes(nodes: AnalysisMoveNode[]): AnalysisMoveNode[] {
    return nodes.flatMap((node) => [node, ...collectNodes(node.children)]);
}
export function calculateAccuracy(nodes: AnalysisMoveNode[]) {
    const reviewed = collectNodes(nodes).filter((node) => node.evalLoss != null);
    if (reviewed.length === 0) {
        return 100;
    }
    const totalLoss = reviewed.reduce((sum, node) => sum + (node.evalLoss || 0), 0);
    return Math.max(0, Math.min(100, Math.round(100 - totalLoss / reviewed.length / 12)));
}
export function averageCentipawnLoss(nodes: AnalysisMoveNode[]) {
    const reviewed = collectNodes(nodes).filter((node) => node.evalLoss != null);
    if (reviewed.length === 0) {
        return 0;
    }
    const totalLoss = reviewed.reduce((sum, node) => sum + (node.evalLoss || 0), 0);
    return Math.round(totalLoss / reviewed.length);
}
export function countLabels(nodes: AnalysisMoveNode[]) {
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
export function buildMovePairs(nodes: AnalysisMoveNode[]): MovePair[] {
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
        }
        else {
            pairs[pairIndex].black = { path: [nodeIndex], node };
        }
    });
    return pairs.filter(Boolean);
}
export function formatCp(score: number | null) {
    if (score == null) {
        return "-";
    }
    if (Math.abs(score) >= 10000) {
        return score > 0 ? "+M" : "-M";
    }
    const pawns = score / 100;
    return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}
export function coachToneClasses(tone: CoachTone) {
    return {
        best: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700",
        good: "border-sky-400/30 bg-sky-500/10 text-sky-50",
        neutral: "border-border bg-secondary text-foreground",
        warning: "border-amber-400/30 bg-amber-500/10 text-amber-700",
        danger: "border-rose-400/30 bg-rose-500/10 text-rose-700",
        system: "border-primary bg-accent text-primary",
    }[tone];
}
export function buildCoachEntry(node: AnalysisMoveNode | null, openingMatch: OpeningMatch | null, gamePhase: GamePhase): CoachEntry {
    if (!node) {
        return {
            id: "coach-intro",
            moveId: "intro",
            title: "Analysis ready",
            text: "Імпортуйте партію, вставте FEN або оберіть хід для пояснення позиції.",
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
            title: "Зівок",
            text: "Serious mistake. This move drops too much value or allows a tactical shot.",
            detail: node.explanation || `Material, king safety, or initiative was lost here.${bestMove}`,
            tone: "danger",
            moveLabel,
        };
    }
    return {
        id: `${node.id}-pending`,
        moveId: node.id,
        title: "Аналіз ходу…",
        text: "Триває перевірка тактичних варіантів.",
        detail: bestMove ? `Current best line:${bestMove}` : "Stockfish обчислює найкраще продовження.",
        tone: "neutral",
        moveLabel,
    };
}
export function findOpening(mainline: AnalysisMoveNode[]): OpeningMatch | null {
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
export function buildPgn(record: AnalysisRecord) {
    const headers = Object.entries({
        Event: record.headers.Event || "Analysis session",
        Site: record.headers.Site || "Chess of Odesa",
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
export function buildShareUrl(record: AnalysisRecord) {
    if (typeof window === "undefined") {
        return "";
    }
    const pgn = buildPgn(record);
    const url = new URL(`${window.location.origin}/analysis`);
    url.searchParams.set("pgn", pgn);
    return url.toString();
}
export function createMoveNode(move: {
    san: string;
    from: string;
    to: string;
    color: "w" | "b";
    promotion?: string;
}, fenBefore: string, fenAfter: string, ply: number): AnalysisMoveNode {
    const fenFields = fenBefore.trim().split(/\s+/);
    const fenFullmove = Number(fenFields[5]);
    const moveNumber = Number.isFinite(fenFullmove) && fenFullmove > 0
        ? Math.trunc(fenFullmove)
        : Math.floor((ply + 1) / 2);
    return {
        id: nextNodeId(),
        ply,
        moveNumber,
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
export function buildRecordFromPgn(pgnText: string): AnalysisRecord {
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
