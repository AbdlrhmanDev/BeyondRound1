import type { Metadata } from 'next';
import PrivacyPageContent from '@/views/Privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BeyondRounds Privacy Policy.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate daily

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
