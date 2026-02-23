import type { Metadata } from 'next';
import TermsPageContent from '@/views/Terms';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BeyondRounds Terms of Service.',
  openGraph: {
    title: 'Terms of Service — BeyondRounds',
    description: 'Read the BeyondRounds Terms of Service.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

// Dynamic rendering needed for i18n hooks
export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return <TermsPageContent />;
}
