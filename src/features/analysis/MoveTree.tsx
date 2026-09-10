import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_MARKS, type ReviewReport } from "@/features/game-room/review/model";
import { mainline, moveLabel, type AnalysisDocument, type AnalysisNode } from "./tree";

export function MoveTree({ document, selected, report, onSelect, onComment, onDelete, onPromote, onCopy }: {
  document: AnalysisDocument; selected: AnalysisNode; report: ReviewReport | null;
  onSelect: (id: string) => void; onComment: (text: string) => void; onDelete: () => void; onPromote: () => void; onCopy: () => void;
}) {
  const area = useRef<HTMLDivElement>(null);
  const main = mainline(document);
  const grades = new Map(main.map((node, index) => [node.id, report?.moves[index]]));
  useEffect(() => { area.current?.querySelector('[aria-current="step"]')?.scrollIntoView?.({ block: "nearest" }); }, [selected.id]);
  function line(parent: AnalysisNode, first: AnalysisNode, alternatives = true, depth = 0): React.ReactNode {
    const result: React.ReactNode[] = [];
    let before = parent, node: AnalysisNode | undefined = first;
    while (node) {
      const current = node, grade = grades.get(current.id);
      result.push(<button key={current.id} type="button" className="analysis-move" data-grade={grade?.classification} aria-current={selected.id === current.id ? "step" : undefined} onClick={() => onSelect(current.id)} title={current.comment || undefined}>
        {moveLabel(before.fen, current)}<span className="analysis-move-mark">{grade ? REVIEW_MARKS[grade.classification] : ""}</span>{current.comment && <span aria-label="Є коментар"> ·</span>}
      </button>);
      if (alternatives && depth < 40) for (const other of before.children) if (other !== node) {
        result.push(<div key={`v-${other.id}`} className="analysis-variation">({line(before, other, false, depth + 1)})</div>);
      }
      alternatives = true; before = node; node = node.children[0];
    }
    return result;
  }
  return <div className="analysis-moves-panel">
    <div ref={area} className="analysis-moves-scroll" aria-label="Ходи та варіанти">
      <button type="button" className="analysis-root" aria-current={selected.id === document.root.id ? "step" : undefined} onClick={() => onSelect(document.root.id)}>Початкова позиція</button>
      {document.root.children[0] ? line(document.root, document.root.children[0]) : <p className="analysis-note">Імпортуйте PGN або зробіть хід на дошці.</p>}
    </div>
    <div className="analysis-comment"><label htmlFor="move-comment">Коментар до позиції</label><Textarea id="move-comment" value={selected.comment} maxLength={10000} onChange={event => onComment(event.target.value)} placeholder="Ідея ходу, загроза або власний висновок…" />
      <div className="analysis-small-actions"><Button size="sm" variant="outline" disabled={!main.length || selected.id === document.root.id} onClick={onPromote}>Зробити основним</Button><Button size="sm" variant="ghost" onClick={onCopy}>Копіювати варіант</Button><Button size="sm" variant="ghost" disabled={selected.id === document.root.id} onClick={onDelete}>Видалити гілку</Button></div>
    </div>
  </div>;
}
