"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import LocalizedLink from "@/components/LocalizedLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DOMAINS } from "@/lib/domains";
import { useParams } from "next/navigation";

// Move outside component to avoid recreation on every render
const NAV_LINKS = [
  { href: "/for-doctors", labelKey: "common.forDoctors" },
  { href: "/about", labelKey: "common.about" },
  { href: "/faq", labelKey: "common.faq" },
  { href: "/contact", labelKey: "common.contact" },
  { href: "/pricing", labelKey: "common.pricing" },
] as const;

const Header = () => {
  const { locale } = useParams<{ locale: string }>();
  const lng = locale === "en" ? "en" : "de";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-xl sm:rounded-2xl shadow-lg">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between min-h-14 sm:h-16">
              {/* Logo */}
              <LocalizedLink to="/" className="flex items-center gap-2 sm:gap-3 group min-h-[44px] items-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-base sm:text-xl text-primary-foreground tracking-tight truncate">
                  {t("common.brand")}
                </span>
              </LocalizedLink>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map((link) => (
                  <LocalizedLink
                    key={link.href}
                    to={link.href}
                    className="px-4 py-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors duration-200 font-medium text-sm rounded-lg hover:bg-primary-foreground/5"
                  >
                    {t(link.labelKey)}
                  </LocalizedLink>
                ))}
                <LanguageSwitcher className="ml-2" variant="overlay" />
              </nav>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-3">
                {!loading && user ? (
                  <a href={`${DOMAINS.app}/${lng}/dashboard`} className="[&>button]:cursor-pointer">
                    <Button>{t("common.dashboard")}</Button>
                  </a>
                ) : (
                  <>
                    <LocalizedLink to="/auth">
                      <Button variant="ghost" size="sm" className="font-medium text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10">
                        {t("common.logIn")}
                      </Button>
                    </LocalizedLink>
                    <LocalizedLink to="/onboarding">
                      <Button>{t("common.joinNow")}</Button>
                    </LocalizedLink>
                  </>
                )}
              </div>

              {/* Mobile: Language + Menu Button (touch targets ≥44px) */}
              <div className="md:hidden flex items-center gap-1">
                <LanguageSwitcher variant="overlay" />
                <button
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-primary-foreground rounded-lg hover:bg-primary-foreground/10 active:bg-primary-foreground/15 transition-colors -mr-1"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation (full-width tap targets) */}
      {isMenuOpen && (
        <div className="md:hidden mx-3 mt-2 sm:mx-4">
          <div className="bg-primary-foreground/5 dark:bg-card/90 backdrop-blur-2xl border border-primary-foreground/10 dark:border-border rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 animate-fade-in">
            <nav className="flex flex-col gap-0.5">
              {NAV_LINKS.map((link) => (
                <LocalizedLink
                  key={link.href}
                  to={link.href}
                  className="min-h-[44px] flex items-center px-4 py-3 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5 active:bg-primary-foreground/10 transition-colors duration-200 font-medium rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(link.labelKey)}
                </LocalizedLink>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-white/10">
                {!loading && user ? (
                  <a href={`${DOMAINS.app}/${lng}/dashboard`} onClick={() => setIsMenuOpen(false)} className="block">
                    <Button className="w-full min-h-[44px] justify-center">{t("common.dashboard")}</Button>
                  </a>
                ) : (
                  <>
                    <LocalizedLink to="/auth" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button variant="ghost" className="w-full min-h-[44px] justify-center text-white/70 hover:text-white hover:bg-white/10">
                        {t("common.logIn")}
                      </Button>
                    </LocalizedLink>
                    <LocalizedLink to="/onboarding" onClick={() => setIsMenuOpen(false)} className="block">
                      <Button className="w-full min-h-[44px] justify-center">{t("common.joinNow")}</Button>
                    </LocalizedLink>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
