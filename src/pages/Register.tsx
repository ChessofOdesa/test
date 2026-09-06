import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, type CountryOption } from "@/lib/countries";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
function GoogleMark() {
    return (<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-.97 2.33-2.06 3.05l3.32 2.58C20.7 18 21.5 15.3 21.5 12c0-.68-.06-1.33-.17-1.95H12Z"/>
      <path fill="#34A853" d="M12 21.5c2.7 0 4.96-.9 6.61-2.44l-3.32-2.58c-.92.62-2.1.99-3.29.99-2.53 0-4.68-1.71-5.45-4.01l-3.43 2.64C4.76 19.36 8.12 21.5 12 21.5Z"/>
      <path fill="#4A90E2" d="M6.55 13.46A5.93 5.93 0 0 1 6.24 12c0-.51.09-1 .24-1.46L3.05 7.9A9.54 9.54 0 0 0 2 12c0 1.54.37 2.99 1.05 4.1l3.5-2.64Z"/>
      <path fill="#FBBC05" d="M12 6.53c1.47 0 2.78.5 3.81 1.47l2.86-2.86C16.95 3.52 14.7 2.5 12 2.5 8.12 2.5 4.76 4.64 3.05 7.9l3.43 2.64C7.32 8.24 9.47 6.53 12 6.53Z"/>
    </svg>);
}
type PasswordStrength = "Weak" | "Medium" | "Strong";
function slugifyUsername(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 24);
}
function getPasswordStrength(password: string): PasswordStrength {
    let score = 0;
    if (password.length >= 8)
        score += 1;
    if (/[A-Z]/.test(password))
        score += 1;
    if (/\d/.test(password))
        score += 1;
    if (/[^A-Za-z0-9]/.test(password))
        score += 1;
    if (score >= 4)
        return "Strong";
    if (score >= 2)
        return "Medium";
    return "Weak";
}
function validatePassword(password: string) {
    return (password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password));
}
function isOlderThan13(dateOfBirth: string) {
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) {
        return false;
    }
    const today = new Date();
    const threshold = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
    return birthDate <= threshold;
}
async function uploadAvatarIfPossible(userId: string, file: File) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
    });
    if (error) {
        throw error;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
}
export default function Register() {
    const navigate = useNavigate();
    const { signInWithGoogle, signUp, updatePrivateProfile, updateProfile } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [country, setCountry] = useState<CountryOption | null>(COUNTRIES[0]);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [sendUpdates, setSendUpdates] = useState(false);
    const [countryOpen, setCountryOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const honeypotRef = useRef("");
    const lastSubmitRef = useRef(0);
    useEffect(() => {
        if (!avatarFile) {
            setAvatarPreview(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);
    const normalizedUsername = useMemo(() => slugifyUsername(username), [username]);
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    const handleGoogle = async () => {
        setLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) {
                throw error;
            }
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Не вдалося зареєструватися через Google.");
            setLoading(false);
        }
    };
    const validateForm = async () => {
        const nextErrors: Record<string, string> = {};
        const trimmedUsername = normalizedUsername;
        const trimmedEmail = email.trim();
        if (!trimmedUsername) {
            nextErrors.username = "Вкажіть ім’я користувача.";
        }
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            nextErrors.email = "Вкажіть правильну електронну пошту.";
        }
        if (!validatePassword(password)) {
            nextErrors.password = "Використайте від 8 символів, велику літеру, цифру та спеціальний символ.";
        }
        if (confirmPassword !== password) {
            nextErrors.confirmPassword = "Паролі не збігаються.";
        }
        if (!country) {
            nextErrors.country = "Оберіть країну.";
        }
        if (!dateOfBirth || !isOlderThan13(dateOfBirth)) {
            nextErrors.dateOfBirth = "Для реєстрації потрібно мати щонайменше 13 років.";
        }
        if (!termsAccepted) {
            nextErrors.terms = "Підтвердьте згоду з правилами гри.";
        }
        if (!privacyAccepted) {
            nextErrors.privacy = "Підтвердьте згоду на збереження даних.";
        }
        if (avatarFile && avatarFile.size > 2 * 1024 * 1024) {
            nextErrors.avatar = "Аватар має бути меншим за 2 МБ.";
        }
        if (avatarFile && !avatarFile.type.startsWith("image/")) {
            nextErrors.avatar = "Оберіть файл зображення.";
        }
        if (Object.keys(nextErrors).length === 0 && trimmedUsername) {
            const { data, error } = await supabase
                .from("profiles")
                .select("id")
                .ilike("username", trimmedUsername)
                .limit(1);
            if (error) {
                nextErrors.username = "Не вдалося перевірити ім’я. Спробуйте пізніше.";
            }
            else if ((data ?? []).length > 0) {
                nextErrors.username = "Це ім’я вже зайняте.";
            }
        }
        setErrors(nextErrors);
        return { valid: Object.keys(nextErrors).length === 0, trimmedUsername, trimmedEmail };
    };
    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        if (honeypotRef.current) {
            return;
        }
        const now = Date.now();
        if (now - lastSubmitRef.current < 3000) {
            toast.error("Зачекайте кілька секунд перед повторною спробою.");
            return;
        }
        lastSubmitRef.current = now;
        setLoading(true);
        try {
            const { valid, trimmedUsername, trimmedEmail } = await validateForm();
            if (!valid || !country) {
                setLoading(false);
                return;
            }
            const { data, error } = await signUp({
                email: trimmedEmail,
                password,
                displayName: trimmedUsername,
                username: trimmedUsername,
                country: country.name,
                dateOfBirth,
                termsAccepted,
                privacyAccepted,
                marketingOptIn: sendUpdates,
                avatarUrl: null,
            });
            if (error) {
                throw error;
            }
            if (avatarFile && data.user && data.session) {
                const avatarUrl = await uploadAvatarIfPossible(data.user.id, avatarFile);
                await Promise.all([
                    updateProfile({
                        avatar_url: avatarUrl,
                        display_name: trimmedUsername,
                        username: trimmedUsername,
                    }),
                    updatePrivateProfile({ country: country.name, date_of_birth: dateOfBirth, marketing_opt_in: sendUpdates }),
                    supabase
                        .from("profiles")
                        .update({
                        avatar_url: avatarUrl,
                        display_name: trimmedUsername,
                        username: trimmedUsername,
                    })
                        .eq("user_id", data.user.id),
                ]);
            }
            toast.success("Акаунт створено. Перевірте пошту для підтвердження.");
            navigate(data.session ? "/profile" : "/login");
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : "Не вдалося створити акаунт.");
        }
        finally {
            setLoading(false);
        }
    };
    return <div className="surface auth-layout"><p className="eyebrow">Chess of Odesa</p><h1>Створіть акаунт</h1><p className="text-muted-foreground">Ваші партії та рейтинг в одному місці.</p>
    <Button type="button" variant="outline" className="w-full mt-5" onClick={handleGoogle} disabled={loading}><GoogleMark />Продовжити з Google</Button>
    <form onSubmit={handleRegister}>
      <input type="text" aria-hidden="true" tabIndex={-1} autoComplete="off" className="hidden" onChange={e => { honeypotRef.current = e.target.value; }}/>
      <Field label="Ім’я користувача" error={errors.username}><Input value={username} maxLength={24} autoComplete="username" onChange={e => setUsername(e.target.value)} required/><span className="text-xs text-muted-foreground">Латинські літери, цифри та підкреслення.</span></Field>
      <Field label="Електронна пошта" error={errors.email}><Input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/></Field>
      <Field label="Пароль" error={errors.password}><div className="relative"><Input type={showPassword ? "text" : "password"} value={password} autoComplete="new-password" onChange={e => setPassword(e.target.value)} required className="pr-12"/><Button type="button" variant="ghost" size="icon" aria-label="Показати або сховати пароль" className="absolute top-0 right-0" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div><span className="text-xs text-muted-foreground">Від 8 символів, велика літера, цифра та спеціальний символ.</span></Field>
      <Field label="Повторіть пароль" error={errors.confirmPassword}><Input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/></Field>
      <div className="grid sm:grid-cols-2 gap-4"><Field label="Країна" error={errors.country}><select className="h-11 rounded-md border border-input bg-background px-3 w-full" value={country?.code || ""} onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) || null)}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field><Field label="Дата народження" error={errors.dateOfBirth}><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required/></Field></div>
      <Field label="Аватар (необов’язково)" error={errors.avatar}><Input type="file" accept="image/png,image/jpeg" onChange={e => setAvatarFile(e.target.files?.[0] ?? null)}/><span className="text-xs text-muted-foreground">PNG або JPG, до 2 МБ.</span></Field>
      <div className="space-y-3 border-t pt-4"><AgreementRow checked={termsAccepted} onCheckedChange={setTermsAccepted} label="Погоджуюся грати чесно та спілкуватися з повагою"/>{errors.terms && <p role="alert" className="text-sm text-destructive">{errors.terms}</p>}
      <AgreementRow checked={privacyAccepted} onCheckedChange={setPrivacyAccepted} label="Погоджуюся на збереження даних акаунта та партій"/><p className="text-xs text-muted-foreground">Ім’я, аватар і рейтинг доступні іншим гравцям. Пошта використовується для входу та відновлення доступу.</p>{errors.privacy && <p role="alert" className="text-sm text-destructive">{errors.privacy}</p>}
      <AgreementRow checked={sendUpdates} onCheckedChange={setSendUpdates} label="Хочу отримувати новини"/></div>
      <Button type="submit" disabled={loading}>{loading ? "Створення акаунта…" : "Зареєструватися"}</Button>
    </form><p className="text-sm text-center mt-5">Уже маєте акаунт? <Link to="/login" className="text-primary font-semibold">Увійти</Link></p>
  </div>;
}
function Field({ label, error, children, }: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (<label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </label>);
}
function AgreementRow({ checked, onCheckedChange, label, }: {
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    label: string;
}) {
    return (<label className="flex items-start gap-3 text-sm text-foreground">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"/>
      <span>{label}</span>
    </label>);
}
