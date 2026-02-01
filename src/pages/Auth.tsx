import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Sparkles, ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { signIn, user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  
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
          title: "Login failed",
          description: error.message === "Invalid login credentials" 
            ? "Invalid email or password. Please try again."
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
              title: "Access Denied",
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
              title: "Account Temporarily Suspended",
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
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      // Check admin status and redirect accordingly
      // The useEffect will handle the redirect once admin status is loaded
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
    "Verified medical professionals only",
    "Weekly curated friend matches",
    "Private & secure connections",
    "Specialty-based matching"
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
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Back to Home */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </Link>

      {/* Main content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 lg:gap-16 items-center">
          
          {/* Left side - Branding & Features */}
          <div className="flex-1 text-center lg:text-left max-w-lg animate-fade-up">
            {/* Logo */}
            <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-2xl text-primary-foreground">BeyondRounds</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-[1.1] mb-6">
              Welcome
              <span className="block text-gradient-gold">back!</span>
            </h1>
            
            <p className="text-primary-foreground/60 text-lg mb-10 max-w-md mx-auto lg:mx-0">
              Sign in to continue building meaningful friendships with fellow doctors.
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
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl opacity-60" />
              
              {/* Card */}
              <div className="relative bg-background/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-3xl p-8 sm:p-10">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">Sign In</h2>
                  <p className="text-primary-foreground/60 text-sm">Enter your credentials to continue</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary-foreground/80 text-base font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/70 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary focus:ring-primary/20 transition-all ${errors.email ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-primary-foreground/80 text-base font-medium">
                        Password
                      </Label>
                      <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/70 group-hover:text-primary group-focus-within:text-primary transition-colors z-10" size={18} />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-12 pr-12 h-14 rounded-2xl bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-primary focus:ring-primary/20 transition-all ${errors.password ? 'border-destructive' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/70 group-hover:text-primary hover:text-primary transition-colors z-10"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs mt-1">{errors.password}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-gradient-gold hover:opacity-90 text-primary-foreground font-semibold text-base shadow-glow hover:shadow-[0_0_80px_-12px_hsl(28_100%_50%_/_0.5)] transition-all group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-primary-foreground/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 text-primary-foreground/40 bg-transparent">New to BeyondRounds?</span>
                  </div>
                </div>

                {/* Join Now CTA */}
                <Link to="/onboarding">
                  <Button 
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                  >
                    Join Now
                    <ArrowRight className="ml-2" size={18} />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Terms note */}
            <p className="text-center text-primary-foreground/40 text-xs mt-6 px-4">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
