import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoveHistory } from "./MoveHistory";
// The review bundle mounts only after server-confirmed completion.
const PostGamePanel = lazy(() => import("./review/PostGamePanel"));
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
export function GamePanel(props: GamePanelProps) {
    if (props.result) return <Suspense fallback={<aside className="room-panel room-review-loading" role="status">Готуємо огляд партії…</aside>}><PostGamePanel key={props.result.id} {...props} result={props.result}/></Suspense>;
    return <ActiveGamePanel {...props}/>;
}
function ActiveGamePanel({ moves, cursor, onCursor, info, chat, controls, notice, status, statusTone, focus }: GamePanelProps) {
    const [tab, setTab] = useState("moves");
    useEffect(() => { if (focus)
        setTab("moves"); }, [focus]);
    return <aside className="room-panel" aria-label="Панель партії">
    {notice && <div className="room-notices">{notice}</div>}
    <Tabs value={tab} onValueChange={setTab} className="room-panel-tabs"><TabsList className="room-tab-list"><TabsTrigger value="moves">Ходи</TabsTrigger>{chat && !focus && <TabsTrigger value="chat">Чат</TabsTrigger>}{!focus && <TabsTrigger value="info">Інфо</TabsTrigger>}</TabsList>
      <TabsContent value="moves" className="room-tab-content room-move-content"><MoveHistory moves={moves} cursor={cursor} onCursor={onCursor}/>
      </TabsContent>
      {chat && !focus && <TabsContent value="chat" className="room-tab-content">{chat}</TabsContent>}
      {!focus && <TabsContent value="info" className="room-tab-content">{info}</TabsContent>}
    </Tabs><footer className="room-panel-footer"><div className={`room-state ${statusTone || ""}`} role="status"><span aria-hidden="true"/>{status}</div>{controls}</footer>
  </aside>;
}
