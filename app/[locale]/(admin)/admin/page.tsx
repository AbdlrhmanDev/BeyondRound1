import type { Metadata } from 'next';
import AdminOverviewPageContent from '@/views/admin/AdminOverview';

export const metadata: Metadata = {
  title: 'Admin Overview',
  description: 'BeyondRounds Admin Dashboard.',
};

export const dynamic = 'force-dynamic';

export default function AdminOverviewPage() {
  return <AdminOverviewPageContent />;
}
