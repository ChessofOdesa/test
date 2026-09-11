import ChessBoard from "@/components/ChessBoard";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    buildPuzzleQueue,
    playPuzzleMove,
    sessionSuccessRate,
    type PuzzleManifest,
    type PuzzleMode,
    type TrainingPuzzle,
} from "@/features/puzzles/model";
import { useQuery } from "@tanstack/react-query";
import type { Square } from "chess.js";
import { ArrowRight, Flame, Lightbulb, RotateCcw, Shield, Target, TimerReset } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const RUSH_SECONDS = 180;
const MAX_STRIKES = 3;

async function loadJson<T>(path: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(path, { signal });
    if (!response.ok) throw new Error("Завантаження недоступне");
    return response.json();
}

function formatClock(seconds: number) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function Puzzles() {
    const [theme, setTheme] = useState("all");
    const [chunk, setChunk] = useState(0);
    const [index, setIndex] = useState(0);
    const [queueSeed, setQueueSeed] = useState(1);
    const [fen, setFen] = useState("");
    const [step, setStep] = useState(0);
    const [feedback, setFeedback] = useState<"idle" | "wrong" | "solved">("idle");
    const [hint, setHint] = useState(false);
    const [mode, setMode] = useState<PuzzleMode>("classic");
    const [started, setStarted] = useState(true);
    const [active, setActive] = useState(true);
    const [remaining, setRemaining] = useState(RUSH_SECONDS);
    const [solved, setSolved] = useState(0);
    const [failed, setFailed] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [attempted, setAttempted] = useState(false);
    const [boardSize, setBoardSize] = useState(480);

    const locked = useRef(false);
    const sizeRef = useRef<HTMLDivElement>(null);
    const rushDeadline = useRef(0);

    const manifest = useQuery({
        queryKey: ["puzzle-manifest"],
        queryFn: ({ signal }) => loadJson<PuzzleManifest>("/puzzles/manifest.json", signal),
        staleTime: Infinity,
    });

    const available = useMemo(
        () => manifest.data?.chunks.filter(set => theme === "all" || set.themes.includes(theme)) ?? [],
        [manifest.data, theme],
    );
    const selectedSet = available[chunk % Math.max(1, available.length)];

    const batch = useQuery({
        queryKey: ["puzzle-set", selectedSet?.file],
        enabled: !!selectedSet,
        queryFn: ({ signal }) => loadJson<TrainingPuzzle[]>(`/puzzles/${selectedSet!.file}`, signal),
        staleTime: Infinity,
        gcTime: 60_000,
    });

    const filteredPuzzles = useMemo(
        () => batch.data?.filter(puzzle => theme === "all" || puzzle.theme === theme) ?? [],
        [batch.data, theme],
    );
    const puzzles = useMemo(
        () => buildPuzzleQueue(filteredPuzzles, mode, queueSeed),
        [filteredPuzzles, mode, queueSeed],
    );
    const puzzle = puzzles[index];

    useEffect(() => {
        if (!sizeRef.current) return;
        const observer = new ResizeObserver(entries => {
            setBoardSize(Math.floor(Math.min(620, entries[0].contentRect.width)));
        });
        observer.observe(sizeRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!puzzle) return;
        setFen(puzzle.fen);
        setStep(0);
        setFeedback("idle");
        setHint(false);
        setAttempted(false);
        locked.current = false;
    }, [puzzle]);

    useEffect(() => {
        if (!active || mode !== "rush") return;

        const tick = () => {
            const left = Math.max(0, Math.ceil((rushDeadline.current - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) {
                setActive(false);
                locked.current = true;
            }
        };

        tick();
        const timer = window.setInterval(tick, 250);
        return () => window.clearInterval(timer);
    }, [active, mode]);

    const loading = manifest.isPending || batch.isPending;
    const error = manifest.isError || batch.isError;
    const successRate = sessionSuccessRate(solved, failed);
    const strikesLeft = Math.max(0, MAX_STRIKES - failed);
    const sessionEnded = started && mode !== "classic" && !active && (remaining === 0 || failed >= MAX_STRIKES);
    const progress = puzzles.length ? ((index + 1) / puzzles.length) * 100 : 0;

    function resetPuzzleState() {
        locked.current = false;
        setFeedback("idle");
        setHint(false);
        setAttempted(false);
    }

    function rotateQueue() {
        setIndex(0);
        setChunk(current => (current + 1) % Math.max(available.length, 1));
        setQueueSeed(current => current + 1);
    }

    function moveToNextPuzzle() {
        resetPuzzleState();
        if (index + 1 >= puzzles.length) rotateQueue();
        else setIndex(current => current + 1);
    }

    function recordFailure() {
        if (attempted) return false;

        setAttempted(true);
        setStreak(0);
        const nextFailed = failed + 1;
        setFailed(nextFailed);

        if (mode !== "classic" && nextFailed >= MAX_STRIKES) {
            setActive(false);
            locked.current = true;
            return true;
        }

        return false;
    }

    function nextPuzzle() {
        if (!puzzle) return;

        if (mode !== "classic" && active && feedback !== "solved" && !attempted) {
            const ended = recordFailure();
            if (ended) return;
        }

        moveToNextPuzzle();
    }

    function resetSession(nextMode: PuzzleMode = mode) {
        const isClassic = nextMode === "classic";
        setMode(nextMode);
        setStarted(isClassic);
        setActive(isClassic);
        setRemaining(RUSH_SECONDS);
        setSolved(0);
        setFailed(0);
        setStreak(0);
        setBestStreak(0);
        setChunk(0);
        setIndex(0);
        setQueueSeed(current => current + 1);
        resetPuzzleState();
    }

    function startSession() {
        setStarted(true);
        setActive(true);
        setSolved(0);
        setFailed(0);
        setStreak(0);
        setBestStreak(0);
        setChunk(0);
        setIndex(0);
        setQueueSeed(current => current + 1);
        resetPuzzleState();

        if (mode === "rush") {
            setRemaining(RUSH_SECONDS);
            rushDeadline.current = Date.now() + RUSH_SECONDS * 1000;
        }
    }

    function move(from: string, to: string, promotion?: "q" | "r" | "b" | "n") {
        if (!puzzle || locked.current || feedback === "solved" || (mode !== "classic" && !active)) return false;

        const result = playPuzzleMove(fen, puzzle.solution, step, from, to, promotion);
        if (!result) {
            setFeedback("wrong");
            recordFailure();
            return false;
        }

        setFen(result.fen);
        setStep(result.index);
        setHint(false);
        setFeedback(result.complete ? "solved" : "idle");

        if (result.complete) {
            locked.current = true;
            if (!attempted) {
                setSolved(current => current + 1);
                setStreak(current => {
                    const next = current + 1;
                    setBestStreak(best => Math.max(best, next));
                    return next;
                });
            }
        }

        return true;
    }

    const modeDescription = mode === "classic"
        ? "Працюйте без таймера, використовуйте підказку й розраховуйте весь варіант."
        : mode === "rush"
            ? "Три хвилини, максимум три помилки. Пропуск нерозв’язаної задачі теж рахується помилкою."
            : "Без таймера, але лише три помилки. Задачі йдуть від простіших до складніших.";

    return (
        <Page title="Тактичний тренажер" eyebrow="Задачі · Lichess CC0">
            <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-center">
                <Tabs value={mode} onValueChange={value => resetSession(value as PuzzleMode)}>
                    <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
                        <TabsTrigger value="classic">Класика</TabsTrigger>
                        <TabsTrigger value="rush">Rush · 3 хв</TabsTrigger>
                        <TabsTrigger value="survival">Survival</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Select
                    value={theme}
                    disabled={mode !== "classic" && active}
                    onValueChange={value => {
                        setTheme(value);
                        setChunk(0);
                        setIndex(0);
                        setQueueSeed(current => current + 1);
                    }}
                >
                    <SelectTrigger aria-label="Тема задач" className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Усі теми</SelectItem>
                        {manifest.data?.themes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="surface flex items-center gap-3 p-4">
                    <Target className="text-primary" size={20} />
                    <div><p className="text-xs text-muted-foreground">Чисто розв’язано</p><strong className="text-xl">{solved}</strong></div>
                </div>
                <div className="surface flex items-center gap-3 p-4">
                    <Flame className="text-primary" size={20} />
                    <div><p className="text-xs text-muted-foreground">Серія / рекорд</p><strong className="text-xl">{streak} / {bestStreak}</strong></div>
                </div>
                <div className="surface flex items-center gap-3 p-4">
                    <Shield className="text-primary" size={20} />
                    <div><p className="text-xs text-muted-foreground">Успішність сесії</p><strong className="text-xl">{successRate}%</strong></div>
                </div>
                <div className="surface flex items-center gap-3 p-4">
                    <TimerReset className="text-primary" size={20} />
                    <div>
                        <p className="text-xs text-muted-foreground">{mode === "rush" ? "Час" : mode === "survival" ? "Залишилось помилок" : "База"}</p>
                        <strong className="text-xl tabular-nums">{mode === "rush" ? formatClock(remaining) : mode === "survival" ? strikesLeft : manifest.data?.count ?? "—"}</strong>
                    </div>
                </div>
            </div>

            <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,640px)_minmax(290px,1fr)]">
                <div ref={sizeRef} className="min-w-0">
                    {error ? (
                        <div className="surface grid min-h-80 place-items-center p-8 text-center" role="alert">
                            <div>
                                <p className="font-semibold">Не вдалося завантажити задачі.</p>
                                <Button className="mt-4" onClick={() => { void manifest.refetch(); void batch.refetch(); }}>Повторити</Button>
                            </div>
                        </div>
                    ) : loading || !puzzle || !fen ? (
                        <div className="surface grid min-h-80 place-items-center" role="status">Завантаження задач…</div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                            <ChessBoard
                                key={`${puzzle.id}-${chunk}-${queueSeed}`}
                                displayFen={fen}
                                initialFen={puzzle.fen}
                                size={boardSize}
                                flipped={puzzle.fen.split(" ")[1] === "b"}
                                interactive={feedback !== "solved" && (mode === "classic" || active)}
                                onMove={move}
                                annotationSquares={hint && puzzle.solution[step] ? [puzzle.solution[step].slice(0, 2) as Square] : []}
                                allowArrows
                            />
                        </div>
                    )}
                </div>

                <aside className="surface overflow-hidden">
                    <div className="border-b p-6">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="eyebrow">{puzzle?.theme || "Тренування"}</p>
                            {mode !== "classic" && started && <span className="text-sm font-medium text-muted-foreground">Помилки {failed}/{MAX_STRIKES}</span>}
                        </div>
                        <h2 className="text-xl font-semibold">
                            {puzzle ? (puzzle.fen.split(" ")[1] === "w" ? "Хід білих" : "Хід чорних") : "Знайдіть продовження"}
                        </h2>
                        <p className="field-note">{puzzle ? `${puzzle.title} · рейтинг ${puzzle.rating}` : modeDescription}</p>
                        <Progress className="mt-5" value={progress} />
                        <p className="mt-2 text-xs text-muted-foreground">Задача {puzzles.length ? index + 1 : 0} із {puzzles.length || 0} у поточному наборі</p>
                    </div>

                    <div className="p-6">
                        {!started && mode !== "classic" ? (
                            <div className="grid gap-4">
                                <p className="text-sm text-muted-foreground">{modeDescription}</p>
                                <Button disabled={loading || error || !puzzle} onClick={startSession}>Почати тренування</Button>
                            </div>
                        ) : sessionEnded ? (
                            <div className="grid gap-4" aria-live="polite">
                                <div>
                                    <p className="eyebrow">Сесію завершено</p>
                                    <h3 className="text-2xl font-semibold">{solved} чистих розв’язків</h3>
                                    <p className="field-note">Успішність {successRate}% · найкраща серія {bestStreak}.</p>
                                </div>
                                <Button onClick={startSession}>Зіграти ще раз</Button>
                                <Button variant="outline" onClick={() => resetSession("classic")}>Перейти в класику</Button>
                            </div>
                        ) : (
                            <>
                                <p className="mb-5 text-sm text-muted-foreground">{modeDescription}</p>
                                <div aria-live="polite" className="min-h-16 text-sm">
                                    {feedback === "solved" ? (
                                        <p className="font-semibold text-primary">Задачу розв’язано. {attempted ? "Наступного разу спробуйте без помилки." : "Точний розрахунок!"}</p>
                                    ) : feedback === "wrong" ? (
                                        <p className="text-destructive">Цей хід не входить у розв’язок. Спробуйте інше продовження.</p>
                                    ) : (
                                        <p className="text-muted-foreground">Спочатку прорахуйте весь варіант, потім робіть перший хід.</p>
                                    )}
                                </div>

                                <div className="mt-4 grid gap-3">
                                    <Button disabled={loading || error || !puzzle || (mode !== "classic" && !active)} onClick={nextPuzzle}>
                                        {feedback === "solved" ? "Наступна задача" : "Пропустити"}<ArrowRight size={17} />
                                    </Button>
                                    {mode === "classic" && (
                                        <Button variant="outline" disabled={!puzzle || feedback === "solved"} onClick={() => setHint(current => !current)}>
                                            <Lightbulb size={17} />{hint ? "Сховати підказку" : "Підказка"}
                                        </Button>
                                    )}
                                    <Button variant="ghost" onClick={() => resetSession(mode)}><RotateCcw size={17} />Почати сесію заново</Button>
                                </div>
                            </>
                        )}

                        <p className="field-note mt-6">Статистика рахується лише з ваших дій у поточній сесії. Задачі: Lichess Database · CC0.</p>
                    </div>
                </aside>
            </div>
        </Page>
    );
}
