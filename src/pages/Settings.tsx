import { useEffect, useState, useCallback } from "react";
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
  ChevronRight,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { BillingSection } from "@/components/BillingSection";
import { getSettings, updateSettings } from "@/services/settingsService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/utils/validation";

const Settings = () => {
  const { user, loading: authLoading, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});
  const [pushNotifications, setPushNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    setLoadingSettings(true);
    try {
      const settings = await getSettings(user.id);
      if (settings) {
        setEmailNotifications(settings.email_notifications);
        setPushNotifications(settings.push_notifications);
        setMatchNotifications(settings.match_notifications);
        setEventNotifications(settings.event_notifications);
        setProfileVisible(settings.profile_visible);
        setDarkMode(settings.dark_mode);
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoadingSettings(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user?.id) loadSettings();
  }, [user, authLoading, navigate, loadSettings]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const saveSetting = useCallback(
    async (updates: Parameters<typeof updateSettings>[1]) => {
      if (!user?.id) return;
      const updated = await updateSettings(user.id, updates);
      if (!updated) toast.error("Failed to save setting");
    },
    [user?.id]
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const openPasswordDialog = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { current?: string; new?: string; confirm?: string } = {};
    if (!currentPassword.trim()) errors.current = "Current password is required";
    if (!newPassword.trim()) errors.new = "New password is required";
    else {
      const { valid, errors: validationErrors } = validatePassword(newPassword);
      if (!valid) errors.new = validationErrors[0];
    }
    if (newPassword !== confirmPassword) errors.confirm = "Passwords do not match";
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setPasswordLoading(true);
    setPasswordErrors({});
    const { error } = await updatePassword(currentPassword, newPassword);
    setPasswordLoading(false);
    if (error) {
      const msg = error.message?.toLowerCase().includes("invalid") ? "Current password is incorrect" : error.message;
      setPasswordErrors({ current: msg });
      toast.error(msg);
      return;
    }
    toast.success("Password updated successfully");
    closePasswordDialog();
  };

  if (authLoading || loadingSettings) {
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
                <Button variant="outline" size="sm" disabled aria-label="Change email (not implemented)">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-xs text-muted-foreground">Update your password</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={openPasswordDialog} aria-label="Change password">
                  Change
                </Button>
              </div>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full justify-between p-4 h-auto rounded-xl hover:bg-secondary/50"
                asChild
              >
                <Link to="/profile" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Edit Profile</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
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
                  onCheckedChange={(value) => {
                    setEmailNotifications(value);
                    saveSetting({ email_notifications: value });
                  }}
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
                  onCheckedChange={(value) => {
                    setPushNotifications(value);
                    saveSetting({ push_notifications: value });
                  }}
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
                  onCheckedChange={(value) => {
                    setMatchNotifications(value);
                    saveSetting({ match_notifications: value });
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">Events & Meetups</p>
                  <p className="text-xs text-muted-foreground">Upcoming physician events</p>
                </div>
                <Switch 
                  checked={eventNotifications} 
                  onCheckedChange={(value) => {
                    setEventNotifications(value);
                    saveSetting({ event_notifications: value });
                  }}
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
                  onCheckedChange={(value) => {
                    setProfileVisible(value);
                    saveSetting({ profile_visible: value });
                  }}
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
                  onCheckedChange={(value) => {
                    setDarkMode(value);
                    saveSetting({ dark_mode: value });
                  }}
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

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={(open) => !open && closePasswordDialog()}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one. Use at least 8 characters with uppercase, lowercase, and a number.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className={passwordErrors.current ? "border-destructive pr-10" : "pr-10"}
                    autoComplete="current-password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.current && (
                  <p className="text-sm text-destructive">{passwordErrors.current}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={passwordErrors.new ? "border-destructive pr-10" : "pr-10"}
                    autoComplete="new-password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.new && (
                  <p className="text-sm text-destructive">{passwordErrors.new}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={passwordErrors.confirm ? "border-destructive pr-10" : "pr-10"}
                    autoComplete="new-password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.confirm && (
                  <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closePasswordDialog} disabled={passwordLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Updating…" : "Update password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
};

export default Settings;
