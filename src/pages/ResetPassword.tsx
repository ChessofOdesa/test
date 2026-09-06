import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
function isStrongPassword(password: string) {
    return (password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password));
}
export default function ResetPassword() {
    const navigate = useNavigate();
    const { session, loading: authLoading, updatePassword } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!isStrongPassword(password)) {
            toast.error("Пароль має містити щонайменше 8 символів, велику літеру, цифру й символ.");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Паролі не збігаються.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await updatePassword(password);
            if (error)
                throw error;
            toast.success("Пароль оновлено.");
            navigate("/profile", { replace: true });
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Не вдалося оновити пароль.");
        }
        finally {
            setLoading(false);
        }
    };
    if (authLoading) {
        return (<main className="grid min-h-[calc(100dvh-76px)] place-items-center px-4 text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Завантаження"/>
      </main>);
    }
    if (!session) {
        return (<main className="grid min-h-[calc(100dvh-76px)] place-items-center px-4 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <KeyRound className="mx-auto h-10 w-10 text-primary"/>
          <h1 className="mt-4 text-2xl font-semibold">Посилання вже неактивне</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Запитай нове посилання для відновлення пароля та відкрий його в цьому браузері.
          </p>
          <Button asChild className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary">
            <Link to="/login">До входу</Link>
          </Button>
        </div>
      </main>);
    }
    return (<main className="grid min-h-[calc(100dvh-76px)] place-items-center px-4 text-foreground">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <div className="text-center">
          <KeyRound className="mx-auto h-10 w-10 text-primary"/>
          <h1 className="mt-4 text-2xl font-semibold">Новий пароль</h1>
          <p className="mt-2 text-sm text-muted-foreground">Створи новий надійний пароль для Chess of Odesa.</p>
        </div>

        <div className="mt-6 space-y-4">
          <PasswordInput id="new-password" label="Новий пароль" password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword}/>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              Повтори пароль
            </label>
            <Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-11 border-border bg-secondary text-foreground" required/>
          </div>
        </div>

        <Button disabled={loading} type="submit" className="mt-6 h-12 w-full bg-primary text-primary-foreground hover:bg-primary">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
          Зберегти пароль
        </Button>
      </form>
    </main>);
}
function PasswordInput({ id, label, password, setPassword, showPassword, setShowPassword, }: {
    id: string;
    label: string;
    password: string;
    setPassword: (value: string) => void;
    showPassword: boolean;
    setShowPassword: (value: boolean) => void;
}) {
    return (<div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input id={id} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 border-border bg-secondary pr-12 text-foreground" required/>
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}>
          {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
        </button>
      </div>
    </div>);
}
