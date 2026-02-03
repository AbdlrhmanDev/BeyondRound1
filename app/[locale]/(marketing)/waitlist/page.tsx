import type { Metadata } from 'next';
import WaitlistPageContent from '@/views/Waitlist';

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
