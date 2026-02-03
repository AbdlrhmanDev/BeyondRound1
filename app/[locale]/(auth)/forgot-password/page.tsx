import type { Metadata } from 'next';
import ForgotPasswordPageContent from '@/views/ForgotPassword';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your BeyondRounds password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent />;
}
