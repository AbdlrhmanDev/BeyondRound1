'use client';

import { useState, useEffect, createContext, useContext, type ReactNode, useRef } from 'react';
import type { User, Session, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { createClient } from '@/integrations/supabase/client';

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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient<Database> | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const supabase = createClient();
    supabaseRef.current = supabase;

    let isMounted = true;
    const statusCheckCache = new Map<string, boolean>();
    let statusCheckPromise: Promise<boolean> | null = null;
    let sessionTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkUserStatus = async (userId: string | undefined): Promise<boolean> => {
      if (!userId) return false;
      if (statusCheckCache.has(userId)) return statusCheckCache.get(userId) ?? false;
      if (statusCheckPromise) return statusCheckPromise;

      statusCheckPromise = (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('status')
            .eq('user_id', userId)
            .maybeSingle();

          const isBanned = !!(profile && (profile.status === 'banned' || profile.status === 'suspended'));
          statusCheckCache.set(userId, isBanned);

          if (isBanned && isMounted) {
            await supabase.auth.signOut();
          }

          return isBanned;
        } catch {
          return false;
        } finally {
          statusCheckPromise = null;
        }
      })();

      return statusCheckPromise;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, sess) => {
        if (!isMounted) return;
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);

        if (sess?.user) {
          checkUserStatus(sess.user.id).then((banned) => {
            if (banned && isMounted) {
              setSession(null);
              setUser(null);
            }
          });
        }
      }
    );

    sessionTimeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 500);

    // Defer getSession to avoid blocking main thread on mobile (improves TBT/LCP)
    const runSessionCheck = () => {
      supabase.auth.getSession().then(({ data: { session: sess } }) => {
        if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
        sessionTimeoutId = null;
        if (!isMounted) return;

        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);

        if (sess?.user) {
          checkUserStatus(sess.user.id).then((banned) => {
            if (banned && isMounted) {
              setSession(null);
              setUser(null);
            }
          });
        }
      });
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(runSessionCheck, { timeout: 800 });
    } else {
      setTimeout(runSessionCheck, 150);
    }

    return () => {
      isMounted = false;
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
      subscription.unsubscribe();
      statusCheckCache.clear();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = supabaseRef.current ?? createClient();
    supabaseRef.current = supabase;

    try {
      // Create user via server-side admin API (bypasses Supabase SMTP)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const body = await res.json();

      if (!res.ok) {
        const err: ExtendedError = new Error(body.error || 'Signup failed');
        if (res.status === 409) err.code = 'user_already_exists';
        return { error: err };
      }

      // User is auto-confirmed — sign in immediately to get a session
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { error, data };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = supabaseRef.current ?? createClient();
    supabaseRef.current = supabase;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const supabase = supabaseRef.current ?? createClient();
    supabaseRef.current = supabase;
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const locale = ['de', 'en'].includes(pathParts[0]) ? pathParts[0] : 'de';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const supabase = supabaseRef.current ?? createClient();
    await supabase.auth.signOut();
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) return { error: new Error('Not signed in') };

    const supabase = supabaseRef.current ?? createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) return { error: signInError };

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return { error: updateError };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe fallback context for pages that omit AuthProvider for performance
    return {
      user: null,
      session: null,
      loading: false,
      signUp: async () => ({ error: new Error('Auth not available on this page') }),
      signIn: async () => ({ error: new Error('Auth not available on this page') }),
      signInWithGoogle: async () => ({ error: new Error('Auth not available on this page') }),
      signOut: async () => { },
      updatePassword: async () => ({ error: new Error('Auth not available on this page') }),
    };
  }
  return context;
};
