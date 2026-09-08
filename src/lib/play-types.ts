export type ColorChoice = "w" | "b" | "random";
export type MatchOptions = { timeControl: string; color: ColorChoice; rated: boolean; minRating: number; maxRating: number };
export type PlayCapabilities = { gameRoom?: boolean; reports?: boolean; protocol: number; customTime: boolean; casual: boolean; challenges: boolean; ratingRange: boolean; rated: boolean; ratedTimeControls: string[] | "all"; tournaments: boolean; chess960: boolean };
export type LobbyStats = { players: number; games: number };
export type Challenge = { id: string; from: { id: string; name: string; rating: number }; targetId: string | null; timeControl: string; color: ColorChoice; rated: boolean; expiresAt: number };
export type AvailablePlayer = { id: string; name: string; rating: number; online: boolean };
