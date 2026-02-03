import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';

const WaitlistPageContent = nextDynamic(() => import('@/views/Waitlist'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-foreground dark:bg-background flex items-center justify-center">
      <div className="animate-pulse rounded-xl bg-primary-foreground/10 h-12 w-48" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description: 'Join the BeyondRounds waitlist and be the first to know when we launch.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function WaitlistPage() {
  return <WaitlistPageContent />;
}
