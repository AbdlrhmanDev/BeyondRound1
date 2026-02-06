import type { Metadata } from 'next';
import ProfilePageContent from '@/views/Profile';

export const metadata: Metadata = {
  title: 'Edit Profile',
  description: 'Edit your BeyondRounds profile.',
};

export const dynamic = 'force-dynamic';

export default function EditProfilePage() {
  // Profile component handles editing internally via drawer/modal
  return <ProfilePageContent />;
}
