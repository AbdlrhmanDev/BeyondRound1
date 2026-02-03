import type { Metadata } from 'next';
import AdminAuditLogsPageContent from '@/views/admin/AdminAuditLogs';

export const metadata: Metadata = {
  title: 'Admin - Audit Logs',
  description: 'View BeyondRounds audit logs.',
};

export const dynamic = 'force-dynamic';

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsPageContent />;
}
