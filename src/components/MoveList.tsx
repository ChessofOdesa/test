import { useEffect, useRef } from "react";
import "@/features/game-room/room.css";
interface MoveListProps {
    moves: string[];
    currentMoveIndex?: number;
    onMoveClick?: (index: number) => void;
    heightClassName?: string;
}
export default function MoveList({ moves, currentMoveIndex, onMoveClick, heightClassName = "h-64" }: MoveListProps) {
    const scroll = useRef<HTMLDivElement>(null);
    const follow = useRef(true);
    useEffect(() => { if (follow.current && scroll.current)
        scroll.current.scrollTop = scroll.current.scrollHeight; }, [moves.length]);
    return <div className={`overflow-hidden rounded-lg border border-border bg-card ${heightClassName}`}><div ref={scroll} className="room-move-list" onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48; }} aria-label="Запис партії">
    {!moves.length ? <p className="room-moves-empty">Зробіть перший хід — тут з’явиться запис партії.</p> : <div className="room-move-table">{Array.from({ length: Math.ceil(moves.length / 2) }, (_, pair) => <div className="room-move-row" key={pair}><span>{pair + 1}.</span>{[pair * 2, pair * 2 + 1].map(index => moves[index] ? onMoveClick ? <button key={index} type="button" aria-current={currentMoveIndex === index} aria-label={`${pair + 1}. ${index % 2 ? "Чорні" : "Білі"}: ${moves[index]}`} onClick={() => onMoveClick(index)}>{moves[index]}</button> : <span key={index}>{moves[index]}</span> : <span key={index}/>)}</div>)}</div>}
  </div></div>;
}
