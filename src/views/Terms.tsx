'use client';

import Link from "next/link";
import { EMAILS } from "@/constants/emails";

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#F6F1EC]">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3A0B22]/5 to-transparent" />
        <div className="container mx-auto px-5 sm:px-8 max-w-3xl relative z-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#F27C5C] mb-4">Legal</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-4">
            Terms & Conditions
          </h1>
          <p className="text-sm text-[#5E555B]">Last updated: February 2026</p>
        </div>
      </section>

      {/* Plain-language Summary */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-8">
        <div className="bg-[#3A0B22] rounded-[24px] p-8 text-white">
          <h2 className="font-display text-xl font-bold mb-3">The short version</h2>
          <ul className="space-y-2 text-white/80 text-sm leading-relaxed">
            <li>BeyondRounds is a community for verified doctors to meet in small groups.</li>
            <li>Be respectful, show up when you commit, and treat others as peers.</li>
            <li>We protect your data and expect you to respect others' privacy.</li>
            <li>You can cancel anytime. Free cancellation until Wednesday 9 pm.</li>
          </ul>
        </div>
      </section>

      {/* Full Terms */}
      <section className="container mx-auto px-5 sm:px-8 max-w-3xl pb-20">
        <div className="bg-white/60 border border-[#E8DED5] rounded-[24px] p-8 sm:p-12 shadow-[0_2px_8px_rgba(58,11,34,0.04)] space-y-10">

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              By accessing or using BeyondRounds, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our service. We may update these terms from time to time and will notify you of material changes.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">2. Eligibility</h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["You must be a licensed medical doctor.", "You must be at least 18 years of age.", "You must provide accurate information during registration.", "Your medical license must be verifiable through official registries."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">3. Your Account</h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["You are responsible for maintaining the confidentiality of your account.", "You agree to provide accurate, current, and complete information.", "You must notify us immediately of any unauthorized use of your account."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">4. Community Standards</h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["Treat all members with respect and professionalism.", "Do not share other members' personal information without consent.", "Attend meetups you've committed to or cancel before the deadline.", "Report any inappropriate behaviour through our in-app tools."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">5. Meetup Reservations</h2>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["Reservations are confirmed upon selection of a weekend day.", "Free cancellation is available until Wednesday at 9:00 pm CET.", "Late cancellations and no-shows may result in charges.", "We reserve the right to limit bookings for members with repeated no-shows."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F27C5C] mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">6. Prohibited Conduct</h2>
            <p className="text-[#5E555B] text-sm mb-2">You agree not to:</p>
            <ul className="text-[#5E555B] text-sm space-y-2 leading-relaxed">
              {["Use the service for any unlawful purpose.", "Harass, abuse, or harm other members.", "Misrepresent your identity or professional credentials.", "Use the platform for commercial solicitation or networking.", "Attempt to circumvent our verification process."].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">7. Intellectual Property</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              All content, features, and functionality of BeyondRounds are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our explicit permission.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">8. Privacy</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              Your privacy is important to us. Please review our{" "}
              <Link href="/en/privacy" className="text-[#F27C5C] hover:underline font-medium">Privacy Policy</Link>{" "}
              to understand how we collect, use, and protect your personal information.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">9. Limitation of Liability</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              BeyondRounds facilitates social connections but is not responsible for the conduct of individual members. We are not liable for any damages arising from your use of the service or interactions with other members. Use the service at your own discretion.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">10. Termination</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              We may suspend or terminate your account at our discretion if you violate these terms or our community standards. You may also delete your account at any time through your profile settings.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">11. Governing Law</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              These terms are governed by the laws of the Federal Republic of Germany. Any disputes shall be subject to the exclusive jurisdiction of the courts in Berlin, Germany.
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#3A0B22] mb-3">12. Contact</h2>
            <p className="text-[#5E555B] text-sm leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href={`mailto:${EMAILS.contact}`} className="text-[#F27C5C] hover:underline font-medium">{EMAILS.contact}</a>
            </p>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Terms;
