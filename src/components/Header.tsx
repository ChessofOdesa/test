import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 h-14 bg-card/95 backdrop-blur-sm border-b border-[var(--card-border)]/40 flex items-center px-4">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-base font-heading text-card-foreground">
          <span className="text-2xl">в™ћ</span>
          <span className="hidden sm:inline font-bold text-accent">Chess.od</span>
        </Link>
      </div>

      <nav className="hidden md:flex gap-6 mx-auto text-sm font-semibold text-card-foreground">
        <Link to="/play" className="hover:text-accent transition">Р“СЂР°С‚Рё</Link>
        <Link to="/puzzles" className="hover:text-accent transition">Р—Р°РґР°С‡С–</Link>
        <Link to="/learn" className="hover:text-accent transition">РќР°РІС‡Р°РЅРЅСЏ</Link>
        <Link to="/news" className="hover:text-accent transition">РќРѕРІРёРЅРё</Link>
        <Link to="/clubs" className="hover:text-accent transition">РљР»СѓР±Рё</Link>
      </nav>

      <div className="hidden lg:flex items-center gap-2">
        <Link to="/login" className="px-3 py-1 rounded border border-[var(--card-border)] text-card-foreground hover:bg-white/5 transition">РЈРІС–Р№С‚Рё</Link>
        <Link to="/register" className="btn-cta">Р—Р°СЂРµС”СЃС‚СЂСѓРІР°С‚РёСЃСЊ</Link>
      </div>
    </header>
  );
}
