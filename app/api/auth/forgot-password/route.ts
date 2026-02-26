import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { emailService } from '@/services/emailService';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address'),
  locale: z.string().optional().default('en'),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP: 3 requests per minute for auth actions
  const ip = getRateLimitId(req);
  const rlRes = checkRateLimit(ip, 'forgot-password');
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

  const { email, locale } = parsed.data;
  const isDev = process.env.NODE_ENV === 'development';

  try {
    // 1. Generate a recovery link using the Admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beyondrounds.app'}/${locale}/reset-password`,
      },
    });

    if (linkError) {
      console.error('[forgot-password] Link generation error:', linkError.message, linkError.status);
      // Always return 200 to prevent email enumeration
      return NextResponse.json({ success: true });
    }

    // 2. Send the link via our custom ZeptoMail service
    const resetLink = data.properties.action_link;
    const emailRes = await emailService.sendPasswordReset(email, resetLink, locale);

    if (!emailRes.success) {
      console.error('[forgot-password] Email sending error:', emailRes.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[forgot-password] Unexpected error:', message);
    return NextResponse.json(
      { error: isDev ? message : 'Internal server error' },
      { status: 500 }
    );
  }
}
