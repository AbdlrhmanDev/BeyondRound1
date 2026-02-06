import type { Metadata } from 'next';
import BookingFlowContent from '@/views/BookingFlow';

export const metadata: Metadata = {
  title: 'Book Meetup',
  description: 'Book your next BeyondRounds meetup.',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { eventId: string; locale: string };
}

export default function BookingPage({ params }: PageProps) {
  return <BookingFlowContent eventId={params.eventId} />;
}
