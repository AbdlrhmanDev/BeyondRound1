interface LandingCTAButtonProps {
  label: string;
  className?: string;
  href?: string;
}

export function LandingCTAButton({ label, className, href = '/onboarding' }: LandingCTAButtonProps) {
  return (
    <a
      href={href}
      className={className ?? 'inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm'}
    >
      {label}
    </a>
  );
}
