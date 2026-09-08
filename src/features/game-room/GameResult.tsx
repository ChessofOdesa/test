import { Trophy, Handshake, Flag } from "lucide-react";
import type { RoomResult } from "./types";
export function GameResult({ result }: {
    result: RoomResult;
}) {
    const Icon = result.tone === "win" ? Trophy : result.tone === "draw" ? Handshake : Flag;
    return <section className={`room-result is-${result.tone}`} aria-label="Результат партії" aria-live="polite"><div className="room-result-heading"><Icon size={21}/><h2>{result.title}</h2><strong>{result.result === "1/2-1/2" ? "½–½" : result.result.replace("-", "–")}</strong></div><p>{result.reason}</p>{result.rating}<div className="room-result-actions">{result.actions}</div></section>;
}
