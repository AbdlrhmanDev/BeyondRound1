import type { Metadata } from 'next';
import EventsPageContent from '@/views/Events';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Your upcoming and past meetups.',
};

export const dynamic = 'force-dynamic';

export default function EventsPage() {
  return <EventsPageContent />;
}
