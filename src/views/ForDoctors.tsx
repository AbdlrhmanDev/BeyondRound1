import Image from "next/image";
import { Clock, Users, Heart, Shield, MapPin, Coffee } from "lucide-react";

interface ForDoctorsProps {
  tt: {
    badge: string;
    headline: string;
    subheadline: string;
    challengeTitle: string;
    challengeP1: string;
    challengeP2: string;
    expectTitle: string;
    expect1Title: string; expect1Desc: string;
    expect2Title: string; expect2Desc: string;
    expect3Title: string; expect3Desc: string;
    expect4Title: string; expect4Desc: string;
    expect5Title: string; expect5Desc: string;
    verifyTitle: string;
    step1Title: string; step1Desc: string;
    step2Title: string; step2Desc: string;
    step3Title: string; step3Desc: string;
    step4Title: string; step4Desc: string;
    berlinTitle: string;
    berlinP1: string;
    berlinP2: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    imgAlt1: string;
    imgAlt2: string;
    imgAlt3: string;
    imgAlt4: string;
    imgAlt5: string;
    imgAlt6: string;
  };
}

const ForDoctors = ({ tt }: ForDoctorsProps) => {
  const expectations = [
    { icon: Users,   title: tt.expect1Title, desc: tt.expect1Desc },
    { icon: Clock,   title: tt.expect2Title, desc: tt.expect2Desc },
    { icon: Shield,  title: tt.expect3Title, desc: tt.expect3Desc },
    { icon: Coffee,  title: tt.expect4Title, desc: tt.expect4Desc },
    { icon: Heart,   title: tt.expect5Title, desc: tt.expect5Desc },
  ];

  const steps = [
    { step: "1", title: tt.step1Title, desc: tt.step1Desc },
    { step: "2", title: tt.step2Title, desc: tt.step2Desc },
    { step: "3", title: tt.step3Title, desc: tt.step3Desc },
    { step: "4", title: tt.step4Title, desc: tt.step4Desc },
  ];

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">{tt.badge}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            {tt.headline}
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed mb-12">
            {tt.subheadline}
          </p>

          {/* Hero photo strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto pb-16">
            <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden shadow-lg -rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80&auto=format&fit=crop"
                alt={tt.imgAlt1}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 200px"
                priority
              />
            </div>
            <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300 mt-4">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format&fit=crop"
                alt={tt.imgAlt4}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 200px"
                priority
              />
            </div>
            <div className="relative aspect-[3/4] rounded-[20px] overflow-hidden shadow-lg rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80&auto=format&fit=crop"
                alt={tt.imgAlt3}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 30vw, 200px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* The Challenge */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-4">{tt.challengeTitle}</h2>
          <p className="text-[#5E555B] leading-relaxed mb-4">{tt.challengeP1}</p>
          <p className="text-[#3A0B22] font-semibold text-lg">{tt.challengeP2}</p>
        </div>
      </section>

      {/* What to Expect */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-10">{tt.expectTitle}</h2>
          <div className="space-y-6">
            {expectations.map((item) => (
              <div key={item.title} className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-[#F27C5C]/15 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-[#F27C5C]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How Verification Works */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">{tt.verifyTitle}</h2>
        <div className="space-y-4">
          {steps.map((item) => (
            <div key={item.step} className="flex gap-4 items-start bg-white/60 border border-[#E8DED5] rounded-[18px] p-5">
              <div className="h-8 w-8 rounded-full bg-[#F27C5C] text-white font-bold text-sm flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] mb-0.5">{item.title}</h3>
                <p className="text-sm text-[#5E555B] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New in Berlin */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[#F27C5C]" />
            <h2 className="font-display text-2xl font-bold text-[#3A0B22]">{tt.berlinTitle}</h2>
          </div>
          <p className="text-[#5E555B] leading-relaxed mb-4">{tt.berlinP1}</p>
          <p className="text-[#3A0B22] font-medium">{tt.berlinP2}</p>
        </div>
      </section>

      {/* Photo Grid — 6 images, 2 rows */}
      <section className="container mx-auto px-5 sm:px-8 max-w-4xl pb-16">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* Row 1 */}
          <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1623120893483-0e9d83ebbfe1?w=600&q=80&auto=format&fit=crop"
              alt={tt.imgAlt1}
              fill className="object-cover"
              sizes="(max-width: 768px) 33vw, 290px"
            />
          </div>
          <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1758613171813-56eef6b4fc51?w=600&q=80&auto=format&fit=crop"
              alt={tt.imgAlt2}
              fill className="object-cover"
              sizes="(max-width: 768px) 33vw, 290px"
            />
          </div>
          <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1714038918910-daa51af9fccd?w=600&q=80&auto=format&fit=crop"
              alt={tt.imgAlt3}
              fill className="object-cover"
              sizes="(max-width: 768px) 33vw, 290px"
            />
          </div>

  
        </div>
      </section>


      {/* CTA */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">{tt.ctaTitle}</h2>
          <p className="text-white/60 mb-8">{tt.ctaSubtitle}</p>
          <a
            href="/onboarding"
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-sm"
          >
            {tt.ctaButton}
          </a>
        </div>
      </section>
    </div>
  );
};

export default ForDoctors;
