import type { Metadata } from 'next';
import DashboardPageContent from '@/views/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your BeyondRounds dashboard.',
};

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardPageContent />;
}
