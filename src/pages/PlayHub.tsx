import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  ChevronRight,
  Clock3,
  Gauge,
  Globe2,
  LockKeyhole,
  Puzzle,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

type PrimaryMode = "online" | "computer";
type ColorChoice = "w" | "random" | "b";

const ONLINE_TIME_CONTROLS = [
  { value: "1+0", time: "1 хв", category: "Bullet" },
  { value: "3+0", time: "3 хв", category: "Blitz" },
  { value: "5+0", time: "5 хв", category: "Blitz" },
  { value: "10+0", time: "10 хв", category: "Rapid" },
  { value: "15+10", time: "15 | 10", category: "Rapid" },
];

const COMPUTER_TIME_CONTROLS = [
  { value: "unlimited", label: "Без годинника" },
  { value: "3m", label: "3 хвилини" },
  { value: "5m", label: "5 хвилин" },
  { value: "10m", label: "10 хвилин" },
  { value: "30m", label: "30 хвилин" },
];

const BOT_OPTIONS = [
  { id: "ivan", name: "Іван", rating: 600, level: "Початківець" },
  { id: "maksym", name: "Максим", rating: 1000, level: "Аматор" },
  { id: "dmytro", name: "Дмитро", rating: 1200, level: "Клубний" },
  { id: "mariia", name: "Марія", rating: 1400, level: "Середній" },
  { id: "viktor", name: "Віктор", rating: 2000, level: "Експерт" },
  { id: "illia", name: "Ілля", rating: 2800, level: "Майстер" },
];

const COLOR_OPTIONS: Array<{ value: ColorChoice; label: string }> = [
  { value: "w", label: "Білі" },
  { value: "random", label: "Випадково" },
  { value: "b", label: "Чорні" },
];

const QUICK_LINKS: Array<{
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
}> = [
  { title: "Турніри", description: "Arena, Swiss і Knockout", path: "/tournaments", icon: Trophy },
  { title: "Знайти гравця", description: "Друзі та шахова спільнота", path: "/social", icon: Users },
  { title: "Тактичні задачі", description: "Тренування перед партією", path: "/puzzles", icon: Puzzle },
];

export default function PlayHub() {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest } = useAuth();
  const [mode, setMode] = useState<PrimaryMode>("online");
  const [onlineTime, setOnlineTime] = useState("3+0");
  const [computerTime, setComputerTime] = useState("unlimited");
  const [color, setColor] = useState<ColorChoice>("random");
  const [botId, setBotId] = useState("dmytro");

  const accountReady = isAuthenticated && !isGuest;
  const selectedOnlineTime = useMemo(
    () => ONLINE_TIME_CONTROLS.find((control) => control.value === onlineTime) ?? ONLINE_TIME_CONTROLS[1],
    [onlineTime],
  );
  const selectedBot = useMemo(
    () => BOT_OPTIONS.find((bot) => bot.id === botId) ?? BOT_OPTIONS[2],
    [botId],
  );

  const startGame = () => {
    if (mode === "online") {
      const query = new URLSearchParams({ time: onlineTime, color, start: "1" });
      navigate(`/online?${query.toString()}`);
      return;
    }

    const query = new URLSearchParams({ time: computerTime, color, bot: botId });
    navigate(`/play/computer?${query.toString()}`);
  };

  return (
    <div className="min-h-full bg-[#242321] px-3 py-4 text-[#f1f1ef] sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-[1030px]">
        <div className="mb-4 flex items-center gap-3">
          <SidebarTrigger className="h-10 w-10 rounded-lg border border-white/10 bg-[#302f2c] text-white hover:bg-[#3a3936] md:hidden" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Грати</h1>
            <p className="mt-1 text-sm text-[#aaa7a2]">Оберіть режим і починайте партію</p>
          </div>
        </div>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,650px)_minmax(270px,1fr)]">
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-xl bg-[#312e2b] shadow-[0_12px_32px_rgba(0,0,0,0.28)]"
          >
            <Tabs value={mode} onValueChange={(value) => setMode(value as PrimaryMode)}>
              <div className="border-b border-black/25 bg-[#2b2926] p-3 sm:p-4">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="online"
                    className="h-14 rounded-lg border border-white/[0.06] bg-[#3a3835] px-3 text-base font-bold text-[#c9c7c2] shadow-none transition hover:bg-[#403e3a] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#81b64c] data-[state=active]:text-white data-[state=active]:shadow-[0_3px_0_#5c8f2d] sm:h-16"
                  >
                    <Globe2 className="mr-2 h-5 w-5" />
                    Грати онлайн
                  </TabsTrigger>
                  <TabsTrigger
                    value="computer"
                    className="h-14 rounded-lg border border-white/[0.06] bg-[#3a3835] px-3 text-base font-bold text-[#c9c7c2] shadow-none transition hover:bg-[#403e3a] data-[state=active]:border-[#81b64c] data-[state=active]:bg-[#81b64c] data-[state=active]:text-white data-[state=active]:shadow-[0_3px_0_#5c8f2d] sm:h-16"
                  >
                    <Bot className="mr-2 h-5 w-5" />
                    Грати з ботом
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="online" className="m-0 p-4 sm:p-6">
                <SectionTitle icon={Clock3} title="Контроль часу" description="Швидка гра" />

                <RadioGroup value={onlineTime} onValueChange={setOnlineTime} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ONLINE_TIME_CONTROLS.map((control) => (
                    <label
                      key={control.value}
                      htmlFor={`online-time-${control.value}`}
                      className={`relative cursor-pointer rounded-lg border px-3 py-3.5 text-center transition focus-within:ring-2 focus-within:ring-[#a3d160] ${
                        onlineTime === control.value
                          ? "border-[#81b64c] bg-[#4b5f35] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
                          : "border-black/25 bg-[#3a3835] hover:bg-[#42403c]"
                      }`}
                    >
                      <RadioGroupItem id={`online-time-${control.value}`} value={control.value} className="sr-only" />
                      <span className="block text-lg font-bold text-white">{control.time}</span>
                      <span className={`mt-0.5 block text-xs ${onlineTime === control.value ? "text-[#dbeacb]" : "text-[#aaa7a2]"}`}>{control.category}</span>
                    </label>
                  ))}
                </RadioGroup>

                <div className="mt-5 rounded-lg border border-black/25 bg-[#292725] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3b3936] text-[#9dcb63]">
                        <Zap className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-bold text-white">{selectedOnlineTime.time}</p>
                        <p className="text-sm text-[#aaa7a2]">Стандарт · {selectedOnlineTime.category}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-[#3a3835] px-2.5 py-1 text-xs font-semibold text-[#c4c1bc]">
                      {color === "random" ? "Випадковий колір" : color === "w" ? "Білі" : "Чорні"}
                    </span>
                  </div>
                </div>

                <ColorPicker value={color} onChange={setColor} />

                {!accountReady && (
                  <div className="mt-4 flex items-start gap-3 rounded-lg bg-[#262421] px-3.5 py-3 text-sm text-[#bdb9b3]">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#e3b857]" />
                    Для онлайн-партії потрібно увійти в акаунт.
                  </div>
                )}

                <Button
                  type="button"
                  onClick={startGame}
                  className="mt-5 h-14 w-full rounded-lg bg-[#81b64c] text-lg font-extrabold text-white shadow-[0_4px_0_#5c8f2d] hover:bg-[#8fc45a] active:translate-y-[2px] active:shadow-[0_2px_0_#5c8f2d]"
                >
                  <Swords className="mr-2 h-5 w-5" />
                  {accountReady ? "Знайти суперника" : "Увійти й грати"}
                </Button>
              </TabsContent>

              <TabsContent value="computer" className="m-0 p-4 sm:p-6">
                <SectionTitle icon={Gauge} title="Оберіть суперника" description="Сила бота" />

                <RadioGroup value={botId} onValueChange={setBotId} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BOT_OPTIONS.map((bot) => (
                    <label
                      key={bot.id}
                      htmlFor={`bot-${bot.id}`}
                      className={`cursor-pointer rounded-lg border p-3 transition focus-within:ring-2 focus-within:ring-[#a3d160] ${
                        botId === bot.id ? "border-[#81b64c] bg-[#4b5f35]" : "border-black/25 bg-[#3a3835] hover:bg-[#42403c]"
                      }`}
                    >
                      <RadioGroupItem id={`bot-${bot.id}`} value={bot.id} className="sr-only" />
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold ${botId === bot.id ? "bg-[#81b64c] text-white" : "bg-[#252321] text-[#d3d0ca]"}`}>
                          {bot.name[0]}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-white">{bot.name}</span>
                          <span className={`block text-xs ${botId === bot.id ? "text-[#dbeacb]" : "text-[#aaa7a2]"}`}>{bot.rating}</span>
                        </span>
                      </div>
                      <span className={`mt-2 block text-xs ${botId === bot.id ? "text-[#e4f2d5]" : "text-[#918e89]"}`}>{bot.level}</span>
                    </label>
                  ))}
                </RadioGroup>

                <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <label htmlFor="bot-time" className="mb-2 block text-sm font-bold text-[#d8d5cf]">Час на партію</label>
                    <Select value={computerTime} onValueChange={setComputerTime}>
                      <SelectTrigger id="bot-time" className="h-12 rounded-lg border-black/25 bg-[#3a3835] text-white focus:ring-[#81b64c]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPUTER_TIME_CONTROLS.map((control) => (
                          <SelectItem key={control.value} value={control.value}>{control.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg bg-[#292725] px-4 py-3 sm:min-w-[150px]">
                    <p className="text-xs text-[#99958f]">Обрано</p>
                    <p className="mt-0.5 font-bold text-white">{selectedBot.name} · {selectedBot.rating}</p>
                  </div>
                </div>

                <ColorPicker value={color} onChange={setColor} />

                <Button
                  type="button"
                  onClick={startGame}
                  className="mt-5 h-14 w-full rounded-lg bg-[#81b64c] text-lg font-extrabold text-white shadow-[0_4px_0_#5c8f2d] hover:bg-[#8fc45a] active:translate-y-[2px] active:shadow-[0_2px_0_#5c8f2d]"
                >
                  <Bot className="mr-2 h-5 w-5" />
                  Грати
                </Button>
              </TabsContent>
            </Tabs>
          </motion.section>

          <aside className="space-y-4">
            <section className="rounded-xl bg-[#312e2b] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#9acb61]" />
                <h2 className="text-lg font-bold">Інші режими</h2>
              </div>

              <div className="space-y-2">
                {QUICK_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="group flex w-full items-center gap-3 rounded-lg border border-black/20 bg-[#3a3835] px-3 py-3 text-left transition hover:bg-[#44413d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#81b64c]"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#282623] text-[#a6cf76]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-[#aaa7a2]">{item.description}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 text-[#77736e] transition group-hover:translate-x-0.5 group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-[#312e2b] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#403d39] text-[#9ecb6d]">
                  {accountReady ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                </span>
                <div>
                  <p className="font-bold text-white">{accountReady ? "Профіль підключено" : "Гостьовий режим"}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#aaa7a2]">
                    {accountReady ? "Онлайн-гра та турніри доступні." : "З ботами можна грати без входу."}
                  </p>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-center gap-2 px-2 text-xs text-[#8e8a84]">
              <Sparkles className="h-4 w-4" />
              Після партії відкрийте аналіз ходів
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#262421] text-[#9fcd69]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-[#aaa7a2]">{description}</p>
      </div>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: ColorChoice;
  onChange: (value: ColorChoice) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-sm font-bold text-[#d8d5cf]">Грати за</p>
      <RadioGroup value={value} onValueChange={(next) => onChange(next as ColorChoice)} className="grid grid-cols-3 gap-2">
        {COLOR_OPTIONS.map((option) => (
          <label
            key={option.value}
            htmlFor={`color-${option.value}`}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-2 py-3 text-sm font-bold transition focus-within:ring-2 focus-within:ring-[#a3d160] ${
              value === option.value
                ? "border-[#81b64c] bg-[#4b5f35] text-white"
                : "border-black/25 bg-[#3a3835] text-[#c6c3bd] hover:bg-[#42403c]"
            }`}
          >
            <RadioGroupItem id={`color-${option.value}`} value={option.value} className="sr-only" />
            <span
              aria-hidden="true"
              className={`h-4 w-4 rounded-full border ${
                option.value === "w"
                  ? "border-white/80 bg-[#f3f0df]"
                  : option.value === "b"
                    ? "border-white/20 bg-[#191816]"
                    : "border-[#d2cfc9] bg-[linear-gradient(90deg,#f3f0df_50%,#191816_50%)]"
              }`}
            />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
