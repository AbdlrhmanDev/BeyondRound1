import type { Metadata } from 'next';
import ContactPageContent from '@/views/Contact';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the BeyondRounds team.',
  openGraph: {
    title: 'Contact BeyondRounds',
    description: 'Get in touch with the BeyondRounds team. We\'d love to hear from you.',
    images: [{ url: '/hero-doctors-friendship.jpg', width: 1200, height: 800, alt: 'Doctors enjoying a relaxed dinner together — BeyondRounds' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/hero-doctors-friendship.jpg'],
  },
};

// Force static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

export default function ContactPage() {
  return <ContactPageContent />;
}
