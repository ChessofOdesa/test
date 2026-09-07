export const STANDARD_TIMES = ["1+0", "2+1", "3+0", "3+2", "5+0", "5+3", "10+0", "10+5", "15+10"];
export const LEGACY_RATED_TIMES = ["1+0", "3+0", "5+0", "10+0", "15+10"];

export function parseTimeControl(value) {
  if (typeof value !== "string" || !/^\d{1,3}\+\d{1,2}$/.test(value)) return null;
  const [minutes, increment] = value.split("+").map(Number);
  if (minutes > 180 || increment > 60 || minutes + increment === 0) return null;
  const estimatedSeconds = minutes * 60 + increment * 40;
  const category = estimatedSeconds < 180 ? "bullet" : estimatedSeconds < 600 ? "blitz" : estimatedSeconds < 1800 ? "rapid" : "classical";
  return { value: `${minutes}+${increment}`, minutes, increment, category, initialMs: (minutes ? minutes * 60 : increment) * 1000, incrementMs: increment * 1000 };
}

export function colorsForPair(first, second) {
  if (first.color !== "random" && first.color === second.color) return null;
  if (first.color === "w" || second.color === "b") return { white: first.player, black: second.player };
  if (first.color === "b" || second.color === "w") return { white: second.player, black: first.player };
  return Math.random() < 0.5 ? { white: first.player, black: second.player } : { white: second.player, black: first.player };
}

export function entriesCompatible(first, second) {
  if (first.player.id === second.player.id || first.rated !== second.rated || first.timeControl !== second.timeControl) return false;
  const a = first.player.ratingFor(first.timeControl), b = second.player.ratingFor(second.timeControl);
  return a >= second.minRating && a <= second.maxRating && b >= first.minRating && b <= first.maxRating;
}

export function validateMatchOptions(payload, { persistenceEnabled = false, flexibleRatings = false } = {}) {
  const time = parseTimeControl(payload.timeControl);
  if (!time) throw new Error("Оберіть 0–180 хвилин і 0–60 секунд додавання. Час не може бути 0+0.");
  const rated = payload.rated === undefined ? persistenceEnabled : payload.rated === true;
  if (rated && (!persistenceEnabled || time.category === "classical" || (!flexibleRatings && !LEGACY_RATED_TIMES.includes(time.value)))) {
    throw new Error("Рейтинг для цього контролю часу зараз недоступний. Оберіть гру без рейтингу.");
  }
  if (!rated && persistenceEnabled && !flexibleRatings) throw new Error("Гра без рейтингу тимчасово недоступна. Оберіть рейтингову партію зі стандартним контролем часу.");
  const minRating = payload.minRating ?? 100, maxRating = payload.maxRating ?? 4000;
  if (!Number.isInteger(minRating) || !Number.isInteger(maxRating) || minRating < 100 || maxRating > 4000 || minRating > maxRating) throw new Error("Діапазон рейтингу має бути від 100 до 4000, мінімум не більший за максимум.");
  if (payload.color !== undefined && !["w", "b", "random"].includes(payload.color)) throw new Error("Оберіть колір фігур.");
  return { timeControl: time.value, color: payload.color || "random", rated, minRating, maxRating };
}
