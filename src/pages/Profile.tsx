import { LoadingPage, Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GameHistory } from "@/features/profile/GameHistory";
import { usePlayerData } from "@/features/profile/usePlayerData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
export default function Profile() {
    const { user, updateProfile } = useAuth();
    const player = usePlayerData();
    const queryClient = useQueryClient();
    const [name, setName] = useState(""), [bio, setBio] = useState(""), [saving, setSaving] = useState(false);
    useEffect(() => { if (player.data?.profile) {
        setName(player.data.profile.display_name);
        setBio(player.data.profile.bio || "");
    } }, [player.data?.profile]);
    if (player.isPending)
        return <LoadingPage />;
    if (player.isError)
        return <Page title="Мій профіль"><div className="surface p-6" role="alert">Не вдалося завантажити профіль.<Button className="ml-4" onClick={() => void player.refetch()}>Повторити</Button></div></Page>;
    const profile = player.data?.profile;
    if (!profile || !user)
        return <Page title="Мій профіль"><p>Профіль ще не створено. Оновіть сторінку після підтвердження пошти.</p></Page>;
    async function save(event: React.FormEvent) {
        event.preventDefault();
        if (!user || !name.trim())
            return;
        setSaving(true);
        try {
            const { error } = await supabase.from("profiles").update({ display_name: name.trim(), bio: bio.trim() }).eq("user_id", user.id);
            if (error)
                throw error;
            const authResult = await updateProfile({ display_name: name.trim(), bio: bio.trim() });
            if (authResult.error)
                throw authResult.error;
            await queryClient.invalidateQueries({ queryKey: ["player", user.id] });
            toast.success("Профіль збережено");
        }
        catch {
            toast.error("Не вдалося зберегти зміни. Спробуйте ще раз.");
        }
        finally {
            setSaving(false);
        }
    }
    return <Page title={profile.display_name} eyebrow={profile.username ? `@${profile.username}` : "Мій профіль"} action={<UserRound size={36} className="text-primary"/>}>
  <div className="metric-grid mb-7">{[{ label: "Куля", value: profile.rating_bullet }, { label: "Бліц", value: profile.rating_blitz }, { label: "Рапід", value: profile.rating_rapid }].map(item => <div className="surface metric" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
  <div className="flex flex-wrap gap-x-7 gap-y-2 mb-7 text-sm text-muted-foreground"><span>Партій: <b className="text-foreground">{profile.games_played}</b></span><span>Перемог: <b className="text-foreground">{profile.games_won}</b></span><span>Нічиїх: <b className="text-foreground">{profile.games_drawn}</b></span><span>Поразок: <b className="text-foreground">{profile.games_lost}</b></span></div>
  <Tabs defaultValue="games"><TabsList className="mb-4"><TabsTrigger value="games">Історія партій</TabsTrigger><TabsTrigger value="settings">Налаштування</TabsTrigger></TabsList><TabsContent value="games"><section className="surface overflow-hidden"><GameHistory games={player.data?.games ?? []} userId={user.id}/></section><p className="field-note">Останні 30 збережених партій. Рейтинги оновлюються після рейтингових онлайн-партій.</p></TabsContent><TabsContent value="settings"><form onSubmit={save} className="surface p-6 max-w-xl space-y-5"><label className="block text-sm font-medium">Ім’я гравця<Input className="mt-2" value={name} onChange={e => setName(e.target.value)} maxLength={40} required/></label><label className="block text-sm font-medium">Про себе<Textarea className="mt-2" value={bio} onChange={e => setBio(e.target.value)} maxLength={500}/></label><Button disabled={saving}>{saving ? "Збереження…" : "Зберегти зміни"}</Button></form></TabsContent></Tabs>
 </Page>;
}
