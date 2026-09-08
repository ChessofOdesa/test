import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOARD_THEMES, useBoardSettings } from "@/contexts/BoardSettingsContext";
import type { RoomMode, RoomPreferences } from "./types";
export function BoardSettings({ mode, preferences, update }: {
    mode: RoomMode;
    preferences: RoomPreferences;
    update: (patch: Partial<RoomPreferences>) => void;
}) {
    const board = useBoardSettings();
    const switches: [
        keyof RoomPreferences,
        string
    ][] = [["sound", "Звук ходів"], ["checkSound", "Звук шаху"], ["endSound", "Звук завершення"], ["lowTimeSound", "Попередження про час"], ["animation", "Анімація фігур"], ["legalMoves", "Показувати можливі ходи"], ["lastMove", "Підсвічувати останній хід"], ["autoQueen", "Автоматично обирати ферзя"], ["confirmMove", "Підтверджувати хід на телефоні"]];
    if (mode === "computer")
        switches.push(["evaluation", "Показувати оцінку позиції"]);
    return <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Налаштування дошки" title="Налаштування дошки"><Settings2 size={18}/></Button></DialogTrigger><DialogContent className="room-settings"><DialogHeader><DialogTitle>Налаштування дошки</DialogTitle><DialogDescription>Ваш вибір зберігається на цьому пристрої.</DialogDescription></DialogHeader>
    <label className="room-setting"><span>Тема дошки</span><Select value={board.theme.id} onValueChange={id => { const theme = BOARD_THEMES.find(item => item.id === id); if (theme)
        board.setTheme(theme); }}><SelectTrigger aria-label="Тема дошки"><SelectValue /></SelectTrigger><SelectContent>{BOARD_THEMES.map(theme => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}</SelectContent></Select></label>
    <label className="room-setting"><span>Набір фігур</span><Select value={board.pieceStyle} onValueChange={value => board.setPieceStyle(value as "unicode" | "text")}><SelectTrigger aria-label="Набір фігур"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unicode">Класичні</SelectItem><SelectItem value="text">Літери</SelectItem></SelectContent></Select></label>
    <label className="room-setting"><span>Координати</span><Switch checked={board.showCoordinates} onCheckedChange={board.setShowCoordinates} aria-label="Координати"/></label>
    {switches.map(([key, label]) => <label key={key} className="room-setting"><span>{label}</span><Switch checked={preferences[key]} onCheckedChange={value => update({ [key]: value })} aria-label={label}/></label>)}
  </DialogContent></Dialog>;
}
