import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal } from "lucide-react";
import { ComputerPlayIcon, FriendPlayIcon, OnlinePlayIcon } from "@/components/icons/chess";
export function PlayModeTabs({ friendAvailable, disabled }: { friendAvailable: boolean; disabled: boolean }) {
  return <TabsList className="play-mode-tabs" aria-label="Режим гри"><TabsTrigger value="online" disabled={disabled}><OnlinePlayIcon size={20} aria-hidden="true"/>Онлайн</TabsTrigger><TabsTrigger value="computer" disabled={disabled}><ComputerPlayIcon size={20} aria-hidden="true"/>Комп’ютер</TabsTrigger>{friendAvailable && <TabsTrigger value="friend" disabled={disabled}><FriendPlayIcon size={20} aria-hidden="true"/>Друг</TabsTrigger>}<TabsTrigger value="custom" disabled={disabled}><SlidersHorizontal size={20} aria-hidden="true"/>Своя гра</TabsTrigger></TabsList>;
}
