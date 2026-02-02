/**
 * Location proxy: Cities - fetches from countrystatecity.in server-side
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

const API_KEY = (process.env.VITE_COUNTRY_STATE_CITY_API_KEY || process.env.COUNTRY_STATE_CITY_API_KEY || "").trim();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const country = req.query.country as string;
  const state = req.query.state as string;
  if (!country?.trim() || !state?.trim()) {
    res.status(400).json({ error: "country and state query params required" });
    return;
  }

  if (!API_KEY) {
    res.status(500).json({ error: "COUNTRY_STATE_CITY_API_KEY not configured" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.countrystatecity.in/v1/countries/${encodeURIComponent(country)}/states/${encodeURIComponent(state)}/cities`,
      { headers: { "X-CSCAPI-KEY": API_KEY } }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("CountryStateCity cities API error:", response.status, text);
      res.status(response.status).json({ error: "Failed to fetch cities" });
      return;
    }

    const data = await response.json();
    const cities = Array.isArray(data) ? data : data?.data ?? [];
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(200).json(cities);
  } catch (err) {
    console.error("Cities proxy error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Proxy error" });
  }
}
