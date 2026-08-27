import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  BrainCircuit,
  Calendar,
  ChevronRight,
  Clock3,
  Copy,
  Crown,
  Flag,
  Flame,
  Globe,
  Heart,
  Lock,
  MoreHorizontal,
  NotebookTabs,
  Palette,
  Pencil,
  Puzzle,
  Search,
  Share2,
  Sparkles,
  Swords,
  Trophy,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getCountryFlag } from "@/lib/countries";
import {
  buildGrowthSummary,
  readGrowthState,
  updateCoachProfile,
  type CoachExplanationStyle,
  type CoachHelpLevel,
  type TrainingPlanCategory,
} from "@/lib/growth-system";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PrivateProfileRow = Database["public"]["Tables"]["private_profile_data"]["Row"];
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity_feed"]["Row"];
type ProfileTab =
  | "overview"
  | "games"
  | "puzzles"
  | "lessons"
  | "achievements"
  | "favorites"
  | "settings";
type RatingMode = "rapid" | "blitz" | "bullet";
type GameFilter = "all" | "win" | "loss" | "draw";

type FriendStats = {
  friends: number;
  followers: number;
  following: number;
};

type FavoriteGroup = {
  title: string;
  items: string[];
};

const PROFILE_TABS: Array<{ value: ProfileTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "games", label: "Games" },
  { value: "puzzles", label: "Puzzles" },
  { value: "lessons", label: "Lessons" },
  { value: "achievements", label: "Achievements" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function inferMode(timeControl: string | null): RatingMode | null {
  if (!timeControl) {
    return null;
  }

  const baseMinutes = Number.parseInt(timeControl.split("+")[0] || "0", 10);
  if (!Number.isFinite(baseMinutes)) {
    return null;
  }

  if (baseMinutes <= 2) {
    return "bullet";
  }
  if (baseMinutes <= 8) {
    return "blitz";
  }
  return "rapid";
}

function getOpeningHeader(pgn: string) {
  return pgn.match(/\[Opening "([^"]+)"\]/)?.[1] ?? "Unknown opening";
}

function getProfileResult(game: GameRow, viewerId: string) {
  if (game.result === "1/2-1/2") {
    return "Draw";
  }

  const viewerIsWhite = game.white_player_id === viewerId;
  const viewerIsBlack = game.black_player_id === viewerId;
  const viewerWon =
    (viewerIsWhite && game.result === "1-0") || (viewerIsBlack && game.result === "0-1");

  return viewerWon ? "Win" : "Loss";
}

function getOpponentLabel(game: GameRow, viewerId: string) {
  if (game.is_ai_game) {
    return `Bot Level ${game.ai_level ?? 1}`;
  }

  if (game.white_player_id === viewerId) {
    return game.black_player_id ? "Online opponent" : "Guest opponent";
  }

  return game.white_player_id ? "Online opponent" : "Guest opponent";
}

function deriveTitle(rating: number) {
  if (rating >= 2200) return "Master";
  if (rating >= 2000) return "Expert";
  if (rating >= 1800) return "Candidate Master";
  if (rating >= 1600) return "Advanced Club Player";
  if (rating >= 1300) return "Improver";
  return "Developing Player";
}

function derivePlayingStyle(rapid: number, blitz: number, wins: number, losses: number) {
  if (blitz - rapid > 70) return "Tactical speed specialist";
  if (rapid - blitz > 70) return "Structured rapid technician";
  if (wins > losses) return "Practical attacking player";
  return "Balanced improving player";
}

function formatMetric(value: number | null | undefined) {
  return value == null ? "—" : value.toString();
}

function buildRatingHistory(games: GameRow[], viewerId: string, mode: RatingMode) {
  return games
    .filter((game) => inferMode(game.time_control) === mode)
    .map((game) => {
      const rating =
        game.white_player_id === viewerId
          ? game.white_rating
          : game.black_player_id === viewerId
            ? game.black_rating
            : null;

      return rating
        ? {
            label: new Date(game.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
            rating,
          }
        : null;
    })
    .filter((item): item is { label: string; rating: number } => item != null)
    .reverse();
}

function buildHeatmap(games: GameRow[], activities: ActivityRow[]) {
  const dayMap = new Map<string, number>();
  const now = new Date();

  [...games.map((game) => game.created_at), ...activities.map((item) => item.created_at)].forEach((value) => {
    const key = new Date(value).toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (41 - index));
    const key = day.toISOString().slice(0, 10);
    return {
      id: key,
      value: dayMap.get(key) ?? 0,
      label: `${key}: ${dayMap.get(key) ?? 0} activities`,
    };
  });
}

function deriveFavorites(games: GameRow[], viewerId: string): FavoriteGroup[] {
  const openingCounts = new Map<string, number>();
  const opponents = new Map<string, number>();
  const controls = new Map<string, number>();
  const bots = new Map<string, number>();

  games.forEach((game) => {
    const opening = getOpeningHeader(game.pgn);
    openingCounts.set(opening, (openingCounts.get(opening) ?? 0) + 1);

    const opponent = getOpponentLabel(game, viewerId);
    opponents.set(opponent, (opponents.get(opponent) ?? 0) + 1);

    if (game.time_control) {
      controls.set(game.time_control, (controls.get(game.time_control) ?? 0) + 1);
    }

    if (game.is_ai_game) {
      const label = `Bot Level ${game.ai_level ?? 1}`;
      bots.set(label, (bots.get(label) ?? 0) + 1);
    }
  });

  const top = (map: Map<string, number>) =>
    [...map.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label]) => label);

  return [
    { title: "Favorite openings", items: top(openingCounts) },
    { title: "Favorite time controls", items: top(controls) },
    { title: "Frequent opponents", items: top(opponents) },
    { title: "Favorite bots", items: top(bots) },
  ].filter((group) => group.items.length > 0);
}

function deriveActivityFeed(games: GameRow[], viewerId: string): ActivityRow[] {
  return games.slice(0, 6).map((game) => ({
    id: game.id,
    created_at: game.created_at,
    data: null,
    type: game.is_ai_game ? "bot_game" : "game",
    user_id: viewerId,
    message: `${getProfileResult(game, viewerId)} in ${getOpeningHeader(game.pgn)} (${game.time_control || "10+0"})`,
  }));
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.035] px-5 py-6 text-center text-sm text-[#9aa4b3]">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7fa650]/10 text-[#bce88e]">
        <Sparkles className="h-4 w-4" />
      </div>
      <p className="mt-3 font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-sm leading-6">{description}</p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, updatePrivateProfile, updateProfile } = useAuth();
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [privateProfileRow, setPrivateProfileRow] = useState<PrivateProfileRow | null>(null);
  const [recentGames, setRecentGames] = useState<GameRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([]);
  const [friendStats, setFriendStats] = useState<FriendStats>({ friends: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");
  const [ratingMode, setRatingMode] = useState<RatingMode>("rapid");
  const [gameFilter, setGameFilter] = useState<GameFilter>("all");
  const [gameSearch, setGameSearch] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [growthState, setGrowthState] = useState(() => readGrowthState());
  const [settingsForm, setSettingsForm] = useState({
    avatarUrl: "",
    username: "",
    displayName: "",
    bio: "",
    country: "",
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setLoading(true);

      try {
        const [
          profileResponse,
          privateProfileResponse,
          gamesResponse,
          activityResponse,
          friendsResponse,
          followersResponse,
          followingResponse,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("private_profile_data").select("*").eq("user_id", user.id).maybeSingle(),
          supabase
            .from("games")
            .select("*")
            .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("activity_feed")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8),
          supabase
            .from("friends")
            .select("*", { count: "exact", head: true })
            .eq("status", "accepted")
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
          supabase
            .from("friends")
            .select("*", { count: "exact", head: true })
            .eq("status", "accepted")
            .eq("friend_id", user.id),
          supabase
            .from("friends")
            .select("*", { count: "exact", head: true })
            .eq("status", "accepted")
            .eq("user_id", user.id),
        ]);

        if (!active) {
          return;
        }

        setProfileRow(profileResponse.data ?? null);
        setPrivateProfileRow(privateProfileResponse.data ?? null);
        setRecentGames(gamesResponse.data ?? []);
        setRecentActivity(activityResponse.data ?? []);
        setFriendStats({
          friends: friendsResponse.count ?? 0,
          followers: followersResponse.count ?? 0,
          following: followingResponse.count ?? 0,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const profile = useMemo(() => {
    if (!user) {
      return null;
    }

    const displayName =
      profileRow?.display_name ||
      (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null) ||
      user.email?.split("@")[0] ||
      "Player";

    const username =
      profileRow?.username ||
      (typeof user.user_metadata?.username === "string" ? user.user_metadata.username : null) ||
      displayName.toLowerCase().replace(/\s+/g, "_");

    const rapid = profileRow?.rating_rapid ?? null;
    const blitz = profileRow?.rating_blitz ?? null;
    const bullet = profileRow?.rating_bullet ?? null;
    const ratingCandidates = [rapid, blitz, bullet].filter((value): value is number => value != null);
    const rating = ratingCandidates.length > 0 ? Math.max(...ratingCandidates) : null;
    const country = privateProfileRow?.country || "Unknown";
    const hasRatingData = ratingCandidates.length > 0;
    const hasGameData = (profileRow?.games_played ?? 0) > 0 || recentGames.length > 0;

    return {
      avatarUrl:
        profileRow?.avatar_url ||
        (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null) ||
        null,
      displayName,
      username,
      rating,
      title: rating != null ? deriveTitle(rating) : "Unrated",
      country,
      flag: getCountryFlag(country),
      joinedDate: profileRow?.created_at || user.created_at || new Date().toISOString(),
      bio: profileRow?.bio || "No bio yet. Add a short intro in Settings.",
      favoriteOpening: recentGames[0] ? getOpeningHeader(recentGames[0].pgn) : "No games yet",
      playingStyle: hasRatingData || hasGameData
        ? derivePlayingStyle(rapid ?? 0, blitz ?? 0, profileRow?.games_won ?? 0, profileRow?.games_lost ?? 0)
        : "No style data yet",
      onlineStatus: "Status unavailable",
      stats: {
        rapid,
        blitz,
        bullet,
        puzzle: profileRow?.puzzle_rating ?? null,
        gamesPlayed: profileRow?.games_played ?? 0,
        wins: profileRow?.games_won ?? 0,
        draws: profileRow?.games_drawn ?? 0,
        losses: profileRow?.games_lost ?? 0,
        puzzlesSolved: profileRow?.puzzles_solved ?? 0,
        level: profileRow?.level ?? 1,
        xp: profileRow?.xp ?? 0,
        streakDays: profileRow?.streak_days ?? 0,
      },
    };
  }, [privateProfileRow, profileRow, recentGames, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setSettingsForm({
      avatarUrl: profile.avatarUrl || "",
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      country: profile.country,
    });
  }, [profile]);

  const activities = useMemo(
    () => (user ? (recentActivity.length > 0 ? recentActivity : deriveActivityFeed(recentGames, user.id)) : []),
    [recentActivity, recentGames, user],
  );

  const favorites = useMemo(
    () => (user ? deriveFavorites(recentGames, user.id) : []),
    [recentGames, user],
  );

  const ratingHistory = useMemo(
    () =>
      user
        ? {
            rapid: buildRatingHistory(recentGames, user.id, "rapid"),
            blitz: buildRatingHistory(recentGames, user.id, "blitz"),
            bullet: buildRatingHistory(recentGames, user.id, "bullet"),
          }
        : { rapid: [], blitz: [], bullet: [] },
    [recentGames, user],
  );

  const heatmap = useMemo(() => buildHeatmap(recentGames, activities), [activities, recentGames]);

  const winRate =
    profile && profile.stats.gamesPlayed > 0
      ? Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100)
      : 0;

  const puzzleToday = activities.filter(
    (item) => item.type === "puzzle" && new Date(item.created_at).toDateString() === new Date().toDateString(),
  ).length;
  const puzzleWeek = activities.filter((item) => {
    if (item.type !== "puzzle") {
      return false;
    }

    const created = new Date(item.created_at);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 7);
    return created >= threshold;
  }).length;
  const growthSummary = useMemo(() => buildGrowthSummary(growthState), [growthState]);
  const activeTrainingPlan = useMemo(
    () => growthState.trainingPlan.filter((item) => !item.completed).slice(0, 4),
    [growthState.trainingPlan],
  );
  const unlockedThemes = useMemo(
    () => growthState.themeUnlocks.filter((theme) => theme.unlocked),
    [growthState.themeUnlocks],
  );

  const achievements = useMemo(() => {
    if (!profile) {
      return [];
    }

    const ratingValue = profile.rating ?? 0;

    const profileAchievements = [
      {
        title: "Win 10 games",
        description: "Build consistency over double-digit wins.",
        progress: Math.min(100, (profile.stats.wins / 10) * 100),
        unlocked: profile.stats.wins >= 10,
      },
      {
        title: "Solve 50 puzzles",
        description: "Strengthen tactical routine.",
        progress: Math.min(100, (profile.stats.puzzlesSolved / 50) * 100),
        unlocked: profile.stats.puzzlesSolved >= 50,
      },
      {
        title: "Reach 1000 rating",
        description: "Cross the first rating milestone.",
        progress: Math.min(100, ratingValue / 10),
        unlocked: ratingValue >= 1000,
      },
      {
        title: "Play 100 games",
        description: "Get enough real games to track your style.",
        progress: Math.min(100, profile.stats.gamesPlayed),
        unlocked: profile.stats.gamesPlayed >= 100,
      },
    ];

    const growthAchievements = growthState.achievements.map((achievement) => ({
      title: achievement.title,
      description: achievement.description,
      progress: Math.round((achievement.progress / Math.max(achievement.target, 1)) * 100),
      unlocked: achievement.unlocked,
    }));

    return [...profileAchievements, ...growthAchievements];
  }, [growthState.achievements, profile]);

  const filteredGames = useMemo(() => {
    if (!user) {
      return [];
    }

    return recentGames
      .filter((game) => {
        const result = getProfileResult(game, user.id).toLowerCase();
        if (gameFilter === "win" && result !== "win") return false;
        if (gameFilter === "loss" && result !== "loss") return false;
        if (gameFilter === "draw" && result !== "draw") return false;
        return true;
      })
      .filter((game) =>
        getOpponentLabel(game, user.id).toLowerCase().includes(gameSearch.toLowerCase()),
      );
  }, [gameFilter, gameSearch, recentGames, user]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/profile`);
      toast.success("Profile link copied.");
    } catch {
      toast.error("Could not copy the profile link.");
    }
  };

  const handleSaveSettings = async () => {
    if (!user || !profile) {
      return;
    }

    try {
      const [authResult, profileResult, privateResult] = await Promise.all([
        updateProfile({
          display_name: settingsForm.displayName,
          avatar_url: settingsForm.avatarUrl || null,
          username: settingsForm.username,
          bio: settingsForm.bio,
        }),
        supabase
          .from("profiles")
          .update({
            display_name: settingsForm.displayName,
            avatar_url: settingsForm.avatarUrl || null,
            username: settingsForm.username.trim().toLowerCase(),
            bio: settingsForm.bio,
          })
          .eq("user_id", user.id),
        updatePrivateProfile({ country: settingsForm.country || null }),
      ]);

      if (authResult.error || profileResult.error || privateResult.error) {
        throw authResult.error || profileResult.error || privateResult.error;
      }

      setProfileRow((current) =>
        current
          ? {
              ...current,
              display_name: settingsForm.displayName,
              avatar_url: settingsForm.avatarUrl || null,
              username: settingsForm.username.trim().toLowerCase(),
              bio: settingsForm.bio,
            }
          : current,
      );
      setPrivateProfileRow((current) =>
        current ? { ...current, country: settingsForm.country || null } : current,
      );
      toast.success("Profile settings saved.");
      setEditProfileOpen(false);
    } catch {
      toast.error("Could not save profile settings.");
    }
  };

  const handleCoachProfileChange = (
    patch: Partial<{
      helpLevel: CoachHelpLevel;
      explanationStyle: CoachExplanationStyle;
      focus: TrainingPlanCategory;
      language: "en" | "uk";
    }>,
  ) => {
    setGrowthState(updateCoachProfile(patch));
    toast.success("Coach profile updated.");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#111318]">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#d0d6de]">
          <Sparkles className="h-4 w-4 text-[#7fa650]" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-full bg-[#111318] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[920px]">
          <div className="rounded-[28px] border border-white/10 bg-[#191c22] p-8 shadow-2xl shadow-black/25">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-[#7fa650]/20 bg-[#7fa650]/12 text-[#eaf5de]">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-center text-[32px] font-semibold tracking-tight text-white">Player Profile</h1>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-7 text-[#a0a7b2]">
              Register or log in to unlock your real profile, ratings, recent games, activity,
              achievements, and analysis history.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-12 bg-[#7fa650] px-6 text-white hover:bg-[#90b862]">
                <button onClick={() => navigate("/register")}>Create account</button>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 border-white/10 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <button onClick={() => navigate("/login")}>Log In</button>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ratingStats = [
    {
      label: "Rapid",
      value: formatMetric(profile.stats.rapid),
      icon: Clock3,
      history: ratingHistory.rapid,
      trend: ratingHistory.rapid.length > 1 ? "+12" : "new",
    },
    {
      label: "Blitz",
      value: formatMetric(profile.stats.blitz),
      icon: Zap,
      history: ratingHistory.blitz,
      trend: ratingHistory.blitz.length > 1 ? "+8" : "new",
    },
    {
      label: "Bullet",
      value: formatMetric(profile.stats.bullet),
      icon: Flame,
      history: ratingHistory.bullet,
      trend: ratingHistory.bullet.length > 1 ? "+5" : "new",
    },
    {
      label: "Puzzle",
      value: formatMetric(profile.stats.puzzle),
      icon: Puzzle,
      history: [],
      trend: profile.stats.puzzlesSolved > 0 ? `${profile.stats.puzzlesSolved} solved` : "start",
    },
  ];

  const performanceStats = [
    { label: "Games", value: profile.stats.gamesPlayed.toString(), detail: "rated games" },
    { label: "Win rate", value: `${winRate}%`, detail: profile.stats.gamesPlayed > 0 ? "current form" : "play first game" },
    {
      label: "Accuracy",
      value: growthSummary.bestAccuracy > 0 ? `${Math.round(growthSummary.bestAccuracy)}%` : "Start",
      detail: growthSummary.bestAccuracy > 0 ? "best review" : "review a game",
    },
  ];

  const selectedRatingHistory = ratingHistory[ratingMode];
  const compactActivities = activities.slice(0, 6);
  const compactAchievements = achievements.slice(0, 6);
  const aboutBio = profile.bio.startsWith("No bio")
    ? "A clean player profile is ready. Add a short bio to make it feel personal."
    : profile.bio;
  const favoriteOpening =
    profile.favoriteOpening === "No games yet" ? "Play rated games to discover your repertoire." : profile.favoriteOpening;
  const playerMeta = `${profile.flag} ${profile.country} • Joined ${formatDate(profile.joinedDate)}`;
  const inlineRatings = `Rapid ${formatMetric(profile.stats.rapid)} • Blitz ${formatMetric(profile.stats.blitz)}`;

  return (
    <div className="min-h-full overflow-hidden bg-[#080d14] px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,rgba(127,166,80,0.16),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(70,105,150,0.18),transparent_36%),linear-gradient(180deg,#0b1119_0%,#070a0f_100%)]" />
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#101923]/82 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:p-8">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(127,166,80,0.18),transparent_34%),radial-gradient(circle_at_82%_10%,rgba(255,255,255,0.12),transparent_24%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <ProfileAvatar avatarUrl={profile.avatarUrl} name={profile.displayName} />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-white sm:text-[42px]">
                    {profile.displayName}
                  </h1>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.85)]" />
                    Online
                  </span>
                </div>
                <p className="text-sm font-medium text-[#d5dbe5]">{inlineRatings}</p>
                <p className="text-sm text-[#8f98a8]">{playerMeta}</p>
                <p className="max-w-2xl text-sm leading-6 text-[#aeb7c6]">{aboutBio}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button
                className="h-11 rounded-2xl bg-[#7fa650] px-5 font-semibold text-white shadow-[0_14px_34px_rgba(127,166,80,0.28)] transition hover:-translate-y-0.5 hover:bg-[#8fba5c]"
                onClick={() => setEditProfileOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <details className="group relative">
                <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#dce4ef] transition hover:-translate-y-0.5 hover:bg-white/[0.1] [&::-webkit-details-marker]:hidden">
                  <MoreHorizontal className="h-5 w-5" />
                </summary>
                <div className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#111923]/95 p-2 shadow-2xl shadow-black/45 backdrop-blur-xl">
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#dce4ef] transition hover:bg-white/[0.08]" onClick={handleShare} type="button">
                    <Share2 className="h-4 w-4" />
                    Share Profile
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#dce4ef] transition hover:bg-white/[0.08]" onClick={handleShare} type="button">
                    <Copy className="h-4 w-4" />
                    Copy Profile Link
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#dce4ef] transition hover:bg-white/[0.08]" onClick={() => toast.info("Block controls will be available for public profiles.")} type="button">
                    <UserX className="h-4 w-4" />
                    Block User
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-200 transition hover:bg-rose-500/10" onClick={() => toast.info("Report tools are available from public profiles.")} type="button">
                    <Flag className="h-4 w-4" />
                    Report User
                  </button>
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {ratingStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group rounded-[24px] border border-white/[0.07] bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[#7fa650]/35 hover:bg-white/[0.065]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7fa650]/12 text-[#a8d86f]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f8898]">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">{stat.value}</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#7fa650]/20 bg-[#7fa650]/10 px-2.5 py-1 text-xs font-semibold text-[#bfe891]">
                    {stat.trend}
                  </span>
                </div>
                <MiniSparkline data={stat.history} />
              </div>
            );
          })}
        </section>

        <ShellCard className="overflow-hidden">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7fa650]">Season Progress</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                Rating, streak, achievements, review progress
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9aa4b3]">
                A focused competitive snapshot: keep the streak alive, review games, and unlock achievements through real progress.
              </p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-4 lg:w-[560px]">
              <CompactMetric label="Best rating" value={profile.rating ? profile.rating.toString() : "Unrated"} />
              <CompactMetric label="Streak" value={`${profile.stats.streakDays}d`} />
              <CompactMetric label="Achievements" value={achievements.filter((item) => item.unlocked).length.toString()} />
              <CompactMetric label="Reviews" value={growthSummary.reviewCount.toString()} />
            </div>
          </div>
        </ShellCard>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <ShellCard className="p-0">
              <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7fa650]">Rating Progress</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Competitive curve</h2>
                </div>
                <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                  {(["rapid", "blitz", "bullet"] as RatingMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-semibold capitalize text-[#9aa4b3] transition",
                        ratingMode === mode && "bg-white text-[#0c1118] shadow-lg shadow-black/20",
                      )}
                      onClick={() => setRatingMode(mode)}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[320px] p-5">
                {selectedRatingHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedRatingHistory}>
                      <defs>
                        <linearGradient id="premiumRatingGlow" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#9edb6b" stopOpacity={0.48} />
                          <stop offset="100%" stopColor="#9edb6b" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#6f7887" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis stroke="#6f7887" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
                      <Tooltip
                        cursor={{ stroke: "rgba(158,219,107,0.4)" }}
                        contentStyle={{
                          background: "rgba(9, 14, 22, 0.94)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="rating"
                        stroke="#9edb6b"
                        strokeWidth={3}
                        fill="url(#premiumRatingGlow)"
                        dot={false}
                        activeDot={{ r: 5, fill: "#9edb6b", stroke: "#101923", strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="Your rating history will appear here." description="Play your first rated game to start building a visible progress curve." />
                )}
              </div>
            </ShellCard>

            <Tabs value={profileTab} onValueChange={(value) => setProfileTab(value as ProfileTab)} className="space-y-5">
              <div className="overflow-x-auto pb-1">
                <TabsList className="inline-flex h-11 rounded-full border border-white/10 bg-white/[0.045] p-1 backdrop-blur-xl">
                  {PROFILE_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-full px-5 text-sm font-semibold text-[#9aa4b3] transition data-[state=active]:bg-white data-[state=active]:text-[#0c1118] data-[state=active]:shadow-lg"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-5">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <ShellCard>
                    <SectionHeader eyebrow="About" title="Player identity" />
                    <div className="mt-4 space-y-3 text-sm leading-6 text-[#c0c8d4]">
                      <p>{aboutBio}</p>
                      <p>
                        <span className="text-[#7f8898]">Favorite opening:</span> {favoriteOpening}
                      </p>
                      <p>
                        <span className="text-[#7f8898]">Playing style:</span>{" "}
                        {profile.playingStyle === "No style data yet" ? "Play more games to unlock a style profile." : profile.playingStyle}
                      </p>
                    </div>
                  </ShellCard>

                  <ShellCard>
                    <SectionHeader eyebrow="Performance" title="Clean snapshot" />
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {performanceStats.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7b8493]">{item.label}</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                          <p className="mt-1 text-xs text-[#8f98a8]">{item.detail}</p>
                        </div>
                      ))}
                    </div>
                  </ShellCard>
                </div>

                <ShellCard>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <SectionHeader eyebrow="Game Review" title="Analysis progress" />
                    <Button className="h-10 rounded-2xl bg-[#7fa650] px-4 text-white hover:bg-[#8fba5c]" onClick={() => navigate("/analysis")}>
                      Open Analysis
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <CompactMetric label="Reviews completed" value={growthSummary.reviewCount.toString()} />
                    <CompactMetric label="Mistakes fixed" value={growthSummary.fixedMistakeCount.toString()} />
                    <CompactMetric label="Best accuracy" value={growthSummary.bestAccuracy > 0 ? `${Math.round(growthSummary.bestAccuracy)}%` : "Start"} />
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="games" className="space-y-5">
                <ShellCard>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <SectionHeader eyebrow="Match History" title="Recent games" />
                    <div className="flex flex-wrap items-center gap-2">
                      {(["all", "win", "loss", "draw"] as GameFilter[]).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setGameFilter(filter)}
                          className={cn(
                            "rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold capitalize text-[#9aa4b3] transition hover:bg-white/[0.08]",
                            gameFilter === filter && "border-[#7fa650]/40 bg-[#7fa650]/15 text-[#dff4c5]",
                          )}
                        >
                          {filter}
                        </button>
                      ))}
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f7887]" />
                        <Input
                          value={gameSearch}
                          onChange={(event) => setGameSearch(event.target.value)}
                          placeholder="Search opponent"
                          className="h-10 w-[210px] rounded-full border-white/10 bg-white/[0.04] pl-9 text-sm text-white placeholder:text-[#6f7887]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {filteredGames.length > 0 ? (
                      filteredGames.slice(0, 8).map((game) => (
                        <button
                          key={game.id}
                          type="button"
                          onClick={() => navigate(`/analysis?pgn=${encodeURIComponent(game.pgn)}`)}
                          className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#7fa650]/35 hover:bg-white/[0.06]"
                        >
                          <div>
                            <p className="font-semibold text-white">{getOpponentLabel(game, user.id)}</p>
                            <p className="mt-1 text-xs text-[#8f98a8]">{getOpeningHeader(game.pgn)} • {game.time_control || "No clock"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#dce4ef]">{getProfileResult(game, user.id)}</p>
                            <p className="mt-1 text-xs text-[#7f8898]">{formatDate(game.created_at)}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <EmptyState title="Play your first rated game." description="Your match history will become a clean timeline of opponents, openings, and results." />
                    )}
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="puzzles">
                <ShellCard>
                  <SectionHeader eyebrow="Puzzles" title="Tactical rhythm" />
                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <CompactMetric label="Puzzle rating" value={formatMetric(profile.stats.puzzle)} />
                    <CompactMetric label="Solved" value={profile.stats.puzzlesSolved.toString()} />
                    <CompactMetric label="Today" value={puzzleToday.toString()} />
                    <CompactMetric label="This week" value={puzzleWeek.toString()} />
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="lessons">
                <ShellCard>
                  <SectionHeader eyebrow="Training Plan" title="Today's focus" />
                  <div className="mt-5 space-y-3">
                    {activeTrainingPlan.length > 0 ? (
                      activeTrainingPlan.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">{item.title}</p>
                            <span className="rounded-full bg-[#7fa650]/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#c8ef9c]">
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#9aa4b3]">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="Complete lessons to unlock insights." description="Review games and finish lessons to generate a focused daily training plan." />
                    )}
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="achievements">
                <ShellCard>
                  <SectionHeader eyebrow="Achievements" title="Progress unlocks" />
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {compactAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.title}
                        title={achievement.title}
                        description={achievement.description}
                        progress={achievement.progress}
                        unlocked={achievement.unlocked}
                      />
                    ))}
                  </div>
                </ShellCard>
              </TabsContent>
            </Tabs>
          </main>

          <aside className="space-y-5">
            <ShellCard>
              <SectionHeader eyebrow="Recent Activity" title="Player pulse" />
              <div className="mt-5 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1">
                {heatmap.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} activity`}
                    className={cn(
                      "h-3.5 rounded-[4px] border border-white/[0.03] transition hover:scale-125 hover:border-[#c7f39b]/60",
                      day.count === 0 && "bg-white/[0.035]",
                      day.count === 1 && "bg-[#36512f]",
                      day.count === 2 && "bg-[#5f8d42]",
                      day.count >= 3 && "bg-[#9edb6b]",
                    )}
                  />
                ))}
              </div>
              <div className="mt-5 space-y-3">
                {compactActivities.length > 0 ? (
                  compactActivities.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#9edb6b]">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#dce4ef]">{item.description}</p>
                        <p className="mt-1 text-xs text-[#7f8898]">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Your activity will appear here." description="Games, puzzles, lessons, and reviews will form a compact timeline." />
                )}
              </div>
            </ShellCard>

            <ShellCard>
              <SectionHeader eyebrow="Friends" title="Network" />
              <div className="mt-5 grid grid-cols-3 gap-2">
                <CompactMetric label="Friends" value={friendStats.friends.toString()} />
                <CompactMetric label="Followers" value={friendStats.followers.toString()} />
                <CompactMetric label="Following" value={friendStats.following.toString()} />
              </div>
              <Button variant="outline" className="mt-4 h-10 w-full rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white">
                View Friends
              </Button>
            </ShellCard>

            <ShellCard>
              <SectionHeader eyebrow="Clubs" title="Chess circles" />
              <div className="mt-5">
                <EmptyState title="No clubs joined yet." description="Join a club to see team activity and shared events here." />
              </div>
            </ShellCard>
          </aside>
        </div>
      </div>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#101923] text-white shadow-2xl shadow-black/50 sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-[-0.03em]">Edit Profile</DialogTitle>
            <DialogDescription className="text-[#9aa4b3]">
              Update identity details and coach preferences without adding another dashboard tab.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Username">
              <Input
                value={settingsForm.username}
                onChange={(event) => setSettingsForm((current) => ({ ...current, username: event.target.value }))}
                className="rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]"
              />
            </FormField>
            <FormField label="Display name">
              <Input
                value={settingsForm.displayName}
                onChange={(event) => setSettingsForm((current) => ({ ...current, displayName: event.target.value }))}
                className="rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]"
              />
            </FormField>
            <FormField label="Country">
              <Input
                value={settingsForm.country}
                onChange={(event) => setSettingsForm((current) => ({ ...current, country: event.target.value }))}
                className="rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]"
              />
            </FormField>
            <FormField label="Avatar URL">
              <Input
                value={settingsForm.avatarUrl}
                onChange={(event) => setSettingsForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                className="rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]"
              />
            </FormField>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f8898]">Bio</label>
              <Textarea
                value={settingsForm.bio}
                onChange={(event) => setSettingsForm((current) => ({ ...current, bio: event.target.value }))}
                className="mt-2 min-h-[110px] rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]"
                placeholder="Tell other players how you approach chess."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
            <p className="text-sm font-semibold text-white">Coach Profile</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <CoachOptionGroup
                label="Explanation style"
                value={growthState.coachProfile.explanationStyle}
                options={[
                  ["short", "Short"],
                  ["balanced", "Balanced"],
                  ["deep", "Deep"],
                ]}
                onChange={(value) => handleCoachProfileChange({ explanationStyle: value as CoachExplanationStyle })}
              />
              <CoachOptionGroup
                label="Help level"
                value={growthState.coachProfile.helpLevel}
                options={[
                  ["light", "Light"],
                  ["guided", "Guided"],
                  ["strict", "Strict"],
                ]}
                onChange={(value) => handleCoachProfileChange({ helpLevel: value as CoachHelpLevel })}
              />
            </div>
            <p className="mt-4 text-xs text-[#7f8898]">
              Board themes unlocked: {unlockedThemes.length}. More theme controls stay out of the profile surface to keep this page focused.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} className="h-11 rounded-2xl bg-[#7fa650] px-6 text-white hover:bg-[#8fba5c]">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const topStats = [
    { label: "Rapid rating", value: formatMetric(profile.stats.rapid), accent: "text-white" },
    { label: "Blitz rating", value: formatMetric(profile.stats.blitz), accent: "text-white" },
    { label: "Bullet rating", value: formatMetric(profile.stats.bullet), accent: "text-white" },
    { label: "Puzzle rating", value: formatMetric(profile.stats.puzzle), accent: "text-white" },
    { label: "Win rate", value: `${winRate}%`, accent: "text-[#9fd76d]" },
    { label: "Games played", value: profile.stats.gamesPlayed.toString(), accent: "text-white" },
    { label: "Wins", value: profile.stats.wins.toString(), accent: "text-emerald-300" },
    { label: "Losses", value: profile.stats.losses.toString(), accent: "text-rose-300" },
    { label: "Draws", value: profile.stats.draws.toString(), accent: "text-[#d0d6de]" },
    { label: "Accuracy", value: "—", accent: "text-white" },
    { label: "Avg. centipawn loss", value: "—", accent: "text-white" },
  ];

  return (
    <div className="min-h-full bg-[#111318] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <ShellCard>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar avatarUrl={profile.avatarUrl} name={profile.displayName} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[28px] font-semibold tracking-tight text-white">{profile.displayName}</h1>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#d0d6de]">
                    {profile.title}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#a0a7b2]">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#7fa650]" />
                    {profile.flag} {profile.country}
                  </span>
                  <span className="flex items-center gap-2">
                    <TrendingIcon />
                    Rating {formatMetric(profile.rating)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#7fa650]" />
                    {profile.onlineStatus}
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c5ccd6]">
                  {profile.bio}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setProfileTab("settings")}
                className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleShare}
                className="h-10 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Profile
              </Button>
              <Button
                onClick={() => setIsFollowing((current) => !current)}
                className={cn(
                  "h-10 text-white",
                  isFollowing ? "bg-white/8 hover:bg-white/12" : "bg-[#7fa650] hover:bg-[#90b862]",
                )}
              >
                <Heart className="mr-2 h-4 w-4" />
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </div>
          </div>
        </ShellCard>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
          <div className="space-y-6">
            <ShellCard>
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={`@${profile.username}`} />
                    <Pill label={profile.favoriteOpening} />
                    <Pill label={profile.playingStyle} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileMetaItem label="Display name" value={profile.displayName} />
                    <ProfileMetaItem label="Username" value={`@${profile.username}`} />
                    <ProfileMetaItem label="Country" value={`${profile.flag} ${profile.country}`} />
                    <ProfileMetaItem label="Joined" value={formatDate(profile.joinedDate)} />
                    <ProfileMetaItem label="Favorite opening" value={profile.favoriteOpening} />
                    <ProfileMetaItem
                      label="Favorite color"
                      value={profile.stats.gamesPlayed > 0 ? (profile.stats.wins >= profile.stats.losses ? "White" : "Black") : "No data yet"}
                    />
                    <ProfileMetaItem label="Playing style" value={profile.playingStyle} />
                    <ProfileMetaItem label="Status" value={profile.onlineStatus} />
                  </div>
                </div>

                <div className="rounded-[18px] border border-white/8 bg-[#15181e] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a919b]">About</p>
                  <p className="mt-3 text-sm leading-7 text-[#d0d6de]">{profile.bio}</p>
                </div>
              </div>
            </ShellCard>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topStats.map((stat) => (
                <StatCard key={stat.label} label={stat.label} value={stat.value} accentClassName={stat.accent} />
              ))}
            </div>

            <ShellCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Rating Progress</h2>
                  <p className="mt-1 text-sm text-[#a0a7b2]">Recent rated games by mode, built only from your saved match history.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["rapid", "blitz", "bullet"] as RatingMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setRatingMode(mode)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                        ratingMode === mode
                          ? "border-[#7fa650]/40 bg-[#7fa650]/14 text-white"
                          : "border-white/10 bg-white/5 text-[#a0a7b2] hover:bg-white/10 hover:text-white",
                      )}
                    >
                      {mode === "rapid" ? "Rapid" : mode === "blitz" ? "Blitz" : "Bullet"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 h-[280px]">
                {ratingHistory[ratingMode].length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ratingHistory[ratingMode]}>
                      <defs>
                        <linearGradient id="profile-rating-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#7fa650" stopOpacity={0.32} />
                          <stop offset="100%" stopColor="#7fa650" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#242830" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" stroke="#76808d" tickLine={false} axisLine={false} />
                      <YAxis stroke="#76808d" tickLine={false} axisLine={false} width={48} />
                      <Tooltip
                        cursor={{ stroke: "#7fa650", strokeOpacity: 0.35 }}
                        contentStyle={{
                          background: "#161a20",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 16,
                          color: "#fff",
                        }}
                      />
                      <Area type="monotone" dataKey="rating" fill="url(#profile-rating-fill)" stroke="#7fa650" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No rating history yet"
                    description="Finish a few rated games in this time control to populate the chart."
                  />
                )}
              </div>
            </ShellCard>

            <Tabs value={profileTab} onValueChange={(value) => setProfileTab(value as ProfileTab)} className="space-y-5">
              <div className="overflow-x-auto pb-1">
                <TabsList className="inline-grid h-12 min-w-full grid-cols-7 rounded-[18px] bg-[#191c22] p-1 lg:w-full">
                  {PROFILE_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-[14px] px-3 text-sm data-[state=active]:bg-[#111318] data-[state=active]:text-white"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <OverviewChip icon={Zap} label="Current rating" value={formatMetric(profile.rating)} />
                  <OverviewChip icon={Flame} label="Win streak" value={`${Math.max(0, profile.stats.streakDays)} days`} />
                  <OverviewChip icon={Clock3} label="Last activity" value={activities[0] ? formatDate(activities[0].created_at) : "No activity yet"} />
                  <OverviewChip icon={BookOpen} label="Favorite opening" value={profile.favoriteOpening} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <ShellCard className="bg-[#161a20]">
                    <h3 className="text-lg font-semibold text-white">About</h3>
                    <div className="mt-4 space-y-4 text-sm leading-7 text-[#c5ccd6]">
                      <p>{profile.bio}</p>
                      <p>Playing style: {profile.playingStyle}.</p>
                      <p>Favorite opening right now: {profile.favoriteOpening}.</p>
                      <p>
                        Most active mode: {profile.stats.blitz != null && profile.stats.rapid != null
                          ? profile.stats.blitz >= profile.stats.rapid ? "Blitz" : "Rapid"
                          : "No mode data yet"}.
                      </p>
                    </div>
                  </ShellCard>

                  <ShellCard className="bg-[#161a20]">
                    <h3 className="text-lg font-semibold text-white">Current Progress</h3>
                    <div className="mt-4 space-y-4">
                      <ProgressRow label="Level progress" value={(profile.stats.xp % 1000) / 10} valueLabel={`${profile.stats.xp} XP`} />
                      <ProgressRow label="Win rate" value={winRate} valueLabel={`${winRate}%`} />
                      <ProgressRow
                        label="Puzzle progress"
                        value={Math.min(100, (profile.stats.puzzlesSolved / 200) * 100)}
                        valueLabel={`${profile.stats.puzzlesSolved} solved`}
                      />
                    </div>
                  </ShellCard>
                </div>

                <ShellCard className="bg-[#161a20]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <NotebookTabs className="h-5 w-5 text-[#9fd76d]" />
                        Game Review System
                      </h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a0a7b2]">
                        Local progress from Analysis: reviewed games, mistake notebook, training plan, and opening drills.
                      </p>
                    </div>
                    <Button onClick={() => navigate("/analysis")} className="h-10 bg-[#7fa650] px-4 text-white hover:bg-[#90b862]">
                      Open Analysis
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <SmallStat label="Reviews" value={growthSummary.reviewCount.toString()} />
                    <SmallStat label="Open mistakes" value={growthSummary.openMistakeCount.toString()} />
                    <SmallStat label="Fixed mistakes" value={growthSummary.fixedMistakeCount.toString()} />
                    <SmallStat label="Opening drills" value={growthSummary.completedOpeningDrills.toString()} />
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {activeTrainingPlan.length > 0 ? (
                      activeTrainingPlan.slice(0, 2).map((item) => (
                        <div key={item.id} className="rounded-[16px] border border-white/8 bg-[#111318] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">{item.title}</p>
                            <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", item.priority === "high" ? "bg-rose-500/12 text-rose-200" : "bg-white/10 text-[#d0d6de]")}>
                              {item.priority}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#a0a7b2]">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No training plan yet" description="Run Game Review to generate targeted tasks from real mistakes." />
                    )}
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="games" className="mt-0">
                <ShellCard>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Recent Games</h3>
                      <p className="mt-1 text-sm text-[#a0a7b2]">Open any saved game directly in analysis.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex flex-wrap gap-2">
                        {(["all", "win", "loss", "draw"] as GameFilter[]).map((filter) => (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setGameFilter(filter)}
                            className={cn(
                              "rounded-full border px-3 py-2 text-sm font-medium transition",
                              gameFilter === filter
                                ? "border-[#7fa650]/40 bg-[#7fa650]/14 text-white"
                                : "border-white/10 bg-white/5 text-[#a0a7b2] hover:bg-white/10 hover:text-white",
                            )}
                          >
                            {filter === "all" ? "All" : filter === "win" ? "Wins" : filter === "loss" ? "Losses" : "Draws"}
                          </button>
                        ))}
                      </div>
                      <div className="relative min-w-[220px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8591]" />
                        <Input
                          value={gameSearch}
                          onChange={(event) => setGameSearch(event.target.value)}
                          placeholder="Search opponent"
                          className="h-10 border-white/10 bg-white/5 pl-10 text-white placeholder:text-[#7d8591]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {filteredGames.length > 0 ? (
                      filteredGames.map((game) => {
                        const result = getProfileResult(game, user.id);
                        const opening = getOpeningHeader(game.pgn);
                        return (
                          <button
                            key={game.id}
                            type="button"
                            onClick={() => navigate(`/analysis?pgn=${encodeURIComponent(game.pgn)}`)}
                            className="w-full rounded-[18px] border border-white/8 bg-[#15181e] px-4 py-4 text-left transition hover:border-[#7fa650]/35 hover:bg-[#181d24]"
                          >
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                              <div className="flex flex-wrap items-center gap-3 text-sm">
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                    result === "Win"
                                      ? "bg-emerald-500/12 text-emerald-200"
                                      : result === "Loss"
                                        ? "bg-rose-500/12 text-rose-200"
                                        : "bg-white/10 text-[#d0d6de]",
                                  )}
                                >
                                  {result}
                                </span>
                                <span className="font-semibold text-white">{getOpponentLabel(game, user.id)}</span>
                                <span className="text-[#a0a7b2]">{formatDate(game.created_at)}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-[#a0a7b2]">
                                <span>{game.time_control || "10+0"}</span>
                                <span>{opening}</span>
                                <span>{game.moves_count} moves</span>
                                <ChevronRight className="h-4 w-4 text-[#7fa650]" />
                              </div>
                            </div>
                            <p className="mt-3 truncate text-sm text-[#d0d6de]">{game.pgn.replace(/\n/g, " ").slice(0, 120)}...</p>
                          </button>
                        );
                      })
                    ) : (
                      <EmptyState title="No games found" description="Play or save a few games to populate this section." />
                    )}
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="puzzles" className="mt-0 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Puzzle rating" value={formatMetric(profile.stats.puzzle)} accentClassName="text-white" />
                  <StatCard label="Current streak" value={`${profile.stats.streakDays}`} accentClassName="text-[#9fd76d]" />
                  <StatCard label="Solved puzzles" value={profile.stats.puzzlesSolved.toString()} accentClassName="text-white" />
                  <StatCard label="Accuracy" value="—" accentClassName="text-white" />
                </div>

                <ShellCard>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MiniInsight title="Best streak" value={`${profile.stats.streakDays}`} description="Current real streak value from your profile stats." />
                    <MiniInsight title="Current streak" value={`${profile.stats.streakDays}`} description="How many active days are tracked right now." />
                    <MiniInsight title="Puzzles today" value={`${puzzleToday}`} description="Puzzle activity entries recorded today." />
                    <MiniInsight title="Puzzles this week" value={`${puzzleWeek}`} description="Puzzle activity entries recorded in the last 7 days." />
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="lessons" className="mt-0">
                <ShellCard>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Training Plan</h3>
                      <p className="mt-1 text-sm text-[#a0a7b2]">Generated from your Game Review notebook.</p>
                    </div>
                    <Button onClick={() => navigate("/lessons")} className="h-10 bg-[#7fa650] px-4 text-white hover:bg-[#90b862]">
                      Open Lessons
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {activeTrainingPlan.map((item) => (
                      <div key={item.id} className="rounded-[16px] border border-white/8 bg-[#15181e] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7fa650]">{item.category}</p>
                        <h4 className="mt-2 font-semibold text-white">{item.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-[#a0a7b2]">{item.description}</p>
                        <p className="mt-3 text-xs font-semibold text-[#d0d6de]">Target: {item.target}</p>
                      </div>
                    ))}
                    {activeTrainingPlan.length === 0 ? (
                      <EmptyState
                        title="No training plan yet"
                        description="Run Game Review in Analysis to generate tasks from real mistakes."
                      />
                    ) : null}
                  </div>
                </ShellCard>
              </TabsContent>

              <TabsContent value="achievements" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.title} {...achievement} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="favorites" className="mt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  {favorites.length > 0 ? (
                    favorites.map((group) => (
                      <ShellCard key={group.title}>
                        <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#d0d6de]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </ShellCard>
                    ))
                  ) : (
                    <ShellCard className="md:col-span-2">
                      <EmptyState
                        title="No favorites yet"
                        description="Play more games to derive favorite openings, controls, opponents, and bots."
                      />
                    </ShellCard>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <ShellCard>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Avatar URL">
                      <Input
                        value={settingsForm.avatarUrl}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                        className="h-10 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                        placeholder="https://..."
                      />
                    </FormField>
                    <FormField label="Username">
                      <Input
                        value={settingsForm.username}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, username: event.target.value }))}
                        className="h-10 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                      />
                    </FormField>
                    <FormField label="Display name">
                      <Input
                        value={settingsForm.displayName}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, displayName: event.target.value }))}
                        className="h-10 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                      />
                    </FormField>
                    <FormField label="Country">
                      <Input
                        value={settingsForm.country}
                        onChange={(event) => setSettingsForm((current) => ({ ...current, country: event.target.value }))}
                        className="h-10 border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                      />
                    </FormField>
                    <div className="md:col-span-2">
                      <FormField label="Bio">
                        <Textarea
                          value={settingsForm.bio}
                          onChange={(event) => setSettingsForm((current) => ({ ...current, bio: event.target.value }))}
                          className="min-h-[140px] border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                        />
                      </FormField>
                    </div>
                  </div>
                  <div className="mt-6 rounded-[20px] border border-white/8 bg-[#15181e] p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#7fa650]/12 text-[#9fd76d]">
                        <BrainCircuit className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Coach Profile</h3>
                        <p className="mt-1 text-sm leading-6 text-[#a0a7b2]">
                          Controls how the local AI coach explains Game Review, notebook mistakes, and training tasks.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <CoachOptionGroup
                        label="Help level"
                        value={growthState.coachProfile.helpLevel}
                        options={["light", "balanced", "deep"]}
                        onSelect={(value) => handleCoachProfileChange({ helpLevel: value as CoachHelpLevel })}
                      />
                      <CoachOptionGroup
                        label="Explanation style"
                        value={growthState.coachProfile.explanationStyle}
                        options={["short", "balanced", "detailed"]}
                        onSelect={(value) => handleCoachProfileChange({ explanationStyle: value as CoachExplanationStyle })}
                      />
                      <CoachOptionGroup
                        label="Focus"
                        value={growthState.coachProfile.focus}
                        options={["review", "tactics", "opening", "king-safety", "endgame"]}
                        onSelect={(value) => handleCoachProfileChange({ focus: value as TrainingPlanCategory })}
                      />
                      <CoachOptionGroup
                        label="Language"
                        value={growthState.coachProfile.language}
                        options={["en", "uk"]}
                        onSelect={(value) => handleCoachProfileChange({ language: value as "en" | "uk" })}
                      />
                    </div>
                  </div>
                  <div className="mt-6 rounded-[20px] border border-white/8 bg-[#15181e] p-4">
                    <div className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-[#9fd76d]" />
                      <h3 className="font-semibold text-white">Board Themes Shop</h3>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {growthState.themeUnlocks.map((theme) => (
                        <div key={theme.id} className={cn("rounded-[16px] border p-3", theme.unlocked ? "border-[#7fa650]/30 bg-[#7fa650]/10" : "border-white/8 bg-white/[0.03]")}>
                          <p className="font-semibold text-white">{theme.name}</p>
                          <p className="mt-1 text-xs leading-5 text-[#a0a7b2]">{theme.description}</p>
                          <p className="mt-3 text-xs font-semibold text-[#d0d6de]">
                            {theme.unlocked ? "Unlocked" : theme.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <Button onClick={handleSaveSettings} className="h-11 bg-[#7fa650] px-6 text-white hover:bg-[#90b862]">
                      Save Changes
                    </Button>
                  </div>
                </ShellCard>
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-6">
            <ShellCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
                  <p className="mt-1 text-sm text-[#a0a7b2]">Snapshot across the main formats.</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#d0d6de]">
                  Peak {formatMetric(profile.rating)}
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <QuickMetric label="Rapid" value={formatMetric(profile.stats.rapid)} icon={Clock3} />
                <QuickMetric label="Blitz" value={formatMetric(profile.stats.blitz)} icon={Zap} />
                <QuickMetric label="Bullet" value={formatMetric(profile.stats.bullet)} icon={Flame} />
                <QuickMetric label="Puzzle" value={formatMetric(profile.stats.puzzle)} icon={Puzzle} />
              </div>
            </ShellCard>

            <ShellCard>
              <h3 className="text-lg font-semibold text-white">Activity</h3>
              <p className="mt-1 text-sm text-[#a0a7b2]">Recent real activity over the last 42 days.</p>
              <div className="mt-5 grid grid-cols-7 gap-2">
                {heatmap.map((cell) => (
                  <div
                    key={cell.id}
                    title={cell.label}
                    className={cn(
                      "aspect-square rounded-[8px] border border-white/6",
                      cell.value === 0 && "bg-white/[0.04]",
                      cell.value === 1 && "bg-[#2e4b1b]",
                      cell.value === 2 && "bg-[#4f7c2f]",
                      cell.value >= 3 && "bg-[#90c15b]",
                    )}
                  />
                ))}
              </div>
            </ShellCard>

            <ShellCard>
              <h3 className="text-lg font-semibold text-white">Friends & Followers</h3>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <SmallStat label="Friends" value={friendStats.friends.toString()} />
                <SmallStat label="Followers" value={friendStats.followers.toString()} />
                <SmallStat label="Following" value={friendStats.following.toString()} />
              </div>
              <Button variant="outline" className="mt-4 h-10 w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                View Friends
              </Button>
            </ShellCard>

            <ShellCard>
              <h3 className="text-lg font-semibold text-white">Clubs</h3>
              <div className="mt-4">
                <EmptyState title="No clubs yet" description="Join a club and it will appear here." />
              </div>
            </ShellCard>

            <ShellCard>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="h-5 w-5 text-[#9fd76d]" />
                Study Rooms
              </h3>
              <p className="mt-1 text-sm text-[#a0a7b2]">Draft rooms created from your saved Game Reviews.</p>
              <div className="mt-4 space-y-3">
                {growthState.studyRooms.slice(0, 3).map((room) => (
                  <div key={room.id} className="rounded-[16px] border border-white/8 bg-[#15181e] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold text-white">{room.title}</p>
                      <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-[#d0d6de]">{room.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#a0a7b2]">{room.pgnPreview || "No PGN preview yet."}</p>
                  </div>
                ))}
                {growthState.studyRooms.length === 0 ? (
                  <EmptyState title="No study rooms yet" description="Run Game Review to create a share-ready study room draft." />
                ) : null}
              </div>
            </ShellCard>

            <ShellCard>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <div className="mt-4 space-y-3">
                {activities.length > 0 ? (
                  activities.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-[16px] border border-white/8 bg-[#15181e] p-4">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-[#7fa650]/20 bg-[#7fa650]/12 text-[#eaf5de]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-6 text-white">{item.message}</p>
                        <p className="mt-1 text-xs text-[#8a919b]">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No activity yet" description="Your recent games and puzzle events will appear here." />
                )}
              </div>
            </ShellCard>
          </aside>
        </div>
      </div>
    </div>
  );
}

function CoachOptionGroup({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a919b]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition",
              value === option
                ? "border-[#7fa650]/45 bg-[#7fa650]/14 text-white"
                : "border-white/10 bg-white/5 text-[#a0a7b2] hover:bg-white/10 hover:text-white",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7fa650]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
    </div>
  );
}

function MiniSparkline({ data }: { data: Array<{ rating: number }> }) {
  const values = data.slice(-8);

  if (values.length < 2) {
    return (
      <div className="mt-4 flex h-7 items-end gap-1 opacity-45">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className="flex-1 rounded-full bg-white/10" style={{ height: `${18 + (index % 3) * 10}%` }} />
        ))}
      </div>
    );
  }

  const min = Math.min(...values.map((item) => item.rating));
  const max = Math.max(...values.map((item) => item.rating));
  const range = Math.max(1, max - min);

  return (
    <div className="mt-4 flex h-7 items-end gap-1">
      {values.map((item, index) => (
        <span
          key={`${item.rating}-${index}`}
          className="flex-1 rounded-full bg-gradient-to-t from-[#6f9d46] to-[#b6ee82] shadow-[0_0_18px_rgba(158,219,107,0.18)]"
          style={{ height: `${28 + ((item.rating - min) / range) * 72}%` }}
        />
      ))}
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b8493]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">{value}</p>
    </div>
  );
}

function ShellCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/[0.07] bg-[#111923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ProfileAvatar({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-24 w-24 rounded-[26px] border border-white/10 object-cover shadow-xl shadow-black/20" />;
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(159,215,109,0.45),_rgba(127,166,80,0.22)_40%,_rgba(20,23,29,1)_100%)] text-3xl font-semibold text-white shadow-xl shadow-black/20">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d0d6de]">{label}</span>;
}

function ProfileMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-[#15181e] px-4 py-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a919b]">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accentClassName,
}: {
  label: string;
  value: string;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[#191c22] px-4 py-4 shadow-xl shadow-black/12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a919b]">{label}</p>
      <p className={cn("mt-3 text-[28px] font-semibold tracking-tight text-white", accentClassName)}>{value}</p>
    </div>
  );
}

function OverviewChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-[#191c22] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#7fa650]/20 bg-[#7fa650]/12 text-[#eaf5de]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a919b]">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value: number;
  valueLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-[#d0d6de]">{label}</span>
        <span className="text-[#8a919b]">{valueLabel}</span>
      </div>
      <Progress value={value} className="mt-2 h-2 bg-white/5" />
    </div>
  );
}

function MiniInsight({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-[#15181e] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a919b]">{title}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[#a0a7b2]">{description}</p>
    </div>
  );
}

function AchievementCard({
  title,
  description,
  progress,
  unlocked,
}: {
  title: string;
  description: string;
  progress: number;
  unlocked: boolean;
}) {
  return (
    <div className={cn("rounded-[20px] border p-4 shadow-xl shadow-black/12", unlocked ? "border-[#7fa650]/30 bg-[#7fa650]/10" : "border-white/8 bg-[#191c22]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <Trophy className="h-4 w-4" />
        </div>
        {unlocked ? <Crown className="h-4 w-4 text-[#9fd76d]" /> : <Lock className="h-4 w-4 text-[#7d8591]" />}
      </div>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#a0a7b2]">{description}</p>
      <Progress value={progress} className="mt-4 h-2 bg-white/5" />
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-[#d0d6de]">{label}</span>
      {children}
    </label>
  );
}

function QuickMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[16px] border border-white/8 bg-[#15181e] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#d0d6de]">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-[#d0d6de]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/8 bg-[#15181e] px-3 py-3 text-center">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-[#8a919b]">{label}</p>
    </div>
  );
}

function TrendingIcon() {
  return <Trophy className="h-4 w-4 text-[#7fa650]" />;
}
