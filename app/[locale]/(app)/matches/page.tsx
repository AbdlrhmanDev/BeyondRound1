import type { Metadata } from 'next';
import MatchesPageContent from '@/views/Matches';

export const metadata: Metadata = {
  title: 'Matches',
  description: 'Your BeyondRounds matches.',
};

export const dynamic = 'force-dynamic';

export default function MatchesPage() {
  return <MatchesPageContent />;
}
