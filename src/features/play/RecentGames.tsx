import { useQuery } from "@tanstack/react-query";
import { usePlayerData, gameResult } from "@/features/profile/usePlayerData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
export function RecentGames() {
 const player = usePlayerData(), { user, isGuest } = useAuth(), navigate = useNavigate();
 const games = (player.data?.games || []).filter(game => game.result && game.result !== "*").slice(0, 5);
 const ids = [...new Set(games.flatMap(g => [g.white_player_id, g.black_player_id]).filter(id => id && id !== user?.id))];
 const names = useQuery({ queryKey: ["play-opponent-names", ids], enabled: ids.length > 0, queryFn: async () => { const r = await supabase.from("profiles").select("user_id,display_name").in("user_id", ids); if (r.error) throw r.error; return r.data; } });

 if (!user || isGuest) return null;
 return <section className="surface recent-play-games"><div className="recent-heading"><h2>Останні партії</h2><Link to="/profile">Усі партії<ArrowUpRight size={16}/></Link></div>{player.isPending ? <div className="p-5 space-y-3" aria-label="Завантаження партій">{[0, 1, 2].map(i => <Skeleton key={i} className="h-9 w-full"/>)}</div> : player.isError ? <div className="empty-state" role="alert">Не вдалося завантажити історію.<Button variant="link" onClick={() => void player.refetch()}>Спробувати ще раз</Button></div> : !games.length ? <p className="empty-state">Завершених партій ще немає. Після гри вони з’являться тут.</p> : <div className="recent-table-scroll"><table><thead><tr><th>Суперник</th><th>Результат</th><th>Рейтинг</th><th>Час</th></tr></thead><tbody>{games.map(game => {
 const white = game.white_player_id === user.id, opponentId = white ? game.black_player_id : game.white_player_id;
 const name = game.is_ai_game ? `Комп’ютер · рівень ${game.ai_level || 1}` : names.data?.find(p => p.user_id === opponentId)?.display_name || "Онлайн-суперник";
 const change = white ? game.white_rating_diff : game.black_rating_diff;
 const result = gameResult(game, user.id);
 return <tr key={game.id}><td><button className="recent-game-link" disabled={!game.pgn} onClick={() => navigate("/analysis", { state: { pgn: game.pgn } })}>{name}{game.pgn && <ArrowUpRight size={15}/>}</button></td><td><span className="game-result" data-result={result}>{result === "Перемога" ? "+" : result === "Поразка" ? "−" : "½"}<span className="sr-only">{result}</span></span></td><td>{typeof change === "number" ? `${change > 0 ? "+" : ""}${change}` : "—"}</td><td>{game.time_control || "Без часу"}</td></tr>;
 })}</tbody></table></div>}</section>;
}
