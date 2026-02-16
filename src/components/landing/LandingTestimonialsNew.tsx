interface LandingTestimonialsNewProps {
  t: (key: string) => string;
}

const testimonials = [
  {
    stars: 5,
    quote: 'I met two of my closest friends through BeyondRounds. We still meet every month.',
    initials: 'M.L.',
    label: 'Verified Doctor',
  },
  {
    stars: 5,
    quote: 'Moving to Berlin was isolating until BeyondRounds matched me with amazing people who actually get it.',
    initials: 'A.K.',
    label: 'Verified Doctor',
  },
  {
    stars: 5,
    quote: 'It felt like meeting old friends for the first time. No pretense, just genuine connection.',
    initials: 'S.M.',
    label: 'Verified Doctor',
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="#F27C5C"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function LandingTestimonialsNew({ t }: LandingTestimonialsNewProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F7F2EE]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-12 text-center">
          Reasons doctors keep showing up
        </h2>

        <div className="grid sm:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.initials}
              className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 sm:p-7 shadow-sm"
            >
              <Stars count={item.stars} />

              <p className="text-[#5E555B] text-sm leading-relaxed mb-5">
                &ldquo;{item.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F27C5C]/15 flex items-center justify-center text-[#F27C5C] text-xs font-semibold">
                  {item.initials}
                </div>
                <p className="text-[#5E555B]/60 text-xs font-medium">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
