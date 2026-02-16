'use client';

import Link from "next/link";
import { Clock, Users, Heart, Shield, CheckCircle2, MapPin, Coffee } from "lucide-react";

const ForDoctors = () => {
  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">For Doctors</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
            Built by doctors, for doctors.
          </h1>
          <p className="text-lg text-[#5E555B] max-w-xl mx-auto leading-relaxed">
            We understand the challenges of building friendships around demanding schedules. That's why we created something different.
          </p>
        </div>
      </section>

      {/* The Challenge */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)]">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-4">We know the feeling</h2>
          <p className="text-[#5E555B] leading-relaxed mb-4">
            You spend your days surrounded by people — patients, colleagues, nurses — yet somehow feel deeply isolated outside the hospital. Long shifts, rotating schedules, and frequent relocations make it nearly impossible to maintain friendships the way others do.
          </p>
          <p className="text-[#3A0B22] font-semibold text-lg">
            It's not that you don't want connection. It's that the system doesn't support it.
          </p>
        </div>
      </section>

      {/* What to Expect */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-10">What to expect</h2>
          <div className="space-y-6">
            {[
              { icon: Users, title: "Small groups of 3–4", desc: "Intimate enough for real conversation. No awkward networking events." },
              { icon: Clock, title: "One meetup per week", desc: "Choose Friday, Saturday, or Sunday. Fits around even the busiest call schedules." },
              { icon: Shield, title: "Verified peers only", desc: "Every member's medical license is verified. You know you're among fellow physicians." },
              { icon: Coffee, title: "Relaxed venues", desc: "Coffee shops, brunch spots, canal-side walks. We suggest; your group decides." },
              { icon: Heart, title: "Zero pressure", desc: "Not dating. Not networking. Just a warm table and good company." },
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

      {/* How Verification Works */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl py-20">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#3A0B22] mb-6">How verification works</h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Create your account", desc: "Sign up with your email and complete your profile." },
            { step: "2", title: "Submit your license", desc: "Upload or enter your medical license number for verification." },
            { step: "3", title: "We verify (24–48 hrs)", desc: "Our team checks your credentials against official registries." },
            { step: "4", title: "You're in", desc: "Choose a weekend day and get matched with your first group." },
          ].map((item) => (
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
            <h2 className="font-display text-2xl font-bold text-[#3A0B22]">New in Berlin?</h2>
          </div>
          <p className="text-[#5E555B] leading-relaxed mb-4">
            Whether you've just moved for a residency, a fellowship, or a fresh start — making friends in a new city is hard. BeyondRounds was designed for exactly this: meeting fellow doctors who understand your lifestyle, in a city that's still new to you.
          </p>
          <p className="text-[#3A0B22] font-medium">
            You don't need to know anyone. Just show up.
          </p>
        </div>
      </section>

      {/* Image Grid */}
      <section className="container mx-auto px-5 sm:px-8 max-w-4xl pb-16">
        <div className="grid grid-cols-3 gap-4">
          <div className="aspect-[4/3] rounded-[18px] bg-[#E8DED5] flex items-center justify-center text-[#5E555B]/40 text-xs">[Image: coffee meetup]</div>
          <div className="aspect-[4/3] rounded-[18px] bg-[#E8DED5] flex items-center justify-center text-[#5E555B]/40 text-xs">[Image: canal walk]</div>
          <div className="aspect-[4/3] rounded-[18px] bg-[#E8DED5] flex items-center justify-center text-[#5E555B]/40 text-xs">[Image: brunch table]</div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#3A0B22] py-20">
        <div className="container mx-auto px-5 sm:px-8 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Ready to meet your group?</h2>
          <p className="text-white/60 mb-8">Join a curated group of doctors in Berlin this weekend.</p>
          <Link
            href="/en/auth"
            className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#F27C5C] hover:bg-[#e06d4d] text-white font-display font-semibold text-base transition-all active:scale-[0.98] shadow-sm"
          >
            Get started
          </Link>
        </div>
      </section>
    </div>
  );
};

export default ForDoctors;
