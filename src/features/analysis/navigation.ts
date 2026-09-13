import { getNodeByPath, type AnalysisRecord } from "@/features/analysis/model";

export function previousAnalysisPath(record: AnalysisRecord, path: number[] | null): number[] | null {
    if (!path?.length) return null;
    if (path.length === 1) {
        const index = path[0];
        if (index <= 0 || index >= record.mainline.length) return null;
        return [index - 1];
    }
    if (path.length === 2) return [path[0]];
    return path.slice(0, -1);
}

export function nextAnalysisPath(record: AnalysisRecord, path: number[] | null): number[] | null {
    if (!record.mainline.length) return null;
    if (!path?.length) return [0];

    if (path.length === 1) {
        const index = path[0];
        return index >= 0 && index < record.mainline.length - 1 ? [index + 1] : null;
    }

    const node = getNodeByPath(record.mainline, path);
    if (!node?.children[0]) return null;
    return [...path, 0];
}

export function lastAnalysisPath(record: AnalysisRecord, path: number[] | null): number[] | null {
    if (!record.mainline.length) return null;
    if (!path || path.length <= 1) return [record.mainline.length - 1];

    const result = [...path];
    let node = getNodeByPath(record.mainline, result);
    if (!node) return [record.mainline.length - 1];

    while (node.children[0]) {
        result.push(0);
        node = node.children[0];
    }
    return result;
}

export function analysisNavigationLabel(record: AnalysisRecord, path: number[] | null): string {
    if (!path?.length) return `0 / ${record.mainline.length}`;
    if (path.length === 1) {
        const current = Math.max(0, Math.min(record.mainline.length, path[0] + 1));
        return `${current} / ${record.mainline.length}`;
    }

    const current = path.length - 1;
    let total = current;
    let node = getNodeByPath(record.mainline, path);
    while (node?.children[0]) {
        total += 1;
        node = node.children[0];
    }
    return `Варіант ${current} / ${total}`;
}

export function sameAnalysisPath(left: number[] | null, right: number[] | null): boolean {
    if (left === right) return true;
    if (!left || !right || left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
}
