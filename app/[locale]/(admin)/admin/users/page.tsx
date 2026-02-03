import type { Metadata } from 'next';
import AdminUsersPageContent from '@/views/admin/AdminUsers';

export const metadata: Metadata = {
  title: 'Admin - Users',
  description: 'Manage BeyondRounds users.',
};

export const dynamic = 'force-dynamic';

export default function AdminUsersPage() {
  return <AdminUsersPageContent />;
}
