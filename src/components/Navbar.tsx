import { Link, useLocation } from "react-router-dom";
import { BarChart3, Bell, Bot, GraduationCap, MessageSquare, Puzzle, Search, Swords, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SidebarTrigger } from "@/components/ui/sidebar";

const MOBILE_ITEMS = [
  { path: "/play", icon: Swords },
  { path: "/puzzles", icon: Puzzle },
  { path: "/learn", icon: GraduationCap },
  { path: "/analysis", icon: BarChart3 },
  { path: "/ai-trainer", icon: Bot },
  { path: "/messages", icon: MessageSquare },
  { path: "/social", icon: Users },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  if (pathname === "/play" || pathname === "/login" || pathname === "/register" || pathname === "/auth") {
    return null;
  }

  return (
    <nav className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/40 bg-card/95 px-3 shadow-sm backdrop-blur-md">
      <SidebarTrigger className="mr-1" />

      <Link to="/" className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-secondary/50">
        <img
          src="/brand-knight.png"
          alt="ChessMasterUA"
          className="h-7 w-7 rounded-md border border-white/10 bg-black/20 object-contain p-1"
        />
        <span className="hidden text-sm font-extrabold tracking-tight text-foreground sm:inline">
          ChessMasterUA
        </span>
      </Link>

      <div className="hidden items-center gap-2 lg:flex">
        <div className="relative flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-sm shadow-black/10">
          <Search size={14} className="mr-2 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            className="w-32 bg-transparent text-xs text-foreground placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
      </div>

      <div className="flex-1" />

      <div className="hidden items-center gap-2 xl:flex">
        <Link
          to={user ? "/profile" : "/login"}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent/10"
        >
          {user ? "Profile" : "Log In"}
        </Link>
        {!user && (
          <Link
            to="/register"
            className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Sign Up
          </Link>
        )}
      </div>

      <div className="ml-1 flex items-center gap-1 lg:hidden">
        {MOBILE_ITEMS.map(({ path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`rounded-lg p-1.5 transition ${
              pathname === path
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            <Icon size={16} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
