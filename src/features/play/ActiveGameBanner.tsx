import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import type { GameState } from "@/hooks/useOnlineGame";
export function ActiveGameBanner({ game }: { game: GameState }) {
 const opponent = game.yourColor === "w" ? game.black : game.white;
 return <section className="active-game-banner" aria-label="Активна партія"><Swords size={23}/><div><strong>У вас є активна партія</strong><p>{opponent?.name || "Суперник"}{opponent?.rating != null ? ` · ${opponent.rating}` : ""} · {game.timeControl}</p></div><Button asChild><Link to={`/game/${game.id}`}>Повернутися до партії</Link></Button></section>;
}
