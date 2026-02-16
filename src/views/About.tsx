'use client';

import Link from "next/link";
import { Shield, Users, Heart, CalendarCheck, MessageCircle, CheckCircle2 } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">About BeyondRounds</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            A calmer way for doctors to make real friends.
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            Medicine is demanding. Friendships shouldn't be. BeyondRounds gives doctors the structure to show up, connect, and build lasting relationships — without the effort of organizing everything yourself.
          </p>
        </div>
      </section>

      {/* Image Grid */}
      <section className="container mx-auto px-5 sm:px-8 max-w-4xl pb-16">
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-[4/3] rounded-[22px] bg-[#E8DED5] flex items-center justify-center text-[#5E555B]/40 text-sm">[Image: caf&eacute; laughter]</div>
          <div className="aspect-[4/3] rounded-[22px] bg-[#E8DED5] flex items-center justify-center text-[#5E555B]/40 text-sm">[Image: casual walk]</div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-4">The mission</h2>
          <p className="text-[#5E555B] leading-relaxed mb-4">
            Doctors are surrounded by people all day — patients, nurses, colleagues — yet many describe a deep sense of social isolation outside the hospital. Long hours, rotating schedules, and frequent relocations make it nearly impossible to maintain friendships the way others do.
          </p>
          <p className="text-[#3A0B22] font-semibold text-lg">
            The problem isn't motivation. The problem is structure.
          </p>
          <p className="text-[#5E555B] leading-relaxed mt-4">
            BeyondRounds provides that structure: small, curated groups of verified doctors who meet weekly in their city. No organizing. No guessing. Just show up.
          </p>
        </div>
      </section>

      {/* Why It Works */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-10">Why it works</h2>
          <div className="space-y-6">
            {[
              { icon: Users, title: "Small groups, not crowds", desc: "3–4 doctors per meetup. Intimate enough for real conversation." },
              { icon: Shield, title: "Verified doctors only", desc: "Every member is verified. You know you're among peers." },
              { icon: CalendarCheck, title: "Weekly rhythm", desc: "Every weekend, a new match. Consistency builds trust." },
              { icon: MessageCircle, title: "Group chat with prompts", desc: "Break the ice before you meet. Arrive already connected." },
              { icon: Heart, title: "Low-pressure, high-warmth", desc: "Not dating. Not networking. Just good company." },
            ].map((item) => (
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
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">The experience</h2>
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <p className="text-[#5E555B] leading-relaxed mb-4">
            On Thursday, you'll receive your match: 3–4 doctors in your city who share your vibe and interests. A private group chat opens with conversation prompts and suggested meetup spots.
          </p>
          <p className="text-[#5E555B] leading-relaxed mb-4">
            On the weekend, you meet. Maybe it's brunch at a neighbourhood spot. Maybe it's a walk along the canal. Maybe it's coffee at a quiet café. The format is simple. The connection is real.
          </p>
          <p className="text-[#3A0B22] font-medium">
            No networking agendas. No forced icebreakers. Just a warm table and good company.
          </p>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">Trust & safety</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: "Verified community", desc: "Every member goes through medical license verification before joining." },
            { title: "Community standards", desc: "Clear guidelines ensure a respectful, inclusive environment." },
            { title: "Privacy-first", desc: "Your data stays private. We never share personal details with third parties." },
            { title: "Safe reporting", desc: "Easy-to-use reporting tools for any concerns, with prompt follow-up." },
          ].map((item) => (
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
          <h2 className="font-display text-3xl font-bold text-white mb-4">Choose a weekend meetup</h2>
          <p className="text-white/60 mb-8">Join a curated group of doctors in Berlin this weekend.</p>
          <Link
            href="/en/auth"
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-sm"
          >
            Join Berlin
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
