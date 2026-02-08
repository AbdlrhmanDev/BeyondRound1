/**
 * Server-rendered How It Works section. No i18next.
 */
import { UserCheck, Sparkles, Coffee, ArrowRight } from 'lucide-react';
import { getT } from '@/lib/i18n/t';

const steps = [
  { icon: UserCheck, number: '01', titleKey: 'home.step1Title', descKey: 'home.step1Desc' },
  { icon: Sparkles, number: '02', titleKey: 'home.step2Title', descKey: 'home.step2Desc' },
  { icon: Coffee, number: '03', titleKey: 'home.step3Title', descKey: 'home.step3Desc' },
];

interface HowItWorksSectionServerProps {
  dict: Record<string, unknown>;
}

export function HowItWorksSectionServer({ dict }: HowItWorksSectionServerProps) {
  const t = getT(dict);

  return (
    <section id="how-it-works" className="content-visibility-auto py-28 lg:py-36 bg-foreground dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
            <Sparkles size={14} className="text-primary" />
            {t('home.howBadge')}
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
            {t('home.howTitlePrefix')}{' '}
            <span className="text-gradient-gold">{t('home.howTitleHighlight')}</span>
            {t('home.howTitleSuffix') ? ` ${t('home.howTitleSuffix')}` : ''}
          </h2>
          <p className="text-xl text-primary-foreground/60">{t('home.howSubtitle')}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary-foreground/20" />
                </div>
              )}

              <div className="bg-primary-foreground/[0.07] border border-primary-foreground/10 rounded-3xl p-8 h-full hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/40 text-xs font-bold mb-6">
                  {t('home.stepLabel')} {step.number}
                </div>

                <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-glow-sm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-4">
                  {t(step.titleKey)}
                </h3>
                <p className="text-primary-foreground/60 leading-relaxed text-lg">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
