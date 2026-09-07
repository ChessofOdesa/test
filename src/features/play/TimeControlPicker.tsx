import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Clock3, Plus } from "lucide-react";
import { CATEGORY_LABELS, parseTimeControl, STANDARD_TIMES } from "./preferences";
export function TimeControlPicker({ value, onChange, computer = false, disabled = false, allowCustom = true }: { value: string; onChange: (value: string) => void; computer?: boolean; disabled?: boolean; allowCustom?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false), [minutes, setMinutes] = useState("10"), [increment, setIncrement] = useState("5");
  const custom = parseTimeControl(`${minutes}+${increment}`);
  const times = computer ? ["unlimited", "3+0", "5+0", "10+0", "15+10"] : STANDARD_TIMES;
  const choices = times.includes(value) ? times : [...times, value];
  return <div className="play-field"><div className="play-field-label"><Clock3 size={17}/><span>Контроль часу</span></div>
    <RadioGroup value={value} onValueChange={onChange} disabled={disabled} aria-label="Контроль часу" className="play-time-grid">
      {choices.map(time => <label key={time} className="play-time-option" data-selected={value === time} data-disabled={disabled}>
        <RadioGroupItem className="sr-only" value={time}/><strong>{time === "unlimited" ? "∞" : time.replace("+", " + ")}</strong>
        <span>{time === "unlimited" ? "Без часу" : CATEGORY_LABELS[parseTimeControl(time)?.category || "blitz"]}</span>
      </label>)}
    </RadioGroup>
    {allowCustom && <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="ghost" disabled={disabled} className="play-custom-time" onClick={() => { const parsed = parseTimeControl(value); setMinutes(String(parsed?.minutes ?? 10)); setIncrement(String(parsed?.increment ?? 5)); }}><Plus size={16}/>Свій контроль часу</Button></DialogTrigger>
      <DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Свій контроль часу</DialogTitle><DialogDescription>Хвилини на партію та секунди після кожного ходу.</DialogDescription></DialogHeader>
        <form onSubmit={event => { event.preventDefault(); if (custom) { onChange(custom.value); setOpen(false); } }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4"><label htmlFor={`${id}-minutes`} className="text-sm font-medium">Хвилини<Input id={`${id}-minutes`} type="number" min="0" max="180" step="1" required value={minutes} onChange={e => setMinutes(e.target.value)}/></label><label htmlFor={`${id}-increment`} className="text-sm font-medium">Додавання, с<Input id={`${id}-increment`} type="number" min="0" max="60" step="1" required value={increment} onChange={e => setIncrement(e.target.value)}/></label></div>
          <p className="text-sm" role="status">{custom ? `${CATEGORY_LABELS[custom.category]} · ${custom.value}` : "Оберіть 0–180 хв і 0–60 с. Значення 0+0 недоступне."}</p>
          <Button type="submit" disabled={!custom} className="w-full">Застосувати</Button>
        </form>
      </DialogContent></Dialog>}
  </div>;
}
