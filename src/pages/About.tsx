import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Sparkles, Quote, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-foreground">
      <Header />
      
      <main className="pt-32">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Heart size={14} className="text-primary" />
                Our Story
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Born from a{" "}
                <span className="text-gradient-gold">Late-Night Shift</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                Building meaningful connections beyond the hospital walls.
              </p>
            </div>

            {/* Story Block */}
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-10 lg:p-14">
                <Quote className="absolute top-8 left-8 w-16 h-16 text-primary/20" />
                
                <div className="relative z-10 space-y-6 text-lg text-primary-foreground/60 leading-relaxed">
                  <p>
                    The idea for BeyondRounds was born during one of those late-night hospital shifts that every doctor knows all too well. After years of moving between hospitals and diving deep into the demanding world of medicine, I found myself surrounded by colleagues — yet genuinely lonely.
                  </p>
                  
                  <p>
                    I've always been social. But something was missing. Conversations always circled back to cases, protocols, and research. Professionally enriching, sure — but I craved something deeper:{" "}
                    <span className="font-semibold text-primary-foreground">real friendships that went beyond the hospital walls.</span>
                  </p>

                  <p>
                    Everything changed when a mutual friend introduced me to four other doctors. We discovered we shared a passion for hiking, similar music tastes, and a quirky sense of humor that only made sense to fellow physicians.
                  </p>

                  <p>
                    That's when it hit me:{" "}
                    <span className="font-semibold text-primary-foreground">if I felt this isolated despite working alongside brilliant medical minds, how many other doctors were experiencing the same thing?</span>
                  </p>

                  <p className="text-primary-foreground font-medium text-xl">
                    BeyondRounds was born from this realization — because when you find your tribe, everything else falls into place.
                  </p>
                </div>

                {/* Founder Signature */}
                <div className="mt-10 pt-10 border-t border-primary-foreground/10 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-2xl shadow-glow-sm">
                    DR
                  </div>
                  <div>
                    <p className="font-display font-bold text-primary-foreground text-lg">Dr. Founder</p>
                    <p className="text-primary-foreground/50">Founder, BeyondRounds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="p-10 lg:p-14 rounded-3xl bg-gradient-gold text-primary-foreground text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-display text-3xl lg:text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">
                  To help doctors discover friendships that enrich their lives outside the hospital. Because when you find your people — your tribe — everything else falls into place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
                What We <span className="text-gradient-gold">Stand For</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Users,
                  title: "Verified Community",
                  description: "Only verified medical professionals, creating a trusted space for genuine connections."
                },
                {
                  icon: Heart,
                  title: "Beyond Medicine",
                  description: "Connect over shared hobbies and interests, not just your specialty."
                },
                {
                  icon: Shield,
                  title: "Safe & Private",
                  description: "Your privacy matters. We protect your data and respect your boundaries."
                }
              ].map((value, index) => (
                <div key={index} className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 text-center hover:border-primary/30 transition-all duration-300">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                    <value.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary-foreground mb-3">{value.title}</h3>
                  <p className="text-primary-foreground/60 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-primary-foreground/60 mb-8 max-w-2xl mx-auto">
              Join thousands of doctors who've already found their tribe. Your next great friendship is just one match away.
            </p>
            <Link to="/auth">
              <Button className="group text-base h-14 px-8">
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
