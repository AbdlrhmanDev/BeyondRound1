import type { Metadata } from 'next';
import FAQPageContent from '@/views/FAQ';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about BeyondRounds.',
  openGraph: {
    title: 'BeyondRounds FAQ',
    description: 'Everything you want to know about BeyondRounds — how matching works, who can join, and more.',
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

export default function FAQPage() {
  return <FAQPageContent />;
}
