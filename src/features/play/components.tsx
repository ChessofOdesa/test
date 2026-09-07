import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { playChessSound } from "@/hooks/useChessSounds";
import { getAIMove, type AILevel } from "@/lib/chessAI";
import { Chess, type Move, type Square } from "chess.js";
import { Bot, Volume2, VolumeX } from "lucide-react";
import { type ReactNode } from "react";
import { BotProfile, PIECE_VALUES, PLAYER_SIDE_OPTIONS, ReviewInsight, ReviewMove, SideChoice, TIME_CONTROLS, TimeControlId } from './model';
export function OptionsCard({ lockMatchOptions = false, selectedSide, setSelectedSide, selectedTimeControl, setSelectedTimeControl, flipBoard, setFlipBoard, showCoordinatesEnabled, setShowCoordinatesEnabled, highlightMoves, setHighlightMoves, soundEnabled, setSoundEnabled, }: {
    lockMatchOptions?: boolean;
    selectedSide: SideChoice;
    setSelectedSide: (value: SideChoice) => void;
    selectedTimeControl: TimeControlId;
    setSelectedTimeControl: (value: TimeControlId) => void;
    flipBoard: boolean;
    setFlipBoard: (value: boolean) => void;
    showCoordinatesEnabled: boolean;
    setShowCoordinatesEnabled: (value: boolean) => void;
    highlightMoves: boolean;
    setHighlightMoves: (value: boolean) => void;
    soundEnabled: boolean;
    setSoundEnabled: (value: boolean) => void;
}) {
    return (<div className="space-y-4 rounded-lg border border-border bg-card p-3">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Грати за</p>
        <div className="grid grid-cols-3 gap-2">
          {PLAYER_SIDE_OPTIONS.map((option) => (<button key={option.value} type="button" disabled={lockMatchOptions} onClick={() => setSelectedSide(option.value)} className={`rounded-lg px-2 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${selectedSide === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary"}`}>
              {option.label}
            </button>))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Контроль часу</p>
        <Select disabled={lockMatchOptions} value={selectedTimeControl} onValueChange={(value) => setSelectedTimeControl(value as TimeControlId)}>
          <SelectTrigger className="h-11 rounded-lg border-border bg-secondary text-foreground focus:ring-primary disabled:opacity-55">
            <SelectValue placeholder="Оберіть контроль часу"/>
          </SelectTrigger>
          <SelectContent>
            {!TIME_CONTROLS.some(control => control.id === selectedTimeControl) && <SelectItem value={selectedTimeControl}>{selectedTimeControl}</SelectItem>}
            {TIME_CONTROLS.map((control) => (<SelectItem key={control.id} value={control.id}>
                {control.label}
              </SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Шахівниця</p>
        <div className="space-y-3">
          <OptionToggle label="Перевернути дошку" checked={flipBoard} onCheckedChange={setFlipBoard}/>
          <OptionToggle label="Показувати координати" checked={showCoordinatesEnabled} onCheckedChange={setShowCoordinatesEnabled}/>
          <OptionToggle label="Підсвічувати ходи" checked={highlightMoves} onCheckedChange={setHighlightMoves}/>
          <OptionToggle label="Звук" checked={soundEnabled} onCheckedChange={setSoundEnabled} icon={soundEnabled ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>}/>
        </div>
      </div>
    </div>);
}
export function OptionToggle({ label, checked, onCheckedChange, icon, }: {
    label: string;
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    icon?: ReactNode;
}) {
    return (<div className="flex items-center justify-between rounded-[14px] border border-border bg-secondary px-3 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {label}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label}/>
    </div>);
}
export function BotAvatar({ bot, size }: {
    bot: BotProfile;
    size: "sm" | "md" | "lg";
}) {
    const dimension = size === "lg" ? 64 : size === "md" ? 48 : 38;
    return <span aria-hidden="true" className="grid shrink-0 place-items-center rounded-xl bg-accent text-primary font-semibold" style={{ width: dimension, height: dimension, fontSize: dimension * .4 }}>{bot.name.slice(0, 1)}</span>;
}
export function ActionButton({ icon, label, onClick, disabled, }: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (<button type="button" onClick={onClick} disabled={disabled} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-2 py-2 text-center text-xs font-bold leading-4 text-foreground transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-40">
      {icon}
      {label}
    </button>);
}
export function StatCard({ label, value }: {
    label: string;
    value: string;
}) {
    return (<div className="rounded-[18px] border border-border bg-secondary px-3 py-3">
      <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>);
}
export function resolveBotAiLevel(bot: BotProfile, trainingRating: number): AILevel {
    if (bot.behaviorTier === "Adaptive") {
        if (trainingRating < 900)
            return 3;
        if (trainingRating < 1400)
            return 5;
        if (trainingRating < 1900)
            return 6;
        return 7;
    }
    if (bot.behaviorTier === "Engine") {
        return 8;
    }
    return bot.aiLevel;
}
export function resolveStockfishDepth(bot: BotProfile, trainingRating: number) {
    const level = resolveBotAiLevel(bot, trainingRating);
    const depthMap: Record<AILevel, number> = {
        1: 3,
        2: 4,
        3: 5,
        4: 6,
        5: 7,
        6: 8,
        7: 9,
        8: 10,
    };
    return depthMap[level];
}
export function chooseBotMove(game: Chess, stockfishMove: string | null, bot: BotProfile, trainingRating: number) {
    const level = resolveBotAiLevel(bot, trainingRating);
    const fallbackLevel = Math.min(level, 6) as AILevel;
    const historyLength = game.history().length;
    const fallbackChance = bot.behaviorTier === "Beginner"
        ? 0.75
        : bot.behaviorTier === "Intermediate"
            ? 0.45
            : bot.behaviorTier === "Advanced"
                ? historyLength < 10
                    ? 0.18
                    : 0.1
                : bot.behaviorTier === "Adaptive"
                    ? trainingRating < 1000
                        ? 0.2
                        : 0.1
                    : 0.03;
    if (Math.random() < fallbackChance) {
        const fallback = getAIMove(game, fallbackLevel);
        if (fallback) {
            return game.move(fallback) || null;
        }
    }
    if (stockfishMove && isUciMove(stockfishMove)) {
        const stockfishApplied = applyUciMove(game, stockfishMove);
        if (stockfishApplied) {
            return stockfishApplied;
        }
    }
    const fallback = getAIMove(game, fallbackLevel);
    if (fallback) {
        return game.move(fallback) || null;
    }
    return null;
}
export function getLocalAnalysisSnapshot(fen: string, level: AILevel) {
    const game = new Chess(fen);
    const evalScore = evaluatePositionCp(game);
    const fallbackMove = getAIMove(game, Math.min(level, 6) as AILevel);
    if (!fallbackMove) {
        return {
            evalScore,
            bestMoveLabel: null,
            bestMoveUci: null,
            principalVariation: [] as string[],
        };
    }
    const move = game.move(fallbackMove);
    return {
        evalScore,
        bestMoveLabel: move?.san || null,
        bestMoveUci: move ? moveToUci(move) : null,
        principalVariation: move?.san ? [move.san] : [],
    };
}
export function randomItem<T>(items: T[]) {
    return items[Math.floor(Math.random() * items.length)];
}
export function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function cloneGame(game: Chess) {
    return cloneGameFromSnapshot(game.pgn(), game.fen());
}
export function cloneGameFromSnapshot(pgn: string, fen: string) {
    const next = new Chess();
    if (pgn.trim()) {
        try {
            next.loadPgn(pgn);
            return next;
        }
        catch {
            // fall back to FEN
        }
    }
    next.load(fen);
    return next;
}
export function buildReviewData(game: Chess) {
    const walker = new Chess();
    const positions = [walker.fen()];
    const movesSan: string[] = [];
    const movesVerbose: ReviewMove[] = [];
    for (const move of game.history({ verbose: true })) {
        walker.move(move);
        movesSan.push(move.san);
        movesVerbose.push({
            san: move.san,
            from: move.from as Square,
            to: move.to as Square,
        });
        positions.push(walker.fen());
    }
    return { positions, movesSan, movesVerbose };
}
export function parseEngineInfoLine(line: string) {
    const depthMatch = line.match(/\bdepth (\d+)/);
    const cpMatch = line.match(/\bscore cp (-?\d+)/);
    const mateMatch = line.match(/\bscore mate (-?\d+)/);
    return {
        depth: depthMatch ? Number.parseInt(depthMatch[1], 10) : null,
        scoreCp: cpMatch
            ? Number.parseInt(cpMatch[1], 10)
            : mateMatch
                ? Number.parseInt(mateMatch[1], 10) > 0
                    ? 10000
                    : -10000
                : null,
    };
}
export function applyUciMove(game: Chess, uci: string) {
    if (!isUciMove(uci)) {
        return null;
    }
    const payload: {
        from: string;
        to: string;
        promotion?: "q" | "r" | "b" | "n";
    } = {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
    };
    if (uci.length === 5) {
        payload.promotion = uci.slice(4, 5) as "q" | "r" | "b" | "n";
    }
    return game.move(payload) || null;
}
export function moveToUci(move: Move) {
    return `${move.from}${move.to}${move.promotion ?? ""}`;
}
export function isUciMove(value: string) {
    return /^[a-h][1-8][a-h][1-8][nbrq]?$/.test(value);
}
export function uciToSan(fen: string, uci: string) {
    if (!isUciMove(uci)) {
        return null;
    }
    try {
        const game = new Chess(fen);
        const move = applyUciMove(game, uci);
        return move?.san || null;
    }
    catch {
        return null;
    }
}
export function uciPvToSan(fen: string, pv: string[]) {
    if (pv.length === 0) {
        return [];
    }
    const game = new Chess(fen);
    const san: string[] = [];
    for (const step of pv) {
        const move = applyUciMove(game, step);
        if (!move) {
            break;
        }
        san.push(move.san);
    }
    return san;
}
export function getGameResult(game: Chess) {
    if (game.isCheckmate()) {
        return game.turn() === "w" ? "0-1" : "1-0";
    }
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
        return "1/2-1/2";
    }
    return "*";
}
export function formatResultLabel(playerColor: "w" | "b", result: string) {
    if (result === "1/2-1/2") {
        return "Нічия";
    }
    const playerWon = (result === "1-0" && playerColor === "w") || (result === "0-1" && playerColor === "b");
    return playerWon ? "Ви перемогли" : "Ви програли";
}
export function reviewLabelUa(label: ReviewInsight["label"]) {
    if (label === "Blunder")
        return "Зівок";
    if (label === "Mistake")
        return "Помилка";
    return "Неточність";
}
export function playMoveSound(move: Move, game: Chess, soundEnabled: boolean) {
    if (!soundEnabled) {
        return;
    }
    if (game.isCheckmate()) {
        playChessSound("checkmate");
        return;
    }
    if (game.isCheck()) {
        playChessSound("check");
        return;
    }
    if (move.san.includes("O-O")) {
        playChessSound("castle");
        return;
    }
    if (move.flags.includes("p")) {
        playChessSound("promote");
        return;
    }
    if (move.flags.includes("c") || move.flags.includes("e")) {
        playChessSound("capture");
        return;
    }
    playChessSound("move");
}
export function evaluatePositionCp(game: Chess) {
    if (game.isCheckmate()) {
        return game.turn() === "w" ? -10000 : 10000;
    }
    if (game.isDraw() || game.isStalemate()) {
        return 0;
    }
    let score = 0;
    const board = game.board();
    for (let rank = 0; rank < 8; rank += 1) {
        for (let file = 0; file < 8; file += 1) {
            const piece = board[rank][file];
            if (!piece) {
                continue;
            }
            score += piece.color === "w" ? PIECE_VALUES[piece.type] : -PIECE_VALUES[piece.type];
        }
    }
    const mobility = game.moves().length * 4;
    score += game.turn() === "w" ? mobility : -mobility;
    return score;
}
export function getCapturedPieces(game: Chess, color: "w" | "b") {
    const remaining = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    for (const row of game.board()) {
        for (const piece of row) {
            if (piece && piece.color === color && piece.type in remaining) {
                remaining[piece.type as keyof typeof remaining] += 1;
            }
        }
    }
    const initial = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    return Object.entries(initial)
        .map(([piece, total]) => ({
        piece,
        count: total - remaining[piece as keyof typeof remaining],
        color,
    }))
        .filter((item) => item.count > 0);
}
export function buildReviewInsights(positions: string[], movesSan: string[], playerColor: "w" | "b", level: AILevel) {
    return movesSan
        .map((move, index) => {
        const actorColor = index % 2 === 0 ? "w" : "b";
        if (actorColor !== playerColor) {
            return null;
        }
        const before = new Chess(positions[index]);
        const after = new Chess(positions[index + 1]);
        const beforeEval = evaluatePositionCp(before);
        const afterEval = evaluatePositionCp(after);
        const playerSwing = playerColor === "w" ? afterEval - beforeEval : beforeEval - afterEval;
        let label: ReviewInsight["label"] | null = null;
        if (playerSwing <= -150) {
            label = "Blunder";
        }
        else if (playerSwing <= -80) {
            label = "Mistake";
        }
        else if (playerSwing <= -35) {
            label = "Inaccuracy";
        }
        if (!label) {
            return null;
        }
        const suggestion = getAIMove(before, Math.min(level + 1, 8) as AILevel);
        return {
            ply: index,
            move,
            label,
            swing: playerSwing,
            suggestion,
        } satisfies ReviewInsight;
    })
        .filter((item): item is ReviewInsight => item != null)
        .sort((left, right) => left.swing - right.swing);
}
export function calculateAccuracy(positions: string[], color: "w" | "b") {
    if (positions.length <= 1) {
        return 100;
    }
    const values: number[] = [];
    for (let index = 0; index < positions.length - 1; index += 1) {
        const actorColor = index % 2 === 0 ? "w" : "b";
        if (actorColor !== color) {
            continue;
        }
        const beforeEval = evaluatePositionCp(new Chess(positions[index]));
        const afterEval = evaluatePositionCp(new Chess(positions[index + 1]));
        const centipawnLoss = color === "w"
            ? Math.max(0, beforeEval - afterEval)
            : Math.max(0, afterEval - beforeEval);
        const accuracy = Math.round(Math.max(12, 100 * Math.exp(-centipawnLoss / 260)));
        values.push(Math.min(100, accuracy));
    }
    if (values.length === 0) {
        return 100;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
export function calculateAccuracyBreakdown(positions: string[], color: "w" | "b") {
    const breakdown = { best: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
    for (let index = 0; index < positions.length - 1; index += 1) {
        const actorColor = index % 2 === 0 ? "w" : "b";
        if (actorColor !== color) {
            continue;
        }
        const beforeEval = evaluatePositionCp(new Chess(positions[index]));
        const afterEval = evaluatePositionCp(new Chess(positions[index + 1]));
        const centipawnLoss = color === "w"
            ? Math.max(0, beforeEval - afterEval)
            : Math.max(0, afterEval - beforeEval);
        if (centipawnLoss <= 20) {
            breakdown.best += 1;
        }
        else if (centipawnLoss <= 60) {
            breakdown.inaccuracy += 1;
        }
        else if (centipawnLoss <= 130) {
            breakdown.mistake += 1;
        }
        else {
            breakdown.blunder += 1;
        }
    }
    return breakdown;
}
export function calculateRatingDelta(playerRating: number, botRating: number, result: string, playerColor: "w" | "b") {
    if (result === "*") {
        return 0;
    }
    const actualScore = result === "1/2-1/2"
        ? 0.5
        : (result === "1-0" && playerColor === "w") ||
            (result === "0-1" && playerColor === "b")
            ? 1
            : 0;
    const expectedScore = 1 / (1 + 10 ** ((botRating - playerRating) / 400));
    const kFactor = playerRating < 1600 ? 28 : playerRating < 2200 ? 20 : 16;
    return Math.round(kFactor * (actualScore - expectedScore));
}
export function formatEval(score: number) {
    if (Math.abs(score) >= 10000) {
        return score > 0 ? "Mate for White" : "Mate for Black";
    }
    const normalized = score / 100;
    return `${normalized > 0 ? "+" : ""}${normalized.toFixed(1)}`;
}
