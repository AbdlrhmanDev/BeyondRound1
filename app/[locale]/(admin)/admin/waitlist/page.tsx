import type { Metadata } from 'next';
import AdminWaitlistContent from '@/views/admin/AdminWaitlist';

export const metadata: Metadata = {
  title: 'Waitlist & Surveys',
  description: 'View waitlist and survey submissions.',
};

export const dynamic = 'force-dynamic';

export default function AdminWaitlistPage() {
  return <AdminWaitlistContent />;
}
