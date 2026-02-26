'use client';

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import LocalizedLink from "@/components/LocalizedLink";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const inputClass = [
  'w-full rounded-[18px] border border-[#E8E0DA] bg-[#FDFBF9] px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200 h-12',
  'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
  'hover:border-[#D4C9C1]',
].join(' ');

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
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          locale: (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en')
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to send reset email. Please try again.",
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

  return (
    <div className="min-h-screen bg-[#F6F1EC] flex flex-col">
      {/* Top Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-16 bg-[#F6F1EC]/80 backdrop-blur-md border-b border-[#E8DED5]/40">
        <div className="w-20">
          <LocalizedLink
            to="/auth"
            className="flex items-center gap-2 text-[#5E555B] hover:text-[#3A0B22] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="sr-only">{t("common.back")}</span>
          </LocalizedLink>
        </div>

        <LocalizedLink to="/" className="flex items-center gap-1.5">
          <span className="font-display font-bold text-xl text-[#3A0B22] italic tracking-tight">
            Beyond
          </span>
          <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">
            Rounds
          </span>
        </LocalizedLink>

        <div className="w-20" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-[#3A0B22] tracking-tight">
              {isSuccess ? t("forgotPassword.checkEmail") : t("forgotPassword.title")}
            </h1>
            <p className="text-[#5E555B] text-base">
              {isSuccess ? t("forgotPassword.checkEmailDesc") : t("forgotPassword.subtitle")}
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#FAF6F3] rounded-[22px] border border-[#E8DED5]/60 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              {isSuccess ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      <path d="m16 19 2 2 4-4" />
                    </svg>
                  </div>

                  <p className="text-[#5E555B]">
                    We&apos;ve sent password reset instructions to{' '}
                    <span className="font-semibold text-[#3A0B22]">{formData.email}</span>
                  </p>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSuccess(false);
                        setFormData({ email: "" });
                      }}
                      className="w-full h-12 rounded-full border border-[#3A0B22]/20 text-[#3A0B22] hover:bg-[#3A0B22]/[0.03] font-medium transition-all duration-200"
                    >
                      {t("forgotPassword.sendAnother")}
                    </button>
                    <LocalizedLink to="/auth" className="block w-full">
                      <button
                        type="button"
                        className="w-full h-12 rounded-full text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.03] font-medium transition-all duration-200"
                      >
                        {t("forgotPassword.backToLogin")}
                      </button>
                    </LocalizedLink>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-[#3A0B22]">
                      {t("auth.emailAddress")}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${inputClass} ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                      required
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                    ) : (
                      t("forgotPassword.sendResetLink")
                    )}
                  </button>

                  <LocalizedLink to="/auth" className="block w-full text-center">
                    <span className="text-sm font-medium text-[#5E555B] hover:text-[#3A0B22] transition-colors">
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
