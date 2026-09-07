import { Button } from "@/components/ui/button";
import { Loader2, Swords, WifiOff } from "lucide-react";
import { CATEGORY_LABELS, parseTimeControl } from "./preferences";
import type { MatchOptions } from "@/lib/play-types";
export function MatchmakingStatus({ options, seconds, rating, connected, error, onCancel, onRetry }: { options: MatchOptions; seconds: number; rating: number | null; connected: boolean; error: string | null; onCancel: () => void; onRetry: () => void }) {
  return <section className="matchmaking-panel" aria-live="polite" aria-busy={connected}><div className="matchmaking-symbol">{connected ? <Swords size={32}/> : <WifiOff size={32}/>}</div><h2>{connected ? "Пошук суперника…" : "Відновлюємо з’єднання"}</h2>
    <p className="mt-2 text-muted-foreground">{options.timeControl} · {CATEGORY_LABELS[parseTimeControl(options.timeControl)?.category || "blitz"]} · {options.rated ? "Рейтингова" : "Без рейтингу"}</p>
    <div className="search-details"><span>Колір<strong>{options.color === "w" ? "Білі" : options.color === "b" ? "Чорні" : "Випадково"}</strong></span>{rating !== null && <span>Ваш рейтинг<strong>{rating}</strong></span>}<span>Рейтинг суперника<strong>{options.minRating}–{options.maxRating}</strong></span></div>
    {connected ? <p className="search-elapsed"><Loader2 size={17} className="animate-spin"/>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</p> : <p className="text-sm mt-4" role="alert">{error || "Немає з’єднання з сервером."}</p>}
    <div className="flex justify-center gap-3 mt-6">{!connected && <Button onClick={onRetry}>Спробувати ще раз</Button>}<Button variant="outline" onClick={onCancel}>Скасувати</Button></div>
  </section>;
}
