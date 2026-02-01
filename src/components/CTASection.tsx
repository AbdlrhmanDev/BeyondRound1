import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Shield, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-28 lg:py-36 bg-foreground dark:bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/20 blur-[200px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/15 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-8">
            <Sparkles size={14} className="text-primary" />
            Join the Community
          </span>
          
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight text-primary-foreground">
            Ready to Find{" "}
            <span className="text-gradient-gold">Your Tribe?</span>
          </h2>
          
          <p className="text-xl text-primary-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of doctors who've discovered meaningful friendships through BeyondRounds. Your next great connection is just one match away.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link to="/auth">
              <Button className="group text-base h-14 px-8">
                Start Your Journey
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-base h-14 px-8 rounded-2xl"
              asChild
            >
              <Link to="/learn-more">Learn More</Link>
            </Button>
          </div>

          {/* Trust Stats */}
          <div className="grid sm:grid-cols-3 gap-8 pt-12 border-t border-primary-foreground/10">
            {[
              { icon: Users, value: "5,000+", label: "Verified Doctors" },
              { icon: Calendar, value: "12,000+", label: "Meetups Organized" },
              { icon: Shield, value: "30", label: "Day Guarantee" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="number-display text-4xl lg:text-5xl text-primary-foreground mb-2">{stat.value}</p>
                <p className="text-sm text-primary-foreground/50 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
