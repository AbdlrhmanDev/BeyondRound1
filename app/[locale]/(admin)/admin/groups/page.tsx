import type { Metadata } from 'next';
import AdminGroupsContent from '@/views/admin/AdminGroups';

export const metadata: Metadata = {
  title: 'Groups & Chats',
  description: 'Manage groups and chat moderation.',
};

export const dynamic = 'force-dynamic';

export default function AdminGroupsPage() {
  return <AdminGroupsContent />;
}
