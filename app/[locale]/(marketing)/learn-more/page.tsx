import type { Metadata } from 'next';
import LearnMorePageContent from '@/views/LearnMore';

export const metadata: Metadata = {
  title: 'Learn More',
  description: 'Learn more about how BeyondRounds helps physicians connect.',
  openGraph: {
    title: 'How BeyondRounds Works',
    description: 'Discover how BeyondRounds matches verified doctors in small curated groups for real weekend meetups in Berlin.',
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

export default function LearnMorePage() {
  return <LearnMorePageContent />;
}
