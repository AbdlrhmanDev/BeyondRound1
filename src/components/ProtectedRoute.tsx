'use client';

import { ReactNode, useEffect, useState } from "react";
import { Redirect } from "@/components/Redirect";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useLocale } from "@/contexts/LocaleContext";
import { isUserBanned } from "@/services/userService";
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
  const { pathWithLocale } = useLocale();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  // Check user status when user is available
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setCheckingStatus(false);
        return;
      }

      const banned = await isUserBanned(user.id);
      if (banned) {
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

  // Show loading while checking auth, admin status, and user status (mobile-safe)
  if (authLoading || adminLoading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 pb-[env(safe-area-inset-bottom)]">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  // Redirect to auth if not logged in or if banned
  if (!user || isBanned) {
    return <Redirect to={pathWithLocale("/auth")} replace />;
  }

  // If admin tries to access regular dashboard, redirect to admin dashboard
  if (isAdmin && !requireAdmin) {
    return <Redirect to={pathWithLocale("/admin")} replace />;
  }

  // If non-admin tries to access admin route, redirect to regular dashboard
  if (requireAdmin && !isAdmin) {
    return <Redirect to={pathWithLocale("/dashboard")} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
