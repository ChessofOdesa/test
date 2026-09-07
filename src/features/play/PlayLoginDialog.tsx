import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
export function PlayLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
 const { signIn } = useAuth(), location = useLocation();
 const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("");
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Увійдіть, щоб грати онлайн</DialogTitle><DialogDescription>Ваші налаштування партії збережено.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { const result = await signIn(email.trim(), password); if (result.error) throw result.error; onOpenChange(false); } catch { setError("Не вдалося увійти. Перевірте пошту й пароль."); } finally { setBusy(false); } }}><label className="text-sm block">Електронна пошта<Input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}/></label><label className="text-sm block">Пароль<Input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={busy}>{busy ? "Вхід…" : "Увійти"}</Button></form><Button variant="outline" asChild><Link to="/register" state={{ from: location.pathname + location.search }}>Створити акаунт</Link></Button><Link className="text-sm text-primary text-center" to="/login" state={{ from: location.pathname + location.search }}>Інші способи входу</Link></DialogContent></Dialog>;
}
