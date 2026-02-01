import { LayoutDashboard, MessageSquare, Users, Heart, LogOut, History } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Feedback", url: "/admin/feedback", icon: MessageSquare },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Matches", url: "/admin/matches", icon: Heart },
  { title: "Audit Logs", url: "/admin/audit-logs", icon: History },
];

const AdminSidebar = () => {
  const navigate = useLocalizedNavigate();
  const { pathWithLocale } = useLocale();
  const { signOut } = useAuth();

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
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={pathWithLocale(item.url)}
            end={item.url === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
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
