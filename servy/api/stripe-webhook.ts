/**
 * Servy API: Stripe webhook proxy
 * Receives webhooks from Stripe, forwards to Supabase function
 * Configure Stripe webhook URL: https://servy.beyondrounds.app/api/stripe-webhook
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const signature = req.headers["stripe-signature"];

  if (!supabaseUrl || !signature) {
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  const rawBody = await getRawBody(req);
  const functionsUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/stripe-webhook`;

  try {
    const response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature as string,
      },
      body: rawBody,
    });

    const data = await response.text();
    res.setHeader("Content-Type", "application/json");
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Stripe webhook proxy error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Proxy error",
    });
  }
}
