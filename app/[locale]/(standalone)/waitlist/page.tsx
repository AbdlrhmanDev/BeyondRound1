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
  title: 'BeyondRounds — Meet Other Doctors in Berlin',
  description: 'Join BeyondRounds: weekly curated matches with 3–4 verified doctors in Berlin for low-pressure meetups and real friendships. Free to join.',
  openGraph: {
    title: 'Meet verified doctors in Berlin. Make real friends.',
    description: 'BeyondRounds matches you weekly with small groups of verified physicians — private chat, suggested venues, zero pressure. Join the waitlist free.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meet verified doctors in Berlin. Make real friends.',
    description: 'BeyondRounds matches you weekly with small groups of verified physicians. Join the waitlist free.',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

export const dynamic = 'force-static';
export const revalidate = 3600;

export default function WaitlistPage() {
  return <WaitlistPageContent />;
}
