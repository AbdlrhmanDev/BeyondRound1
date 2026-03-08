import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient, createAdminClient } from '@/integrations/supabase/server';
import { sanitizeError } from '@/lib/securityUtils';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    // Cancel Stripe subscription if active
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (sub?.stripe_subscription_id) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2026-01-28.clover',
        });
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : '';
        if (!msg.includes('No such subscription')) {
          console.warn('[api/user/delete] Stripe cancel failed:', msg);
        }
      }
    }

    // Anonymize profile row (GDPR soft-delete)
    await admin
      .from('profiles')
      .update({
        full_name: null,
        avatar_url: null,
        soft_delete: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Hard-delete from auth.users (irreversible)
    const { error: deleteErr } = await admin.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error('[api/user/delete] auth.admin.deleteUser failed:', deleteErr.message);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/user/delete]', err instanceof Error ? err.message : err);
    const { message, status } = sanitizeError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
