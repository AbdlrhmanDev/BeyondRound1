import type { Metadata } from 'next';
import AdminGroupDetailContent from '@/views/admin/AdminGroupDetail';

export const metadata: Metadata = {
  title: 'Group Detail',
  description: 'View group details and messages.',
};

export const dynamic = 'force-dynamic';

export default function AdminGroupDetailPage() {
  return <AdminGroupDetailContent />;
}
