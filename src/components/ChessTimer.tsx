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

  return (
    <div
      className={`rounded-xl px-4 py-3 border transition-all ${
        isActive && isRunning
          ? isCritical
            ? "bg-destructive/15 border-destructive/40 shadow-lg"
            : isLow
            ? "bg-primary/15 border-gold/40 shadow-gold"
            : "bg-primary/10 border-gold/30"
          : "bg-secondary border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color === "w" ? "bg-foreground" : "bg-muted-foreground"}`} />
          <span className="text-xs font-body text-muted-foreground">
            {playerName || (color === "w" ? "Білі" : "Чорні")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className={isActive && isRunning ? "text-primary" : "text-muted-foreground"} />
          <span
            className={`text-lg font-mono font-bold tabular-nums ${
              isCritical
                ? "text-destructive animate-pulse"
                : isLow
                ? "text-primary"
                : "text-foreground"
            }`}
          >
            {formatTime(displayTimeMs)}
          </span>
        </div>
      </div>
    </div>
  );
}

export { formatTime };
export type { ChessTimerProps };
