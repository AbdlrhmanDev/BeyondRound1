import type { Metadata } from 'next';
import AdminEventsPageContent from '@/views/admin/AdminEvents';

export const metadata: Metadata = {
  title: 'Admin Events',
  description: 'Create events and run matching.',
};

export const dynamic = 'force-dynamic';

export default function AdminEventsPage() {
  return <AdminEventsPageContent />;
}
