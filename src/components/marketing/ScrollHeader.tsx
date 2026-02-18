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
          className={`rounded-[20px] backdrop-blur-xl transition-all duration-500 ease-out ${
            scrolled
              ? 'bg-gradient-to-r from-[#3A0B22] via-[#3A0B22]/95 to-[#4B0F2D] shadow-xl shadow-[#3A0B22]/20 border border-white/[0.08]'
              : 'bg-gradient-to-r from-[#3A0B22]/90 via-[#3A0B22]/85 to-[#4B0F2D]/90 shadow-lg shadow-[#3A0B22]/15 border border-white/[0.06]'
          }`}
        >
          {children}
        </div>
      </div>
    </header>
  );
}
