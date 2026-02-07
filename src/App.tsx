import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AnalyticsProvider } from "@/hooks/use-analytics";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FoodChecker from "./pages/FoodChecker";
import LogMeal from "./pages/LogMeal";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin-slow" />
          <p className="text-muted-foreground text-sm animate-pulse-soft">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/auth" element={
          <PageTransition>
            <Auth />
          </PageTransition>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <PageTransition>
              <Index />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/food-checker" element={
          <ProtectedRoute>
            <PageTransition>
              <FoodChecker />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/log-meal" element={
          <ProtectedRoute>
            <PageTransition>
              <LogMeal />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <PageTransition>
              <Insights />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition>
              <Profile />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/suggestions" element={<Navigate to="/insights" replace />} />
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsProvider>
              <AppRoutes />
            </AnalyticsProvider>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

