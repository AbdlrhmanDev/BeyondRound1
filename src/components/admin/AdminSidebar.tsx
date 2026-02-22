'use client';

import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShieldCheck, Users, AlertTriangle,
  MessageSquare, MessageCircle, ListChecks, ScrollText, Settings, LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "pendingVerifications" | "openReports";
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Verification Queue", url: "/admin/verifications", icon: ShieldCheck, badgeKey: "pendingVerifications" },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Reports & Safety", url: "/admin/reports", icon: AlertTriangle, badgeKey: "openReports" },
  { title: "Groups & Chats", url: "/admin/groups", icon: MessageSquare },
  { title: "Feedback", url: "/admin/feedback", icon: MessageCircle },
  { title: "Waitlist & Surveys", url: "/admin/waitlist", icon: ListChecks },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: ScrollText },
  { title: "App Config", url: "/admin/config", icon: Settings },
];

const AdminSidebar = () => {
  const navigate = useLocalizedNavigate();
  const { pathWithLocale } = useLocale();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchBadges = async () => {
      const [verRes, reportRes] = await Promise.allSettled([
        (supabase as any).from("verification_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("user_reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const counts: Record<string, number> = {};
      if (verRes.status === "fulfilled" && !verRes.value.error) {
        counts.pendingVerifications = verRes.value.count || 0;
      }
      if (reportRes.status === "fulfilled" && !reportRes.value.error) {
        counts.openReports = reportRes.value.count || 0;
      }
      setBadges(counts);
    };

    fetchBadges();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">BeyondRounds</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const href = pathWithLocale(item.url);
          const isActive = item.url === "/admin"
            ? pathname === href
            : pathname?.startsWith(href);
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <Link
              key={item.url}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.title}</span>
              {badgeCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-xs">
                  {badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
