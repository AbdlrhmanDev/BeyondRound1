'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Sparkles, ArrowLeft, Check, MailCheck } from "lucide-react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const { toast } = useToast();
  const navigate = useLocalizedNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
  });

  const validateForm = () => {
    try {
      emailSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { email?: string } = {};
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
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email. Please try again.",
          variant: "destructive",
        });
      } else {
        setIsSuccess(true);
        toast({
          title: "Email sent!",
          description: "Check your inbox for password reset instructions.",
        });
      }
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
    "Secure password reset process",
    "Email verification required",
    "Quick and easy recovery",
    "Protected account access"
  ];

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

      {/* Back to Login */}
      <LocalizedLink 
        to="/auth" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Login</span>
      </LocalizedLink>

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
              Forgot
              <span className="block text-gradient-gold">Password?</span>
            </h1>
            
            <p className="text-primary-foreground/60 text-lg mb-10 max-w-md mx-auto lg:mx-0">
              No worries! Enter your email address and we'll send you instructions to reset your password.
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

          {/* Right side - Reset Password Card */}
          <div className="w-full max-w-md animate-fade-up delay-200">
            <div className="relative">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-xl opacity-60" />
              
              {/* Card */}
              <div className="relative bg-background/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-3xl p-8 sm:p-10">
                {isSuccess ? (
                  /* Success State */
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                      <MailCheck className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">
                      Check Your Email
                    </h2>
                    <p className="text-primary-foreground/60 text-sm mb-8">
                      We've sent password reset instructions to <span className="font-medium text-primary-foreground">{formData.email}</span>
                    </p>
                    <p className="text-primary-foreground/50 text-xs mb-6">
                      Didn't receive the email? Check your spam folder or try again.
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => {
                          setIsSuccess(false);
                          setFormData({ email: "" });
                        }}
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                      >
                        Send Another Email
                      </Button>
                      <LocalizedLink to="/auth">
                        <Button 
                          variant="ghost"
                          className="w-full h-12 rounded-2xl text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5"
                        >
                          Back to Login
                        </Button>
                      </LocalizedLink>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="font-display text-2xl font-bold text-primary-foreground mb-2">Reset Password</h2>
                      <p className="text-primary-foreground/60 text-sm">Enter your email to receive reset instructions</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-primary-foreground/80 text-sm font-medium">
                          Email Address
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-foreground/40 group-focus-within:text-primary transition-colors" size={18} />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="doctor@hospital.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`pl-12 h-14 rounded-2xl bg-primary-foreground/5 border-primary-foreground/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all ${errors.email ? 'border-red-500' : ''}`}
                            required
                          />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
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
                            Send Reset Link
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
                        <span className="px-4 text-primary-foreground/40 bg-transparent">Remember your password?</span>
                      </div>
                    </div>

                    {/* Back to Login */}
                    <LocalizedLink to="/auth">
                      <Button 
                        variant="outline"
                        className="w-full h-14 rounded-2xl border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
                      >
                        Back to Login
                        <ArrowLeft className="ml-2" size={18} />
                      </Button>
                    </LocalizedLink>
                  </>
                )}
              </div>
            </div>

            {/* Terms note */}
            <p className="text-center text-primary-foreground/40 text-xs mt-6 px-4">
              Need help?{" "}
              <LocalizedLink to="/faq" className="text-primary hover:underline">Visit our FAQ</LocalizedLink>
              {" "}or{" "}
              <LocalizedLink to="/about" className="text-primary hover:underline">Contact Support</LocalizedLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
