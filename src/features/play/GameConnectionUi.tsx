import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { Swords } from "lucide-react";
export function GameConnectionUi() {
 const { pendingGameId, acknowledgeMatch, game, incomingChallenge, challengeAction, challengeBusy, actionError, connected } = useOnlineGame();
 const navigate = useNavigate();
 const [dismissed, setDismissed] = useState<string | null>(null);
 useEffect(() => { if (!pendingGameId) return; const timer = window.setTimeout(() => { navigate(`/game/${pendingGameId}`); acknowledgeMatch(); }, 1100); return () => window.clearTimeout(timer); }, [pendingGameId, navigate, acknowledgeMatch]);
 const opponent = game?.yourColor === "w" ? game.black : game?.white;
 if (pendingGameId) return <Dialog open><DialogContent className="sm:max-w-sm text-center" onEscapeKeyDown={e => e.preventDefault()} onInteractOutside={e => e.preventDefault()}><DialogHeader><Swords size={34} className="mx-auto mb-3 text-primary"/><DialogTitle>Суперника знайдено</DialogTitle><DialogDescription>Партія починається…</DialogDescription></DialogHeader><div className="match-found-player"><span className="player-monogram">{opponent?.name.slice(0, 1) || "?"}</span><strong>{opponent?.name || "Суперник"}</strong>{opponent?.rating != null && <span>{opponent.rating}</span>}</div></DialogContent></Dialog>;
 return <Dialog open={!!incomingChallenge && dismissed !== incomingChallenge.id} onOpenChange={open => { if (!open && incomingChallenge) { setDismissed(incomingChallenge.id); if (connected) challengeAction("decline_challenge", { id: incomingChallenge.id }); } }}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Виклик на партію</DialogTitle><DialogDescription>{incomingChallenge?.from.name} · {incomingChallenge?.from.rating}</DialogDescription></DialogHeader><p className="text-lg font-semibold">{incomingChallenge?.timeControl} · {incomingChallenge?.rated ? "Рейтингова" : "Без рейтингу"}</p><p className="text-sm text-muted-foreground">Ваш колір: {incomingChallenge?.color === "w" ? "чорні" : incomingChallenge?.color === "b" ? "білі" : "випадковий"}.</p>{actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}{!connected && <p role="status">Відновлюємо з’єднання…</p>}<div className="grid grid-cols-2 gap-3"><Button variant="outline" disabled={!connected || challengeBusy} onClick={() => challengeAction("decline_challenge", { id: incomingChallenge?.id })}>Відхилити</Button><Button disabled={!connected || challengeBusy || game?.status === "playing"} onClick={() => challengeAction("accept_challenge", { id: incomingChallenge?.id })}>{challengeBusy ? "Починаємо…" : "Прийняти"}</Button></div></DialogContent></Dialog>;
}
