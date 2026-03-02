import type { Metadata } from 'next';
import AdminEmails from '@/views/admin/AdminEmails';

export const metadata: Metadata = {
  title: 'Email Campaigns',
  description: 'Trigger and monitor launch and engagement email sequences.',
};

export const dynamic = 'force-dynamic';

export default function AdminEmailsPage() {
  return <AdminEmails />;
}
