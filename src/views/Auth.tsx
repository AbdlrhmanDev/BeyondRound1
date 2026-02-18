"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, Eye, EyeOff, ArrowLeft, Check } from "lucide-react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { z } from "zod";
import { LanguageLinks } from "@/components/marketing/LanguageLinks";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { signIn, user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useLocalizedNavigate();

  const handleJoinNow = () => {
    navigate('/onboarding');
  };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already logged in - admins go to /admin, regular users go to /dashboard
  useEffect(() => {
    if (!loading && user && !adminLoading) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, adminLoading, isAdmin, navigate]);

  const validateForm = () => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof typeof fieldErrors] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        toast({
          title: t("auth.loginFailed"),
          description: error.message === "Invalid login credentials"
            ? t("auth.invalidCredentials")
            : error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // After successful login, check if user is banned or suspended
      const { data: { user: authUser } } = await getSupabaseClient().auth.getUser();
      if (authUser) {
        const { data: profile, error: profileError } = await getSupabaseClient()
          .from("profiles")
          .select("status, ban_reason")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking user status:", profileError);
        } else if (profile) {
          if (profile.status === "banned") {
            // Sign out the banned user
            await getSupabaseClient().auth.signOut();
            toast({
              title: t("auth.accessDenied"),
              description: profile.ban_reason
                ? `Your account has been permanently banned. Reason: ${profile.ban_reason}. If you believe this is an error, please contact support.`
                : "Your account has been permanently banned. If you believe this is an error, please contact our support team.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          } else if (profile.status === "suspended") {
            // Sign out the suspended user
            await getSupabaseClient().auth.signOut();
            toast({
              title: t("auth.accountSuspended"),
              description: profile.ban_reason
                ? `Your account has been temporarily suspended. Reason: ${profile.ban_reason}. Please contact support for assistance.`
                : "Your account has been temporarily suspended. Please contact our support team for more information.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        }
      }

      // User is active, proceed with login
      toast({
        title: t("auth.welcomeBack"),
        description: t("auth.loginSuccess"),
      });
      // Check admin status and redirect accordingly
      // The useEffect will handle the redirect once admin status is loaded
    } catch (error) {
      toast({
        title: t("auth.error"),
        description: t("auth.somethingWentWrong"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
    }
  };

  const features = [
    t("auth.features.verified"),
    t("auth.features.weekly"),
    t("auth.features.private"),
    t("auth.features.specialty"),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground dark:bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-background/80 backdrop-blur-md border-b border-border supports-[backdrop-filter]:bg-background/60">
        <div className="w-20">
          <LocalizedLink
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="sr-only">{t("common.back")}</span>
          </LocalizedLink>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-foreground text-lg tracking-tight">{t("common.brand")}</span>
        </div>

        <div className="w-20 flex justify-end">
          <LanguageLinks variant="default" className="text-muted-foreground hover:text-foreground" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-8 pb-12 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in">

          {/* Header Copy */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {t("auth.welcomeBack", "Welcome back.")}
            </h1>
            <p className="text-muted-foreground text-base">
              {t("auth.signInDescription", "Log in to see your next weekend group.")}
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {t("auth.emailAddress", "Email")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 rounded-xl transition-all ${errors.email ? 'border-destructive focus-visible:ring-destructive' : 'border-input hover:border-primary/50 focus-visible:ring-primary/20'}`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">
                      {t("auth.password", "Password")}
                    </Label>
                    <LocalizedLink to="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                      {t("auth.forgot", "Forgot password?")}
                    </LocalizedLink>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder={t("auth.enterCredentials")}
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`pl-10 pr-10 h-12 rounded-xl transition-all ${errors.password ? 'border-destructive focus-visible:ring-destructive' : 'border-input hover:border-primary/50 focus-visible:ring-primary/20'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base rounded-xl font-medium shadow-sm transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    t("auth.signIn", "Sign in")
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="px-2 bg-card text-muted-foreground">
                    {t("auth.or", "or")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinNow}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-input bg-transparent text-foreground font-medium hover:bg-muted transition-all active:scale-[0.98]"
              >
                {t("auth.newToBeyondRounds", "New to BeyondRounds? Create account")}
              </button>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="text-center space-y-6">
            <div className="flex flex-col gap-2 items-center justify-center text-muted-foreground text-sm">
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <Check size={14} className="text-primary" />
                <span className="font-medium text-foreground/80">{t("auth.trustFooter", "No public profiles. Access only for verified doctors.")}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/60 max-w-xs mx-auto leading-relaxed">
              {t("auth.byContinuing")} <LocalizedLink to="/terms" className="underline hover:text-foreground transition-colors">{t("auth.terms")}</LocalizedLink> {t("auth.and")} <LocalizedLink to="/privacy" className="underline hover:text-foreground transition-colors">{t("auth.privacy")}</LocalizedLink>.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Auth;
