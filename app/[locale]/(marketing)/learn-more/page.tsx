import type { Metadata } from 'next';
import LearnMorePageContent from '@/views/LearnMore';

export const metadata: Metadata = {
  title: 'Learn More',
  description: 'Learn more about how BeyondRounds helps physicians connect.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function LearnMorePage() {
  return <LearnMorePageContent />;
}
