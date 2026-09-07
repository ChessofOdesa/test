import { randomUUID } from "node:crypto";

export function createChallengeService({ players, games, validate, startGame, removeFromQueue }) {
  const challenges = new Map();
  const busy = player => games.get(player.gameId)?.status === "playing";
  const view = challenge => ({ id: challenge.id, from: { id: challenge.host.id, name: challenge.host.name, rating: challenge.host.ratingFor(challenge.timeControl) }, targetId: challenge.targetId, timeControl: challenge.timeControl, rated: challenge.rated, color: challenge.color, expiresAt: challenge.expiresAt });
  function remove(challenge, status) {
    challenges.delete(challenge.id);
    challenge.host.send({ type: "challenge_closed", id: challenge.id, status });
    if (challenge.targetId) players.get(challenge.targetId)?.send({ type: "challenge_closed", id: challenge.id, status });
  }
  function prune() {
    for (const item of challenges.values()) if (item.expiresAt <= Date.now()) remove(item, "expired");
  }
  function cancelFor(player) {
    for (const item of challenges.values()) if (item.host.id === player.id || item.targetId === player.id) remove(item, "cancelled");
  }
  function restore(player) {
    prune();
    for (const item of challenges.values()) {
      if (item.host.id === player.id) player.send({ type: "challenge_created", challenge: view(item) });
      else if (item.targetId === player.id) player.send({ type: "challenge_received", challenge: view(item) });
    }
  }
  function handle(player, data) {
    prune();
    if (data.type === "search_players") {
      const query = typeof data.query === "string" ? data.query.trim().toLocaleLowerCase().slice(0, 30) : "";
      const found = query.length < 2 ? [] : [...players.values()].filter(p => p.id !== player.id && p.isConnected() && !busy(p) && p.name.toLocaleLowerCase().includes(query)).slice(0, 8).map(p => ({ id: p.id, name: p.name, rating: p.ratingFor(data.timeControl || "3+0"), online: true }));
      player.send({ type: "player_results", query: data.query, players: found });
      return;
    }
    if (data.type === "create_challenge") {
      if (busy(player)) throw new Error("Спочатку завершіть поточну партію.");
      if (Date.now() - (player.lastChallengeAt || 0) < 3000) throw new Error("Зачекайте кілька секунд перед новим викликом.");
      const options = validate(data);
      const targetId = typeof data.targetId === "string" ? data.targetId : null;
      const target = targetId ? players.get(targetId) : null;
      if (targetId && (!target?.isConnected() || busy(target) || targetId === player.id)) throw new Error("Гравець зараз не може прийняти виклик.");
      for (const item of challenges.values()) if (item.host.id === player.id) remove(item, "cancelled");
      removeFromQueue(player);
      player.send({ type: "cancelled" });
      player.lastChallengeAt = Date.now();
      const challenge = { ...options, id: randomUUID(), host: player, targetId, expiresAt: Date.now() + 10 * 60_000 };
      challenges.set(challenge.id, challenge);
      player.send({ type: "challenge_created", challenge: view(challenge) });
      target?.send({ type: "challenge_received", challenge: view(challenge) });
      return;
    }
    const item = challenges.get(data.id);
    if (!item || (item.targetId && item.targetId !== player.id && item.host.id !== player.id)) throw new Error("Виклик недоступний або термін його дії минув.");
    if (data.type === "get_challenge") {
      player.send({ type: item.host.id === player.id ? "challenge_created" : "challenge_received", challenge: view(item) });
    } else if (data.type === "cancel_challenge") {
      if (item.host.id !== player.id) throw new Error("Скасувати виклик може лише його автор.");
      remove(item, "cancelled");
    } else if (data.type === "decline_challenge") {
      if (item.targetId === player.id) remove(item, "declined");
      else player.send({ type: "challenge_closed", id: item.id, status: "declined" });
    } else if (data.type === "accept_challenge") {
      if (item.host.id === player.id) throw new Error("Поділіться посиланням з іншим гравцем.");
      if (!item.host.isConnected()) throw new Error("Автор виклику не підключений. Спробуйте пізніше.");
      if (busy(player) || busy(item.host)) throw new Error("Один із гравців уже має активну партію.");
      validate(item);
      removeFromQueue(player);
      removeFromQueue(item.host);
      const guestColor = item.color === "w" ? "b" : item.color === "b" ? "w" : "random";
      startGame({ ...item, player: item.host }, { ...item, color: guestColor, player }, item.timeControl);
      cancelFor(player);
      cancelFor(item.host);
    }
  }
  return { handle, restore, prune, cancelFor };
}
