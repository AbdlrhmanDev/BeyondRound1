'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { submitSurvey } from "@/services/surveyService";
import LocalizedLink from "@/components/LocalizedLink";

const inputClass = [
  'w-full rounded-[18px] border border-[#E8E0DA] bg-[#FDFBF9] px-4 py-3',
  'text-sm text-[#1A0A12] placeholder:text-[#5E555B]/50',
  'transition-all duration-200 h-12',
  'focus:outline-none focus:border-[#F6B4A8] focus:ring-[3px] focus:ring-[#F6B4A8]/40',
  'hover:border-[#D4C9C1]',
].join(' ');

const QUESTION_KEYS = [
  {
    id: "biggest_challenge",
    labelKey: "survey.q1Label",
    options: [
      { value: "isolated", labelKey: "survey.q1Isolated" },
      { value: "no_time", labelKey: "survey.q1NoTime" },
      { value: "medicine_talk", labelKey: "survey.q1MedicineTalk" },
      { value: "peers_lifestyle", labelKey: "survey.q1PeersLifestyle" },
      { value: "other", labelKey: "survey.q1Other" },
    ],
  },
  {
    id: "connection_type",
    labelKey: "survey.q2Label",
    options: [
      { value: "real_friendships", labelKey: "survey.q2RealFriendships" },
      { value: "professional_only", labelKey: "survey.q2ProfessionalOnly" },
      { value: "both", labelKey: "survey.q2Both" },
      { value: "not_sure", labelKey: "survey.q2NotSure" },
    ],
  },
  {
    id: "hear_about",
    labelKey: "survey.q3Label",
    options: [
      { value: "social_media", labelKey: "survey.q3SocialMedia" },
      { value: "colleague_friend", labelKey: "survey.q3ColleagueFriend" },
      { value: "search_web", labelKey: "survey.q3SearchWeb" },
      { value: "other", labelKey: "survey.q3Other" },
    ],
  },
];

const Survey = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = QUESTION_KEYS.every((q) => answers[q.id]?.trim());
  const canSubmit = email.trim() && allAnswered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const result = await submitSurvey({ email: email.trim(), answers });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      toast({ title: t("survey.thanksTitle"), description: t("survey.toastSuccess") });
    } else {
      toast({ title: t("common.error"), description: result.error || t("survey.toastError"), variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F6F1EC] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-[#FAF6F3] border border-[#E8DED5]/60 rounded-[22px] shadow-sm">
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F27C5C]/10 flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#3A0B22] mb-3">
              {t("survey.thanksTitle")}
            </h1>
            <p className="text-[#5E555B] mb-8">
              {t("survey.thanksDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <LocalizedLink
                to="/waitlist"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20"
              >
                {t("survey.joinWaitlist")}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </LocalizedLink>
              <LocalizedLink
                to="/"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-[#3A0B22] border border-[#3A0B22]/20 hover:bg-[#3A0B22]/[0.03] transition-all duration-200"
              >
                {t("common.backToHome")}
              </LocalizedLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Header */}
      <header className="py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <LocalizedLink to="/" className="flex items-center gap-1.5">
            <span className="font-display font-bold text-xl text-[#3A0B22] italic tracking-tight">
              Beyond
            </span>
            <span className="font-display font-bold text-xl text-[#F6B4A8] italic tracking-tight">
              Rounds
            </span>
          </LocalizedLink>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          {/* Title section */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F27C5C]/10 border border-[#F27C5C]/20 text-[#F27C5C] text-sm font-semibold mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
              {t("survey.quizLabel")}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] mb-3 tracking-tight">
              {t("survey.title")}
            </h1>
            <p className="text-[#5E555B]">
              {t("survey.subtitle")}
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#FAF6F3] border border-[#E8DED5]/60 rounded-[22px] shadow-sm">
            <div className="p-6 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email */}
                <div>
                  <label htmlFor="survey-email" className="flex items-center gap-2 text-sm font-medium mb-2 text-[#3A0B22]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                    {t("survey.emailLabel")}
                  </label>
                  <input
                    id="survey-email"
                    type="email"
                    placeholder={t("survey.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Questions */}
                {QUESTION_KEYS.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium mb-3 text-[#3A0B22]">
                      {t(q.labelKey)}
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswer(q.id, opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 ${
                            answers[q.id] === opt.value
                              ? "border-[#F27C5C] bg-[#F27C5C]/[0.08] text-[#3A0B22] font-medium"
                              : "border-[#E8E0DA] text-[#5E555B] hover:border-[#D4C9C1] hover:bg-[#3A0B22]/[0.02]"
                          }`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full h-12 rounded-full bg-[#F27C5C] text-white font-semibold hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm shadow-[#F27C5C]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? t("survey.submitting") : t("survey.submit")}
                </button>
              </form>
            </div>
          </div>

          {/* Footer links */}
          <p className="text-center text-sm text-[#5E555B]/60 mt-6">
            <LocalizedLink to="/for-doctors" className="underline hover:text-[#5E555B]">
              {t("survey.whyAskThis")}
            </LocalizedLink>
            {" · "}
            <LocalizedLink to="/waitlist" className="underline hover:text-[#5E555B]">
              {t("survey.skipWaitlist")}
            </LocalizedLink>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Survey;
