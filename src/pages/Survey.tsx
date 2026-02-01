import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitSurvey } from "@/services/surveyService";
import { Mail, Sparkles, CheckCircle2, ArrowRight, Heart } from "lucide-react";

const QUESTIONS = [
  {
    id: "biggest_challenge",
    label: "What's your biggest challenge as a physician?",
    options: [
      "Feeling isolated despite being surrounded by colleagues",
      "No time for friendships or hobbies outside work",
      "Conversations always circle back to medicine",
      "Want to find peers who really get the lifestyle",
      "Other",
    ],
  },
  {
    id: "connection_type",
    label: "What kind of connections are you looking for?",
    options: [
      "Real friendships beyond the hospital",
      "Professional network only",
      "Both — friends who also happen to be doctors",
      "Not sure yet, just exploring",
    ],
  },
  {
    id: "hear_about",
    label: "How did you hear about BeyondRounds?",
    options: [
      "Social media",
      "A colleague or friend",
      "Search / web",
      "Other",
    ],
  },
];

const Survey = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const allAnswered = QUESTIONS.every((q) => answers[q.id]?.trim());
  const canSubmit = email.trim() && allAnswered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    const result = await submitSurvey({ email: email.trim(), answers });
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      toast({ title: "Thank you!", description: "Your responses have been saved." });
    } else {
      toast({ title: "Error", description: result.error || "Something went wrong.", variant: "destructive" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-foreground dark:bg-background flex items-center justify-center px-4">
        <Card className="max-w-lg w-full bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground mb-3">
              Thanks for sharing!
            </h1>
            <p className="text-primary-foreground/60 mb-8">
              Your answers help us build a better experience for doctors. Ready to get early access?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="group" asChild>
                <Link to="/waitlist">
                  Join the waitlist
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground dark:bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[200px]" />
      </div>

      <header className="relative z-20 py-6">
        <div className="container mx-auto px-4 flex justify-center">
          <Link to="/" className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <Heart className="h-5 w-5" />
            <span className="font-display font-bold text-lg">BeyondRounds</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-4">
              <Sparkles size={14} className="text-primary" />
              2-minute quiz
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-3">
              Help us understand what doctors need
            </h1>
            <p className="text-primary-foreground/60">
              A few quick questions so we can build the right experience for you.
            </p>
          </div>

          <Card className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-3xl shadow-xl">
            <CardContent className="p-6 sm:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="survey-email" className="flex items-center gap-2 text-sm font-medium mb-2 text-primary-foreground">
                    <Mail className="h-4 w-4" />
                    Email *
                  </label>
                  <Input
                    id="survey-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-background/50 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  />
                </div>

                {QUESTIONS.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium mb-3 text-primary-foreground">
                      {q.label}
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                            answers[q.id] === opt
                              ? "border-primary bg-primary/20 text-primary-foreground"
                              : "border-primary-foreground/20 text-primary-foreground/80 hover:border-primary-foreground/40 hover:bg-primary-foreground/5"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <Button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="w-full h-12 text-base"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-primary-foreground/50 mt-6">
            <Link to="/for-doctors" className="underline hover:text-primary-foreground/70">
              Why we ask this
            </Link>
            {" · "}
            <Link to="/waitlist" className="underline hover:text-primary-foreground/70">
              Skip to waitlist
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Survey;
