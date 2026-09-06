import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Cpu, Globe2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BOT_OPTIONS, COLORS, TIME_CONTROLS, type ColorChoice } from "./options";
export function GameSetup() {
    const navigate = useNavigate();
    const { isAuthenticated, isGuest } = useAuth();
    const [mode, setMode] = useState("online"), [time, setTime] = useState("3+0"), [bot, setBot] = useState("dmytro"), [computerTime, setComputerTime] = useState("unlimited");
    const [color, setColor] = useState<ColorChoice>("random");
    function start() { const query = new URLSearchParams({ time: mode === "online" ? time : computerTime, color, ...(mode === "online" ? { start: "1" } : { bot }) }); navigate(`${mode === "online" ? "/online" : "/play/computer"}?${query}`); }
    return <section className="surface game-setup"><Tabs value={mode} onValueChange={setMode}>
  <TabsList className="mode-tabs"><TabsTrigger value="online"><Globe2 size={19}/>Онлайн</TabsTrigger><TabsTrigger value="computer"><Cpu size={19}/>Комп’ютер</TabsTrigger></TabsList>
  <TabsContent value="online" className="setup-content"><h2>Ваш темп гри</h2><RadioGroup aria-label="Контроль часу" value={time} onValueChange={setTime} className="time-grid">
   {TIME_CONTROLS.map(item => <label key={item.value} className="choice-card" data-selected={time === item.value}><RadioGroupItem className="sr-only" value={item.value}/><strong>{item.label}</strong><span>{item.category}</span></label>)}
  </RadioGroup><p className="field-note">Хвилини на партію + секунди за кожен хід.</p></TabsContent>
  <TabsContent value="computer" className="setup-content"><h2>Оберіть суперника</h2><RadioGroup aria-label="Складність комп’ютера" value={bot} onValueChange={setBot} className="bot-grid">{BOT_OPTIONS.map((item, index) => <label key={item.id} className="choice-card bot-choice" data-selected={bot === item.id}><RadioGroupItem value={item.id} className="sr-only"/><span className="bot-level">{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><span>{item.level}</span></label>)}</RadioGroup>
  <label className="mt-5 mb-2 block text-sm" htmlFor="computer-time">Час на партію</label><Select value={computerTime} onValueChange={setComputerTime}><SelectTrigger id="computer-time"><SelectValue /></SelectTrigger><SelectContent>{[{ value: "unlimited", label: "Без годинника" }, { value: "3m", label: "3 хвилини" }, { value: "5m", label: "5 хвилин" }, { value: "10m", label: "10 хвилин" }, { value: "30m", label: "30 хвилин" }].map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></TabsContent>
 </Tabs><div className="setup-footer"><p className="mb-3 text-sm font-semibold">Грати за</p><RadioGroup aria-label="Колір фігур" value={color} onValueChange={v => setColor(v as ColorChoice)} className="color-grid">{COLORS.map(item => <label key={item.value} className="color-choice" data-selected={color === item.value}><RadioGroupItem value={item.value} className="sr-only"/>{item.label}</label>)}</RadioGroup>
 <Button onClick={start} className="start-button">{mode === "online" ? (isAuthenticated && !isGuest ? "Знайти суперника" : "Увійти й грати") : "Почати партію"}<ArrowRight size={19}/></Button>
 {mode === "computer" && <p className="field-note text-center">Доступно без акаунта</p>}</div></section>;
}
