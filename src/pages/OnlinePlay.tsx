import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { Hourglass, Search, Timer, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
const TIME_CONTROLS = [
    { label: "Bullet", time: "1+0", icon: Zap, desc: "1 хвилина без інкременту" },
    { label: "Blitz", time: "3+0", icon: Zap, desc: "Класичний швидкий темп" },
    { label: "Blitz+", time: "5+0", icon: Timer, desc: "Трохи більше часу на план" },
    { label: "Rapid", time: "10+0", icon: Timer, desc: "Глибше позиційне рішення" },
    { label: "Rapid+", time: "15+10", icon: Hourglass, desc: "Інкремент для довгих партій" },
];
type ColorChoice = "random" | "w" | "b";
export default function OnlinePlay() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedTime, setSelectedTime] = useState(() => {
        const requested = searchParams.get("time");
        const index = TIME_CONTROLS.findIndex((control) => control.time === requested);
        return index >= 0 ? index : 1;
    });
    const [colorChoice, setColorChoice] = useState<ColorChoice>(() => {
        const requested = searchParams.get("color");
        return requested === "w" || requested === "b" || requested === "random" ? requested : "random";
    });
    const { connected, connectionError, game, searching, queueSize, searchTime, recentOpponents, connect, findGame, cancelSearch, } = useOnlineGame();
    const autoSearchStartedRef = useRef(false);
    const timeControl = TIME_CONTROLS[selectedTime];
    useEffect(() => {
        connect();
    }, [connect]);
    useEffect(() => {
        if (game?.id && game.status === "playing") {
            navigate(`/game/${game.id}`);
        }
    }, [game?.id, game?.status, navigate]);
    const handleFindGame = () => {
        findGame(timeControl.time, colorChoice);
    };
    useEffect(() => {
        if (searchParams.get("start") !== "1" || autoSearchStartedRef.current)
            return;
        autoSearchStartedRef.current = true;
        findGame(timeControl.time, colorChoice);
    }, [colorChoice, findGame, searchParams, timeControl.time]);
    return <Page title="Пошук суперника" eyebrow="Онлайн-гра"><div className="play-hub-grid">
    <section className="surface p-6"><h2 className="mb-4 text-lg font-semibold">Контроль часу</h2><div className="time-grid">{TIME_CONTROLS.map((item, index) => <button key={item.time} disabled={searching} aria-pressed={selectedTime === index} onClick={() => setSelectedTime(index)} className="choice-card text-left" data-selected={selectedTime === index}><strong>{item.time}</strong><span>{item.label}</span></button>)}</div>
    <h2 className="mt-6 mb-3 font-semibold">Грати за</h2><div className="color-grid">{[{ value: "w", label: "Білі" }, { value: "random", label: "Випадково" }, { value: "b", label: "Чорні" }].map(item => <button key={item.value} disabled={searching} aria-pressed={colorChoice === item.value} className="color-choice" data-selected={colorChoice === item.value} onClick={() => setColorChoice(item.value as ColorChoice)}>{item.label}</button>)}</div></section>
    <section className="surface p-6"><div role="status" aria-live="polite" className="mb-5">
    {connectionError ? <><h2 className="text-lg font-semibold">З’єднання перервано</h2><p className="field-note">{connectionError}</p></> : searching ? <><Search className="text-primary mb-5" size={30}/><h2 className="text-xl font-semibold">Шукаємо суперника…</h2><p className="field-note">{timeControl.time} · {searchTime} с · У черзі: {queueSize}</p></> : <><h2 className="text-xl font-semibold">{connected ? "Готові до партії" : "Підключення…"}</h2><p className="field-note">{connected ? "Коли знайдемо суперника, дошка відкриється автоматично." : "Перше підключення може тривати довше."}</p></>}
    </div>{searching ? <Button variant="outline" className="w-full" onClick={cancelSearch}>Скасувати пошук</Button> : <Button className="w-full" onClick={handleFindGame}>{connectionError ? "Підключитися знову" : connected ? "Знайти суперника" : "Підключитися й шукати"}</Button>}
    {recentOpponents.length > 0 && <div className="mt-6 border-t pt-5"><h3 className="font-semibold mb-3">Останні суперники</h3>{recentOpponents.slice(0, 5).map(opponent => <p key={opponent.id} className="py-2 text-sm">{opponent.name}</p>)}</div>}</section>
  </div></Page>;
}
