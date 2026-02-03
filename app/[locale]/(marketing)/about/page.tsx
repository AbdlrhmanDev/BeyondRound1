import type { Metadata } from 'next';
import AboutPageContent from '@/views/About';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about BeyondRounds and our mission to help physicians build meaningful connections.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function AboutPage() {
  return <AboutPageContent />;
}
