/**
 * Server-rendered footer for marketing layout. Uses dictionary (no i18next).
 */
import Link from 'next/link';
import { Mail, MapPin, Sparkles, ArrowUpRight } from 'lucide-react';
import { getT } from '@/lib/i18n/t';
import { EMAILS } from '@/constants/emails';
import type { Locale } from '@/lib/i18n/settings';

const footerLinks = {
  product: [
    { labelKey: 'common.forDoctors', href: '/for-doctors' },
    { labelKey: 'common.takeQuiz', href: '/survey', prefetch: false },
    { labelKey: 'common.howItWorks', href: '/learn-more' },
    { labelKey: 'common.pricing', href: '/pricing' },
    { labelKey: 'common.faq', href: '/faq' },
    { labelKey: 'common.about', href: '/about' },
  ],
  legal: [
    { labelKey: 'common.termsConditions', href: '/terms' },
    { labelKey: 'common.privacyPolicy', href: '/privacy' },
  ],
  support: [
    { labelKey: 'common.contactUs', href: `mailto:${EMAILS.contact}` },
    { labelKey: 'common.faq', href: '/faq' },
  ],
} as const;

const linkClass =
  'text-primary-foreground/50 hover:text-primary-foreground transition-colors inline-flex items-center gap-1 group min-h-[44px] py-2 -my-2';

interface FooterSmallProps {
  dict: Record<string, unknown>;
  locale: Locale;
}

export function FooterSmall({ dict, locale }: FooterSmallProps) {
  const t = getT(dict);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="defer-render bg-foreground dark:bg-background relative overflow-hidden border-t border-primary-foreground/10 dark:border-border">
      <div className="absolute inset-0 pointer-events-none [contain:strict]">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[80px] sm:blur-[120px] lg:blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-16 lg:py-20 grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link href={`/${locale}`} className="flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-primary-foreground">
                {t('common.brand')}
              </span>
            </Link>
            <p className="text-primary-foreground/50 mb-6 sm:mb-8 max-w-sm text-sm sm:text-base lg:text-lg leading-relaxed">
              {t('common.tagline')}. A premium social club exclusively for verified medical professionals.
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${EMAILS.contact}`}
                className="flex items-center gap-3 text-primary-foreground/50 hover:text-primary-foreground transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center group-hover:border-primary-foreground/20 transition-colors">
                  <Mail size={18} />
                </div>
                <span>{EMAILS.contact}</span>
              </a>
              <div className="flex items-center gap-3 text-primary-foreground/50">
                <div className="w-10 h-10 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <span>Berlin, Germany</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">{t('common.product')}</h4>
            <ul className="space-y-4">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('mailto:') ? (
                    <a href={link.href} className={linkClass}>
                      {t(link.labelKey)}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link href={`/${locale}${link.href}`} prefetch={'prefetch' in link ? link.prefetch : true} className={linkClass}>
                      {t(link.labelKey)}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">{t('common.legal')}</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={`/${locale}${link.href}`} className={linkClass}>
                    {t(link.labelKey)}
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-primary-foreground mb-6">{t('common.support')}</h4>
            <ul className="space-y-4">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith('mailto:') ? (
                    <a href={link.href} className={linkClass}>
                      {t(link.labelKey)}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link href={`/${locale}${link.href}`} className={linkClass}>
                      {t(link.labelKey)}
                      <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/30 text-sm">
            © {currentYear} {t('common.brand')}. {t('common.allRightsReserved')}
          </p>
          <p className="text-primary-foreground/30 text-sm flex items-center gap-2">
            {t('common.madeForDoctors')}
          </p>
        </div>
      </div>
    </footer>
  );
}
