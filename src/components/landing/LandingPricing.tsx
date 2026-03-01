import { LandingCTAButton } from './LandingCTAButton';
import { ScrollAnimatedWrapper } from './ScrollAnimatedWrapper';

interface Props {
  t: (key: string) => string;
  ctaHref?: string;
}

// ─── Shared feature list (plans 2-4 only) ────────────────────────────────────

function FeatureList({ t }: { t: Props['t'] }) {
  const features = [
    t('landing.planFeat1'),
    t('landing.planFeat2'),
    t('landing.planFeat3'),
    t('landing.planFeat4'),
  ];
  return (
    <ul className="space-y-2.5 mt-5 mb-6">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <path d="M20 6 9 17l-5-5" stroke="#F27C5C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[13px] text-[#5E555B] leading-snug">{f}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Single plan card ─────────────────────────────────────────────────────────

interface PlanCardProps {
  badge?: string;
  highlight?: boolean;   // coral top strip + stronger border
  name: string;
  price: string;
  priceNote?: string;    // "/month"
  total?: string;        // "€44.97 total"
  save?: string;         // "Save 25% vs monthly"
  desc: string;
  cta: string;
  ctaHref?: string;
  showFeatures: boolean;
  t: Props['t'];
}

function PlanCard({
  badge,
  highlight,
  name,
  price,
  priceNote,
  total,
  save,
  desc,
  cta,
  ctaHref,
  showFeatures,
  t,
}: PlanCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-[22px] overflow-hidden bg-white"
      style={{
        border: highlight
          ? '1.5px solid rgba(242,124,92,0.55)'
          : '1px solid rgba(58,11,34,0.09)',
        boxShadow: highlight
          ? '0 12px 40px rgba(242,124,92,0.12), 0 2px 8px rgba(26,10,18,0.06)'
          : '0 4px 20px rgba(26,10,18,0.06)',
      }}
    >
      {/* Accent strip for highlighted plans */}
      {highlight && (
        <div
          className="h-[4px] w-full"
          style={{ background: 'linear-gradient(to right, #F27C5C, #F6B4A8)' }}
        />
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* Badge */}
        {badge ? (
          <span
            className="self-start text-[10px] font-bold tracking-[0.12em] uppercase px-2.5 py-1 rounded-full mb-4"
            style={{
              background: highlight ? 'rgba(242,124,92,0.12)' : 'rgba(58,11,34,0.07)',
              color: highlight ? '#F27C5C' : '#3A0B22',
            }}
          >
            {badge}
          </span>
        ) : (
          <div className="mb-4 h-6" aria-hidden="true" /> /* spacer to align cards */
        )}

        {/* Plan name */}
        <p
          className="text-[11px] font-bold tracking-[0.14em] uppercase mb-2"
          style={{ color: '#9B8F8B' }}
        >
          {name}
        </p>

        {/* Price */}
        <div className="flex items-end gap-1 mb-1">
          <span
            className="font-display font-bold leading-none"
            style={{ fontSize: '2.2rem', color: '#1A0A12' }}
          >
            {price}
          </span>
          {priceNote && (
            <span className="text-sm text-[#9B8F8B] mb-1">{priceNote}</span>
          )}
        </div>

        {/* Total + save */}
        {(total || save) && (
          <div className="flex items-center gap-2 mb-1">
            {total && (
              <span className="text-[12px] text-[#9B8F8B]">{total}</span>
            )}
            {save && (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(242,124,92,0.10)', color: '#F27C5C' }}
              >
                {save}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-[13px] text-[#5E555B] mt-2 leading-snug">{desc}</p>

        {/* Feature list */}
        {showFeatures && <FeatureList t={t} />}

        {/* CTA — pushed to bottom */}
        <div className="mt-auto pt-5">
          <LandingCTAButton
            label={cta}
            href={ctaHref}
            className={[
              'w-full flex items-center justify-center rounded-full py-3 text-[14px] font-semibold',
              'transition-all duration-200 active:scale-[0.98] focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[#F6B4A8] focus-visible:ring-offset-2',
              highlight
                ? 'bg-[#F27C5C] text-white hover:bg-[#e06a4a] shadow-sm shadow-[#F27C5C]/25'
                : 'bg-transparent text-[#3A0B22] border border-[rgba(58,11,34,0.18)] hover:bg-[rgba(58,11,34,0.04)]',
            ].join(' ')}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Guarantee banner ─────────────────────────────────────────────────────────

function GuaranteeBanner({ t }: { t: Props['t'] }) {
  return (
    <ScrollAnimatedWrapper
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mt-10 rounded-[22px] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3A0B22 0%, #4B0F2D 100%)',
        boxShadow: '0 8px 32px rgba(58,11,34,0.22)',
      }}
    >
      <div className="px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Shield icon */}
        <div
          className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(242,124,92,0.18)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z"
              stroke="#F27C5C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="#F27C5C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1">
          <p
            className="font-display font-bold text-xl sm:text-2xl mb-2 leading-tight"
            style={{ color: '#F6F1EC' }}
          >
            🔒 {t('landing.guarantee30Title')}
          </p>
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'rgba(246,241,236,0.70)' }}>
            {t('landing.guarantee30Desc')}
          </p>

          {/* Two choice pills */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[
              { label: t('landing.guarantee30Choice1'), arrow: '→' },
              { label: t('landing.guarantee30Choice2'), arrow: '→' },
            ].map(({ label, arrow }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold"
                style={{ background: 'rgba(242,124,92,0.18)', color: '#F6B4A8' }}
              >
                <span style={{ color: '#F27C5C' }}>{arrow}</span>
                {label}
              </div>
            ))}
          </div>

          <p className="text-[12px] font-medium" style={{ color: 'rgba(246,241,236,0.50)' }}>
            {t('landing.guarantee30Note')}
          </p>
        </div>
      </div>
    </ScrollAnimatedWrapper>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function LandingPricing({ t, ctaHref }: Props) {
  const plans: PlanCardProps[] = [
    {
      name:         t('landing.plan1Name'),
      price:        t('landing.plan1Price'),
      desc:         t('landing.plan1Desc'),
      cta:          t('landing.plan1CTA'),
      ctaHref,
      showFeatures: false,
      t,
    },
    {
      name:         t('landing.plan2Name'),
      price:        t('landing.plan2Price'),
      priceNote:    t('landing.plan2PriceNote'),
      desc:         t('landing.plan2Desc'),
      cta:          t('landing.plan2CTA'),
      ctaHref,
      showFeatures: true,
      t,
    },
    {
      badge:        t('landing.plan3Badge'),
      highlight:    true,
      name:         t('landing.plan3Name'),
      price:        t('landing.plan3Price'),
      priceNote:    t('landing.plan3PriceNote'),
      total:        t('landing.plan3Total'),
      save:         t('landing.plan3Save'),
      desc:         t('landing.plan3Desc'),
      cta:          t('landing.plan3CTA'),
      ctaHref,
      showFeatures: true,
      t,
    },
    {
      badge:        t('landing.plan4Badge'),
      name:         t('landing.plan4Name'),
      price:        t('landing.plan4Price'),
      priceNote:    t('landing.plan4PriceNote'),
      total:        t('landing.plan4Total'),
      save:         t('landing.plan4Save'),
      desc:         t('landing.plan4Desc'),
      cta:          t('landing.plan4CTA'),
      ctaHref,
      showFeatures: true,
      t,
    },
  ];

  return (
    <section className="py-20 sm:py-28" style={{ background: '#F6F1EC' }}>
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4"
            style={{ color: '#F27C5C' }}
          >
            {t('landing.pricingBadge')}
          </p>
          <h2
            className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3 leading-[1.15]"
            style={{ color: '#3A0B22' }}
          >
            {t('landing.pricingTitle')}
          </h2>
          <p className="text-[#5E555B] text-base max-w-md mx-auto leading-relaxed">
            {t('landing.pricingSubtitle')}
          </p>
        </div>

        {/* Plan grid — 1 col mobile, 2 col md, 4 col xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          {plans.map((plan, i) => (
            <ScrollAnimatedWrapper
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              className="flex"
            >
              <PlanCard {...plan} />
            </ScrollAnimatedWrapper>
          ))}
        </div>

        {/* Guarantee */}
        <GuaranteeBanner t={t} />

      </div>
    </section>
  );
}
