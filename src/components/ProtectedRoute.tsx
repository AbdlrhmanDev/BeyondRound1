import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that handles authentication and admin redirects
 * - If user is admin, redirects to /admin
 * - If user is not admin, allows access to regular dashboard
 * - If not authenticated, redirects to /auth
 */
const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  // Check user status when user is available
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("status, ban_reason")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile && (profile.status === "banned" || profile.status === "suspended")) {
        setIsBanned(true);
        // Sign out banned/suspended users
        await signOut();
      }
      setCheckingStatus(false);
    };

    if (!authLoading && user) {
      checkUserStatus();
    } else if (!authLoading) {
      setCheckingStatus(false);
    }
  }, [user, authLoading, signOut]);

  // Show loading while checking auth, admin status, and user status
  if (authLoading || adminLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to auth if not logged in or if banned
  if (!user || isBanned) {
    return <Navigate to="/auth" replace />;
  }

  // If admin tries to access regular dashboard, redirect to admin dashboard
  if (isAdmin && !requireAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If non-admin tries to access admin route, redirect to regular dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
