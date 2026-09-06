import ChessBoard from "@/components/ChessBoard";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { playPuzzleMove, type PuzzleManifest, type TrainingPuzzle } from "@/features/puzzles/model";
import { useQuery } from "@tanstack/react-query";
import type { Square } from "chess.js";
import { ArrowRight, Lightbulb, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
async function loadJson<T>(path: string, signal: AbortSignal): Promise<T> { const r = await fetch(path, { signal }); if (!r.ok)
    throw new Error("Завантаження недоступне"); return r.json(); }
export default function Puzzles() {
    const [theme, setTheme] = useState("all"), [chunk, setChunk] = useState(0), [index, setIndex] = useState(0), [fen, setFen] = useState(""), [step, setStep] = useState(0), [feedback, setFeedback] = useState<"idle" | "wrong" | "solved">("idle"), [hint, setHint] = useState(false);
    const [mode, setMode] = useState("classic"), [active, setActive] = useState(false), [remaining, setRemaining] = useState(180), [solved, setSolved] = useState(0), [mistakes, setMistakes] = useState(0), [attempted, setAttempted] = useState(false);
    const [boardSize, setBoardSize] = useState(480);
    const locked = useRef(false);
    const sizeRef = useRef<HTMLDivElement>(null);
    const manifest = useQuery({ queryKey: ["puzzle-manifest"], queryFn: ({ signal }) => loadJson<PuzzleManifest>("/puzzles/manifest.json", signal), staleTime: Infinity });
    const available = useMemo(() => manifest.data?.chunks.filter(c => theme === "all" || c.themes.includes(theme)) ?? [], [manifest.data, theme]);
    const selectedSet = available[chunk % Math.max(1, available.length)];
    const batch = useQuery({ queryKey: ["puzzle-set", selectedSet?.file], enabled: !!selectedSet, queryFn: ({ signal }) => loadJson<TrainingPuzzle[]>(`/puzzles/${selectedSet!.file}`, signal), staleTime: Infinity, gcTime: 60000 });
    const puzzles = useMemo(() => batch.data?.filter(p => theme === "all" || p.theme === theme) ?? [], [batch.data, theme]);
    const puzzle = puzzles[index];
    useEffect(() => { if (!sizeRef.current)
        return; const observer = new ResizeObserver(entries => { setBoardSize(Math.floor(Math.min(600, entries[0].contentRect.width))); }); observer.observe(sizeRef.current); return () => observer.disconnect(); }, []);
    useEffect(() => { if (puzzle) {
        setFen(puzzle.fen);
        setStep(0);
        setFeedback("idle");
        setHint(false);
        setAttempted(false);
        locked.current = false;
    } }, [puzzle]);
    useEffect(() => { if (!active)
        return; const deadline = Date.now() + 180000; const timer = window.setInterval(() => { const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000)); setRemaining(left); if (!left)
        setActive(false); }, 250); return () => clearInterval(timer); }, [active]);
    function next() { locked.current = false; setFeedback("idle"); setHint(false); if (index + 1 >= puzzles.length) {
        setIndex(0);
        setChunk(c => (c + 1) % Math.max(available.length, 1));
    }
    else
        setIndex(i => i + 1); }
    function resetMode(nextMode: string) { setMode(nextMode); setActive(false); setRemaining(180); setSolved(0); setMistakes(0); setChunk(0); setIndex(0); setFeedback("idle"); setAttempted(false); setHint(false); locked.current = false; if (puzzle) {
        setFen(puzzle.fen);
        setStep(0);
    } }
    function move(from: string, to: string, promotion?: "q" | "r" | "b" | "n") {
        if (!puzzle || locked.current || feedback === "solved" || (mode === "rush" && !active))
            return false;
        const result = playPuzzleMove(fen, puzzle.solution, step, from, to, promotion);
        if (!result) {
            setFeedback("wrong");
            if (!attempted) {
                setAttempted(true);
                const fails = mistakes + 1;
                setMistakes(fails);
                if (mode === "rush" && fails >= 3) {
                    setActive(false);
                    locked.current = true;
                }
            }
            return false;
        }
        setFen(result.fen);
        setStep(result.index);
        setHint(false);
        setFeedback(result.complete ? "solved" : "idle");
        if (result.complete) {
            locked.current = true;
            if (!attempted)
                setSolved(s => s + 1);
        }
        return true;
    }
    const loading = manifest.isPending || batch.isPending;
    const error = manifest.isError || batch.isError;
    return <Page title="Тренуйте розрахунок" eyebrow="Тактичні задачі"><div className="flex flex-wrap justify-between items-center gap-4 mb-6"><Tabs value={mode} onValueChange={resetMode}><TabsList><TabsTrigger value="classic">За темами</TabsTrigger><TabsTrigger value="rush">На час · 3 хв</TabsTrigger></TabsList></Tabs><Select value={theme} disabled={active} onValueChange={v => { setTheme(v); setChunk(0); setIndex(0); }}><SelectTrigger aria-label="Тема задач" className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Усі теми</SelectItem>{manifest.data?.themes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
 <div className="grid lg:grid-cols-[minmax(0,620px)_minmax(260px,1fr)] gap-7 items-start"><div ref={sizeRef} className="min-w-0">
 {error ? <div className="surface p-8" role="alert">Не вдалося завантажити задачі.<Button className="mt-4" onClick={() => { void manifest.refetch(); void batch.refetch(); }}>Повторити</Button></div> : loading || !puzzle || !fen ? <div className="surface min-h-80 grid place-items-center" role="status">Завантаження задач…</div> : <div className="overflow-hidden rounded-lg border"><ChessBoard key={`${puzzle.id}-${chunk}`} displayFen={fen} initialFen={puzzle.fen} size={boardSize} flipped={puzzle.fen.split(" ")[1] === "b"} interactive={feedback !== "solved" && (mode !== "rush" || active)} onMove={move} annotationSquares={hint && puzzle.solution[step] ? [puzzle.solution[step].slice(0, 2) as Square] : []} allowArrows/></div>}
 </div><aside className="surface p-6"><p className="eyebrow">{puzzle?.theme || "Тренування"}</p><h2 className="text-xl font-semibold">{puzzle ? (puzzle.fen.split(" ")[1] === "w" ? "Хід білих" : "Хід чорних") : "Знайдіть продовження"}</h2><p className="field-note">{puzzle ? `Складність задачі: ${puzzle.rating}` : ""}</p>
 <div className="grid grid-cols-2 gap-4 my-6 border-y py-5"><div><p className="text-sm text-muted-foreground">Без помилок</p><strong className="text-3xl">{solved}</strong></div><div><p className="text-sm text-muted-foreground">З помилкою</p><strong className="text-3xl">{mistakes}</strong></div></div>
 {mode === "rush" && <div className="mb-6"><strong className="text-4xl font-mono tabular-nums">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</strong><p className="field-note">До завершення часу або трьох помилок.</p>{!active && <Button disabled={loading || error} className="mt-4 w-full" onClick={() => { resetMode("rush"); setActive(true); }}>Почати тренування</Button>}</div>}
 <div aria-live="polite" className="min-h-16 text-sm">{feedback === "solved" ? <p className="text-primary font-semibold">Задачу розв’язано. {attempted ? "Повторіть її пізніше без помилок." : "Усе точно!"}</p> : feedback === "wrong" ? <p className="text-destructive">Це не розв’язок. Спробуйте інший хід.</p> : <p className="text-muted-foreground">Розрахуйте весь варіант перед першим ходом.</p>}</div>
 <div className="grid gap-3 mt-4"><Button disabled={loading || error} onClick={next}>{feedback === "solved" ? "Наступна задача" : "Пропустити"}<ArrowRight size={17}/></Button>{mode === "classic" && <Button variant="outline" disabled={!puzzle || feedback === "solved"} onClick={() => setHint(!hint)}><Lightbulb size={17}/>Підказка</Button>}<Button variant="ghost" onClick={() => resetMode(mode)}><RotateCcw size={17}/>Почати заново</Button></div><p className="field-note mt-6">Результати цього тренування. База задач Lichess · CC0.</p>
 </aside></div></Page>;
}
