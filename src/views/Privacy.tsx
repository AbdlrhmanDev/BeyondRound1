'use client';

import { Shield, Lock, Eye, Database } from "lucide-react";
import { EMAILS } from "@/constants/emails";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">Legal</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#5E555B]">Last updated: February 2026</p>
        </div>
      </section>

      {/* Highlight */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-8">
        <div className="bg-[#3A0B22] rounded-[24px] p-8 text-white text-center">
          <Lock className="w-10 h-10 mx-auto mb-4 text-[#F27C5C]" />
          <h2 className="font-display text-xl font-bold mb-3">Your privacy matters</h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-lg mx-auto">
            We collect only what's necessary to match you with the right group. Your medical credentials are verified and stored securely. We never sell your data to third parties.
          </p>
        </div>
      </section>

      {/* Full Policy */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] space-y-10">

          {/* What we collect */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Database className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">1. What we collect</h2>
            </div>
            <div className="space-y-5 pl-12">
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">Account information</h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {["Name, email address, and date of birth", "Medical license number and issuing authority", "Profile photo (optional)", "City and preferred language"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">Preferences & matching</h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {["Interests, personality traits, and social preferences", "Weekend availability and preferred meetup style", "Feedback and ratings from past meetups", "Communication preferences"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-[#3A0B22] text-sm mb-2">Usage data</h3>
                <ul className="text-[#5E555B] text-sm space-y-1.5 leading-relaxed">
                  {["Device type, browser, and operating system", "Pages visited and features used", "Crash reports and performance data"].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* How we use it */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">2. How we use your data</h2>
            </div>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["To verify your medical credentials and maintain community trust", "To match you with compatible groups of doctors in your city", "To communicate meetup details, updates, and important notifications", "To improve our matching algorithm and overall service quality"].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* How we protect it */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#F27C5C]/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-[#F27C5C]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#3A0B22]">3. How we protect your data</h2>
            </div>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["All data is transmitted over encrypted connections (TLS/SSL)", "Medical credentials are stored in encrypted, access-controlled databases", "We conduct regular security audits and vulnerability assessments", "Access to personal data is limited to authorized team members only"].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* Data sharing */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">4. Data sharing</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              We do not sell, rent, or trade your personal information. We may share limited data with trusted service providers (e.g., payment processors, email services) solely for operating the platform. All third-party providers are GDPR-compliant.
            </p>
          </div>

          {/* Your rights */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">5. Your rights (GDPR)</h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["Right to access: Request a copy of your personal data", "Right to rectification: Correct inaccurate or incomplete data", "Right to erasure: Request deletion of your personal data", "Right to data portability: Receive your data in a structured format"].map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-[#F27C5C] mt-2 shrink-0" />{item}</li>
              ))}
            </ul>
          </div>

          {/* Cookies */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">6. Cookies</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              We use essential cookies for authentication and session management. Optional analytics cookies help us understand usage patterns. You can manage cookie preferences through your browser settings.
            </p>
          </div>

          {/* Data retention */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">7. Data retention</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Some data may be retained longer for legal or regulatory compliance.
            </p>
          </div>

          {/* Children */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">8. Children's privacy</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              BeyondRounds is intended for licensed medical professionals aged 18 and older. We do not knowingly collect personal information from individuals under 18.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">9. Contact</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              For privacy-related questions or to exercise your rights, contact us at{" "}
              <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">{EMAILS.contact}</a>
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Privacy;
