import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import "./room.css";
export function GameLoading({ error, onRetry }: {
    error?: string | null;
    onRetry?: () => void;
}) { return <div className="room-loading" aria-busy={!error}>{error ? <div className="room-load-error"><h1>{error}</h1><p>Поверніться до вибору гри або повторіть підключення.</p><div>{onRetry && <Button onClick={onRetry}>Повторити</Button>}<Button asChild variant="outline"><Link to="/play">Повернутися до Грати</Link></Button></div></div> : <><span className="sr-only" role="status">Завантажуємо партію…</span><div className="room-loading-board"/><div className="room-loading-panel"/></>}</div>; }
