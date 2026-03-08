import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';

const ComingSoonContent = nextDynamic(() => import('@/views/ComingSoon'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
      <div className="animate-pulse rounded-xl bg-[#4A1526]/10 h-12 w-48" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Coming Soon — BeyondRounds',
  description: 'BeyondRounds is launching soon. Weekly curated meetups for verified doctors in Berlin.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';

export default function ComingSoonPage() {
  return <ComingSoonContent />;
}
