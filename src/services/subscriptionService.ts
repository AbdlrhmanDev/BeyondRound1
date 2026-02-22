/**
 * Subscription Service — all billing operations for BeyondRounds.
 * All Stripe calls go through /api/billing/* route handlers (server-only).
 */

import { getSupabaseClient } from '@/integrations/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Subscription {
  id:                          string;
  user_id:                     string;
  stripe_customer_id:          string | null;
  stripe_subscription_id:      string | null;
  stripe_subscription_item_id: string | null;
  stripe_price_id:             string | null;
  status:                      SubscriptionStatus;
  plan_name:                   string | null;
  interval:                    string | null;
  current_period_start:        string | null;
  current_period_end:          string | null;
  cancel_at_period_end:        boolean;
  canceled_at:                 string | null;
  trial_end:                   string | null;
  payment_failed_at:           string | null;
  next_payment_attempt:        string | null;
}

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'one_time_paid'
  | 'inactive';

export interface Invoice {
  id:                  string;
  stripe_invoice_id:   string;
  amount:              number;
  currency:            string;
  status:              string;
  invoice_pdf:         string | null;
  hosted_invoice_url:  string | null;
  period_start:        string | null;
  period_end:          string | null;
  paid_at:             string | null;
}

export interface PaymentMethod {
  id:                       string;
  stripe_payment_method_id: string;
  type:                     string;
  card_brand:               string | null;
  card_last4:               string | null;
  card_exp_month:           number | null;
  card_exp_year:            number | null;
  is_default:               boolean;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function post<T>(
  path: string,
  body: Record<string, unknown> = {},
  token: string
): Promise<T> {
  const res = await fetch(path, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  }
  return json as T;
}

// ─── Read functions (Supabase DB — client-side, RLS protected) ────────────────

export async function getSubscription(userId: string): Promise<Subscription | null> {
  if (!userId?.trim()) return null;
  const { data, error } = await getSupabaseClient()
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error('[subscriptionService] getSubscription:', error);
    return null;
  }
  return (data as Subscription) ?? null;
}

export async function getInvoices(userId: string, limit = 10): Promise<Invoice[]> {
  if (!userId?.trim()) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const { data, error } = await getSupabaseClient()
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);
  if (error) {
    console.error('[subscriptionService] getInvoices:', error);
    return [];
  }
  return (data as Invoice[]) ?? [];
}

export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  if (!userId?.trim()) return [];
  const { data, error } = await getSupabaseClient()
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[subscriptionService] getPaymentMethods:', error);
    return [];
  }
  return (data as PaymentMethod[]) ?? [];
}

// ─── Billing actions (proxied through Next.js → Supabase Edge Functions) ──────

/** Creates a Stripe Checkout session and redirects the user. */
export async function createCheckoutSession(
  _userId: string,  // kept for backward compat, not used in new flow
  priceId: string,
  accessToken: string
): Promise<{ sessionId: string; url: string }> {
  // Return to current page after checkout so the billing sheet can show the new state
  const returnBase = `${window.location.origin}${window.location.pathname}`;
  return post<{ sessionId: string; url: string }>(
    '/api/billing/checkout',
    {
      priceId,
      successUrl: `${returnBase}?billing_success=true`,
      cancelUrl:  returnBase,
    },
    accessToken
  );
}

/** Opens the Stripe Customer Portal (payment method, invoices, history). */
export async function openBillingPortal(accessToken: string): Promise<string> {
  const returnBase = `${window.location.origin}${window.location.pathname}`;
  const { url } = await post<{ url: string }>(
    '/api/billing/portal',
    { returnUrl: returnBase },
    accessToken
  );
  return url;
}

/** Cancels the active subscription at the end of the current period. */
export async function cancelSubscription(
  _userId: string,  // kept for backward compat
  accessToken: string
): Promise<void> {
  await post('/api/billing/cancel', {}, accessToken);
}

/** Resumes a subscription that was set to cancel_at_period_end. */
export async function resumeSubscription(accessToken: string): Promise<void> {
  await post('/api/billing/resume', {}, accessToken);
}

/** Switches the subscription to a different Stripe Price ID. */
export async function switchPlan(newPriceId: string, accessToken: string): Promise<void> {
  await post('/api/billing/switch', { newPriceId }, accessToken);
}
