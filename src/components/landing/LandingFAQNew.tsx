import { LandingCTAButton } from './LandingCTAButton';

interface LandingFAQNewProps {
  t: (key: string) => string;
}

const faqs = [
  {
    q: 'Who is BeyondRounds for?',
    a: 'BeyondRounds is exclusively for licensed physicians in Berlin. Whether you\u2019re a resident, attending, or in private practice \u2014 if you hold a medical license and want genuine friendships outside the hospital, this is for you.',
  },
  {
    q: 'How are groups matched?',
    a: 'We match based on city, shared interests, and weekend availability. Groups are intentionally small (3\u20134 doctors) so every conversation feels personal, not crowded.',
  },
  {
    q: 'What happens after I choose Friday/Sat/Sun?',
    a: 'You\u2019ll enter a short registration flow to confirm your details and preferences. Once confirmed, you\u2019ll receive your group match and meetup details before the weekend.',
  },
  {
    q: 'What if someone no-shows?',
    a: 'We take commitment seriously. Founding members receive a free re-match if their first meetup is affected by a no-show. We also send reminders and confirmations to minimize this.',
  },
  {
    q: 'Is this dating or networking?',
    a: 'Neither. BeyondRounds is designed purely for friendship. No romantic matching, no business-card exchanges. Just real, relaxed social connection between doctors who want a life outside medicine.',
  },
  {
    q: 'How is verification done?',
    a: 'During registration, we verify your medical credentials to ensure every member is a licensed physician. This keeps the community trusted and the conversations authentic.',
  },
  {
    q: 'Which cities are supported?',
    a: 'We\u2019re launching in Berlin first. Additional cities will open based on demand \u2014 founding members get early access when new locations go live.',
  },
];

export function LandingFAQNew({ t }: LandingFAQNewProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-12 text-center">
          Frequently asked questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group bg-white/80 border border-[#E8DED5]/60 rounded-xl shadow-sm"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[#3A0B22] font-medium text-sm select-none list-none [&::-webkit-details-marker]:hidden">
                <span>{faq.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 ml-4 text-[#5E555B]/40 transition-transform duration-200 group-open:rotate-180"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm text-[#5E555B] leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        {/* CTA — objections handled, final nudge */}
        <div className="text-center mt-14">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <LandingCTAButton
              label="Reserve my spot"
              className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
            />
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-full px-6 py-4 text-sm font-medium text-[#5E555B] hover:text-[#3A0B22] hover:bg-[#3A0B22]/[0.03] transition-all duration-200"
            >
              Still have questions?
            </a>
          </div>
          <p className="text-[#5E555B]/50 text-xs mt-3 tracking-wide">
            24 spots per weekend. Founding access limited to 100 doctors.
          </p>
        </div>
      </div>
    </section>
  );
}
