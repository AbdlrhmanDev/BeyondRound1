import type { Metadata } from 'next';
import SurveyPageContent from '@/views/Survey';

export const metadata: Metadata = {
  title: 'Survey',
  description: 'Help us improve BeyondRounds.',
};

export const dynamic = 'force-dynamic';

export default function SurveyPage() {
  return <SurveyPageContent />;
}
