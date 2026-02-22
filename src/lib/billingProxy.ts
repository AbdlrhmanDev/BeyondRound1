/**
 * billingProxy — proxies billing requests to Supabase Edge Functions.
 *
 * Auth: the client sends `Authorization: Bearer <access_token>`.
 * We verify the JWT locally (decode + expiry check — no network round-trip)
 * then forward it to the Edge Function which performs its own full validation.
 */
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = (
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
).replace(/\/$/, '');

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Lightweight JWT check — no network call required.
 *  We only verify the token is present, well-formed, and not expired.
 *  The Edge Function does the full cryptographic validation.
 */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    // base64url → base64 → JSON
    const pad = (s: string) => s + '='.repeat((4 - (s.length % 4)) % 4);
    const payload = JSON.parse(
      Buffer.from(pad(parts[1]).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );
    // exp is Unix seconds
    return typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000);
  } catch {
    return true; // malformed — treat as expired
  }
}

export async function billingProxy(
  req: NextRequest,
  fnName: string
): Promise<NextResponse> {
  try {
    // 1. Extract Bearer token
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized — missing token' }, { status: 401 });
    }

    if (isTokenExpired(token)) {
      return NextResponse.json({ error: 'Unauthorized — token expired' }, { status: 401 });
    }

    // 2. Forward to Edge Function — it performs full auth validation
    const body = await req.text().catch(() => '{}');
    const fnUrl = `${SUPABASE_URL}/functions/v1/${fnName}`;

    const upstream = await fetch(fnUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_ANON_KEY,
      },
      body: body || '{}',
    });

    const data = await upstream.text();
    return new NextResponse(data, {
      status:  upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`[billing/${fnName}]`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
