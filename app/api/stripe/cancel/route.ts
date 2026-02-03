import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://app.beyondrounds.app',
  'https://admin.beyondrounds.app',
  'https://whitelist.beyondrounds.app',
  'http://localhost:3000',
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization',
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Origin validation
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Forbidden: origin not allowed' },
      { status: 403, headers: corsHeaders(origin) }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authHeader = request.headers.get('authorization');

  if (!supabaseUrl || !authHeader) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  const functionsUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/stripe-cancel-subscription`;

  try {
    const response = await fetch(functionsUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin),
      },
    });
  } catch (err) {
    console.error('Stripe cancel proxy error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
