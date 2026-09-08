import { memo, useEffect, useRef, useState } from "react";
import { Clock3, Infinity as InfinityIcon } from "lucide-react";
import { playChessSound } from "@/hooks/useChessSounds";
import type { ClockState } from "./types";
export function remainingAt(clock: ClockState, now: number) { return clock.remainingMs == null ? null : Math.max(0, clock.remainingMs - (clock.running ? Math.max(0, now - clock.asOf) : 0)); }
export const ChessClock = memo(function ChessClock({ clock, name, lowTimeSound = false }: {
    clock: ClockState;
    name: string;
    lowTimeSound?: boolean;
}) {
    const [now, setNow] = useState(Date.now);
    const warned = useRef(false);
    const flaggedAt = useRef<number | null>(null);
    const flagRef = useRef(clock.onFlag);
    flagRef.current = clock.onFlag;
    useEffect(() => { setNow(Date.now()); if (!clock.running || clock.remainingMs == null)
        return; const interval = window.setInterval(() => setNow(Date.now()), 100); return () => window.clearInterval(interval); }, [clock.running, clock.asOf, clock.remainingMs]);
    const remaining = remainingAt(clock, now);
    useEffect(() => {
        if (remaining == null)
            return;
        if (remaining > 15000)
            warned.current = false;
        if (clock.running && remaining <= 10000 && remaining > 0 && !warned.current) {
            warned.current = true;
            if (lowTimeSound)
                playChessSound("timeout");
        }
        if (clock.running && remaining === 0 && flaggedAt.current !== clock.asOf) {
            flaggedAt.current = clock.asOf;
            flagRef.current?.();
        }
    }, [remaining, clock.running, clock.asOf, lowTimeSound]);
    if (remaining == null)
        return <div className="room-clock room-clock-unlimited" aria-label={`${name}: без часу`}><InfinityIcon size={22}/><span>Без часу</span></div>;
    const seconds = remaining < 10000 ? Math.floor(remaining / 1000) : Math.ceil(remaining / 1000);
    const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    return <div className={`room-clock ${clock.running ? "is-running" : ""} ${remaining <= 20000 ? "is-critical" : ""}`} role="timer" aria-label={`${name}: ${label}`}><Clock3 size={15}/><span>{label}{remaining > 0 && remaining < 10000 && <small>.{Math.floor(remaining % 1000 / 100)}</small>}</span></div>;
});
