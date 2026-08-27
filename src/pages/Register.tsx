import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, Loader2, ShieldCheck, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { COUNTRIES, type CountryOption } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.26-.97 2.33-2.06 3.05l3.32 2.58C20.7 18 21.5 15.3 21.5 12c0-.68-.06-1.33-.17-1.95H12Z"
      />
      <path
        fill="#34A853"
        d="M12 21.5c2.7 0 4.96-.9 6.61-2.44l-3.32-2.58c-.92.62-2.1.99-3.29.99-2.53 0-4.68-1.71-5.45-4.01l-3.43 2.64C4.76 19.36 8.12 21.5 12 21.5Z"
      />
      <path
        fill="#4A90E2"
        d="M6.55 13.46A5.93 5.93 0 0 1 6.24 12c0-.51.09-1 .24-1.46L3.05 7.9A9.54 9.54 0 0 0 2 12c0 1.54.37 2.99 1.05 4.1l3.5-2.64Z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.53c1.47 0 2.78.5 3.81 1.47l2.86-2.86C16.95 3.52 14.7 2.5 12 2.5 8.12 2.5 4.76 4.64 3.05 7.9l3.43 2.64C7.32 8.24 9.47 6.53 12 6.53Z"
      />
    </svg>
  );
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
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 4) return "Strong";
  if (score >= 2) return "Medium";
  return "Weak";
}

function validatePassword(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
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
  const [sendUpdates, setSendUpdates] = useState(true);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-up failed.");
      setLoading(false);
    }
  };

  const validateForm = async () => {
    const nextErrors: Record<string, string> = {};
    const trimmedUsername = normalizedUsername;
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      nextErrors.username = "Choose a username.";
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!validatePassword(password)) {
      nextErrors.password = "Use at least 8 characters, 1 uppercase letter, 1 digit, and 1 special symbol.";
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!country) {
      nextErrors.country = "Choose your country.";
    }

    if (!dateOfBirth || !isOlderThan13(dateOfBirth)) {
      nextErrors.dateOfBirth = "You must be at least 13 years old.";
    }

    if (!termsAccepted) {
      nextErrors.terms = "You need to accept the Terms of Service.";
    }

    if (!privacyAccepted) {
      nextErrors.privacy = "You need to accept the Privacy Policy.";
    }

    if (avatarFile && avatarFile.size > 2 * 1024 * 1024) {
      nextErrors.avatar = "Avatar must be smaller than 2 MB.";
    }

    if (avatarFile && !avatarFile.type.startsWith("image/")) {
      nextErrors.avatar = "Avatar must be an image.";
    }

    if (Object.keys(nextErrors).length === 0 && trimmedUsername) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", trimmedUsername)
        .limit(1);

      if (error) {
        nextErrors.username = "Could not verify username right now.";
      } else if ((data ?? []).length > 0) {
        nextErrors.username = "Username already taken.";
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
      toast.error("Please wait a moment before trying again.");
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

      toast.success("Account created successfully.");
      navigate(data.session ? "/profile" : "/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111318] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/brand-knight.png"
              alt="ChessMasterUA"
              className="h-10 w-10 rounded-xl border border-white/10 bg-black/20 object-contain p-1.5"
            />
            <span className="text-lg font-extrabold tracking-tight">
              Chess<span className="text-[#82b64d]">Master</span>UA
            </span>
          </Link>

          <Link to="/login">
            <Button variant="outline" className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Log In
            </Button>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[480px] rounded-[28px] border border-white/10 bg-[#1a1d22] p-6 shadow-2xl shadow-black/25 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7fa650]/25 bg-[#7fa650]/12 text-[#dff3c6]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-[30px] font-semibold tracking-tight text-white">Create your account</h1>
              <p className="mt-2 text-sm text-[#9aa3af]">Join and create your personal profile.</p>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                disabled={loading}
                className="h-11 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleMark />}
                <span className="ml-2">Continue with Google</span>
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.24em] text-[#7d8591]">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                value={honeypotRef.current}
                onChange={(event) => {
                  honeypotRef.current = event.target.value;
                }}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Username" error={errors.username}>
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Choose a username"
                    autoComplete="username"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                  />
                  {normalizedUsername && (
                    <p className="mt-2 text-xs text-[#7d8591]">Will be saved as @{normalizedUsername}</p>
                  )}
                </Field>

                <Field label="Email" error={errors.email}>
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="Enter your email address"
                    autoComplete="email"
                    className="h-11 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" error={errors.password}>
                  <div className="relative">
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      autoComplete="new-password"
                      className="h-11 border-white/10 bg-white/5 pr-12 text-white placeholder:text-[#7d8591]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f98a3] transition hover:text-white"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[#7d8591]">Password strength</span>
                    <span
                      className={cn(
                        "font-semibold",
                        passwordStrength === "Strong"
                          ? "text-emerald-300"
                          : passwordStrength === "Medium"
                            ? "text-amber-300"
                            : "text-rose-300",
                      )}
                    >
                      {passwordStrength}
                    </span>
                  </div>
                </Field>

                <Field label="Confirm password" error={errors.confirmPassword}>
                  <div className="relative">
                    <Input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="h-11 border-white/10 bg-white/5 pr-12 text-white placeholder:text-[#7d8591]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8f98a3] transition hover:text-white"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country" error={errors.country}>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex h-11 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                      >
                        <span className="truncate">
                          {country ? `${country.flag} ${country.name}` : "Choose your country"}
                        </span>
                        <ChevronDown className="h-4 w-4 text-[#8f98a3]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] border-white/10 bg-[#1a1d22] p-0 text-white" align="start">
                      <Command className="bg-[#1a1d22] text-white">
                        <CommandInput placeholder="Search country..." className="border-white/10 text-white placeholder:text-[#7d8591]" />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES.map((option) => (
                              <CommandItem
                                key={option.code}
                                value={`${option.name} ${option.code}`}
                                onSelect={() => {
                                  setCountry(option);
                                  setCountryOpen(false);
                                }}
                                className="gap-2 text-white data-[selected=true]:bg-white/10 data-[selected=true]:text-white"
                              >
                                <span>{option.flag}</span>
                                <span className="flex-1">{option.name}</span>
                                {country?.code === option.code ? <Check className="h-4 w-4 text-[#9fd76d]" /> : null}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </Field>

                <Field label="Date of birth" error={errors.dateOfBirth}>
                  <Input
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    type="date"
                    className="h-11 border-white/10 bg-white/5 text-white"
                  />
                </Field>
              </div>

              <Field label="Avatar (optional)" error={errors.avatar}>
                <div className="flex items-center gap-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-black/20">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-semibold text-white">
                        {(normalizedUsername || "P").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                      <Upload className="h-4 w-4" />
                      Upload avatar
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <p className="mt-2 text-xs text-[#7d8591]">PNG or JPG, up to 2 MB.</p>
                  </div>
                </div>
              </Field>

              <div className="space-y-3 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <AgreementRow
                  checked={termsAccepted}
                  onCheckedChange={(value) => setTermsAccepted(Boolean(value))}
                  label="I agree to the Terms of Service"
                />
                {errors.terms ? <p className="text-xs text-rose-300">{errors.terms}</p> : null}

                <AgreementRow
                  checked={privacyAccepted}
                  onCheckedChange={(value) => setPrivacyAccepted(Boolean(value))}
                  label="I agree to the Privacy Policy"
                />
                {errors.privacy ? <p className="text-xs text-rose-300">{errors.privacy}</p> : null}

                <AgreementRow
                  checked={sendUpdates}
                  onCheckedChange={(value) => setSendUpdates(Boolean(value))}
                  label="Send me updates and news"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#7fa650] text-base font-semibold text-white hover:bg-[#90b862]"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[#9aa3af]">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-[#9fd76d] hover:text-white">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#dce3ea]">{label}</span>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </label>
  );
}

function AgreementRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-[#d0d6de]">
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5 border-white/15 data-[state=checked]:bg-[#7fa650] data-[state=checked]:text-white" />
      <span>{label}</span>
    </label>
  );
}
