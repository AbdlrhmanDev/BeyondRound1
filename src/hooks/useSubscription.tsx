'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@/integrations/supabase/client';
import {
  getSubscription,
  getInvoices,
  getPaymentMethods,
  createCheckoutSession,
  cancelSubscription,
  resumeSubscription,
  openBillingPortal,
  switchPlan,
  type Subscription,
  type Invoice,
  type PaymentMethod,
} from '@/services/subscriptionService';

// Lazy-load Stripe JS (browser SDK) only when redirectToCheckout is needed
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then((m) =>
      m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
    );
  }
  return stripePromise;
};

export type { Subscription, Invoice, PaymentMethod };

export const useSubscription = () => {
  const { user } = useAuth();
  const supabase = createClient();

  const [subscription,   setSubscription]   = useState<Subscription | null>(null);
  const [invoices,       setInvoices]       = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getSubscription(user.id);
      setSubscription(data);
    } catch (err) {
      console.error('[useSubscription] fetchSubscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchInvoices = useCallback(async () => {
    if (!user?.id) return;
    try {
      setInvoices(await getInvoices(user.id, 10));
    } catch { /* non-critical */ }
  }, [user?.id]);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return;
    try {
      setPaymentMethods(await getPaymentMethods(user.id));
    } catch { /* non-critical */ }
  }, [user?.id]);

  // ── Load on mount + real-time subscription changes ─────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    fetchSubscription();
    fetchInvoices();
    fetchPaymentMethods();

    // Real-time: subscription row changes (webhook updates)
    const channel = supabase
      .channel(`billing:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => { fetchSubscription(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
        () => { fetchInvoices(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth token helper ──────────────────────────────────────────────────────
  const getToken = async (): Promise<string> => {
    // Use refreshSession() to guarantee a non-expired access token.
    // @supabase/ssr's getSession() reads from cookie storage and may return a
    // stale token if the background-tab auto-refresh timer was throttled.
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      return refreshed.session.access_token;
    }
    // Fallback: use existing session (covers cases where refresh fails but
    // the current token is still valid, e.g. transient network error).
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return session.access_token;
  };

  // ── Billing actions ────────────────────────────────────────────────────────

  const handleCheckout = async (priceId: string) => {
    if (!user) throw new Error('Not authenticated');
    const token = await getToken();

    const result = await createCheckoutSession(user.id, priceId, token);

    // If the API returned a direct URL (payment link style) use it
    if (result.url) {
      window.location.href = result.url;
      return;
    }

    // Otherwise use Stripe.js redirectToCheckout
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe.js failed to load');
    const { error: redirectError } = await (stripe as unknown as {
      redirectToCheckout: (opts: { sessionId: string }) => Promise<{ error?: Error }>;
    }).redirectToCheckout({ sessionId: result.sessionId });
    if (redirectError) throw redirectError;
  };

  const handleCancel = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getToken();
    await cancelSubscription(user.id, token);
    // Optimistic update — webhook will confirm
    setSubscription((s) => s ? { ...s, cancel_at_period_end: true } : s);
  };

  const handleResume = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getToken();
    await resumeSubscription(token);
    setSubscription((s) => s ? { ...s, cancel_at_period_end: false, canceled_at: null } : s);
  };

  const handleOpenPortal = async () => {
    if (!user) throw new Error('Not authenticated');
    const token = await getToken();
    const url = await openBillingPortal(token);
    window.open(url, '_blank', 'noopener');
  };

  const handleSwitchPlan = async (newPriceId: string) => {
    if (!user) throw new Error('Not authenticated');
    const token = await getToken();
    await switchPlan(newPriceId, token);
    await fetchSubscription();
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const isActive      = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isPastDue     = subscription?.status === 'past_due' || subscription?.status === 'unpaid';
  const isCanceled    = subscription?.status === 'canceled';
  const isPendingEnd  = !!(subscription?.cancel_at_period_end && isActive);
  const hasOneTime    = subscription?.status === 'one_time_paid';
  const hasAnyAccess  = isActive || isPendingEnd || hasOneTime;

  return {
    // Data
    subscription,
    invoices,
    paymentMethods,
    loading,
    error,
    // Derived
    isActive,
    isPastDue,
    isCanceled,
    isPendingEnd,
    hasOneTime,
    hasAnyAccess,
    // Actions
    createCheckoutSession: handleCheckout,
    cancelSubscription:    handleCancel,
    resumeSubscription:    handleResume,
    openPortal:            handleOpenPortal,
    switchPlan:            handleSwitchPlan,
    refetch: () => {
      fetchSubscription();
      fetchInvoices();
      fetchPaymentMethods();
    },
  };
};
