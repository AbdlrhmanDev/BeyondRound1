import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import FeedbackButton from "@/components/FeedbackButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import GroupChat from "./pages/GroupChat";
import Discover from "./pages/Discover";
import PlaceSuggestions from "./pages/PlaceSuggestions";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminFeedback from "./pages/admin/AdminFeedback";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <FeedbackButton />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/u/:userId" element={<PublicProfile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/chat/:conversationId" element={<Chat />} />
            <Route path="/group-chat/:conversationId" element={<GroupChat />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/places" element={<PlaceSuggestions />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOverview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/feedback" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminFeedback />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/matches" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminMatches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/audit-logs" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminAuditLogs />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
