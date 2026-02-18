import type { Metadata } from 'next';
import AdminReportDetailContent from '@/views/admin/AdminReportDetail';

export const metadata: Metadata = {
  title: 'Report Detail',
  description: 'Review a user report.',
};

export const dynamic = 'force-dynamic';

export default function AdminReportDetailPage() {
  return <AdminReportDetailContent />;
}
