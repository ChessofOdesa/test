import { afterEach, describe, expect, it, vi } from "vitest";
import analyzeFenWithStockfish from "@/lib/stockfish";

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
});
