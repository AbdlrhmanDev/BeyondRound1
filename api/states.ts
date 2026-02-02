/**
 * Location proxy: States - fetches from countrystatecity.in server-side
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = (process.env.VITE_COUNTRY_STATE_CITY_API_KEY || process.env.COUNTRY_STATE_CITY_API_KEY || "").trim();

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const country = req.query.country as string;
  if (!country?.trim()) {
    res.status(400).json({ error: "country query param required" });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "COUNTRY_STATE_CITY_API_KEY not configured" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${encodeURIComponent(country)}/states`,
      { headers: { "X-CSCAPI-KEY": API_KEY } }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("CountryStateCity states API error:", response.status, text);
      res.status(response.status).json({ error: "Failed to fetch states" });
      return;
    }

    const data = await response.json();
    const states = Array.isArray(data) ? data : data?.data ?? [];
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json(states);
  } catch (err) {
    console.error("States proxy error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Proxy error" });
  }
}
