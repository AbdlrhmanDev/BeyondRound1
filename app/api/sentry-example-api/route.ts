import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// API route with Sentry monitoring
export function GET() {
  Sentry.logger.info("Sentry example API called");
  return NextResponse.json({ status: "ok" });
}
