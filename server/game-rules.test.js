import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { positionResult, timeoutResult } from "./game-rules.js";
test("endings distinguish stalemate, material, repetition, fifty moves and mate", () => {
  assert.equal(positionResult(new Chess("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1")).reason,"stalemate");
  assert.equal(positionResult(new Chess("7k/8/8/8/8/8/8/6NK w - - 0 1")).reason,"insufficient_material");
  assert.equal(positionResult(new Chess("7k/8/8/8/8/8/8/R6K w - - 100 51")).reason,"fifty_move_rule");
  const repeated=new Chess();for(const san of ["Nf3","Nf6","Ng1","Ng8","Nf3","Nf6","Ng1","Ng8"]) repeated.move(san);assert.equal(positionResult(repeated).reason,"threefold_repetition");
  const mate=new Chess();for(const san of ["f3","e5","g4","Qh4#"])mate.move(san);assert.deepEqual(positionResult(mate),{result:"0-1",reason:"checkmate"});
});
test("timeout is drawn if the other side cannot possibly mate",()=>{
  assert.deepEqual(timeoutResult(new Chess("7k/8/8/8/8/8/R7/7K w - - 0 1"),"w"),{result:"1/2-1/2",reason:"timeout_insufficient_material"});assert.equal(timeoutResult(new Chess(),"b").result,"1-0");
});
test("castling and en passant preserve accurate PGN and position",()=>{
  const castle=new Chess();for(const san of ["e4","e5","Nf3","Nc6","Bc4","Nf6","O-O"])castle.move(san);assert.equal(castle.get("f1").type,"r");assert.equal(castle.get("g1").type,"k");
  const ep=new Chess();for(const san of ["e4","a6","e5","d5","exd6"])ep.move(san);assert.equal(ep.get("d5"),undefined);assert.equal(ep.get("d6").color,"w");
  const restored=new Chess();restored.loadPgn(ep.pgn());assert.equal(restored.fen(),ep.fen());
});
