import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  plan_name: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
}

export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  type: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
}

export interface Invoice {
  id: string;
  stripe_invoice_id: string;
  amount: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubscription();
    fetchPaymentMethods();
    fetchInvoices();

    // Subscribe to subscription changes with error handling
    let subscriptionChannel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      subscriptionChannel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            try {
              fetchSubscription();
            } catch (err) {
              // Silently handle errors in subscription callback
            }
          }
        );
      
      // Subscribe with error handling
      try {
        subscriptionChannel.subscribe();
      } catch (subscribeError) {
        // Silently catch subscription errors - they're often from browser extensions
      }
    } catch (err) {
      // Silently handle channel creation errors
    }

    return () => {
      if (subscriptionChannel) {
        try {
          subscriptionChannel.unsubscribe();
        } catch (err) {
          // Silently handle cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSubscription((data as Subscription) || null);
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching subscription:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPaymentMethods((data as PaymentMethod[]) || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;
      setInvoices((data as Invoice[]) || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const createCheckoutSession = async (priceId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const { data, error: fetchError } = await supabase.functions.invoke(
        'stripe-checkout',
        {
          body: {
            priceId,
            successUrl: `${window.location.origin}/settings?success=true`,
            cancelUrl: `${window.location.origin}/settings?canceled=true`,
          },
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        }
      );

      if (fetchError) throw fetchError;

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      if (!data?.sessionId) {
        throw new Error('No session ID returned from checkout');
      }

      // redirectToCheckout is available on Stripe instance from loadStripe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: redirectError } = await (stripe as any).redirectToCheckout({
        sessionId: data.sessionId as string,
      });

      if (redirectError) throw redirectError;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating checkout session:', error);
      setError(error.message);
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      throw new Error('No active subscription to cancel');
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const { data, error: cancelError } = await supabase.functions.invoke(
        'stripe-cancel-subscription',
        {
          headers: {
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
        }
      );

      if (cancelError) throw cancelError;

      // Refresh subscription data
      await fetchSubscription();
      
      return data;
    } catch (err) {
      const error = err as Error;
      console.error('Error canceling subscription:', error);
      setError(error.message);
      throw err;
    }
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isCanceled = subscription?.cancel_at_period_end || subscription?.status === 'canceled';

  return {
    subscription,
    paymentMethods,
    invoices,
    loading,
    error,
    isActive,
    isCanceled,
    createCheckoutSession,
    cancelSubscription,
    refetch: () => {
      fetchSubscription();
      fetchPaymentMethods();
      fetchInvoices();
    },
  };
};
