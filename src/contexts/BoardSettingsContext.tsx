import { createContext, useContext, useState, type ReactNode } from "react";

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: "lichess", name: "Lichess Green", light: "#f3eedb", dark: "#6d8a4a" },
  { id: "wood", name: "Walnut", light: "#e8c98a", dark: "#7a5c3a" },
  { id: "classic", name: "Classic", light: "#f0d9b5", dark: "#b58863" },
  { id: "green", name: "Forest", light: "#f2efd8", dark: "#7aa162" },
  { id: "blue", name: "Blue Steel", light: "#d0e0f8", dark: "#3060b0" },
  { id: "brown", name: "Amber", light: "#f0d090", dark: "#7a4010" },
  { id: "bw", name: "Mono", light: "#f0f0f0", dark: "#404040" },
  { id: "cream", name: "Ivory", light: "#fff8e7", dark: "#c0955a" },
  { id: "red", name: "Garnet", light: "#f8d8d0", dark: "#a03030" },
  { id: "purple", name: "Royal", light: "#e8d8f0", dark: "#7040a0" },
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

export function BoardSettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [pieceStyle, setPieceStyle] = useState<PieceStyle>("unicode");
  const [showCoordinates, setShowCoordinates] = useState(false);

  return (
    <BoardSettingsContext.Provider
      value={{ theme, setTheme, pieceStyle, setPieceStyle, showCoordinates, setShowCoordinates }}
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
