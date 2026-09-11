import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/layout/AppHeader";
import { LoadingPage } from "@/components/layout/Page";
import { OnlineGameProvider } from "@/hooks/useOnlineGame";
import { GameLoading } from "@/features/game-room/GameLoading";
import { GameConnectionUi } from "@/features/play/GameConnectionUi";
import { RouteBoundary } from "@/app/RouteBoundary";

const PlayHub = lazy(() => import("./pages/PlayHub"));
const Play = lazy(() => import("./pages/Play"));
const Puzzles = lazy(() => import("./pages/Puzzles"));
const Lessons = lazy(() => import("./pages/Lessons"));
const Analysis = lazy(() => import("./pages/AnalysisCenter"));
const Openings = lazy(() => import("./pages/Openings"));
const Profile = lazy(() => import("./pages/Profile"));
const Social = lazy(() => import("./pages/Social"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const GamePage = lazy(() => import("./pages/GamePage"));
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });
export function RequireAccount({ children }: {
    children: ReactNode;
}) {
    const { isAuthenticated, isGuest, loading } = useAuth();
    const location = useLocation();
    if (loading)
        return <LoadingPage />;
    if (!isAuthenticated || isGuest)
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }}/>;
    return <>{children}</>;
}
function LegacyOnline() { const location = useLocation(); return <Navigate to={`/play${location.search}`} replace />; }
function AppShell() {
    const location = useLocation();
    return <div className="app-shell"><a href="#main-content" className="skip-link">До вмісту</a><AppHeader />
    <main id="main-content" className="app-main"><RouteBoundary key={/^\/(online|game)(\/|$)/.test(location.pathname) ? "online" : location.pathname}><Suspense fallback={/^\/(game\/|play\/computer)/.test(location.pathname) ? <GameLoading /> : <LoadingPage />}><Routes>
      <Route path="/" element={<Navigate to="/play" replace />}/><Route path="/play" element={<PlayHub />}/><Route path="/play/computer" element={<Play />}/>
      <Route path="/online" element={<LegacyOnline />}/><Route path="/challenge/:challengeId" element={<PlayHub />}/><Route path="/game/:gameId" element={<RequireAccount><GamePage /></RequireAccount>}/>
      <Route path="/puzzles" element={<Puzzles />}/><Route path="/lessons" element={<Lessons />}/><Route path="/analysis" element={<Analysis />}/><Route path="/openings" element={<Openings />}/>
      <Route path="/profile" element={<RequireAccount><Profile /></RequireAccount>}/><Route path="/social" element={<RequireAccount><Social /></RequireAccount>}/>
      <Route path="/login" element={<Login />}/><Route path="/register" element={<Register />}/><Route path="/reset-password" element={<ResetPassword />}/>
      <Route path="/auth" element={<Navigate to="/login" replace/>}/><Route path="/learn" element={<Navigate to="/lessons" replace/>}/>
      <Route path="/ai-trainer" element={<Navigate to="/analysis" replace/>}/><Route path="/quests" element={<Navigate to="/lessons" replace/>}/>
      <Route path="/messages" element={<Navigate to="/social" replace/>}/><Route path="/tournaments" element={<Navigate to="/play" replace/>}/>
      <Route path="*" element={<NotFound />}/>
    </Routes></Suspense></RouteBoundary></main>
  </div>;
}
export default function App() { return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><BoardSettingsProvider><Toaster /><Sonner /><BrowserRouter><OnlineGameProvider><AppShell /><GameConnectionUi /></OnlineGameProvider></BrowserRouter></BoardSettingsProvider></TooltipProvider></AuthProvider></QueryClientProvider>; }
