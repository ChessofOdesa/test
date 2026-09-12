import { START_FEN, type AnalysisMoveNode, type AnalysisRecord } from "@/features/analysis/model";

function annotation(node: AnalysisMoveNode) {
    const nag = node.nag ? ` ${node.nag}` : "";
    const comment = node.comment.trim() ? ` {${node.comment.trim().replace(/[{}]/g, "")}}` : "";
    return `${nag}${comment}`;
}

function moveToken(node: AnalysisMoveNode, forceMoveNumber = false) {
    const prefix = node.color === "w"
        ? `${node.moveNumber}. `
        : forceMoveNumber
            ? `${node.moveNumber}... `
            : "";
    return `${prefix}${node.san}${annotation(node)}`;
}

function serializeVariation(root: AnalysisMoveNode): string {
    const parts: string[] = [];
    let current: AnalysisMoveNode | undefined = root;
    let first = true;
    while (current) {
        parts.push(moveToken(current, first || current.color === "b"));
        current.children.slice(1).forEach(sideBranch => {
            parts.push(`(${serializeVariation(sideBranch)})`);
        });
        current = current.children[0];
        first = false;
    }
    return parts.join(" ");
}

function serializeMainline(mainline: AnalysisMoveNode[]) {
    const parts: string[] = [];
    mainline.forEach((node, index) => {
        const forceBlackNumber = node.color === "b" && (index === 0 || mainline[index - 1]?.color === "b");
        parts.push(moveToken(node, forceBlackNumber));
        node.children.forEach(branch => {
            parts.push(`(${serializeVariation(branch)})`);
        });
    });
    return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function buildAnalysisPgn(record: AnalysisRecord) {
    const headers = Object.entries({
        Event: record.headers.Event || "Analysis session",
        Site: record.headers.Site || "Chess of Odesa",
        Date: record.headers.Date || new Date().toISOString().slice(0, 10).replace(/-/g, "."),
        White: record.headers.White || "White",
        Black: record.headers.Black || "Black",
        Result: record.headers.Result || "*",
        ...(record.rootFen !== START_FEN ? { FEN: record.rootFen, SetUp: "1" } : {}),
    })
        .map(([key, value]) => `[${key} "${String(value).replace(/"/g, "'")}"]`)
        .join("\n");

    const body = serializeMainline(record.mainline);
    return `${headers}\n\n${body}${body ? " " : ""}${record.headers.Result || "*"}`.trim();
}
