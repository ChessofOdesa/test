import { useQuery } from "@tanstack/react-query";
import type { LobbyStats, PlayCapabilities } from "@/lib/play-types";
export function usePlayService() {
  return useQuery({ queryKey: ["play-service"], staleTime: 15000, refetchInterval: 30000, retry: 1, queryFn: async () => {
    const ws = import.meta.env.VITE_ONLINE_WS_URL || (import.meta.env.DEV ? "ws://localhost:3001" : "");
    if (!ws) throw new Error("Не вдалося підключитися до сервера гри.");
    const url = new URL(ws); url.protocol = url.protocol === "wss:" ? "https:" : "http:"; url.pathname = "/api/play"; url.search = "";
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error("Не вдалося підключитися до сервера гри.");
    const result = await response.json() as { capabilities: PlayCapabilities; stats: LobbyStats };
    if (!result.capabilities || result.capabilities.protocol < 2) throw new Error("Не вдалося підключитися до сервера гри.");
    return result;
  } });
}
