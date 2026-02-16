'use client';

import { useState, useEffect } from 'react';

interface ScrollHeaderProps {
  children: React.ReactNode;
}

export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div
          className={`rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'bg-[#3A0B22]/70 backdrop-blur-xl shadow-lg border border-white/10'
              : 'bg-transparent'
          }`}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
