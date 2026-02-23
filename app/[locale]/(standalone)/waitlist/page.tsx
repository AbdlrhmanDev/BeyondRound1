import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';

const WaitlistPageContent = nextDynamic(() => import('@/views/Waitlist'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-pulse rounded-xl bg-gray-100 h-12 w-48" />
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description: 'Join the BeyondRounds waitlist and be the first to know when we launch.',
  openGraph: {
    title: 'Join the BeyondRounds Waitlist',
    description: 'Be among the first verified doctors to get matched for real weekend meetups in Berlin.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function WaitlistPage() {
  return <WaitlistPageContent />;
}
