import type { Metadata } from 'next';
import TermsPageContent from '@/views/Terms';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BeyondRounds Terms of Service.',
};

// Dynamic rendering needed for i18n hooks
export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return <TermsPageContent />;
}
