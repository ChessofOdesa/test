import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronRight,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  MessageSquare,
  Puzzle,
  Swords,
  Target,
  Trophy,
  User,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavigationItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  matches?: (pathname: string) => boolean;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    label: "Головне",
    items: [
      { title: "Головна", url: "/", icon: Home },
      {
        title: "Онлайн",
        url: "/online",
        icon: Wifi,
        matches: (pathname) => pathname === "/online" || pathname.startsWith("/game/"),
      },
      { title: "Турніри", url: "/tournaments", icon: Trophy },
    ],
  },
  {
    label: "Тренування",
    items: [
      { title: "Задачі", url: "/puzzles", icon: Puzzle },
      {
        title: "Уроки",
        url: "/lessons",
        icon: GraduationCap,
        matches: (pathname) => pathname === "/lessons" || pathname === "/learn",
      },
      { title: "Аналіз", url: "/analysis", icon: BarChart3 },
      { title: "Дебюти", url: "/openings", icon: BookOpen },
      { title: "AI-тренер", url: "/ai-trainer", icon: Bot },
    ],
  },
  {
    label: "Спільнота",
    items: [
      { title: "Гравці", url: "/social", icon: Users },
      { title: "Повідомлення", url: "/messages", icon: MessageSquare },
      { title: "Квести", url: "/quests", icon: Target },
    ],
  },
];

function navigationItemIsActive(item: NavigationItem, pathname: string) {
  return item.matches ? item.matches(pathname) : pathname === item.url;
}

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = !isMobile && state === "collapsed";
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isGuest, signOut } = useAuth();

  const userLabel =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.username ||
    user?.email?.split("@")[0] ||
    "Гравець";

  const closeMobileMenu = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    closeMobileMenu();
    navigate("/");
  };

  return (
    <Sidebar
      collapsible="icon"
      className="z-40 border-r border-white/[0.07] bg-[#0a0f16]"
    >
      <SidebarHeader className="border-b border-white/[0.07] bg-[#0a0f16]/98 p-3">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "flex-col justify-center gap-2",
          )}
        >
          <NavLink
            to="/"
            onClick={closeMobileMenu}
            aria-label="Chess of Odesa — головна"
            className={cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-xl outline-none transition focus-visible:ring-2 focus-visible:ring-[#87b958]",
              collapsed && "flex-none justify-center",
            )}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-[#222b25] to-[#111714] shadow-[0_10px_30px_rgba(0,0,0,0.32)]">
              <img
                src="/brand-knight.png"
                alt=""
                className="size-8 object-contain p-0.5"
              />
            </span>
            {!collapsed && (
              <span className="min-w-0 leading-none">
                <span className="block truncate text-base font-black tracking-[-0.02em] text-white">
                  Chess of Odesa
                </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[#88af67]">
                  Одеський клуб
                </span>
              </span>
            )}
          </NavLink>

          <SidebarTrigger
            aria-label={collapsed ? "Розгорнути меню" : "Згорнути меню"}
            title={collapsed ? "Розгорнути меню" : "Згорнути меню"}
            className="size-9 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/65 hover:bg-white/[0.09] hover:text-white"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[linear-gradient(180deg,#0a0f16_0%,#0d131b_55%,#090d13_100%)] px-2 py-3">
        <nav aria-label="Головна навігація" className="space-y-1">
          <SidebarGroup className="px-1 pb-2 pt-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  size="lg"
                  tooltip="Грати"
                  isActive={pathname === "/play" || pathname.startsWith("/play/")}
                  className="h-12 rounded-xl bg-[#7fa650] p-0 text-white shadow-[0_12px_28px_rgba(75,116,44,0.25)] hover:bg-[#8bb65a] hover:text-white data-[active=true]:bg-[#8bb65a] group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!p-0"
                >
                  <NavLink
                    to="/play"
                    onClick={closeMobileMenu}
                    className="flex h-full w-full items-center gap-3 px-3 font-extrabold"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-black/15">
                      <Swords className="size-[18px]" />
                    </span>
                    {!collapsed && <span className="flex-1 text-[15px]">Грати</span>}
                    {!collapsed && <ChevronRight className="size-4 text-white/75" />}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {NAVIGATION_GROUPS.map((group) => (
            <SidebarGroup key={group.label} className="px-1 py-1.5">
              <SidebarGroupLabel className="h-7 px-3 text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => {
                    const active = navigationItemIsActive(item, pathname);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton
                          asChild
                          size="lg"
                          tooltip={item.title}
                          isActive={active}
                          className={cn(
                            "relative h-11 rounded-xl p-0 text-white/64 hover:bg-white/[0.065] hover:text-white group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!p-0",
                            "data-[active=true]:bg-white/[0.085] data-[active=true]:font-bold data-[active=true]:text-white",
                          )}
                        >
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            onClick={closeMobileMenu}
                            className="flex h-full w-full items-center gap-3 px-3"
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#87b958] shadow-[0_0_14px_rgba(135,185,88,0.65)]"
                              />
                            )}
                            <span
                              className={cn(
                                "grid size-8 shrink-0 place-items-center rounded-lg text-white/55 transition",
                                active && "bg-[#7fa650]/16 text-[#a8d37b]",
                              )}
                            >
                              <Icon className="size-[18px]" />
                            </span>
                            {!collapsed && <span className="truncate text-[14px]">{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.07] bg-[#090e14]/98 p-3">
        {user && !isGuest ? (
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <NavLink
              to="/profile"
              onClick={closeMobileMenu}
              title="Мій профіль"
              className={cn(
                "flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87b958]",
                collapsed && "flex-none border-0 bg-transparent p-0",
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#7fa650] text-sm font-black text-white shadow-[0_8px_20px_rgba(72,112,42,0.28)]">
                {userLabel.slice(0, 1).toUpperCase()}
              </span>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{userLabel}</span>
                  <span className="mt-0.5 block text-xs text-white/42">Мій профіль</span>
                </span>
              )}
            </NavLink>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              aria-label="Вийти з акаунта"
              title="Вийти"
              className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-white/50 transition hover:border-rose-400/25 hover:bg-rose-500/10 hover:text-rose-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            >
              <LogOut className="size-[17px]" />
            </button>
          </div>
        ) : user && isGuest ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-white">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.09] text-white/70">
                <User className="size-[18px]" />
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{userLabel}</span>
                  <span className="mt-0.5 block text-xs text-white/42">Гостьовий режим</span>
                </span>
              )}
            </div>
            <NavLink
              to="/register"
              onClick={closeMobileMenu}
              title="Створити акаунт"
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7fa650] px-3 text-sm font-bold text-white transition hover:bg-[#8bb65a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7d37a]"
            >
              <User className="size-4 shrink-0" />
              {!collapsed && <span>Створити акаунт</span>}
            </NavLink>
          </div>
        ) : (
          <div className="space-y-2">
            <NavLink
              to="/register"
              onClick={closeMobileMenu}
              title="Реєстрація"
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7fa650] px-3 text-sm font-bold text-white transition hover:bg-[#8bb65a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7d37a]"
            >
              <User className="size-4 shrink-0" />
              {!collapsed && <span>Реєстрація</span>}
            </NavLink>
            <NavLink
              to="/login"
              onClick={closeMobileMenu}
              title="Увійти"
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <LogIn className="size-4 shrink-0" />
              {!collapsed && <span>Увійти</span>}
            </NavLink>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
