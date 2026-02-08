'use client';

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist, getWaitlistCount } from "@/services/waitlistService";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import {
  UserPlus,
  Users,
  Heart,
  CheckCircle2,
  Mail,
  MapPin,
  Stethoscope,
  Shield,
  Zap,
  Target,
  TrendingUp,
  ArrowRight
} from "lucide-react";

const Waitlist = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ locale: string }>();
  const lng = params?.locale === "en" ? "en" : "de";
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(500);
  const [animatedCount, setAnimatedCount] = useState(0);
  const countRef = useRef(waitlistCount);
  const animatedCountRef = useRef(animatedCount);

  // Update refs when state changes
  useEffect(() => {
    countRef.current = waitlistCount;
  }, [waitlistCount]);

  useEffect(() => {
    animatedCountRef.current = animatedCount;
  }, [animatedCount]);

  // Function to animate counter from current value to target
  const animateCounter = (targetCount: number, startCount?: number) => {
    const start = startCount ?? animatedCountRef.current;
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = (targetCount - start) / steps;
    const stepDuration = duration / steps;

    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetCount) || (increment < 0 && current <= targetCount)) {
        setAnimatedCount(targetCount);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  };

  // Function to update waitlist count
  const updateWaitlistCount = async (shouldAnimate = true) => {
    try {
      const count = await getWaitlistCount();
      if (count !== countRef.current) {
        setWaitlistCount(count);
        if (shouldAnimate) {
          animateCounter(count);
        }
      }
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    }
  };

  useEffect(() => {
    // Get waitlist count on mount and animate
    getWaitlistCount().then((count) => {
      setWaitlistCount(count);
      animateCounter(count, 0);
    });

    // Update count every 30 seconds
    const interval = setInterval(() => updateWaitlistCount(true), 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: t("waitlistPage.toastEmailRequired"),
        description: t("waitlistPage.toastEmailDesc"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await joinWaitlist({
        email,
        city: city.trim() || undefined,
        medicalSpecialty: specialty.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setEmail("");
        setCity("");
        setSpecialty("");
        // Update count immediately after successful submission
        updateWaitlistCount();

        // Trigger email notification
        try {
          await fetch('/api/notifications/whitelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
        } catch (emailError) {
          console.error("Failed to send waitlist confirmation email:", emailError);
        }

        toast({
          title: "You're on the list!",
          description: "We'll notify you when we launch.",
        });
      } else {
        toast({
          title: t("waitlistPage.toastErrorTitle"),
          description: result.error || t("waitlistPage.toastErrorDesc"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      toast({
        title: t("waitlistPage.toastErrorTitle"),
        description: t("waitlistPage.toastGenericDesc"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const medicalSpecialties = [
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Family Medicine",
    "Internal Medicine",
    "Neurology",
    "Oncology",
    "Pediatrics",
    "Psychiatry",
    "Surgery",
    "Other",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Header */}
      <header className="relative z-20 sticky top-0">
        <div className="mx-4 mt-4">
          <div className="bg-white/95 border-b border-gray-100 backdrop-blur-sm rounded-2xl shadow-sm">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-center h-16">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-display text-xl font-bold text-gray-900 tracking-tight">
                    BeyondRounds
                  </span>
                </div>

                {!authLoading && user && (
                  <div className="absolute right-4 sm:right-6">
                    <LocalizedLink to="/dashboard">
                      <Button size="sm" className="h-9 px-4 text-xs font-bold">
                        {t("dashboard")}
                      </Button>
                    </LocalizedLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight animate-fade-up">
              {t("waitlistPage.heroTitle")}{" "}
              <span className="text-emerald-600">
                {t("waitlistPage.heroTitleHighlight")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              {t("waitlistPage.heroSubtitle")}
            </p>

            {/* Primary CTA */}
            <div className="mb-6 animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#waitlist-form">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg group"
                >
                  {t("waitlistPage.joinWaitlist")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Button
                variant="outline"
                className="h-14 px-8 text-lg"
                asChild
              >
                <LocalizedLink to="/survey">{t("waitlistPage.takeQuiz")}</LocalizedLink>
              </Button>
            </div>
            <p className="mb-16 text-sm text-gray-500 animate-fade-up delay-300">
              <LocalizedLink to="/for-doctors" className="underline hover:text-gray-700">
                {t("waitlistPage.whyDoctors")}
              </LocalizedLink>
            </p>

            {/* Social Proof with Animated Counter */}
            <div className="animate-fade-up delay-400">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span className="text-2xl font-display font-bold text-gray-900 number-display">
                    {animatedCount.toLocaleString()}+
                  </span>
                </div>
                <span className="text-sm text-gray-600">{t("waitlistPage.doctorsJoined")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 animate-fade-up">
              {t("waitlistPage.whyTitle")} <span className="text-emerald-600">{t("waitlistPage.whyHighlight")}</span>{t("waitlistPage.whySuffix")}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-200">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-gray-900">{t("waitlistPage.verifiedOnly")}</h3>
                <p className="text-sm text-gray-600">
                  {t("waitlistPage.verifiedOnlyDesc")}
                </p>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-300">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-gray-900">{t("waitlistPage.smartMatching")}</h3>
                <p className="text-sm text-gray-600">
                  {t("waitlistPage.smartMatchingDesc")}
                </p>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-400">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-gray-900">{t("waitlistPage.curatedGroups")}</h3>
                <p className="text-sm text-gray-600">
                  {t("waitlistPage.curatedGroupsDesc")}
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Three Steps Section */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-200">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-gray-900">{t("waitlistPage.step1Title")}</h3>
                  <p className="text-gray-600">
                    {t("waitlistPage.step1Desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-300">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-gray-900">{t("waitlistPage.step2Title")}</h3>
                  <p className="text-gray-600">
                    {t("waitlistPage.step2Desc")}
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-400">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-gray-900">{t("waitlistPage.step3Title")}</h3>
                  <p className="text-gray-600">
                    {t("waitlistPage.step3Desc")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Waitlist Form */}
        <section id="waitlist-form" className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border border-gray-200 rounded-3xl shadow-lg animate-fade-up delay-500">
              <CardContent className="p-8 md:p-12">
                {submitted ? (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="h-8 w-8 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3 text-gray-900">{t("waitlistPage.successTitle")}</h2>
                    <p className="text-gray-600 mb-6">
                      {t("waitlistPage.successDesc")}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      {t("waitlistPage.addAnotherEmail")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-3xl font-bold mb-2 text-center text-gray-900">
                      {t("waitlistPage.formTitle")} <span className="text-emerald-600">{t("waitlistPage.formTitleHighlight")}</span>
                    </h2>
                    <p className="text-gray-600 text-center mb-8">
                      {t("waitlistPage.formSubtitle")}
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900">
                          <Mail className="h-4 w-4" />
                          {t("waitlistPage.emailLabel")}
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("waitlistPage.emailPlaceholder")}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900">
                          <MapPin className="h-4 w-4" />
                          {t("waitlistPage.cityLabel")}
                        </label>
                        <Input
                          id="city"
                          type="text"
                          placeholder={t("waitlistPage.cityPlaceholder")}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-12"
                        />
                      </div>

                      {/* Medical Specialty */}
                      <div>
                        <label htmlFor="specialty" className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-900">
                          <Stethoscope className="h-4 w-4" />
                          {t("waitlistPage.specialtyLabel")}
                        </label>
                        <Select value={specialty} onValueChange={setSpecialty}>
                          <SelectTrigger id="specialty" className="h-12">
                            <SelectValue placeholder={t("waitlistPage.specialtyPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            {medicalSpecialties.map((spec) => (
                              <SelectItem key={spec} value={spec}>
                                {t(`waitlistPage.specialties.${spec}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 text-lg"
                      >
                        {loading ? t("waitlistPage.submitting") : t("waitlistPage.submitButton")}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Waitlist;
