import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
export default function Login() {
    const navigate = useNavigate(), location = useLocation();
    const { signIn, signInWithGoogle, signInAsGuest, resetPassword } = useAuth();
    const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [show, setShow] = useState(false), [busy, setBusy] = useState(false);
    async function login(e: React.FormEvent) { e.preventDefault(); setBusy(true); try {
        const { error } = await signIn(email.trim(), password);
        if (error)
            throw error;
        const from = location.state?.from;
        navigate(typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/", { replace: true });
    }
    catch {
        toast.error("Не вдалося увійти. Перевірте пошту та пароль.");
    }
    finally {
        setBusy(false);
    } }
    async function reset() { if (!email.trim()) {
        toast.info("Спочатку введіть електронну пошту.");
        return;
    } setBusy(true); try {
        const { error } = await resetPassword(email.trim());
        if (error)
            throw error;
        toast.success("Перевірте пошту: надіслано посилання для зміни пароля.");
    }
    catch {
        toast.error("Не вдалося надіслати лист.");
    }
    finally {
        setBusy(false);
    } }
    async function google() { setBusy(true); try {
        const { error } = await signInWithGoogle();
        if (error)
            throw error;
    }
    catch {
        toast.error("Вхід через Google зараз недоступний.");
        setBusy(false);
    } }
    return <div className="surface auth-layout"><p className="eyebrow">Chess of Odesa</p><h1>З поверненням.</h1><p className="text-muted-foreground">Увійдіть, щоб грати онлайн і зберігати партії.</p><form onSubmit={login}><label>Електронна пошта<Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></label><label>Пароль<div className="relative"><Input type={show ? "text" : "password"} className="pr-12" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required/><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" aria-label={show ? "Сховати пароль" : "Показати пароль"} onClick={() => setShow(!show)}>{show ? <EyeOff size={18}/> : <Eye size={18}/>}</Button></div></label><Button disabled={busy}>{busy ? "Зачекайте…" : "Увійти"}</Button></form><Button variant="link" className="px-0 mt-2" onClick={() => void reset()} disabled={busy}>Забули пароль?</Button><div className="border-t pt-5 mt-4 grid gap-3"><Button variant="outline" disabled={busy} onClick={() => void google()}>Продовжити з Google</Button><Button variant="ghost" disabled={busy} onClick={async () => { await signInAsGuest("Гість"); navigate("/play"); }}>Грати як гість</Button></div><p className="text-sm mt-6 text-center text-muted-foreground">Ще немає акаунта? <Link to="/register" className="text-primary font-semibold">Зареєструватися</Link></p></div>;
}
