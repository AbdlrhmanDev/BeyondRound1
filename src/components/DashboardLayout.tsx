import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Matches", path: "/matches", icon: Heart },
  { label: "Profile", path: "/profile", icon: User },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/dashboard")}
            >
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">B</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground hidden sm:inline">BeyondRounds</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    className={`group gap-2 rounded-full px-4 transition-all duration-200 ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/15 hover:shadow-sm"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 transition-transform duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`} />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationPopover />
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Open settings"
              className={`rounded-full hover:bg-secondary ${
                location.pathname === "/settings" ? "bg-secondary" : ""
              }`}
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="w-px h-6 bg-border mx-2 hidden sm:block" />
            <Button 
              variant="ghost" 
              onClick={handleSignOut} 
              className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around border-t border-border/40 py-2 px-4">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`flex-col gap-1 h-auto py-2 px-3 rounded-xl transition-all duration-200 ${
                location.pathname === item.path 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              <item.icon className="h-5 w-5 transition-transform duration-200" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </nav>
      </header>

      {children}
    </div>
  );
};

export default DashboardLayout;
