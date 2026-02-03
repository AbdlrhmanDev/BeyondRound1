/**
 * Hero section: server-rendered LCP image + client content.
 * Image in initial HTML for fast mobile LCP.
 */
import HeroImageServer from './HeroImageServer';
import HeroContentClient from './HeroContentClient';
import HeroOverlays from './HeroOverlays';

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 overflow-hidden bg-foreground dark:bg-background"
      aria-label="Welcome to BeyondRounds - Your next great friendship awaits"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <HeroContentClient />
          <div className="lg:col-span-5 relative animate-fade-up delay-100 order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-60" aria-hidden="true" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-primary-foreground/10 aspect-[4/5]">
                <HeroImageServer />
                <HeroOverlays />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block" aria-hidden="true">
        <div className="flex flex-col items-center gap-3 text-primary-foreground/40">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
