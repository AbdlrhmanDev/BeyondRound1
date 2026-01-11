import { UserCheck, Sparkles, Coffee, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: UserCheck,
    number: "01",
    title: "Complete Your Profile",
    description:
      "Tell us about yourself — your specialty, interests, lifestyle, and what you're looking for in friendships. This helps our algorithm find your ideal matches.",
  },
  {
    icon: Sparkles,
    number: "02",
    title: "Get Curated Matches",
    description:
      "Every Thursday at 4 PM, you'll receive a small group of 3-4 doctors matched based on shared interests, compatible schedules, and location proximity.",
  },
  {
    icon: Coffee,
    number: "03",
    title: "Meet in Real Life",
    description:
      "Connect through our group chat, plan a meetup, and discover friendships that go beyond the hospital. RoundsBot helps break the ice!",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-28 lg:py-36 bg-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
            <Sparkles size={14} className="text-primary" />
            How It Works
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
            How{" "}
            <span className="text-gradient-gold">BeyondRounds</span> Works
          </h2>
          <p className="text-xl text-primary-foreground/60">
            Finding meaningful friendships shouldn't be left to chance. Here's how we make it happen.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative group">
              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-primary-foreground/20" />
                </div>
              )}

              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 h-full hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                {/* Step Number Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/40 text-xs font-bold mb-6">
                  STEP {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-glow-sm group-hover:shadow-glow group-hover:scale-110 transition-all duration-300">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-bold text-primary-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-primary-foreground/60 leading-relaxed text-lg">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
