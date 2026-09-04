import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface ChessTimerProps {
  initialTimeMs: number;
  timeMs?: number;
  incrementMs?: number;
  isRunning: boolean;
  isActive: boolean; // whose turn it is
  onTimeout: () => void;
  color: "w" | "b";
  playerName?: string;
}

function formatTime(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function ChessTimer({
  initialTimeMs,
  timeMs,
  incrementMs = 0,
  isRunning,
  isActive,
  onTimeout,
  color,
  playerName,
}: ChessTimerProps) {
  const [displayTimeMs, setDisplayTimeMs] = useState(timeMs ?? initialTimeMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());
  const latestTimeRef = useRef(timeMs ?? initialTimeMs);
  const wasActiveRef = useRef(isActive);

  // Reset when initial time changes
  useEffect(() => {
    const nextTime = timeMs ?? initialTimeMs;
    latestTimeRef.current = nextTime;
    setDisplayTimeMs(nextTime);
    wasActiveRef.current = isActive;
  }, [initialTimeMs, isActive, timeMs]);

  useEffect(() => {
    if (isRunning && isActive && latestTimeRef.current > 0) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;
        lastTickRef.current = now;
        setDisplayTimeMs((prev) => {
          const next = prev - elapsed;
          latestTimeRef.current = next;
          if (next <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onTimeout();
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isActive, onTimeout, timeMs]);

  useEffect(() => {
    if (typeof timeMs === "number") {
      wasActiveRef.current = isActive;
      return;
    }

    const justCompletedTurn = wasActiveRef.current && !isActive && isRunning;

    if (justCompletedTurn && incrementMs > 0 && latestTimeRef.current > 0) {
      setDisplayTimeMs((prev) => {
        const next = prev + incrementMs;
        latestTimeRef.current = next;
        return next;
      });
    }

    wasActiveRef.current = isActive;
  }, [incrementMs, isActive, isRunning, timeMs]);

  const isLow = displayTimeMs < 30000;
  const isCritical = displayTimeMs < 10000;

  const isLive = isActive && isRunning;
  const surfaceClass = isLive
    ? isCritical
      ? "bg-[#c94b46] text-white shadow-[0_3px_0_#8d302d]"
      : "bg-[#f1f1ef] text-[#262522] shadow-[0_3px_0_#b9b7b2]"
    : "bg-[#3a3835] text-[#d7d4cf] shadow-[0_2px_0_#1e1d1b]";

  return (
    <div
      className={`min-w-[150px] rounded-lg px-3 py-2 transition-colors ${surfaceClass}`}
      aria-label={`${playerName || (color === "w" ? "Білі" : "Чорні")}: ${formatTime(displayTimeMs)}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${
              color === "w" ? "border-black/20 bg-white" : "border-white/20 bg-[#1d1c1a]"
            }`}
          />
          <span className={`truncate text-xs font-semibold ${isLive ? "opacity-75" : "text-[#aaa7a2]"}`}>
            {playerName || (color === "w" ? "Білі" : "Чорні")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className={isLive ? "opacity-70" : "text-[#918e89]"} />
          <span className={`font-mono text-xl font-black tabular-nums sm:text-2xl ${isLow && isLive ? "tracking-tight" : ""}`}>
            {formatTime(displayTimeMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

export type { ChessTimerProps };
