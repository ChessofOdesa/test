import { useBoardSettings, BOARD_THEMES } from "@/contexts/BoardSettingsContext";
import { Palette, Eye, EyeOff } from "lucide-react";

export default function BoardCustomizer() {
  const { theme, setTheme, showCoordinates, setShowCoordinates } = useBoardSettings();

  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
        <Palette size={14} className="text-primary" /> Тема дошки
      </h3>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {BOARD_THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t)}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all border ${
              theme.id === t.id
                ? "border-primary bg-primary/10"
                : "border-transparent hover:border-border"
            }`}
            title={t.name}
          >
            <div className="w-8 h-8 rounded overflow-hidden grid grid-cols-2 grid-rows-2">
              <div style={{ background: t.light }} />
              <div style={{ background: t.dark }} />
              <div style={{ background: t.dark }} />
              <div style={{ background: t.light }} />
            </div>
            <span className="text-[9px] text-muted-foreground">{t.name}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowCoordinates(!showCoordinates)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
      >
        {showCoordinates ? <Eye size={12} /> : <EyeOff size={12} />}
        Координати: {showCoordinates ? "Увімк." : "Вимк."}
      </button>
    </div>
  );
}
