/**
 * Minimal header skeleton for deferred MarketingHeaderClient.
 * Matches header dimensions to avoid CLS.
 */
export function HeaderSkeleton() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-xl sm:rounded-2xl shadow-lg">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between min-h-14 sm:h-16">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-foreground/10 animate-pulse" />
                <div className="w-24 h-5 rounded bg-primary-foreground/10 animate-pulse" />
              </div>
              <div className="hidden md:flex gap-2">
                <div className="w-16 h-8 rounded-lg bg-primary-foreground/10 animate-pulse" />
                <div className="w-16 h-8 rounded-lg bg-primary-foreground/10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
