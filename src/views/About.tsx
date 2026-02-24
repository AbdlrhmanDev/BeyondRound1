import Image from "next/image";
import { Shield, Users, Heart, CalendarCheck, MessageCircle } from "lucide-react";

interface AboutProps {
  tt: {
    badge: string;
    headline: string;
    subheadline: string;
    missionTitle: string;
    missionP1: string;
    missionBold: string;
    missionP2: string;
    whyTitle: string;
    why1Title: string; why1Desc: string;
    why2Title: string; why2Desc: string;
    why3Title: string; why3Desc: string;
    why4Title: string; why4Desc: string;
    why5Title: string; why5Desc: string;
    expTitle: string;
    expP1: string;
    expP2: string;
    expP3: string;
    trustTitle: string;
    trust1Title: string; trust1Desc: string;
    trust2Title: string; trust2Desc: string;
    trust3Title: string; trust3Desc: string;
    trust4Title: string; trust4Desc: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    imgAlt1: string;
    imgAlt2: string;
    imgAlt3: string;
    imgAlt4: string;
  };
}

const About = ({ tt }: AboutProps) => {
  const whyItems = [
    { icon: Users,        title: tt.why1Title, desc: tt.why1Desc },
    { icon: Shield,       title: tt.why2Title, desc: tt.why2Desc },
    { icon: CalendarCheck,title: tt.why3Title, desc: tt.why3Desc },
    { icon: MessageCircle,title: tt.why4Title, desc: tt.why4Desc },
    { icon: Heart,        title: tt.why5Title, desc: tt.why5Desc },
  ];

  const trustItems = [
    { title: tt.trust1Title, desc: tt.trust1Desc },
    { title: tt.trust2Title, desc: tt.trust2Desc },
    { title: tt.trust3Title, desc: tt.trust3Desc },
    { title: tt.trust4Title, desc: tt.trust4Desc },
  ];

  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative min-h-[480px] sm:min-h-[580px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1764079648275-a37d1f5104ae?w=1400&q=85&auto=format&fit=crop"
            alt={tt.imgAlt1}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A0A12]/70 via-[#3A0B22]/60 to-[#1A0A12]/85" />
        </div>
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center pt-32 pb-20">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F6B4A8] mb-4">{tt.badge}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.15] mb-6">
            {tt.headline}
          </h1>
          <p className="text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            {tt.subheadline}
          </p>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="container mx-auto px-5 sm:px-8 max-w-4xl pb-16">
        <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[240px] sm:h-[420px]">
          <div className="col-span-2 row-span-2 relative rounded-[18px] sm:rounded-[24px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1731475761027-0b6b33b74547?w=900&q=85&auto=format&fit=crop"
              alt={tt.imgAlt2}
              fill className="object-cover"
              sizes="(max-width: 640px) 66vw, (max-width: 1024px) 580px, 600px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A12]/20 to-transparent" />
          </div>
          <div className="relative rounded-[18px] sm:rounded-[22px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1764079648275-a37d1f5104ae?w=500&q=80&auto=format&fit=crop"
              alt={tt.imgAlt3}
              fill className="object-cover"
              sizes="(max-width: 640px) 33vw, 290px"
            />
          </div>
          <div className="relative rounded-[18px] sm:rounded-[22px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1758525225816-8dd1901ef6ec?w=500&q=80&auto=format&fit=crop"
              alt={tt.imgAlt4}
              fill className="object-cover"
              sizes="(max-width: 640px) 33vw, 290px"
            />
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-4">{tt.missionTitle}</h2>
          <p className="text-[#5E555B] leading-relaxed mb-4">{tt.missionP1}</p>
          <p className="text-[#3A0B22] font-semibold text-lg">{tt.missionBold}</p>
          <p className="text-[#5E555B] leading-relaxed mt-4">{tt.missionP2}</p>
        </div>
      </section>

      {/* Why It Works */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-10">{tt.whyTitle}</h2>
          <div className="space-y-6">
            {whyItems.map((item) => (
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

      {/* The Experience */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">{tt.expTitle}</h2>
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <p className="text-[#5E555B] leading-relaxed mb-4">{tt.expP1}</p>
          <p className="text-[#5E555B] leading-relaxed mb-4">{tt.expP2}</p>
          <p className="text-[#3A0B22] font-medium">{tt.expP3}</p>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">{tt.trustTitle}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {trustItems.map((item) => (
            <div key={item.title} className="bg-white/60 border border-[#E8DED5] rounded-[20px] p-6">
              <h3 className="font-semibold text-[#3A0B22] mb-2">{item.title}</h3>
              <p className="text-sm text-[#5E555B] leading-relaxed">{item.desc}</p>
            </div>
          ))}
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

export default About;
