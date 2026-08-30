import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
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
import { useAuth } from "@/hooks/useAuth";

type GameModeId = "online" | "computer" | "tournaments" | "training";
type ColorChoice = "w" | "random" | "b";

type GameMode = {
  id: GameModeId;
  title: string;
  eyebrow: string;
  description: string;
  note: string;
  icon: LucideIcon;
  tags: string[];
  accent: string;
  iconStyle: string;
  glow: string;
};

const GAME_MODES: GameMode[] = [
  {
    id: "online",
    title: "Грати онлайн",
    eyebrow: "Жива партія",
    description: "Знайдіть суперника свого темпу та почніть партію через захищений сервер.",
    note: "Потрібен акаунт",
    icon: Globe2,
    tags: ["Матчмейкінг", "1+0 — 15+10"],
    accent: "border-[#8fbd5a]/55 bg-[#8fbd5a]/[0.09]",
    iconStyle: "bg-[#8fbd5a] text-[#10180a]",
    glow: "shadow-[0_22px_70px_rgba(143,189,90,0.13)]",
  },
  {
    id: "computer",
    title: "Проти комп’ютера",
    eyebrow: "Тренувальна партія",
    description: "Грайте у власному темпі, обирайте колір і налаштовуйте силу суперника.",
    note: "Доступно без входу",
    icon: Bot,
    tags: ["Рівні складності", "Аналіз після гри"],
    accent: "border-sky-400/50 bg-sky-400/[0.08]",
    iconStyle: "bg-sky-400 text-[#07121b]",
    glow: "shadow-[0_22px_70px_rgba(56,189,248,0.11)]",
  },
  {
    id: "tournaments",
    title: "Турніри",
    eyebrow: "Змагальний режим",
    description: "Приєднуйтеся до відкритих подій або створюйте власний турнір.",
    note: "Потрібен акаунт",
    icon: Trophy,
    tags: ["Arena", "Swiss · Knockout"],
    accent: "border-amber-300/50 bg-amber-300/[0.08]",
    iconStyle: "bg-amber-300 text-[#211500]",
    glow: "shadow-[0_22px_70px_rgba(252,211,77,0.1)]",
  },
  {
    id: "training",
    title: "Тактичне тренування",
    eyebrow: "Розвиток майстерності",
    description: "Розв’язуйте позиції, тренуйте розрахунок і повертайтеся до слабких тем.",
    note: "Миттєвий старт",
    icon: BrainCircuit,
    tags: ["Тактика", "Поступова складність"],
    accent: "border-violet-400/45 bg-violet-400/[0.08]",
    iconStyle: "bg-violet-400 text-[#140b20]",
    glow: "shadow-[0_22px_70px_rgba(167,139,250,0.1)]",
  },
];

const ONLINE_TIME_CONTROLS = [
  { value: "1+0", label: "1+0 · Bullet" },
  { value: "3+0", label: "3+0 · Blitz" },
  { value: "5+0", label: "5+0 · Blitz" },
  { value: "10+0", label: "10+0 · Rapid" },
  { value: "15+10", label: "15+10 · Rapid" },
];

const COMPUTER_TIME_CONTROLS = [
  { value: "unlimited", label: "Без годинника" },
  { value: "3m", label: "3 хвилини" },
  { value: "5m", label: "5 хвилин" },
  { value: "10m", label: "10 хвилин" },
  { value: "30m", label: "30 хвилин" },
];

const COLOR_OPTIONS: Array<{ value: ColorChoice; label: string; detail: string }> = [
  { value: "w", label: "Білі", detail: "Перший хід" },
  { value: "random", label: "Випадково", detail: "Колір визначиться автоматично" },
  { value: "b", label: "Чорні", detail: "Гра від захисту" },
];

const MODE_DETAILS: Record<
  GameModeId,
  { title: string; description: string; button: string; icon: LucideIcon }
> = {
  online: {
    title: "Швидкий пошук суперника",
    description: "Після запуску відкриється лобі, де сервер знайде гравця з таким самим контролем часу.",
    button: "Перейти до онлайн-гри",
    icon: Zap,
  },
  computer: {
    title: "Персональне тренування",
    description: "На наступному екрані можна обрати бота, змінити силу гри та відкрити аналіз партії.",
    button: "Грати з комп’ютером",
    icon: Bot,
  },
  tournaments: {
    title: "Турнірний зал",
    description: "Перегляньте активні й майбутні події, таблицю учасників або створіть власний турнір.",
    button: "Відкрити турніри",
    icon: Trophy,
  },
  training: {
    title: "Тренування тактики",
    description: "Відкрийте добірку шахових позицій і почніть розв’язання без додаткових налаштувань.",
    button: "Почати тренування",
    icon: BrainCircuit,
  },
};

export default function PlayHub() {
  const navigate = useNavigate();
  const { isAuthenticated, isGuest } = useAuth();
  const [selectedMode, setSelectedMode] = useState<GameModeId>("online");
  const [onlineTime, setOnlineTime] = useState("3+0");
  const [computerTime, setComputerTime] = useState("unlimited");
  const [color, setColor] = useState<ColorChoice>("random");

  const mode = useMemo(
    () => GAME_MODES.find((item) => item.id === selectedMode) ?? GAME_MODES[0],
    [selectedMode],
  );
  const detail = MODE_DETAILS[selectedMode];
  const requiresAccount = selectedMode === "online" || selectedMode === "tournaments";
  const accountReady = isAuthenticated && !isGuest;

  const launchMode = () => {
    if (selectedMode === "online") {
      const query = new URLSearchParams({ time: onlineTime, color });
      navigate(`/online?${query.toString()}`);
      return;
    }

    if (selectedMode === "computer") {
      const query = new URLSearchParams({ time: computerTime, color });
      navigate(`/play/computer?${query.toString()}`);
      return;
    }

    navigate(selectedMode === "tournaments" ? "/tournaments" : "/puzzles");
  };

  const actionLabel = requiresAccount && !accountReady ? "Увійти та продовжити" : detail.button;

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-5 text-white sm:px-6 sm:py-7 xl:px-8">
      <div className="pointer-events-none absolute left-[28%] top-[-22rem] h-[38rem] w-[38rem] rounded-full bg-[#8fbd5a]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-18rem] right-[-10rem] h-[34rem] w-[34rem] rounded-full bg-sky-400/[0.06] blur-3xl" />

      <div className="relative mx-auto max-w-[1240px]">
        <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-1 h-10 w-10 shrink-0 rounded-xl border border-white/10 bg-white/[0.05] text-white hover:bg-white/10 md:hidden" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9ca7b4]">
                <span className="text-[#a9d977]">Ігровий центр</span>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span>Chess of Odesa</span>
              </div>
              <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl lg:text-[46px] lg:leading-[1.06]">
                Оберіть свою наступну партію
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aeb7c3] sm:text-base">
                Онлайн-суперник, комп’ютер, турнір або тактичне тренування — усі режими зібрані в одному місці.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
            <span className={`h-2.5 w-2.5 rounded-full ${accountReady ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.75)]" : "bg-[#737d89]"}`} />
            <div>
              <p className="text-xs font-semibold text-white">{accountReady ? "Акаунт підключено" : "Гостьовий режим"}</p>
              <p className="mt-0.5 text-[11px] text-[#8e99a6]">
                {accountReady ? "Онлайн-режими доступні" : "Комп’ютер і задачі доступні зараз"}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section aria-labelledby="game-modes-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7f8a97]">Крок 1</p>
                <h2 id="game-modes-title" className="mt-1 text-xl font-semibold text-white">Оберіть режим</h2>
              </div>
              <div className="hidden items-center gap-2 text-xs text-[#8d98a5] sm:flex">
                <Swords className="h-4 w-4 text-[#8fbd5a]" />
                4 способи почати гру
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {GAME_MODES.map((item, index) => {
                const active = item.id === selectedMode;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.045 }}
                    onClick={() => setSelectedMode(item.id)}
                    aria-pressed={active}
                    className={`group relative min-h-[218px] overflow-hidden rounded-[24px] border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fbd5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d14] ${
                      active
                        ? `${item.accent} ${item.glow}`
                        : "border-white/[0.08] bg-[#101720]/90 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-[#131b25]"
                    }`}
                  >
                    <div className={`absolute inset-x-0 top-0 h-[2px] transition ${active ? "bg-gradient-to-r from-transparent via-white/70 to-transparent" : "bg-transparent"}`} />
                    <div className="flex items-start justify-between gap-4">
                      <span className={`grid h-12 w-12 place-items-center rounded-2xl transition ${active ? item.iconStyle : "bg-white/[0.06] text-[#c7d0db] group-hover:bg-white/[0.1] group-hover:text-white"}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className={`grid h-8 w-8 place-items-center rounded-full border transition ${active ? "border-white/25 bg-white/15 text-white" : "border-white/[0.08] text-[#687381] group-hover:text-white"}`}>
                        {active ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </div>

                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8995a3]">{item.eyebrow}</p>
                    <h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-5 text-[#9da8b5]">{item.description}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/[0.08] bg-black/15 px-2.5 py-1 text-[10px] font-semibold text-[#b9c2cc]">
                          {tag}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] font-medium text-[#7f8a97]">{item.note}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <FeatureStrip icon={ShieldCheck} title="Чесна гра" detail="Ходи онлайн перевіряє сервер" />
              <FeatureStrip icon={Clock3} title="Ваш темп" detail="Від Bullet до Rapid" />
              <FeatureStrip icon={Sparkles} title="Після партії" detail="Перехід до аналізу ходів" />
            </div>
          </section>

          <motion.aside
            key={selectedMode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-fit rounded-[26px] border border-white/[0.1] bg-[#101720]/95 p-5 shadow-[0_26px_90px_rgba(0,0,0,0.28)] xl:sticky xl:top-6"
          >
            <div className="flex items-start gap-3 border-b border-white/[0.08] pb-5">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${mode.iconStyle}`}>
                <detail.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7f8a97]">Крок 2 · Налаштування</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{detail.title}</h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[#9da8b5]">{detail.description}</p>

            {(selectedMode === "online" || selectedMode === "computer") && (
              <div className="mt-5 space-y-5">
                <div>
                  <label htmlFor="play-time-control" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8e99a6]">
                    Контроль часу
                  </label>
                  <Select
                    value={selectedMode === "online" ? onlineTime : computerTime}
                    onValueChange={selectedMode === "online" ? setOnlineTime : setComputerTime}
                  >
                    <SelectTrigger id="play-time-control" className="h-12 rounded-xl border-white/[0.1] bg-white/[0.045] text-white focus:ring-[#8fbd5a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedMode === "online" ? ONLINE_TIME_CONTROLS : COMPUTER_TIME_CONTROLS).map((control) => (
                        <SelectItem key={control.value} value={control.value}>{control.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8e99a6]">Колір фігур</p>
                  <RadioGroup value={color} onValueChange={(value) => setColor(value as ColorChoice)} className="grid gap-2">
                    {COLOR_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        htmlFor={`play-color-${option.value}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                          color === option.value
                            ? "border-[#8fbd5a]/45 bg-[#8fbd5a]/10"
                            : "border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05]"
                        }`}
                      >
                        <RadioGroupItem id={`play-color-${option.value}`} value={option.value} className="border-white/35 text-[#8fbd5a]" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-white">{option.label}</span>
                          <span className="mt-0.5 block text-[11px] text-[#808b98]">{option.detail}</span>
                        </span>
                        {option.value === "w" ? (
                          <span className="h-5 w-5 rounded-full border border-white/60 bg-[#f2f2e8]" aria-hidden="true" />
                        ) : option.value === "b" ? (
                          <span className="h-5 w-5 rounded-full border border-white/20 bg-[#171b20]" aria-hidden="true" />
                        ) : (
                          <span className="grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-white/[0.06] text-[9px] text-[#aeb7c3]" aria-hidden="true">½</span>
                        )}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {requiresAccount && !accountReady && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3.5 py-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                <p className="text-xs leading-5 text-[#c9c2ad]">
                  Після натискання ви перейдете до входу. Потім режим стане доступним для вашого акаунта.
                </p>
              </div>
            )}

            <Button
              type="button"
              onClick={launchMode}
              className="mt-6 h-13 w-full rounded-xl bg-[#8fbd5a] text-sm font-bold text-[#0d1608] shadow-[0_14px_34px_rgba(143,189,90,0.2)] hover:bg-[#a2cf6f]"
            >
              {actionLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#737f8c]">
              {requiresAccount ? <UserRound className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {requiresAccount ? "Прогрес прив’язується до профілю" : "Режим відкриється одразу"}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}

function FeatureStrip({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-[#9fcf6c]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white">{title}</p>
        <p className="mt-0.5 truncate text-[10px] text-[#7f8a97]">{detail}</p>
      </div>
    </div>
  );
}
