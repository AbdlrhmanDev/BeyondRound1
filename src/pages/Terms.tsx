'use client';

import Header from "@/components/Header";
import { EMAILS } from "@/constants/emails";
import LocalizedLink from "@/components/LocalizedLink";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <Header />
      
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <FileText size={14} className="text-primary" />
                Legal
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Terms &{" "}
                <span className="text-gradient-gold">Conditions</span>
              </h1>
              <p className="text-primary-foreground/60">Last Updated: January 2025</p>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 lg:p-12 space-y-10">
                
                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">1. Acceptance of Terms</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    By using BeyondRounds ("the Service"), you agree to these Terms & Conditions. If you don't agree, please don't use our service.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">2. Eligibility</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You must be a licensed medical doctor, medical student, resident, or fellow.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You must be at least 18 years old.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You must provide accurate verification information.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You agree to maintain professional conduct at all times.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">3. Account & Verification</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You must verify your medical credentials through license upload.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      False information or impersonation results in immediate termination.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      You're responsible for maintaining account security.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">4. Subscription & Billing</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      All subscriptions are recurring until cancelled.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Prices may change with 30 days notice.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Refunds only available under our 30-Day Friendship Guarantee.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      No partial month refunds after the guarantee period.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">5. Code of Conduct</h2>
                  <p className="text-primary-foreground/60 mb-3">Members must:</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Treat all members with respect and professionalism.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Attend scheduled meetups or provide reasonable notice.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Maintain confidentiality about other members' personal information.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Report inappropriate behavior immediately.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">6. Prohibited Behavior</h2>
                  <p className="text-primary-foreground/60 mb-3">The following will result in immediate termination:</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      Harassment, discrimination, or hate speech.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      Solicitation for professional services or business.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      Sharing personal information without consent.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      Using the platform for dating or romantic purposes.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2.5 flex-shrink-0" />
                      Spam or commercial promotion.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">7. Intellectual Property</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    All content, features, and functionality are owned by BeyondRounds and protected by international copyright and trademark laws.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">8. Privacy & Data</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    Your privacy is important to us. Please review our{" "}
                    <LocalizedLink to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</LocalizedLink>{" "}
                    for details on how we collect, use, and protect your information.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">9. Limitation of Liability</h2>
                  <p className="text-primary-foreground/60 mb-3">BeyondRounds is not responsible for:</p>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Actions of other members during meetups.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Personal safety during offline meetings.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Disputes between members.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      Loss or damage resulting from service use.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">10. Termination</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We may terminate accounts for violation of these terms. Upon termination, your right to use the service ceases immediately.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">11. Changes to Terms</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We may update these terms occasionally. Continued use after changes constitutes acceptance of new terms.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">12. Contact</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    Questions about these terms? Contact us at{" "}
                    <a href={`mailto:${EMAILS.contact}`} className="text-primary hover:underline font-medium">
                      {EMAILS.contact}
                    </a>
                  </p>
                </section>

              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Terms;
