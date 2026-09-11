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
    <div className="header-inner !min-h-[58px] !gap-4 !px-5">
      <Link to="/" className="brand !gap-2 !text-[.98rem]" aria-label="Chess of Odesa — головна">
        <span className="brand-mark !h-8 !w-8 !rounded-lg !text-[1.45rem]" aria-hidden="true">♞</span>
        <span>Chess of <strong>Odesa</strong></span>
      </Link>
      <nav aria-label="Головна навігація" className="primary-nav !gap-1">
        {primaryNavigation.map(({ label, path, icon: Icon, matches }) => <Link key={path} to={path} aria-current={isNavigationActive(pathname, matches) ? "page" : undefined} className="nav-link !gap-1.5 !px-3 !py-2 !text-sm"><Icon size={16}/><span>{label}</span></Link>)}
      </nav>
      <div className="header-actions !gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-9 gap-1.5 px-3" aria-label="Інші розділи">Більше <ChevronDown size={15}/></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {secondaryNavigation.map(item => <DropdownMenuItem asChild key={item.path}><Link to={item.path}>{item.label}</Link></DropdownMenuItem>)}
            {user && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut()}><LogOut size={16} className="mr-2"/>Вийти</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" asChild className="account-button h-9 px-3"><Link aria-label={user && !isGuest ? "Профіль" : "Увійти"} to={user && !isGuest ? "/profile" : "/login"}><UserRound size={16}/><span>{user && !isGuest ? "Профіль" : "Увійти"}</span></Link></Button>
      </div>
    </div>
  </header>;
}
