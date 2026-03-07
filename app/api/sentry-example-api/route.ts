import * as Sentry from "@sentry/nextjs";
export const dynamic = "force-dynamic";

// A working API route
export function GET() {
  Sentry.logger.info("Sentry example API called");
  return new Response("ok");
}
