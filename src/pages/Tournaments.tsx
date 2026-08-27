import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, Users, Clock, Zap, Crown, Medal, ChevronRight, Plus, Check, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Tournament {
  id: string;
  creator_id: string;
  name: string;
  type: string;
  time_control: string;
  max_players: number;
  status: string;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
}

interface TournamentPlayer {
  id: string;
  tournament_id: string;
  user_id: string;
  score: number;
  games_played: number;
  joined_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-primary/15 text-primary",
  active: "bg-green-500/15 text-green-400",
  completed: "bg-muted text-muted-foreground",
};

export default function Tournaments() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [playerCounts, setPlayerCounts] = useState<Record<string, number>>({});
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<(TournamentPlayer & { display_name?: string })[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("arena");
  const [newTime, setNewTime] = useState("5+0");
  const [newMax, setNewMax] = useState(64);
  const [loading, setLoading] = useState(true);

  const loadTournaments = async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setTournaments(data);
      // Load player counts
      const counts: Record<string, number> = {};
      const { data: players } = await supabase.from("tournament_players").select("tournament_id");
      if (players) {
        players.forEach(p => { counts[p.tournament_id] = (counts[p.tournament_id] || 0) + 1; });
      }
      setPlayerCounts(counts);
      // Load joined status
      if (user) {
        const { data: myJoins } = await supabase
          .from("tournament_players")
          .select("tournament_id")
          .eq("user_id", user.id);
        if (myJoins) setJoinedIds(new Set(myJoins.map(j => j.tournament_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadTournaments(); }, [user]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("tournaments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, () => loadTournaments())
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_players" }, () => loadTournaments())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const createTournament = async () => {
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from("tournaments").insert({
      creator_id: user.id,
      name: newName.trim(),
      type: newType,
      time_control: newTime,
      max_players: newMax,
    });
    if (error) { toast({ title: "РџРѕРјРёР»РєР°", description: error.message, variant: "destructive" }); return; }
    toast({ title: "РўСѓСЂРЅС–СЂ СЃС‚РІРѕСЂРµРЅРѕ!" });
    setCreateOpen(false);
    setNewName("");
  };

  const joinTournament = async (tId: string) => {
    if (!user) return;
    const { error } = await supabase.from("tournament_players").insert({ tournament_id: tId, user_id: user.id });
    if (error) { toast({ title: "РџРѕРјРёР»РєР°", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Р’Рё РїСЂРёС”РґРЅР°Р»РёСЃСЊ РґРѕ С‚СѓСЂРЅС–СЂСѓ!" });
  };

  const leaveTournament = async (tId: string) => {
    if (!user) return;
    await supabase.from("tournament_players").delete().eq("tournament_id", tId).eq("user_id", user.id);
    toast({ title: "Р’Рё РїРѕРєРёРЅСѓР»Рё С‚СѓСЂРЅС–СЂ" });
  };

  const loadStandings = async (t: Tournament) => {
    setSelectedTournament(t);
    const { data } = await supabase
      .from("tournament_players")
      .select("*")
      .eq("tournament_id", t.id)
      .order("score", { ascending: false });
    if (data) {
      // Fetch display names
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.display_name; });
      setStandings(data.map(d => ({ ...d, display_name: nameMap[d.user_id] || "Р“СЂР°РІРµС†СЊ" })));
    }
  };

  const grouped = {
    active: tournaments.filter(t => t.status === "active"),
    upcoming: tournaments.filter(t => t.status === "upcoming"),
    completed: tournaments.filter(t => t.status === "completed"),
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                <Trophy className="text-accent" /> РўСѓСЂРЅС–СЂРё
              </h1>
              <p className="text-muted-foreground mt-1">Р—РјР°РіР°Р№СЃСЏ Р· РЅР°Р№РєСЂР°С‰РёРјРё С€Р°С…С–СЃС‚Р°РјРё</p>
            </div>
            {user ? (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent text-accent-foreground font-semibold">
                    <Plus size={14} className="mr-2" /> РЎС‚РІРѕСЂРёС‚Рё С‚СѓСЂРЅС–СЂ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>РќРѕРІРёР№ С‚СѓСЂРЅС–СЂ</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>РќР°Р·РІР°</Label>
                      <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="РћРґРµСЃСЊРєРёР№ Р±Р»С–С†" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>РўРёРї</Label>
                        <Select value={newType} onValueChange={setNewType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arena">Arena</SelectItem>
                            <SelectItem value="swiss">Swiss</SelectItem>
                            <SelectItem value="knockout">Knockout</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>РљРѕРЅС‚СЂРѕР»СЊ С‡Р°СЃСѓ</Label>
                        <Select value={newTime} onValueChange={setNewTime}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1+0">1+0 Bullet</SelectItem>
                            <SelectItem value="3+0">3+0 Blitz</SelectItem>
                            <SelectItem value="5+0">5+0 Blitz</SelectItem>
                            <SelectItem value="10+0">10+0 Rapid</SelectItem>
                            <SelectItem value="15+10">15+10 Rapid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>РњР°РєСЃ. РіСЂР°РІС†С–РІ</Label>
                      <Input type="number" value={newMax} onChange={e => setNewMax(Number(e.target.value))} min={4} max={256} />
                    </div>
                    <Button onClick={createTournament} className="w-full bg-accent text-accent-foreground" disabled={!newName.trim()}>
                      РЎС‚РІРѕСЂРёС‚Рё
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Link to="/login">
                <Button variant="outline"><LogIn size={14} className="mr-2" /> РЈРІС–Р№С‚Рё</Button>
              </Link>
            )}
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-8">
            {/* Main */}
            <Tabs defaultValue="upcoming">
              <TabsList className="mb-4">
                <TabsTrigger value="active">рџ”ґ РђРєС‚РёРІРЅС– ({grouped.active.length})</TabsTrigger>
                <TabsTrigger value="upcoming">рџ“… РњР°Р№Р±СѓС‚РЅС– ({grouped.upcoming.length})</TabsTrigger>
                <TabsTrigger value="completed">вњ… Р—Р°РІРµСЂС€РµРЅС– ({grouped.completed.length})</TabsTrigger>
              </TabsList>

              {(["active", "upcoming", "completed"] as const).map(status => (
                <TabsContent key={status} value={status} className="space-y-3">
                  {grouped[status].length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {status === "upcoming" ? "РџРѕРєРё РЅРµРјР°С” С‚СѓСЂРЅС–СЂС–РІ. РЎС‚РІРѕСЂС–С‚СЊ РїРµСЂС€РёР№!" : "РќРµРјР°С” С‚СѓСЂРЅС–СЂС–РІ Сѓ С†С–Р№ РєР°С‚РµРіРѕСЂС–С—"}
                    </div>
                  )}
                  {grouped[status].map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-xl p-5 border border-border hover:border-accent/30 transition-all shadow-sm flex items-center justify-between cursor-pointer group"
                      onClick={() => loadStandings(t)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          {t.status === "active" ? <Zap size={18} className="text-green-400" /> : <Trophy size={18} className="text-accent" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{t.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> {t.time_control}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Users size={10} /> {playerCounts[t.id] || 0}/{t.max_players}</span>
                            <span className="text-xs text-muted-foreground capitalize">{t.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_STYLES[t.status] || ""}`}>
                          {t.status}
                        </span>
                        {user && t.status === "upcoming" && (
                          joinedIds.has(t.id) ? (
                            <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); leaveTournament(t.id); }}>
                              <Check size={12} className="mr-1" /> Р—Р°РїРёСЃР°РЅРёР№
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-accent text-accent-foreground" onClick={e => { e.stopPropagation(); joinTournament(t.id); }}>
                              РџСЂРёС”РґРЅР°С‚РёСЃСЏ
                            </Button>
                          )
                        )}
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            {/* Standings sidebar */}
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm h-fit">
              {selectedTournament ? (
                <>
                  <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                    <Crown size={16} className="text-accent" /> {selectedTournament.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {selectedTournament.type} вЂў {selectedTournament.time_control} вЂў {standings.length} РіСЂР°РІС†С–РІ
                  </p>
                  {standings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Р©Рµ РЅРµРјР°С” СѓС‡Р°СЃРЅРёРєС–РІ</p>
                  ) : (
                    <div className="space-y-2">
                      {standings.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-accent/20 text-accent" :
                            i === 1 ? "bg-secondary text-secondary-foreground" :
                            i === 2 ? "bg-muted text-muted-foreground" :
                            "bg-secondary text-muted-foreground"
                          }`}>
                            {i < 3 ? <Medal size={12} /> : i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{p.display_name}</div>
                            <div className="text-xs text-muted-foreground">{p.games_played} С–РіРѕСЂ</div>
                          </div>
                          <span className="text-sm font-bold text-accent">{Number(p.score).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy size={32} className="mx-auto mb-3 text-accent/30" />
                  <p className="text-sm">РћР±РµСЂС–С‚СЊ С‚СѓСЂРЅС–СЂ РґР»СЏ РїРµСЂРµРіР»СЏРґСѓ С‚Р°Р±Р»РёС†С–</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
