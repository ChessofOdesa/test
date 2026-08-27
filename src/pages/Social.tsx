import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Flame,
  Flag,
  Gamepad2,
  ImagePlus,
  Mail,
  MessageSquare,
  Mic,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Smile,
  Sparkles,
  Swords,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PresenceStatus = "online" | "offline" | "idle" | "playing" | "analysis" | "tournament";
type SearchKind = "player" | "club" | "tournament" | "message";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  friendUserId: string;
  displayName: string;
  username: string;
  rating: number;
  title: string;
  country: string;
  avatarUrl: string | null;
  presence: PresenceStatus;
  activity: string;
  favoriteOpening: string;
  mutualFriends: number;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface ActivityItem {
  id: string;
  user_id: string;
  type: string;
  message: string;
  data: unknown;
  created_at: string;
  displayName?: string;
  avatarUrl?: string | null;
  presence?: PresenceStatus;
}

interface SearchResult {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  rating?: number;
  country?: string;
  avatar?: string | null;
  status?: PresenceStatus;
  mutual?: number;
}

const CLUB_CATEGORIES = ["Beginner", "Blitz", "Rapid", "Classical", "Tactics", "Openings", "Endgames", "School Clubs", "Local Clubs"];

const CLUBS = [
  {
    id: "odesa",
    name: "Odesa Chess Club",
    members: 1284,
    online: 86,
    category: "Local Clubs",
    language: "UA / EN",
    description: "Daily arenas, team matches, opening labs, and local club events.",
    accent: "#7fa650",
  },
  {
    id: "tactics",
    name: "Tactics Forge",
    members: 942,
    online: 64,
    category: "Tactics",
    language: "EN",
    description: "Fast tactical drills, puzzle races, and mistake repair sessions.",
    accent: "#f59e0b",
  },
  {
    id: "openings",
    name: "Opening Lab",
    members: 731,
    online: 41,
    category: "Openings",
    language: "EN / UA",
    description: "Build repertoires, review model games, and train weak lines.",
    accent: "#60a5fa",
  },
];

const TOURNAMENTS = [
  { id: "rapid", title: "Weekend Rapid Arena", format: "10+0 Swiss", players: 214, avgRating: 1640, startsIn: "18:42", live: true },
  { id: "blitz", title: "Friday Blitz Cup", format: "3+2 Arena", players: 96, avgRating: 1510, startsIn: "2h 15m", live: false },
  { id: "school", title: "School Clubs Battle", format: "5+0 Teams", players: 348, avgRating: 1320, startsIn: "Tomorrow", live: false },
];

const CHAT_PREVIEWS = [
  { id: "coach", name: "Coach Max", message: "I marked two tactical themes from your last review.", unread: 2, status: "analysis" as PresenceStatus },
  { id: "club", name: "Odesa Chess Club", message: "Team match board order is ready.", unread: 5, status: "tournament" as PresenceStatus },
  { id: "anna", name: "Anna", message: "Want to play 10+0 later?", unread: 0, status: "online" as PresenceStatus },
];

const STATUS_META: Record<PresenceStatus, { label: string; className: string; tooltip: string }> = {
  online: { label: "Online", className: "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]", tooltip: "Online" },
  offline: { label: "Offline", className: "bg-slate-500", tooltip: "Last seen 2 min ago" },
  idle: { label: "Idle", className: "bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.85)]", tooltip: "Idle" },
  playing: { label: "Playing", className: "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.85)]", tooltip: "Playing Blitz" },
  analysis: { label: "Analyzing", className: "bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.85)]", tooltip: "Analyzing Game" },
  tournament: { label: "Tournament", className: "bg-yellow-300 shadow-[0_0_14px_rgba(253,224,71,0.9)]", tooltip: "In a tournament" },
};

function stablePresence(seed: string): PresenceStatus {
  const values: PresenceStatus[] = ["online", "offline", "idle", "playing", "analysis", "tournament"];
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return values[total % values.length];
}

function getTitle(rating: number) {
  if (rating >= 2500) return "GM";
  if (rating >= 2400) return "IM";
  if (rating >= 2300) return "FM";
  return "Player";
}

function getCountryFlag(country?: string) {
  const normalized = (country || "").toLowerCase();
  if (normalized.includes("ukraine")) return "🇺🇦";
  if (normalized.includes("poland")) return "🇵🇱";
  if (normalized.includes("germany")) return "🇩🇪";
  if (normalized.includes("usa") || normalized.includes("united")) return "🇺🇸";
  return "🌐";
}

export default function Social() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeClubId, setActiveClubId] = useState(CLUBS[0].id);
  const [likedActivity, setLikedActivity] = useState<Record<string, string>>({});
  const [clubMessage, setClubMessage] = useState("");

  const activeClub = CLUBS.find((club) => club.id === activeClubId) || CLUBS[0];
  const unreadCount = notifications.filter((item) => !item.read).length + CHAT_PREVIEWS.reduce((sum, chat) => sum + chat.unread, 0);
  const currentUserName = user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";

  const loadData = async () => {
    if (!user) return;

    const { data: friendData } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");

    if (friendData?.length) {
      const friendUserIds = friendData.map((friend) => (friend.user_id === user.id ? friend.friend_id : friend.user_id));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, rating_rapid, rating_blitz, rating_bullet")
        .in("user_id", friendUserIds);

      const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      setFriends(
        friendData.map((friend, index) => {
          const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
          const profile = profileMap.get(friendUserId);
          const rating = profile?.rating_rapid || profile?.rating_blitz || profile?.rating_bullet || 1200 + index * 37;
          return {
            ...friend,
            friendUserId,
            displayName: profile?.display_name || profile?.username || "Chess friend",
            username: profile?.username || `player_${index + 1}`,
            avatarUrl: profile?.avatar_url || null,
            rating,
            title: getTitle(rating),
            country: "Unknown",
            presence: stablePresence(friendUserId),
            activity: ["Reviewing a game", "Playing Blitz", "Solving tactics", "Browsing openings"][index % 4],
            favoriteOpening: ["Sicilian Defense", "Queen's Gambit", "London System", "Caro-Kann"][index % 4],
            mutualFriends: 2 + (index % 5),
          };
        }),
      );
    } else {
      setFriends([]);
    }

    const { data: incomingData } = await supabase
      .from("friends")
      .select("*")
      .eq("friend_id", user.id)
      .eq("status", "pending");

    if (incomingData?.length) {
      const ids = incomingData.map((friend) => friend.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, rating_rapid")
        .in("user_id", ids);
      const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      setIncoming(
        incomingData.map((friend, index) => {
          const profile = profileMap.get(friend.user_id);
          const rating = profile?.rating_rapid || 1300 + index * 41;
          return {
            ...friend,
            friendUserId: friend.user_id,
            displayName: profile?.display_name || profile?.username || "Chess player",
            username: profile?.username || `request_${index + 1}`,
            avatarUrl: profile?.avatar_url || null,
            rating,
            title: getTitle(rating),
            country: "Unknown",
            presence: stablePresence(friend.user_id),
            activity: "Wants to connect",
            favoriteOpening: "Italian Game",
            mutualFriends: 1 + index,
          };
        }),
      );
    } else {
      setIncoming([]);
    }

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(notifs || []);

    const { data: actData } = await supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (actData?.length) {
      const ids = [...new Set(actData.map((item) => item.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
      setActivity(
        actData.map((item) => {
          const profile = profileMap.get(item.user_id);
          return {
            ...item,
            displayName: profile?.display_name || "Chess player",
            avatarUrl: profile?.avatar_url || null,
            presence: stablePresence(item.user_id),
          };
        }),
      );
    } else {
      setActivity([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("community-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => void loadData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_feed" }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void searchCommunity(searchQuery);
    }, 240);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  const searchCommunity = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const localResults: SearchResult[] = [
      ...CLUBS.filter((club) => club.name.toLowerCase().includes(trimmed.toLowerCase())).map((club) => ({
        id: club.id,
        kind: "club" as SearchKind,
        title: club.name,
        subtitle: `${club.members} members • ${club.category}`,
        status: "online" as PresenceStatus,
        mutual: club.online,
      })),
      ...TOURNAMENTS.filter((event) => event.title.toLowerCase().includes(trimmed.toLowerCase())).map((event) => ({
        id: event.id,
        kind: "tournament" as SearchKind,
        title: event.title,
        subtitle: `${event.format} • ${event.players} players`,
        rating: event.avgRating,
        status: event.live ? ("tournament" as PresenceStatus) : ("idle" as PresenceStatus),
      })),
      ...CHAT_PREVIEWS.filter((chat) => chat.name.toLowerCase().includes(trimmed.toLowerCase()) || chat.message.toLowerCase().includes(trimmed.toLowerCase())).map((chat) => ({
        id: chat.id,
        kind: "message" as SearchKind,
        title: chat.name,
        subtitle: chat.message,
        status: chat.status,
      })),
    ];

    if (!user) {
      setSearchResults(localResults);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url, rating_rapid, rating_blitz")
      .ilike("display_name", `%${trimmed}%`)
      .limit(8);

    const playerResults: SearchResult[] = (data || [])
      .filter((profile) => profile.user_id !== user.id)
      .map((profile, index) => ({
        id: profile.user_id,
        kind: "player",
        title: profile.display_name || profile.username || "Chess player",
        subtitle: `${2 + index} mutual friends`,
        rating: profile.rating_rapid || profile.rating_blitz || 1200,
        country: "Unknown",
        avatar: profile.avatar_url || null,
        status: stablePresence(profile.user_id),
        mutual: 2 + index,
      }));

    setSearchResults([...playerResults, ...localResults].slice(0, 10));
  };

  const sendRequest = async (friendId: string) => {
    if (!user) return;
    const { error } = await supabase.from("friends").insert({ user_id: user.id, friend_id: friendId });
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Friend request sent.");
    setSearchResults([]);
    setSearchQuery("");
  };

  const acceptRequest = async (id: string, fromUserId: string) => {
    await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    toast.success("Friend added.");
    void loadData();
  };

  const declineRequest = async (id: string) => {
    await supabase.from("friends").delete().eq("id", id);
    toast.info("Friend request declined.");
    void loadData();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    void loadData();
  };

  const handleCreateClub = () => toast.info("Club creation modal will use the same card system in the next step.");
  const handleJoinClub = (clubName: string) => toast.success(`Joined ${clubName}.`);
  const handleChallenge = (name: string) => toast.success(`Challenge sent to ${name}.`);
  const handleClubMessage = () => {
    if (!clubMessage.trim()) return;
    toast.success("Message posted to club chat.");
    setClubMessage("");
  };

  const liveActivity = useMemo(() => {
    if (activity.length > 0) return activity;
    return [
      { id: "a1", user_id: "alex", type: "game", message: "won a Blitz game", data: null, created_at: new Date().toISOString(), displayName: "Alex", presence: "playing" as PresenceStatus },
      { id: "a2", user_id: "anna", type: "rating", message: "reached 2000 rapid", data: null, created_at: new Date().toISOString(), displayName: "Anna", presence: "online" as PresenceStatus },
      { id: "a3", user_id: "mike", type: "club", message: "joined Opening Lab", data: null, created_at: new Date().toISOString(), displayName: "Mike", presence: "tournament" as PresenceStatus },
    ];
  }, [activity]);

  if (!user) {
    return (
      <div className="grid min-h-full place-items-center px-4 py-10 text-white">
        <div className="max-w-lg rounded-[32px] border border-white/[0.08] bg-[#101923]/82 p-8 text-center shadow-[0_26px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
          <Users className="mx-auto h-12 w-12 text-[#7fa650]" />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Join the community</h1>
          <p className="mt-3 text-sm leading-7 text-[#aeb7c6]">Log in to add friends, join clubs, receive messages, and follow tournament activity.</p>
          <Button asChild className="mt-6 rounded-2xl bg-[#7fa650] text-white hover:bg-[#8fba5c]">
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1520px] space-y-6">
        <CommunityHeader
          query={searchQuery}
          setQuery={setSearchQuery}
          results={searchResults}
          unreadCount={unreadCount}
          currentUserName={currentUserName}
          onAddFriend={() => searchQuery ? void searchCommunity(searchQuery) : toast.info("Type a username in search first.")}
          onCreateClub={handleCreateClub}
          onNotificationClick={() => notifications[0] ? void markRead(notifications[0].id) : toast.info("No unread notifications.")}
          onMessageClick={() => navigate("/messages")}
          onSendRequest={sendRequest}
        />

        <section className="grid gap-4 lg:grid-cols-4">
          <CommunityMetric label="Friends online" value={`${friends.filter((friend) => friend.presence !== "offline").length}/${friends.length}`} icon={<Users className="h-4 w-4" />} />
          <CommunityMetric label="Unread" value={unreadCount.toString()} icon={<Bell className="h-4 w-4" />} glow={unreadCount > 0} />
          <CommunityMetric label="Live clubs" value={CLUBS.length.toString()} icon={<ShieldCheck className="h-4 w-4" />} />
          <CommunityMetric label="Tournaments" value={TOURNAMENTS.length.toString()} icon={<Trophy className="h-4 w-4" />} />
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <main className="space-y-6">
            <Tabs defaultValue="friends" className="space-y-5">
              <TabsList className="inline-flex h-12 rounded-full border border-white/10 bg-white/[0.045] p-1 backdrop-blur-xl">
                <TabsTrigger value="friends" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-[#0c1118]">Friends</TabsTrigger>
                <TabsTrigger value="feed" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-[#0c1118]">Live Feed</TabsTrigger>
                <TabsTrigger value="clubs" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-[#0c1118]">Clubs</TabsTrigger>
                <TabsTrigger value="tournaments" className="rounded-full px-5 data-[state=active]:bg-white data-[state=active]:text-[#0c1118]">Tournaments</TabsTrigger>
              </TabsList>

              <TabsContent value="friends" className="space-y-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  {(friends.length > 0 ? friends : incoming).map((friend) => (
                    <FriendCard
                      key={friend.id}
                      friend={friend}
                      onMessage={() => navigate("/messages")}
                      onChallenge={() => handleChallenge(friend.displayName)}
                      onInvite={() => toast.success(`${friend.displayName} invited to ${activeClub.name}.`)}
                    />
                  ))}
                </div>
                {friends.length === 0 && incoming.length === 0 ? (
                  <PremiumEmpty title="Build your chess network" text="Search for players, add friends, and your premium friend cards will appear here." />
                ) : null}
              </TabsContent>

              <TabsContent value="feed">
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {liveActivity.map((item) => (
                      <ActivityCard key={item.id} item={item} reaction={likedActivity[item.id]} onReact={(reaction) => setLikedActivity((current) => ({ ...current, [item.id]: reaction }))} />
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="clubs">
                <div className="mb-4 flex flex-wrap gap-2">
                  {CLUB_CATEGORIES.map((category) => (
                    <span key={category} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#aeb7c6]">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {CLUBS.map((club) => (
                    <ClubCard key={club.id} club={club} active={club.id === activeClubId} onOpen={() => setActiveClubId(club.id)} onJoin={() => handleJoinClub(club.name)} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tournaments">
                <div className="grid gap-4 lg:grid-cols-3">
                  {TOURNAMENTS.map((event) => (
                    <TournamentCard key={event.id} event={event} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <ClubWorkspace club={activeClub} message={clubMessage} setMessage={setClubMessage} onSend={handleClubMessage} />
          </main>

          <aside className="space-y-5">
            <MessagesPanel />
            <NotificationsPanel notifications={notifications} onRead={markRead} />
            <FriendRequestsPanel requests={incoming} onAccept={acceptRequest} onDecline={declineRequest} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function CommunityHeader({
  query,
  setQuery,
  results,
  unreadCount,
  currentUserName,
  onAddFriend,
  onCreateClub,
  onNotificationClick,
  onMessageClick,
  onSendRequest,
}: {
  query: string;
  setQuery: (value: string) => void;
  results: SearchResult[];
  unreadCount: number;
  currentUserName: string;
  onAddFriend: () => void;
  onCreateClub: () => void;
  onNotificationClick: () => void;
  onMessageClick: () => void;
  onSendRequest: (id: string) => void;
}) {
  return (
    <section className="relative rounded-[34px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_26px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="min-w-[190px]">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#7fa650]">Community</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em] text-white">Chess network</h1>
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7f8898]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players, clubs, tournaments, messages..."
            className="h-14 rounded-[22px] border-white/10 bg-white/[0.055] pl-13 text-base text-white placeholder:text-[#6f7887] focus-visible:ring-[#7fa650]/35"
          />
          <AnimatePresence>
            {results.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                className="absolute left-0 right-0 top-[calc(100%+10px)] z-40 overflow-hidden rounded-[24px] border border-white/10 bg-[#0f1722]/96 p-2 shadow-2xl shadow-black/45 backdrop-blur-2xl"
              >
                {results.map((result) => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    type="button"
                    onClick={() => result.kind === "player" ? onSendRequest(result.id) : undefined}
                    className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.07]"
                  >
                    <Avatar name={result.title} src={result.avatar} status={result.status || "online"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-white">{result.title}</p>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa4b3]">{result.kind}</span>
                      </div>
                      <p className="truncate text-xs text-[#8792a2]">{result.subtitle}</p>
                    </div>
                    <div className="text-right">
                      {result.rating ? <p className="text-sm font-semibold text-[#c8ef9c]">{result.rating}</p> : null}
                      {result.mutual ? <p className="text-[11px] text-[#7f8898]">{result.mutual} mutual</p> : null}
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onAddFriend} className="h-12 rounded-2xl bg-[#7fa650] px-4 text-white hover:bg-[#8fba5c]">
            <UserPlus className="mr-2 h-4 w-4" />
            Додати друга
          </Button>
          <Button onClick={onCreateClub} variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/[0.05] px-4 text-white hover:bg-white/[0.09] hover:text-white">
            <Plus className="mr-2 h-4 w-4" />
            Створити клуб
          </Button>
          <IconButton onClick={onMessageClick} label="Messages" icon={<MessageSquare className="h-5 w-5" />} badge={unreadCount} />
          <IconButton onClick={onNotificationClick} label="Notifications" icon={<Bell className="h-5 w-5" />} badge={unreadCount} />
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3">
            <Avatar name={currentUserName} status="online" />
            <span className="hidden max-w-[110px] truncate text-sm font-semibold text-white sm:block">{currentUserName}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommunityMetric({ label, value, icon, glow }: { label: string; value: string; icon: ReactNode; glow?: boolean }) {
  return (
    <div className={cn("rounded-[24px] border border-white/[0.07] bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl", glow && "border-[#7fa650]/35 shadow-[0_0_36px_rgba(127,166,80,0.15)]")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f8898]">{label}</p>
        <span className="text-[#bce88e]">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function IconButton({ icon, label, badge, onClick }: { icon: ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#d8e0eb] transition hover:-translate-y-0.5 hover:border-[#7fa650]/35 hover:bg-white/[0.09]"
    >
      {icon}
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-[#7fa650] px-1 text-[10px] font-bold text-white shadow-[0_0_18px_rgba(127,166,80,0.7)]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Avatar({ name, src, status = "online", size = "md" }: { name: string; src?: string | null; status?: PresenceStatus; size?: "md" | "lg" }) {
  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={name} className={cn("rounded-2xl object-cover", size === "lg" ? "h-16 w-16" : "h-11 w-11")} />
      ) : (
        <div className={cn("grid rounded-2xl bg-[radial-gradient(circle_at_top,rgba(127,166,80,0.5),rgba(16,25,35,0.95))] font-bold text-white", size === "lg" ? "h-16 w-16 place-items-center text-xl" : "h-11 w-11 place-items-center")}>
          {name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <StatusDot status={status} className="absolute -bottom-1 -right-1" />
    </div>
  );
}

function StatusDot({ status, className }: { status: PresenceStatus; className?: string }) {
  const meta = STATUS_META[status];
  return <span title={meta.tooltip} className={cn("h-3.5 w-3.5 rounded-full border-2 border-[#101923] motion-safe:animate-pulse", meta.className, className)} />;
}

function FriendCard({ friend, onMessage, onChallenge, onInvite }: { friend: Friend; onMessage: () => void; onChallenge: () => void; onInvite: () => void }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="group relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#7fa650]/35">
      <MiniProfilePopup friend={friend} />
      <div className="flex gap-4">
        <Avatar name={friend.displayName} src={friend.avatarUrl} status={friend.presence} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-white">{friend.displayName}</h3>
            <span className="rounded-full bg-[#7fa650]/15 px-2 py-1 text-[10px] font-bold text-[#c8ef9c]">{friend.title}</span>
            <ShieldCheck className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-1 text-sm text-[#9aa4b3]">@{friend.username} • {getCountryFlag(friend.country)} {friend.country}</p>
          <p className="mt-3 text-sm text-[#d8e0eb]">{STATUS_META[friend.presence].label}: {friend.activity}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#9aa4b3]">
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1">Rating {friend.rating}</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1">{friend.favoriteOpening}</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1">{friend.mutualFriends} mutual</span>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <ActionButton icon={<MessageSquare className="h-4 w-4" />} label="Message" onClick={onMessage} primary />
        <ActionButton icon={<Swords className="h-4 w-4" />} label="Challenge" onClick={onChallenge} />
        <ActionButton icon={<Users className="h-4 w-4" />} label="Profile" onClick={() => toast.info("Opening profile preview.")} />
        <ActionButton icon={<UserPlus className="h-4 w-4" />} label="Invite" onClick={onInvite} />
        <ActionButton icon={<X className="h-4 w-4" />} label="Remove" onClick={() => toast.info("Remove friend flow ready.")} danger />
      </div>
    </motion.article>
  );
}

function MiniProfilePopup({ friend }: { friend: Friend }) {
  return (
    <div className="pointer-events-none absolute left-5 top-5 z-20 w-[300px] translate-y-2 rounded-[24px] border border-white/10 bg-[#0f1722]/96 p-4 opacity-0 shadow-2xl shadow-black/50 backdrop-blur-2xl transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
      <div className="flex items-center gap-3">
        <Avatar name={friend.displayName} src={friend.avatarUrl} status={friend.presence} />
        <div>
          <p className="font-semibold text-white">{friend.displayName}</p>
          <p className="text-xs text-[#8792a2]">Rapid {friend.rating} • Blitz {Math.max(900, friend.rating - 70)}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#c7d0dc]">Aggressive tactical player. Streak 5 days. Favorite opening: {friend.favoriteOpening}.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="rounded-xl bg-[#7fa650] px-3 py-2 text-xs font-bold text-white">Message</button>
        <button className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white">Challenge</button>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, primary, danger }: { icon: ReactNode; label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border px-3 py-2.5 text-xs font-bold transition active:scale-95",
        primary && "border-[#7fa650]/40 bg-[#7fa650]/18 text-[#e9f8d8] shadow-[0_0_24px_rgba(127,166,80,0.12)] hover:bg-[#7fa650]/25",
        !primary && !danger && "border-white/[0.08] bg-white/[0.045] text-[#d8e0eb] hover:border-[#7fa650]/28 hover:bg-white/[0.08]",
        danger && "border-rose-300/15 bg-rose-400/8 text-rose-100 hover:bg-rose-400/12",
      )}
    >
      <span className="flex items-center justify-center gap-1.5">{icon}{label}</span>
    </button>
  );
}

function ActivityCard({ item, reaction, onReact }: { item: ActivityItem; reaction?: string; onReact: (reaction: string) => void }) {
  return (
    <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-[26px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex gap-4">
        <Avatar name={item.displayName || "Player"} src={item.avatarUrl} status={item.presence || "online"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{item.displayName}</p>
            <p className="text-sm text-[#aeb7c6]">{item.message}</p>
          </div>
          <p className="mt-1 text-xs text-[#7f8898]">{new Date(item.created_at).toLocaleString("uk-UA")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["👍", "🔥", "♟️", "👏"].map((emoji) => (
              <button key={emoji} type="button" onClick={() => onReact(emoji)} className={cn("rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm transition hover:scale-105 hover:bg-white/[0.08]", reaction === emoji && "border-[#7fa650]/40 bg-[#7fa650]/15")}>{emoji}</button>
            ))}
            <button className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#9aa4b3] hover:bg-white/[0.06]"><MessageSquare className="h-3.5 w-3.5" /> Comment</button>
            <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[#9aa4b3] hover:bg-white/[0.06]"><Share2 className="h-3.5 w-3.5" /> Share</button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function ClubCard({ club, active, onOpen, onJoin }: { club: (typeof CLUBS)[number]; active: boolean; onOpen: () => void; onJoin: () => void }) {
  return (
    <article className={cn("overflow-hidden rounded-[28px] border bg-[#101923]/82 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1", active ? "border-[#7fa650]/45" : "border-white/[0.08]")}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="h-24 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,var(--club-accent),rgba(16,25,35,0.94))]" style={{ "--club-accent": club.accent } as CSSProperties} />
        <div className="p-5">
          <div className="-mt-12 mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#0f1722] text-2xl shadow-xl">♞</div>
          <h3 className="text-lg font-semibold text-white">{club.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[#9aa4b3]">{club.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[#cbd4df]">{club.members} members</span>
            <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-emerald-200">{club.online} online</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[#cbd4df]">{club.category}</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[#cbd4df]">{club.language}</span>
          </div>
        </div>
      </button>
      <div className="border-t border-white/[0.07] p-4">
        <Button onClick={onJoin} className="h-10 w-full rounded-2xl bg-[#7fa650] text-white hover:bg-[#8fba5c]">Join</Button>
      </div>
    </article>
  );
}

function TournamentCard({ event }: { event: (typeof TOURNAMENTS)[number] }) {
  return (
    <article className={cn("rounded-[28px] border bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl", event.live ? "border-[#7fa650]/45 shadow-[0_0_44px_rgba(127,166,80,0.13)]" : "border-white/[0.08]")}>
      <div className="flex items-center justify-between">
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]", event.live ? "bg-[#7fa650]/18 text-[#c8ef9c]" : "bg-white/[0.06] text-[#9aa4b3]")}>{event.live ? "Live" : "Upcoming"}</span>
        <Trophy className="h-5 w-5 text-amber-200" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{event.title}</h3>
      <p className="mt-2 text-sm text-[#9aa4b3]">{event.format} • avg {event.avgRating}</p>
      <p className="mt-2 text-sm text-[#d8e0eb]">{event.players} players • starts {event.startsIn}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <ActionButton icon={<Zap className="h-4 w-4" />} label="Join" onClick={() => toast.success(`Joined ${event.title}.`)} primary />
        <ActionButton icon={<Share2 className="h-4 w-4" />} label="Share" onClick={() => toast.success("Tournament link copied.")} />
      </div>
    </article>
  );
}

function ClubWorkspace({ club, message, setMessage, onSend }: { club: (typeof CLUBS)[number]; message: string; setMessage: (value: string) => void; onSend: () => void }) {
  return (
    <section className="rounded-[30px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7fa650]">Club page</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">{club.name}</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#9aa4b3]">
          <Mic className="h-4 w-4 text-[#7fa650]" />
          Voice room 4 active
        </div>
      </div>

      <Tabs defaultValue="chat" className="mt-5">
        <TabsList className="flex h-auto flex-wrap justify-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
          {["Overview", "Members", "Chat", "Tournaments", "Lessons", "Announcements", "Club Matches"].map((tab) => (
            <TabsTrigger key={tab} value={tab.toLowerCase().replace(/\s+/g, "-")} className="rounded-xl px-3 py-2 text-xs data-[state=active]:bg-white data-[state=active]:text-[#0c1118]">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="chat" className="mt-5">
          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.035] p-4">
            <div className="mb-4 rounded-2xl border border-[#7fa650]/20 bg-[#7fa650]/10 p-3 text-sm text-[#dff5c7]">
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Pinned: Share PGN/FEN cards here for club review nights.
            </div>
            <div className="space-y-3">
              <ChatBubble name="Anna" text="Anyone wants a Sicilian review room tonight?" status="online" />
              <ChatBubble name="Coach Max" text="Typing..." status="analysis" typing />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-[#d8e0eb]"><Smile className="h-4 w-4" /></button>
              <button className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 text-[#d8e0eb]"><ImagePlus className="h-4 w-4" /></button>
              <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write a club message or paste PGN/FEN..." className="h-11 rounded-2xl border-white/10 bg-white/[0.04] text-white placeholder:text-[#6f7887]" />
              <Button onClick={onSend} className="h-11 rounded-2xl bg-[#7fa650] px-4 text-white hover:bg-[#8fba5c]"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="overview" className="mt-5 text-sm leading-7 text-[#aeb7c6]">
          {club.description} Members can share games, join club matches, and follow announcements from moderators.
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ChatBubble({ name, text, status, typing }: { name: string; text: string; status: PresenceStatus; typing?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar name={name} status={status} />
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.05] px-4 py-3">
        <p className="text-sm font-semibold text-white">{name}</p>
        {typing ? (
          <div className="mt-2 flex gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7fa650]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7fa650] [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#7fa650] [animation-delay:240ms]" />
          </div>
        ) : (
          <p className="mt-1 text-sm text-[#c7d0dc]">{text}</p>
        )}
      </div>
    </div>
  );
}

function MessagesPanel() {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Messages</h2>
        <Mail className="h-5 w-5 text-[#7fa650]" />
      </div>
      <div className="mt-4 space-y-3">
        {CHAT_PREVIEWS.map((chat) => (
          <button key={chat.id} className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.07]">
            <Avatar name={chat.name} status={chat.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{chat.name}</p>
              <p className="truncate text-xs text-[#8792a2]">{chat.message}</p>
            </div>
            {chat.unread > 0 ? <span className="flex h-6 min-w-6 animate-pulse items-center justify-center rounded-full bg-[#7fa650] px-1 text-xs font-bold text-white">{chat.unread}</span> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function NotificationsPanel({ notifications, onRead }: { notifications: Notification[]; onRead: (id: string) => void }) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <Bell className="h-5 w-5 text-[#7fa650]" />
      </div>
      <div className="mt-4 space-y-3">
        {notifications.length > 0 ? notifications.slice(0, 5).map((notification) => (
          <button key={notification.id} onClick={() => onRead(notification.id)} className={cn("flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:bg-white/[0.07]", notification.read ? "border-white/[0.07] bg-white/[0.035]" : "border-[#7fa650]/25 bg-[#7fa650]/10")}>
            <Sparkles className="mt-0.5 h-4 w-4 text-[#bce88e]" />
            <div>
              <p className="text-sm text-[#d8e0eb]">{notification.message}</p>
              <p className="mt-1 text-xs text-[#7f8898]">{new Date(notification.created_at).toLocaleString("uk-UA")}</p>
            </div>
          </button>
        )) : (
          <PremiumEmpty title="No notifications" text="Friend requests, club invites, challenges, and mentions will appear here." />
        )}
      </div>
    </section>
  );
}

function FriendRequestsPanel({ requests, onAccept, onDecline }: { requests: Friend[]; onAccept: (id: string, fromUserId: string) => void; onDecline: (id: string) => void }) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-white">Friend requests</h2>
      <div className="mt-4 space-y-3">
        {requests.length > 0 ? requests.map((request) => (
          <div key={request.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <Avatar name={request.displayName} src={request.avatarUrl} status={request.presence} />
              <div>
                <p className="font-semibold text-white">{request.displayName}</p>
                <p className="text-xs text-[#8792a2]">{request.rating} • {request.mutualFriends} mutual</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => onAccept(request.id, request.friendUserId)} className="rounded-xl bg-[#7fa650] text-white hover:bg-[#8fba5c]"><Check className="mr-1 h-3.5 w-3.5" />Accept</Button>
              <Button size="sm" variant="outline" onClick={() => onDecline(request.id)} className="rounded-xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white"><X className="mr-1 h-3.5 w-3.5" />Decline</Button>
            </div>
          </div>
        )) : (
          <PremiumEmpty title="No pending requests" text="Incoming friend requests will appear here with one-click actions." />
        )}
      </div>
    </section>
  );
}

function PremiumEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.03] p-5 text-center">
      <Bot className="mx-auto h-5 w-5 text-[#7fa650]" />
      <p className="mt-2 text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#8792a2]">{text}</p>
    </div>
  );
}
