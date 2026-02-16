'use client';

import { usePathname } from "next/navigation";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { pathWithoutLocale } from "@/lib/locale";
import { Bell } from "lucide-react";

export default function AppHeader() {
  const navigate = useLocalizedNavigate();
  const pathname = usePathname();
  const path = pathWithoutLocale(pathname || '/');

  const titles: Record<string, string> = {
    '/dashboard': 'Home',
    '/matches': 'Matching',
    '/chat': 'Chat',
    '/profile': 'Profile',
  };

  const title = titles[path] || 'BeyondRounds';

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between h-14 px-5 max-w-lg mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 min-h-[44px]"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">B</span>
          </div>
          <span className="font-display text-lg font-bold text-foreground">{title}</span>
        </button>
        <button className="relative h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  );
}
