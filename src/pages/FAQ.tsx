import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowRight } from "lucide-react";

const faqData = [
  {
    category: "General Questions",
    items: [
      {
        question: "What exactly is BeyondRounds?",
        answer: "BeyondRounds is a members-only social club designed exclusively for verified doctors. We use a smart matching algorithm to connect you with 3-4 fellow physicians who share your interests, lifestyle, and values — for real friendships, not networking."
      },
      {
        question: "How is this different from other networking apps?",
        answer: "We're not about professional networking or dating. BeyondRounds is specifically designed for doctors to make real friends who understand their lifestyle and share their personal interests outside of medicine."
      },
      {
        question: "Who can join?",
        answer: "Any verified medical doctor — from medical students and residents to attending physicians and specialists. We manually verify all members through medical license confirmation and photo ID to maintain trust and safety."
      }
    ]
  },
  {
    category: "Matching & Groups",
    items: [
      {
        question: "How does matching work?",
        answer: "Every Thursday at 4 PM, you'll receive a curated group of 3-4 doctors matched based on shared interests, compatible schedules, and city proximity. Our algorithm considers specialty, hobbies, lifestyle preferences, and social style to find your ideal connections."
      },
      {
        question: "What if I don't connect with my group?",
        answer: "No pressure! You'll receive a fresh group every week, and our algorithm learns from your feedback to improve future matches. Great friendships take time — we're here to help you find your tribe."
      },
      {
        question: "Can I choose my own matches?",
        answer: "Our curated approach is what makes BeyondRounds special. Trust our algorithm — it's designed by doctors, for doctors, and gets smarter with each match."
      }
    ]
  },
  {
    category: "Meetings & Safety",
    items: [
      {
        question: "Where do groups typically meet?",
        answer: "Your group decides together! Popular spots include coffee shops, restaurants, parks, gyms, or activity-based outings like hiking or sports. RoundsBot (our AI assistant) suggests safe, convenient locations and helps break the ice."
      },
      {
        question: "Is it safe to meet people from the app?",
        answer: "Absolutely. Every member is a verified doctor, and we encourage meeting in public places. RoundsBot provides conversation starters and coordinates safe meetup spots. You can report any concerns directly through the app."
      },
      {
        question: "What if someone doesn't show up?",
        answer: "We take no-shows seriously. Members get one warning, a temporary pause after the second no-show, and potential removal after the third."
      }
    ]
  },
  {
    category: "Pricing & Membership",
    items: [
      {
        question: "How much does BeyondRounds cost?",
        answer: "Trial: €9.99 (first month), Founders: €14.99/month (limited time), Core: €29.99/month, Premium: €49.99/month (includes advanced filtering and exclusive events)."
      },
      {
        question: "Can I pause or cancel anytime?",
        answer: "Yes! You can cancel your subscription anytime from your account settings — no questions asked. You'll continue to receive matches until the end of your current billing period."
      },
      {
        question: "What's the 30-Day Friendship Guarantee?",
        answer: "If you don't have at least 2 meaningful in-person meetups in your first 30 days, we'll refund you in full. Just email support@beyondrounds.com with a brief note, and we'll process your refund within 5-7 business days."
      }
    ]
  }
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-foreground dark:bg-background">
      <Header />
      
      <main className="pt-32">
        <section className="py-20 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
                <HelpCircle size={14} className="text-primary" />
                FAQ
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground tracking-tight mb-6">
                Frequently Asked{" "}
                <span className="text-gradient-gold">Questions</span>
              </h1>
              <p className="text-xl text-primary-foreground/60">
                Everything you need to know about BeyondRounds
              </p>
            </div>

            {/* FAQ Categories */}
            <div className="max-w-3xl mx-auto space-y-12">
              {faqData.map((section, idx) => (
                <div key={idx}>
                  <h2 className="font-display text-2xl font-bold text-primary mb-6">{section.category}</h2>
                  <Accordion type="single" collapsible className="space-y-4">
                    {section.items.map((item, itemIdx) => (
                      <AccordionItem 
                        key={itemIdx} 
                        value={`${idx}-${itemIdx}`}
                        className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 data-[state=open]:border-primary/30"
                      >
                        <AccordionTrigger className="text-left font-display font-semibold text-primary-foreground hover:no-underline py-5 text-lg">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-primary-foreground/60 pb-5 text-base leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>

            {/* Contact Support */}
            <div className="mt-16 max-w-xl mx-auto">
              <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-8 text-center">
                <h3 className="font-display text-xl font-bold text-primary-foreground mb-3">Still have questions?</h3>
                <p className="text-primary-foreground/60 mb-6">We're here to help you find your tribe.</p>
                <a href="mailto:support@beyondrounds.com">
                  <Button className="h-12 px-6 group">
                    Contact Support
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
