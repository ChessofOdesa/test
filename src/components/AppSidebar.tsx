import type { CSSProperties } from "react";
import {
  BarChart3,
  Bot,
  GraduationCap,
  LogIn,
  MessageSquare,
  Puzzle,
  Search,
  Swords,
  User,
  Users,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { title: "Play", url: "/play", icon: Swords },
  { title: "Lessons", url: "/lessons", icon: GraduationCap },
  { title: "Analysis", url: "/analysis", icon: BarChart3 },
  { title: "Puzzles", url: "/puzzles", icon: Puzzle },
  { title: "Community", url: "/social", icon: Users },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) =>
    path === "/lessons" ? pathname === "/lessons" || pathname === "/learn" : pathname === path;
  const userLabel =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Player";

  return (
    <Sidebar
      collapsible="icon"
      className="z-30 border-r border-white/[0.07]"
      style={{ "--sidebar-width": "11.25rem" } as CSSProperties}
    >
      <SidebarHeader className="border-b border-white/[0.07] bg-[#0c121a]/95 px-3 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <img
            src="/brand-knight.png"
            alt="ChessMasterUA"
            className="h-7 w-7 rounded-lg border border-white/10 bg-black/30 object-contain p-1"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold tracking-tight text-white">
                Chess<span className="text-[#82b64d]">Master</span>UA
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#0b1119]/95 px-2 py-4 backdrop-blur-xl">
        <div className="space-y-4">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive(item.url)
                        ? "border border-[#7fa650]/25 bg-[#7fa650]/12 text-white shadow-[0_0_0_1px_rgba(127,166,80,0.12)]"
                        : "text-[#d4d0cb] hover:bg-white/5 hover:text-white"
                    }`}
                    activeClassName=""
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          <div className={collapsed ? "space-y-2" : "grid grid-cols-2 gap-2"}>
            <NavLink
              to="/messages"
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition-all ${
                isActive("/messages")
                  ? "border-[#7fa650]/35 bg-[#7fa650]/16 text-white shadow-[0_0_24px_rgba(127,166,80,0.15)]"
                  : "border-white/[0.08] bg-white/[0.045] text-[#d4dbe6] hover:bg-white/[0.08] hover:text-white"
              }`}
              activeClassName=""
              title="Messages"
            >
              <MessageSquare size={16} className="flex-shrink-0" />
              {!collapsed && <span>Messages</span>}
            </NavLink>
            <NavLink
              to="/ai-trainer"
              className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition-all ${
                isActive("/ai-trainer")
                  ? "border-[#7fa650]/35 bg-[#7fa650]/16 text-white shadow-[0_0_24px_rgba(127,166,80,0.15)]"
                  : "border-white/[0.08] bg-white/[0.045] text-[#d4dbe6] hover:bg-white/[0.08] hover:text-white"
              }`}
              activeClassName=""
              title="AI Coach"
            >
              <Bot size={16} className="flex-shrink-0" />
              {!collapsed && <span>AI Coach</span>}
            </NavLink>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.07] bg-[#0b1119]/95 p-2 backdrop-blur-xl">
        <div className="space-y-3">
          <NavLink
            to="/social"
            className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium text-[#bcb6af] transition hover:bg-white/5 hover:text-white"
          >
            <Search size={16} className="flex-shrink-0" />
            {!collapsed && <span>Search</span>}
          </NavLink>

          {!user ? (
            <div className="space-y-2">
              <NavLink
                to="/register"
                className="flex w-full items-center justify-center rounded-xl bg-[#82b64d] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#90c15b]"
              >
                Sign Up
              </NavLink>
              <NavLink
                to="/login"
                className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Log In
              </NavLink>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-white">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7fa650]/20 text-xs font-bold text-[#edf8df]">
                  {userLabel.slice(0, 1).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{userLabel}</p>
                    <p className="truncate text-[11px] text-[#a0a7b2]">Signed in</p>
                  </div>
                )}
              </div>
              <NavLink
                to="/profile"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <LogIn size={16} className="flex-shrink-0" />
                {!collapsed && <span>Open Profile</span>}
              </NavLink>
            </div>
          )}

          {!collapsed && (
            <div className="px-3 pb-1 pt-1 text-xs font-medium text-[#c8c1ba]">English</div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
