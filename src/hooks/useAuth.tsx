import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface ExtendedError extends Error {
  status?: number;
  code?: string;
  userCreated?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; data?: { user: User | null } }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const statusCheckCache: Map<string, boolean> = new Map();
    let statusCheckPromise: Promise<boolean> | null = null;

    // Function to check if user is banned/suspended with caching and debouncing
    const checkUserStatus = async (userId: string | undefined): Promise<boolean> => {
      if (!userId) return false;
      
      // تحسين: استخدام cache لتجنب استدعاءات مكررة
      if (statusCheckCache.has(userId)) {
        return statusCheckCache.get(userId) || false;
      }
      
      // تحسين: إذا كان هناك استدعاء قيد التنفيذ، انتظر نفس الـ promise
      if (statusCheckPromise) {
        return statusCheckPromise;
      }
      
      statusCheckPromise = (async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("status")
            .eq("user_id", userId)
            .maybeSingle();
          
          const isBanned = !!(profile && (profile.status === "banned" || profile.status === "suspended"));
          
          // حفظ في cache
          statusCheckCache.set(userId, isBanned);
          
          if (isBanned && isMounted) {
            // Sign out banned/suspended users
            await supabase.auth.signOut();
          }
          
          return isBanned;
        } catch (error) {
          console.error("Error checking user status:", error);
          return false;
        } finally {
          statusCheckPromise = null;
        }
      })();
      
      return statusCheckPromise;
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        // تحسين: تعيين loading إلى false فوراً للسماح بعرض الصفحة
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
        
        // تحسين: التحقق من حالة المستخدم بشكل غير متزامن بعد تعيين الحالة
        if (session?.user) {
          checkUserStatus(session.user.id).then((isBanned) => {
            if (isBanned && isMounted) {
              setSession(null);
              setUser(null);
            }
          });
        }
      }
    );

    // THEN check for existing session (only once on mount)
    const sessionTimeoutMs = 3000; // Stop loading after 3s so UI appears; listener will update when session resolves
    const sessionTimeoutId = window.setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, sessionTimeoutMs);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      window.clearTimeout(sessionTimeoutId);
      if (!isMounted) return;
      
      // تحسين: تعيين الحالة فوراً بدون انتظار التحقق من الحالة
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
      
      // تحسين: التحقق من حالة المستخدم بشكل غير متزامن
      if (session?.user) {
        checkUserStatus(session.user.id).then((isBanned) => {
          if (isBanned && isMounted) {
            setSession(null);
            setUser(null);
          }
        });
      }
    });

    return () => {
      window.clearTimeout(sessionTimeoutId);
      isMounted = false;
      subscription.unsubscribe();
      statusCheckCache.clear();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // ✅ الحل: استخدم callback URL بدلاً من "/" مباشرة
      // تأكد من تسجيل هذا الـ URL في Supabase Dashboard → Auth → URL Configuration
      const callbackUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: fullName,
          },
        },
      });

      // Check if user was created despite error (sometimes happens with email errors)
      if (data?.user) {
        console.log('✅ User created successfully:', data.user.id);
        // Even if there's an error, if user exists, it might be an email sending issue
        if (error && error.message.includes('confirmation email')) {
          console.warn('⚠️ User created but email confirmation failed. This might be a configuration issue.');
        }
      } else if (error) {
        console.warn('⚠️ No user data returned - transaction may have been rolled back');
        // Try to verify if user exists by attempting to sign in (for debugging)
        console.log('💡 This likely means the database trigger failed. Check Supabase logs for trigger errors.');
      }

      // تحسين: log detailed error for debugging
      if (error) {
        const authError = error as AuthError;
        console.error('❌ Signup Error Details:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          userCreated: !!data?.user,
          userData: data?.user ? { id: data.user.id, email: data.user.email } : null,
        });
        
        // Log the full error object for debugging
        console.error('Full error object:', JSON.stringify(authError, Object.getOwnPropertyNames(authError), 2));
        
        // If it's an email error but user was created, provide helpful message
        if (data?.user && authError.message.includes('confirmation email')) {
          // User was created but email failed - this is often a configuration issue
          const emailError: ExtendedError = new Error('Account created but confirmation email could not be sent. Please check your email configuration in Supabase Dashboard or contact support.');
          emailError.status = authError.status;
          emailError.code = 'email_send_failed';
          emailError.userCreated = true;
          return { error: emailError, data };
        }
        
        // If no user was created and it's a 500 error, it's likely a trigger/database issue
        if (!data?.user && authError.status === 500 && authError.message.includes('confirmation email')) {
          console.error('🔴 CRITICAL: Database trigger likely failed. The handle_new_user() function needs to be fixed.');
          console.error('📋 Action required: Apply migration supabase/migrations/20260120160013_fix_handle_new_user_trigger.sql');
        }
      }

      return { error, data };
    } catch (err) {
      console.error('Signup unexpected error:', err);
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) return { error: new Error("Not signed in") };
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) return { error: signInError };
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return { error: updateError };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};