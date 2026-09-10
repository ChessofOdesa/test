import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { exportPgn, importPgn, importPositionOrGame, mainline } from "@/features/analysis/tree";
import { editorFen } from "@/features/analysis/PositionEditor";

describe("Analysis PGN round trips", () => {
  it("keeps metadata, comments, NAGs and nested variations without changing the main game", () => {
    const input = '[White "Андрій"]\n[Black "Суперник"]\n[Result "*"]\n\n1.e4 {Центр} (1.d4 d5 (1...Nf6 2.c4) 2.c4) e5 2.Nf3 $1 Nc6 *';
    const document = importPgn(input), output = exportPgn(document), restored = importPgn(output);
    expect(restored.headers.White).toBe("Андрій");
    expect(mainline(restored).map(node => node.san)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    expect(restored.root.children[0].comment).toBe("Центр");
    expect(restored.root.children[1].san).toBe("d4");
    expect(restored.root.children[1].children.map(node => node.san)).toEqual(["d5", "Nf6"]);
    expect(mainline(restored)[2].nags).toEqual(["$1"]);
    expect(exportPgn(restored)).toBe(output);
    const game = new Chess(); game.loadPgn(output);
    expect(game.history()).toEqual(["e4", "e5", "Nf3", "Nc6"]);
  });
  it("preserves a black-to-move setup and its original move number", () => {
    const fen = "8/4k3/8/8/8/8/4P3/4K3 b - - 0 23";
    const document = importPgn(`[SetUp "1"]\n[FEN "${fen}"]\n[Result "*"]\n\n23... Kf6 24. Kd2 *`);
    expect(document.root.fen).toBe(fen);
    expect(exportPgn(document)).toContain("23...Kf6");
    expect(importPgn(exportPgn(document)).root.fen).toBe(fen);
  });
  it("rejects illegal variation moves and invalid FEN instead of silently discarding them", () => {
    expect(() => importPgn("1. e4 (1. e5) e5 *")).toThrow();
    expect(() => importPositionOrGame("8/8/8/8/8/8/8/8 w - - 0 1")).toThrow(/FEN/);
    expect(() => importPgn("1.e4 (1.d4 d5 *")).toThrow();
  });
  it("exports checkmate and promotions as legal PGN", () => {
    const document = importPgn("1.f3 e5 2.g4 Qh4# 0-1");
    expect(importPgn(exportPgn(document)).headers.Result).toBe("0-1");
    const promotion = importPgn('[SetUp "1"]\n[FEN "8/P6k/8/8/8/8/8/4K3 w - - 0 1"]\n\n1.a8=N *');
    expect(mainline(importPgn(exportPgn(promotion)))[0].uci).toBe("a7a8n");
  });
  it("validates editor kings and preserves genuine castling rights", () => {
    expect(editorFen({ e1: "wK", h1: "wR", e8: "bK" }, "w", "K", "-", 10)).toContain(" w K - 0 10");
    expect(() => editorFen({ e1: "wK", e2: "bK" }, "w", "", "-", 1)).toThrow();
    expect(() => editorFen({ e1: "wK", e8: "bK" }, "w", "K", "-", 1)).toThrow(/рокіровки/);
  });
});
