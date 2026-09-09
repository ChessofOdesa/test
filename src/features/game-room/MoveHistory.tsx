import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import MoveList, { type MoveAnnotation } from "@/components/MoveList";

type Props = { moves: string[]; cursor: number | null; onCursor: (value: number | null) => void; annotations?: MoveAnnotation[]; finished?: boolean; startColor?: "w" | "b"; startMoveNumber?: number };
export function MoveHistory({ moves, cursor, onCursor, annotations, finished, startColor, startMoveNumber }: Props) {
  const index = cursor == null ? moves.length - 1 : cursor;
  return <>
    <MoveList moves={moves} currentMoveIndex={index} onMoveClick={onCursor} heightClassName="h-full" annotations={annotations} startColor={startColor} startMoveNumber={startMoveNumber}/>
    <div className="room-move-navigation" aria-label="Перегляд ходів">
      <Button variant="ghost" size="icon" aria-label="Початкова позиція" title="Початкова позиція" disabled={!moves.length || index < 0} onClick={() => onCursor(-1)}><ChevronFirst size={18}/></Button>
      <Button variant="ghost" size="icon" aria-label="Попередній хід" title="Попередній хід" disabled={index < 0} onClick={() => onCursor(index - 1)}><ChevronLeft size={18}/></Button>
      <Button variant="ghost" size="icon" aria-label="Наступний хід" title="Наступний хід" disabled={index >= moves.length - 1} onClick={() => onCursor(index + 1 === moves.length - 1 ? null : index + 1)}><ChevronRight size={18}/></Button>
      <Button variant="ghost" size="icon" aria-label={finished ? "Кінцева позиція" : "Поточна позиція"} title={finished ? "Кінцева позиція" : "Поточна позиція"} disabled={cursor == null} onClick={() => onCursor(null)}><ChevronLast size={18}/></Button>
    </div>
    {cursor != null && <button className="room-return-live" onClick={() => onCursor(null)}>{finished ? "До кінцевої позиції" : "Повернутися до поточної позиції"}</button>}
  </>;
}
