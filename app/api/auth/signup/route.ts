import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(254),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  fullName: z.string().max(200).optional().default(''),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per 10 minutes per IP
  const ip = getRateLimitId(req);
  const rlRes = checkRateLimit(ip, 'signup');
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

  const { email, password, fullName } = parsed.data;

  try {
    // Use admin client — bypasses Supabase SMTP, auto-confirms email
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      // Surface duplicate email as a friendly error
      if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('[signup] Admin createUser error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fire-and-forget welcome email via ZeptoMail
    fetch(`${req.nextUrl.origin}/api/auth/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: fullName }),
    }).catch(() => {});

    return NextResponse.json({ userId: data.user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[signup] Unexpected error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
