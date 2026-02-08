'use client';

import { useState, useEffect } from 'react';
import { useModal } from './LandingModalProvider';

interface StickyMobileCTAProps {
  label: string;
}

export default function StickyMobileCTA({ label }: StickyMobileCTAProps) {
  const { openModal } = useModal();
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
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-sm border-t border-gray-100 md:hidden">
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-full py-3.5 font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm"
      >
        {label}
      </button>
    </div>
  );
}
