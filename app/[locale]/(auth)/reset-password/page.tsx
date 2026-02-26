import type { Metadata } from 'next';
import ResetPasswordPageContent from '@/views/ResetPassword';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set your new BeyondRounds password.',
};

export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  return <ResetPasswordPageContent />;
}
