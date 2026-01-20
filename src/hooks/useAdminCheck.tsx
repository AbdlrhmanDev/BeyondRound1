import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdminCheck = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // تحسين: عدم استدعاء قاعدة البيانات إذا لم يكن هناك مستخدم
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAdminRole = async () => {
      try {
        // تحسين: استخدام timeout لتجنب الانتظار الطويل
        const checkPromise = supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        // Timeout بعد 3 ثواني
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Timeout")), 3000);
        });

        const { data, error } = await Promise.race([checkPromise, timeoutPromise]) as any;

        if (!isMounted) return;

        if (error) {
          console.error("Error checking admin role:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // تحسين: تأخير بسيط للسماح بتحميل الصفحة أولاً
    const delayId = setTimeout(() => {
      checkAdminRole();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(delayId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  return { isAdmin, isLoading };
};
