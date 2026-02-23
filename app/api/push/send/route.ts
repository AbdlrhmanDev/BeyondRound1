import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

// POST /api/push/send  (internal — call from server-side code only)
// Body: { userId: string, title: string, body: string, url?: string, tag?: string }
//
// Authorization rules:
//   - Internal callers (e.g. cron, server-side code) must supply the correct
//     x-internal-secret header. They may send to any userId.
//   - Authenticated users can only send push notifications to THEMSELVES.
//     (used when the client-side app triggers a test push or re-delivery)
//
// This route proxies to the send-push-notification Edge Function which holds
// the VAPID private key and performs the actual web-push delivery.

export async function POST(req: Request) {
  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    const isInternal = !!(expectedSecret && internalSecret === expectedSecret);

    const supabase = await createClient();
    let authenticatedUserId: string | null = null;

    if (!isInternal) {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authenticatedUserId = user.id;
    }

    const payload = await req.json() as {
      userId:  string;
      title:   string;
      body:    string;
      url?:    string;
      tag?:    string;
      icon?:   string;
    };

    if (!payload.userId || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      );
    }

    // CRITICAL: non-internal callers can only send notifications to themselves
    if (!isInternal && payload.userId !== authenticatedUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      console.error('[push/send] Edge Function error:', error.message);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    console.error('[push/send] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
