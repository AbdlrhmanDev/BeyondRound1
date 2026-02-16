'use client';

import { useModal } from './LandingModalProvider';

function getUpcomingWeekend() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  const fri = new Date(now);
  fri.setDate(fri.getDate() + daysUntilFri);
  const sat = new Date(fri);
  sat.setDate(sat.getDate() + 1);
  const sun = new Date(fri);
  sun.setDate(sun.getDate() + 2);

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return [
    { day: 'Friday', date: fmt(fri), label: 'Choose Friday' },
    { day: 'Saturday', date: fmt(sat), label: 'Choose Saturday' },
    { day: 'Sunday', date: fmt(sun), label: 'Choose Sunday' },
  ];
}

export function LandingWeekendPicker() {
  const { openModal } = useModal();
  const options = getUpcomingWeekend();

  return (
    <section className="py-20 sm:py-28 bg-[#F7F2EE]">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight mb-4">
            Choose your next Berlin meetup
          </h2>
          <p className="text-[#5E555B] text-base max-w-xl mx-auto leading-relaxed">
            Pick one weekend option. After you register and choose a day, you&apos;ll confirm your spot.
          </p>
        </div>

        {/* Weekend cards */}
        <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
          {options.map(({ day, date, label }) => (
            <div
              key={day}
              className="bg-white/80 border border-[#E8DED5]/60 rounded-[22px] p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center"
            >
              <h3 className="font-display font-bold text-[#3A0B22] text-xl mb-1">
                {day}
              </h3>

              <p className="text-[#5E555B] text-xs mb-4 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {date}
              </p>

              <div className="space-y-1.5 mb-6">
                <p className="text-[#5E555B] text-sm flex items-center gap-1.5 justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  Small group: 3–4 doctors
                </p>
                <p className="text-[#5E555B] text-sm flex items-center gap-1.5 justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F27C5C" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Berlin
                </p>
              </div>

              <button
                type="button"
                onClick={openModal}
                className="w-full rounded-full py-3 text-sm font-semibold bg-[#F27C5C] text-white hover:bg-[#e06a4a] active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                {label}
              </button>
            </div>
          ))}
        </div>

        {/* Weekly capacity line */}
        <p className="text-center mt-8 text-[#5E555B]/60 text-xs tracking-wide">
          Each weekend is limited to 24 spots across all groups.
        </p>
      </div>
    </section>
  );
}
