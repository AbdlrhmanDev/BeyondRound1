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
  Settings,
  Users,
  LayoutGrid,
  User,
  ArrowRight
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navPaths = [
  { labelKey: "dashboard.title", path: "/dashboard", icon: LayoutGrid },
  { labelKey: "dashboard.groups", path: "/matches", icon: Users },
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 sm:px-6 h-14 flex justify-between items-center max-w-5xl">
          <div className="flex items-center gap-4 min-w-0">
            <div
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 cursor-pointer min-h-[44px] shrink-0"
              onClick={() => navigate("/dashboard")}
              onMouseEnter={() => preloadRoute("/dashboard")}
              onFocus={() => preloadRoute("/dashboard")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/dashboard")}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">B</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground hidden sm:inline">{t("common.brand")}</span>
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
                    className={`gap-2 rounded-lg px-3 min-h-[36px] text-sm ${
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <NotificationPopover />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open settings"
              className={`rounded-lg min-h-[36px] min-w-[36px] ${
                pathnameWithoutLocale === "/settings" ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => navigate("/settings")}
              onMouseEnter={() => preloadRoute("/settings")}
              onFocus={() => preloadRoute("/settings")}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="gap-2 min-h-[36px] text-muted-foreground hover:text-foreground rounded-lg px-3 hidden sm:flex"
            >
              <span>{t("common.signOut")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-4" aria-label="Main navigation">
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
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] flex-1 max-w-[100px] py-1.5 px-2 rounded-lg ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </Button>
          );
        })}
      </nav>

      <div className="pb-20 md:pb-0">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
