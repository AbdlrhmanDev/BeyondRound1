'use client';

/**
 * Premium mobile menu — cream card with soft shadow, 44px tap targets,
 * coral CTA pinned at bottom. Backdrop + portal for reliable click-outside.
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
  isAuthenticated?: boolean;
  dashboardLabel?: string;
  logOutLabel?: string;
}

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

const XIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  isAuthenticated = false,
  dashboardLabel = 'Dashboard',
  logOutLabel = 'Log out',
}: MarketingMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = () => setIsOpen(false);

  const menuOverlay = isOpen && mounted && typeof document !== 'undefined' && createPortal(
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-[9998] bg-[#3A0B22]/25 backdrop-blur-sm cursor-pointer"
        onClick={close}
        aria-label="Close menu"
      />

      {/* Menu card */}
      <div
        className="fixed left-3 right-3 bg-[#FAF6F3] border border-[#E8DED5]/50 rounded-2xl shadow-2xl shadow-[#3A0B22]/10 p-1.5 animate-fade-in z-[9999] max-h-[calc(100dvh-env(safe-area-inset-top)-6rem)] overflow-y-auto"
        style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}
      >
        {/* Nav links */}
        <nav className="flex flex-col gap-0.5 px-1.5 pt-2 pb-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={`/${locale}${link.href}`}
              prefetch={false}
              className="min-h-[44px] flex items-center px-4 py-3 text-[#3A0B22] hover:bg-[#3A0B22]/[0.04] active:bg-[#3A0B22]/[0.07] rounded-xl font-medium text-[0.9375rem] tracking-[0.005em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C]/40 focus-visible:ring-inset"
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divider + language + CTA section */}
        <div className="mx-3 border-t border-[#E8DED5]/50 my-2" aria-hidden />

        <div className="px-3 pb-3">
          {/* Language toggle */}
          <div className="flex justify-end mb-3">
            <LanguageLinks variant="mobile-menu" onLinkClick={close} />
          </div>

          {/* Auth actions */}
          <div className="flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={`/${locale}/dashboard`}
                  prefetch={false}
                  onClick={close}
                  className="flex min-h-[48px] items-center justify-center rounded-2xl font-semibold text-[0.9375rem] tracking-[0.01em] bg-[#F27C5C] text-white hover:bg-[#e8694d] active:bg-[#d8603f] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20"
                  aria-label="Go to your dashboard"
                >
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  className="min-h-[44px] flex items-center justify-center px-4 py-3 text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.04] active:bg-[#3A0B22]/[0.07] rounded-xl font-medium text-[0.875rem] transition-all duration-200"
                  aria-label="Sign out of your account"
                  onClick={async () => {
                    const { getClient } = await import('@/lib/supabase/client');
                    await getClient().auth.signOut();
                    close();
                    window.location.reload();
                  }}
                >
                  {logOutLabel}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/auth`}
                  prefetch={false}
                  className="min-h-[44px] flex items-center justify-center px-4 py-3 text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.04] active:bg-[#3A0B22]/[0.07] rounded-xl font-medium text-[0.875rem] transition-all duration-200"
                  onClick={close}
                >
                  {logInLabel}
                </Link>
                <Link
                  href={`/${locale}/onboarding`}
                  prefetch={false}
                  onClick={close}
                  className="flex min-h-[48px] items-center justify-center rounded-2xl font-semibold text-[0.9375rem] tracking-[0.01em] bg-[#F27C5C] text-white hover:bg-[#e8694d] active:bg-[#d8603f] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20"
                >
                  {joinNowLabel}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-white/85 hover:text-white rounded-xl hover:bg-white/[0.08] active:bg-white/[0.12] cursor-pointer -mr-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8]/50"
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
