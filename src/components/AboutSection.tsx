import { Quote, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-28 lg:py-36 bg-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <Heart size={14} className="text-primary" />
              Our Story
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight">
              Born from a{" "}
              <span className="text-gradient-gold">Late-Night Shift</span>
            </h2>
          </div>

          {/* Quote Block */}
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

          {/* Mission Statement */}
          <div className="mt-16 text-center">
            <p className="text-2xl lg:text-3xl font-display text-primary-foreground leading-relaxed">
              Our mission is simple: to help doctors discover friendships that{" "}
              <span className="text-gradient-gold font-bold">enrich their lives</span>{" "}
              outside the hospital.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
