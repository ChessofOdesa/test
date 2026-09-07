import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Cpu } from "lucide-react";
import { TimeControlPicker } from "./TimeControlPicker";
import { ColorPicker } from "./MatchSettings";
import { COMPUTER_LEVELS, type PlayPreferences } from "./preferences";
export function ComputerPlayPanel({ preferences, update, onStart }: { preferences: PlayPreferences; update: (p: Partial<PlayPreferences>) => void; onStart: () => void }) {
 return <><div className="play-panel-heading"><span className="play-section-icon"><Cpu size={21}/></span><div><h2>Гра проти комп’ютера</h2><p>Тренувальна партія без зміни рейтингу.</p></div></div>
 <RadioGroup aria-label="Рівень комп’ютера" value={preferences.bot} onValueChange={bot => update({ bot })} className="computer-level-grid">{COMPUTER_LEVELS.map((bot, i) => <label key={bot.id} className="computer-level" data-selected={preferences.bot === bot.id}><RadioGroupItem value={bot.id} className="sr-only"/><span className="level-index">{i + 1}</span><strong>{bot.label}</strong><span>{bot.rating ? `≈ ${bot.rating}` : "Найвища складність"}</span></label>)}</RadioGroup>
 <p className="play-note mb-6">Рейтинг рівня орієнтовний; це не рейтинг гравця.</p>
 <TimeControlPicker value={preferences.computerTime} onChange={computerTime => update({ computerTime })} computer/>
 <ColorPicker value={preferences.color} onChange={color => update({ color })}/><Button className="play-primary-action" onClick={onStart}><Cpu size={20}/>Грати проти комп’ютера</Button>
 </>;
}
