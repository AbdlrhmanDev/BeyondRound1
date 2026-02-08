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
const COMPANY_LINKS = [
  { href: "/about", labelKey: "common.about" },
  { href: "/faq", labelKey: "common.faq" },
  { href: "/contact", labelKey: "common.contact" },
] as const;

const DOCTOR_LINKS = [
  { href: "/for-doctors", labelKey: "common.forDoctors" },
  { href: "/pricing", labelKey: "common.pricing" },
] as const;

const LEGAL_LINKS = [
  { href: "/terms", labelKey: "common.terms" },
  { href: "/privacy", labelKey: "common.privacy" },
  { href: "/impressum", labelKey: "common.impressum" },
] as const;

import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

// ... existing imports ...

const Header = () => {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale;
  const lng = locale === "en" ? "en" : "de";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  // Helper to get the correct dashboard URL based on environment
  const getDashboardUrl = () => {
    if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
      return `${DOMAINS.app}/${lng}/dashboard`;
    }
    return `/${lng}/dashboard`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center justify-between">
        {/* Logo */}
        <LocalizedLink to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            {t("common.brand")}
          </span>
        </LocalizedLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {[...DOCTOR_LINKS, ...COMPANY_LINKS].map((link) => (
              <LocalizedLink
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {t(link.labelKey)}
              </LocalizedLink>
            ))}
          </div>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher variant="ghost" />
          {loading ? (
            <div className="h-9 w-24 rounded-lg bg-muted animate-pulse" />
          ) : user ? (
            <a href={getDashboardUrl()}>
              <Button size="sm" className="rounded-full px-5 font-medium shadow-sm transition-all hover:shadow-md">{t("common.dashboard")}</Button>
            </a>
          ) : (
            <>
              <LocalizedLink to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                  {t("common.logIn")}
                </Button>
              </LocalizedLink>
              <LocalizedLink to="/onboarding">
                <Button size="sm" className="rounded-full px-5 shadow-sm font-medium transition-all hover:shadow-md">{t("common.joinNow")}</Button>
              </LocalizedLink>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher variant="ghost" className="h-9 w-9 p-0" />

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-95 transition-all"
                aria-label="Toggle menu"
              >
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border/60">
              <SheetHeader className="px-6 py-6 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <SheetTitle className="font-display text-lg font-bold tracking-tight text-foreground">
                    {t("common.brand")}
                  </SheetTitle>
                </div>
                <SheetDescription className="sr-only">Mobile Navigation</SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
                {/* CTA Section */}
                <div className="space-y-3">
                  {loading ? (
                    <div className="h-12 w-full rounded-2xl bg-muted animate-pulse" />
                  ) : user ? (
                    <a href={getDashboardUrl()} onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full h-12 rounded-2xl text-base font-bold shadow-sm">{t("common.dashboard")}</Button>
                    </a>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <LocalizedLink to="/auth" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="outline" className="w-full h-12 rounded-2xl text-base font-semibold border-border/60 hover:bg-muted/50">
                          {t("common.logIn")}
                        </Button>
                      </LocalizedLink>
                      <LocalizedLink to="/onboarding" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full h-12 rounded-2xl text-base font-bold shadow-sm">{t("common.joinNow")}</Button>
                      </LocalizedLink>
                    </div>
                  )}
                </div>

                {/* Navigation Groups */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">For Doctors</h3>
                    <nav className="flex flex-col space-y-1">
                      {DOCTOR_LINKS.map((link) => (
                        <LocalizedLink
                          key={link.href}
                          to={link.href}
                          className="flex h-11 items-center rounded-xl px-4 text-base font-medium text-foreground hover:bg-muted/50 hover:text-primary transition-all"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t(link.labelKey)}
                        </LocalizedLink>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">Company</h3>
                    <nav className="flex flex-col space-y-1">
                      {COMPANY_LINKS.map((link) => (
                        <LocalizedLink
                          key={link.href}
                          to={link.href}
                          className="flex h-11 items-center rounded-xl px-4 text-base font-medium text-foreground hover:bg-muted/50 hover:text-primary transition-all"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {t(link.labelKey)}
                        </LocalizedLink>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>

              {/* Footer Legal */}
              <div className="p-6 border-t border-border/60 bg-muted/10">
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
                  {LEGAL_LINKS.map((link) => (
                    <LocalizedLink
                      key={link.href}
                      to={link.href}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t(link.labelKey)}
                    </LocalizedLink>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-center mt-4 font-medium">
                  © {new Date().getFullYear()} BeyondRounds. All rights reserved.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
