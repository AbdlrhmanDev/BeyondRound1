import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';

// ── Auth helper ─────────────────────────────────────────────────────────────

async function validateAdminRequest(
  request: NextRequest,
  supabaseUrl: string,
  serviceKey: string
): Promise<{ ok: true; callerId: string } | { ok: false; status: number; error: string }> {
  // Option A: Internal automation via shared secret
  const internalSecret = request.headers.get('x-internal-secret');
  const expectedSecret = process.env.INTERNAL_API_SECRET;
  if (expectedSecret && internalSecret === expectedSecret) {
    return { ok: true, callerId: 'internal-cron' };
  }

  // Option B: Authenticated admin user
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authErr } = await authClient.auth.getUser(token);

  if (authErr || !user) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: roleRow } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'admin') {
    return { ok: false, status: 403, error: 'Forbidden: admin role required' };
  }

  return { ok: true, callerId: user.id };
}

// ── Main route ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const auth = await validateAdminRequest(request, supabaseUrl, serviceKey);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rlRes = checkRateLimit(auth.callerId, 'admin');
  if (rlRes) return rlRes;

  // Forward optional mode param to edge function
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-launch-emails${mode ? `?mode=${mode}` : ''}`;

  const edgeRes = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await edgeRes.json();

  if (!edgeRes.ok) {
    console.error('[launch] Edge function error:', body);
    return NextResponse.json(
      { error: body.error ?? 'Edge function failed' },
      { status: 502 }
    );
  }

  return NextResponse.json(body);
}
