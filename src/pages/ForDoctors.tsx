import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Users, Clock, Zap, ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ForDoctors = () => {
  const challenges = [
    {
      icon: Clock,
      title: "No time for yourself",
      description: "Long shifts and on-call duties leave little room for hobbies or social life outside the hospital.",
    },
    {
      icon: Users,
      title: "Isolation despite being surrounded",
      description: "You work with colleagues every day, but real friendships that go beyond cases and protocols are rare.",
    },
    {
      icon: MessageCircle,
      title: "Conversations always circle back to work",
      description: "You crave connections over shared interests, not just specialty talk and research.",
    },
    {
      icon: Heart,
      title: "Missing your tribe",
      description: "You want peers who get the lifestyle, the humor, and the challenges — without it feeling like another round.",
    },
  ];

  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <Header />

      <main className="pt-32">
        {/* Hero */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Sparkles size={14} className="text-primary" />
                For Doctors
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                The Challenges Doctors{" "}
                <span className="text-gradient-gold">Face Every Day</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                BeyondRounds was built because we know what it's like to feel isolated despite being surrounded by brilliant minds. Real friendships beyond the hospital are possible.
              </p>
            </div>
          </div>
        </section>

        {/* Challenges */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground text-center mb-4">
              Sound familiar?
            </h2>
            <p className="text-primary-foreground/60 text-center mb-16 max-w-2xl mx-auto">
              Many physicians share these challenges. You're not alone — and there's a better way to connect.
            </p>
            <div className="max-w-4xl mx-auto space-y-6">
              {challenges.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-6 p-6 lg:p-8 rounded-3xl bg-primary-foreground/5 border border-primary-foreground/10 hover:border-primary/20 transition-colors"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-primary-foreground mb-2">{item.title}</h3>
                    <p className="text-primary-foreground/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution + CTAs */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center p-10 lg:p-14 rounded-3xl bg-primary-foreground/5 border border-primary-foreground/10">
              <Zap className="w-12 h-12 mx-auto mb-6 text-primary" />
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Find your tribe — one match at a time
              </h2>
              <p className="text-primary-foreground/60 mb-10 leading-relaxed">
                BeyondRounds matches you with verified doctors who share your interests and goals. Weekly small groups, real meetups, and friendships that go beyond the ward.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="group h-14 px-8 text-base" asChild>
                  <Link to="/survey">
                    Take the 2-min quiz
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-14 px-8 text-base border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/waitlist">Join the waitlist</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForDoctors;
