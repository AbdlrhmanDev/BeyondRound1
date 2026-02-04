/**
 * Server-rendered About section. Uses dictionary for EN/DE.
 */
import { Quote, Heart } from "lucide-react";
import { getT } from "@/lib/i18n/t";

interface AboutSectionServerProps {
  dict: Record<string, unknown>;
}

export function AboutSectionServer({ dict }: AboutSectionServerProps) {
  const t = getT(dict);

  return (
    <section id="about" className="content-visibility-auto py-28 lg:py-36 bg-foreground dark:bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <Heart size={14} className="text-primary" />
              {t("about.ourStory")}
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight">
              {t("about.bornFrom")}
              <span className="text-gradient-gold">{t("about.lateNightShift")}</span>
            </h2>
          </div>

          {/* Quote Block */}
          <div className="relative max-sm:bg-white/10 sm:bg-primary-foreground/5 sm:backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 sm:p-10 lg:p-14">
            <Quote className="absolute top-6 sm:top-8 left-6 sm:left-8 w-12 h-12 sm:w-16 sm:h-16 text-primary/20" />

            <div className="relative z-10 space-y-5 sm:space-y-6 text-base sm:text-lg text-primary-foreground/60 leading-relaxed">
              <p>{t("about.storyP1")}</p>

              <p>
                {t("about.storyP2")}{" "}
                <span className="font-semibold text-primary-foreground">{t("about.storyP2Bold")}</span>
              </p>

              <p>{t("about.storyP3")}</p>

              <p>
                {t("about.storyP4")}{" "}
                <span className="font-semibold text-primary-foreground">{t("about.storyP4Bold")}</span>
              </p>

              <p className="text-primary-foreground font-medium text-lg sm:text-xl">
                {t("about.storyP5")}
              </p>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="mt-12 sm:mt-16 text-center px-2">
            <p className="text-xl sm:text-2xl lg:text-3xl font-display text-primary-foreground leading-relaxed">
              {t("about.missionPrefix")}
              <span className="text-gradient-gold font-bold">{t("about.missionHighlight")}</span>
              {t("about.missionSuffix")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
