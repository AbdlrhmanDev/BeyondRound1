import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, Database } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-foreground">
      <Header />
      
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Shield size={14} className="text-primary" />
                Legal
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Privacy{" "}
                <span className="text-gradient-gold">Policy</span>
              </h1>
              <p className="text-primary-foreground/60">Last Updated: January 2025</p>
            </div>

            {/* Privacy Highlight */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-gradient-gold rounded-3xl p-8 text-primary-foreground text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                <h2 className="font-display text-2xl font-bold mb-3">Your Privacy Matters</h2>
                <p className="opacity-90 leading-relaxed">
                  At BeyondRounds, we're committed to protecting your privacy and handling your data responsibly. This policy explains what information we collect and how we use it.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 lg:p-12 space-y-10">
                
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">Information We Collect</h2>
                  </div>
                  
                  <div className="space-y-6 pl-13">
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">Account Information</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Name and email address
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Medical license information (for verification)
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Profile photo
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Specialty and career stage
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">Preferences & Interests</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Hobbies and interests you share
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Availability preferences
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Location (city level)
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Matching preferences
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-primary-foreground mb-3">Usage Data</h3>
                      <ul className="text-primary-foreground/60 space-y-2 leading-relaxed">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          How you interact with the app
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Group participation and feedback
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                          Device and browser information
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">How We Use Your Information</h2>
                  </div>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Matching:</strong> To connect you with compatible doctors in your area.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Communication:</strong> To send you group notifications and updates.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Improvement:</strong> To enhance our matching algorithm and user experience.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Safety:</strong> To maintain a secure and verified community.</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-primary-foreground">What We Don't Do</h2>
                  </div>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      We never sell your personal information to third parties.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      We don't share your medical license details with other members.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      We don't use your data for targeted advertising.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2.5 flex-shrink-0" />
                      We don't share your exact location with other members.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Data Security</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We use industry-standard encryption and security measures to protect your data. All medical verification documents are securely stored and only accessed by authorized personnel for verification purposes.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Your Rights</h2>
                  <ul className="text-primary-foreground/60 space-y-3 leading-relaxed">
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Access:</strong> Request a copy of your personal data.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Correction:</strong> Update inaccurate information.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Deletion:</strong> Request deletion of your account and data.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                      <span><strong className="text-primary-foreground">Export:</strong> Download your data in a portable format.</span>
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Data Retention</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We retain your information for as long as your account is active. If you delete your account, we'll remove your personal data within 30 days, except where required by law.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Cookies</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We use essential cookies to keep you logged in and remember your preferences. We use analytics cookies to understand how you use our service and improve it.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Updates to This Policy</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    We may update this policy periodically. We'll notify you of significant changes via email or in-app notification.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl font-bold text-primary-foreground mb-4">Contact Us</h2>
                  <p className="text-primary-foreground/60 leading-relaxed">
                    Questions about privacy? Contact our Data Protection Officer at{" "}
                    <a href="mailto:privacy@beyondrounds.com" className="text-primary hover:underline font-medium">
                      privacy@beyondrounds.com
                    </a>
                  </p>
                </section>

              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
