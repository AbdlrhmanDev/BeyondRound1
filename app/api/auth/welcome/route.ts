import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService } from '@/services/emailService';
import { checkRateLimit, getRateLimitId } from '@/lib/rateLimit';

const schema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(254, 'Email is too long'),
  name: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit by IP: 3 requests per minute
  const ip = getRateLimitId(req);
  const rlRes = checkRateLimit(ip, 'welcome');
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

  try {
    const result = await emailService.sendWelcome(
      parsed.data.email,
      parsed.data.name ?? 'there'
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    console.error('[welcome] Email service error:', result.error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  } catch (err) {
    console.error('[welcome] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
