import type { Metadata } from 'next';
import AdminMatchesPageContent from '@/views/admin/AdminMatches';

export const metadata: Metadata = {
  title: 'Admin - Matches',
  description: 'Manage BeyondRounds matches.',
};

export const dynamic = 'force-dynamic';

export default function AdminMatchesPage() {
  return <AdminMatchesPageContent />;
}
