import Image from 'next/image';
import { ScrollAnimatedWrapper } from './ScrollAnimatedWrapper';

interface LandingProblemProps {
  t: (key: string) => string;
}

export function LandingProblem({ t }: LandingProblemProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <ScrollAnimatedWrapper
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
              {t('landing.problemTitle')}
            </h2>

            <p className="text-[#5E555B] text-base leading-relaxed mb-6">
              {t('landing.problemDesc')}
            </p>

            <p className="text-[#3A0B22] font-bold text-lg leading-snug mb-8">
              {t('landing.problemBold1')}<br />
              {t('landing.problemBold2')}
            </p>

            {/* CTA — soft, "learn" phase */}
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#3A0B22] border border-[#3A0B22]/20 hover:border-[#3A0B22]/40 hover:bg-[#3A0B22]/[0.03] active:bg-[#3A0B22]/[0.06] transition-all duration-200"
            >
              {t('landing.seeHowItWorks')}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </a>
          </ScrollAnimatedWrapper>

          {/* Right: Photo */}
          <ScrollAnimatedWrapper 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="relative rounded-[24px] overflow-hidden aspect-[4/3] shadow-lg"
          >
            <Image
              src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=700&h=525&fit=crop&q=80"
              alt="Two women chatting over coffee at a warm café"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </ScrollAnimatedWrapper>
        </div>
      </div>
    </section>
  );
}
