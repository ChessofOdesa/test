import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { GameSetup } from "@/features/play/GameSetup";
import { GameHistory } from "@/features/profile/GameHistory";
import { usePlayerData } from "@/features/profile/usePlayerData";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpRight, BookOpen, Puzzle } from "lucide-react";
import { Link } from "react-router-dom";
export default function Index() {
    const { user, isGuest } = useAuth();
    const player = usePlayerData();
    return <Page title="Час для шахів." eyebrow="Chess of Odesa" action={<Link to="/analysis" className="hidden sm:flex items-center gap-2 text-sm text-primary">Розібрати партію <ArrowUpRight size={17}/></Link>}>
  <div className="home-grid"><GameSetup /><div className="home-support">
   <section className="surface training-card primary"><Puzzle size={27} className="mb-6 text-primary"/><h2>Знайдіть найсильніший хід.</h2><p>Тактичні задачі, тематичні добірки та тренування на час.</p><Button variant="outline" asChild><Link to="/puzzles">Розв’язувати задачі <ArrowUpRight size={16}/></Link></Button></section>
   <section className="surface training-card"><BookOpen size={27} className="mb-5 text-primary"/><h2>Знання, які грають.</h2><p>Від основ до складних позицій. Короткі уроки з практикою на дошці.</p><div className="flex flex-wrap gap-3"><Button variant="outline" asChild><Link to="/lessons">Відкрити уроки</Link></Button><Button variant="ghost" asChild><Link to="/openings">Дебюти</Link></Button></div></section>
  </div></div>
  {user && !isGuest && <section className="surface mt-7 overflow-hidden"><div className="flex justify-between items-center p-5"><h2 className="text-xl font-semibold">Останні партії</h2><Link className="text-sm text-primary" to="/profile">Мій профіль</Link></div>{player.isPending ? <p className="empty-state" role="status">Завантаження партій…</p> : player.isError ? <div className="empty-state" role="alert">Не вдалося завантажити історію. <Button variant="link" onClick={() => void player.refetch()}>Спробувати ще раз</Button></div> : <GameHistory games={player.data?.games.slice(0, 5) ?? []} userId={user.id}/>}</section>}
 </Page>;
}
