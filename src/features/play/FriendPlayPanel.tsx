import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Link2, Share2 } from "lucide-react";
import { FriendPlayIcon } from "@/components/icons/chess";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { TimeControlPicker } from "./TimeControlPicker";
import { ColorPicker, RatedToggle } from "./MatchSettings";
import type { PlayPreferences } from "./preferences";
export function FriendPlayPanel({ preferences, update, ratedAvailable, casualAvailable, authenticated, onLogin }: { preferences: PlayPreferences; update: (p: Partial<PlayPreferences>) => void; ratedAvailable: boolean; casualAvailable: boolean; authenticated: boolean; onLogin: () => void }) {
  const { connected, challengeAction, outgoingChallenge, challengeStatus, challengeBusy, availablePlayers, playersQuery, game } = useOnlineGame();
  const [query, setQuery] = useState(""), [feedback, setFeedback] = useState("");
  const linkRef = useRef<HTMLInputElement>(null);
  const url = outgoingChallenge ? `${window.location.origin}/challenge/${outgoingChallenge.id}` : "";
  useEffect(() => { if (!connected || query.trim().length < 2) return; const timer = window.setTimeout(() => challengeAction("search_players", { query, timeControl: preferences.timeControl }), 300); return () => window.clearTimeout(timer); }, [query, connected, challengeAction, preferences.timeControl]);
  function create(targetId?: string) { if (!authenticated) { onLogin(); return; } challengeAction("create_challenge", { timeControl: preferences.timeControl, color: preferences.color, rated: preferences.rated && ratedAvailable, ...(targetId ? { targetId } : {}) }); }
  async function copy() { try { await navigator.clipboard.writeText(url); setFeedback("Посилання скопійовано."); } catch { linkRef.current?.focus(); linkRef.current?.select(); setFeedback("Виділене посилання можна скопіювати вручну."); } }
  const disabled = (!(preferences.rated && ratedAvailable) && !casualAvailable) || challengeBusy || (authenticated && !connected) || game?.status === "playing";
  return <><div className="play-panel-heading"><span className="play-section-icon" aria-hidden="true"><FriendPlayIcon size={24}/></span><div><h2>Грати з другом</h2><p>Поділіться посиланням або запросіть гравця онлайн.</p></div></div>
    {outgoingChallenge ? <div className="outgoing-challenge" aria-live="polite"><Link2 size={26} className="text-primary mb-4"/><h3 className="font-semibold text-lg">Виклик створено</h3><p className="text-sm mt-2">{outgoingChallenge.timeControl} · {outgoingChallenge.rated ? "Рейтингова" : "Без рейтингу"}</p><p className="play-note">Очікуємо друга. Посилання діє до {new Date(outgoingChallenge.expiresAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}. Залишайтеся на сайті.</p><Input aria-label="Посилання на виклик" ref={linkRef} readOnly value={url} className="mt-4" onFocus={e => e.target.select()}/><div className="flex flex-wrap gap-2 mt-3"><Button variant="outline" onClick={() => void copy()}><Copy size={16}/>Копіювати</Button><Button variant="outline" onClick={async () => { if (!navigator.share) { await copy(); return; } try { await navigator.share({ title: "Виклик у Chess of Odesa", url }); } catch (error) { if (!(error instanceof Error) || error.name !== "AbortError") setFeedback("Не вдалося поділитися. Скопіюйте посилання."); } }}><Share2 size={16}/>Поділитися</Button><Button variant="ghost" disabled={!connected} onClick={() => challengeAction("cancel_challenge", { id: outgoingChallenge.id })}>Скасувати виклик</Button></div>{feedback && <p className="play-note" role="status">{feedback}</p>}</div> : <>
      <TimeControlPicker value={preferences.timeControl} onChange={timeControl => update({ timeControl })}/><RatedToggle value={preferences.rated} onChange={rated => update({ rated })} available={ratedAvailable} casualAvailable={casualAvailable}/><ColorPicker value={preferences.color} onChange={color => update({ color })}/>
      <Button disabled={disabled} className="play-primary-action" onClick={() => create()}><Link2 size={19}/>{challengeBusy ? "Створення…" : "Створити посилання"}</Button>
      {challengeStatus && <p className="play-note" role="status">{challengeStatus}</p>}
      <div className="friend-search"><h3 className="font-semibold mb-2">Запросити гравця онлайн</h3><p className="play-note mb-3">Пошук серед гравців, підключених до сервера гри.</p>{authenticated ? <><Input aria-label="Ім’я гравця" placeholder="Введіть щонайменше 2 символи" value={query} maxLength={30} disabled={!connected} onChange={e => setQuery(e.target.value)}/>{query.trim().length >= 2 && <div aria-live="polite" className="mt-3">{playersQuery !== query ? <p className="play-note">Пошук…</p> : availablePlayers.length ? availablePlayers.map(player => <div className="friend-result" key={player.id}><span className="player-monogram" aria-hidden="true">{player.name.slice(0, 1)}</span><div><strong>{player.name}</strong><span>{player.rating} · Онлайн</span></div><Button variant="outline" size="sm" disabled={disabled} onClick={() => create(player.id)}>Виклик</Button></div>) : <p className="play-note">Гравців не знайдено. Можна запросити друга посиланням.</p>}</div>}</> : <Button variant="outline" onClick={onLogin}>Увійти для пошуку</Button>}</div>
    </>}
  </>;
}
