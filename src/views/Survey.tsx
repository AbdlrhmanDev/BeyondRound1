'use client';

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitSurvey } from "@/services/surveyService";
import LocalizedLink from "@/components/LocalizedLink";
import { Mail, Sparkles, CheckCircle2, ArrowRight, Heart } from "lucide-react";

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

  const QUESTIONS = QUESTION_KEYS;
  const allAnswered = QUESTIONS.every((q) => answers[q.id]?.trim());
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
      <div className="min-h-screen bg-foreground dark:bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground mb-3">
              {t("survey.thanksTitle")}
            </h1>
            <p className="text-primary-foreground/60 mb-8">
              {t("survey.thanksDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="group" asChild>
                <LocalizedLink to="/waitlist">
                  {t("survey.joinWaitlist")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </LocalizedLink>
              </Button>
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <LocalizedLink to="/">{t("common.backToHome")}</LocalizedLink>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      <header className="relative z-20 py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <LocalizedLink to="/" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <Heart className="h-5 w-5" />
            <span className="font-display font-bold text-lg">{t("common.brand")}</span>
          </LocalizedLink>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-4">
              <Sparkles size={14} className="text-primary" />
              {t("survey.quizLabel")}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-3">
              {t("survey.title")}
            </h1>
            <p className="text-primary-foreground/60">
              {t("survey.subtitle")}
            </p>
          </div>

          <Card className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl shadow-xl">
            <CardContent className="p-6 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="survey-email" className="flex items-center gap-2 text-sm font-medium mb-2 text-primary-foreground">
                    <Mail className="h-4 w-4" />
                    {t("survey.emailLabel")}
                  </label>
                  <Input
                    id="survey-email"
                    type="email"
                    placeholder={t("survey.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background/50 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {QUESTIONS.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium mb-3 text-primary-foreground">
                      {t(q.labelKey)}
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswer(q.id, opt.value)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                            answers[q.id] === opt.value
                              ? "border-primary bg-primary/20 text-primary-foreground"
                              : "border-primary-foreground/20 text-primary-foreground/80 hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
                          }`}
                        >
                          {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? t("survey.submitting") : t("survey.submit")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-primary-foreground/50 mt-6">
            <LocalizedLink to="/for-doctors" className="underline hover:text-primary-foreground/70">
              {t("survey.whyAskThis")}
            </LocalizedLink>
            {" · "}
            <LocalizedLink to="/waitlist" className="underline hover:text-primary-foreground/70">
              {t("survey.skipWaitlist")}
            </LocalizedLink>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Survey;
