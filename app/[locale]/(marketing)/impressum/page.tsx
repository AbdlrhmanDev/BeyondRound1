import type { Metadata } from 'next';
import ImpressumPageContent from '@/views/Impressum';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Legal notice and company information for BeyondRounds.',
  openGraph: {
    title: 'Impressum — BeyondRounds',
    description: 'Legal notice and company information for BeyondRounds.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ImpressumPage() {
  return <ImpressumPageContent />;
}
