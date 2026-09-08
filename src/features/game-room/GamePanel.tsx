import { useEffect, useState, type ReactNode } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import MoveList from "@/components/MoveList";
import { GameResult } from "./GameResult";
import type { RoomResult } from "./types";
export type GamePanelProps = {
    moves: string[];
    cursor: number | null;
    onCursor: (value: number | null) => void;
    info: ReactNode;
    chat?: ReactNode;
    controls: ReactNode;
    result?: RoomResult;
    notice?: ReactNode;
    status: string;
    statusTone?: string;
    focus?: boolean;
};
export function GamePanel({ moves, cursor, onCursor, info, chat, controls, result, notice, status, statusTone, focus }: GamePanelProps) {
    const [tab, setTab] = useState("moves");
    useEffect(() => { if (focus)
        setTab("moves"); }, [focus]);
    const index = cursor == null ? moves.length - 1 : cursor;
    return <aside className="room-panel" aria-label="Панель партії">
    <div className={`room-state ${statusTone || ""}`} role="status"><span aria-hidden="true"/>{status}</div>
    {notice && <div className="room-notices">{notice}</div>}
    {result && <GameResult result={result}/>}
    <Tabs value={tab} onValueChange={setTab} className="room-panel-tabs"><TabsList className="room-tab-list"><TabsTrigger value="moves">Ходи</TabsTrigger>{chat && !focus && <TabsTrigger value="chat">Чат</TabsTrigger>}{!focus && <TabsTrigger value="info">Інфо</TabsTrigger>}</TabsList>
      <TabsContent value="moves" className="room-tab-content room-move-content"><MoveList moves={moves} currentMoveIndex={index} onMoveClick={onCursor} heightClassName="h-full"/>
        <div className="room-move-navigation" aria-label="Перегляд ходів"><Button variant="ghost" size="icon" aria-label="Початкова позиція" title="Початкова позиція" disabled={!moves.length || index < 0} onClick={() => onCursor(-1)}><ChevronFirst size={18}/></Button><Button variant="ghost" size="icon" aria-label="Попередній хід" title="Попередній хід" disabled={index < 0} onClick={() => onCursor(index - 1)}><ChevronLeft size={18}/></Button><Button variant="ghost" size="icon" aria-label="Наступний хід" title="Наступний хід" disabled={index >= moves.length - 1} onClick={() => onCursor(index + 1 === moves.length - 1 ? null : index + 1)}><ChevronRight size={18}/></Button><Button variant="ghost" size="icon" aria-label="Поточна позиція" title="Поточна позиція" disabled={cursor == null} onClick={() => onCursor(null)}><ChevronLast size={18}/></Button></div>
        {cursor != null && <button className="room-return-live" onClick={() => onCursor(null)}>Повернутися до поточної позиції</button>}
      </TabsContent>
      {chat && !focus && <TabsContent value="chat" className="room-tab-content">{chat}</TabsContent>}
      {!focus && <TabsContent value="info" className="room-tab-content">{info}</TabsContent>}
    </Tabs>{controls && <footer className="room-panel-footer">{controls}</footer>}
  </aside>;
}
