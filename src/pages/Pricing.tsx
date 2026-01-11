import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Trial",
    price: "€9.99",
    period: "first month",
    description: "Try BeyondRounds risk-free",
    features: [
      "Weekly curated group matches",
      "Access to private group chat",
      "RoundsBot icebreaker prompts",
      "Basic compatibility matching",
      "30-day money-back guarantee",
    ],
    popular: false,
    cta: "Start Trial",
  },
  {
    name: "Founders",
    price: "€14.99",
    period: "/month",
    description: "Limited offer — lock in this rate forever",
    features: [
      "Everything in Trial",
      "Priority in matching algorithm",
      "Expanded profile & interests",
      "Exclusive Founders badge",
      "Early access to new features",
    ],
    popular: true,
    cta: "Claim Founders Rate",
  },
  {
    name: "Core",
    price: "€29.99",
    period: "/month",
    description: "The full BeyondRounds experience",
    features: [
      "Everything in Founders",
      "Advanced lifestyle compatibility",
      "AI-powered activity suggestions",
      "Match history & insights",
      "Priority customer support",
    ],
    popular: false,
    cta: "Join Core",
  },
  {
    name: "Premium",
    price: "€49.99",
    period: "/month",
    description: "Maximum control & personalization",
    features: [
      "Everything in Core",
      "Filter by specialty, age & more",
      "Smaller group preference (2-3)",
      "Exclusive member events",
      "Dedicated account manager",
    ],
    popular: false,
    cta: "Go Premium",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-foreground">
      <Header />
      
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-primary/10 blur-[200px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <Zap size={14} className="text-primary" />
                Membership Plans
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Simple,{" "}
                <span className="text-gradient-gold">Transparent Pricing</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                No hidden fees. No long-term contracts. Just meaningful connections backed by our 30-Day Friendship Guarantee.
              </p>
            </div>

            {/* Pricing Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative rounded-3xl p-6 transition-all duration-500",
                    plan.popular
                      ? "bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary/50 shadow-glow scale-[1.02] lg:scale-105 z-10"
                      : "bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 hover:border-primary-foreground/20"
                  )}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow">
                      <Star size={14} fill="currentColor" />
                      Most Popular
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-8 pt-2">
                    <h3 className="font-display text-xl font-bold mb-3 text-primary-foreground">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="number-display text-5xl text-primary-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-primary-foreground/40">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-primary-foreground/50">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          plan.popular ? "bg-primary" : "bg-primary/20"
                        )}>
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="text-sm leading-relaxed text-primary-foreground/60">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to="/auth">
                    <Button
                      className={cn(
                        "w-full font-semibold rounded-2xl h-12",
                        plan.popular 
                          ? "bg-gradient-gold hover:opacity-90 text-primary-foreground shadow-glow" 
                          : "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/10"
                      )}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {/* Guarantee Note */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-full bg-primary-foreground/5 border border-primary-foreground/10">
                <Shield className="w-6 h-6 text-primary" />
                <p className="text-primary-foreground/60">
                  All memberships backed by our{" "}
                  <span className="font-semibold text-primary-foreground">30-Day Friendship Guarantee</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
