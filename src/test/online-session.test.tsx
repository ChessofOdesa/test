import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OnlineGameProvider, useOnlineGame } from "@/hooks/useOnlineGame";
import type { MatchOptions } from "@/lib/play-types";
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "session-player", user_metadata: {} }, session: { access_token: "fixture-access-token" }, isGuest: false }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));
class TestSocket {
 static OPEN = 1; static CONNECTING = 0; static instances: TestSocket[] = [];
 readyState = 0; sent: Record<string, unknown>[] = []; onopen?: () => void; onclose?: (event: { code: number }) => void; onmessage?: (event: { data: string }) => void; onerror?: () => void;
 constructor() { TestSocket.instances.push(this); }
 send(payload: string) { this.sent.push(JSON.parse(payload)); }
 close() { this.readyState = 3; this.onclose?.({ code: 1000 }); }
 open() { this.readyState = 1; this.onopen?.(); }
 receive(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
}
let session: ReturnType<typeof useOnlineGame>;
function Probe() { session = useOnlineGame(); return null; }
function mount() { const result = render(<OnlineGameProvider><Probe/></OnlineGameProvider>); return { ...result, socket: TestSocket.instances[TestSocket.instances.length - 1]! }; }
const options: MatchOptions = { timeControl: "10+0", color: "b", rated: false, minRating: 1400, maxRating: 1800 };
const capabilities = { protocol: 2, customTime: true, casual: true, rated: true, ratedTimeControls: "all", ratingRange: true, challenges: true, tournaments: false, chess960: false };
beforeEach(() => { sessionStorage.clear(); TestSocket.instances = []; vi.stubGlobal("WebSocket", TestSocket); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("restores one queue request after refresh and persists cancellation", () => {
 sessionStorage.setItem("coo.matchmaking:session-player", JSON.stringify({ options, startedAt: Date.now() - 12000 }));
 const { socket } = mount(); act(() => { socket.open(); socket.receive({ type: "authenticated", playerId: "session-player", capabilities, hasActiveGame: false }); });
 expect(socket.sent.filter(m => m.type === "find_game")).toEqual([{ type: "find_game", ...options }]);
 act(() => socket.receive({ type: "waiting", options, queueSize: 1 })); expect(session.searching).toBe(true); expect(session.searchSettings).toEqual(options); expect(session.searchTime).toBeGreaterThanOrEqual(12);
 act(() => session.cancelSearch()); expect(sessionStorage.getItem("coo.matchmaking:session-player")).toBeNull(); expect(session.searching).toBe(false);
});
it("active-game restoration takes priority over a stored queue request", () => {
 sessionStorage.setItem("coo.matchmaking:session-player", JSON.stringify({ options, startedAt: Date.now() }));
 const { socket } = mount(); act(() => { socket.open(); socket.receive({ type: "authenticated", playerId: "session-player", capabilities, hasActiveGame: true }); socket.receive({ type: "game_state", game: { id: "real-active", status: "playing", yourColor: "w" } }); });
 expect(socket.sent.some(m => m.type === "find_game")).toBe(false); expect(session.game?.id).toBe("real-active"); expect(session.searching).toBe(false); expect(sessionStorage.getItem("coo.matchmaking:session-player")).toBeNull();
});
it("keeps cancellation available while disconnected and ignores an old game save", () => {
 const { socket } = mount(); act(() => { socket.open(); socket.receive({ type: "authenticated", playerId: "session-player", capabilities, hasActiveGame: false }); });
 act(() => session.findGame(options.timeControl, "b", options)); act(() => socket.close()); expect(session.searching).toBe(true); expect(session.connected).toBe(false);
 act(() => session.cancelSearch()); expect(session.searching).toBe(false);
 act(() => { socket.receive({ type: "game_found", game: { id: "new-game", status: "playing", yourColor: "w" } }); socket.receive({ type: "game_saved", game: { id: "old-game", status: "finished" } }); }); expect(session.game?.id).toBe("new-game");
});
