export const TIME_CONTROLS = [
    { value: "1+0", label: "1 + 0", category: "Куля" }, { value: "3+0", label: "3 + 0", category: "Бліц" },
    { value: "5+0", label: "5 + 0", category: "Бліц" }, { value: "10+0", label: "10 + 0", category: "Рапід" },
    { value: "15+10", label: "15 + 10", category: "Рапід" },
];
export const BOT_OPTIONS = [
    { id: "ivan", name: "Іван", level: "Початківець" }, { id: "maksym", name: "Максим", level: "Аматор" },
    { id: "dmytro", name: "Дмитро", level: "Клубний" }, { id: "mariia", name: "Марія", level: "Досвідчений" },
    { id: "viktor", name: "Віктор", level: "Експерт" }, { id: "illia", name: "Ілля", level: "Найскладніший" },
];
export type ColorChoice = "w" | "random" | "b";
export const COLORS: {
    value: ColorChoice;
    label: string;
}[] = [{ value: "w", label: "Білі" }, { value: "random", label: "Випадково" }, { value: "b", label: "Чорні" }];
