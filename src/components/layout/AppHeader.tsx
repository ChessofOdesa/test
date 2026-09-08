import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { isNavigationActive, primaryNavigation, secondaryNavigation } from "@/app/navigation";
export function AppHeader() {
    const { pathname } = useLocation();
    const { user, isGuest, signOut } = useAuth();
    return <header className="app-header">
    <div className="header-inner">
      <Link to="/" className="brand" aria-label="Chess of Odesa — головна">
        <span className="brand-mark" aria-hidden="true">♞</span>
        <span>Chess of <strong>Odesa</strong></span>
      </Link>
      <nav aria-label="Головна навігація" className="primary-nav">
        {primaryNavigation.map(({ label, path, icon: Icon, matches }) => <Link key={path} to={path} aria-current={isNavigationActive(pathname, matches) ? "page" : undefined} className="nav-link"><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
      <div className="header-actions">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="gap-1.5" aria-label="Інші розділи">Більше <ChevronDown size={16}/></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {secondaryNavigation.map(item => <DropdownMenuItem asChild key={item.path}><Link to={item.path}>{item.label}</Link></DropdownMenuItem>)}
            {user && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut size={16} className="mr-2"/>Вийти</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button asChild className="account-button"><Link aria-label={user && !isGuest ? "Профіль" : "Увійти"} to={user && !isGuest ? "/profile" : "/login"}><UserRound size={17}/><span>{user && !isGuest ? "Профіль" : "Увійти"}</span></Link></Button>
      </div>
    </div>
  </header>;
}
