import type { Metadata } from 'next';
import SettingsPageContent from '@/views/Settings';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your BeyondRounds account settings.',
};

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return <SettingsPageContent />;
}
