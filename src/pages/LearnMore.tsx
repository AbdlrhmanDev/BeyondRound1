import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MapPin, Sparkles, ArrowRight, Shield, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocalizedLink from "@/components/LocalizedLink";

const LearnMore = () => {
  const { t } = useTranslation();
  const steps = [
    { step: "1", icon: Users, titleKey: "learnMore.step1Title", descKey: "learnMore.step1Desc" },
    { step: "2", icon: Calendar, titleKey: "learnMore.step2Title", descKey: "learnMore.step2Desc" },
    { step: "3", icon: MapPin, titleKey: "learnMore.step3Title", descKey: "learnMore.step3Desc" },
  ];
  const values = [
    { icon: Shield, titleKey: "learnMore.verifiedCommunity", descKey: "learnMore.verifiedCommunityDesc" },
    { icon: Heart, titleKey: "learnMore.realConnections", descKey: "learnMore.realConnectionsDesc" },
    { icon: Sparkles, titleKey: "learnMore.curatedMatches", descKey: "learnMore.curatedMatchesDesc" },
  ];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <Header />

      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Sparkles size={14} className="text-primary" />
                {t("learnMore.howItWorks")}
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                {t("learnMore.findYourTribe")}{" "}
                <span className="text-gradient-gold">{t("learnMore.oneMatchAtATime")}</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                {t("learnMore.subtitle")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground text-center mb-16">
              {t("learnMore.howBeyondRoundsWorks")}
            </h2>
            <div className="max-w-4xl mx-auto space-y-12">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-6 p-6 lg:p-8 rounded-3xl bg-primary-foreground/5 border border-primary-foreground/10 hover:border-primary/20 transition-colors">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-glow-sm">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                      <h3 className="font-display text-xl font-bold text-primary-foreground">{t(item.titleKey)}</h3>
                    </div>
                    <p className="text-primary-foreground/60 leading-relaxed">{t(item.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {values.map((item, index) => (
                <div key={index} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl p-8 text-center hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-primary-foreground mb-2">{t(item.titleKey)}</h3>
                  <p className="text-sm text-primary-foreground/60">{t(item.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-primary-foreground/60 mb-8 max-w-2xl mx-auto">
              {t("learnMore.ctaText")}
            </p>
            <LocalizedLink to="/auth">
              <Button className="group text-base h-14 px-8">
                {t("common.getStarted")}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </LocalizedLink>
            <p className="mt-4 text-sm text-primary-foreground/40">
              <LocalizedLink to="/faq" className="underline hover:text-primary-foreground/60">{t("common.faq")}</LocalizedLink>
              {" · "}
              <LocalizedLink to="/about" className="underline hover:text-primary-foreground/60">{t("learnMore.aboutUs")}</LocalizedLink>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LearnMore;
