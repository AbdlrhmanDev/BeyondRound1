import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

const PAYMENT_LINKS: Record<string, string | undefined> = {
  one_time:    process.env.STRIPE_PAYMENT_LINK_ONE_TIME,
  monthly:     process.env.STRIPE_PAYMENT_LINK_MONTHLY,
  three_month: process.env.STRIPE_PAYMENT_LINK_THREE_MONTH,
  six_month:   process.env.STRIPE_PAYMENT_LINK_SIX_MONTH,
};

const FALLBACK = process.env.STRIPE_PAYMENT_LINK_FALLBACK ?? process.env.STRIPE_PAYMENT_LINK_ONE_TIME ?? '';

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const { bookingId, planId } = await req.json() as {
      bookingId?: string;
      planId?: string;
    };

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // ── Resolve payment link ──────────────────────────────────────────────────
    const baseUrl = (planId && PAYMENT_LINKS[planId]) ?? FALLBACK;

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'Payment link not configured. Set STRIPE_PAYMENT_LINK_* env vars.' },
        { status: 500 }
      );
    }

    // Append client_reference_id so webhook can confirm the booking
    const url = `${baseUrl}?client_reference_id=${bookingId}&prefilled_email=${encodeURIComponent(user.email ?? '')}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error('[api/stripe/booking]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
