'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  CreditCard, Check, Calendar, Download, ExternalLink,
  AlertTriangle, RefreshCw, Zap, Crown, ArrowUpRight,
  Loader2, X, ChevronRight, ShieldCheck, Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscription } from '@/hooks/useSubscription';

// ─── Plan definitions ──────────────────────────────────────────────────────────

interface Plan {
  id:          string;
  name:        string;
  price:       string;
  perMonth:    string;
  billed?:     string;
  priceId:     string;
  description: string;
  features:    string[];
  badge?:      string;
  badgeColor:  string;
  highlight:   boolean;
}

const PLANS: Plan[] = [
  {
    id:          'one_time',
    name:        'One-Time Match',
    price:       '€9.99',
    perMonth:    'once',
    priceId:     process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ONE_TIME || '',
    description: 'Try BeyondRounds once — no commitment',
    features:    ['One curated group match', 'Private group chat access', 'RoundsBot icebreakers', 'Basic matching'],
    badgeColor:  'bg-[#3A0B22]',
    highlight:   false,
  },
  {
    id:          'monthly',
    name:        'Monthly',
    price:       '€19.99',
    perMonth:    '/month',
    priceId:     process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY || '',
    description: 'Most popular',
    features:    ['Weekly curated matches', 'Priority in matching', 'Expanded profile & interests', 'Early access to features', 'Priority support'],
    badge:       'Most Popular',
    badgeColor:  'bg-[#F27C5C]',
    highlight:   true,
  },
  {
    id:          'three_month',
    name:        '3-Month',
    price:       '€14.99',
    perMonth:    '/month',
    billed:      'billed €44.97',
    priceId:     process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_THREE_MONTH || '',
    description: 'Save 25% vs monthly',
    features:    ['Everything in Monthly', 'Save €15 vs monthly', '3-month commitment'],
    badge:       'Save 25%',
    badgeColor:  'bg-[#3A0B22]',
    highlight:   false,
  },
  {
    id:          'six_month',
    name:        '6-Month',
    price:       '€10',
    perMonth:    '/month',
    billed:      'billed €59.94',
    priceId:     process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SIX_MONTH || '',
    description: 'Save 50% — best value',
    features:    ['Everything in Monthly', 'Save €60 vs monthly', 'Maximum discount'],
    badge:       'Best Value',
    badgeColor:  'bg-[#3A0B22]',
    highlight:   false,
  },
];

// Plans available for subscription (no one-time in switch/upgrade)
const SUBSCRIPTION_PLANS = PLANS.filter((p) => p.id !== 'one_time');

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return format(new Date(iso), 'MMM d, yyyy');
}

function fmtMoney(amount: number, currency = 'eur') {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);
}

// ─── Small reusable pieces ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#5E555B]/60 uppercase tracking-widest px-1 mb-2">
      {children}
    </p>
  );
}

function ActionBtn({
  onClick, disabled, loading, icon: Icon, children, variant = 'outline',
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  icon: React.ElementType; children: React.ReactNode;
  variant?: 'outline' | 'solid' | 'ghost' | 'danger';
}) {
  const base = 'w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed';
  const styles: Record<string, string> = {
    solid:   'bg-[#3A0B22] text-white hover:bg-[#3A0B22]/90',
    outline: 'border border-[rgba(58,11,34,0.20)] text-[#3A0B22] hover:bg-[#3A0B22]/5',
    ghost:   'text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/5',
    danger:  'text-red-500 hover:text-red-600 hover:bg-red-50',
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles[variant]}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4 shrink-0" />}
      <span className="flex-1 text-left">{children}</span>
      {variant === 'outline' && <ArrowUpRight className="h-4 w-4 opacity-40 shrink-0" />}
    </button>
  );
}

// ─── Plan card (for picker + switch dialog) ────────────────────────────────────

function PlanCard({
  plan, current, onSelect, loading,
}: {
  plan: Plan; current?: boolean; onSelect: (priceId: string) => void; loading: boolean;
}) {
  return (
    <div className="relative pt-4 flex flex-col">
      {plan.badge && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap
          px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-white shadow-sm ${plan.badgeColor}`}>
          {plan.badge}
        </div>
      )}
      <div className={`flex flex-col flex-1 rounded-2xl bg-white transition-all duration-200 overflow-hidden
        ${plan.highlight
          ? 'border-2 border-[#F27C5C] shadow-lg shadow-[#F27C5C]/15'
          : 'border border-[rgba(58,11,34,0.12)] shadow-sm hover:border-[#F27C5C]/40 hover:shadow-md'}
        ${current ? 'ring-2 ring-[#3A0B22] ring-offset-1' : ''}`}>
        {plan.highlight && <div className="h-0.5 w-full bg-gradient-to-r from-[#F27C5C] to-[#F6B4A8]" />}
        <div className="flex flex-col flex-1 p-4">
          <p className="text-[12px] font-bold text-[#1A0A12]">{plan.name}</p>
          <div className="mt-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-extrabold text-[#1A0A12] tracking-tight">{plan.price}</span>
              <span className="text-xs text-[#5E555B] ml-0.5">{plan.perMonth}</span>
            </div>
            {plan.billed && <p className="text-[10px] text-[#5E555B] mt-0.5">{plan.billed}</p>}
          </div>
          <div className="my-3 h-px bg-[rgba(58,11,34,0.07)]" />
          <ul className="space-y-1.5 flex-1">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="h-3 w-3 text-[#F27C5C] mt-0.5 shrink-0" />
                <span className="text-[10px] text-[#5E555B] leading-snug">{f}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={loading || current}
            onClick={() => { if (!current && !loading) onSelect(plan.priceId); }}
            className={`mt-3 w-full h-9 rounded-xl text-xs font-semibold transition-all duration-150
              flex items-center justify-center gap-1.5 active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${current
                ? 'bg-[rgba(58,11,34,0.07)] text-[#3A0B22]/60 cursor-default'
                : plan.highlight
                ? 'bg-[#F27C5C] text-white hover:bg-[#e56a4a] shadow-sm shadow-[#F27C5C]/25'
                : 'border border-[rgba(58,11,34,0.20)] text-[#3A0B22] hover:bg-[#3A0B22]/5'}`}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : current ? 'Current plan' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main BillingSection component ────────────────────────────────────────────

export const BillingSection = () => {
  const {
    subscription, invoices, loading,
    isActive, isPastDue, isCanceled, isPendingEnd, hasOneTime,
    createCheckoutSession, cancelSubscription, resumeSubscription,
    openPortal, switchPlan, refetch,
  } = useSubscription();

  const [processingPriceId, setProcessingPriceId] = useState<string | null>(null);
  const [cancelDialogOpen,  setCancelDialogOpen]  = useState(false);
  const [switchDialogOpen,  setSwitchDialogOpen]  = useState(false);
  const [actionLoading,     setActionLoading]     = useState(false);

  const currentPriceId = subscription?.stripe_price_id;
  const currentPlan    = PLANS.find((p) => p.priceId === currentPriceId);
  const hasSubscription = isActive || isPastDue || isPendingEnd || hasOneTime;

  // Auto-refetch when returning from Stripe checkout (billing_success param)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('billing_success') === 'true') {
      url.searchParams.delete('billing_success');
      window.history.replaceState({}, '', url.toString());
      // Poll until webhook has updated the subscription row (max ~10s)
      let attempts = 0;
      const poll = setInterval(() => {
        refetch();
        if (++attempts >= 5) clearInterval(poll);
      }, 2000);
      return () => clearInterval(poll);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCheckout = async (priceId: string) => {
    if (!priceId) { toast.error('Plan not configured — check NEXT_PUBLIC_STRIPE_PRICE_ID_* env vars.'); return; }
    try {
      setProcessingPriceId(priceId);
      await createCheckoutSession(priceId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setProcessingPriceId(null);
    }
  };

  const handlePortal = async () => {
    try {
      setActionLoading(true);
      await openPortal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open billing portal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await cancelSubscription();
      setCancelDialogOpen(false);
      toast.success(`Subscription will end on ${fmt(subscription?.current_period_end)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      await resumeSubscription();
      toast.success('Subscription resumed — you\'re all set!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Resume failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitch = async (priceId: string) => {
    if (!priceId) return;
    try {
      setProcessingPriceId(priceId);
      await switchPlan(priceId);
      setSwitchDialogOpen(false);
      toast.success('Plan switched successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Plan switch failed');
    } finally {
      setProcessingPriceId(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-2xl bg-[#F7F2EE] animate-pulse" />
        <div className="h-11 rounded-xl bg-[#F7F2EE] animate-pulse" />
        <div className="h-11 rounded-xl bg-[#F7F2EE] animate-pulse" />
      </div>
    );
  }

  // ── State 1: No subscription ─────────────────────────────────────────────────
  if (!hasSubscription && !isCanceled) {
    return (
      <div className="space-y-4">
        {/* Headline */}
        <div className="text-center py-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#3A0B22]/10 mb-3">
            <Sparkles className="h-6 w-6 text-[#3A0B22]" />
          </div>
          <p className="text-base font-bold text-[#1A0A12]">Choose a plan to get started</p>
          <p className="text-xs text-[#5E555B] mt-1">Simple, honest pricing — cancel anytime</p>
        </div>

        {/* Plan grid — pt-5 so floating badges have room */}
        <div className="grid grid-cols-2 gap-3 pt-5 overflow-visible">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              loading={processingPriceId === plan.priceId}
              onSelect={handleCheckout}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-[#5E555B]/50" />
          <p className="text-[10px] text-[#5E555B]/50">Secure checkout via Stripe · Apple Pay &amp; Google Pay supported</p>
        </div>
      </div>
    );
  }

  // ── State 2: Canceled — show resubscribe ─────────────────────────────────────
  if (isCanceled) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F7F2EE] border border-[rgba(58,11,34,0.10)]">
          <RotateCcw className="h-5 w-5 text-[#5E555B] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#1A0A12]">Subscription ended</p>
            <p className="text-xs text-[#5E555B] mt-0.5">Subscribe again to get matched with doctors every week.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 overflow-visible">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              loading={processingPriceId === plan.priceId}
              onSelect={handleCheckout}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── State 3: One-time paid ────────────────────────────────────────────────────
  if (hasOneTime && !isActive) {
    return (
      <div className="space-y-4">
        {/* Status card */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">One-time access active</p>
            <p className="text-xs text-emerald-600 mt-0.5">You're all set for this match cycle.</p>
          </div>
        </div>

        {/* Upgrade upsell */}
        <div>
          <SectionLabel>Upgrade to a subscription</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 overflow-visible">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                loading={processingPriceId === plan.priceId}
                onSelect={handleCheckout}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── State 4: Active / Past Due / Pending Cancel ───────────────────────────────

  const isAnyLoading = actionLoading || !!processingPriceId;

  return (
    <div className="space-y-4">

      {/* ── Past due banner ────────────────────────────────────────────────── */}
      {isPastDue && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border border-red-200 bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">Payment failed</p>
            <p className="text-xs text-red-600 mt-0.5">
              Your last payment couldn't be processed.
              {subscription?.next_payment_attempt && (
                <> Stripe retries on {fmt(subscription.next_payment_attempt)}.</>
              )}
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={isAnyLoading}
            className="shrink-0 h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Fix now'}
          </button>
        </div>
      )}

      {/* ── Current plan info ──────────────────────────────────────────────── */}
      {subscription && (
        <div className="p-4 rounded-2xl bg-[#F7F2EE] border border-[rgba(58,11,34,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#3A0B22]/10 flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-[#3A0B22]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#1A0A12] truncate">
                    {currentPlan?.name ?? subscription.plan_name ?? 'BeyondRounds Plan'}
                  </p>
                  {/* Status badge */}
                  {isPendingEnd && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                      Ends {fmt(subscription.current_period_end)}
                    </span>
                  )}
                  {isActive && !isPendingEnd && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  )}
                  {isPastDue && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600">
                      Past due
                    </span>
                  )}
                  {subscription.status === 'trialing' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-600">
                      Trial
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5E555B] mt-0.5">
                  {isPendingEnd
                    ? 'Full access until your plan ends'
                    : subscription.current_period_end
                    ? `Renews ${fmt(subscription.current_period_end)}`
                    : subscription.interval
                    ? `${subscription.interval.replace('_', ' ')} billing`
                    : ''}
                </p>
              </div>
            </div>
            {currentPlan && (
              <div className="text-right shrink-0">
                <p className="text-base font-extrabold text-[#1A0A12]">{currentPlan.price}</p>
                <p className="text-[10px] text-[#5E555B]">{currentPlan.perMonth}</p>
              </div>
            )}
          </div>

          {/* Trial end notice */}
          {subscription.status === 'trialing' && subscription.trial_end && (
            <div className="mt-3 pt-3 border-t border-[rgba(58,11,34,0.08)]">
              <p className="text-xs text-blue-700">
                Trial ends {fmt(subscription.trial_end)} — you won't be charged until then.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Pending cancel warning ─────────────────────────────────────────── */}
      {isPendingEnd && subscription && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Cancellation scheduled</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Your subscription ends on <strong>{fmt(subscription.current_period_end)}</strong>.
              You'll lose access to matching and group chats after that.
            </p>
          </div>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2">

        {/* Resume — only when pending cancel */}
        {isPendingEnd && (
          <ActionBtn
            onClick={handleResume}
            disabled={isAnyLoading}
            loading={actionLoading}
            icon={RefreshCw}
            variant="solid"
          >
            Resume subscription
          </ActionBtn>
        )}

        {/* Change plan — only for active recurring subscriptions, not pending cancel */}
        {isActive && !isPendingEnd && subscription?.stripe_subscription_id && (
          <ActionBtn
            onClick={() => setSwitchDialogOpen(true)}
            disabled={isAnyLoading}
            icon={Zap}
            variant="outline"
          >
            Change plan
            <ChevronRight className="h-4 w-4 ml-auto opacity-40" />
          </ActionBtn>
        )}

        {/* Manage payment & invoices — always shown when customer exists */}
        {subscription?.stripe_customer_id && (
          <ActionBtn
            onClick={handlePortal}
            disabled={isAnyLoading}
            loading={actionLoading}
            icon={CreditCard}
            variant="outline"
          >
            Manage payment &amp; invoices
          </ActionBtn>
        )}

        {/* Cancel — active non-pending only */}
        {isActive && !isPendingEnd && (
          <ActionBtn
            onClick={() => setCancelDialogOpen(true)}
            disabled={isAnyLoading}
            icon={X}
            variant="danger"
          >
            Cancel subscription
          </ActionBtn>
        )}
      </div>

      {/* ── Invoice history ────────────────────────────────────────────────── */}
      {invoices.length > 0 && (
        <div>
          <SectionLabel>Billing history</SectionLabel>
          <div className="space-y-1.5">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F7F2EE]/70 hover:bg-[#F7F2EE] transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1A0A12]">
                    {fmtMoney(inv.amount, inv.currency)}
                  </p>
                  <p className="text-xs text-[#5E555B]">{fmt(inv.paid_at ?? inv.period_start)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={inv.status === 'paid' ? 'default' : inv.status === 'open' ? 'secondary' : 'destructive'}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {inv.status}
                  </Badge>
                  {inv.hosted_invoice_url && (
                    <button
                      onClick={() => window.open(inv.hosted_invoice_url!, '_blank')}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#3A0B22]/8 transition-colors"
                      title="View invoice"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-[#5E555B]" />
                    </button>
                  )}
                  {inv.invoice_pdf && (
                    <button
                      onClick={() => window.open(inv.invoice_pdf!, '_blank')}
                      className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[#3A0B22]/8 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5 text-[#5E555B]" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="h-3.5 w-3.5 text-[#5E555B]/40" />
        <p className="text-[10px] text-[#5E555B]/40">Secured by Stripe · Apple Pay &amp; Google Pay supported</p>
      </div>

      {/* ── Cancel confirmation dialog ─────────────────────────────────────── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Cancel subscription?</DialogTitle>
            <DialogDescription>
              You'll keep full access until{' '}
              <strong>{fmt(subscription?.current_period_end)}</strong>.
              After that you won't be matched or have group chat access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="flex-1 rounded-xl">
              Keep subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex-1 rounded-xl"
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Plan switch dialog ─────────────────────────────────────────────── */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Change Plan</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setSwitchDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              Prorated credit or charge applied immediately. New rate starts next cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 pb-2 overflow-visible">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                current={plan.priceId === currentPriceId}
                loading={processingPriceId === plan.priceId}
                onSelect={handleSwitch}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
