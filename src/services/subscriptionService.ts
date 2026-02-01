/**
 * Subscription Service - Handles subscription and billing operations
 * Following Single Responsibility Principle
 */

import { supabase } from '@/integrations/supabase/client';

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

/**
 * Gets user subscription
 */
export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getSubscription:", userId);
      return null;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return (data as Subscription) || null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

/**
 * Gets user payment methods
 */
export const getPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getPaymentMethods:", userId);
      return [];
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }

    return (data as PaymentMethod[]) || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
};

/**
 * Gets user invoices
 */
export const getInvoices = async (userId: string, limit: number = 10): Promise<Invoice[]> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for getInvoices:", userId);
      return [];
    }

    if (limit < 1 || limit > 100) {
      console.warn("Invalid limit for getInvoices, using default:", limit);
      limit = 10;
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }

    return (data as Invoice[]) || [];
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
};

/**
 * Creates Stripe checkout session
 */
export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  accessToken: string
): Promise<{ sessionId: string } | null> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for createCheckoutSession:", userId);
      return null;
    }

    if (!priceId?.trim()) {
      console.error("Invalid priceId for createCheckoutSession:", priceId);
      return null;
    }

    if (!accessToken?.trim()) {
      console.error("Invalid accessToken for createCheckoutSession");
      return null;
    }

    const { data, error } = await supabase.functions.invoke(
      'stripe-checkout',
      {
        body: {
          priceId,
          successUrl: `${window.location.origin}/settings?success=true`,
          cancelUrl: `${window.location.origin}/settings?canceled=true`,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }

    if (!data?.sessionId) {
      console.error('No session ID returned from checkout');
      return null;
    }

    return { sessionId: data.sessionId as string };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return null;
  }
};

/**
 * Cancels user subscription
 */
export const cancelSubscription = async (
  userId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!userId?.trim()) {
      console.error("Invalid userId for cancelSubscription:", userId);
      return false;
    }

    if (!accessToken?.trim()) {
      console.error("Invalid accessToken for cancelSubscription");
      return false;
    }

    const { error } = await supabase.functions.invoke(
      'stripe-cancel-subscription',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
};
