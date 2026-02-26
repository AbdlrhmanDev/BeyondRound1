import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const locale = requestUrl.pathname.split('/')[1] || 'de';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Detect password recovery flow: Supabase sets amr to [{ method: 'otp' }]
      // and the user redirectTo in the recovery link determines the ?next param.
      // Most reliable detection: check if the link was a recovery type via the `next` param
      // or check the AMR claim on the session.
      const amr = data.session.user?.factors ?? [];
      const isRecovery =
        next === '/reset-password' ||
        (data.session as any).amr?.some((entry: any) => entry.method === 'otp') ||
        requestUrl.searchParams.get('type') === 'recovery';

      if (isRecovery) {
        return NextResponse.redirect(new URL(`/${locale}/reset-password`, request.url));
      }

      // Normal email verification → show welcome animation, then dashboard
      return NextResponse.redirect(new URL(`/${locale}/welcome`, request.url));
    }
  }

  // No code or exchange failed → go to dashboard
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
}
