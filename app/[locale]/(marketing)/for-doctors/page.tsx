import type { Metadata } from 'next';
import ForDoctorsPageContent from '@/views/ForDoctors';

export const metadata: Metadata = {
  title: 'For Doctors',
  description: 'BeyondRounds is designed specifically for physicians to build meaningful friendships.',
  openGraph: {
    title: 'BeyondRounds — Made for Doctors',
    description: 'Verified physicians only. Small curated groups. Real weekend meetups in Berlin. No swiping, no networking.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ForDoctorsPage() {
  return <ForDoctorsPageContent />;
}
