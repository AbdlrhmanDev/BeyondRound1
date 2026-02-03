'use client';

import { useState, useEffect, createContext, useContext, type ReactNode, useRef } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getClient } from '@/lib/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(getClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    if (!supabase) return;

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

    return () => {
      isMounted = false;
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
      subscription.unsubscribe();
      statusCheckCache.clear();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return { error: new Error('Supabase not initialized') };

    try {
      const callbackUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: { full_name: fullName },
        },
      });

      if (data?.user && error?.message?.includes('confirmation email')) {
        const emailError: ExtendedError = new Error('Account created but confirmation email could not be sent.');
        emailError.status = (error as AuthError).status;
        emailError.code = 'email_send_failed';
        emailError.userCreated = true;
        return { error: emailError, data };
      }

      if (!data?.user && (error as AuthError)?.status === 500 && (error as AuthError)?.message?.includes('confirmation email')) {
        const extErr: ExtendedError = new Error('Database configuration issue. Please contact support.');
        return { error: extErr };
      }

      return { error, data };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = supabaseRef.current;
    if (!supabase) return { error: new Error('Supabase not initialized') };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const supabase = supabaseRef.current;
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    if (!user?.email) return { error: new Error('Not signed in') };

    const supabase = supabaseRef.current;
    if (!supabase) return { error: new Error('Supabase not initialized') };

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
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
