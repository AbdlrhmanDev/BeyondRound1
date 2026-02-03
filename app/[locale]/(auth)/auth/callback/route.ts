import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const locale = requestUrl.pathname.split('/')[1] || 'de';

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
    // First login after email verification: show score animation, then dashboard
    return NextResponse.redirect(new URL(`/${locale}/welcome`, request.url));
  }

  // No code (e.g. direct visit): go to dashboard
  return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
}
