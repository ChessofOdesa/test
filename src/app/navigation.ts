import { BookOpen, ChartNoAxesCombined, Puzzle, Swords } from "lucide-react";
export const primaryNavigation = [
    { label: "Грати", path: "/play", icon: Swords, matches: ["/play", "/online", "/game", "/challenge"] },
    { label: "Задачі", path: "/puzzles", icon: Puzzle, matches: ["/puzzles"] },
    { label: "Уроки", path: "/lessons", icon: BookOpen, matches: ["/lessons", "/openings"] },
    { label: "Аналіз", path: "/analysis", icon: ChartNoAxesCombined, matches: ["/analysis"] },
];
export const secondaryNavigation = [
    { label: "Дебютний репертуар", path: "/openings" },
    { label: "Гравці та друзі", path: "/social" },
    { label: "Мій профіль", path: "/profile" },
];
export function isNavigationActive(pathname: string, matches: string[]) {
    return matches.some(path => pathname === path || pathname.startsWith(`${path}/`));
}
