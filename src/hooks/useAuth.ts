import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SignUpPayload = {
  email: string;
  password: string;
  displayName: string;
  username: string;
  country: string;
  dateOfBirth: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingOptIn: boolean;
  avatarUrl?: string | null;
};

export type ProfileUpdatePayload = {
  display_name?: string;
  avatar_url?: string | null;
  username?: string;
  bio?: string;
};

export type PrivateProfileUpdatePayload = {
  country?: string | null;
  date_of_birth?: string | null;
  marketing_opt_in?: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  signUp: (payload: SignUpPayload) => ReturnType<typeof supabase.auth.signUp>;
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signInWithGoogle: () => ReturnType<typeof supabase.auth.signInWithOAuth>;
  signInAsGuest: (displayName: string) => Promise<{ data: { user: User }; error: null }>;
  signOut: () => ReturnType<typeof supabase.auth.signOut>;
  resetPassword: (email: string) => ReturnType<typeof supabase.auth.resetPasswordForEmail>;
  updatePassword: (password: string) => ReturnType<typeof supabase.auth.updateUser>;
  updateProfile: (updates: ProfileUpdatePayload) => ReturnType<typeof supabase.auth.updateUser>;
  updatePrivateProfile: (
    updates: PrivateProfileUpdatePayload,
  ) => Promise<{ data: unknown; error: Error | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const GUEST_STORAGE_KEY = "chess_of_odesa_guest";

function readStoredGuest(): User | null {
  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [guestUser, setGuestUser] = useState<User | null>(() => readStoredGuest());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        setGuestUser(null);
      }
      setLoading(false);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        setGuestUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? guestUser;
    const isGuest = !session && Boolean(guestUser?.user_metadata?.is_guest);

    const signInAsGuest = async (displayName: string) => {
      const safeName = displayName.trim().slice(0, 30) || "Гість";
      const nextGuest = {
        id: `guest-${crypto.randomUUID()}`,
        email: null,
        user_metadata: { display_name: safeName, is_guest: true },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as unknown as User;

      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextGuest));
      setGuestUser(nextGuest);
      return { data: { user: nextGuest }, error: null };
    };

    const signUp = (payload: SignUpPayload) =>
      supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          data: {
            display_name: payload.displayName,
            username: payload.username,
            profile_country: payload.country,
            profile_date_of_birth: payload.dateOfBirth,
            terms_accepted: payload.termsAccepted,
            privacy_accepted: payload.privacyAccepted,
            marketing_opt_in: payload.marketingOptIn,
            avatar_url: payload.avatarUrl || null,
          },
          // Redirect to the origin root so email confirmation also works on
          // static hosts before their SPA fallback routing is configured.
          emailRedirectTo: window.location.origin,
        },
      });

    const signIn = (email: string, password: string) =>
      supabase.auth.signInWithPassword({ email, password });

    const signInWithGoogle = () =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/profile` },
      });

    const signOut = () => {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setGuestUser(null);
      setSession(null);
      return supabase.auth.signOut();
    };

    const resetPassword = (email: string) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

    const updatePassword = (password: string) => supabase.auth.updateUser({ password });

    const updateProfile = (updates: ProfileUpdatePayload) =>
      supabase.auth.updateUser({ data: updates });

    const updatePrivateProfile = async (updates: PrivateProfileUpdatePayload) => {
      if (!session?.user) {
        return { data: null, error: new Error("Потрібно увійти у свій акаунт.") };
      }

      const { data, error } = await supabase
        .from("private_profile_data")
        .upsert({ user_id: session.user.id, ...updates }, { onConflict: "user_id" });

      return { data, error: error ? new Error(error.message) : null };
    };

    return {
      user,
      session,
      loading,
      isGuest,
      isAuthenticated: Boolean(session?.access_token),
      signUp,
      signIn,
      signInWithGoogle,
      signInAsGuest,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      updatePrivateProfile,
    };
  }, [guestUser, loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
