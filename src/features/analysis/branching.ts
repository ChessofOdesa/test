import { cloneNodes, type AnalysisMoveNode, type AnalysisRecord } from "@/features/analysis/model";

export type PromotedVariation = {
    mainline: AnalysisMoveNode[];
    currentPath: number[];
};

function tailToBranch(nodes: AnalysisMoveNode[]): AnalysisMoveNode | null {
    if (!nodes.length) return null;
    const tail = cloneNodes(nodes);
    for (let index = tail.length - 2; index >= 0; index -= 1) {
        tail[index].children = [tail[index + 1], ...tail[index].children];
    }
    return tail[0];
}

function detachPrimaryBranch(node: AnalysisMoveNode): AnalysisMoveNode[] {
    const current = cloneNodes([node])[0];
    const primary = current.children[0] || null;
    current.children = current.children.slice(1);
    return [current, ...(primary ? detachPrimaryBranch(primary) : [])];
}

function prioritizeSelectedPath(root: AnalysisMoveNode, relativePath: number[]): AnalysisMoveNode {
    const clonedRoot = cloneNodes([root])[0];
    let current: AnalysisMoveNode | undefined = clonedRoot;

    for (const childIndex of relativePath) {
        if (!current || childIndex < 0 || childIndex >= current.children.length) break;
        const chosen = current.children[childIndex];
        current.children = [chosen, ...current.children.filter((_, index) => index !== childIndex)];
        current = current.children[0];
    }

    return clonedRoot;
}

export function promoteVariationPath(mainline: AnalysisMoveNode[], path: number[]): PromotedVariation | null {
    if (path.length < 2) return null;

    const anchorIndex = path[0];
    const branchIndex = path[1];
    const branchRoot = mainline[anchorIndex]?.children[branchIndex];
    if (!branchRoot) return null;

    const prefix = cloneNodes(mainline.slice(0, anchorIndex + 1));
    const prioritizedRoot = prioritizeSelectedPath(branchRoot, path.slice(2));
    const promotedLine = detachPrimaryBranch(prioritizedRoot);
    const oldTail = tailToBranch(mainline.slice(anchorIndex + 1));
    const anchor = prefix[prefix.length - 1];

    anchor.children = anchor.children.filter((_, index) => index !== branchIndex);
    if (oldTail) anchor.children = [oldTail, ...anchor.children];

    return {
        mainline: [...prefix, ...promotedLine],
        currentPath: [anchorIndex + path.length - 1],
    };
}

export function promoteRecordVariation(record: AnalysisRecord, path: number[]): AnalysisRecord | null {
    if (path[0] !== -1) {
        const promoted = promoteVariationPath(record.mainline, path);
        return promoted ? { ...record, ...promoted } : null;
    }
    const roots = record.rootVariations || [];
    const root = roots[path[1]];
    if (path.length < 2 || !root) return null;
    const promotedLine = detachPrimaryBranch(prioritizeSelectedPath(root, path.slice(2)));
    const oldMainline = tailToBranch(record.mainline);
    const remainingRoots = cloneNodes(roots.filter((_, index) => index !== path[1]));
    return {
        ...record,
        mainline: promotedLine,
        rootVariations: oldMainline ? [oldMainline, ...remainingRoots] : remainingRoots,
        currentPath: [path.length - 2],
    };
}
