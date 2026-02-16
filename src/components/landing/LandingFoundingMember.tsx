import { LandingCTAButton } from './LandingCTAButton';

interface LandingFoundingMemberProps {
  t: (key: string) => string;
}

const benefits = [
  'Priority access to future matches',
  'Free re-match if your first meetup doesn\u2019t happen (no-shows / coordination issues)',
  'Private doctors-only community',
  'Early access when new cities open',
  'Locked-in founding perks (no future downgrade)',
];

export function LandingFoundingMember({ t }: LandingFoundingMemberProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
        {/* Badge */}
        <p className="text-[#F27C5C] text-xs font-semibold tracking-[0.15em] uppercase mb-4">
          LIMITED ACCESS
        </p>

        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-3 leading-[1.15]">
          Founding Member Access — Berlin Launch
        </h2>

        <p className="text-[#5E555B] text-base mb-10 max-w-md mx-auto leading-relaxed">
          Only <span className="text-[#F27C5C] font-semibold">100 doctors</span> will ever get founding access.
        </p>

        {/* Benefits card */}
        <div className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 sm:p-8 text-left max-w-lg mx-auto mb-8">
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 mt-0.5"
                >
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="#F27C5C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[#5E555B] text-sm leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Closing scarcity line */}
        <p className="text-[#5E555B]/60 text-xs mb-8 tracking-wide">
          Once 100 are filled, this closes permanently.
        </p>

        <LandingCTAButton
          label="Join as a Founding Member"
          className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#F27C5C]/20"
        />
      </div>
    </section>
  );
}
