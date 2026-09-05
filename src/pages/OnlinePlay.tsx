import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  Globe,
  Hourglass,
  RefreshCw,
  Search,
  Timer,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnlineGame } from "@/hooks/useOnlineGame";

const TIME_CONTROLS = [
  { label: "Bullet", time: "1+0", icon: Zap, desc: "1 хвилина без інкременту" },
  { label: "Blitz", time: "3+0", icon: Zap, desc: "Класичний швидкий темп" },
  { label: "Blitz+", time: "5+0", icon: Timer, desc: "Трохи більше часу на план" },
  { label: "Rapid", time: "10+0", icon: Timer, desc: "Глибше позиційне рішення" },
  { label: "Rapid+", time: "15+10", icon: Hourglass, desc: "Інкремент для довгих партій" },
];

type ColorChoice = "random" | "w" | "b";

export default function OnlinePlay() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTime, setSelectedTime] = useState(() => {
    const requested = searchParams.get("time");
    const index = TIME_CONTROLS.findIndex((control) => control.time === requested);
    return index >= 0 ? index : 1;
  });
  const [colorChoice, setColorChoice] = useState<ColorChoice>(() => {
    const requested = searchParams.get("color");
    return requested === "w" || requested === "b" || requested === "random" ? requested : "random";
  });
  const {
    connected,
    connectionError,
    game,
    searching,
    queueSize,
    searchTime,
    recentOpponents,
    connect,
    findGame,
    cancelSearch,
  } = useOnlineGame();
  const autoSearchStartedRef = useRef(false);

  const timeControl = TIME_CONTROLS[selectedTime];

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (game?.id && game.status === "playing") {
      navigate(`/game/${game.id}`);
    }
  }, [game?.id, game?.status, navigate]);

  const handleFindGame = () => {
    findGame(timeControl.time, colorChoice);
  };

  useEffect(() => {
    if (searchParams.get("start") !== "1" || autoSearchStartedRef.current) return;
    autoSearchStartedRef.current = true;
    findGame(timeControl.time, colorChoice);
  }, [colorChoice, findGame, searchParams, timeControl.time]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_45%)] px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[36px] border border-border bg-card/85 p-6 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">
                Онлайн-гра
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-foreground">
                Знайдіть суперника
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Оберіть контроль часу й колір. Коли суперника буде знайдено, партія відкриється автоматично.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-rose-400"}`} />
              <span className="text-muted-foreground">
                {connected ? "Сервер підключено" : "Підключення до сервера"}
              </span>
            </div>
          </div>
          {connectionError && (
            <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {connectionError}
            </div>
          )}
        </motion.section>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-4 rounded-[32px] border border-border bg-card/85 p-5 shadow-xl shadow-black/10"
          >
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                Контроль часу
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {TIME_CONTROLS.map((item, index) => (
                  <button
                    key={item.time}
                    onClick={() => setSelectedTime(index)}
                    className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                      selectedTime === index
                        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-secondary/35 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </div>
                    <div className="mt-2 text-xl font-semibold text-foreground">{item.time}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserCircle2 className="h-4 w-4 text-primary" />
                Колір фігур
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { value: "w" as ColorChoice, label: "Білі", note: "Перший хід" },
                  { value: "random" as ColorChoice, label: "Випадково", note: "Балансований старт" },
                  { value: "b" as ColorChoice, label: "Чорні", note: "Контргра з дебюту" },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setColorChoice(item.value)}
                    className={`rounded-[24px] border px-4 py-4 text-left transition-all ${
                      colorChoice === item.value
                        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-secondary/35 hover:border-primary/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-4 rounded-[32px] border border-border bg-card/85 p-5 shadow-xl shadow-black/10"
          >
            <div className="rounded-[28px] border border-border bg-secondary/35 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-primary" />
                Статус черги
              </div>

              {searching ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-primary">
                    <Search className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">
                      Шукаємо суперника для {timeControl.time}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <QueueStat label="У черзі" value={String(queueSize)} />
                    <QueueStat label="Пошук" value={`${searchTime} с`} />
                  </div>

                  <Button variant="outline" className="w-full" onClick={cancelSearch}>
                    <X className="mr-2 h-4 w-4" /> Скасувати пошук
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Обрано <span className="font-semibold text-foreground">{timeControl.time}</span> та режим{" "}
                    <span className="font-semibold text-foreground">
                      {colorChoice === "random" ? "випадкового кольору" : colorChoice === "w" ? "білими" : "чорними"}
                    </span>.
                  </p>

                  <Button
                    size="lg"
                    className="w-full text-base font-semibold"
                    onClick={handleFindGame}
                  >
                    <Search className="mr-2 h-4 w-4" /> {connected ? "Знайти гру" : "Підключитися й шукати"}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-border bg-secondary/35 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <RefreshCw className="h-4 w-4 text-primary" />
                Останні суперники
              </div>

              {recentOpponents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Історія ще порожня. Після першої партії тут з&apos;являться ваші останні опоненти.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentOpponents.slice(0, 5).map((opponent) => (
                    <div
                      key={opponent.id}
                      className="flex items-center justify-between rounded-2xl border border-border bg-background/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{opponent.name}</p>
                        <p className="text-xs text-muted-foreground">Готовий до нової партії</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleFindGame}>
                        Повторити
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function QueueStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
