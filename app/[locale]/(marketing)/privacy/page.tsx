import type { Metadata } from 'next';
import PrivacyPageContent from '@/views/Privacy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'BeyondRounds Privacy Policy.',
};

// Dynamic rendering needed for i18n hooks
export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
