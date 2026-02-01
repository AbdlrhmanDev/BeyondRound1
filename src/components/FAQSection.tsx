import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ArrowRight } from "lucide-react";

const faqs = [
  {
    question: "What exactly is BeyondRounds?",
    answer:
      "BeyondRounds is a members-only social club designed exclusively for verified doctors. We use a smart matching algorithm to connect you with 3-4 fellow physicians who share your interests, lifestyle, and values — for real friendships, not networking.",
  },
  {
    question: "Who can join?",
    answer:
      "Any verified medical doctor — from medical students and residents to attending physicians and specialists. We manually verify all members through medical license confirmation and photo ID to maintain trust and safety.",
  },
  {
    question: "How does matching work?",
    answer:
      "Every Thursday at 4 PM, you'll receive a curated group of 3-4 doctors matched based on shared interests, compatible schedules, and city proximity. Our algorithm considers specialty, hobbies, lifestyle preferences, and social style to find your ideal connections.",
  },
  {
    question: "What if I don't connect with my group?",
    answer:
      "No pressure! You'll receive a fresh group every week, and our algorithm learns from your feedback to improve future matches. Great friendships take time — we're here to help you find your tribe.",
  },
  {
    question: "Where do groups typically meet?",
    answer:
      "Your group decides together! Popular spots include coffee shops, restaurants, parks, gyms, or activity-based outings like hiking or sports. RoundsBot (our AI assistant) suggests safe, convenient locations and helps break the ice.",
  },
  {
    question: "Is it safe to meet people from the app?",
    answer:
      "Absolutely. Every member is a verified doctor, and we encourage meeting in public places. RoundsBot provides conversation starters and coordinates safe meetup spots. You can report any concerns directly through the app.",
  },
  {
    question: "What's the 30-Day Friendship Guarantee?",
    answer:
      "If you don't have at least 2 meaningful in-person meetups in your first 30 days, we'll refund you in full. Just email support@beyondrounds.com with a brief note, and we'll process your refund within 5-7 business days.",
  },
  {
    question: "Can I pause or cancel anytime?",
    answer:
      "Yes! You can cancel your subscription anytime from your account settings — no questions asked. You'll continue to receive matches until the end of your current billing period.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-28 lg:py-36 bg-foreground dark:bg-background relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Header */}
          <div className="lg:sticky lg:top-32">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 text-sm font-semibold mb-6">
              <HelpCircle size={14} className="text-primary" />
              FAQ
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight mb-6">
              Got{" "}
              <span className="text-gradient-gold">Questions?</span>
            </h2>
            <p className="text-xl text-primary-foreground/60 mb-8 leading-relaxed">
              Everything you need to know about BeyondRounds. Can't find what you're looking for?
            </p>
            <a
              href="mailto:support@beyondrounds.com"
              className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group"
            >
              Contact our support team
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Right Column - Accordion */}
          <div className="space-y-4">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-2xl px-6 mb-4 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-primary-foreground hover:no-underline py-5 text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-primary-foreground/60 pb-5 text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
