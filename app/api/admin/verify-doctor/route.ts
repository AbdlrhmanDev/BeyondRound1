import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emailService } from '@/services/emailService';

// ── Auth helper (same pattern as run-matching) ────────────────────────────────

async function validateAdminRequest(
    request: NextRequest,
    supabaseUrl: string,
    serviceKey: string
): Promise<{ ok: true; callerId: string } | { ok: false; status: number; error: string }> {
    const internalSecret = request.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (expectedSecret && internalSecret === expectedSecret) {
        return { ok: true, callerId: 'internal-cron' };
    }

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

// ── Route ─────────────────────────────────────────────────────────────────────

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

    let body: { userId?: string; decision?: string; reason?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, decision, reason } = body;

    if (!userId || !decision || !['approve', 'reject'].includes(decision)) {
        return NextResponse.json({ error: 'userId and decision (approve|reject) are required' }, { status: 400 });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Call the appropriate RPC
    const rpcName = decision === 'approve' ? 'admin_approve_verification' : 'admin_reject_verification';
    const rpcParams: Record<string, string> = { target_user_id: userId };
    if (reason) rpcParams.reason = reason;

    const { error: rpcError } = await adminClient.rpc(rpcName as any, rpcParams);
    if (rpcError) {
        console.error(`[verify-doctor] RPC ${rpcName} error:`, rpcError.message);
        return NextResponse.json({ error: 'Verification action failed' }, { status: 500 });
    }

    // Look up user email and profile name
    const { data: authUser, error: userErr } = await adminClient.auth.admin.getUserById(userId);
    if (userErr || !authUser?.user?.email) {
        console.warn('[verify-doctor] Could not retrieve user email; skipping email');
        return NextResponse.json({ ok: true });
    }

    const email = authUser.user.email;

    const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();

    const firstName = (profile?.full_name ?? '').split(' ')[0] || 'Doctor';

    // Send verification result email (fire-and-forget — don't fail the response if email fails)
    emailService.sendDoctorVerification(email, firstName, decision === 'approve').catch((err) => {
        console.error('[verify-doctor] Email send failed:', err);
    });

    return NextResponse.json({ ok: true });
}
