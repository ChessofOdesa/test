import { uniqueId } from "@/lib/unique-id";
import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Move } from "chess.js";
import { parseTimeControl } from "../../../server/time-control.js";
import { positionResult, timeoutResult, undoToPlayer } from "./rules";
import { playChessSound } from "@/hooks/useChessSounds";
import { computerMove } from "./engine/computer-engine";
import type { Color, Promotion, RoomPreferences } from "./types";
type Config = {
    color: Color;
    timeControl: string;
    level: number;
    playerName: string;
    levelName: string;
};
type Clocks = {
    w: number | null;
    b: number | null;
    asOf: number;
};
type Position = {
    chess: Chess;
    clocks: Clocks;
    previousClocks: Clocks[];
    paused: boolean;
    result: string;
    reason: string;
    startedAt: string;
    id: string;
};
function fresh(config: Config): Position {
    const chess = new Chess();
    const parsed = parseTimeControl(config.timeControl);
    const now = Date.now();
    const clocks = { w: parsed?.initialMs ?? null, b: parsed?.initialMs ?? null, asOf: now };
    chess.header("Event", "Тренувальна партія", "Site", "Chess of Odesa", "Date", new Date(now).toISOString().slice(0, 10).replace(/-/g, "."), "White", config.color === "w" ? config.playerName : "Chess of Odesa Engine", "Black", config.color === "b" ? config.playerName : "Chess of Odesa Engine", "Result", "*", "TimeControl", parsed ? `${parsed.minutes * 60}+${parsed.increment}` : "-");
    return { chess, clocks, previousClocks: [clocks], paused: false, result: "*", reason: "", startedAt: new Date(now).toISOString(), id: uniqueId() };
}
function clockAt(position: Position, now: number): Clocks {
    const clocks = { ...position.clocks };
    const turn = position.chess.turn();
    if (!position.paused && position.result === "*" && clocks[turn] != null)
        clocks[turn] = Math.max(0, clocks[turn]! - Math.max(0, now - clocks.asOf));
    clocks.asOf = now;
    return clocks;
}
export function useComputerGame(config: Config, preferences: RoomPreferences) {
    const [initial] = useState(() => fresh(config));
    const current = useRef(initial);
    const settings = useRef(preferences);
    settings.current = preferences;
    const [view, setView] = useState(() => ({ fen: initial.chess.fen(), pgn: initial.chess.pgn(), clocks: initial.clocks, paused: false, result: "*", reason: "", id: initial.id, startedAt: initial.startedAt, revision: 0 }));
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [backend, setBackend] = useState("Stockfish");
    const [retry, setRetry] = useState(0);
    const job = useRef<AbortController | null>(null);
    const publish = useCallback(() => { const state = current.current; setView(previous => ({ fen: state.chess.fen(), pgn: state.chess.pgn(), clocks: { ...state.clocks }, paused: state.paused, result: state.result, reason: state.reason, id: state.id, startedAt: state.startedAt, revision: previous.revision + 1 })); }, []);
    const cancel = useCallback(() => { job.current?.abort(); job.current = null; setThinking(false); }, []);
    const finish = useCallback((result: string, reason: string) => { const state = current.current; if (state.result !== "*")
        return; state.clocks = clockAt(state, Date.now()); state.result = result; state.reason = reason; state.chess.header("Result", result, "Termination", reason); cancel(); if (settings.current.endSound)
        playChessSound(result === "1/2-1/2" ? "draw" : "gameEnd"); publish(); }, [cancel, publish]);
    const flag = useCallback(() => {
        const state = current.current;
        if (state.paused || state.result !== "*")
            return;
        const clocks = clockAt(state, Date.now());
        const loser = state.chess.turn();
        if (clocks[loser] !== 0)
            return;
        const ending = timeoutResult(state.chess, loser);
        finish(ending.result, ending.reason);
    }, [finish]);
    const apply = useCallback((from: string, to: string, promotion: Promotion = "q", computer = false) => {
        const state = current.current;
        if (state.result !== "*" || state.paused || ((state.chess.turn() === config.color) === computer))
            return false;
        const now = Date.now();
        const clocks = clockAt(state, now);
        const turn = state.chess.turn();
        if (clocks[turn] === 0) {
            flag();
            return false;
        }
        let move: Move;
        try {
            move = state.chess.move({ from, to, promotion });
        }
        catch {
            return false;
        }
        if (!move)
            return false;
        const increment = parseTimeControl(config.timeControl)?.incrementMs || 0;
        if (clocks[turn] != null)
            clocks[turn]! += increment;
        state.clocks = clocks;
        state.previousClocks.push({ ...clocks });
        setError(null);
        if (settings.current.sound)
            playChessSound(state.chess.isCheck() && settings.current.checkSound ? "check" : move.isKingsideCastle() || move.isQueensideCastle() ? "castle" : move.captured ? "capture" : "move");
        const ending = positionResult(state.chess);
        if (ending)
            finish(ending.result, ending.reason);
        else
            publish();
        return true;
    }, [config.color, config.timeControl, flag, finish, publish]);
    useEffect(() => {
        const state = current.current;
        if (state.result !== "*" || state.paused || state.chess.turn() === config.color)
            return;
        const controller = new AbortController();
        job.current = controller;
        const fen = state.chess.fen();
        setThinking(true);
        setError(null);
        void computerMove(fen, config.level, controller.signal).then(result => {
            if (controller.signal.aborted || current.current.chess.fen() !== fen)
                return;
            setBackend(result.backend);
            setThinking(false);
            const move = result.move;
            apply(move.slice(0, 2), move.slice(2, 4), (move[4] || "q") as Promotion, true);
        }).catch(error => { if (controller.signal.aborted)
            return; setThinking(false); setError(error instanceof Error ? error.message : "Комп’ютер не зміг зробити хід."); });
        return () => controller.abort();
    }, [view.fen, view.paused, view.result, view.id, config.color, config.level, apply, retry]);
    useEffect(() => () => job.current?.abort(), []);
    const restart = useCallback(() => { cancel(); current.current = fresh(config); setError(null); publish(); }, [config, cancel, publish]);
    const undo = useCallback(() => { const state = current.current; if (state.result !== "*" || !state.chess.history().length)
        return; cancel(); undoToPlayer(state.chess, config.color); const length = state.chess.history().length; state.clocks = { ...(state.previousClocks[length] || state.previousClocks[0]), asOf: Date.now() }; state.previousClocks = state.previousClocks.slice(0, length + 1); setError(null); publish(); }, [cancel, config.color, publish]);
    const togglePause = useCallback(() => { const state = current.current; if (state.result !== "*")
        return; cancel(); state.clocks = clockAt(state, Date.now()); state.paused = !state.paused; publish(); }, [cancel, publish]);
    return { view, thinking, error, backend, move: apply, flag, restart, undo, togglePause, resign: () => finish(config.color === "w" ? "0-1" : "1-0", "resignation"), retry: () => setRetry(value => value + 1) };
}
