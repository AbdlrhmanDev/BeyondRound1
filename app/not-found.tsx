import Link from 'next/link';

/**
 * Root 404 page – used when no route matches (e.g. invalid path).
 * Redirects users to the default locale.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-foreground dark:bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-display font-bold text-gradient-gold mb-4">
          404
        </h1>
        <h2 className="text-2xl font-display font-semibold text-primary-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-primary-foreground/60 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/de"
          className="inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-semibold h-12 px-6 hover:opacity-90 transition-opacity"
        >
          Go to BeyondRounds
        </Link>
      </div>
    </div>
  );
}
