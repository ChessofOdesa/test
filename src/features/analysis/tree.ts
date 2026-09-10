import { Chess, type Move } from "chess.js";
import { uniqueId } from "@/lib/unique-id";

export type AnalysisNode = {
  id: string;
  fen: string;
  san: string;
  uci: string;
  comment: string;
  nags: string[];
  children: AnalysisNode[];
};
export type AnalysisDocument = { headers: Record<string, string>; root: AnalysisNode };
export const START_FEN = new Chess().fen();
export const MAX_IMPORT_BYTES = 2_000_000;
const RESULTS = new Set(["1-0", "0-1", "1/2-1/2", "*"]);
const SYMBOL_NAGS: Record<string, string> = { "!": "$1", "?": "$2", "!!": "$3", "??": "$4", "!?": "$5", "?!": "$6" };

export function newDocument(fen = START_FEN): AnalysisDocument {
  const game = new Chess(fen);
  return { headers: {}, root: { id: uniqueId(), fen: game.fen(), san: "", uci: "", comment: "", nags: [], children: [] } };
}

export function moveNode(parent: AnalysisNode, move: Move): AnalysisNode {
  return { id: uniqueId(), fen: move.after, san: move.san, uci: move.lan, comment: "", nags: [], children: [] };
}

/** Parse RAVs as branches from the position BEFORE the preceding move. Chess.js
 * validates every move; this module manages notation, never chess rules. */
export function importPgn(text: string): AnalysisDocument {
  if (!text.trim()) throw new Error("Вставте PGN партії.");
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error("PGN завеликий. Максимум — 2 МБ.");
  const verifier = new Chess();
  try { verifier.loadPgn(text); } catch { throw new Error("Не вдалося прочитати PGN. Перевірте ходи та заголовки партії."); }
  const headers = verifier.getHeaders();
  const document = newDocument(headers.FEN || START_FEN);
  document.headers = { ...headers };
  const body = text.replace(/^\s*\[\w+\s+"(?:\\.|[^"\\])*"\s*\]\s*$/gm, "");
  const tokens = body.match(/\{[^}]*\}|;[^\r\n]*|\$\d+|[()]|\d+\.(?:\.\.)?|\.{3}|1\/2-1\/2|1-0|0-1|\*|[^\s(){}]+/g) || [];
  let current = document.root, parent: AnalysisNode | null = null, count = 0, ended = false;
  const stack: { current: AnalysisNode; parent: AnalysisNode | null }[] = [];
  for (const token of tokens) {
    if (token.startsWith("{") || token.startsWith(";")) {
      const comment = token.startsWith("{") ? token.slice(1, -1) : token.slice(1);
      current.comment = [current.comment, comment.trim()].filter(Boolean).join("\n");
    } else if (/^(\d+\.|\.\.\.)/.test(token)) continue;
    else if (token === "(") {
      if (!parent || stack.length >= 40 || ended) throw new Error("Некоректні дужки варіанта в PGN.");
      stack.push({ current, parent }); current = parent; parent = null;
    } else if (token === ")") {
      const saved = stack.pop();
      if (!saved) throw new Error("Зайва закривальна дужка в PGN.");
      current = saved.current; parent = saved.parent;
    } else if (RESULTS.has(token)) {
      if (!stack.length) { document.headers.Result = token; ended = true; }
    } else if (/^\$\d+$/.test(token) || SYMBOL_NAGS[token]) {
      current.nags.push(SYMBOL_NAGS[token] || token);
    } else {
      if (ended) throw new Error("Імпортуйте одну партію за раз.");
      if (++count > 2000) throw new Error("У PGN забагато ходів і варіантів. Максимум — 2000 півходів.");
      const suffix = token.match(/[!?]+$/)?.[0];
      let move: Move;
      try { move = new Chess(current.fen).move(token.replace(/[!?]+$/, "")); }
      catch { throw new Error(`Некоректний хід у PGN: ${token.slice(0, 30)}.`); }
      const node = moveNode(current, move);
      if (suffix && SYMBOL_NAGS[suffix]) node.nags.push(SYMBOL_NAGS[suffix]);
      current.children.push(node); parent = current; current = node;
    }
  }
  if (stack.length) throw new Error("Не закрито дужки варіанта в PGN.");
  return document;
}

export function importPositionOrGame(text: string): AnalysisDocument {
  const value = text.trim();
  if (/^[prnbqkPRNBQK1-8/]+\s+[wb]\s/.test(value)) {
    try { return newDocument(value); } catch { throw new Error("Неправильний FEN. Перевірте розташування фігур і сторону ходу."); }
  }
  return importPgn(value);
}

export function mainline(document: AnalysisDocument) {
  const nodes: AnalysisNode[] = [];
  let node = document.root.children[0];
  while (node) { nodes.push(node); node = node.children[0]; }
  return nodes;
}

export function findPath(root: AnalysisNode, id: string): AnalysisNode[] | null {
  const pending: { node: AnalysisNode; path: AnalysisNode[] }[] = [{ node: root, path: [root] }];
  while (pending.length) {
    const { node, path } = pending.pop()!;
    if (node.id === id) return path;
    for (const child of node.children) pending.push({ node: child, path: [...path, child] });
  }
  return null;
}

export function updateTree(document: AnalysisDocument, id: string, change: (node: AnalysisNode, parent: AnalysisNode | null) => void) {
  const next = structuredClone(document);
  const path = findPath(next.root, id);
  if (path) change(path[path.length - 1], path.at(-2) || null);
  return next;
}

export function moveLabel(parentFen: string, node: AnalysisNode) {
  const parts = parentFen.split(" ");
  return `${parts[5]}${parts[1] === "w" ? "." : "..."}${node.san}`;
}

function commentText(comment: string) { return comment.trim() ? `{${comment.replace(/[{}]/g, "").trim()}}` : ""; }
function serializeLine(parent: AnalysisNode, first: AnalysisNode, variations: boolean): string {
  const tokens: string[] = [];
  let previous = parent, node: AnalysisNode | undefined = first;
  while (node) {
    tokens.push(moveLabel(previous.fen, node), ...node.nags, commentText(node.comment));
    if (variations) for (const other of previous.children) {
      if (other !== node) tokens.push(`(${serializeLine(previous, other, false)})`);
    }
    // Sibling alternatives were already emitted by the caller at a RAV's first
    // move. Nested branches later in that line still need to be preserved.
    variations = true;
    previous = node; node = node.children[0];
  }
  return tokens.filter(Boolean).join(" ");
}

export function exportPgn(document: AnalysisDocument, variations = true) {
  const headers = { ...document.headers };
  if (document.root.fen !== START_FEN) { headers.SetUp = "1"; headers.FEN = document.root.fen; }
  else { delete headers.SetUp; delete headers.FEN; }
  const result = RESULTS.has(headers.Result) ? headers.Result : "*";
  headers.Result = result;
  const headerText = Object.entries(headers).filter(([key]) => /^\w+$/.test(key)).map(([key, value]) => `[${key} "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/[\r\n]/g, " ")}"]`).join("\n");
  if (!variations) {
    const game = new Chess(document.root.fen);
    for (const node of mainline(document)) game.move(node.uci);
    for (const [key, value] of Object.entries(headers)) game.setHeader(key, value);
    return game.pgn();
  }
  const first = document.root.children[0];
  return `${headerText}\n\n${[commentText(document.root.comment), first ? serializeLine(document.root, first, true) : "", result].filter(Boolean).join(" ")}`;
}

export function pvMoves(fen: string, moves: string[]) {
  const game = new Chess(fen);
  const result: { san: string; uci: string; fen: string; label: string }[] = [];
  for (const uci of moves) {
    try {
      const before = game.fen().split(" ");
      const move = game.move(uci);
      result.push({ san: move.san, uci, fen: game.fen(), label: `${before[5]}${before[1] === "w" ? "." : "..."}${move.san}` });
    } catch { break; }
  }
  return result;
}
