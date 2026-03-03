import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { brevoService } from '@/services/brevoService';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(254, 'Email is too long'),
  firstName: z.string().max(100).optional(),
  locale: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP: 3 requests per minute
  const ip = getRateLimitId(req);
  const rlRes = checkRateLimit(ip, 'whitelist');
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

  const { email, firstName, locale } = parsed.data;

  try {
    // Add contact to Brevo list — triggers the Automation UI drip sequence.
    // A Brevo failure is logged but must not break the signup response.
    const result = await brevoService.addContact({ email, firstName, locale });
    if (!result.success) {
      console.error('[whitelist] Brevo enrolment failed:', result.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[whitelist] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
