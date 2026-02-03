import type { Metadata } from 'next';
import ProfilePageContent from '@/views/Profile';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your BeyondRounds profile.',
};

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return <ProfilePageContent />;
}
