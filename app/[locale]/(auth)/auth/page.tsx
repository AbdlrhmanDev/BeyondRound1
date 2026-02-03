import type { Metadata } from 'next';
import AuthPageContent from '@/views/Auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your BeyondRounds account.',
};

export default function AuthPage() {
  return <AuthPageContent />;
}
