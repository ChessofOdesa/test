import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Swords, Puzzle, GraduationCap, Trophy, BarChart3, Users,
  Zap, Shield, Globe, Timer, Hourglass, Brain, Crown, Bot,
  Target, Flame, ChevronRight, Play, Star, ArrowRight, Eye,
  Search, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ChessBoard from "@/components/ChessBoard";
import Hero from "@/components/Hero";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HERO_TIME_OPTIONS = [
  { label: "1 хв", value: "1+0" },
  { label: "3 хв", value: "3+0" },
  { label: "10 хв", value: "10+0" },
  { label: "30 хв", value: "30+0" },
];

const PLAY_WITH = [
  { title: "Комп'ютер", desc: "Виберіть рівень", icon: Bot, action: "Вибрати рівень", path: "/play" },
  { title: "Друг", desc: "Запросіть суперника", icon: Users, action: "Запросити", path: "/social" },
  { title: "Турніри", desc: "Приєднатися до події", icon: Trophy, action: "Приєднатися", path: "/tournaments" },
];

const QUICK_PLAY = [
  { label: "Bullet", time: "1+0", icon: Zap, color: "from-red-500/20 to-orange-500/20 border-red-500/30", desc: "Швидка гра" },
  { label: "Blitz", time: "3+0", icon: Zap, color: "from-accent/20 to-blue-500/20 border-accent/30", desc: "Класичний бліц" },
  { label: "Blitz", time: "5+0", icon: Timer, color: "from-accent/20 to-cyan-500/20 border-accent/30", desc: "Довший бліц" },
  { label: "Rapid", time: "10+0", icon: Hourglass, color: "from-green-500/20 to-emerald-500/20 border-green-500/30", desc: "Рапід" },
];

const GAME_MODES = [
  { icon: Globe, title: "Грай онлайн", desc: "Знайди суперника за секунди", path: "/play", badge: "Live" },
  { icon: Bot, title: "Грай з AI", desc: "10 рівнів складності", path: "/play", badge: "AI" },
  { icon: Puzzle, title: "Задачі", desc: "432K+ тактичних позицій", path: "/puzzles", badge: "432K+" },
  { icon: GraduationCap, title: "Академія", desc: "Курси від новачка до майстра", path: "/learn", badge: "50+" },
  { icon: BarChart3, title: "Аналіз", desc: "Аналізуй свої партії", path: "/analysis", badge: "Engine" },
  { icon: Brain, title: "AI Тренер", desc: "Персональний шаховий коуч", path: "/ai-trainer", badge: "GPT" },
];

const FEATURES = [
  { icon: Zap, title: "Миттєва гра", desc: "Знайдіть суперника за 1-3 секунди з автоматичним matchmaking" },
  { icon: Brain, title: "AI аналіз", desc: "Кожна партія аналізується AI тренером з рекомендаціями" },
  { icon: Target, title: "Адаптивні задачі", desc: "Рейтинг задач адаптується під ваш рівень гри" },
  { icon: Trophy, title: "Турніри", desc: "Arena, Swiss, командні турніри з призами" },
  { icon: Shield, title: "Безпечно", desc: "Захист від читів, серверна валідація кожного ходу" },
  { icon: Star, title: "Прогрес", desc: "XP, досягнення, щоденні серії та рівні гравця" },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ players: 0, games: 0, puzzles: 432000 });
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [selectedTime, setSelectedTime] = useState(HERO_TIME_OPTIONS[1].value);

  const handlePlayClick = (path: string) => {
    if (!user) {
      toast.info("Увійдіть щоб грати", {
        description: "Для гри необхідно зареєструватися або увійти",
        action: {
          label: "Увійти",
          onClick: () => navigate("/login"),
        },
      });
      navigate("/login");
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    const load = async () => {
      const [{ count: pCount }, { count: gCount }, { data: top }, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("games").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("display_name, rating_blitz, level, xp").order("rating_blitz", { ascending: false }).limit(5),
        supabase.from("games").select("result, time_control, moves_count, created_at, is_ai_game").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ players: pCount || 0, games: gCount || 0, puzzles: 432000 });
      if (top) setTopPlayers(top);
      if (recent) setRecentGames(recent);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Hero />

      <section className="border-t border-white/10 bg-[#0f1710]/80 py-6">
        <div className="container px-4">
          <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">🎮 Режими гри</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {GAME_MODES.slice(0, 4).map(({ icon: Icon, title, desc, path, badge }) => (
              <Link key={title} to={path} className="group rounded-lg border border-white/10 bg-[#121212]/80 p-3 transition hover:border-[#81b64c] hover:bg-[#121212]">
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} className="text-[#81b64c]" />
                  <span className="text-xs bg-[#81b64c]/20 text-[#81b64c] px-2 py-0.5 rounded">{badge}</span>
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f1710] py-6">
        <div className="container px-4">
          <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">📚 Навчання</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/learn" className="group rounded-lg border border-white/10 bg-[#161d16]/80 p-3 transition hover:border-[#81b64c]">
              <GraduationCap size={16} className="text-[#81b64c] mb-2" />
              <h4 className="text-xs font-bold text-white">Уроки</h4>
              <p className="text-xs text-slate-400 mt-1">Базові правила та тактика</p>
            </Link>
            <Link to="/openings" className="group rounded-lg border border-white/10 bg-[#161d16]/80 p-3 transition hover:border-[#81b64c]">
              <BookOpen size={16} className="text-[#81b64c] mb-2" />
              <h4 className="text-xs font-bold text-white">Дебюти</h4>
              <p className="text-xs text-slate-400 mt-1">50+ популярних дебютів</p>
            </Link>
            <Link to="/ai-trainer" className="group rounded-lg border border-white/10 bg-[#161d16]/80 p-3 transition hover:border-[#81b64c]">
              <Brain size={16} className="text-[#81b64c] mb-2" />
              <h4 className="text-xs font-bold text-white">AI Тренер</h4>
              <p className="text-xs text-slate-400 mt-1">Персональний коуч</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f1710]/80 py-6">
        <div className="container px-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-bold text-white uppercase tracking-wider">🏆 Топ гравців</h3>
            <div className="space-y-2">
              {[
                { name: "MasterChess", rating: 2450, flag: "🇺🇦" },
                { name: "NinjaKnight", rating: 2380, flag: "🇺🇦" },
                { name: "SilentPawn", rating: 2320, flag: "🇺🇦" },
                { name: "VictoryQueen", rating: 2290, flag: "🇺🇦" },
                { name: "KingSlayer", rating: 2240, flag: "🇺🇦" },
              ].map((player, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#121212]/80 p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#81b64c] w-5">#{i + 1}</span>
                    <span className={player.flag}>{player.name}</span>
                  </div>
                  <span className="font-bold text-[#81b64c]">{player.rating}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-white uppercase tracking-wider">⚡ Активні турніри</h3>
            <div className="space-y-2">
              {[
                { name: "Bullet Arena", time: "1+0", players: "342", prize: "10K$" },
                { name: "Blitz Cup", time: "3+2", players: "156", prize: "5K$" },
                { name: "Rapid Championship", time: "10+0", players: "89", prize: "2K$" },
                { name: "Daily Classic", time: "30+30", players: "234", prize: "3K$" },
                { name: "Weekend Showdown", time: "5+3", players: "412", prize: "8K$" },
              ].map((tournament, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#121212]/80 p-2.5 text-xs hover:border-[#81b64c] transition cursor-pointer">
                  <div>
                    <div className="font-bold text-white">{tournament.name}</div>
                    <div className="text-slate-400 mt-0.5">{tournament.time} • {tournament.players} гравців</div>
                  </div>
                  <div className="text-[#81b64c] font-bold text-right">{tournament.prize}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f1710] py-6">
        <div className="container px-4">
          <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">⭐ Статистика сайту</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-[#121212]/80 p-3 text-center">
              <div className="text-2xl font-bold text-[#81b64c]">15M+</div>
              <p className="text-xs text-slate-400 mt-1">Партій зіграно</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121212]/80 p-3 text-center">
              <div className="text-2xl font-bold text-[#81b64c]">120K</div>
              <p className="text-xs text-slate-400 mt-1">Гравців онлайн</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121212]/80 p-3 text-center">
              <div className="text-2xl font-bold text-[#81b64c]">432K</div>
              <p className="text-xs text-slate-400 mt-1">Задач</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-[#121212]/80 p-3 text-center">
              <div className="text-2xl font-bold text-[#81b64c]">35K</div>
              <p className="text-xs text-slate-400 mt-1">Турнірів</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f1710]/80 py-8">
        <div className="container px-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {PLAY_WITH.map(({ title, desc, icon: Icon, action, path }) => (
              <Link key={title} to={path} className="group rounded-2xl border border-white/10 bg-[#121212]/80 p-5 transition hover:border-[#81b64c] hover:shadow-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#81b64c]/10 text-[#81b64c] transition group-hover:bg-[#81b64c]/15"><Icon size={24} /></div>
                <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-xs text-slate-300">{desc}</p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white transition group-hover:border-[#81b64c]">{action} <ChevronRight size={14} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f1710] py-8">
        <div className="container px-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Modern Chess Hub</h3>
            <p className="mt-1 text-xs text-slate-400">Мобільні додатки, спільнота та швидкий доступ.</p>
          </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button aria-label="App Store" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">App Store</button>
                  <button aria-label="Google Play" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10">Google Play</button>
                  <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                    <span>Мова:</span>
                    <select aria-label="Мова" className="rounded-lg border border-white/10 bg-[#121212]/80 px-2 py-1 text-xs text-white outline-none">
                      <option>UK</option>
                      <option>EN</option>
                    </select>
                  </div>
                </div>
        </div>
      </section>
    </div>
  );
}
