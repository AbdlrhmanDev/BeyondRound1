'use client';

/**
 * Marketing header - client for menu state + LanguageSwitcher.
 * Uses native buttons (no Radix), inline SVGs (no lucide) to reduce TBT on landing.
 * Menu overlay rendered via Portal so click-outside works reliably.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { LanguageLinks } from './LanguageLinks';

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

interface NavLink {
  href: string;
  label: string;
}

interface MarketingHeaderClientProps {
  locale: string;
  navLinks: NavLink[];
  logInLabel: string;
  joinNowLabel: string;
  brandLabel: string;
}

export function MarketingHeaderClient({
  locale,
  navLinks,
  logInLabel,
  joinNowLabel,
  brandLabel,
}: MarketingHeaderClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const menuOverlay = isMenuOpen && mounted && typeof document !== 'undefined' && createPortal(
    <>
      <button
        type="button"
        className="md:hidden fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={() => setIsMenuOpen(false)}
        aria-label="Close menu"
      />
      <div className="md:hidden mx-3 mt-2 sm:mx-4">
        <div className="md:hidden fixed left-3 right-3 mt-2 bg-black backdrop-blur-xl border border-white/10 rounded-xl shadow-xl p-4 animate-fade-in z-[9999]" style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}>
          <nav className="flex flex-col gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className="min-h-[44px] flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-white/15 active:bg-white/10 rounded-xl font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/auth`}
              className="min-h-[44px] flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-white/15 active:bg-white/10 rounded-xl font-medium transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              {logInLabel}
            </Link>
            <div className="pt-4 mt-2 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-gray-400">Language</span>
                <LanguageLinks variant="overlay" onLinkClick={() => setIsMenuOpen(false)} />
              </div>
              <Link
                href={`/${locale}/onboarding`}
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full min-h-[48px] items-center justify-center rounded-2xl font-semibold bg-gradient-gold text-white shadow-lg shadow-orange-500/30 hover:opacity-95 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {joinNowLabel}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-xl sm:rounded-2xl shadow-lg">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between min-h-14 sm:h-16">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2 sm:gap-3 group min-h-[44px] items-center"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300 shrink-0">
                  <SparklesIcon />
                </div>
                <span className="font-display font-bold text-base sm:text-xl text-primary-foreground tracking-tight truncate">
                  {brandLabel}
                </span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={`/${locale}${link.href}`}
                    className="px-4 py-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 font-medium text-sm rounded-lg hover:bg-primary-foreground/5"
                  >
                    {link.label}
                  </Link>
                ))}
                <LanguageLinks className="ml-2" variant="overlay" />
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <Link
                  href={`/${locale}/auth`}
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-3 font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                >
                  {logInLabel}
                </Link>
                <Link
                  href={`/${locale}/onboarding`}
                  className="inline-flex h-9 items-center justify-center rounded-2xl px-4 font-medium bg-gradient-gold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  {joinNowLabel}
                </Link>
              </div>

              <div className="md:hidden flex items-center gap-1">
                <button
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary-foreground rounded-lg hover:bg-primary-foreground/10 active:bg-primary-foreground/15 transition-colors -mr-1"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? <XIcon /> : <MenuIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {menuOverlay}
    </header>
  );
}
