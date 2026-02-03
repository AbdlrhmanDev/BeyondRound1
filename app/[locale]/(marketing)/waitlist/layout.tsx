import { ToasterOnlyLayout } from '@/components/ToasterOnlyLayout';

export default function WaitlistLayout({ children }: { children: React.ReactNode }) {
  return <ToasterOnlyLayout>{children}</ToasterOnlyLayout>;
}
