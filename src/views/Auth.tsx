"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Sparkles, ArrowLeft, Check } from "lucide-react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
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
  // تحسين: عدم انتظار adminLoading إذا لم يكن هناك مستخدم
  useEffect(() => {
    if (!loading && user) {
      // تحسين: الانتظار بحد أقصى 2 ثانية لـ adminLoading
      const timeout = setTimeout(() => {
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, adminLoading ? 2000 : 0);
      
      if (!adminLoading) {
        clearTimeout(timeout);
        if (isAdmin) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
      
      return () => clearTimeout(timeout);
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("status, ban_reason")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error checking user status:", profileError);
        } else if (profile) {
          if (profile.status === "banned") {
            // Sign out the banned user
            await supabase.auth.signOut();
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
            await supabase.auth.signOut();
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
    <div className="min-h-screen relative overflow-hidden bg-foreground dark:bg-background">
      {/* Animated background gradient orbs - same as marketing/onboarding */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Back to Home + Language switcher */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-20 flex items-center justify-between">
        <LocalizedLink
          to="/"
          prefetch={false}
          className="flex items-center gap-2 min-h-[44px] min-w-[44px] rounded-lg pl-1 pt-1 text-primary-foreground/60 hover:text-primary-foreground active:bg-primary-foreground/10 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform shrink-0" />
          <span className="text-sm font-medium hidden sm:inline">{t("auth.back")}</span>
        </LocalizedLink>
        <LanguageLinks variant="overlay" className="shrink-0" />
      </div>

      {/* Main content: mobile-first padding and stacking */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 pt-20 sm:pt-24">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-16 items-center">
          {/* Left side - Branding & Features */}
          <div className="flex-1 text-center lg:text-left max-w-lg animate-fade-up w-full">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl sm:text-2xl text-primary-foreground">BeyondRounds</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-[1.1] mb-4 sm:mb-6">
              {t("auth.welcome")}
              <span className="block text-gradient-gold">{t("auth.backExclamation")}</span>
            </h1>
            
            <p className="text-primary-foreground/70 text-base sm:text-lg mb-8 sm:mb-10 max-w-md mx-auto lg:mx-0">
              {t("auth.signInDescription")}
            </p>

            {/* Features list */}
            <div className="space-y-4 hidden lg:block">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 text-primary-foreground/70 animate-fade-up"
                  style={{ animationDelay: `${(i + 2) * 100}ms` }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Login Card */}
          <div className="w-full max-w-md animate-fade-up delay-200">
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl sm:rounded-3xl blur-xl opacity-60" />
              {/* Card: same style as onboarding */}
              <div className="relative bg-background/5 border border-primary-foreground/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xl backdrop-blur-2xl">
                <div className="text-center mb-6 sm:mb-8">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-primary-foreground mb-1 sm:mb-2">{t("auth.signIn")}</h2>
                  <p className="text-primary-foreground/60 text-sm">{t("auth.enterCredentials")}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary-foreground/90 text-sm sm:text-base font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-primary-foreground/60 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 sm:pl-12 min-h-[48px] sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary focus:ring-primary/20 transition-all text-base ${errors.email ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-primary-foreground/90 text-sm sm:text-base font-medium">
                        {t("auth.password")}
                      </Label>
                      <LocalizedLink to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                        {t("auth.forgot")}
                      </LocalizedLink>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/60 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 sm:pl-12 pr-12 min-h-[48px] sm:h-14 rounded-xl sm:rounded-2xl bg-white/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary focus:ring-primary/20 transition-all text-base ${errors.password ? 'border-destructive' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/60 hover:text-primary transition-colors z-10"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full min-h-[48px] sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold text-base shadow-glow hover:shadow-[0_0_80px_-12px_hsl(28_100%_50%_/_0.5)] transition-all group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        {t("auth.signIn")}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-primary-foreground/60 bg-background/5">{t("auth.newToBeyondRounds")}</span>
                  </div>
                </div>

                {/* Join Now CTA */}
                <button
                  type="button"
                  onClick={handleJoinNow}
                  className="flex items-center justify-center gap-2 w-full min-h-[48px] sm:h-14 rounded-xl sm:rounded-2xl border border-primary-foreground/30 bg-transparent hover:bg-primary-foreground/10 font-semibold text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground cursor-pointer"
                >
                  {t("auth.joinNow")}
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </div>
            </div>

            {/* Terms note */}
            <p className="text-center text-primary-foreground/50 text-xs mt-6 px-4">
              {t("auth.byContinuing")}{" "}
              <LocalizedLink to="/terms" className="text-primary hover:underline hover:text-primary/90">{t("auth.termsOfService")}</LocalizedLink>
              {" "}{t("auth.and")}{" "}
              <LocalizedLink to="/privacy" className="text-primary hover:underline hover:text-primary/90">{t("auth.privacyPolicy")}</LocalizedLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
