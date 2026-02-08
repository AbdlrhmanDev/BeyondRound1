'use client';

import { useModal } from './LandingModalProvider';

interface LandingHeaderCTAProps {
  label: string;
}

export function LandingHeaderCTA({ label }: LandingHeaderCTAProps) {
  const { openModal } = useModal();

  return (
    <button
      type="button"
      onClick={openModal}
      className="inline-flex h-9 items-center justify-center rounded-2xl px-4 font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm"
    >
      {label}
    </button>
  );
}
