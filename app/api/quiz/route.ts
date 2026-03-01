import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/services/emailService';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
    firstName: z.string().min(1).max(100),
    email: z.string().email().max(254),
    phone: z.string().max(30).optional(),
    location: z.string().max(100).optional(),
    // Q1-10: boolean yes/no answers in order
    yesNoAnswers: z.array(z.boolean()).length(10),
    // Q11-15 qualifiers
    q11: z.string().max(200).optional(),
    q12: z.string().max(200).optional(),
    q13: z.string().max(200).optional(),
    q14: z.string().max(200).optional(),
    q15: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
    const ip = getRateLimitId(req);
    const rlRes = checkRateLimit(ip, 'quiz');
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

    const { firstName, email, phone, location, yesNoAnswers, q11, q12, q13, q14, q15 } = parsed.data;
    const score = yesNoAnswers.filter(Boolean).length * 10;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Save quiz lead
    const { error: insertError } = await supabase.from('quiz_leads').insert({
        first_name: firstName,
        email: email.trim().toLowerCase(),
        phone: phone ?? null,
        location: location ?? null,
        score,
        q11_situation: q11 ?? null,
        q12_goal: q12 ?? null,
        q13_obstacle: q13 ?? null,
        q14_budget: q14 ?? null,
        q15_additional: q15 ?? null,
        all_answers: { yesNoAnswers, q11, q12, q13, q14, q15 },
    });

    if (insertError) {
        console.error('[quiz] Insert error:', insertError);
        // Non-fatal — still send email
    }

    // 2. Also capture email in waitlist (upsert — ignore duplicate)
    await supabase
        .from('waitlist')
        .insert({ email: email.trim().toLowerCase() })
        .throwOnError()
        .then(
            () => {},
            (err: unknown) => {
                // 23505 = unique_violation: already on waitlist — fine
                if ((err as { code?: string })?.code !== '23505') {
                    console.warn('[quiz] Waitlist upsert warning:', err);
                }
            }
        );

    // 3. Send results email (fire-and-forget: don't fail the response on email error)
    emailService.sendQuizResult(email, firstName, score).catch((err: unknown) => {
        console.error('[quiz] Email send error:', err);
    });

    return NextResponse.json({ success: true, score });
}
