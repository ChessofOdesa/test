import { useCallback, useEffect, useState } from "react";
import type { RoomPreferences } from "./types";
const DEFAULTS: RoomPreferences = { sound: true, checkSound: true, endSound: true, lowTimeSound: true, animation: true, legalMoves: true, lastMove: true, autoQueen: false, confirmMove: false, evaluation: false, focus: false };
export function useRoomPreferences() {
    const [preferences, set] = useState<RoomPreferences>(() => {
        try {
            const value = JSON.parse(localStorage.getItem("coo.room.preferences") || "{}");
            return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [key, typeof value[key] === "boolean" ? value[key] : fallback])) as RoomPreferences;
        }
        catch {
            return DEFAULTS;
        }
    });
    useEffect(() => { try {
        localStorage.setItem("coo.room.preferences", JSON.stringify(preferences));
    }
    catch { /* Preferences are optional. */ } }, [preferences]);
    const update = useCallback((patch: Partial<RoomPreferences>) => set(current => ({ ...current, ...patch })), []);
    return [preferences, update] as const;
}
