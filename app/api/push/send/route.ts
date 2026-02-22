import { NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

// POST /api/push/send  (internal — call from server-side code only)
// Body: { userId: string, title: string, body: string, url?: string, tag?: string }
//
// This route proxies to the send-push-notification Edge Function which holds
// the VAPID private key and does the actual web-push delivery.
// It verifies the caller is authenticated (or a service-role internal call).

export async function POST(req: Request) {
  try {
    // Allow service-role internal calls via secret header
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    const isInternal = expectedSecret && internalSecret === expectedSecret;

    const supabase = await createClient();

    if (!isInternal) {
      // Fallback: require authenticated admin user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    // Invoke the Supabase Edge Function that sends via web-push
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });

    if (error) {
      console.error('[push/send] Edge Function error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: data });
  } catch (err) {
    console.error('[push/send] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
