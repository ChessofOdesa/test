import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, Users, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ChessBoard from "@/components/ChessBoard";
import EvalBar from "@/components/EvalBar";
import MoveList from "@/components/MoveList";
import { Chess } from "chess.js";

interface GameData {
  id: string;
  fen: string;
  pgn: string;
  status: string;
  result: string | null;
  white_player_id: string | null;
  black_player_id: string | null;
  time_control: string;
  white_time_ms: number;
  black_time_ms: number;
}

export default function SpectateGame() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameData | null>(null);
  const [chess] = useState(new Chess());
  const [position, setPosition] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [whiteName, setWhiteName] = useState("Білі");
  const [blackName, setBlackName] = useState("Чорні");
  const [loading, setLoading] = useState(true);

  const loadGame = async () => {
    if (!gameId) return;
    const { data } = await supabase.from("online_games").select("*").eq("id", gameId).single();
    if (data) {
      setGame(data);
      chess.loadPgn(data.pgn || "");
      setPosition(chess.fen());
      setMoveHistory(chess.history());

      // Load player names
      const ids = [data.white_player_id, data.black_player_id].filter(Boolean);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
        profiles?.forEach(p => {
          if (p.user_id === data.white_player_id) setWhiteName(p.display_name || "Білі");
          if (p.user_id === data.black_player_id) setBlackName(p.display_name || "Чорні");
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadGame(); }, [gameId]);

  // Realtime updates
  useEffect(() => {
    if (!gameId) return;
    const ch = supabase
      .channel(`spectate-${gameId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "online_games", filter: `id=eq.${gameId}` }, (payload) => {
        const data = payload.new as GameData;
        setGame(data);
        chess.loadPgn(data.pgn || "");
        setPosition(chess.fen());
        setMoveHistory(chess.history());
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Eye size={32} className="mx-auto mb-3 animate-pulse" />
          <p>Завантаження гри...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Гру не знайдено</p>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen py-6">
      <div className="container max-w-5xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Eye className="text-accent" size={22} />
            <h1 className="text-xl font-bold text-foreground">Спостереження</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              game.status === "active" ? "bg-green-500/15 text-green-400" :
              game.status === "completed" ? "bg-muted text-muted-foreground" :
              "bg-accent/15 text-accent"
            }`}>
              {game.status === "active" ? "● Live" : game.status}
            </span>
            {game.result && <span className="text-sm font-bold text-foreground ml-2">{game.result}</span>}
          </div>

          <div className="grid lg:grid-cols-[auto_300px] gap-6">
            {/* Board */}
            <div>
              {/* Black info */}
              <div className="flex items-center justify-between mb-2 p-2 bg-card rounded-lg border border-border">
                <span className="text-sm font-semibold text-foreground">{blackName}</span>
                <span className="text-sm font-mono text-muted-foreground">{formatTime(game.black_time_ms)}</span>
              </div>

              <div className="flex gap-2">
                <EvalBar score={0} />
                <ChessBoard
                  initialFen={position}
                  interactive={false}
                />
              </div>

              {/* White info */}
              <div className="flex items-center justify-between mt-2 p-2 bg-card rounded-lg border border-border">
                <span className="text-sm font-semibold text-foreground">{whiteName}</span>
                <span className="text-sm font-mono text-muted-foreground">{formatTime(game.white_time_ms)}</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Ходи</h3>
                <MoveList moves={moveHistory} currentMoveIndex={moveHistory.length - 1} onMoveClick={() => {}} />
              </div>

              <div className="bg-card rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
                <MessageSquare size={16} className="mx-auto mb-2" />
                <p>Контроль часу: {game.time_control}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
