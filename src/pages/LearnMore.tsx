import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Users, Calendar, MapPin, Sparkles, ArrowRight, Shield, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const LearnMore = () => {
  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <Header />

      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Sparkles size={14} className="text-primary" />
                How It Works
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Find Your Tribe —{" "}
                <span className="text-gradient-gold">One Match at a Time</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                BeyondRounds connects verified doctors with like-minded peers for real friendships beyond the hospital.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground text-center mb-16">
              How <span className="text-gradient-gold">BeyondRounds</span> Works
            </h2>
            <div className="max-w-4xl mx-auto space-y-12">
              {[
                { step: "1", icon: Users, title: "Complete Your Profile", description: "Share your specialty, interests, and what kind of connections you're looking for. We use this to match you with doctors who have similar vibes and goals." },
                { step: "2", icon: Calendar, title: "Get Matched Weekly", description: "Every week we form small groups based on compatibility. You'll be introduced to a handful of peers — no overwhelming feeds, just curated matches." },
                { step: "3", icon: MapPin, title: "Meet Up in Real Life", description: "Chat in the app, then take it offline. We help you coordinate meetups and suggest places. Real friendships happen when you meet in person." },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 p-6 lg:p-8 rounded-3xl bg-primary-foreground/5 border border-primary-foreground/10 hover:border-primary/20 transition-colors">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-glow-sm">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <item.icon className="w-6 h-6 text-primary" />
                      <h3 className="font-display text-xl font-bold text-primary-foreground">{item.title}</h3>
                    </div>
                    <p className="text-primary-foreground/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Shield, title: "Verified Community", desc: "Only verified medical professionals in a trusted space." },
                { icon: Heart, title: "Real Connections", desc: "Designed for friendships beyond work — hobbies, life, and support." },
                { icon: Sparkles, title: "Curated Matches", desc: "Weekly small groups, not endless scrolling. Quality over quantity." },
              ].map((item, index) => (
                <div key={index} className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl p-8 text-center hover:border-primary/30 transition-all">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-primary-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-primary-foreground/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xl text-primary-foreground/60 mb-8 max-w-2xl mx-auto">
              Join thousands of doctors who've found their tribe. Your next great friendship is one match away.
            </p>
            <Link to="/auth">
              <Button className="group text-base h-14 px-8">
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/40">
              <Link to="/faq" className="underline hover:text-primary-foreground/60">FAQ</Link>
              {" · "}
              <Link to="/about" className="underline hover:text-primary-foreground/60">About Us</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LearnMore;
