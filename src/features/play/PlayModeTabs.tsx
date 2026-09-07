import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Globe2, SlidersHorizontal, Users } from "lucide-react";
export function PlayModeTabs({ friendAvailable, disabled }: { friendAvailable: boolean; disabled: boolean }) {
  return <TabsList className="play-mode-tabs" aria-label="Режим гри"><TabsTrigger value="online" disabled={disabled}><Globe2 size={18}/>Онлайн</TabsTrigger><TabsTrigger value="computer" disabled={disabled}><Cpu size={18}/>Комп’ютер</TabsTrigger>{friendAvailable && <TabsTrigger value="friend" disabled={disabled}><Users size={18}/>Друг</TabsTrigger>}<TabsTrigger value="custom" disabled={disabled}><SlidersHorizontal size={18}/>Своя гра</TabsTrigger></TabsList>;
}
