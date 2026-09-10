import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Chess } from "chess.js";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGameReview } from "@/features/game-room/review/useGameReview";
import { saveReview } from "@/features/game-room/review/cache";
import { buildReview, isReviewSample, REVIEW_CONFIG, type ReviewScore, type ReviewedMove } from "@/features/game-room/review/model";
import { getOpeningByMoves } from "@/lib/openings-data";
import { exportPgn, findPath, importPgn, importPositionOrGame, mainline, MAX_IMPORT_BYTES, moveNode, newDocument, pvMoves, START_FEN, updateTree, type AnalysisDocument } from "./tree";
import { loadAnalysis, loadFinishedGame, recentAnalyses, recentFinishedGames, saveAnalysis } from "./storage";
import { usePositionEngine, type EngineLevel } from "./usePositionEngine";

type Preview = { moves: ReturnType<typeof pvMoves>; index: number; startFen: string };
const message = (error: unknown) => error instanceof Error ? error.message : "Не вдалося виконати дію. Спробуйте ще раз.";
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast.success("Скопійовано."); }
  catch { toast.error("Не вдалося скопіювати. Завантажте PGN через меню."); }
}
export function useAnalysisWorkspace() {
  const location = useLocation(), navigate = useNavigate(), { gameId } = useParams(), [params] = useSearchParams();
  const { user, isGuest, loading: authLoading } = useAuth(), queryClient = useQueryClient();
  const accountId = !isGuest ? user?.id : undefined;
  const [document, setDocument] = useState<AnalysisDocument>(() => newDocument());
  const [selectedId, setSelectedId] = useState(document.root.id);
  const [sourceId, setSourceId] = useState<string | null>(null), [sessionId, setSessionId] = useState<string>();
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false), [dirty, setDirty] = useState(false), [tab, setTab] = useState("moves");
  const [importOpen, setImportOpen] = useState(false), [editorOpen, setEditorOpen] = useState(false), [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState(""), [importError, setImportError] = useState("");
  const [engineEnabled, setEngineEnabled] = useState(true), [bestArrow, setBestArrow] = useState(false);
  const [multiPv, setMultiPv] = useState(3), [level, setLevel] = useState<EngineLevel>("standard");
  const [flipped, setFlipped] = useState(false), [preview, setPreview] = useState<Preview | null>(null);
  const [undo, setUndo] = useState<AnalysisDocument[]>([]), [redo, setRedo] = useState<AnalysisDocument[]>([]);
  const [boardSize, setBoardSize] = useState(520), [arrowsEpoch, setArrowsEpoch] = useState(0);
  const boardArea = useRef<HTMLDivElement>(null), saveLock = useRef(false), documentRef = useRef(document);
  const generation = useRef(0), titleRef = useRef(title);
  titleRef.current = title;
  documentRef.current = document;
  const line = useMemo(() => mainline(document), [document]);
  const path = useMemo(() => findPath(document.root, selectedId) || [document.root], [document, selectedId]);
  const selected = path[path.length - 1], index = line.findIndex(node => node.id === selected.id);
  const reviewPgn = useMemo(() => exportPgn(document, false), [document]);
  const fullPgn = useMemo(() => exportPgn(document), [document]);
  const review = useGameReview(reviewPgn), running = review.status === "running";
  const engine = usePositionEngine(selected.fen, engineEnabled && loaded, running || busy, multiPv, level);
  const opening = document.root.fen === START_FEN ? getOpeningByMoves(line.map(node => node.san)) : null;
  const displayedFen = preview ? preview.index < 0 ? preview.startFen : preview.moves[preview.index].fen : selected.fen;
  const reviewedMove = index >= 0 ? review.report?.moves[index] || null : null;
  const score: ReviewScore | null = preview ? null : engine.terminal || (engine.result ? { cp: engine.result.scoreCp, mate: engine.result.scoreMate } : selected.id === document.root.id ? review.report?.samples[0]?.score || null : reviewedMove?.after || null);
  const sessions = useQuery({ queryKey: ["analysis-sessions", accountId], enabled: !!accountId, queryFn: () => recentAnalyses(accountId!) });
  const recent = useQuery({ queryKey: ["analysis-games", accountId], enabled: !!accountId && importOpen, queryFn: () => recentFinishedGames(accountId!) });

  const replace = useCallback((next: AnalysisDocument, source: string | null = null, savedId?: string) => {
    generation.current++;
    setDocument(next); setSelectedId(mainline(next).at(-1)?.id || next.root.id);
    setSourceId(source); setSessionId(savedId); setPreview(null); setUndo([]); setRedo([]);
    setLoaded(true); setDirty(false); setLoadError(""); setImportError("");
    setTitle(next.headers.White && next.headers.Black ? `${next.headers.White} — ${next.headers.Black}` : "Аналіз позиції"); setTab("moves");
  }, []);
  const mutate = (change: (current: AnalysisDocument) => AnalysisDocument) => {
    setUndo(current => [...current.slice(-19), document]); setRedo([]); setDocument(change(document));
    setDirty(true); setLoaded(true); setPreview(null);
  };
  const select = useCallback((id: string) => { setSelectedId(id); setPreview(null); setArrowsEpoch(value => value + 1); }, []);
  const selectIndex = (next: number) => select(next < 0 ? document.root.id : line[next]?.id || document.root.id);
  useEffect(() => {
    const sync = () => {
      const available = boardArea.current?.clientWidth || window.innerWidth - 24;
      const heightLimit = window.innerHeight - (window.innerHeight <= 850 ? 228 : 278);
      setBoardSize(Math.max(160, Math.floor(Math.min(680, available - 34, window.innerWidth >= 1050 ? heightLimit : available - 34))));
    };
    sync(); const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    if (boardArea.current) observer?.observe(boardArea.current);
    window.addEventListener("resize", sync); return () => { observer?.disconnect(); window.removeEventListener("resize", sync); };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    const pgn = typeof location.state?.pgn === "string" ? location.state.pgn : params.get("pgn"), fen = params.get("fen"), saved = params.get("session");
    const load = async () => {
      if (saved && authLoading) return;
      setBusy(true); setLoadError("");
      try {
        if (saved) {
          if (!accountId) throw new Error("Увійдіть в акаунт, щоб відкрити збережений аналіз.");
          const data = await loadAnalysis(saved, accountId); if (cancelled) return;
          const next = importPgn(data.pgn);
          const cached = (data.metadata as { review?: { version?: string; samples?: unknown[]; createdAt?: number } } | null)?.review;
          if (cached?.version === REVIEW_CONFIG.version && cached.samples?.every(isReviewSample)) {
            try { const pgn = exportPgn(next, false); saveReview(pgn, buildReview(pgn, cached.samples, cached.createdAt)); } catch { /* Invalid cached data must not discard the PGN. */ }
          }
          replace(next, data.game_id, data.id); setTitle(data.title);
        } else if (gameId) {
          const game = await loadFinishedGame(gameId); if (cancelled) return;
          const next = importPgn(game.pgn); next.headers.Result = game.result!;
          if (game.time_control) next.headers.TimeControl = game.time_control;
          if (game.white_rating != null) next.headers.WhiteElo = String(game.white_rating);
          if (game.black_rating != null) next.headers.BlackElo = String(game.black_rating);
          if (!next.headers.Date) next.headers.Date = game.created_at.slice(0, 10).replace(/-/g, ".");
          replace(next, game.id);
        } else if (pgn || fen) replace(importPositionOrGame(pgn || fen!));
      } catch (error) { if (!cancelled) setLoadError(message(error)); }
      finally { if (!cancelled) setBusy(false); }
    };
    void load(); return () => { cancelled = true; };
  }, [location.key, location.state, params, gameId, accountId, authLoading, replace]);
  useEffect(() => { if (review.status === "done") setTab("overview"); }, [review.status]);
  const navigateMove = useCallback((direction: "first" | "previous" | "next" | "last") => {
    if (preview) {
      const last = preview.moves.length - 1;
      setPreview({ ...preview, index: direction === "first" ? -1 : direction === "last" ? last : Math.max(-1, Math.min(last, preview.index + (direction === "next" ? 1 : -1))) }); return;
    }
    if (direction === "first") { select(document.root.id); return; }
    if (direction === "previous") { select(path.at(-2)?.id || document.root.id); return; }
    let next = selected.children[0];
    if (direction === "last") while (next?.children[0]) next = next.children[0];
    if (next) select(next.id);
  }, [document.root, path, preview, select, selected]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (importOpen || editorOpen || settingsOpen) return;
      if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"],[role="slider"],[role="tablist"]')) return;
      const keys: Record<string, "first" | "previous" | "next" | "last"> = { ArrowLeft: "previous", ArrowRight: "next", Home: "first", End: "last" };
      if (keys[event.key]) { event.preventDefault(); navigateMove(keys[event.key]); }
      if (event.key === "Escape") { setPreview(null); setArrowsEpoch(value => value + 1); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [navigateMove, importOpen, editorOpen, settingsOpen]);
  const boardMove = useCallback((from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
    if (preview) return false;
    try {
      const move = new Chess(selected.fen).move({ from, to, promotion });
      const existing = selected.children.find(node => node.uci === move.lan);
      if (existing) { select(existing.id); return true; }
      const node = moveNode(selected, move);
      setUndo(current => [...current.slice(-19), document]); setRedo([]);
      setDocument(updateTree(document, selected.id, parent => { parent.children.push(node); }));
      select(node.id); setDirty(true); setLoaded(true); setTab("moves"); return true;
    } catch { return false; }
  }, [document, preview, select, selected]);
  const importDraft = (value = draft) => {
    try { const next = importPositionOrGame(value); review.cancel(); replace(next); setImportOpen(false); setDraft(""); }
    catch (error) { setImportError(message(error)); }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    if (!/\.pgn$/i.test(file.name)) { setImportError("Оберіть файл із розширенням .pgn."); return; }
    if (file.size > MAX_IMPORT_BYTES) { setImportError("PGN завеликий. Максимум — 2 МБ."); return; }
    try { const value = await file.text(); setDraft(value); importDraft(value); } catch { setImportError("Не вдалося прочитати файл PGN."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([fullPgn], { type: "application/x-chess-pgn;charset=utf-8" }));
    const anchor = window.document.createElement("a"); anchor.href = url; anchor.download = "chess-of-odesa-analysis.pgn"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const save = async () => {
    if (!accountId || saveLock.current) return;
    saveLock.current = true; setSaving(true); const snapshot = document, originalTitle = title, originalGeneration = generation.current;
    try {
      const id = await saveAnalysis({ id: sessionId, userId: accountId, gameId: sourceId, title: title.trim() || "Аналіз позиції", pgn: fullPgn, report: review.report });
      const unchanged = documentRef.current === snapshot && titleRef.current === originalTitle;
      if (generation.current === originalGeneration) { setSessionId(id); if (unchanged) setDirty(false); }
      toast.success(unchanged ? "Аналіз збережено в акаунті." : "Попередню версію збережено. Є нові зміни.");
      void queryClient.invalidateQueries({ queryKey: ["analysis-sessions", accountId] });
    } catch (error) { toast.error(message(error)); }
    finally { saveLock.current = false; setSaving(false); }
  };
  const previewLine = (fen: string, moves: string[], end?: number) => {
    const entries = pvMoves(fen, moves);
    if (entries.length) setPreview({ startFen: fen, moves: entries, index: Math.min(end ?? entries.length - 1, entries.length - 1) });
  };
  const showBest = (move: ReviewedMove) => {
    const fen = move.index === 0 ? document.root.fen : line[move.index - 1].fen;
    if (move.bestMoveSan) try { previewLine(fen, [new Chess(fen).move(move.bestMoveSan).lan]); } catch { toast.error("Не вдалося відкрити варіант."); }
  };
  const deleteBranch = () => {
    const parent = path.at(-2); if (!parent) return;
    mutate(current => updateTree(current, parent.id, node => { node.children = node.children.filter(child => child.id !== selected.id); })); select(parent.id);
  };
  const promote = () => mutate(current => {
    let next = current;
    for (let i = 1; i < path.length; i++) next = updateTree(next, path[i - 1].id, node => { node.children.sort((a, b) => a.id === path[i].id ? -1 : b.id === path[i].id ? 1 : 0); });
    return next;
  });
  const copyBranch = () => {
    const branch = structuredClone(document), branchPath = findPath(branch.root, selected.id)!;
    for (let i = 1; i < branchPath.length; i++) branchPath[i - 1].children = [branchPath[i]];
    void copyText(exportPgn(branch, false));
  };
  const history = (back: boolean) => {
    const stack = back ? undo : redo; if (!stack.length) return;
    if (back) { setRedo(current => [...current, document]); setUndo(current => current.slice(0, -1)); }
    else { setUndo(current => [...current, document]); setRedo(current => current.slice(0, -1)); }
    setDocument(stack.at(-1)!); setDirty(true); setPreview(null);
  };
  return { document, selected, line, index, title, setTitle, loaded, busy, loadError, saving, dirty, setDirty, tab, setTab,
    importOpen, setImportOpen, editorOpen, setEditorOpen, settingsOpen, setSettingsOpen, draft, setDraft, importError,
    engineEnabled, setEngineEnabled, bestArrow, setBestArrow, multiPv, setMultiPv, level, setLevel, flipped, setFlipped,
    preview, setPreview, undo, redo, boardArea, boardSize, arrowsEpoch, review, running, engine, opening, displayedFen, score,
    reviewedMove, sessions, recent, accountId, fullPgn, navigate, replace, mutate, select, selectIndex, navigateMove, boardMove,
    importDraft, importFile, download, save, previewLine, showBest, deleteBranch, promote, copyBranch, history };
}
