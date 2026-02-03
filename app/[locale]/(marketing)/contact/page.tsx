import type { Metadata } from 'next';
import ContactPageContent from '@/views/Contact';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the BeyondRounds team.',
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ContactPage() {
  return <ContactPageContent />;
}
