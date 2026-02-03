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
  LogOut, 
  Settings, 
  Users, 
  Heart, 
  LayoutGrid,
  User,
  ArrowRight
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navPaths = [
  { labelKey: "dashboard.title", path: "/dashboard", icon: LayoutGrid },
  { labelKey: "dashboard.matches", path: "/matches", icon: Heart },
  { labelKey: "dashboard.profile", path: "/profile", icon: User },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const pathnameWithoutLocale = pathWithoutLocale(pathname || '/');
  const navItems = navPaths;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Header: mobile-first padding and touch targets */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 min-h-14 sm:h-16 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer min-h-[44px] items-center shrink-0 rounded-lg active:opacity-90"
              onClick={() => navigate("/dashboard")}
              onMouseEnter={() => preloadRoute("/dashboard")}
              onFocus={() => preloadRoute("/dashboard")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard")}
            >
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-primary-foreground font-display font-bold text-sm sm:text-lg">B</span>
              </div>
              <span className="font-display text-base sm:text-xl font-bold text-foreground hidden sm:inline truncate">{t("common.brand")}</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathnameWithoutLocale === item.path;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    onMouseEnter={() => preloadRoute(item.path)}
                    onFocus={() => preloadRoute(item.path)}
                    className={`group gap-2 rounded-full px-3 sm:px-4 min-h-[44px] transition-all duration-200 ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/25 shadow-sm hover:bg-primary/20 hover:border-primary/30"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-sm"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isActive ? "text-primary" : "group-hover:scale-110"
                    }`} />
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <NotificationPopover />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open settings"
              className={`rounded-full min-h-[44px] min-w-[44px] hover:bg-secondary ${
                pathnameWithoutLocale === "/settings" ? "bg-secondary" : ""
              }`}
              onClick={() => navigate("/settings")}
              onMouseEnter={() => preloadRoute("/settings")}
              onFocus={() => preloadRoute("/settings")}
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="w-px h-5 sm:h-6 bg-border mx-1 sm:mx-2 hidden sm:block" />
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="gap-2 min-h-[44px] text-muted-foreground hover:text-foreground rounded-full px-3 sm:px-4"
            >
              <span className="hidden sm:inline">{t("common.signOut")}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>

        {/* Mobile bottom nav: touch-friendly, labels fully visible */}
        <nav className="md:hidden flex items-center justify-around border-t border-border/40 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-2 sm:px-4 gap-1 min-h-[64px]" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathnameWithoutLocale === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                onMouseEnter={() => preloadRoute(item.path)}
                onFocus={() => preloadRoute(item.path)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[56px] flex-1 max-w-[120px] py-2.5 px-2 rounded-xl transition-all duration-200 overflow-visible ${
                  isActive
                    ? "text-primary bg-primary/15 border border-primary/25 shadow-sm"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 active:bg-primary/10"
                }`}
              >
                <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 shrink-0 transition-transform duration-200 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[11px] sm:text-xs leading-tight whitespace-nowrap overflow-visible font-medium">{t(item.labelKey)}</span>
              </Button>
            );
          })}
        </nav>
      </header>

      {children}
    </div>
  );
};

export default DashboardLayout;
