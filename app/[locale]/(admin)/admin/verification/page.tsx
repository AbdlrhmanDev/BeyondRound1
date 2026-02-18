import { redirect } from 'next/navigation';

// Redirect old /verification to /verifications
export default function VerificationRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/admin/verifications`);
}
