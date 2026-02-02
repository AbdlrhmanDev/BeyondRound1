import { lazy, Suspense, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeSync } from "@/components/ThemeSync";
import { CookieConsent } from "@/components/CookieConsent";
import RedirectToLocale from "@/components/RedirectToLocale";
import LocaleLayout from "@/components/LocaleLayout";
import { Analytics } from "@vercel/analytics/react";

// Lazy load non-critical components
const FeedbackButton = lazy(() => import("@/components/FeedbackButton"));

// Lazy load routes for code splitting
const Index = lazy(() => import("./pages/Index"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const Matches = lazy(() => import("./pages/Matches"));
const Chat = lazy(() => import("./pages/Chat"));
const GroupChat = lazy(() => import("@/pages/GroupChat"));
const PlaceSuggestions = lazy(() => import("./pages/PlaceSuggestions"));
const About = lazy(() => import("./pages/About"));
const LearnMore = lazy(() => import("./pages/LearnMore"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const ForDoctors = lazy(() => import("./pages/ForDoctors"));
const Survey = lazy(() => import("./pages/Survey"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminFeedback = lazy(() => import("./pages/admin/AdminFeedback"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

// Lightweight loading fallback – visible immediately, minimal DOM for faster paint on mobile
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
    <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
  </div>
);

// Create QueryClient with optimized defaults for performance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

const queryClient = createQueryClient();

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
          <ThemeSync />
          <CookieConsent />
          <Analytics mode="production" />
          <Suspense fallback={null}>
            <FeedbackButton />
          </Suspense>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<RedirectToLocale />} />
              <Route path="/:locale" element={<LocaleLayout />}>
                <Route index element={<Index />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="auth" element={<Auth />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="auth/callback" element={<AuthCallback />} />
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route path="profile" element={<Profile />} />
                <Route path="u/:userId" element={<PublicProfile />} />
                <Route path="matches" element={<Matches />} />
                <Route path="chat/:conversationId" element={<Chat />} />
                <Route path="group-chat/:conversationId" element={<GroupChat />} />
                <Route path="places" element={<PlaceSuggestions />} />
                <Route path="about" element={<About />} />
                <Route path="learn-more" element={<LearnMore />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="contact" element={<Contact />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<Privacy />} />
                <Route path="waitlist" element={<Waitlist />} />
                <Route path="for-doctors" element={<ForDoctors />} />
                <Route path="survey" element={<Survey />} />
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminOverview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/feedback"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminFeedback />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/matches"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminMatches />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/audit-logs"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminAuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="*" element={<RedirectToLocale />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
