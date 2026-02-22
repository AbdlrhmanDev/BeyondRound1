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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#F7F2EE',
        borderTop: '1px solid rgba(58,11,34,0.10)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
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
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label}${isActive ? ', current page' : ''}`}
              className={[
                'relative flex flex-col items-center justify-center gap-[3px]',
                'flex-1 max-w-[80px] min-h-[52px] py-1.5 rounded-xl',
                'transition-colors duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F2EE]',
                'active:scale-[0.95]',
              ].join(' ')}
              style={{ color: isActive ? '#F27C5C' : '#5E555B' }}
            >
              {isActive && (
                <span
                  className="absolute top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full"
                  style={{ background: '#F27C5C' }}
                />
              )}
              <item.icon
                className="h-[22px] w-[22px] transition-colors duration-150"
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className={`text-[10px] leading-tight tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
