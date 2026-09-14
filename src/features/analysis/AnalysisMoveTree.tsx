import { nextAnalysisPath } from "./navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    START_FEN,
    cloneNodes,
    findOpening,
    formatCp,
    getRecordNode,
    isSamePath,
    removeRecordNode,
    updateRecordNode,
    type AnalysisMoveNode,
    type AnalysisRecord,
    type MoveClassification,
} from "@/features/analysis/model";
import { promoteRecordVariation } from "@/features/analysis/branching";
import { cn } from "@/lib/utils";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    CornerUpLeft,
    Filter,
    GitBranch,
    MessageSquare,
    MoreHorizontal,
    Pause,
    Play,
    Search,
    Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import "@/styles/analysis-move-tree.css";

type MoveFilter = "all" | "errors" | "variations" | "comments" | "mine";

type MovePathEntry = {
    path: number[];
    node: AnalysisMoveNode;
};

type MovePair = {
    number: number;
    white: MovePathEntry | null;
    black: MovePathEntry | null;
};

const CLASSIFICATION_MARKS: Record<MoveClassification, string> = {
    best: "★",
    excellent: "!",
    good: "✓",
    inaccuracy: "?!",
    mistake: "?",
    blunder: "??",
};

const CLASSIFICATION_LABELS: Record<MoveClassification, string> = {
    best: "Найкращий",
    excellent: "Чудовий",
    good: "Добрий",
    inaccuracy: "Неточність",
    mistake: "Помилка",
    blunder: "Груба помилка",
};

const FILTER_LABELS: Record<MoveFilter, string> = {
    all: "Усі ходи",
    errors: "Тільки помилки",
    variations: "Тільки варіанти",
    comments: "З коментарями",
    mine: "Тільки мої ходи",
};

const ERROR_CLASSIFICATIONS = new Set<MoveClassification>(["inaccuracy", "mistake", "blunder"]);

function cloneRecord(record: AnalysisRecord): AnalysisRecord {
    return {
        ...record,
        headers: { ...record.headers },
        currentPath: record.currentPath ? [...record.currentPath] : null,
        mainline: cloneNodes(record.mainline),
        rootVariations: cloneNodes(record.rootVariations || []),
        historyStack: [...record.historyStack],
        futureStack: [...record.futureStack],
    };
}

function pairEntries(entries: MovePathEntry[]): MovePair[] {
    const pairs = new Map<number, MovePair>();
    entries.forEach(entry => {
        const pair = pairs.get(entry.node.moveNumber) || {
            number: entry.node.moveNumber,
            white: null,
            black: null,
        };
        if (entry.node.color === "w") pair.white = entry;
        else pair.black = entry;
        pairs.set(entry.node.moveNumber, pair);
    });
    return [...pairs.values()].sort((a, b) => a.number - b.number);
}

function branchPrimaryLine(root: AnalysisMoveNode, rootPath: number[]): MovePathEntry[] {
    const line: MovePathEntry[] = [];
    let node: AnalysisMoveNode | undefined = root;
    let path = [...rootPath];
    while (node) {
        line.push({ node, path });
        node = node.children[0];
        path = [...path, 0];
    }
    return line;
}

function countNestedVariations(node: AnalysisMoveNode): number {
    let count = Math.max(0, node.children.length - 1);
    node.children.forEach(child => {
        count += countNestedVariations(child);
    });
    return count;
}

function countVariations(mainline: AnalysisMoveNode[]) {
    return mainline.reduce((total, node) => (
        total + node.children.length + node.children.reduce((sum, child) => sum + countNestedVariations(child), 0)
    ), 0);
}

function collectLineNodes(record: AnalysisRecord, path: number[] | null): AnalysisMoveNode[] {
    if (!path?.length) return [];
    const nodes = path[0] === -1 ? [] : record.mainline.slice(0, path[0] + 1);
    for (let length = 2; length <= path.length; length += 1) {
        const node = getRecordNode(record, path.slice(0, length));
        if (!node) break;
        nodes.push(node);
    }
    return nodes;
}

function formatLine(nodes: AnalysisMoveNode[]) {
    return nodes.map((node, index) => {
        if (node.color === "w") return `${node.moveNumber}. ${node.san}`;
        const previous = nodes[index - 1];
        if (!previous || previous.color === "b" || previous.moveNumber !== node.moveNumber) {
            return `${node.moveNumber}... ${node.san}`;
        }
        return node.san;
    }).join(" ");
}


function moveLabel(node: AnalysisMoveNode) {
    return `${node.moveNumber}${node.color === "w" ? "." : "..."}${node.san}`;
}

function pluralMoves(count: number) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} хід`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ходи`;
    return `${count} ходів`;
}

function pluralVariations(count: number) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return `${count} варіант`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} варіанти`;
    return `${count} варіантів`;
}

export default function AnalysisMoveTree({
    record,
    setRecord,
    onNavigate,
    onOpenEngine,
    onPreviewBestMove,
    focusBranch = false,
    followSelection = true,
}: {
    record: AnalysisRecord;
    setRecord: Dispatch<SetStateAction<AnalysisRecord>>;
    onNavigate: (path: number[] | null) => void;
    onOpenEngine: () => void;
    onPreviewBestMove?: () => void;
    focusBranch?: boolean;
    followSelection?: boolean;
}) {
    const treeRef = useRef<HTMLDivElement | null>(null);
    const manualScrollUntil = useRef(0);
    const hasMoves = record.mainline.length > 0;
    const selectionKey = record.currentPath?.join('.') || '';
    const revealSelected = () => {
        const selected = treeRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
        const container = treeRef.current?.closest<HTMLElement>('.analysis-panel-body');
        if (!selected || !container) return;
        const a = selected.getBoundingClientRect(), b = container.getBoundingClientRect();
        const delta = a.top < b.top ? a.top - b.top - 12 : a.bottom > b.bottom ? a.bottom - b.bottom + 12 : 0;
        if (delta) { if (container.scrollBy) container.scrollBy({ top: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); else container.scrollTop += delta; }
    };
    useEffect(() => {
        const container = treeRef.current?.closest('.analysis-panel-body');
        const pause = () => { manualScrollUntil.current = Date.now() + 3500; };
        const keyPause = (event: Event) => { if (['PageUp', 'PageDown', 'Home', 'End'].includes((event as KeyboardEvent).key)) pause(); };
        container?.addEventListener('keydown', keyPause);
        container?.addEventListener('pointerdown', pause, { passive: true });
        container?.addEventListener('wheel', pause, { passive: true }); container?.addEventListener('touchmove', pause, { passive: true });
        return () => { container?.removeEventListener('keydown', keyPause); container?.removeEventListener('pointerdown', pause); container?.removeEventListener('wheel', pause); container?.removeEventListener('touchmove', pause); };
    }, [hasMoves]);
    useEffect(() => { if (followSelection && Date.now() >= manualScrollUntil.current) revealSelected(); }, [followSelection, selectionKey]);
    const [filter, setFilter] = useState<MoveFilter>("all");
    const [ownColor, setOwnColor] = useState<"w" | "b">("w");
    const [variationsCollapsed, setVariationsCollapsed] = useState(false);
    const [showDeepVariations, setShowDeepVariations] = useState(false);
    const [commentPath, setCommentPath] = useState<number[] | null>(null);
    const [commentDraft, setCommentDraft] = useState("");
    const [promotePath, setPromotePath] = useState<number[] | null>(null);
    const [jumpOpen, setJumpOpen] = useState(false);
    const [jumpValue, setJumpValue] = useState("");
    const [autoplay, setAutoplay] = useState(false);
    const [autoplaySpeed, setAutoplaySpeed] = useState("1");

    const opening = useMemo(() => record.rootFen === START_FEN ? findOpening(record.mainline) : null, [record.rootFen, record.mainline]);
    const variationCount = useMemo(() => countVariations(record.mainline) + (record.rootVariations || []).reduce((count, root) => count + 1 + countNestedVariations(root), 0), [record.mainline, record.rootVariations]);
    const selectedNode = useMemo(
        () => record.currentPath ? getRecordNode(record, record.currentPath) : null,
        [record],
    );
    const moveCount = new Set(record.mainline.map(node => node.moveNumber)).size;
    const currentMainlineIndex = record.currentPath?.[0] ?? -1;
    const branchesCollapsed = variationsCollapsed && filter !== "variations" && !focusBranch;

    const mainPairs = useMemo(() => {
        const entries = record.mainline.map((node, index) => ({ node, path: [index] }));
        return pairEntries(entries).filter(pair => {
            if (filter === "all" || filter === "mine") return true;
            const nodes = [pair.white?.node, pair.black?.node].filter(Boolean) as AnalysisMoveNode[];
            if (filter === "errors") return nodes.some(node => node.classification && ERROR_CLASSIFICATIONS.has(node.classification));
            if (filter === "variations") return nodes.some(node => node.children.length > 0 || node === record.mainline[0] && Boolean(record.rootVariations?.length));
            return nodes.some(node => Boolean(node.comment.trim()));
        });
    }, [filter, record.mainline, record.rootVariations]);

    const nextErrorIndex = useMemo(() => {
        const afterCurrent = record.mainline.findIndex((node, index) => index > currentMainlineIndex && node.classification && ERROR_CLASSIFICATIONS.has(node.classification));
        if (afterCurrent >= 0) return afterCurrent;
        return record.mainline.findIndex(node => node.classification && ERROR_CLASSIFICATIONS.has(node.classification));
    }, [currentMainlineIndex, record.mainline]);

    useEffect(() => {
        if (!autoplay) return;
        const delay = autoplaySpeed === "0.5" ? 2000 : autoplaySpeed === "2" ? 500 : 1000;
        const timer = window.setTimeout(() => {
            const next = nextAnalysisPath(record, record.currentPath);
            if (!next) { setAutoplay(false); return; }
            onNavigate(next);
        }, delay);
        return () => window.clearTimeout(timer);
    }, [autoplay, autoplaySpeed, onNavigate, record]);

    useEffect(() => {
        if (!record.mainline.length) setAutoplay(false);
    }, [record.mainline.length]);

    const copyText = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} скопійовано.`);
        } catch {
            toast.error(`Не вдалося скопіювати ${label}.`);
        }
    };

    const startComment = (path: number[], node: AnalysisMoveNode) => {
        setAutoplay(false);
        setCommentPath(path);
        setCommentDraft(node.comment);
    };

    const saveComment = () => {
        if (!commentPath) return;
        const draft = commentDraft.trim();
        setRecord(current => updateRecordNode(current, commentPath, node => { node.comment = draft; }));
        setCommentPath(null);
        toast.success(draft ? "Коментар збережено." : "Коментар видалено.");
    };

    const deleteVariation = (path: number[]) => {
        if (path.length < 2) return;
        let rootLength = 2;
        for (let index = 2; index < path.length; index += 1) {
            if (path[index] > 0) {
                rootLength = index + 1;
                break;
            }
        }
        const rootPath = path.slice(0, rootLength);
        const snapshot = cloneRecord(record);
        const fallbackPath = rootPath.length === 2 ? (rootPath[0] === -1 ? null : [rootPath[0]]) : rootPath.slice(0, -1);
        setRecord(current => ({
            ...removeRecordNode(current, rootPath),
            currentPath: fallbackPath,
        }));
        toast("Варіант видалено", {
            action: {
                label: "Скасувати",
                onClick: () => setRecord(snapshot),
            },
        });
    };

    const promoteVariation = () => {
        if (!promotePath || promotePath.length < 2) return;
        const promoted = promoteRecordVariation(record, promotePath);
        if (!promoted) return;

        setRecord(promoted);
        setPromotePath(null);
        toast.success("Варіант став основною лінією. Стара лінія збережена як варіант.");
    };

    const returnToMainline = () => {
        if (!record.currentPath || record.currentPath.length < 2) return;
        const anchor = record.currentPath[0];
        onNavigate(record.mainline[anchor + 1] ? [anchor + 1] : [anchor]);
    };

    const jumpToMove = () => {
        const number = Number(jumpValue);
        if (!Number.isFinite(number) || number < 1) return;
        const index = record.mainline.findIndex(node => node.moveNumber === number && node.color === "w");
        const fallback = record.mainline.findIndex(node => node.moveNumber === number);
        const target = index >= 0 ? index : fallback;
        if (target >= 0) {
            onNavigate([target]);
            setJumpOpen(false);
            setJumpValue("");
        } else {
            toast.info(`Хід ${number} не знайдено.`);
        }
    };

    const renderSelectedInspector = () => {
        if (!selectedNode || !record.currentPath) return null;
        const classification = selectedNode.classification;
        const hasReviewData = selectedNode.engineEval != null || selectedNode.evalLoss != null || Boolean(selectedNode.bestMoveSan);
        return (
            <section className="analysis-selected-inspector" aria-label="Вибраний хід">
                <div className="analysis-selected-inspector-heading">
                    <div>
                        <span>{record.currentPath.length > 1 ? "Варіант" : "Основна лінія"}</span>
                        <strong>{moveLabel(selectedNode)}</strong>
                    </div>
                    {classification && (
                        <span className={`analysis-selected-classification is-${classification}`}>
                            <b>{CLASSIFICATION_MARKS[classification]}</b>{CLASSIFICATION_LABELS[classification]}
                        </span>
                    )}
                </div>
                {hasReviewData ? (
                    <div className="analysis-selected-inspector-metrics">
                        {selectedNode.engineEval != null && <span><small>Оцінка</small><strong>{formatCp(selectedNode.engineEval)}</strong></span>}
                        {selectedNode.evalLoss != null && <span><small>Втрата</small><strong>{(selectedNode.evalLoss / 100).toFixed(2)}</strong></span>}
                        {selectedNode.bestMoveSan && selectedNode.classification !== "best" && (
                            <button type="button" onClick={onPreviewBestMove || onOpenEngine}>Краще: {selectedNode.bestMoveSan} <ChevronRight size={13} /></button>
                        )}
                    </div>
                ) : (
                    <p className="analysis-selected-inspector-empty">Для цього ходу ще немає збереженої оцінки Stockfish.</p>
                )}
                {selectedNode.comment.trim() && <p className="analysis-selected-inspector-comment"><MessageSquare size={13} />{selectedNode.comment}</p>}
            </section>
        );
    };

    const renderMoveCell = (entry: MovePathEntry | null, isLastMainline = false, inVariation = false) => {
        if (!entry || filter === "mine" && entry.node.color !== ownColor) return <div className="analysis-move-cell is-empty" />;
        const node = entry.node;
        const selected = isSamePath(entry.path, record.currentPath);
        const isBook = !node.classification && !inVariation && opening && node.ply <= opening.matchedPly;
        return (
            <div className={cn("analysis-move-cell", selected && "is-selected")}>
                <button type="button" className="analysis-move-token" aria-current={selected ? "step" : undefined} onClick={() => onNavigate(entry.path)}>
                    <span>{node.san}</span>
                    {selected && <span className="analysis-selected-dot" aria-hidden="true" />}
                    {node.bookmark && <span className="analysis-bookmark-mark" aria-label="Закладка">◆</span>}
                    {node.nag && <em className="analysis-user-nag" title="PGN-анотація користувача">{node.nag}</em>}
                    {isBook && <BookOpen size={13} className="analysis-book-mark" aria-label="Теорія" />}
                    {node.classification && (
                        <em className={`analysis-classification analysis-classification-${node.classification}`} title="Класифікація Stockfish">
                            {CLASSIFICATION_MARKS[node.classification]}
                        </em>
                    )}
                    {node.comment.trim() && <MessageSquare size={12} className="analysis-comment-mark" aria-label="Є коментар" />}
                    {isLastMainline && <span className="analysis-last-move-dot" aria-label="Останній хід" />}
                </button>
                {selected && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" className="analysis-move-menu-trigger" aria-label={`Дії для ${moveLabel(node)}`}><MoreHorizontal size={15} /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {entry.path.length > 1 && <DropdownMenuItem onSelect={() => setPromotePath(entry.path)}><GitBranch size={15} className="mr-2" />Зробити основною лінією</DropdownMenuItem>}
                            <DropdownMenuLabel>Закладка позиції</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={node.bookmark || 'none'} onValueChange={value => setRecord(current => updateRecordNode(current, entry.path, target => { target.bookmark = value === 'none' ? undefined : value as AnalysisMoveNode['bookmark']; }))}>
                                <DropdownMenuRadioItem value="important">Важливо</DropdownMenuRadioItem><DropdownMenuRadioItem value="check">Перевірити</DropdownMenuRadioItem><DropdownMenuRadioItem value="opening">Дебютна ідея</DropdownMenuRadioItem><DropdownMenuRadioItem value="none">Без закладки</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup><DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => startComment(entry.path, node)}><MessageSquare size={15} className="mr-2" />{node.comment ? "Редагувати коментар" : "Додати коментар"}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void copyText(node.fenAfter, "FEN")}><span className="mr-2 font-mono text-xs">FEN</span>Копіювати FEN</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void copyText(formatLine(collectLineNodes(record, entry.path)), "Лінію")}><span className="mr-2 font-mono text-xs">PGN</span>Копіювати лінію</DropdownMenuItem>
                            {entry.path.length > 1 && <DropdownMenuSeparator />}
                            {entry.path.length > 1 && <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => deleteVariation(entry.path)}><Trash2 size={15} className="mr-2" />Видалити цей варіант</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        );
    };

    const renderBranch = (root: AnalysisMoveNode, rootPath: number[], depth: number, key: string) => {
        if (focusBranch && !rootPath.every((index, n) => record.currentPath?.[n] === index)) {
            return <button key={key} type="button" className="analysis-collapsed-variations" onClick={() => onNavigate(rootPath)}>Відкрити {moveLabel(root)}</button>;
        }
        if (depth > 3 && !showDeepVariations && !focusBranch) {
            return (
                <button key={key} type="button" className="analysis-show-deep-variations" onClick={() => setShowDeepVariations(true)}>
                    <GitBranch size={13} />Показати всі варіанти
                </button>
            );
        }
        const line = branchPrimaryLine(root, rootPath);
        const pairs = pairEntries(line);
        return (
            <div
                key={key}
                className="analysis-inline-variation"
                aria-label={`Варіант від ходу ${root.moveNumber}`}
                style={{ "--variation-depth": Math.min(depth, 3) } as CSSProperties}
            >
                {pairs.map(pair => {
                    const entries = [pair.white, pair.black].filter(Boolean) as MovePathEntry[];
                    return (
                        <div key={`${key}-${pair.number}`} className="analysis-variation-group">
                            <div className="analysis-move-row analysis-move-row-variation">
                                <span>{pair.number}.</span>
                                {renderMoveCell(pair.white, false, true)}
                                {renderMoveCell(pair.black, false, true)}
                            </div>
                            {!branchesCollapsed && entries.flatMap(entry => entry.node.children.slice(1).map((child, childIndex) => (
                                renderBranch(child, [...entry.path, childIndex + 1], depth + 1, `${entry.node.id}-${child.id}`)
                            )))}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderBranchesForEntry = (entry: MovePathEntry | null) => {
        if (!entry?.node.children.length) return null;
        if (branchesCollapsed) {
            return (
                <button type="button" className="analysis-collapsed-variations" onClick={() => setVariationsCollapsed(false)}>
                    <GitBranch size={13} />+{entry.node.children.length} {entry.node.children.length === 1 ? "варіант" : "варіанти"}
                </button>
            );
        }
        return entry.node.children.map((child, childIndex) => renderBranch(child, [...entry.path, childIndex], 1, `${entry.node.id}-${child.id}`));
    };

    if (!record.mainline.length) {
        const fenOnly = record.rootFen !== START_FEN;
        return (
            <div className="analysis-move-tree analysis-move-tree-empty">
                <div className="analysis-move-tree-header">
                    <div><strong>Ходи</strong><span>{fenOnly ? "Аналіз позиції" : "Нова партія"}</span></div>
                </div>
                <div className="analysis-empty-state compact">
                    <GitBranch size={28} />
                    <strong>{fenOnly ? "Аналіз позиції" : "Ходів ще немає"}</strong>
                    <p>{fenOnly ? "Історії ходів немає. Зробіть хід на дошці, щоб почати варіант." : "Зробіть хід на дошці, імпортуйте PGN або відкрийте файл."}</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={treeRef} className="analysis-move-tree">
            <div className="analysis-move-tree-header">
                <div>
                    <strong>Ходи</strong>
                    <span>{pluralMoves(moveCount)}{variationCount ? ` · ${pluralVariations(variationCount)}` : ""}</span>
                </div>
                <div className="analysis-move-tree-actions">
                    {followSelection && <button type="button" aria-label="Показати вибраний хід" onClick={() => { manualScrollUntil.current = 0; revealSelected(); }}>До ходу</button>}
                    {nextErrorIndex >= 0 && <button type="button" className="analysis-next-error" onClick={() => onNavigate([nextErrorIndex])}>Наступна помилка <ChevronRight size={13} /></button>}
                    {variationCount > 0 && filter !== "variations" && <button type="button" onClick={() => setVariationsCollapsed(value => !value)} aria-label={variationsCollapsed ? "Розгорнути варіанти" : "Згорнути варіанти"}>{variationsCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>}
                    <button type="button" onClick={() => setAutoplay(value => !value)} aria-label={autoplay ? "Зупинити Auto-play" : "Auto-play партії"}>{autoplay ? <Pause size={15} /> : <Play size={15} />}</button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><button type="button" aria-label="Швидкість Auto-play"><span className="analysis-speed-label">{autoplaySpeed}x</span></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Швидкість</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={autoplaySpeed} onValueChange={setAutoplaySpeed}>
                                <DropdownMenuRadioItem value="0.5">0.5x</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="1">1x</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="2">2x</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Popover open={jumpOpen} onOpenChange={setJumpOpen}>
                        <PopoverTrigger asChild><button type="button" aria-label="Перейти до номера ходу"><Search size={15} /></button></PopoverTrigger>
                        <PopoverContent align="end" className="w-56">
                            <form className="analysis-jump-form" onSubmit={event => { event.preventDefault(); jumpToMove(); }}>
                                <label htmlFor="analysis-jump-move">Перейти до ходу</label>
                                <div><input id="analysis-jump-move" inputMode="numeric" value={jumpValue} onChange={event => setJumpValue(event.target.value.replace(/\D/g, ""))} placeholder="Напр. 24" /><Button size="sm" type="submit">Перейти</Button></div>
                            </form>
                        </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><button type="button" aria-label="Фільтр ходів"><Filter size={15} /></button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Показати</DropdownMenuLabel>
                            <DropdownMenuRadioGroup value={filter} onValueChange={value => setFilter(value as MoveFilter)}>
                                <DropdownMenuRadioItem value="all">Усі ходи</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="errors">Тільки помилки</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="variations">Тільки варіанти</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="comments">З коментарями</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="mine">Тільки мої ходи</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {record.currentPath && record.currentPath.length > 1 && (
                <button type="button" className="analysis-return-mainline" onClick={returnToMainline}><CornerUpLeft size={14} />Основна лінія</button>
            )}

            {opening && (
                <div className="analysis-opening-strip" title={`${opening.opening.name}${opening.line ? ` — ${opening.line.name}` : ""} · ${opening.opening.eco}`}>
                    <BookOpen size={13} />
                    <span>{opening.line?.name || opening.opening.name}</span>
                    <strong>{opening.opening.eco}</strong>
                </div>
            )}

            {filter !== "all" && (
                <div className="analysis-active-filter">
                    <span>{FILTER_LABELS[filter]}</span>
                    {filter === "mine" && <select aria-label="Мій колір" value={ownColor} onChange={event => setOwnColor(event.target.value as "w" | "b")}><option value="w">Білі</option><option value="b">Чорні</option></select>}
                    <button type="button" onClick={() => setFilter("all")}>Скинути</button>
                </div>
            )}

            {renderSelectedInspector()}

            <div className="analysis-mainline-label">Основна партія</div>
            <div className="analysis-inline-move-list" aria-label="Список ходів">
                {mainPairs.length ? mainPairs.map(pair => {
                    const entries = [pair.white, pair.black].filter(Boolean) as MovePathEntry[];
                    const lastIndex = record.mainline.length - 1;
                    return (
                        <div key={pair.number} className="analysis-mainline-group">
                            <div className="analysis-move-row analysis-move-row-main">
                                <span>{pair.number}.</span>
                                {renderMoveCell(pair.white, pair.white?.path[0] === lastIndex)}
                                {renderMoveCell(pair.black, pair.black?.path[0] === lastIndex)}
                            </div>
                            {pair.number === record.mainline[0]?.moveNumber && Boolean(record.rootVariations?.length) && (
                                branchesCollapsed
                                    ? <button type="button" className="analysis-collapsed-variations" onClick={() => setVariationsCollapsed(false)}><GitBranch size={13} />{pluralVariations(record.rootVariations!.length)}</button>
                                    : record.rootVariations!.map((root, index) => renderBranch(root, [-1, index], 1, `root-${root.id}`))
                            )}
                            {entries.map(entry => <div key={`${entry.node.id}-branches`}>{renderBranchesForEntry(entry)}</div>)}
                            {entries.filter(entry => entry.node.comment.trim() && (filter !== "mine" || entry.node.color === ownColor) && !isSamePath(entry.path, record.currentPath)).map(entry => (
                                <button key={`${entry.node.id}-comment`} type="button" className="analysis-move-comment" onClick={() => onNavigate(entry.path)}><MessageSquare size={12} /><span>{entry.node.comment}</span></button>
                            ))}
                        </div>
                    );
                }) : (
                    <div className="analysis-filter-empty">Немає ходів для цього фільтра.</div>
                )}
            </div>

            {filter === "all" && record.mainline.length <= 12 && (
                <div className="analysis-move-tree-hint">Зробіть альтернативний хід на дошці, щоб створити новий варіант.</div>
            )}

            <Dialog open={Boolean(commentPath)} onOpenChange={open => { if (!open) setCommentPath(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Коментар до ходу</DialogTitle>
                        <DialogDescription>Коментар зберігається разом із цим ходом і не змішується з оцінкою Stockfish.</DialogDescription>
                    </DialogHeader>
                    <textarea aria-label="Коментар до ходу" className="analysis-comment-editor" value={commentDraft} onChange={event => setCommentDraft(event.target.value)} maxLength={500} placeholder="Наприклад: Тут я розглядав 2.exd5." />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCommentPath(null)}>Скасувати</Button>
                        <Button onClick={saveComment}>Зберегти</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(promotePath)} onOpenChange={open => { if (!open) setPromotePath(null); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Зробити варіант основною лінією?</DialogTitle>
                        <DialogDescription>Основна партія зміниться. Поточне продовження буде збережено як окремий варіант.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPromotePath(null)}>Скасувати</Button>
                        <Button onClick={promoteVariation}>Зробити основною</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
