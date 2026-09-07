import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePlayerData } from "@/features/profile/usePlayerData";
import { Link } from "react-router-dom";
import { Activity, BarChart3, Clock3, Zap } from "lucide-react";
import type { LobbyStats } from "@/lib/play-types";
export function PlayerQuickStats({ stats, onLogin }: { stats: LobbyStats | null; onLogin: () => void }) {
 const { user, isGuest } = useAuth(), player = usePlayerData();
 const profile = player.data?.profile;
 return <aside className="play-sidebar"><section className="surface play-profile"><h2>Ваш профіль</h2>{!user || isGuest ? <><p className="text-muted-foreground text-sm my-4">Увійдіть, щоб бачити рейтинги та історію партій.</p><Button variant="outline" className="w-full" onClick={onLogin}>Увійти</Button></> : player.isPending ? <div className="space-y-4 mt-5" aria-label="Завантаження профілю"><Skeleton className="h-12 w-full"/><Skeleton className="h-24 w-full"/></div> : player.isError ? <div className="mt-4" role="alert"><p className="text-sm">Не вдалося завантажити профіль.</p><Button variant="link" onClick={() => void player.refetch()}>Спробувати ще раз</Button></div> : <><div className="quick-player"><Avatar className="h-11 w-11"><AvatarImage src={profile?.avatar_url || undefined}/><AvatarFallback>{(profile?.display_name || "Гравець").slice(0, 1)}</AvatarFallback></Avatar><strong>{profile?.display_name || user.user_metadata?.display_name || "Гравець"}</strong></div><dl className="quick-ratings">{[{ name: "Бліц", value: profile?.rating_blitz, icon: Zap }, { name: "Рапід", value: profile?.rating_rapid, icon: Clock3 }, { name: "Куля", value: profile?.rating_bullet, icon: Activity }].map(({ name, value, icon: Icon }) => <div key={name}><dt><Icon size={16}/>{name}</dt><dd>{value ?? "—"}</dd></div>)}</dl><Button variant="outline" className="w-full" asChild><Link to="/profile"><BarChart3 size={16}/>Статистика</Link></Button></> }</section>
 {stats && <section className="surface play-live-stats"><h2>На сервері зараз</h2><dl><div><dt>Гравців онлайн</dt><dd>{stats.players.toLocaleString("uk-UA")}</dd></div><div><dt>Активних партій</dt><dd>{stats.games.toLocaleString("uk-UA")}</dd></div></dl></section>}
 </aside>;
}
