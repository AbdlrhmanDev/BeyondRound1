import type { Metadata } from 'next';
import TermsPageContent from '@/views/Terms';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'BeyondRounds Terms of Service.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 86400; // Revalidate daily

export default function TermsPage() {
  return <TermsPageContent />;
}
