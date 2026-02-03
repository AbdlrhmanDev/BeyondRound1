import type { Metadata } from 'next';
import PricingPageContent from '@/views/Pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'BeyondRounds pricing plans for physicians.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function PricingPage() {
  return <PricingPageContent />;
}
