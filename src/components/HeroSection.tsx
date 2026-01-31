import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Calendar, Verified, Play, Check } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-doctors-friendship.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 overflow-hidden bg-foreground">
      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px] animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground text-sm font-semibold mb-8 animate-fade-up backdrop-blur-sm">
              <div className="w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center">
                <Verified size={12} className="text-primary-foreground" />
              </div>
              <span>Exclusively for Verified Doctors</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1" />
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-primary-foreground leading-[1.05] tracking-tight mb-8 animate-fade-up delay-100">
              Your Next Great
              <br />
              <span className="text-gradient-gold">Friendship Awaits</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-primary-foreground/60 max-w-2xl mx-auto lg:mx-0 mb-12 animate-fade-up delay-200 leading-relaxed">
              Life in medicine can be isolating. BeyondRounds matches you with fellow doctors who share your interests, lifestyle, and values —{" "}
              <span className="text-primary-foreground font-medium">because the best friendships start with common ground.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16 animate-fade-up delay-300">
              <Link to="/onboarding">
                <Button className="group text-base h-14 px-8">
                  Start Your Journey
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="text-base h-14 px-8 group border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-2xl">
                <Play size={18} className="mr-2 group-hover:scale-110 transition-transform" fill="currentColor" />
                Watch How It Works
              </Button>
            </div>

            {/* Features list */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start animate-fade-up delay-400">
              {[
                { icon: Shield, label: "Verified Doctors Only" },
                { icon: Calendar, label: "Curated Weekly Matches" },
                { icon: Check, label: "30-Day Guarantee" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-primary-foreground/60">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <item.icon size={14} className="text-primary" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Visual */}
          <div className="lg:col-span-5 relative animate-fade-up delay-200">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2.5rem] blur-xl opacity-60" />
              
              {/* Image container */}
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-primary-foreground/10">
                <img
                  src={heroImage}
                  alt="Doctors enjoying genuine friendship at a coffee meetup"
                  className="w-full h-auto object-cover aspect-[4/5]"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  width="500"
                  height="625"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/20 to-transparent" />
                
                {/* Bottom content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-primary-foreground font-display font-bold text-lg">Next match in</p>
                        <p className="text-primary-foreground/60 text-sm">Thursday, 4:00 PM</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                        Live
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card - Guarantee */}
              <div className="absolute -bottom-6 -left-8 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 p-4 rounded-2xl shadow-xl animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <p className="font-display font-bold text-primary-foreground">30-Day Guarantee</p>
                    <p className="text-sm text-primary-foreground/60">2+ meaningful meetups</p>
                  </div>
                </div>
              </div>

              {/* Floating Card - Online Status */}
              <div className="absolute -top-4 -right-4 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/10 px-4 py-3 rounded-2xl shadow-lg animate-float delay-200">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                  </div>
                  <span className="text-sm font-semibold text-primary-foreground">5,000+ doctors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="flex flex-col items-center gap-3 text-primary-foreground/40">
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/20 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
