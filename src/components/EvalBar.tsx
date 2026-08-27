import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EvalBarProps {
  score: number; // centipawns, positive = white advantage
  height?: number;
  showScale?: boolean;
  mateLabel?: string | null;
  orientation?: "white-bottom" | "white-top";
  className?: string;
}

const SCALE_TICKS = [
  { label: "+5", position: 6 },
  { label: "+3", position: 25 },
  { label: "+1", position: 40 },
  { label: "0", position: 50 },
  { label: "-1", position: 60 },
  { label: "-3", position: 75 },
  { label: "-5", position: 94 },
];

export default function EvalBar({
  score,
  height = 400,
  showScale = false,
  mateLabel = null,
  orientation = "white-bottom",
  className,
}: EvalBarProps) {
  // Convert centipawn score to percentage (50% = equal)
  // Use sigmoid-like function to keep it bounded
  const clampedScore = Math.max(-2000, Math.min(2000, score));
  const whitePercent = 50 + (clampedScore / 2000) * 50;
  const blackPercent = 100 - whitePercent;
  const whiteOnTop = orientation === "white-top";
  const ticks = whiteOnTop
    ? SCALE_TICKS
    : SCALE_TICKS.map((tick) => ({ ...tick, position: 100 - tick.position }));
  const topSegment = {
    color: whiteOnTop ? "hsl(35 30% 82%)" : "hsl(220 15% 20%)",
    height: whiteOnTop ? whitePercent : blackPercent,
  };
  const bottomSegment = {
    color: whiteOnTop ? "hsl(220 15% 20%)" : "hsl(35 30% 82%)",
    height: whiteOnTop ? blackPercent : whitePercent,
  };

  const displayScore = mateLabel
    ? mateLabel
    : Math.abs(score) >= 10000
      ? score > 0
        ? "M#"
        : "-M#"
      : `${score > 0 ? "+" : ""}${(score / 100).toFixed(1)}`;

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      {showScale ? (
        <div className="relative w-8 shrink-0 text-[10px] font-semibold text-muted-foreground">
          {ticks.map((tick) => (
            <div
              key={tick.label}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${tick.position}%` }}
            >
              {tick.label}
            </div>
          ))}
        </div>
      ) : null}

      <div
        className="relative overflow-hidden rounded-lg border border-border"
        style={{ width: 28, height }}
      >
        <motion.div
          className="absolute top-0 left-0 right-0"
          style={{ backgroundColor: topSegment.color }}
          animate={{ height: `${topSegment.height}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          style={{ backgroundColor: bottomSegment.color }}
          animate={{ height: `${bottomSegment.height}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <div className="pointer-events-none absolute inset-0">
          {showScale
            ? ticks.map((tick) => (
                <div
                  key={tick.label}
                  className="absolute left-0 right-0 border-t border-white/10"
                  style={{ top: `${tick.position}%` }}
                />
              ))
            : null}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[9px] font-mono font-bold rotate-[-90deg] whitespace-nowrap"
            style={{
              color: whitePercent > 50 ? "hsl(220 15% 20%)" : "hsl(35 30% 82%)",
            }}
          >
            {displayScore}
          </span>
        </div>
      </div>
    </div>
  );
}
