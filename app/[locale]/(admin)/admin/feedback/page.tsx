import type { Metadata } from 'next';
import AdminFeedbackPageContent from '@/views/admin/AdminFeedback';

export const metadata: Metadata = {
  title: 'Admin - Feedback',
  description: 'View BeyondRounds user feedback.',
};

export const dynamic = 'force-dynamic';

export default function AdminFeedbackPage() {
  return <AdminFeedbackPageContent />;
}
