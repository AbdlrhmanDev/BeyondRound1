import type { Metadata } from 'next';
import ImpressumPageContent from '@/views/Impressum';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Legal notice and company information for BeyondRounds.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ImpressumPage() {
  return <ImpressumPageContent />;
}
