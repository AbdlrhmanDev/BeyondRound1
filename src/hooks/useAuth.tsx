import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let statusCheckCache: Map<string, boolean> = new Map();

    // Function to check if user is banned/suspended with caching
    const checkUserStatus = async (userId: string | undefined): Promise<boolean> => {
      if (!userId) return false;
      
      // تحسين: استخدام cache لتجنب استدعاءات مكررة
      if (statusCheckCache.has(userId)) {
        return statusCheckCache.get(userId) || false;
      }
      
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
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (session?.user) {
          // Check if user is banned/suspended
          const isBanned = await checkUserStatus(session.user.id);
          if (isBanned) {
            // User is banned, don't set session
            if (isMounted) {
              setSession(null);
              setUser(null);
              setLoading(false);
            }
            return;
          }
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session (only once on mount)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      
      if (session?.user) {
        // Check if user is banned/suspended
        const isBanned = await checkUserStatus(session.user.id);
        if (isBanned) {
          // User is banned, don't set session
          if (isMounted) {
            setSession(null);
            setUser(null);
            setLoading(false);
          }
          return;
        }
      }
      
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      statusCheckCache.clear();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
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

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
