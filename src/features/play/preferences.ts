import { useEffect, useState } from "react";
import { parseTimeControl, STANDARD_TIMES } from "../../../server/time-control.js";
import type { ColorChoice } from "@/lib/play-types";
export { parseTimeControl, STANDARD_TIMES };
export const CATEGORY_LABELS = { bullet: "Куля", blitz: "Бліц", rapid: "Рапід", classical: "Класика" };
export type PlayMode = "online" | "computer" | "friend" | "custom";
export type PlayPreferences = { mode: PlayMode; timeControl: string; computerTime: string; color: ColorChoice; rated: boolean; bot: string; minRating: number; maxRating: number };
const defaults: PlayPreferences = { mode: "online", timeControl: "3+0", computerTime: "unlimited", color: "random", rated: true, bot: "pavlo", minRating: 100, maxRating: 4000 };
export const COMPUTER_LEVELS = [
  { id: "sofiia", label: "Новачок", rating: 800 }, { id: "dmytro", label: "Любитель", rating: 1200 },
  { id: "pavlo", label: "Клубний", rating: 1600 }, { id: "viktor", label: "Сильний", rating: 2000 },
  { id: "oleksandr", label: "Експерт", rating: 2200 }, { id: "taras", label: "Майстер", rating: 2400 },
  { id: "engine", label: "Максимум", rating: null },
];
export function readPlayPreferences(): PlayPreferences {
  try {
    const raw = JSON.parse(localStorage.getItem("coo.play.preferences.v2") || "null") || {};
    return { ...defaults,
      mode: ["online", "computer", "friend", "custom"].includes(raw.mode) ? raw.mode : defaults.mode,
      timeControl: parseTimeControl(raw.timeControl)?.value || defaults.timeControl,
      computerTime: raw.computerTime === "unlimited" ? "unlimited" : parseTimeControl(raw.computerTime)?.value || defaults.computerTime,
      color: ["w", "b", "random"].includes(raw.color) ? raw.color : defaults.color,
      rated: typeof raw.rated === "boolean" ? raw.rated : true,
      bot: COMPUTER_LEVELS.some(level => level.id === raw.bot) ? raw.bot : defaults.bot,
      minRating: Number.isInteger(raw.minRating) && raw.minRating >= 100 && raw.minRating <= 4000 ? raw.minRating : 100,
      maxRating: Number.isInteger(raw.maxRating) && raw.maxRating >= 100 && raw.maxRating <= 4000 ? raw.maxRating : 4000,
    };
  } catch { return defaults; }
}
export function usePlayPreferences() {
  const [preferences, setPreferences] = useState(readPlayPreferences);
  useEffect(() => { try { localStorage.setItem("coo.play.preferences.v2", JSON.stringify(preferences)); } catch { /* Optional preferences. */ } }, [preferences]);
  const update = (patch: Partial<PlayPreferences>) => setPreferences(current => ({ ...current, ...patch }));
  return [preferences, update] as const;
}
