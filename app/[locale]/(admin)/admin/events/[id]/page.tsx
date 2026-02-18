import type { Metadata } from 'next';
import AdminEventDetailContent from '@/views/admin/AdminEventDetail';

export const metadata: Metadata = {
  title: 'Event Detail',
  description: 'View event details and bookings.',
};

export const dynamic = 'force-dynamic';

export default function AdminEventDetailPage() {
  return <AdminEventDetailContent />;
}
