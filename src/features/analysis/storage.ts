import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ReviewReport } from "@/features/game-room/review/model";

export async function recentAnalyses(userId: string) {
  const { data, error } = await supabase.from("analysis_sessions").select("id,title,updated_at,game_id")
    .eq("user_id", userId).order("updated_at", { ascending: false }).limit(5);
  if (error) throw new Error("Не вдалося завантажити збережені аналізи.");
  return data;
}
export async function loadAnalysis(id: string, userId: string) {
  const { data, error } = await supabase.from("analysis_sessions").select("*").eq("id", id).eq("user_id", userId).single();
  if (error) throw new Error("Аналіз недоступний або його не знайдено.");
  return data;
}
export async function saveAnalysis(input: { id?: string; userId: string; gameId: string | null; title: string; pgn: string; report: ReviewReport | null }) {
  const { data, error } = await supabase.from("analysis_sessions").upsert({
    ...(input.id ? { id: input.id } : {}), user_id: input.userId, game_id: input.gameId,
    title: input.title.slice(0, 160), pgn: input.pgn, metadata: { review: input.report } as unknown as Json,
    updated_at: new Date().toISOString(),
  }, { onConflict: input.gameId ? "user_id,game_id" : "id" }).select("id").single();
  if (error) throw new Error("Не вдалося зберегти аналіз в акаунті. Завантажте PGN, щоб зберегти свою роботу.");
  return data.id;
}
export async function loadFinishedGame(id: string) {
  const { data, error } = await supabase.from("games").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Партію не знайдено або вона недоступна.");
  if (!data.result || data.result === "*") throw new Error("Аналіз доступний після завершення партії.");
  return data;
}
export async function recentFinishedGames(userId: string) {
  const { data, error } = await supabase.from("games").select("id,pgn,result,time_control,created_at")
    .or(`white_player_id.eq.${userId},black_player_id.eq.${userId}`).neq("result", "*").not("result", "is", null)
    .order("created_at", { ascending: false }).limit(5);
  if (error) throw new Error("Не вдалося завантажити останні партії.");
  return data;
}
