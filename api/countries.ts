/**
 * Location proxy: Countries - fetches from countrystatecity.in server-side
 * Keeps API key secure, avoids CORS issues
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

  if (!API_KEY) {
    res.status(500).json({ error: "COUNTRY_STATE_CITY_API_KEY not configured" });
    return;
  }

  try {
    const response = await fetch("https://api.countrystatecity.in/v1/countries", {
      headers: { "X-CSCAPI-KEY": API_KEY },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("CountryStateCity API error:", response.status, text);
      res.status(response.status).json({ error: "Failed to fetch countries" });
      return;
    }

    const data = await response.json();
    const countries = Array.isArray(data) ? data : data?.data ?? [];
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24h cache
    res.status(200).json(countries);
  } catch (err) {
    console.error("Countries proxy error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Proxy error" });
  }
}
