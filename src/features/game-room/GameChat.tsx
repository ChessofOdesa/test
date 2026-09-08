import { useEffect, useRef, useState } from "react";
import { Send, Volume2, VolumeX, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChatMessage } from "@/hooks/useOnlineGame";
export function GameChat({ messages, connected, opponentId, playerId, onSend, onReport, reportStatus }: {
    messages: ChatMessage[];
    connected: boolean;
    opponentId: string;
    playerId: string;
    onSend: (message: string) => void;
    onReport?: (reason: string, note: string) => void;
    reportStatus: string;
}) {
    const key = `coo.chat.muted:${playerId}:${opponentId}`;
    const [muted, setMuted] = useState(() => { try {
        return localStorage.getItem(key) === "true";
    }
    catch {
        return false;
    } });
    const [input, setInput] = useState("");
    const [reason, setReason] = useState("abuse");
    const [note, setNote] = useState("");
    const scroll = useRef<HTMLDivElement>(null);
    const follow = useRef(true);
    useEffect(() => { try {
        localStorage.setItem(key, String(muted));
    }
    catch { /* Optional preference. */ } }, [key, muted]);
    useEffect(() => { if (follow.current && scroll.current)
        scroll.current.scrollTop = scroll.current.scrollHeight; }, [messages.length]);
    return <section className="room-chat" aria-label="Чат партії"><div className="room-chat-top"><span>{muted ? "Суперника вимкнено" : "Чат із суперником"}</span><div className="flex gap-1"><Button variant="ghost" onClick={() => setMuted(value => !value)} aria-label={muted ? "Увімкнути повідомлення суперника" : "Вимкнути повідомлення суперника"} title={muted ? "Увімкнути повідомлення" : "Вимкнути повідомлення"}>{muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}</Button>{onReport && <Dialog><DialogTrigger asChild><Button variant="ghost" aria-label="Поскаржитися" title="Поскаржитися"><Flag size={14}/></Button></DialogTrigger><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Скарга на суперника</DialogTitle><DialogDescription>Збережемо причину та останні повідомлення цієї партії для перевірки.</DialogDescription></DialogHeader>{reportStatus === "saved" ? <p role="status">Скаргу збережено.</p> : <><Select value={reason} onValueChange={setReason}><SelectTrigger aria-label="Причина скарги"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="abuse">Образи</SelectItem><SelectItem value="spam">Спам</SelectItem><SelectItem value="fair_play">Нечесна гра</SelectItem><SelectItem value="other">Інше</SelectItem></SelectContent></Select><textarea className="rounded-md border p-3 text-sm" aria-label="Пояснення скарги" placeholder="Пояснення, якщо потрібно" maxLength={500} value={note} onChange={event => setNote(event.target.value)}/>{reportStatus === "error" && <p role="alert" className="text-sm text-destructive">Не вдалося зберегти скаргу. Спробуйте ще раз.</p>}<Button disabled={!connected || reportStatus === "sending"} onClick={() => onReport(reason, note)}>{reportStatus === "sending" ? "Збереження…" : "Надіслати скаргу"}</Button></>}</DialogContent></Dialog>}</div></div>
    <div ref={scroll} className="room-chat-log" onScroll={event => { const el = event.currentTarget; follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }} aria-label="Повідомлення">{messages.filter(message => !muted || message.self).length === 0 ? <p className="room-chat-empty">{muted ? "Повідомлення суперника приховані на цьому пристрої." : "Тут з’являться повідомлення вашої партії."}</p> : messages.filter(message => !muted || message.self).map((message, index) => <div className={`room-message ${message.self ? "is-self" : ""}`} key={message.id || index}><strong>{message.self ? "Ви" : message.from}</strong>{message.message}</div>)}</div>
    <form onSubmit={event => { event.preventDefault(); if (!connected || !input.trim())
        return; onSend(input.trim()); setInput(""); }}><input aria-label="Повідомлення супернику" placeholder={connected ? "Написати повідомлення…" : "Немає з’єднання"} disabled={!connected} value={input} maxLength={240} onChange={event => setInput(event.target.value)}/><Button type="submit" size="icon" aria-label="Надіслати повідомлення" disabled={!connected || !input.trim()}><Send size={16}/></Button></form>
  </section>;
}
