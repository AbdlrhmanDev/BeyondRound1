import type { Metadata } from 'next';
import InterestsView from '@/views/Interests';

export const metadata: Metadata = {
  title: 'Interests',
  description: 'Add and manage your interests to improve your matches.',
};

export default function InterestsPage() {
  return <InterestsView />;
}
