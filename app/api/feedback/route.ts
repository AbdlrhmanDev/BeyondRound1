import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
    question: z.string().min(1).max(100),
    answer: z.string().min(1).max(500),
    email: z.string().email().max(254).optional(),
    source: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
    const ip = getRateLimitId(req);
    const rlRes = checkRateLimit(ip, 'feedback');
    if (rlRes) return rlRes;

    let rawBody: unknown;
    try {
        rawBody = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.errors[0]?.message ?? 'Invalid request' },
            { status: 400 }
        );
    }

    const { question, answer, email, source } = parsed.data;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('feedback_responses').insert({
        question,
        answer,
        email: email ?? null,
        source: source ?? null,
    });

    if (error) {
        console.error('[feedback] Insert error:', error);
        return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
