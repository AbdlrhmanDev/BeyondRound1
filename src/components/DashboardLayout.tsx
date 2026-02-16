'use client';

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { pathWithoutLocale } from "@/lib/locale";
import { preloadRoute } from "@/lib/preloadRoutes";
import { Button } from "@/components/ui/button";
import NotificationPopover from "@/components/NotificationPopover";
import {
  Users,
  LayoutGrid,
  User,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

// ─── Navigation Config ──────────────────────────────────
const navItems = [
  { label: "Home",    labelKey: "dashboard.title",   path: "/dashboard", icon: LayoutGrid },
  { label: "Match",   labelKey: "dashboard.groups",   path: "/matches",   icon: Users },
  { label: "Chat",    labelKey: "dashboard.chat",     path: "/chat",      icon: MessageCircle },
  { label: "Profile", labelKey: "dashboard.profile",  path: "/profile",   icon: User },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const currentPath = pathWithoutLocale(pathname || '/');

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#E8DED5] bg-[#F7F2EE] pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex justify-between items-center max-w-5xl">
          <div className="flex items-center gap-4 min-w-0">
            {/* Logo */}
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2.5 cursor-pointer min-h-[44px] shrink-0"
              onClick={() => navigate("/dashboard")}
              onMouseEnter={() => preloadRoute("/dashboard")}
              onFocus={() => preloadRoute("/dashboard")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard")}
              aria-label="Go to dashboard"
            >
              <div className="h-8 w-8 rounded-full bg-[#3A0B22] flex items-center justify-center">
                <span className="text-[#F7F2EE] font-display font-bold text-sm">B</span>
              </div>
              <span className="font-display text-lg font-bold text-[#3A0B22] hidden sm:inline">
                {t("common.brand", { defaultValue: "BeyondRounds" })}
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Desktop navigation">
              {navItems.map((item) => {
                const isActive = currentPath === item.path;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => preloadRoute(item.path)}
                    onFocus={() => preloadRoute(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    className={`gap-2 rounded-lg px-3 min-h-[36px] text-sm transition-colors ${
                      isActive
                        ? "bg-[#F27C5C]/10 text-[#F27C5C]"
                        : "text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey, { defaultValue: item.label })}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NotificationPopover />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="gap-2 min-h-[36px] text-[#5E555B] hover:text-[#3A0B22] rounded-lg px-3 hidden sm:flex"
            >
              <span>{t("common.signOut", { defaultValue: "Sign out" })}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page Content ───────────────────────────────── */}
      <div className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>

      {/* ── Mobile Bottom Nav ──────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F2EE] border-t border-[#E8DED5]"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around px-2 pt-1.5">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => preloadRoute(item.path)}
                onFocus={() => preloadRoute(item.path)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`${item.label}${isActive ? ", current page" : ""}`}
                className={[
                  // Base layout
                  "relative flex flex-col items-center justify-center gap-[3px]",
                  "flex-1 max-w-[88px] min-h-[52px] py-1.5",
                  // Tap target
                  "rounded-xl",
                  // Transitions
                  "transition-colors duration-150 ease-out",
                  // Active vs inactive
                  isActive
                    ? "text-[#F27C5C]"
                    : "text-[#5E555B] hover:text-[#3A0B22] active:text-[#3A0B22]",
                  // Focus visible
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F27C5C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F2EE]",
                  // Pressed
                  "active:scale-[0.95]",
                ].join(" ")}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full bg-[#F27C5C]" />
                )}

                {/* Icon */}
                <Icon
                  className={`h-[22px] w-[22px] transition-colors duration-150 ${
                    isActive ? "text-[#F27C5C]" : ""
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                {/* Label */}
                <span
                  className={`text-[10px] leading-tight tracking-wide ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
