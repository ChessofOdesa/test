import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
export type SavedGame = Database["public"]["Tables"]["games"]["Row"];
export function usePlayerData() {
    const { user, isGuest } = useAuth();
    return useQuery({ queryKey: ["player", user?.id], enabled: !!user && !isGuest, queryFn: async () => {
            if (!user)
                throw new Error("Увійдіть в акаунт");
            const [profile, games] = await Promise.all([
                supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
                supabase.from("games").select("*").or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(30),
            ]);
            if (profile.error)
                throw profile.error;
            if (games.error)
                throw games.error;
            return { profile: profile.data, games: games.data ?? [] };
        } });
}
export function gameResult(game: SavedGame, userId: string) {
    if (!game.result || game.result === "*")
        return "Не завершена";
    if (game.result === "1/2-1/2")
        return "Нічия";
    const white = game.white_player_id === userId;
    return game.result === (white ? "1-0" : "0-1") ? "Перемога" : "Поразка";
}
