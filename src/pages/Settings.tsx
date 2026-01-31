import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Bell, 
  Shield, 
  User, 
  Mail, 
  Smartphone,
  Moon,
  Globe,
  Trash2,
  ChevronRight
} from "lucide-react";
import { BillingSection } from "@/components/BillingSection";

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Settings state (local only - can be connected to DB later)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-6 py-8 lg:py-12 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 animate-fade-up">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-primary">Settings</span>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Account</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full justify-between p-4 h-auto rounded-xl hover:bg-secondary/50"
                onClick={() => navigate("/profile")}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-100">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Notifications</CardTitle>
                  <CardDescription>Configure how you receive notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive push notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={pushNotifications} 
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <Separator className="my-4" />
              
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">New Matches</p>
                  <p className="text-xs text-muted-foreground">When someone matches with you</p>
                </div>
                <Switch 
                  checked={matchNotifications} 
                  onCheckedChange={setMatchNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">Events & Meetups</p>
                  <p className="text-xs text-muted-foreground">Upcoming physician events</p>
                </div>
                <Switch 
                  checked={eventNotifications} 
                  onCheckedChange={setEventNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-200">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Privacy</CardTitle>
                  <CardDescription>Control your privacy settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Profile Visibility</p>
                    <p className="text-xs text-muted-foreground">Allow others to find you</p>
                  </div>
                </div>
                <Switch 
                  checked={profileVisible} 
                  onCheckedChange={setProfileVisible}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-300">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Moon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display">Appearance</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                  </div>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing & Subscription Section */}
          <BillingSection />

          {/* Danger Zone */}
          <Card className="border-0 shadow-xl shadow-foreground/5 rounded-3xl animate-fade-up delay-400 border-destructive/20">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg font-display text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl h-12"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default Settings;
