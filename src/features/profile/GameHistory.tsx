import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { gameResult, type SavedGame } from "./usePlayerData";
export function GameHistory({ games, userId }: {
    games: SavedGame[];
    userId: string;
}) {
    const navigate = useNavigate();
    if (!games.length)
        return <div className="empty-state">Збережених партій ще немає. Вони з’являться тут після гри.</div>;
    return <div className="games-list"><table><thead><tr><th>Дата</th><th>Суперник</th><th>Час</th><th>Результат</th><th><span className="sr-only">Дії</span></th></tr></thead><tbody>{games.map(game => <tr key={game.id}><td>{new Date(game.created_at).toLocaleDateString("uk-UA")}</td><td>{game.is_ai_game ? `Комп’ютер · рівень ${game.ai_level ?? 1}` : "Онлайн-суперник"}</td><td>{game.time_control || "Без годинника"}</td><td>{gameResult(game, userId)}</td><td><Button variant="ghost" disabled={!game.pgn} onClick={() => navigate(`/analysis/${game.id}`)}>Аналіз</Button></td></tr>)}</tbody></table></div>;
}
