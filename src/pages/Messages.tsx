import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Archive,
  BellOff,
  Bot,
  ChevronDown,
  Copy,
  CornerUpLeft,
  Crown,
  FileText,
  Flag,
  FolderKanban,
  Forward,
  Image,
  Info,
  Link2,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  Pin,
  Search,
  Send,
  Smile,
  Sparkles,
  Swords,
  Trash2,
  UserMinus,
  Users,
  Video,
} from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ConversationFilter = "all" | "direct" | "groups" | "clubs" | "requests" | "archived";
type ConversationKind = "direct" | "group" | "club" | "request" | "archived";
type ConversationBadge = "Coach" | "Club" | "Tournament" | "Friend" | "Team";
type MessageType = "text" | "pgn" | "fen" | "game" | "file" | "system" | "poll" | "link" | "voice";

type ChatMessage = {
  id: string;
  sender: "me" | "other" | "system";
  senderName: string;
  type: MessageType;
  text: string;
  time: string;
  reactions?: string[];
  replyTo?: string;
  edited?: boolean;
  read?: boolean;
  pgn?: string;
  fen?: string;
  fileName?: string;
  url?: string;
  pollOptions?: string[];
};

type Conversation = {
  id: string;
  name: string;
  role: string;
  kind: ConversationKind;
  badge?: ConversationBadge;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  typing?: boolean;
  status: string;
  rating: number;
  note: string;
  commonClubs: string[];
  mutualFriends: number;
  recentGames: string[];
  sharedFiles: string[];
  sharedPositions: string[];
  description: string;
  messages: ChatMessage[];
};

const FILTERS: Array<{ value: ConversationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "direct", label: "Direct" },
  { value: "groups", label: "Groups" },
  { value: "clubs", label: "Clubs" },
  { value: "requests", label: "Requests" },
  { value: "archived", label: "Archived" },
];

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: "coach-olena",
    name: "Coach Olena",
    role: "Coach",
    kind: "direct",
    badge: "Coach",
    avatar: "O",
    preview: "Your last move improved central control. Nice choice.",
    time: "2m",
    unread: 2,
    online: true,
    pinned: true,
    muted: false,
    archived: false,
    status: "Typing now",
    rating: 2120,
    note: "Strategic coach and rapid specialist.",
    commonClubs: ["Kyiv Rapid Club", "Endgame Study Group"],
    mutualFriends: 7,
    recentGames: ["Rapid win vs 1840", "Lesson review: Italian Game"],
    sharedFiles: ["Training-plan.pdf", "week-4-notes.pgn"],
    sharedPositions: ["Italian middlegame squeeze", "Knight endgame study"],
    description: "Private coaching room with annotated lines and plan reviews.",
    messages: [
      {
        id: "m1",
        sender: "other",
        senderName: "Coach Olena",
        type: "text",
        text: "I reviewed your last rapid game. Your opening was stable, but the transition to the middlegame was too passive.",
        time: "09:14",
        reactions: ["👍"],
      },
      {
        id: "m2",
        sender: "other",
        senderName: "Coach Olena",
        type: "pgn",
        text: "Here is the critical sequence from move 17 onward.",
        time: "09:15",
        pgn: '[Event "Training Review"] 1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6',
      },
      {
        id: "m3",
        sender: "me",
        senderName: "You",
        type: "fen",
        text: "Is this the position where I should have played c3 first?",
        time: "09:17",
        fen: "r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BPP1N1P/PP3PP1/RNBQR1K1 w - - 0 10",
        read: true,
      },
      {
        id: "m4",
        sender: "other",
        senderName: "Coach Olena",
        type: "game",
        text: "Yes, and the engine prefers a flexible setup before committing the bishop.",
        time: "09:18",
        reactions: ["♟️", "🔥"],
      },
    ],
  },
  {
    id: "club-night",
    name: "Night Tactics Club",
    role: "Club chat",
    kind: "club",
    badge: "Club",
    avatar: "N",
    preview: "Tonight's arena starts in 45 minutes. Pairings are posted.",
    time: "11m",
    unread: 4,
    online: true,
    pinned: false,
    muted: false,
    archived: false,
    status: "48 members online",
    rating: 1760,
    note: "Club announcements and arena coordination.",
    commonClubs: ["Night Tactics Club"],
    mutualFriends: 19,
    recentGames: ["Arena round 4", "Arena round 5"],
    sharedFiles: ["arena-pairings.csv"],
    sharedPositions: ["Mate in 3 puzzle", "Sharp Sicilian fragment"],
    description: "Fast club coordination, pairings, and tactical challenge drops.",
    messages: [
      {
        id: "c1",
        sender: "system",
        senderName: "System",
        type: "system",
        text: "Pinned message updated by admin.",
        time: "Yesterday",
      },
      {
        id: "c2",
        sender: "other",
        senderName: "Club Admin",
        type: "link",
        text: "Round board assignments are live. Open the event page for pairings and standings.",
        time: "08:04",
        url: "club://night-tactics/arena-24",
      },
      {
        id: "c3",
        sender: "other",
        senderName: "Club Admin",
        type: "poll",
        text: "Choose the next training theme:",
        time: "08:07",
        pollOptions: ["Opposite-side castling", "Minor-piece endgames", "Conversion from +1.5"],
      },
    ],
  },
  {
    id: "arbiter-group",
    name: "Spring Open Team",
    role: "Tournament participants",
    kind: "group",
    badge: "Tournament",
    avatar: "S",
    preview: "Bring your PGNs after round 6 for appeal review.",
    time: "1h",
    unread: 0,
    online: false,
    pinned: true,
    muted: true,
    archived: false,
    status: "Last seen 18 minutes ago",
    rating: 1895,
    note: "Tournament team room for logistics and analysis sharing.",
    commonClubs: ["Odesa Open League"],
    mutualFriends: 12,
    recentGames: ["Round 6 draw vs 1940"],
    sharedFiles: ["appeal-form.docx", "round-6-boards.pdf"],
    sharedPositions: ["Round 6 bishop sacrifice"],
    description: "Logistics, pairings, and post-round review for the Spring Open squad.",
    messages: [
      {
        id: "g1",
        sender: "other",
        senderName: "Arbiter",
        type: "file",
        text: "Appeal form uploaded for anyone who needs to document a dispute.",
        fileName: "appeal-form.docx",
        time: "Yesterday",
      },
      {
        id: "g2",
        sender: "me",
        senderName: "You",
        type: "voice",
        text: "Voice note: quick recap of my rook ending question.",
        time: "Yesterday",
        read: true,
      },
    ],
  },
  {
    id: "friend-max",
    name: "Max_K",
    role: "Friend",
    kind: "direct",
    badge: "Friend",
    avatar: "M",
    preview: "Want a 3+2 rematch from that position?",
    time: "3h",
    unread: 0,
    online: true,
    pinned: false,
    muted: false,
    archived: false,
    status: "Online",
    rating: 1682,
    note: "Blitz sparring partner.",
    commonClubs: ["Kyiv Blitz Hub"],
    mutualFriends: 4,
    recentGames: ["Blitz loss in 31 moves", "Puzzle race win"],
    sharedFiles: [],
    sharedPositions: ["Najdorf tactic", "French defense structure"],
    description: "Regular blitz sparring and quick opening prep.",
    messages: [
      {
        id: "f1",
        sender: "other",
        senderName: "Max_K",
        type: "text",
        text: "Want a 3+2 rematch from that position?",
        time: "12:22",
      },
    ],
  },
  {
    id: "request-anton",
    name: "AntonCM",
    role: "Message request",
    kind: "request",
    badge: "Coach",
    avatar: "A",
    preview: "Hi, I saw your rook endgame note. Can I send a study file?",
    time: "1d",
    unread: 1,
    online: false,
    pinned: false,
    muted: false,
    archived: false,
    status: "Message request",
    rating: 2050,
    note: "Awaiting approval.",
    commonClubs: ["Endgame Study Group"],
    mutualFriends: 2,
    recentGames: ["Study upload"],
    sharedFiles: ["rook-endgame-study.pgn"],
    sharedPositions: ["Lucena bridge build"],
    description: "New incoming message request from a titled player.",
    messages: [
      {
        id: "r1",
        sender: "other",
        senderName: "AntonCM",
        type: "text",
        text: "Hi, I saw your rook endgame note. Can I send a study file?",
        time: "Yesterday",
      },
    ],
  },
];

const REPLY_BANK = [
  "I checked the line. The position is more dynamic than it first looks.",
  "That continuation makes sense. I would still keep an eye on the e-file pressure.",
  "Nice share. Want me to annotate the critical moment as well?",
  "The shared position is sharp. There may be a tactical shot in two moves.",
];

function formatFilter(kind: ConversationKind, archived: boolean): ConversationFilter {
  if (archived) return "archived";
  if (kind === "group") return "groups";
  if (kind === "club") return "clubs";
  if (kind === "request") return "requests";
  return kind === "direct" ? "direct" : "all";
}

function badgeTone(badge?: ConversationBadge) {
  switch (badge) {
    case "Coach":
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
    case "Club":
      return "border-sky-400/25 bg-sky-500/10 text-sky-100";
    case "Tournament":
      return "border-amber-400/25 bg-amber-500/10 text-amber-100";
    case "Friend":
      return "border-violet-400/25 bg-violet-500/10 text-violet-100";
    case "Team":
      return "border-rose-400/25 bg-rose-500/10 text-rose-100";
    default:
      return "border-white/10 bg-white/5 text-[#cdd4dd]";
  }
}

function messageTone(message: ChatMessage) {
  if (message.sender === "system") {
    return "mx-auto max-w-md rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-center text-xs text-[#a0a7b2]";
  }

  if (message.sender === "me") {
    return "ml-auto rounded-[18px] border border-[#7fa650]/30 bg-[#7fa650]/12 text-white";
  }

  return "mr-auto rounded-[18px] border border-white/10 bg-white/[0.04] text-white";
}

function ConversationAvatar({
  avatar,
  online,
  compact = false,
}: {
  avatar: string;
  online: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center rounded-2xl bg-[#232831] text-white", compact ? "h-10 w-10 text-sm font-bold" : "h-12 w-12 text-base font-semibold")}>
      {avatar}
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full border-2 border-[#111318]",
          online ? "bg-[#7fa650]" : "bg-[#5b6370]",
          compact ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Guest Player";

  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [selectedId, setSelectedId] = useState(SAMPLE_CONVERSATIONS[0].id);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesFilter =
        filter === "all" ? !conversation.archived :
        filter === "archived" ? conversation.archived :
        formatFilter(conversation.kind, conversation.archived) === filter;

      const haystack = [
        conversation.name,
        conversation.preview,
        conversation.badge,
        conversation.description,
        ...conversation.commonClubs,
        ...conversation.messages.map((message) => message.text),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && haystack.includes(searchQuery.trim().toLowerCase());
    });
  }, [conversations, filter, searchQuery]);

  useEffect(() => {
    if (!filteredConversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(filteredConversations[0]?.id ?? "");
    }
  }, [filteredConversations, selectedId]);

  const activeConversation = filteredConversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  const visibleMessages = useMemo(() => {
    if (!activeConversation) return [];
    if (!chatSearch.trim()) return activeConversation.messages;
    return activeConversation.messages.filter((message) =>
      [message.text, message.senderName, message.fileName, message.pgn, message.fen]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(chatSearch.trim().toLowerCase()),
    );
  }, [activeConversation, chatSearch]);

  useEffect(() => {
    if (!activeConversation) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id ? { ...conversation, unread: 0, typing: false } : conversation,
      ),
    );
  }, [activeConversation?.id]);

  const updateConversation = (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === conversationId ? updater(conversation) : conversation)),
    );
  };

  const handleConversationAction = (conversationId: string, action: "pin" | "mute" | "archive" | "delete" | "read") => {
    if (action === "delete") {
      setConversations((current) => current.filter((conversation) => conversation.id !== conversationId));
      toast.success("Conversation removed.");
      return;
    }

    updateConversation(conversationId, (conversation) => {
      if (action === "pin") return { ...conversation, pinned: !conversation.pinned };
      if (action === "mute") return { ...conversation, muted: !conversation.muted };
      if (action === "archive") return { ...conversation, archived: !conversation.archived, unread: 0 };
      return { ...conversation, unread: 0 };
    });
  };

  const injectComposerSnippet = (mode: "pgn" | "fen" | "analysis") => {
    if (mode === "pgn") {
      setComposerValue('[Event "Training"] 1. e4 e5 2. Nf3 Nc6 3. Bb5');
      return;
    }
    if (mode === "fen") {
      setComposerValue("r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BPP1N1P/PP3PP1/RNBQR1K1 w - - 0 10");
      return;
    }
    setComposerValue("Shared analysis card: critical moment after 17...Re8");
  };

  const sendAutomatedReply = (conversationId: string) => {
    setTyping(true);
    updateConversation(conversationId, (conversation) => ({ ...conversation, typing: true, status: "typing..." }));

    window.setTimeout(() => {
      const replyText = REPLY_BANK[Math.floor(Math.random() * REPLY_BANK.length)];
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        typing: false,
        status: conversation.online ? "Online" : "Last seen recently",
        preview: replyText,
        time: "now",
        messages: [
          ...conversation.messages,
          {
            id: `auto-${Date.now()}`,
            sender: "other",
            senderName: conversation.name,
            type: "text",
            text: replyText,
            time: "now",
            reactions: ["♟️"],
          },
        ],
      }));
      setTyping(false);
    }, 1200);
  };

  const handleSend = () => {
    if (!activeConversation || !composerValue.trim()) return;

    const value = composerValue.trim();
    const nextType: MessageType =
      value.startsWith("[Event")
        ? "pgn"
        : value.includes("/") && value.includes(" w ")
          ? "fen"
          : value.toLowerCase().includes("analysis card")
            ? "game"
            : "text";

    if (editingId) {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        preview: value,
        time: "now",
        messages: conversation.messages.map((message) =>
          message.id === editingId ? { ...message, text: value, edited: true } : message,
        ),
      }));
      setEditingId(null);
      toast.success("Message updated.");
    } else {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        preview: value,
        time: "now",
        messages: [
          ...conversation.messages,
          {
            id: `msg-${Date.now()}`,
            sender: "me",
            senderName: currentUserName,
            type: nextType,
            text: value,
            time: "now",
            read: false,
            replyTo: replyTo?.id,
            pgn: nextType === "pgn" ? value : undefined,
            fen: nextType === "fen" ? value : undefined,
          },
        ],
      }));
      sendAutomatedReply(activeConversation.id);
    }

    setComposerValue("");
    setReplyTo(null);
  };

  const handleMessageAction = (message: ChatMessage, action: "reply" | "edit" | "delete" | "copy" | "forward" | "report" | "block") => {
    if (!activeConversation) return;

    if (action === "reply") {
      setReplyTo(message);
      setComposerValue(`@${message.senderName} `);
      return;
    }

    if (action === "edit") {
      setEditingId(message.id);
      setComposerValue(message.text);
      return;
    }

    if (action === "delete") {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.filter((entry) => entry.id !== message.id),
      }));
      setSelectedMessageId(null);
      toast.success("Message deleted.");
      return;
    }

    if (action === "copy") {
      void navigator.clipboard?.writeText(message.text);
      toast.success("Message copied.");
      return;
    }

    if (action === "forward") {
      toast.success("Forward flow is ready for connection.");
      return;
    }

    if (action === "report") {
      toast.success("Spam report saved.");
      return;
    }

    toast.success("User blocked in this conversation preview.");
  };

  const loadEarlierMessages = () => {
    if (!activeConversation) return;
    setLoadingHistory(true);

    window.setTimeout(() => {
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: [
          {
            id: `older-${Date.now()}`,
            sender: "system",
            senderName: "System",
            type: "system",
            text: "Earlier history loaded.",
            time: "Earlier",
          },
          ...conversation.messages,
        ],
      }));
      setLoadingHistory(false);
    }, 700);
  };

  return (
    <div className="min-h-full bg-[#111318] text-white">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-4 px-3 py-3 md:px-4 lg:px-5 lg:py-4">
        <div className="grid min-h-[calc(100vh-5.75rem)] items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <section className="rounded-[24px] border border-white/8 bg-[#191c22] p-4 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-semibold tracking-tight text-white">Messages</p>
                <p className="mt-1 text-sm text-[#9ca4af]">Private chess communication for players, coaches, clubs, and events.</p>
              </div>
              <Button
                size="sm"
                className="h-10 rounded-xl bg-[#7fa650] px-4 text-white hover:bg-[#8fbc59]"
              >
                New chat
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-white/10 bg-[#12161d] px-3 py-2.5">
              <Search className="h-4 w-4 text-[#7d8591]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by player, club, message text..."
                className="h-auto border-0 bg-transparent px-0 text-sm text-white placeholder:text-[#7d8591] focus-visible:ring-0"
              />
            </div>

            <Tabs value={filter} onValueChange={(value) => setFilter(value as ConversationFilter)} className="mt-4">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-[18px] bg-white/[0.04] p-1 md:grid-cols-6">
                {FILTERS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-[12px] px-3 py-2 text-xs data-[state=active]:bg-[#101319] data-[state=active]:text-white"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <ScrollArea className="mt-4 h-[calc(100vh-18rem)] pr-1">
              <div className="space-y-3">
                {filteredConversations.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
                    <p className="text-base font-medium text-white">No conversations found</p>
                    <p className="mt-2 text-sm text-[#9ca4af]">Try another search, or switch to a different inbox tab.</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={cn(
                        "w-full rounded-[20px] border px-3 py-3 text-left transition",
                        conversation.id === activeConversation?.id
                          ? "border-[#7fa650]/35 bg-[#7fa650]/10 shadow-[0_0_0_1px_rgba(127,166,80,0.08)]"
                          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <ConversationAvatar avatar={conversation.avatar} online={conversation.online} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-white">{conversation.name}</p>
                                {conversation.badge ? (
                                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", badgeTone(conversation.badge))}>
                                    {conversation.badge}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs text-[#8e97a3]">{conversation.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#8e97a3]">{conversation.time}</span>
                              {conversation.unread > 0 ? (
                                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7fa650] px-1.5 text-[10px] font-bold text-white">
                                  {conversation.unread}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#cdd4dd]">{conversation.preview}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <ActionIcon icon={<Pin className="h-3.5 w-3.5" />} onClick={(event) => { event.stopPropagation(); handleConversationAction(conversation.id, "pin"); }} active={conversation.pinned} />
                            <ActionIcon icon={<BellOff className="h-3.5 w-3.5" />} onClick={(event) => { event.stopPropagation(); handleConversationAction(conversation.id, "mute"); }} active={conversation.muted} />
                            <ActionIcon icon={<Archive className="h-3.5 w-3.5" />} onClick={(event) => { event.stopPropagation(); handleConversationAction(conversation.id, "archive"); }} active={conversation.archived} />
                            <ActionIcon icon={<CheckReadIcon />} onClick={(event) => { event.stopPropagation(); handleConversationAction(conversation.id, "read"); }} />
                            <ActionIcon icon={<Trash2 className="h-3.5 w-3.5" />} onClick={(event) => { event.stopPropagation(); handleConversationAction(conversation.id, "delete"); }} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </section>

          <section className="grid min-h-[calc(100vh-6.5rem)] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            {!activeConversation ? (
              <div className="xl:col-span-2 rounded-[24px] border border-white/8 bg-[#191c22] p-8 text-center shadow-2xl shadow-black/20">
                <p className="text-xl font-semibold text-white">No conversation selected</p>
                <p className="mt-2 text-sm text-[#9ca4af]">Pick a player, club, or group to start analyzing and chatting.</p>
              </div>
            ) : (
              <>
                <div className="flex min-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[#191c22] shadow-2xl shadow-black/20">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ConversationAvatar avatar={activeConversation.avatar} online={activeConversation.online} compact />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">{activeConversation.name}</p>
                          <span className="text-xs text-[#7d8591]">{activeConversation.role}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#9ca4af]">
                          {typing ? "typing..." : activeConversation.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <HeaderIcon icon={<Phone className="h-4 w-4" />} label="Call" />
                      <HeaderIcon icon={<Video className="h-4 w-4" />} label="Video" />
                      <HeaderIcon
                        icon={<Search className="h-4 w-4" />}
                        label="Search in chat"
                        onClick={() => setShowChatSearch((current) => !current)}
                      />
                      <HeaderIcon icon={<Pin className="h-4 w-4" />} label="Pin chat" />
                      <HeaderIcon icon={<Info className="h-4 w-4" />} label="Info" />
                    </div>
                  </div>

                  <div className="border-b border-white/8 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#8e97a3]">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        {activeConversation.badge || "Chat"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        Rating {activeConversation.rating}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                        {visibleMessages.length} messages
                      </span>
                    </div>

                    {showChatSearch ? (
                      <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-white/10 bg-[#11151c] px-3 py-2.5">
                        <Search className="h-4 w-4 text-[#7d8591]" />
                        <Input
                          value={chatSearch}
                          onChange={(event) => setChatSearch(event.target.value)}
                          placeholder="Search inside this chat..."
                          className="h-auto border-0 bg-transparent px-0 text-sm text-white placeholder:text-[#7d8591] focus-visible:ring-0"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 overflow-hidden px-4 py-4">
                    <ScrollArea className="h-[calc(100vh-20rem)] pr-3">
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadEarlierMessages}
                            disabled={loadingHistory}
                            className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                          >
                            {loadingHistory ? "Loading..." : "Load earlier messages"}
                          </Button>
                        </div>

                        {visibleMessages.map((message) => (
                          <div
                            key={message.id}
                            className={cn("max-w-[88%]", message.sender === "me" ? "ml-auto" : message.sender === "system" ? "mx-auto max-w-full" : "mr-auto")}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className={cn("px-4 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.12)]", messageTone(message))}
                              onClick={() => setSelectedMessageId((current) => (current === message.id ? null : message.id))}
                            >
                              {message.sender !== "system" ? (
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8e97a3]">
                                    {message.sender === "me" ? "You" : message.senderName}
                                  </span>
                                  <span className="text-[11px] text-[#8e97a3]">
                                    {message.time}{message.edited ? " • edited" : ""}
                                  </span>
                                </div>
                              ) : null}

                              <MessageBody
                                message={message}
                                onOpenAnalysis={(pgn) => navigate(`/analysis?pgn=${encodeURIComponent(pgn)}`)}
                                onOpenPosition={(fen) => navigate(`/analysis?fen=${encodeURIComponent(fen)}`)}
                                onPlayPosition={(fen) => navigate(`/play?fen=${encodeURIComponent(fen)}`)}
                              />

                              {message.reactions?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.reactions.map((reaction, index) => (
                                    <span key={`${message.id}-${reaction}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-[#dbe2ea]">
                                      {reaction}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </motion.div>

                            {selectedMessageId === message.id && message.sender !== "system" ? (
                              <div className={cn("mt-2 flex flex-wrap gap-2", message.sender === "me" ? "justify-end" : "justify-start")}>
                                <MiniAction onClick={() => handleMessageAction(message, "reply")} icon={<CornerUpLeft className="h-3.5 w-3.5" />} label="Reply" />
                                <MiniAction onClick={() => handleMessageAction(message, "copy")} icon={<Copy className="h-3.5 w-3.5" />} label="Copy" />
                                <MiniAction onClick={() => handleMessageAction(message, "forward")} icon={<Forward className="h-3.5 w-3.5" />} label="Forward" />
                                {message.sender === "me" ? (
                                  <>
                                    <MiniAction onClick={() => handleMessageAction(message, "edit")} icon={<FileText className="h-3.5 w-3.5" />} label="Edit" />
                                    <MiniAction onClick={() => handleMessageAction(message, "delete")} icon={<Trash2 className="h-3.5 w-3.5" />} label="Delete" />
                                  </>
                                ) : (
                                  <>
                                    <MiniAction onClick={() => handleMessageAction(message, "report")} icon={<Flag className="h-3.5 w-3.5" />} label="Report" />
                                    <MiniAction onClick={() => handleMessageAction(message, "block")} icon={<UserMinus className="h-3.5 w-3.5" />} label="Block" />
                                  </>
                                )}
                              </div>
                            ) : null}
                          </div>
                        ))}

                        {typing ? (
                          <div className="mr-auto max-w-[88%] rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#cfd6df]">
                            {activeConversation.name} is typing...
                          </div>
                        ) : null}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t border-white/8 px-4 py-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {[
                        { label: "Quick reply", value: "Looks good. Let’s review the next critical move." },
                        { label: "Share PGN", onClick: () => injectComposerSnippet("pgn") },
                        { label: "Share FEN", onClick: () => injectComposerSnippet("fen") },
                        { label: "Analysis card", onClick: () => injectComposerSnippet("analysis") },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => ("onClick" in item ? item.onClick() : setComposerValue(item.value))}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d0d6de] transition hover:bg-white/10"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {replyTo ? (
                      <div className="mb-3 rounded-[14px] border border-[#7fa650]/30 bg-[#7fa650]/10 px-3 py-2 text-xs text-[#edf8df]">
                        Replying to {replyTo.senderName}: {replyTo.text.slice(0, 90)}
                      </div>
                    ) : null}

                    <div className="rounded-[18px] border border-white/10 bg-[#11151c] p-3">
                      <div className="flex flex-wrap gap-2">
                        <IconPill icon={<Paperclip className="h-4 w-4" />} label="Attach" />
                        <IconPill icon={<Smile className="h-4 w-4" />} label="Emoji" />
                        <IconPill icon={<Image className="h-4 w-4" />} label="GIF" />
                        <IconPill icon={<Sparkles className="h-4 w-4" />} label="Chess tools" />
                      </div>
                      <div className="mt-3 flex items-end gap-3">
                        <Textarea
                          value={composerValue}
                          onChange={(event) => setComposerValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleSend();
                            }
                          }}
                          placeholder="Write a message, paste PGN/FEN, or share an analysis card..."
                          className="min-h-[96px] border-white/10 bg-white/5 text-white placeholder:text-[#7d8591]"
                        />
                        <Button
                          onClick={handleSend}
                          className="h-12 rounded-2xl bg-[#7fa650] px-5 text-white hover:bg-[#8fbc59]"
                        >
                          <Send className="mr-2 h-4 w-4" /> Send
                        </Button>
                      </div>
                      <p className="mt-3 text-xs text-[#8e97a3]">
                        Enter to send • Shift+Enter for newline • drag-and-drop structure ready for attachments
                      </p>
                    </div>
                  </div>
                </div>

                <aside className="rounded-[24px] border border-white/8 bg-[#191c22] p-4 shadow-2xl shadow-black/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">Chat context</p>
                      <p className="mt-1 text-sm text-[#9ca4af]">{activeConversation.description}</p>
                    </div>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cdd4dd] transition hover:bg-white/10"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <ConversationAvatar avatar={activeConversation.avatar} online={activeConversation.online} />
                      <div>
                        <p className="text-sm font-semibold text-white">{activeConversation.name}</p>
                        <p className="mt-1 text-xs text-[#8e97a3]">{activeConversation.role}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <InfoMetric label="Rating" value={String(activeConversation.rating)} />
                      <InfoMetric label="Status" value={activeConversation.status} />
                      <InfoMetric label="Common clubs" value={String(activeConversation.commonClubs.length)} />
                      <InfoMetric label="Mutual friends" value={String(activeConversation.mutualFriends)} />
                    </div>

                    <div className="mt-4 grid gap-2">
                      <QuickAction icon={<Users className="h-4 w-4" />} label="View profile" onClick={() => navigate("/profile")} />
                      <QuickAction icon={<Swords className="h-4 w-4" />} label="Challenge to game" onClick={() => navigate("/play")} />
                      <QuickAction icon={<Crown className="h-4 w-4" />} label="Invite to club" />
                      <QuickAction icon={<Mic className="h-4 w-4" />} label="Start voice chat" />
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <ContextSection
                      title={activeConversation.kind === "club" ? "Club info" : activeConversation.kind === "group" ? "Members" : "Shared content"}
                      items={
                        activeConversation.kind === "club"
                          ? [
                              `${activeConversation.commonClubs[0] || "Club room"} • 48 online`,
                              "Arena starts in 45 min",
                              "Pinned announcement updated",
                            ]
                          : activeConversation.kind === "group"
                            ? ["12 participants online", "Admin controls active", "Pinned pairings message"]
                            : activeConversation.sharedPositions
                      }
                    />
                    <ContextSection title="Recent games" items={activeConversation.recentGames} />
                    <ContextSection title="Shared files" items={activeConversation.sharedFiles.length ? activeConversation.sharedFiles : ["No files shared yet"]} />
                    <ContextSection title="Shared positions" items={activeConversation.sharedPositions.length ? activeConversation.sharedPositions : ["No positions shared yet"]} />
                  </div>
                </aside>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MessageBody({
  message,
  onOpenAnalysis,
  onOpenPosition,
  onPlayPosition,
}: {
  message: ChatMessage;
  onOpenAnalysis: (pgn: string) => void;
  onOpenPosition: (fen: string) => void;
  onPlayPosition: (fen: string) => void;
}) {
  if (message.type === "system") {
    return <p>{message.text}</p>;
  }

  if (message.type === "pgn") {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-7 text-white">{message.text}</p>
        <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#a0a7b2]">
            <FolderKanban className="h-4 w-4" />
            PGN snippet
          </div>
          <p className="mt-3 line-clamp-4 font-mono text-sm leading-7 text-[#d7dee6]">{message.pgn}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => message.pgn && onOpenAnalysis(message.pgn)} className="h-9 bg-[#7fa650] text-white hover:bg-[#8fbc59]">
              Open in Analysis
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(message.pgn || "")} className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Copy PGN
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "fen") {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-7 text-white">{message.text}</p>
        <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
          <div className="overflow-hidden rounded-[16px] border border-white/8">
            <ChessBoard initialFen={message.fen} interactive={false} size={186} showLegalMoves={false} showChecks showLastMove={false} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => message.fen && onOpenPosition(message.fen)} className="h-9 bg-[#7fa650] text-white hover:bg-[#8fbc59]">
              Analyze
            </Button>
            <Button size="sm" variant="outline" onClick={() => message.fen && onPlayPosition(message.fen)} className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              Play from this position
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "game") {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Analysis card</p>
            <p className="mt-2 text-sm leading-7 text-[#d7dee6]">{message.text}</p>
          </div>
          <Sparkles className="h-5 w-5 text-[#7fa650]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" className="h-9 bg-[#7fa650] text-white hover:bg-[#8fbc59]">
            Analyze
          </Button>
          <Button size="sm" variant="outline" className="h-9 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            Review plan
          </Button>
        </div>
      </div>
    );
  }

  if (message.type === "file") {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#7fa650]" />
          <div>
            <p className="text-sm font-semibold text-white">{message.fileName || "Attachment"}</p>
            <p className="text-xs text-[#8e97a3]">{message.text}</p>
          </div>
        </div>
      </div>
    );
  }

  if (message.type === "link") {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#a0a7b2]">
          <Link2 className="h-4 w-4" />
          Rich preview
        </div>
        <p className="mt-3 text-sm leading-7 text-white">{message.text}</p>
        <p className="mt-2 text-xs text-[#8e97a3]">{message.url}</p>
      </div>
    );
  }

  if (message.type === "poll") {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
        <p className="text-sm font-semibold text-white">{message.text}</p>
        <div className="mt-3 space-y-2">
          {message.pollOptions?.map((option) => (
            <button
              key={option}
              type="button"
              className="flex w-full items-center justify-between rounded-[12px] border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-[#d7dee6] transition hover:bg-white/[0.06]"
            >
              <span>{option}</span>
              <ChevronDown className="h-4 w-4 rotate-[-90deg] text-[#8e97a3]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (message.type === "voice") {
    return (
      <div className="rounded-[16px] border border-white/10 bg-[#101319] p-3">
        <div className="flex items-center gap-3">
          <Mic className="h-5 w-5 text-[#7fa650]" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Voice note</p>
            <p className="mt-1 text-xs text-[#8e97a3]">{message.text}</p>
          </div>
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7fa650] text-white">
            <Send className="h-3.5 w-3.5 rotate-[180deg]" />
          </button>
        </div>
      </div>
    );
  }

  return <p className="text-sm leading-7 text-white">{message.text}</p>;
}

function ActionIcon({
  icon,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border text-[#cfd6df] transition",
        active ? "border-[#7fa650]/35 bg-[#7fa650]/10" : "border-white/10 bg-white/5 hover:bg-white/10",
      )}
    >
      {icon}
    </button>
  );
}

function CheckReadIcon() {
  return <span className="text-[11px] font-semibold">✓✓</span>;
}

function HeaderIcon({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d0d6de] transition hover:bg-white/10 hover:text-white"
    >
      {icon}
    </button>
  );
}

function MiniAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#d0d6de] transition hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}

function IconPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d0d6de] transition hover:bg-white/10"
    >
      {icon}
      {label}
    </button>
  );
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/8 bg-[#12161d] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e97a3]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-[14px] border border-white/8 bg-[#12161d] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ChevronDown className="h-4 w-4 rotate-[-90deg] text-[#8e97a3]" />
    </button>
  );
}

function ContextSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-[12px] border border-white/8 bg-[#12161d] px-3 py-2.5 text-sm text-[#d7dee6]">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
