import type { Metadata } from 'next';
import OnboardingPageContent from '@/views/Onboarding';

export const metadata: Metadata = {
  title: 'Join BeyondRounds',
  description: 'Create your account and complete your BeyondRounds profile.',
};

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  return <OnboardingPageContent />;
}
