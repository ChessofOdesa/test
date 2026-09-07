import { Button } from "@/components/ui/button";
import { Swords, SlidersHorizontal } from "lucide-react";
import { TimeControlPicker } from "./TimeControlPicker";
import { ColorPicker, RatedToggle, RatingRange } from "./MatchSettings";
import type { PlayPreferences } from "./preferences";
export function OnlinePlayPanel({ preferences, update, onStart, ratedAvailable, casualAvailable = true, disabled, custom = false, enhanced = true }: { preferences: PlayPreferences; update: (p: Partial<PlayPreferences>) => void; onStart: () => void; ratedAvailable: boolean; casualAvailable?: boolean; disabled: boolean; custom?: boolean; enhanced?: boolean }) {
  return <><div className="play-panel-heading"><span className="play-section-icon">{custom ? <SlidersHorizontal size={21}/> : <Swords size={21}/>}</span><div><h2>{custom ? "Своя гра" : "Швидка гра"}</h2><p>{custom ? "Налаштуйте партію під свій темп." : "Оберіть час — ми знайдемо суперника."}</p></div></div>
    <TimeControlPicker value={preferences.timeControl} onChange={timeControl => update({ timeControl })} allowCustom={enhanced}/>
    <RatedToggle value={preferences.rated} onChange={rated => update({ rated })} available={ratedAvailable} casualAvailable={casualAvailable}/>
    <ColorPicker value={preferences.color} onChange={color => update({ color })}/>
    {custom && <div className="play-variant"><span>Варіант</span><strong>Стандартні шахи</strong></div>}
    {enhanced && <RatingRange min={preferences.minRating} max={preferences.maxRating} onChange={(minRating, maxRating) => update({ minRating, maxRating })} expanded={custom}/>}
    <Button className="play-primary-action" onClick={onStart} disabled={disabled}><Swords size={20}/>{custom ? "Створити гру" : "Знайти суперника"}</Button>
  </>;
}
