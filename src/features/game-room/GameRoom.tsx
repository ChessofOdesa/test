import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, Focus, Maximize2, Minimize2, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GamePanel, type GamePanelProps } from "./GamePanel";
import { PlayerBar } from "./PlayerBar";
import { BoardSettings } from "./BoardSettings";
import { roomBoardSize, roomPanelWidth } from "./rules";
import type { RoomMode, RoomPlayer, RoomPreferences } from "./types";
import "./room.css";
type Props = GamePanelProps & {
    mode: RoomMode;
    title: string;
    timeControl: string;
    board: (size: number) => ReactNode;
    top: RoomPlayer;
    bottom: RoomPlayer;
    preferences: RoomPreferences;
    updatePreferences: (patch: Partial<RoomPreferences>) => void;
    onFlip: () => void;
    evaluation?: string | null;
    boardNotice?: ReactNode;
};
export function GameRoom({ mode, title, timeControl, board, top, bottom, preferences, updatePreferences, onFlip, evaluation, boardNotice, ...panel }: Props) {
    const root = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(480);
    const [panelWidth, setPanelWidth] = useState(440);
    const [fullscreen, setFullscreen] = useState(false);
    useEffect(() => { document.body.classList.add("game-room-open"); return () => { document.body.classList.remove("game-room-open", "game-room-focus"); }; }, []);
    useEffect(() => { document.body.classList.toggle("game-room-focus", preferences.focus); return () => document.body.classList.remove("game-room-focus"); }, [preferences.focus]);
    useEffect(() => {
        const resize = () => {
            const el = root.current;
            if (!el) return;
            const width = el.clientWidth;
            const header = document.fullscreenElement ? 0 : document.querySelector(".app-header")?.getBoundingClientRect().height || 56;
            const style = getComputedStyle(el);
            const toolbar = el.querySelector<HTMLElement>(".room-toolbar")!;
            const column = el.querySelector<HTMLElement>(".room-board-column")!;
            const players = Array.from(column.querySelectorAll<HTMLElement>(".room-player"));
            const horizontal = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
            const vertical = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
                + toolbar.getBoundingClientRect().height + parseFloat(getComputedStyle(toolbar).marginBottom)
                + players.reduce((sum, player) => sum + player.getBoundingClientRect().height, 0)
                + 2 * parseFloat(getComputedStyle(column).rowGap);
            const panel = roomPanelWidth(width);
            setPanelWidth(panel);
            setSize(roomBoardSize(width, window.innerHeight, header, vertical, horizontal, panel));
        };
        resize();
        const observer = new ResizeObserver(resize);
        if (root.current)
            {
            observer.observe(root.current);
            root.current.querySelectorAll(".room-toolbar, .room-player").forEach(el => observer.observe(el));
            const header = document.querySelector(".app-header");
            if (header) observer.observe(header);
        }
        window.addEventListener("resize", resize);
        const change = () => { setFullscreen(Boolean(document.fullscreenElement)); resize(); };
        document.addEventListener("fullscreenchange", change);
        return () => { observer.disconnect(); window.removeEventListener("resize", resize); document.removeEventListener("fullscreenchange", change); };
    }, []);
    const toggleFullscreen = async () => { try {
        if (document.fullscreenElement)
            await document.exitFullscreen();
        else if (root.current?.requestFullscreen)
            await root.current.requestFullscreen();
        else
            toast.info("Повноекранний режим недоступний у цьому браузері.");
    }
    catch {
        toast.error("Не вдалося відкрити повноекранний режим.");
    } };
    return <div ref={root} className={`game-room-page ${preferences.focus ? "is-focused" : ""}`} style={{ "--room-board-size": `${size}px`, "--room-panel-width": `${panelWidth}px` } as CSSProperties}>
    <div className="room-toolbar"><div className="room-toolbar-title"><Link to="/play" aria-label="Назад до Грати" title="Назад до Грати"><ArrowLeft size={18}/></Link><h1>{title}</h1><span>{timeControl === "unlimited" ? "Без часу" : timeControl}</span></div><div className="room-toolbar-actions"><Button variant="ghost" size="icon" onClick={onFlip} aria-label="Перевернути дошку" title="Перевернути дошку"><RotateCw size={17}/></Button><Button variant="ghost" size="icon" onClick={() => updatePreferences({ focus: !preferences.focus })} aria-label="Режим зосередження" aria-pressed={preferences.focus} title="Режим зосередження"><Focus size={18}/></Button>{typeof document !== "undefined" && document.fullscreenEnabled && <Button variant="ghost" size="icon" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Вийти з повного екрана" : "Повноекранний режим"} title="Повноекранний режим">{fullscreen ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}</Button>}<BoardSettings mode={mode} preferences={preferences} update={updatePreferences}/></div></div>
    <div className="room-layout"><div className="room-board-column"><PlayerBar player={top} lowTimeSound={preferences.lowTimeSound}/><div className="room-board">{board(size)}{evaluation && mode === "computer" && <div className="room-evaluation" aria-label={`Оцінка від білих: ${evaluation}`}>{evaluation}</div>}</div><PlayerBar player={bottom} lowTimeSound={preferences.lowTimeSound}/>{boardNotice}</div><GamePanel {...panel} focus={preferences.focus}/></div>
  </div>;
}
