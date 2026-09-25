import { UserRound, UsersRound } from "lucide-react";
import { AnalysisIcon, LessonsIcon, OnlinePlayIcon, OpeningsIcon, PuzzleIcon } from "@/components/icons/chess";
export const primaryNavigation = [
    { label: "Грати", path: "/play", icon: OnlinePlayIcon, matches: ["/play", "/online", "/game", "/challenge"] },
    { label: "Задачі", path: "/puzzles", icon: PuzzleIcon, matches: ["/puzzles"] },
    { label: "Уроки", path: "/lessons", icon: LessonsIcon, matches: ["/lessons", "/openings"] },
    { label: "Аналіз", path: "/analysis", icon: AnalysisIcon, matches: ["/analysis"] },
];
export const secondaryNavigation = [
    { label: "Дебютний репертуар", path: "/openings", icon: OpeningsIcon },
    { label: "Гравці та друзі", path: "/social", icon: UsersRound },
    { label: "Мій профіль", path: "/profile", icon: UserRound },
];
export function isNavigationActive(pathname: string, matches: string[]) {
    return matches.some(path => pathname === path || pathname.startsWith(`${path}/`));
}
