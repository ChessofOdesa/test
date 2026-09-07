import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import PlayHub from "@/pages/PlayHub";
import ChessTimer from "@/components/ChessTimer";
const mocks = vi.hoisted(() => ({ authenticated: false, findGame: vi.fn(), connect: vi.fn(), challengeAction: vi.fn(), active: null as unknown, searching: false, connected: true }));
const caps = { protocol: 2, customTime: true, casual: true, challenges: true, ratingRange: true, rated: true, ratedTimeControls: "all", tournaments: false, chess960: false };
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.authenticated ? { id: "test-player", user_metadata: {} } : null, isGuest: false, signIn: vi.fn() }) }));
vi.mock("@/hooks/useOnlineGame", () => ({ useOnlineGame: () => ({ connected: mocks.connected, capabilities: caps, game: mocks.active, searching: mocks.searching, searchTime: 12, searchSettings: { timeControl: "3+0", color: "random", rated: true, minRating: 100, maxRating: 4000 }, clearActionError: () => {}, challengeAction: mocks.challengeAction, connect: mocks.connect, findGame: mocks.findGame, cancelSearch: vi.fn() }) }));
vi.mock("@/features/play/usePlayService", () => ({ usePlayService: () => ({ data: { capabilities: caps, stats: { players: 0, games: 0 } }, refetch: vi.fn() }) }));
vi.mock("@/features/profile/usePlayerData", () => ({ usePlayerData: () => ({ data: { profile: { display_name: "Test player", rating_blitz: 1500, rating_rapid: 1500, rating_bullet: 1500 }, games: [] }, isPending: false }), gameResult: () => "Нічия" }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
function Location() { return <output aria-label="Поточна адреса">{useLocation().pathname + useLocation().search}</output>; }
function workspace() { return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TooltipProvider><MemoryRouter initialEntries={["/play"]}><PlayHub/><Location/></MemoryRouter></TooltipProvider></QueryClientProvider>); }
beforeEach(() => { localStorage.clear(); mocks.authenticated = false; mocks.active = null; mocks.connected = true; mocks.searching = false; vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("Play workspace", () => {
 it("offers real mode controls, defaults to 3+0 and asks guests to sign in", () => {
  workspace(); expect(screen.getByRole("radio", { name: "3 + 0 Бліц" })).toHaveAttribute("aria-checked", "true");
  expect(screen.queryByRole("tab", { name: "Турніри" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Знайти суперника" }));
  expect(screen.getByRole("dialog", { name: "Увійдіть, щоб грати онлайн" })).toBeInTheDocument(); expect(mocks.findGame).not.toHaveBeenCalled();
 });
 it("uses chosen time, color and casual setting in one matchmaking request", () => {
  mocks.authenticated = true; workspace();
  fireEvent.click(screen.getByRole("radio", { name: "10 + 0 Рапід" })); fireEvent.click(screen.getByRole("radio", { name: "Чорні" })); fireEvent.click(screen.getByRole("switch", { name: "Рейтингова партія" }));
  fireEvent.click(screen.getByRole("button", { name: "Знайти суперника" }));
  expect(mocks.findGame).toHaveBeenCalledWith("10+0", "b", { timeControl: "10+0", color: "b", rated: false, minRating: 100, maxRating: 4000 });
 });
 it("validates and applies custom time and opens the computer board with those settings", () => {
  workspace(); fireEvent.mouseDown(screen.getByRole("tab", { name: "Комп’ютер" }), { button: 0, ctrlKey: false });
  fireEvent.click(screen.getByRole("button", { name: "Свій контроль часу" }));
  fireEvent.change(screen.getByLabelText("Хвилини"), { target: { value: "0" } }); fireEvent.change(screen.getByLabelText("Додавання, с"), { target: { value: "0" } });
  expect(screen.getByRole("button", { name: "Застосувати" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Хвилини"), { target: { value: "7" } }); fireEvent.change(screen.getByLabelText("Додавання, с"), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Застосувати" })); fireEvent.click(screen.getByRole("button", { name: "Грати проти комп’ютера" }));
  expect(screen.getByLabelText("Поточна адреса").textContent).toContain("/play/computer?"); expect(screen.getByLabelText("Поточна адреса").textContent).toContain("time=7%2B4");
 });
 it("prioritizes an active game and prevents another search", () => {
  mocks.authenticated = true; mocks.active = { id: "active-game", status: "playing", yourColor: "w", timeControl: "3+0", black: { name: "Opponent", rating: 1600 } }; workspace();
  expect(screen.getByRole("link", { name: "Повернутися до партії" })).toHaveAttribute("href", "/game/active-game"); expect(screen.getByRole("button", { name: "Знайти суперника" })).toBeDisabled();
 });
});
it("computer clock keeps elapsed time and adds increment once when a turn ends", () => {
 vi.useFakeTimers(); const onTimeout = vi.fn(); const props = { initialTimeMs: 60000, incrementMs: 2000, isRunning: true, isActive: true, color: "w" as const, onTimeout };
 const view = render(<ChessTimer {...props}/>); act(() => vi.advanceTimersByTime(5000)); expect(screen.getByText("0:55")).toBeInTheDocument();
 view.rerender(<ChessTimer {...props} isActive={false}/>); expect(screen.getByText("0:57")).toBeInTheDocument();
 act(() => vi.advanceTimersByTime(3000)); view.rerender(<ChessTimer {...props}/>); act(() => vi.advanceTimersByTime(1000)); expect(screen.getByText("0:56")).toBeInTheDocument(); expect(onTimeout).not.toHaveBeenCalled();
});
