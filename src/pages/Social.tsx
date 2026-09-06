import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
type Player = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id" | "display_name" | "username" | "rating_blitz">;
export default function Social() {
    const { user } = useAuth();
    const client = useQueryClient();
    const [term, setTerm] = useState(""), [query, setQuery] = useState(""), [busy, setBusy] = useState<string | null>(null);
    const friends = useQuery({ queryKey: ["friends", user?.id], enabled: !!user, queryFn: async () => {
            const { data, error } = await supabase.from("friends").select("*").or(`user_id.eq.${user!.id},friend_id.eq.${user!.id}`);
            if (error)
                throw error;
            const ids = [...new Set((data ?? []).map(f => f.user_id === user!.id ? f.friend_id : f.user_id))];
            if (!ids.length)
                return { rows: [], players: [] as Player[] };
            const people = await supabase.from("profiles").select("user_id,display_name,username,rating_blitz").in("user_id", ids);
            if (people.error)
                throw people.error;
            return { rows: data ?? [], players: people.data ?? [] };
        } });
    const results = useQuery({ queryKey: ["player-search", query, user?.id], enabled: query.length >= 2 && !!user, queryFn: async () => {
            const { data, error } = await supabase.from("profiles").select("user_id,display_name,username,rating_blitz").ilike("display_name", `%${query.replace(/[%_]/g, "")}%`).neq("user_id", user!.id).limit(20);
            if (error)
                throw error;
            return data;
        } });
    async function act(id: string, action: "send" | "accept" | "remove") {
        if (!user || busy)
            return;
        setBusy(id);
        try {
            const response = action === "send" ? await supabase.from("friends").insert({ user_id: user.id, friend_id: id, status: "pending" }) : action === "accept" ? await supabase.from("friends").update({ status: "accepted" }).eq("id", id).eq("friend_id", user.id) : await supabase.from("friends").delete().eq("id", id);
            if (response.error)
                throw response.error;
            await client.invalidateQueries({ queryKey: ["friends", user.id] });
            toast.success(action === "send" ? "Заявку надіслано" : action === "accept" ? "Заявку прийнято" : "Заявку відхилено");
        }
        catch {
            toast.error("Не вдалося виконати дію. Спробуйте ще раз.");
        }
        finally {
            setBusy(null);
        }
    }
    return <Page title="Гравці та друзі"><div className="play-hub-grid"><section className="surface p-6"><form className="flex gap-2" onSubmit={e => { e.preventDefault(); setQuery(term.trim()); }}><Input aria-label="Ім’я гравця" placeholder="Знайти за ім’ям" minLength={2} maxLength={50} value={term} onChange={e => setTerm(e.target.value)}/><Button aria-label="Шукати"><Search size={18}/></Button></form>
 {query.length >= 2 && (results.isFetching ? <p className="empty-state" role="status">Пошук…</p> : results.isError ? <p className="empty-state" role="alert">Не вдалося виконати пошук.</p> : results.data?.length ? results.data.map(person => { const exists = friends.data?.rows.some(f => f.friend_id === person.user_id || f.user_id === person.user_id); return <div className="flex justify-between items-center gap-3 py-4 border-b" key={person.user_id}><div><strong>{person.display_name}</strong><p className="text-sm text-muted-foreground">Бліц · {person.rating_blitz}</p></div><Button variant="outline" disabled={!!exists || !!busy || !friends.isSuccess} onClick={() => void act(person.user_id, "send")}><UserPlus size={16}/>{exists ? "У списку" : "Додати"}</Button></div>; }) : <p className="empty-state">Гравців не знайдено.</p>)}
 </section><section className="surface p-6"><h2 className="text-xl font-semibold mb-4">Мої контакти</h2>{friends.isPending ? <p role="status">Завантаження…</p> : friends.isError ? <div role="alert">Не вдалося завантажити контакти.<Button variant="link" onClick={() => void friends.refetch()}>Повторити</Button></div> : !friends.data?.rows.length ? <p className="text-muted-foreground">Додайте гравця через пошук.</p> : friends.data.rows.map(row => { const other = row.user_id === user?.id ? row.friend_id : row.user_id; const person = friends.data.players.find(p => p.user_id === other); const incoming = row.status === "pending" && row.friend_id === user?.id; return <div key={row.id} className="border-t py-4"><strong>{person?.display_name || "Гравець"}</strong><p className="field-note">{row.status === "accepted" ? "У друзях" : incoming ? "Вхідна заявка" : "Заявку надіслано"}</p>{incoming && <div className="mt-3 flex gap-2"><Button disabled={!!busy} size="sm" onClick={() => void act(row.id, "accept")}>Прийняти</Button><Button disabled={!!busy} variant="outline" size="sm" onClick={() => void act(row.id, "remove")}>Відхилити</Button></div>}</div>; })}</section></div></Page>;
}
