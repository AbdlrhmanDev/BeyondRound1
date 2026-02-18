import type { Metadata } from 'next';
import AdminUserDetailContent from '@/views/admin/AdminUserDetail';

export const metadata: Metadata = {
  title: 'User Detail',
  description: 'View user profile details.',
};

export const dynamic = 'force-dynamic';

export default function AdminUserDetailPage() {
  return <AdminUserDetailContent />;
}
