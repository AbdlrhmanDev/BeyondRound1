import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  getSubscription,
  getPaymentMethods,
  getInvoices,
  createCheckoutSession,
  cancelSubscription,
  Subscription,
  PaymentMethod,
  Invoice,
} from '@/services/subscriptionService';

// Lazy load Stripe only when checkout is needed (saves ~50KB on initial load)
let stripePromise: Promise<import('@stripe/stripe-js').Stripe | null> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then((m) =>
      m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
    );
  }
  return stripePromise;
};

// Types are now imported from subscriptionService

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
      const subscription = await getSubscription(user.id);
      setSubscription(subscription);
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
      const methods = await getPaymentMethods(user.id);
      setPaymentMethods(methods);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
    }
  };

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      const invoiceList = await getInvoices(user.id, 10);
      setInvoices(invoiceList);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    }
  };

  const handleCreateCheckoutSession = async (priceId: string) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const result = await createCheckoutSession(
        user.id,
        priceId,
        session.data.session.access_token
      );

      if (!result) {
        throw new Error('Failed to create checkout session');
      }

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // redirectToCheckout is available on Stripe instance from loadStripe
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: redirectError } = await (stripe as any).redirectToCheckout({
        sessionId: result.sessionId,
      });

      if (redirectError) throw redirectError;
    } catch (err) {
      const error = err as Error;
      console.error('Error creating checkout session:', error);
      setError(error.message);
      throw err;
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.stripe_subscription_id) {
      throw new Error('No active subscription to cancel');
    }

    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const success = await cancelSubscription(
        user.id,
        session.data.session.access_token
      );

      if (!success) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh subscription data
      await fetchSubscription();
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
    createCheckoutSession: handleCreateCheckoutSession,
    cancelSubscription: handleCancelSubscription,
    refetch: () => {
      fetchSubscription();
      fetchPaymentMethods();
      fetchInvoices();
    },
  };
};
