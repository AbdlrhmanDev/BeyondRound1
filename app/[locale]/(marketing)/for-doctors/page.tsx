import type { Metadata } from 'next';
import ForDoctorsPageContent from '@/views/ForDoctors';

export const metadata: Metadata = {
  title: 'For Doctors',
  description: 'BeyondRounds is designed specifically for physicians to build meaningful friendships.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ForDoctorsPage() {
  return <ForDoctorsPageContent />;
}
