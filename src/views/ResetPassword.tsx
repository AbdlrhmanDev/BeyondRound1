'use client';

import { useState, useEffect } from "react";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, ShieldAlert, Lock } from "lucide-react";
import LocalizedLink from "@/components/LocalizedLink";
import { useLocalizedNavigate } from "@/hooks/useLocalizedNavigate";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/integrations/supabase/client";
import { validatePassword } from "@/utils/validation";

// ─── Shared input style ────────────────────────────────────────────────────────
const inputClass = [
  'w-full rounded-[18px] border border-[#E8E0DA] bg-[#FDFBF9] px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200 h-12',
  'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
  'hover:border-[#D4C9C1]',
].join(' ');

type PageState = 'loading' | 'invalid' | 'form' | 'success';

// ─── Requirement row ───────────────────────────────────────────────────────────
function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? 'text-emerald-600' : 'text-[#5E555B]/60'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200 ${met ? 'bg-emerald-500' : 'bg-[#D4C9C1]'}`} />
      {label}
    </li>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <LocalizedLink to="/" className="flex items-center gap-1.5">
      <span className="font-display font-bold text-xl text-[#3A0B22] italic tracking-tight">Beyond</span>
      <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">Rounds</span>
    </LocalizedLink>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function ResetPassword() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const { toast } = useToast();
  const navigate = useLocalizedNavigate();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Read tokens directly from the URL hash — most reliable approach
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    // Supabase puts an error in the hash when the link is invalid/expired
    const errorCode = hash.get('error_code') || hash.get('error');
    if (errorCode) {
      setPageState('invalid');
      return;
    }

    const accessToken  = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    const tokenType    = hash.get('type'); // 'recovery' for password reset

    if (accessToken && refreshToken && tokenType === 'recovery') {
      // Manually set the session — bypasses the async event system completely
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            console.error('[ResetPassword] setSession error:', error.message);
            setPageState('invalid');
          } else {
            setPageState('form');
          }
        });
      return;
    }

    // No hash tokens — check if there is already an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setPageState(session ? 'form' : 'invalid');
    });
  }, []);



  // ── Password strength requirements ────────────────────────────────────────────
  const reqs = [
    { met: password.length >= 8,             label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password),           label: 'One uppercase letter' },
    { met: /[0-9]/.test(password),           label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password),   label: 'One special character' },
  ];
  const strength = reqs.filter(r => r.met).length;

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const { valid, errors: valErrors } = validatePassword(password);
    if (!valid) {
      setErrors({ password: valErrors[0] });
      return false;
    }
    if (password !== confirmPassword) {
      setErrors({ confirm: 'Passwords do not match' });
      return false;
    }
    setErrors({});
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update password. Please try again.',
          variant: 'destructive',
        });
      } else {
        setPageState('success');
        setTimeout(() => navigate('/auth'), 3000);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F6F1EC] flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-16 bg-[#F6F1EC]/80 backdrop-blur-md border-b border-[#E8DED5]/40">
        <div className="w-20">
          <LocalizedLink
            to="/auth"
            className="flex items-center gap-2 text-[#5E555B] hover:text-[#3A0B22] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="sr-only">Back to login</span>
          </LocalizedLink>
        </div>
        <Logo />
        <div className="w-20" />
      </nav>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-md space-y-8">

          {/* ── LOADING ── */}
          {pageState === 'loading' && (
            <div className="bg-[#FAF6F3] rounded-[22px] border border-[#E8DED5]/60 shadow-sm p-12 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-[3px] border-[#F6B4A8]/30 border-t-[#F27C5C] rounded-full animate-spin" />
              <p className="text-[#5E555B] text-sm">Verifying your reset link…</p>
            </div>
          )}

          {/* ── INVALID / EXPIRED ── */}
          {pageState === 'invalid' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[#3A0B22] tracking-tight">
                  Link expired
                </h1>
                <p className="text-[#5E555B] text-base">
                  This password reset link is no longer valid.
                </p>
              </div>

              <div className="bg-[#FAF6F3] rounded-[22px] border border-[#E8DED5]/60 shadow-sm p-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                  <ShieldAlert size={30} className="text-amber-500" />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[#3A0B22] font-medium">Why did this happen?</p>
                  <p className="text-[#5E555B] text-sm leading-relaxed">
                    Reset links are valid for <span className="font-semibold text-[#3A0B22]">24 hours</span> and
                    can only be used once. Please request a new link.
                  </p>
                </div>

                <LocalizedLink to="/forgot-password" className="block">
                  <button
                    type="button"
                    className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20"
                  >
                    Request a new link
                  </button>
                </LocalizedLink>

                <LocalizedLink to="/auth" className="block text-center">
                  <span className="text-sm font-medium text-[#5E555B] hover:text-[#3A0B22] transition-colors">
                    Back to login
                  </span>
                </LocalizedLink>
              </div>
            </>
          )}

          {/* ── FORM ── */}
          {pageState === 'form' && (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-3">
                  <Lock size={22} className="text-[#F27C5C]" />
                </div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[#3A0B22] tracking-tight">
                  Create new password
                </h1>
                <p className="text-[#5E555B] text-base">
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <div className="bg-[#FAF6F3] rounded-[22px] border border-[#E8DED5]/60 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">

                    {/* New password */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium text-[#3A0B22]">
                        New password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                          placeholder="Enter new password"
                          className={`${inputClass} ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5E555B] hover:text-[#3A0B22] transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    {/* Strength indicator */}
                    {password.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                i < strength
                                  ? strength <= 1 ? 'bg-red-400'
                                  : strength === 2 ? 'bg-amber-400'
                                  : strength === 3 ? 'bg-blue-400'
                                  : 'bg-emerald-500'
                                  : 'bg-[#E8DED5]'
                              }`}
                            />
                          ))}
                        </div>
                        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1">
                          {reqs.map(r => <PasswordRequirement key={r.label} {...r} />)}
                        </ul>
                      </div>
                    )}

                    {/* Confirm password */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-[#3A0B22]">
                        Confirm new password
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: undefined })); }}
                          placeholder="Repeat new password"
                          className={`${inputClass} ${errors.confirm ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5E555B] hover:text-[#3A0B22] transition-colors"
                        >
                          {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        'Update password'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ── SUCCESS ── */}
          {pageState === 'success' && (
            <>
              <div className="text-center space-y-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-[#3A0B22] tracking-tight">
                  Password updated!
                </h1>
                <p className="text-[#5E555B] text-base">
                  You can now sign in with your new password.
                </p>
              </div>

              <div className="bg-[#FAF6F3] rounded-[22px] border border-[#E8DED5]/60 shadow-sm p-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
                </div>

                <div className="space-y-1">
                  <p className="text-[#3A0B22] font-medium">All done!</p>
                  <p className="text-[#5E555B] text-sm">
                    Redirecting you to login in a moment…
                  </p>
                </div>

                <LocalizedLink to="/auth" className="block">
                  <button
                    type="button"
                    className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20"
                  >
                    Go to login now
                  </button>
                </LocalizedLink>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
