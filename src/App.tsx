import type { CSSProperties, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { BoardSettingsProvider } from "@/contexts/BoardSettingsContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OnlineGameProvider } from "@/hooks/useOnlineGame";
import Index from "./pages/Index";
import PlayHub from "./pages/PlayHub";
import Play from "./pages/Play";
import OnlinePlay from "./pages/OnlinePlay";
import PuzzlesPage from "./pages/Puzzles";
import Lessons from "./pages/Lessons";
import Tournaments from "./pages/Tournaments";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Analysis from "./pages/Analysis";
import Openings from "./pages/Openings";
import AITrainer from "./pages/AITrainer";
import Messages from "./pages/Messages";
import Social from "./pages/Social";
import GamePage from "./pages/GamePage";
import Quests from "./pages/Quests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppShell() {
  const { pathname } = useLocation();
  const isAuthRoute =
    pathname === "/auth" || pathname === "/login" || pathname === "/register" || pathname === "/reset-password";
  const isAnalysisRoute = pathname === "/analysis";
  const isLessonsRoute = pathname === "/lessons" || pathname === "/learn";

  if (isAnalysisRoute) {
    return (
      <div className="relative flex min-h-screen w-full overflow-hidden bg-[#080d14] text-white">
        <SiteBackground />
        <AppSidebar />
        <main className="relative z-10 flex-1 overflow-hidden">
          <Routes>
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        </main>
      </div>
    );
  }

  if (isLessonsRoute) {
    return (
      <div className="relative flex min-h-screen w-full overflow-hidden bg-[#080d14] text-white">
        <SiteBackground />
        <AppSidebar />
        <main className="relative z-10 flex-1 overflow-hidden">
          <Routes>
            <Route path="/learn" element={<Navigate to="/lessons" replace />} />
            <Route path="/lessons" element={<Lessons />} />
          </Routes>
        </main>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <main className="min-h-screen flex-1 overflow-y-auto">
        <Routes>
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#080d14] text-white">
      <SiteBackground />
      <AppSidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/play" element={<PlayHub />} />
            <Route path="/play/computer" element={<Play />} />
            <Route path="/online" element={<RequireAccount><OnlinePlay /></RequireAccount>} />
            <Route path="/puzzles" element={<PuzzlesPage />} />
            <Route path="/learn" element={<Navigate to="/lessons" replace />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/tournaments" element={<RequireAccount><Tournaments /></RequireAccount>} />
            <Route path="/profile" element={<RequireAccount><Profile /></RequireAccount>} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/messages" element={<RequireAccount><Messages /></RequireAccount>} />
            <Route path="/openings" element={<Openings />} />
            <Route path="/ai-trainer" element={<AITrainer />} />
            <Route path="/social" element={<RequireAccount><Social /></RequireAccount>} />
            <Route path="/quests" element={<RequireAccount><Quests /></RequireAccount>} />
            <Route path="/game/:gameId" element={<RequireAccount><GamePage /></RequireAccount>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function RequireAccount({ children }: { children: ReactNode }) {
  const { isAuthenticated, isGuest, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Завантаження…</div>;
  }

  if (!isAuthenticated || isGuest) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_0%,rgba(127,166,80,0.16),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(70,105,150,0.18),transparent_36%),linear-gradient(180deg,#0b1119_0%,#070a0f_100%)]" />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BoardSettingsProvider>
          <OnlineGameProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SidebarProvider
                style={
                  {
                    "--sidebar-width": "11.25rem",
                    "--sidebar-width-icon": "3rem",
                  } as CSSProperties
                }
              >
                <AppShell />
              </SidebarProvider>
            </BrowserRouter>
          </OnlineGameProvider>
        </BoardSettingsProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
