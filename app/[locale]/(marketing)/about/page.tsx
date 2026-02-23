import type { Metadata } from 'next';
import AboutPageContent from '@/views/About';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about BeyondRounds and our mission to help physicians build meaningful connections.',
  openGraph: {
    title: 'About BeyondRounds',
    description: 'Learn about our mission to help physicians build meaningful connections beyond the hospital.',
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

export default function AboutPage() {
  return <AboutPageContent />;
}
