import type { Metadata } from 'next';
import AdminReportsContent from '@/views/admin/AdminReports';

export const metadata: Metadata = {
  title: 'Reports & Safety',
  description: 'Manage user reports and safety.',
};

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
  return <AdminReportsContent />;
}
