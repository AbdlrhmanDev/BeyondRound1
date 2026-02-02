/**
 * Servy API: Stripe checkout proxy
 * Only accepts requests from app, admin, whitelist subdomains
 * Deploy to servy.beyondrounds.app
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_ORIGINS = [
  "https://app.beyondrounds.app",
  "https://admin.beyondrounds.app",
  "https://whitelist.beyondrounds.app",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const origin = req.headers.origin as string | undefined;

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
    res.status(403).json({ error: "Forbidden: origin not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const authHeader = req.headers.authorization;

  if (!supabaseUrl || !authHeader) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-checkout`;

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await response.text();
    Object.entries(corsHeaders(origin || null)).forEach(([k, v]) =>
      res.setHeader(k, v)
    );
    res.setHeader("Content-Type", "application/json");
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Stripe checkout proxy error:", err);
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Proxy error",
    });
  }
}
