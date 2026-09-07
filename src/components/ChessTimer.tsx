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
  }, [initialTimeMs, timeMs]);

  useEffect(() => {
    if (isRunning && isActive && latestTimeRef.current > 0) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;
        lastTickRef.current = now;
        const next = Math.max(0, latestTimeRef.current - elapsed);
        latestTimeRef.current = next;
        setDisplayTimeMs(next);
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onTimeout();
        }
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
      ? "bg-secondary text-foreground shadow-sm"
      : "bg-muted text-foreground shadow-sm"
    : "bg-secondary text-muted-foreground shadow-sm";

  return (
    <div
      className={`min-w-[150px] rounded-lg px-3 py-2 transition-colors ${surfaceClass}`}
      aria-label={`${playerName || (color === "w" ? "Білі" : "Чорні")}: ${formatTime(displayTimeMs)}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-sm border ${
              color === "w" ? "border-border bg-white" : "border-border bg-card"
            }`}
          />
          <span className={`truncate text-xs font-semibold ${isLive ? "opacity-75" : "text-muted-foreground"}`}>
            {playerName || (color === "w" ? "Білі" : "Чорні")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className={isLive ? "opacity-70" : "text-muted-foreground"} />
          <span className={`font-mono text-xl font-black tabular-nums sm:text-2xl ${isLow && isLive ? "tracking-tight" : ""}`}>
            {formatTime(displayTimeMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

export type { ChessTimerProps };
