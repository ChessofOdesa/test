import { useId, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, HelpCircle, SlidersHorizontal } from "lucide-react";
import type { ColorChoice } from "@/lib/play-types";
export function ColorPicker({ value, onChange, disabled = false }: { value: ColorChoice; onChange: (v: ColorChoice) => void; disabled?: boolean }) {
  return <div className="play-color-row"><span className="text-sm font-medium">Колір</span><RadioGroup value={value} onValueChange={onChange} disabled={disabled} aria-label="Колір фігур" className="play-color-picker">
    {[{ value: "w", label: "Білі" }, { value: "random", label: "Випадково" }, { value: "b", label: "Чорні" }].map(item => <label key={item.value} data-selected={value === item.value} title={item.value === "random" ? "Система випадково визначить ваш колір" : item.label}><RadioGroupItem value={item.value} className="sr-only"/><span className={`color-disc ${item.value}`} aria-hidden="true"/>{item.label}</label>)}
  </RadioGroup></div>;
}
export function RatedToggle({ value, onChange, available, casualAvailable = true, disabled = false }: { value: boolean; onChange: (v: boolean) => void; available: boolean; casualAvailable?: boolean; disabled?: boolean }) {
  const id = useId();
  return <div className="play-rated-row"><div><div className="flex items-center gap-2"><label htmlFor={id} className="font-medium text-sm">Рейтингова партія</label><Tooltip><TooltipTrigger asChild><button type="button" aria-label="Як працює рейтинг" className="text-muted-foreground"><HelpCircle size={16}/></button></TooltipTrigger><TooltipContent>Рейтинг змінюється лише після завершеної рейтингової партії.</TooltipContent></Tooltip></div><p className="play-note">{!casualAvailable && (!value || !available) ? "Гра без рейтингу тимчасово недоступна." : !available ? "Для цього контролю доступна гра без рейтингу." : value ? "Результат впливає на ваш рейтинг." : "Результат не змінює рейтинг."}</p></div><Switch id={id} checked={value && available} onCheckedChange={onChange} disabled={disabled || !available}/></div>;
}
export function RatingRange({ min, max, onChange, expanded = false, disabled = false }: { min: number; max: number; onChange: (min: number, max: number) => void; expanded?: boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(expanded), id = useId();
  return <div className="play-advanced">{!expanded && <Button variant="ghost" className="w-full justify-start px-0" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><SlidersHorizontal size={16}/>Додаткові налаштування<ChevronDown size={16} className={`ml-auto transition-transform ${open ? "rotate-180" : ""}`}/></Button>}
    {open && <div id={id} className="py-3"><p className="mb-3 font-medium text-sm">Діапазон рейтингу суперника</p><div className="grid grid-cols-2 gap-4"><label className="text-sm">Мінімум<Input type="number" min={100} max={4000} step={50} value={Number.isNaN(min) ? "" : min} disabled={disabled} onChange={e => onChange(e.target.valueAsNumber, max)}/></label><label className="text-sm">Максимум<Input type="number" min={100} max={4000} step={50} value={Number.isNaN(max) ? "" : max} disabled={disabled} onChange={e => onChange(min, e.target.valueAsNumber)}/></label></div><p className="play-note">100–4000. Вужчий діапазон може збільшити час пошуку.</p></div>}
  </div>;
}
