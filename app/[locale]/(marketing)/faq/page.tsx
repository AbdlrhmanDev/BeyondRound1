import type { Metadata } from 'next';
import FAQPageContent from '@/views/FAQ';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about BeyondRounds.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function FAQPage() {
  return <FAQPageContent />;
}
