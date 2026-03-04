import * as Sentry from "@sentry/nextjs";
export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  Sentry.logger.info("Sentry example API called");
  try {
    throw new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
  } catch (error) {
    Sentry.captureException(error);
    return new Response(
      JSON.stringify({ error: "An error occurred on the example API route." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

