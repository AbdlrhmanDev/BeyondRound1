import type { Metadata } from 'next';
import AdminVerificationPageContent from '@/views/admin/AdminVerification';

export const metadata: Metadata = {
  title: 'Admin Verification',
  description: 'Review doctor verification requests.',
};

export const dynamic = 'force-dynamic';

export default function AdminVerificationPage() {
  return <AdminVerificationPageContent />;
}
