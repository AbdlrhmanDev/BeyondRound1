'use client';

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useTranslation } from "react-i18next";

const AuthCallback = () => {
  const navigate = useLocalizedNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useTranslation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth?error=auth_failed");
          return;
        }

        if (session) {
          setTimeout(() => {
            if (isAdmin) {
              navigate("/admin", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }, adminLoading ? 1000 : 100);
        } else {
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
        <p className="text-primary-foreground/60">{t("auth.completingSignIn")}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
