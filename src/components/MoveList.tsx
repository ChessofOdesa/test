import { useEffect, useRef } from "react";
import "@/features/game-room/room.css";
export type MoveAnnotation = { mark: string; label: string; classification: string };
interface MoveListProps {
    startColor?: "w" | "b";
    startMoveNumber?: number;
    annotations?: MoveAnnotation[];
    moves: string[];
    currentMoveIndex?: number;
    onMoveClick?: (index: number) => void;
    heightClassName?: string;
}
export default function MoveList({ moves, currentMoveIndex, onMoveClick, heightClassName = "h-64", annotations, startColor = "w", startMoveNumber = 1 }: MoveListProps) {
    const offset = startColor === "b" ? 1 : 0;
    const scroll = useRef<HTMLDivElement>(null);
    const follow = useRef(true);
    useEffect(() => { if (follow.current && scroll.current)
        scroll.current.scrollTop = scroll.current.scrollHeight; }, [moves.length]);
    useEffect(() => {
        const parent = scroll.current;
        const selected = parent?.querySelector<HTMLElement>('[aria-current="true"]');
        if (!parent || !selected) return;
        const rect = selected.getBoundingClientRect(), bounds = parent.getBoundingClientRect();
        if (rect.top < bounds.top) parent.scrollTop -= bounds.top - rect.top;
        else if (rect.bottom > bounds.bottom) parent.scrollTop += rect.bottom - bounds.bottom;
    }, [currentMoveIndex]);
    return <div className={`overflow-hidden rounded-lg border border-border bg-card ${heightClassName}`}><div ref={scroll} className="room-move-list" onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48; }} aria-label="Запис партії">
    {!moves.length ? <p className="room-moves-empty">Зробіть перший хід — тут з’явиться запис партії.</p> : <div className="room-move-table">{Array.from({ length: Math.ceil((moves.length + offset) / 2) }, (_, pair) => <div className="room-move-row" key={pair}><span>{startMoveNumber + pair}.</span>{[pair * 2 - offset, pair * 2 + 1 - offset].map(index => moves[index] ? onMoveClick ? <button key={index} type="button" aria-current={currentMoveIndex === index} aria-label={`${startMoveNumber + pair}. ${(index + offset) % 2 ? "Чорні" : "Білі"}: ${moves[index]}${annotations?.[index] ? `, ${annotations[index].label}` : ""}`} onClick={() => onMoveClick(index)}><span>{moves[index]}</span>{annotations?.[index]?.mark && <small className={`room-move-mark is-${annotations[index].classification}`} aria-hidden="true">{annotations[index].mark}</small>}</button> : <span key={index}>{moves[index]}</span> : <span key={index}/>)}</div>)}</div>}
  </div></div>;
}
