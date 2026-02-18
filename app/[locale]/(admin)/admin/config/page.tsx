import type { Metadata } from 'next';
import AdminConfigContent from '@/views/admin/AdminConfig';

export const metadata: Metadata = {
  title: 'App Config',
  description: 'Manage application configuration.',
};

export const dynamic = 'force-dynamic';

export default function AdminConfigPage() {
  return <AdminConfigContent />;
}
