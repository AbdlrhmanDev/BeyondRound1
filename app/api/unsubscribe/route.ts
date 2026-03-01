import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
    email: z.string().email().max(254),
});

export async function POST(req: NextRequest) {
    const ip = getRateLimitId(req);
    const rlRes = checkRateLimit(ip, 'unsubscribe');
    if (rlRes) return rlRes;

    let rawBody: unknown;
    try {
        rawBody = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
        .from('waitlist')
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq('email', email)
        .is('unsubscribed_at', null);

    if (error) {
        console.error('[unsubscribe] DB error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }

    // Row not found is fine — treat as success (already unsubscribed or never subscribed)
    return NextResponse.json({ success: true });
}
