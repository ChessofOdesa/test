import { Bot, UserRound } from "lucide-react";
import { ChessClock } from "./ChessClock";
import type { RoomPlayer } from "./types";
export function PlayerBar({ player, lowTimeSound }: {
    player: RoomPlayer;
    lowTimeSound?: boolean;
}) {
    return <section className={`room-player ${player.own ? "is-you" : ""}`} aria-label={player.own ? "Ваші дані та час" : "Суперник та час"}>
    <div className="room-avatar" aria-hidden="true">{player.avatar ? <img src={player.avatar} alt=""/> : player.computer ? <Bot size={23}/> : <UserRound size={23}/>}</div>
    <div className="room-player-copy"><div className="room-player-name"><strong>{player.name}</strong>{player.rating != null && <span>{player.rating}</span>}{player.ratingChange != null && <span className={player.ratingChange < 0 ? "rating-down" : "rating-up"}>{player.ratingChange > 0 ? "+" : ""}{player.ratingChange}</span>}</div>
      <div className="room-player-detail"><span className={`room-color ${player.color === "w" ? "is-white" : "is-black"}`} aria-hidden="true"/><span>{player.subtitle || (player.color === "w" ? "Білі" : "Чорні")}</span>{typeof player.connected === "boolean" && <span className={`room-presence ${player.connected ? "is-connected" : ""}`} title={player.connected ? "Підключено" : "З’єднання втрачено"} aria-label={player.connected ? "Підключено" : "З’єднання втрачено"}/>}</div>
      {player.captures && <div className="room-captures" aria-label={`Взяті фігури${player.advantage ? `, перевага ${player.advantage}` : ""}`}><span aria-hidden="true">{player.captures}</span>{!!player.advantage && <small>+{player.advantage}</small>}</div>}
    </div><ChessClock clock={player.clock} name={player.name} lowTimeSound={lowTimeSound && player.own}/>
  </section>;
}
