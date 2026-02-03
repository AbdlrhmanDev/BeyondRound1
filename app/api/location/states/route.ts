import { NextRequest, NextResponse } from 'next/server';

const API_KEY = (
  process.env.COUNTRY_STATE_CITY_API_KEY ||
  process.env.NEXT_PUBLIC_COUNTRY_STATE_CITY_API_KEY ||
  ''
).trim();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country?.trim()) {
    return NextResponse.json(
      { error: 'country query param required' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!API_KEY) {
    return NextResponse.json(
      { error: 'COUNTRY_STATE_CITY_API_KEY not configured' },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${encodeURIComponent(country)}/states`,
      {
        headers: { 'X-CSCAPI-KEY': API_KEY },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('CountryStateCity states API error:', response.status, text);
      return NextResponse.json(
        { error: 'Failed to fetch states' },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    const states = Array.isArray(data) ? data : data?.data ?? [];

    return NextResponse.json(states, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('States proxy error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
