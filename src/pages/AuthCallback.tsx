import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth?error=auth_failed");
          return;
        }

        if (session) {
          // Wait a bit for admin check to complete, then redirect
          setTimeout(() => {
            if (isAdmin) {
              navigate("/admin", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }, adminLoading ? 1000 : 100);
        } else {
          // No session, redirect to auth
          navigate("/auth", { replace: true });
        }
      } catch (err) {
        console.error("Unexpected error in auth callback:", err);
        navigate("/auth?error=unexpected_error", { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, isAdmin, adminLoading]);

  return (
    <div className="min-h-screen bg-foreground dark:bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-primary-foreground/60">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
