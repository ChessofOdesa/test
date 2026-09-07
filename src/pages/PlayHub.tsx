import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { usePlayerData } from "@/features/profile/usePlayerData";
import { PlayModeTabs } from "@/features/play/PlayModeTabs";
import { OnlinePlayPanel } from "@/features/play/OnlinePlayPanel";
import { ComputerPlayPanel } from "@/features/play/ComputerPlayPanel";
import { FriendPlayPanel } from "@/features/play/FriendPlayPanel";
import { PlayerQuickStats } from "@/features/play/PlayerQuickStats";
import { RecentGames } from "@/features/play/RecentGames";
import { ActiveGameBanner } from "@/features/play/ActiveGameBanner";
import { PlayLoginDialog } from "@/features/play/PlayLoginDialog";
import { MatchmakingStatus } from "@/features/play/MatchmakingStatus";
import { usePlayPreferences, parseTimeControl, type PlayMode } from "@/features/play/preferences";
import { usePlayService } from "@/features/play/usePlayService";
import "@/features/play/play.css";
export default function PlayHub() {
 const navigate = useNavigate(), [params, setParams] = useSearchParams(), { challengeId } = useParams();
 const { user, isGuest } = useAuth(), authenticated = !!user && !isGuest;
 const online = useOnlineGame(), service = usePlayService(), player = usePlayerData();
 const [preferences, update] = usePlayPreferences(), [loginOpen, setLoginOpen] = useState(false), [validationError, setValidationError] = useState("");
 const incomingRequested = useRef(""), autoStart = useRef(false), queryApplied = useRef(false);
 const capabilities = online.capabilities || service.data?.capabilities;
 const parsed = parseTimeControl(preferences.timeControl);
 const ratedAvailable = !!capabilities?.rated && parsed?.category !== "classical" && (capabilities.ratedTimeControls === "all" || capabilities.ratedTimeControls.includes(preferences.timeControl));
 const mode = preferences.mode === "friend" && !capabilities?.challenges ? "online" : preferences.mode;
 const active = online.game?.status === "playing" ? online.game : null;
 const options = { timeControl: preferences.timeControl, color: preferences.color, rated: preferences.rated && ratedAvailable, minRating: preferences.minRating, maxRating: preferences.maxRating };
 const selectedCategory = parseTimeControl(online.searchSettings?.timeControl || preferences.timeControl)?.category || "blitz";
 const profile = player.data?.profile;
 const rating = selectedCategory === "bullet" ? profile?.rating_bullet : selectedCategory === "blitz" ? profile?.rating_blitz : profile?.rating_rapid;
 useEffect(() => {
   if (queryApplied.current) return;
   queryApplied.current = true;
   const time = parseTimeControl(params.get("time")), color = params.get("color"), requestedMode = params.get("mode");
   update({ ...(time ? { timeControl: time.value } : {}), ...(color === "w" || color === "b" || color === "random" ? { color } : {}), ...(requestedMode === "online" || requestedMode === "computer" || requestedMode === "friend" || requestedMode === "custom" ? { mode: requestedMode } : {}), ...(params.has("rated") ? { rated: params.get("rated") === "1" } : {}), ...(challengeId ? { mode: "friend" } : {}) });
 }, [params, challengeId, update]);
 useEffect(() => {
   if (!challengeId || !online.connected || !capabilities?.challenges || incomingRequested.current === challengeId) return;
   incomingRequested.current = challengeId;
   online.challengeAction("get_challenge", { id: challengeId });
 }, [challengeId, online.connected, online.challengeAction, capabilities?.challenges]);
 useEffect(() => {
   if (params.get("start") !== "1" || !online.connected || !capabilities || autoStart.current) return;
   autoStart.current = true;
   const next = new URLSearchParams(params); next.delete("start"); setParams(next, { replace: true });
   if (!active && !online.searching) online.findGame(options.timeControl, options.color, options);
 }, [params, setParams, online.connected, online.findGame, online.searching, active, capabilities, options]);
 function startOnline() {
   setValidationError(""); online.clearActionError();
   if (!authenticated) { setLoginOpen(true); return; }
   if (!Number.isInteger(options.minRating) || !Number.isInteger(options.maxRating) || options.minRating < 100 || options.maxRating > 4000 || options.minRating > options.maxRating) { setValidationError("Вкажіть діапазон від 100 до 4000, де мінімум не більший за максимум."); return; }
   online.findGame(options.timeControl, options.color, options);
 }
 function changeMode(value: string) { update({ mode: value as PlayMode }); setValidationError(""); online.clearActionError(); }
 const disconnected = authenticated && !online.connected;
 const showConnection = mode !== "computer" && !online.searching && (disconnected || service.isError && !online.capabilities);
 return <div className="play-page"><header className="play-heading"><h1>Грати в шахи</h1><p>Оберіть режим і починайте партію</p></header>
 {active && <ActiveGameBanner game={active}/>}
 {challengeId && !authenticated && <div className="challenge-login"><p>Вас запросили на партію.</p><Button onClick={() => setLoginOpen(true)}>Увійти й відкрити виклик</Button></div>}
 <div className="play-workspace"><div className="play-workspace-main"><Tabs value={mode} onValueChange={changeMode}><PlayModeTabs friendAvailable={!!capabilities?.challenges} disabled={online.searching}/><section className="surface play-main-card">
 {online.searching && online.searchSettings ? <MatchmakingStatus options={online.searchSettings} seconds={online.searchTime} rating={rating ?? null} connected={online.connected} error={online.connectionError} onCancel={online.cancelSearch} onRetry={online.connect}/> : <>
 {showConnection && <div className="play-connection" role="status"><div><strong>{online.connectionError || (service.isError ? "Не вдалося підключитися до сервера гри." : "Підключаємося до сервера…")}</strong><p>Пошук стане доступним після підключення.</p></div><Button variant="outline" size="sm" onClick={() => { if (authenticated) online.connect(); void service.refetch(); }}>Спробувати ще раз</Button></div>}
 {(validationError || online.actionError) && <p className="play-inline-error" role="alert">{validationError || online.actionError}</p>}
 <TabsContent value="online" className="m-0"><OnlinePlayPanel preferences={preferences} update={update} onStart={startOnline} ratedAvailable={ratedAvailable} casualAvailable={capabilities?.casual ?? false} disabled={!!active || (authenticated && (!online.connected || !capabilities || (!options.rated && !capabilities.casual)))}/></TabsContent>
 <TabsContent value="custom" className="m-0"><OnlinePlayPanel custom preferences={preferences} update={update} onStart={startOnline} ratedAvailable={ratedAvailable} casualAvailable={capabilities?.casual ?? false} disabled={!!active || (authenticated && (!online.connected || !capabilities || (!options.rated && !capabilities.casual)))}/></TabsContent>
 <TabsContent value="computer" className="m-0"><ComputerPlayPanel preferences={preferences} update={update} onStart={() => navigate(`/play/computer?${new URLSearchParams({ bot: preferences.bot, color: preferences.color, time: preferences.computerTime })}`)}/></TabsContent>
 {capabilities?.challenges && <TabsContent value="friend" className="m-0"><FriendPlayPanel preferences={preferences} update={update} ratedAvailable={ratedAvailable} casualAvailable={capabilities.casual} authenticated={authenticated} onLogin={() => setLoginOpen(true)}/></TabsContent>}
 </>}
 </section></Tabs></div><PlayerQuickStats stats={service.data?.stats || null} onLogin={() => setLoginOpen(true)}/></div><RecentGames/><PlayLoginDialog open={loginOpen} onOpenChange={setLoginOpen}/>
 </div>;
}
