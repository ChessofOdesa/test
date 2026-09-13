import { START_FEN, type AnalysisMoveNode, type AnalysisRecord } from '@/features/analysis/model';

function annotation(node: AnalysisMoveNode) {
    const nag = node.nag ? ({ '!': 1, '?': 2, '!!': 3, '??': 4, '!?': 5, '?!': 6 }[node.nag]) : null;
    return `${nag ? ` $${nag}` : ''}${node.comment.trim() ? ` {${node.comment.trim().replace(/[{}]/g, '')}}` : ''}`;
}
function moveToken(node: AnalysisMoveNode, forceNumber = false) {
    return `${node.color === 'w' ? `${node.moveNumber}. ` : forceNumber ? `${node.moveNumber}... ` : ''}${node.san}${annotation(node)}`;
}
/** A PGN variation replaces the preceding move, so emit siblings AFTER that move. */
function serializeVariation(root: AnalysisMoveNode, siblings: AnalysisMoveNode[] = []): string {
    const parts: string[] = [];
    let node: AnalysisMoveNode | undefined = root;
    while (node) {
        parts.push(moveToken(node, true));
        siblings.forEach(branch => parts.push(`(${serializeVariation(branch)})`));
        siblings = node.children.slice(1);
        node = node.children[0];
    }
    return parts.join(' ');
}
function serializeMainline(nodes: AnalysisMoveNode[]) {
    const parts: string[] = [];
    nodes.forEach((node, index) => {
        parts.push(moveToken(node, index === 0 || Boolean(nodes[index - 2]?.children.length)));
        if (index > 0) nodes[index - 1].children.forEach(branch => parts.push(`(${serializeVariation(branch)})`));
    });
    const continuations = nodes.at(-1)?.children;
    if (continuations?.length) parts.push(serializeVariation(continuations[0], continuations.slice(1)));
    return parts.join(' ');
}
export function buildAnalysisPgn(record: AnalysisRecord) {
    const result = ['1-0', '0-1', '1/2-1/2', '*'].includes(record.headers.Result) ? record.headers.Result : '*';
    const metadata: Record<string, string> = { ...record.headers, Result: result };
    if (record.rootFen !== START_FEN) { metadata.FEN = record.rootFen; metadata.SetUp = '1'; }
    else { delete metadata.FEN; delete metadata.SetUp; }
    const headers = Object.entries(metadata).filter(([key]) => /^\w+$/.test(key))
        .map(([key, value]) => `[${key} "${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, ' ')}"]`).join('\n');
    const body = serializeMainline(record.mainline);
    return `${headers}\n\n${body}${body ? ' ' : ''}${result}`.trim();
}
