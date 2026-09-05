import { afterEach, describe, expect, it, vi } from "vitest";
import analyzeFenWithStockfish, {
  normalizeSideToMoveResultForWhite,
  type AnalyzeResult,
} from "@/lib/stockfish";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Lichess cloud evaluation", () => {
  it("uses the configured server endpoint and converts variations", async () => {
    vi.stubEnv("VITE_EVAL_API_URL", "https://server.example/api/evaluation");
    let requestedUrlString = "";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrlString = String(input);
      return new Response(JSON.stringify({
        depth: 52,
        knodes: 1234,
        pvs: [
          { moves: "e2e4 e7e5 g1f3", cp: 23 },
          { moves: "d2d4 g8f6", mate: 6 },
        ],
      }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzeFenWithStockfish(START_FEN, 15, undefined, 5_000, {
      multiPv: 2,
      preferCloud: true,
    });

    expect(result.backend).toBe("cloud");
    expect(result.bestmove).toBe("e2e4");
    expect(result.scoreCp).toBe(23);
    expect(result.depth).toBe(52);
    expect(result.nodes).toBe(1_234_000);
    expect(result.lines).toHaveLength(2);
    expect(result.lines?.[1].scoreMate).toBe(6);

    const requestedUrl = new URL(requestedUrlString);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      "https://server.example/api/evaluation",
    );
    expect(requestedUrl.searchParams.get("fen")).toBe(START_FEN);
    expect(requestedUrl.searchParams.get("multiPv")).toBe("2");
  });

  it("normalizes a Black-to-move Stockfish score to White's perspective", () => {
    const blackToMoveFen = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const rawResult: AnalyzeResult = {
      backend: "worker",
      bestmove: "g8f6",
      raw: ["info depth 18 score cp 34 pv g8f6"],
      scoreCp: 34,
      scoreMate: null,
      pv: ["g8f6"],
      lines: [{
        multipv: 1,
        scoreCp: 34,
        scoreMate: null,
        pv: ["g8f6"],
      }],
    };

    const normalized = normalizeSideToMoveResultForWhite(blackToMoveFen, rawResult);

    expect(normalized.scoreCp).toBe(-34);
    expect(normalized.lines?.[0].scoreCp).toBe(-34);
    expect(normalized.raw[0]).toContain("score cp -34");
    expect(normalized.bestmove).toBe("g8f6");
  });
});
