'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createPendingBooking } from '@/services/weekendBookingService';
import type { SelectedPlan } from '@/components/dashboard/PlanPickerSheet';

interface Props {
  open: boolean;
  day: string;
  userId: string;
  accessToken: string;
  city: string;
  plan?: SelectedPlan;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const DAY_LABELS: Record<string, string> = {
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const INCLUDES = [
  'Curated group of 3–4 doctors',
  'Verified, like-minded professionals',
  'Café or brunch venue in your area',
  'Group chat opens Thursday',
];

/** Compute the event date from the day key — mirrors /api/events/ensure logic */
function getEventDateFromDay(day: string): Date {
  const now = new Date();
  const dow = now.getDay();
  const daysToFriday = dow === 0 ? 5 : dow === 6 ? 6 : 5 - dow;

  const friday = new Date(now);
  friday.setDate(now.getDate() + daysToFriday);
  friday.setHours(19, 0, 0, 0);

  if (day === 'saturday') {
    friday.setDate(friday.getDate() + 1);
  } else if (day === 'sunday') {
    friday.setDate(friday.getDate() + 2);
    friday.setHours(12, 0, 0, 0);
  }
  return friday;
}

function formatSheetDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getTimeWindow(date: Date): string {
  const h = date.getHours();
  const t = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (h < 12) return `Morning · ${t}`;
  if (h < 17) return `Afternoon · ${t}`;
  return `Evening · ${t}`;
}

type PaymentMethod = 'apple' | 'card' | 'paypal';

export default function PaymentSheet({
  open,
  day,
  userId,
  accessToken,
  city,
  plan,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const dayLabel = DAY_LABELS[day] ?? day;
  const eventDate = getEventDateFromDay(day);
  const subtitle = `${dayLabel}, ${formatSheetDate(eventDate)} · ${getTimeWindow(eventDate)}`;

  const handleConfirm = async () => {
    if (!userId || !accessToken) {
      setErrorMsg('Session expired. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Get or create the event slot for this city + day
      const ensureRes = await fetch('/api/events/ensure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ city, day }),
      });
      const ensureData = await ensureRes.json() as { eventId?: string; error?: string };

      if (!ensureRes.ok || !ensureData.eventId) {
        const msg = ensureData.error ?? 'Could not set up your gathering slot.';
        setErrorMsg(msg);
        return;
      }

      const eventId = ensureData.eventId;

      // 2. Create pending booking row
      const bookingId = await createPendingBooking(userId, eventId, day);
      if (!bookingId) {
        setErrorMsg('Could not reserve your spot. Please try again.');
        return;
      }

      // 3. Create Stripe checkout session
      const response = await fetch('/api/stripe/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ eventId, bookingId, day, paymentMethod, planId: plan?.id }),
      });

      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        const msg = data.error ?? 'Something went wrong. Please try again.';
        setErrorMsg(msg);
        onError?.(msg);
        return;
      }

      // 4. Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !loading) onClose();
  };

  const methodOptions: { id: PaymentMethod; label: React.ReactNode; badge?: React.ReactNode }[] = [
    {
      id: 'apple',
      label: (
        <div className="flex items-center gap-2 flex-1">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 814 1000" fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.6-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.1 189.2-49.1 30.4 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
          </svg>
          <span className="text-sm font-medium">Apple Pay</span>
        </div>
      ),
      badge: (
        <span className="bg-secondary text-[10px] px-2 py-0.5 rounded-full font-medium text-secondary-foreground">
          Fastest
        </span>
      ),
    },
    {
      id: 'card',
      label: (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-medium">Card</span>
          <div className="flex gap-1">
            {['Visa', 'MC', 'Amex'].map((b) => (
              <span key={b} className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                {b}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'paypal',
      label: (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm">
            <span className="font-bold text-foreground">Pay</span>
            <span className="font-bold text-blue-600">Pal</span>
          </span>
        </div>
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] max-h-[90vh] flex flex-col p-0 gap-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 pt-4 pb-2 space-y-5">
          <SheetHeader className="text-left space-y-1">
            <SheetTitle className="font-heading text-xl text-primary">
              Complete your reservation
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </SheetHeader>

          {/* Selected plan summary */}
          {plan && (
            <div
              className="flex items-center justify-between rounded-[14px] px-4 py-3"
              style={{
                background: 'rgba(242,124,92,0.07)',
                border: '1px solid rgba(242,124,92,0.20)',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: '#1A0A12' }}>
                {plan.name}
              </span>
              <span className="font-bold text-base" style={{ color: '#F27C5C' }}>
                {plan.price}
                {plan.priceNote && (
                  <span className="text-xs font-normal ml-0.5" style={{ color: '#9B8F8B' }}>
                    {plan.priceNote}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* What's included */}
          <div className="space-y-2">
            <p className="text-[10px] tracking-widest text-muted-foreground/70 uppercase">
              Your Gathering Includes
            </p>
            <ul className="space-y-2.5">
              {INCLUDES.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment method selector */}
          <div className="space-y-2">
            <p className="text-[10px] tracking-widest text-muted-foreground/70 uppercase">
              Pay With
            </p>
            <div className="space-y-2">
              {methodOptions.map((opt) => (
                <button
                  key={opt.id}
                  className={`w-full rounded-xl border h-[52px] px-4 flex items-center gap-3 transition-colors ${
                    paymentMethod === opt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                  onClick={() => setPaymentMethod(opt.id)}
                >
                  {opt.label}
                  {opt.badge}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border px-6 py-4 shrink-0 space-y-2">
          {errorMsg && (
            <p className="text-destructive text-sm text-center" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            className="w-full h-[52px] rounded-full font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #F27C5C 0%, #4B0F2D 100%)' }}
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Securing your spot…' : 'Reserve my spot'}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Secure checkout · Doctors-only community
          </div>

          <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
            You can cancel up to 48 hours before your gathering.{' '}
            No-shows may affect future access.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
