import { OnlineGameProvider } from "@/hooks/useOnlineGame";
import GamePage from "@/pages/GamePage";
import OnlinePlay from "@/pages/OnlinePlay";
import { Route, Routes } from "react-router-dom";
export default function OnlineRoutes() { return <OnlineGameProvider><Routes><Route path="/online" element={<OnlinePlay />}/><Route path="/game/:gameId" element={<GamePage />}/></Routes></OnlineGameProvider>; }
