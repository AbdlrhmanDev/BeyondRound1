import { type NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/integrations/supabase/server';

/**
 * Resend webhook handler — suppresses bounced and complained addresses.
 *
 * Setup in Resend Dashboard → Webhooks → Add Endpoint:
 *   URL: https://app.beyondrounds.app/api/webhooks/resend
 *   Events: email.bounced, email.complained
 *
 * Env var: RESEND_WEBHOOK_SECRET (signing secret from Resend dashboard)
 */
export async function POST(req: NextRequest) {
    // Verify Resend webhook signature
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
        const svixId        = req.headers.get('svix-id');
        const svixTimestamp = req.headers.get('svix-timestamp');
        const svixSignature = req.headers.get('svix-signature');
        if (!svixId || !svixTimestamp || !svixSignature) {
            return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
        }
        // Resend uses svix for webhook verification — signature check is optional
        // but strongly recommended in production. Add `npm install svix` to enable.
    }

    let payload: { type?: string; data?: { to?: string[] } };
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, data } = payload;

    // Only handle bounce and complaint events
    if (type !== 'email.bounced' && type !== 'email.complained') {
        return NextResponse.json({ received: true });
    }

    const emails = data?.to ?? [];
    if (emails.length === 0) {
        return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();

    for (const email of emails) {
        const reason = type === 'email.bounced' ? 'bounce' : 'complaint';
        console.log(`[resend-webhook] Suppressing ${email} — reason: ${reason}`);

        // Upsert into email_suppressions table so we never send to this address again
        const { error } = await admin
            .from('email_suppressions')
            .upsert(
                { email: email.toLowerCase(), reason, suppressed_at: new Date().toISOString() },
                { onConflict: 'email' }
            );

        if (error) {
            console.error(`[resend-webhook] Failed to suppress ${email}:`, error.message);
        }
    }

    return NextResponse.json({ received: true });
}
