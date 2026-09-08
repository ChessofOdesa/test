import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: "odesa", name: "Одеська синя", light: "#e4eaf2", dark: "#8296b5" },
  { id: "lichess", name: "Оливкова", light: "#f3eedb", dark: "#6d8a4a" },
  { id: "wood", name: "Горіх", light: "#e8c98a", dark: "#7a5c3a" },
  { id: "classic", name: "Класична", light: "#f0d9b5", dark: "#b58863" },
  { id: "green", name: "Лісова", light: "#f2efd8", dark: "#7aa162" },
  { id: "blue", name: "Синя сталь", light: "#d0e0f8", dark: "#3060b0" },
  { id: "brown", name: "Бурштин", light: "#f0d090", dark: "#7a4010" },
  { id: "bw", name: "Монохромна", light: "#f0f0f0", dark: "#404040" },
  { id: "cream", name: "Слонова кістка", light: "#fff8e7", dark: "#c0955a" },
  { id: "red", name: "Гранат", light: "#f8d8d0", dark: "#a03030" },
  { id: "purple", name: "Королівська", light: "#e8d8f0", dark: "#7040a0" },
];

export type PieceStyle = "unicode" | "text";

interface BoardSettings {
  theme: BoardTheme;
  setTheme: (theme: BoardTheme) => void;
  pieceStyle: PieceStyle;
  setPieceStyle: (style: PieceStyle) => void;
  showCoordinates: boolean;
  setShowCoordinates: (show: boolean) => void;
}

const BoardSettingsContext = createContext<BoardSettings | null>(null);

function readPreferences() {
  try { const value = JSON.parse(localStorage.getItem("coo.board.preferences") || "{}"); return value && typeof value === "object" ? value : {}; } catch { return {}; }
}
export function BoardSettingsProvider({ children }: { children: ReactNode }) {
  const [saved] = useState(readPreferences);
  const [theme, setTheme] = useState<BoardTheme>(() => BOARD_THEMES.find(item => item.id === saved.theme) || BOARD_THEMES[0]);
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>(saved.pieceStyle === "text" ? "text" : "unicode");
  const [showCoordinates, setShowCoordinates] = useState(saved.showCoordinates !== false);

  useEffect(() => { try { localStorage.setItem("coo.board.preferences", JSON.stringify({ theme: theme.id, pieceStyle, showCoordinates })); } catch { /* Optional preferences. */ } }, [theme, pieceStyle, showCoordinates]);
  const value = useMemo(() => ({ theme, setTheme, pieceStyle, setPieceStyle, showCoordinates, setShowCoordinates }), [theme, pieceStyle, showCoordinates]);
  return (
    <BoardSettingsContext.Provider
      value={value}
    >
      {children}
    </BoardSettingsContext.Provider>
  );
}

export function useBoardSettings() {
  const ctx = useContext(BoardSettingsContext);
  if (!ctx) {
    throw new Error("useBoardSettings must be used within BoardSettingsProvider");
  }

  return ctx;
}
