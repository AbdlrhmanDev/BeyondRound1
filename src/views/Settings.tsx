'use client';

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import type { Locale } from "@/lib/locale";
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
  Languages,
  Trash2,
  ChevronRight,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { BillingSection } from "@/components/BillingSection";
import { PageLoadingSkeleton } from "@/components/ui/skeleton-loader";
import { getSettings, updateSettings } from "@/services/settingsService";
import { usePushNotifications } from "@/hooks/usePushNotifications";
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
  const { t } = useTranslation();
  const { setTheme } = useTheme();
  const { user, loading: authLoading, signOut, updatePassword } = useAuth();
  const { locale, setLocaleAndNavigate } = useLocale();
  const navigate = useLocalizedNavigate();
  
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
  const { isSupported: pushSupported, isIOS, isStandalone, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [eventNotifications, setEventNotifications] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
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
    if (user?.id) {
      setLoadingSettings(true);
      loadSettings();
    } else {
      setLoadingSettings(false);
    }
  }, [user, authLoading, navigate, loadSettings]);

  // Only apply theme after settings have loaded - avoids reverting to light on nav
  useEffect(() => {
    if (!loadingSettings) {
      document.documentElement.classList.toggle("dark", darkMode);
      setTheme(darkMode ? "dark" : "light"); // Sync next-themes so it persists across nav
    }
  }, [darkMode, loadingSettings, setTheme]);

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

  // Show page immediately; settings load in background (no blocking skeleton)
  if (authLoading) {
    return <PageLoadingSkeleton />;
  }

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 animate-fade-up">
          <LocalizedLink to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t("dashboard.title")}
          </LocalizedLink>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-primary">{t("dashboard.settings")}</span>
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
                  <CardTitle className="text-lg font-display">{t("settings.account")}</CardTitle>
                  <CardDescription>{t("settings.accountDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.email")}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled aria-label={t("settings.change")}>
                  {t("settings.change")}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.password")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.updatePasswordHint")}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={openPasswordDialog} aria-label={t("settings.changePassword")}>
                  {t("settings.change")}
                </Button>
              </div>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full justify-between p-4 h-auto rounded-xl hover:bg-secondary/50"
                asChild
              >
                <LocalizedLink to="/profile" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{t("settings.editProfile")}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </LocalizedLink>
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
                  <CardTitle className="text-lg font-display">{t("settings.notifications")}</CardTitle>
                  <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.emailNotifications")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.emailNotificationsDesc")}</p>
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
                    <p className="text-sm font-medium">{t("settings.pushNotifications")}</p>
                    <p className="text-xs text-muted-foreground">
                      {isIOS && !isStandalone
                        ? "Add to Home Screen first to enable push on iOS"
                        : !pushSupported
                        ? "Not supported in this browser"
                        : t("settings.pushNotificationsDesc")}
                    </p>
                  </div>
                </div>
                <Switch
                  disabled={!pushSupported || pushLoading}
                  checked={pushSupported ? pushSubscribed : pushNotifications}
                  onCheckedChange={async (value) => {
                    if (!pushSupported) return;
                    if (value) {
                      const ok = await subscribePush();
                      if (ok) {
                        setPushNotifications(true);
                        saveSetting({ push_notifications: true });
                        toast.success("Push notifications enabled");
                      } else {
                        toast.error("Could not enable push notifications — check browser permissions");
                      }
                    } else {
                      await unsubscribePush();
                      setPushNotifications(false);
                      saveSetting({ push_notifications: false });
                      toast.success("Push notifications disabled");
                    }
                  }}
                />
              </div>

              <Separator className="my-4" />
              
              <div className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{t("settings.newMatches")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.newMatchesDesc")}</p>
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
                  <p className="text-sm font-medium">{t("settings.eventsMeetups")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.eventsMeetupsDesc")}</p>
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
                  <CardTitle className="text-lg font-display">{t("settings.privacy")}</CardTitle>
                  <CardDescription>{t("settings.privacyDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.profileVisibility")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.profileVisibilityDesc")}</p>
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
                  <CardTitle className="text-lg font-display">{t("settings.appearance")}</CardTitle>
                  <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.language")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
                  {(["de", "en"] as const).map((l) => (
                    <Button
                      key={l}
                      variant={locale === l ? "secondary" : "ghost"}
                      size="sm"
                      className="min-w-[2.5rem] font-medium transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => setLocaleAndNavigate(l as Locale)}
                      aria-label={l === "de" ? t("settings.deutsch") : t("settings.english")}
                    >
                      {l === "de" ? "DE" : "EN"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("settings.darkMode")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.darkModeDesc")}</p>
                  </div>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={(value) => {
                    setDarkMode(value);
                    setTheme(value ? "dark" : "light");
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
                  <CardTitle className="text-lg font-display text-destructive">{t("settings.dangerZone")}</CardTitle>
                  <CardDescription>{t("settings.dangerZoneDesc")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-muted-foreground hover:text-foreground rounded-xl h-12"
                onClick={handleSignOut}
              >
                {t("settings.signOut")}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12"
              >
                {t("settings.deleteAccount")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={(open) => !open && closePasswordDialog()}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">{t("settings.changePassword")}</DialogTitle>
              <DialogDescription>
                {t("settings.changePasswordDesc")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t("settings.currentPassword")}</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("settings.currentPasswordPlaceholder")}
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
                <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("settings.newPasswordPlaceholder")}
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
                <Label htmlFor="confirm-password">{t("settings.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("settings.confirmPasswordPlaceholder")}
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
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? t("settings.updating") : t("settings.updatePasswordButton")}
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
