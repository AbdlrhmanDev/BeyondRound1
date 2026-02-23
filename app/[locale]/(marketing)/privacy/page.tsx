import type { Metadata } from 'next';
import PrivacyPageContent from '@/views/Privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BeyondRounds Privacy Policy.',
  openGraph: {
    title: 'Privacy Policy — BeyondRounds',
    description: 'How BeyondRounds collects, uses, and protects your personal data.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

// Dynamic rendering needed for i18n hooks
export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
