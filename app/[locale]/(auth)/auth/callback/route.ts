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
      const isRecovery =
        next === '/reset-password' ||
        (data.session as any).amr?.some((entry: any) => entry.method === 'otp') ||
        requestUrl.searchParams.get('type') === 'recovery';

      if (isRecovery) {
        return NextResponse.redirect(new URL(`/${locale}/reset-password`, request.url));
      }

      // Check if user has completed onboarding
      const { data: prefs } = await supabase
        .from('onboarding_preferences')
        .select('completed_at')
        .eq('user_id', data.session.user.id)
        .maybeSingle();

      const hasCompletedOnboarding = !!(prefs as any)?.completed_at;

      if (hasCompletedOnboarding) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }

      // Not completed DB -> go to welcome page which will process localStorage or redirect to /onboarding
      return NextResponse.redirect(new URL(`/${locale}/welcome`, request.url));
    }
  }

  // No code or exchange failed → go to dashboard
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
}
