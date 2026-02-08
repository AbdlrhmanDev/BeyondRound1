/**
 * Server-rendered footer for marketing layout. Uses dictionary (no i18next).
 */
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { getT } from '@/lib/i18n/t';
import { EMAILS } from '@/constants/emails';
import type { Locale } from '@/lib/i18n/settings';

const footerLinks = {
  product: [
    { labelKey: 'common.howItWorks', href: '/learn-more' },
    { labelKey: 'common.pricing', href: '/pricing' },
    { labelKey: 'common.faq', href: '/faq' },
    { labelKey: 'common.about', href: '/about' },
  ],
  legal: [
    { labelKey: 'common.termsConditions', href: '/terms' },
    { labelKey: 'common.privacyPolicy', href: '/privacy' },
    { labelKey: 'landing.impressum', href: '/impressum' },
  ],
  support: [
    { labelKey: 'common.contactUs', href: `mailto:${EMAILS.contact}` },
    { labelKey: 'common.faq', href: '/faq' },
  ],
} as const;

const linkClass =
  'text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1 group min-h-[44px] py-2 -my-2';

interface FooterSmallProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function FooterSmall({ dict, locale }: FooterSmallProps) {
  const t = getT(dict);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-16 lg:py-20 grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-700 transition-colors">
                <span className="text-white text-lg font-bold">B</span>
              </div>
              <span className="font-display font-bold text-2xl text-gray-900">
                {t('common.brand')}
              </span>
            </Link>
            <p className="text-gray-500 mb-6 sm:mb-8 max-w-sm text-sm sm:text-base lg:text-lg leading-relaxed">
              {t('common.tagline')}. {t('common.footerSubtitle')}
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${EMAILS.contact}`}
                className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:border-gray-300 transition-colors">
                  <Mail size={18} />
                </div>
                <span>{EMAILS.contact}</span>
              </a>
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <span>{t('common.footerLocation')}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-gray-900 mb-6">{t('common.product')}</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('mailto:') ? (
                    <a href={link.href} className={linkClass}>
                      {t(link.labelKey)}
                    </a>
                  ) : (
                    <Link href={`/${locale}${link.href}`} prefetch={true} className={linkClass}>
                      {t(link.labelKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-gray-900 mb-6">{t('common.legal')}</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={`/${locale}${link.href}`} className={linkClass}>
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-gray-900 mb-6">{t('common.support')}</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('mailto:') ? (
                    <a href={link.href} className={linkClass}>
                      {t(link.labelKey)}
                    </a>
                  ) : (
                    <Link href={`/${locale}${link.href}`} className={linkClass}>
                      {t(link.labelKey)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} {t('common.brand')}. {t('common.allRightsReserved')}
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            {t('common.madeForDoctors')}
          </p>
        </div>
      </div>
    </footer>
  );
}
