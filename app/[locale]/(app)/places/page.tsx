import type { Metadata } from 'next';
import PlaceSuggestionsPageContent from '@/views/PlaceSuggestions';

export const metadata: Metadata = {
  title: 'Place Suggestions',
  description: 'Find places to meet with your matches.',
};

export const dynamic = 'force-dynamic';

export default function PlacesPage() {
  return <PlaceSuggestionsPageContent />;
}
