import type { Metadata } from 'next';
import AdminVerificationDetailContent from '@/views/admin/AdminVerificationDetail';

export const metadata: Metadata = {
  title: 'Verification Review',
  description: 'Review a verification request.',
};

export const dynamic = 'force-dynamic';

export default function AdminVerificationDetailPage() {
  return <AdminVerificationDetailContent />;
}
