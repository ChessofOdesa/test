import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LogIn, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInAsGuest, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showGuestMode, setShowGuestMode] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        throw error;
      }

      toast.success("Welcome back.");
      navigate("/profile");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not sign in.";
      toast.error(message.includes("Invalid login credentials") ? "Invalid email or password." : message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        throw error;
      }
      toast.success("Password reset email sent.");
      setShowForgotPassword(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    if (!guestName.trim()) {
      toast.error("Enter a guest name.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInAsGuest(guestName.trim());
      if (error) {
        throw error;
      }
      toast.success(`Welcome, ${guestName.trim()}.`);
      navigate("/play");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start guest mode.");
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

          <Link to="/register">
            <Button variant="outline" className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Sign Up
            </Button>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[460px] rounded-[28px] border border-white/10 bg-[#1a1d22] p-6 shadow-2xl shadow-black/25 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7fa650]/25 bg-[#7fa650]/12 text-[#dff3c6]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-[30px] font-semibold tracking-tight text-white">Log in</h1>
              <p className="mt-2 text-sm text-[#9aa3af]">Access your profile, games, and analysis workspace.</p>
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

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-[#dce3ea]">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8591]" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-[#7d8591]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-[#dce3ea]">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 border-white/10 bg-white/5 pr-12 text-white placeholder:text-[#7d8591]"
                    required
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
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#7fa650] text-base font-semibold text-white hover:bg-[#90b862]"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Log In
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword((value) => !value)}
                className="text-[#9fd76d] transition hover:text-white"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setShowGuestMode((value) => !value)}
                className="text-[#aab3be] transition hover:text-white"
              >
                Continue as guest
              </button>
            </div>

            {showForgotPassword && (
              <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-[#cfd6dd]">Send a reset link to the email above.</p>
                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  variant="outline"
                  className="mt-3 h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send reset email
                </Button>
              </div>
            )}

            {showGuestMode && (
              <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                <label htmlFor="guest-name" className="text-sm font-medium text-[#dce3ea]">
                  Guest name
                </label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  placeholder="Choose a guest name"
                  className="mt-2 h-11 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                />
                <Button
                  type="button"
                  onClick={handleGuest}
                  disabled={loading}
                  variant="outline"
                  className="mt-3 h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start as guest
                </Button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-[#9aa3af]">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-[#9fd76d] hover:text-white">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
