'use client';

import { ReactNode } from "react";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <AppHeader />
      <div className="pb-20 md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
