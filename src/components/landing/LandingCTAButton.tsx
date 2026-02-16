'use client';

import { useModal } from './LandingModalProvider';

interface LandingCTAButtonProps {
  label: string;
  className?: string;
}

export function LandingCTAButton({ label, className }: LandingCTAButtonProps) {
  const { openModal } = useModal();

  return (
    <button
      type="button"
      onClick={openModal}
      className={className ?? 'inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm'}
    >
      {label}
    </button>
  );
}
