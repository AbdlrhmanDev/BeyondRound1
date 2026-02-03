import type { Metadata } from 'next';
import PublicProfilePageContent from '@/views/PublicProfile';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'View a physician profile on BeyondRounds.',
};

export const dynamic = 'force-dynamic';

interface PublicProfilePageProps {
  params: {
    userId: string;
    locale: string;
  };
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  return <PublicProfilePageContent />;
}
