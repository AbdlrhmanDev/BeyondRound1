import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { joinWaitlist, getWaitlistCount } from "@/services/waitlistService";
import { 
  UserPlus, 
  Users, 
  Heart,
  CheckCircle2,
  Mail,
  MapPin,
  Stethoscope,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Sparkles
} from "lucide-react";

const Waitlist = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(500);
  const [animatedCount, setAnimatedCount] = useState(0);
  const countRef = useRef(waitlistCount);
  const animatedCountRef = useRef(animatedCount);

  // Update refs when state changes
  useEffect(() => {
    countRef.current = waitlistCount;
  }, [waitlistCount]);

  useEffect(() => {
    animatedCountRef.current = animatedCount;
  }, [animatedCount]);

  // Function to animate counter from current value to target
  const animateCounter = (targetCount: number, startCount?: number) => {
    const start = startCount ?? animatedCountRef.current;
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = (targetCount - start) / steps;
    const stepDuration = duration / steps;
    
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetCount) || (increment < 0 && current <= targetCount)) {
        setAnimatedCount(targetCount);
        clearInterval(timer);
      } else {
        setAnimatedCount(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  };

  // Function to update waitlist count
  const updateWaitlistCount = async (shouldAnimate = true) => {
    try {
      const count = await getWaitlistCount();
      if (count !== countRef.current) {
        setWaitlistCount(count);
        if (shouldAnimate) {
          animateCounter(count);
        }
      }
    } catch (error) {
      console.error("Error fetching waitlist count:", error);
    }
  };

  useEffect(() => {
    // Get waitlist count on mount and animate
    getWaitlistCount().then((count) => {
      setWaitlistCount(count);
      animateCounter(count, 0);
    });

    // Update count every 30 seconds
    const interval = setInterval(() => updateWaitlistCount(true), 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await joinWaitlist({
        email,
        city: city.trim() || undefined,
        medicalSpecialty: specialty.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setEmail("");
        setCity("");
        setSpecialty("");
        // Update count immediately after successful submission
        updateWaitlistCount();
        toast({
          title: "You're on the list!",
          description: "We'll notify you when we launch.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to join waitlist. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting waitlist:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const medicalSpecialties = [
    "Cardiology",
    "Dermatology",
    "Emergency Medicine",
    "Family Medicine",
    "Internal Medicine",
    "Neurology",
    "Oncology",
    "Pediatrics",
    "Psychiatry",
    "Surgery",
    "Other",
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-foreground dark:bg-background">
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

      {/* Floating Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <Sparkles className="absolute top-20 left-10 h-4 w-4 text-primary/30 animate-float" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <Sparkles className="absolute top-40 right-20 h-5 w-5 text-accent/30 animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <Sparkles className="absolute top-60 left-1/4 h-3 w-3 text-primary/20 animate-float" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />
        <Sparkles className="absolute bottom-40 right-1/3 h-4 w-4 text-accent/25 animate-float" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }} />
        <Sparkles className="absolute bottom-60 left-1/3 h-5 w-5 text-primary/20 animate-float" style={{ animationDelay: '1.5s', animationDuration: '3s' }} />
        <Sparkles className="absolute top-1/3 right-1/4 h-3 w-3 text-accent/30 animate-float" style={{ animationDelay: '2.5s', animationDuration: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 sticky top-0">
        <div className="mx-4 mt-4">
          <div className="bg-primary-foreground/5 backdrop-blur-2xl border border-primary-foreground/10 rounded-2xl shadow-lg">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-center h-16">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center shadow-glow-sm">
                    <Heart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-display text-xl font-bold text-primary-foreground tracking-tight">
                    BeyondRounds
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-primary-foreground leading-tight animate-fade-up">
              Meet Doctors Who{" "}
              <span className="text-gradient-gold">
                Actually Get You
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/60 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
              Join curated small groups of physicians matched by specialty, interests, and location.
            </p>
            
            {/* Primary CTA */}
            <div className="mb-6 animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#waitlist-form">
                <Button 
                  size="lg" 
                  variant="hero"
                  className="h-14 px-8 text-lg group"
                >
                  Join the Waitlist
                  <Sparkles className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                </Button>
              </a>
              <Button
                variant="outline"
                className="h-14 px-8 text-lg border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/survey">Take the 2-min quiz</Link>
              </Button>
            </div>
            <p className="mb-16 text-sm text-primary-foreground/50 animate-fade-up delay-300">
              <Link to="/for-doctors" className="underline hover:text-primary-foreground/70">
                Why doctors need BeyondRounds
              </Link>
            </p>

            {/* Social Proof with Animated Counter */}
            <div className="animate-fade-up delay-400">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-2xl font-display font-bold text-primary-foreground number-display">
                    {animatedCount.toLocaleString()}+
                  </span>
                </div>
                <span className="text-sm text-primary-foreground/60">doctors already joined</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12 text-primary-foreground animate-fade-up">
              Why <span className="text-gradient-gold">BeyondRounds</span>?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-200">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-primary-foreground">Verified Only</h3>
                <p className="text-sm text-primary-foreground/60">
                  All members are verified medical professionals. Your privacy and safety come first.
                </p>
              </Card>

              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-300">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-primary-foreground">Smart Matching</h3>
                <p className="text-sm text-primary-foreground/60">
                  Advanced matching system connects you with physicians who share your interests and values.
                </p>
              </Card>

              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-400">
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold mb-2 text-primary-foreground">Curated Groups</h3>
                <p className="text-sm text-primary-foreground/60">
                  Small, intimate groups designed for meaningful connections and professional growth.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Three Steps Section */}
        <section className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl shadow-lg shadow-foreground/5 hover:shadow-xl hover:shadow-foreground/10 transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-200">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-primary-foreground">1. Sign Up</h3>
                  <p className="text-primary-foreground/60">
                    Join our waitlist with your email and specialty
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl shadow-lg shadow-foreground/5 hover:shadow-xl hover:shadow-foreground/10 transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-300">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-primary-foreground">2. Get Matched</h3>
                  <p className="text-primary-foreground/60">
                    We'll connect you with like-minded physicians
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl shadow-lg shadow-foreground/5 hover:shadow-xl hover:shadow-foreground/10 transition-all duration-300 hover:-translate-y-1 animate-fade-up delay-400">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
                    <Heart className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3 text-primary-foreground">3. Meet Great People</h3>
                  <p className="text-primary-foreground/60">
                    Build meaningful connections with your peers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Waitlist Form */}
        <section id="waitlist-form" className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl shadow-2xl shadow-foreground/10 animate-fade-up delay-500">
              <CardContent className="p-8 md:p-12">
                {submitted ? (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="h-8 w-8 text-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-3 text-primary-foreground">You're on the list!</h2>
                    <p className="text-primary-foreground/60 mb-6">
                      We'll notify you as soon as we launch. Get ready to connect with amazing physicians.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      Add Another Email
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-3xl font-bold mb-2 text-center text-primary-foreground">
                      Get <span className="text-gradient-gold">Early Access</span>
                    </h2>
                    <p className="text-primary-foreground/60 text-center mb-8">
                      Be among the first to experience BeyondRounds
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium mb-2 text-primary-foreground">
                          <Mail className="h-4 w-4" />
                          Email *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 bg-primary-foreground/5 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium mb-2 text-primary-foreground">
                          <MapPin className="h-4 w-4" />
                          City
                        </label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="e.g., New York, San Francisco"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-12 bg-primary-foreground/5 border-primary-foreground/20 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {/* Medical Specialty */}
                      <div>
                        <label htmlFor="specialty" className="flex items-center gap-2 text-sm font-medium mb-2 text-primary-foreground">
                          <Stethoscope className="h-4 w-4" />
                          Medical Specialty
                        </label>
                        <Select value={specialty} onValueChange={setSpecialty}>
                          <SelectTrigger id="specialty" className="h-12 bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground">
                            <SelectValue placeholder="Select your specialty" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicalSpecialties.map((spec) => (
                              <SelectItem key={spec} value={spec}>
                                {spec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={loading}
                        variant="hero"
                        className="w-full h-12 text-lg"
                      >
                        {loading ? "Joining..." : "Get Early Access"}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-gold flex items-center justify-center shadow-glow-sm">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-semibold text-primary-foreground/80">
              BeyondRounds
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Waitlist;
