'use client';

import { useState, useEffect } from 'react';
import { WAITLIST_URL } from '@/lib/waitlist';

interface StickyMobileCTAProps {
  label: string;
}

export default function StickyMobileCTA({ label }: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#F6F1EC]/95 backdrop-blur-sm border-t border-[#E8DED5]/60 md:hidden">
      <a
        href={WAITLIST_URL}
        className="w-full rounded-full py-3.5 font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center"
        aria-label="Join the BeyondRounds waitlist"
      >
        {label}
      </a>
    </div>
  );
}
