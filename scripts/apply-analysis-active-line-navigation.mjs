import fs from "node:fs";

const file = "src/pages/AnalysisCenter.tsx";
let source = fs.readFileSync(file, "utf8");

const importMarker = 'import AnalysisEvaluationGraph from "@/features/analysis/AnalysisEvaluationGraph";';
const navigationImport = 'import { analysisNavigationLabel, lastAnalysisPath, nextAnalysisPath, previousAnalysisPath, sameAnalysisPath } from "@/features/analysis/navigation";';
if (!source.includes(navigationImport)) {
  if (!source.includes(importMarker)) throw new Error("AnalysisEvaluationGraph import marker not found");
  source = source.replace(importMarker, `${importMarker}\n${navigationImport}`);
}

const oldNavigation = `    const goFirst = useCallback(() => navigateTo(null), [navigateTo]);
    const goPrevious = useCallback(() => {
        if (currentMoveIndex < 0) return;
        navigateTo(currentMoveIndex <= 0 ? null : renderedMoves[currentMoveIndex - 1].path);
    }, [currentMoveIndex, navigateTo, renderedMoves]);
    const goNext = useCallback(() => {
        if (!renderedMoves.length) return;
        if (currentMoveIndex < 0) navigateTo(renderedMoves[0].path);
        else if (currentMoveIndex < renderedMoves.length - 1) navigateTo(renderedMoves[currentMoveIndex + 1].path);
    }, [currentMoveIndex, navigateTo, renderedMoves]);
    const goLast = useCallback(() => {
        if (renderedMoves.length) navigateTo(renderedMoves[renderedMoves.length - 1].path);
    }, [navigateTo, renderedMoves]);`;

const newNavigation = `    const previousPath = useMemo(() => previousAnalysisPath(record, record.currentPath), [record]);
    const nextPath = useMemo(() => nextAnalysisPath(record, record.currentPath), [record]);
    const lastPath = useMemo(() => lastAnalysisPath(record, record.currentPath), [record]);
    const navigationLabel = useMemo(() => analysisNavigationLabel(record, record.currentPath), [record]);
    const canGoPrevious = Boolean(record.currentPath);
    const canGoNext = nextPath !== null;
    const canGoLast = lastPath !== null && !sameAnalysisPath(record.currentPath, lastPath);

    const goFirst = useCallback(() => navigateTo(null), [navigateTo]);
    const goPrevious = useCallback(() => {
        if (!record.currentPath) return;
        navigateTo(previousPath);
    }, [navigateTo, previousPath, record.currentPath]);
    const goNext = useCallback(() => {
        if (nextPath) navigateTo(nextPath);
    }, [navigateTo, nextPath]);
    const goLast = useCallback(() => {
        if (lastPath) navigateTo(lastPath);
    }, [lastPath, navigateTo]);`;

if (!source.includes("const previousPath = useMemo(() => previousAnalysisPath")) {
  if (!source.includes(oldNavigation)) throw new Error("Legacy navigation block not found");
  source = source.replace(oldNavigation, newNavigation);
}

const oldFooter = `                        <NavIconButton label="На початок партії" icon={<ChevronsLeft size={18} />} onClick={goFirst} disabled={currentMoveIndex < 0} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={18} />} onClick={goPrevious} disabled={currentMoveIndex < 0} />
                        <span aria-live="polite" title={currentMoveIndex >= 0 ? \`Позиція \${currentMoveIndex + 1} із \${renderedMoves.length}\` : "Початкова позиція"}>{currentMoveIndex >= 0 ? \`\${currentMoveIndex + 1} / \${renderedMoves.length}\` : \`0 / \${renderedMoves.length}\`}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={18} />} onClick={goNext} disabled={!renderedMoves.length || currentMoveIndex >= renderedMoves.length - 1} />
                        <NavIconButton label="У кінець партії" icon={<ChevronsRight size={18} />} onClick={goLast} disabled={!renderedMoves.length || currentMoveIndex >= renderedMoves.length - 1} />`;

const newFooter = `                        <NavIconButton label="На початок партії" icon={<ChevronsLeft size={18} />} onClick={goFirst} disabled={!record.currentPath} />
                        <NavIconButton label="Попередній хід" icon={<ChevronLeft size={18} />} onClick={goPrevious} disabled={!canGoPrevious} />
                        <span aria-live="polite" title={record.currentPath?.length && record.currentPath.length > 1 ? \`Активна лінія: \${navigationLabel}\` : \`Позиція: \${navigationLabel}\`}>{navigationLabel}</span>
                        <NavIconButton label="Наступний хід" icon={<ChevronRight size={18} />} onClick={goNext} disabled={!canGoNext} />
                        <NavIconButton label="У кінець активної лінії" icon={<ChevronsRight size={18} />} onClick={goLast} disabled={!canGoLast} />`;

if (!source.includes('label="У кінець активної лінії"')) {
  if (!source.includes(oldFooter)) throw new Error("Legacy footer navigation block not found");
  source = source.replace(oldFooter, newFooter);
}

fs.writeFileSync(file, source);
console.log("Active-line navigation integration applied.");
