'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, Sparkles, ArrowLeft, Check, MailCheck } from "lucide-react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient, supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const { toast } = useToast();
  const navigate = useLocalizedNavigate();
  const { t } = useTranslation();

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
      const { error } = await getSupabaseClient().auth.resetPasswordForEmail(formData.email, {
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
    <div className="min-h-screen bg-[#FAFAF7] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 bg-[#FAFAF7]/80 backdrop-blur-md border-b border-slate-200/50 supports-[backdrop-filter]:bg-[#FAFAF7]/60">
        <div className="w-20">
          <LocalizedLink
            to="/auth"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="sr-only">{t("common.back")}</span>
          </LocalizedLink>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600">
            <Sparkles size={16} />
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">BeyondRounds</span>
        </div>

        <div className="w-20 flex justify-end">
          {/* Placeholder for balance */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-md space-y-8">

          {/* Header Copy */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {isSuccess ? t("forgotPassword.checkEmail") : t("forgotPassword.title")}
            </h1>
            <p className="text-slate-500 text-base md:text-lg">
              {isSuccess ? t("forgotPassword.checkEmailDesc") : t("forgotPassword.subtitle")}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8">
              {isSuccess ? (
                /* Success State */
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <MailCheck className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-slate-600">
                      We've sent password reset instructions to <span className="font-semibold text-slate-900">{formData.email}</span>
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={() => {
                        setIsSuccess(false);
                        setFormData({ email: "" });
                      }}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    >
                      {t("forgotPassword.sendAnother")}
                    </Button>
                    <LocalizedLink to="/auth" className="block w-full">
                      <Button
                        variant="ghost"
                        className="w-full h-12 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      >
                        {t("forgotPassword.backToLogin")}
                      </Button>
                    </LocalizedLink>
                  </div>
                </div>
              ) : (
                /* Form State */
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      {t("auth.emailAddress")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`pl-10 h-12 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20 hover:border-emerald-500/50 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        required
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 bg-none text-white font-semibold shadow-sm hover:shadow transition-all text-[15px]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {t("forgotPassword.sendResetLink")}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                      </>
                    )}
                  </Button>

                  <LocalizedLink to="/auth" className="block w-full text-center">
                    <span className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                      {t("forgotPassword.backToLogin")}
                    </span>
                  </LocalizedLink>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
