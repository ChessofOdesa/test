import assert from "node:assert/strict";
import test from "node:test";
import {
  LichessEvaluationError,
  createLichessEvaluationService,
  normalizeFenForEvaluation,
} from "./lichess-evaluation.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("normalizes equivalent FENs to one evaluation key", () => {
  const first = normalizeFenForEvaluation(START_FEN);
  const second = normalizeFenForEvaluation(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 9 14",
  );

  assert.equal(first.positionFen, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -");
  assert.equal(first.fenHash, second.fenHash);
});

test("fetches a Lichess evaluation, stores it and reuses memory cache", async () => {
  let fetchCount = 0;
  const saved = [];
  const persistence = {
    enabled: true,
    findPositionEvaluation: async () => null,
    savePositionEvaluation: async (record) => saved.push(record),
    warn: () => undefined,
  };
  const service = createLichessEvaluationService({
    persistence,
    fetchImpl: async (url) => {
      fetchCount += 1;
      assert.equal(url.searchParams.get("multiPv"), "3");
      return new Response(JSON.stringify({
        fen: START_FEN,
        knodes: 695524,
        depth: 75,
        pvs: [
          { moves: "e2e4 e7e5 g1f3", cp: 19 },
          { moves: "d2d4 g8f6 g1f3", cp: 15 },
          { moves: "g1f3 d7d5 d2d4", cp: 14 },
        ],
      }));
    },
  });

  const first = await service.getEvaluation(START_FEN, 3);
  const second = await service.getEvaluation(START_FEN, 2);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(first.source, "lichess");
  assert.equal(first.pvs[0].cp, 19);
  assert.equal(first.pvs.length, 3);
  assert.equal(second.source, "cache");
  assert.equal(second.pvs.length, 2);
  assert.equal(fetchCount, 1);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].requested_multipv, 3);
});

test("uses a Supabase cache hit without calling Lichess", async () => {
  const service = createLichessEvaluationService({
    persistence: {
      enabled: true,
      findPositionEvaluation: async () => ({
        fen: START_FEN,
        depth: 40,
        knodes: 1000,
        requested_multipv: 3,
        fetched_at: "2026-09-05T00:00:00.000Z",
        pvs: [{ moves: "e2e4 e7e5", cp: 20, mate: null }],
      }),
      savePositionEvaluation: async () => undefined,
      warn: () => undefined,
    },
    fetchImpl: async () => {
      throw new Error("Lichess should not be called for a cache hit.");
    },
  });

  const result = await service.getEvaluation(START_FEN, 1);
  assert.equal(result.source, "cache");
  assert.equal(result.depth, 40);
});

test("returns null when the position is absent from Lichess", async () => {
  const service = createLichessEvaluationService({
    fetchImpl: async () => new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
  });

  assert.equal(await service.getEvaluation(START_FEN, 1), null);
});

test("honors a full minute cooldown after a Lichess 429", async () => {
  let fetchCount = 0;
  const service = createLichessEvaluationService({
    fetchImpl: async () => {
      fetchCount += 1;
      return new Response("rate limited", { status: 429 });
    },
    now: () => 1_000,
  });

  await assert.rejects(
    service.getEvaluation(START_FEN, 1),
    (error) => error instanceof LichessEvaluationError && error.code === "lichess_rate_limited",
  );
  await assert.rejects(
    service.getEvaluation(START_FEN, 2),
    (error) => error instanceof LichessEvaluationError && error.code === "lichess_rate_limited",
  );
  assert.equal(fetchCount, 1);
});

test("rejects malformed FEN before any network request", async () => {
  const service = createLichessEvaluationService({
    fetchImpl: async () => {
      throw new Error("Network should not be called.");
    },
  });

  await assert.rejects(
    service.getEvaluation("not-a-fen"),
    (error) => error instanceof LichessEvaluationError && error.statusCode === 400,
  );
});
