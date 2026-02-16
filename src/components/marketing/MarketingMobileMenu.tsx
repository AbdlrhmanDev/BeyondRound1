'use client';

/**
 * Mobile menu with backdrop, close-on-click-outside, and language switcher.
 * Backdrop and menu rendered via Portal to ensure click-outside works reliably.
 */
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { LanguageLinks } from './LanguageLinks';

interface NavLink {
  href: string;
  label: string;
}

interface MarketingMobileMenuProps {
  locale: string;
  navLinks: NavLink[];
  logInLabel: string;
  joinNowLabel: string;
  languageLabel: string;
}

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

export function MarketingMobileMenu({
  locale,
  navLinks,
  logInLabel,
  joinNowLabel,
  languageLabel,
}: MarketingMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = () => setIsOpen(false);

  const menuOverlay = isOpen && mounted && typeof document !== 'undefined' && createPortal(
    <>
      {/* Backdrop - click anywhere outside menu to close */}
      <button
        type="button"
        className="fixed inset-0 z-[9998] bg-black/20 cursor-pointer"
        onClick={close}
        aria-label="Close menu"
      />
      <div
        className="fixed left-3 right-3 mt-2 bg-[#F6F1EC] border border-[#E8DED5]/60 rounded-2xl shadow-xl p-5 animate-fade-in z-[9999] max-h-[calc(100dvh-env(safe-area-inset-top)-6rem)] overflow-y-auto"
        style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        <nav className="flex flex-col gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              prefetch={false}
              className="min-h-[44px] flex items-center px-4 py-3 text-[#3A0B22] hover:text-[#F27C5C] hover:bg-[#F27C5C]/5 active:bg-[#F27C5C]/10 rounded-xl font-medium transition-all duration-200"
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[#E8DED5]/60 my-4" aria-hidden />
          <div className="flex justify-end mb-3">
            <LanguageLinks variant="overlay" onLinkClick={close} />
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/${locale}/auth`}
              prefetch={false}
              className="min-h-[44px] flex items-center justify-center px-4 py-3 text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#F27C5C]/5 active:bg-[#F27C5C]/10 rounded-xl font-medium transition-all duration-200"
              onClick={close}
            >
              {logInLabel}
            </Link>
            <Link
              href={`/${locale}/onboarding`}
              prefetch={false}
              onClick={close}
              className="flex min-h-[52px] items-center justify-center rounded-2xl font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200"
            >
              {joinNowLabel}
            </Link>
          </div>
        </nav>
      </div>
    </>,
    document.body
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white rounded-lg hover:bg-white/10 cursor-pointer -mr-1"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </button>
      {menuOverlay}
    </div>
  );
}
