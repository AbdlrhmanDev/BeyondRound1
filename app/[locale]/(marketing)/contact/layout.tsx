import { ToasterOnlyLayout } from '@/components/ToasterOnlyLayout';

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <ToasterOnlyLayout>{children}</ToasterOnlyLayout>;
}
