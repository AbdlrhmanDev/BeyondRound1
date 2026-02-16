'use client';

import { usePathname } from "next/navigation";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { pathWithoutLocale } from "@/lib/locale";
import { preloadRoute } from "@/lib/preloadRoutes";
import { LayoutGrid, Users, MessageCircle, User } from "lucide-react";

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutGrid },
  { path: '/matches', label: 'Match', icon: Users },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const navigate = useLocalizedNavigate();
  const pathname = usePathname();
  const currentPath = pathWithoutLocale(pathname || '/');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-2 pt-1.5">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => preloadRoute(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] flex-1 max-w-[80px] py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
