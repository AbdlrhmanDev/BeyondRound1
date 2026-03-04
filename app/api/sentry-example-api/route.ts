import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// A sample API route
export function GET() {
  Sentry.logger.info("Sentry example API called");
  return NextResponse.json({ data: "API route working correctly." });
}
