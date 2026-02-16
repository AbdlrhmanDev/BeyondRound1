import Image from 'next/image';

interface LandingValuePropsProps {
  t: (key: string) => string;
}

const checkItems = [
  'Verified doctors only',
  'Small groups of 3\u20134',
  'Matched by city, interests, and availability',
  'Weekly rhythm (Friday\u2013Sunday meetups)',
  'Private group chat with prompts',
];

const photos = [
  {
    src: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=600&h=400&fit=crop&q=80',
    alt: 'Brunch table with coffee and fresh food',
    label: 'Weekend brunch',
  },
  {
    src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop&q=80',
    alt: 'Cozy caf\u00e9 interior with warm lighting',
    label: 'Berlin caf\u00e9',
  },
  {
    src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop&q=80',
    alt: 'Friends on a casual walk in a park',
    label: 'Casual walk',
  },
];

export function LandingValueProps({ t }: LandingValuePropsProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Check list */}
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-8">
              Built around how real friendships actually form
            </h2>

            <ul className="space-y-4 mb-8">
              {checkItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <svg
                    width="20"
                    height="20"
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
                  <span className="text-[#5E555B] text-[15px] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <p className="text-[#F27C5C] text-sm font-medium italic">
              We remove the friction. You keep the fun.
            </p>
          </div>

          {/* Right: Photo grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Large photo spanning full width */}
            <div className="col-span-2 relative rounded-[20px] overflow-hidden aspect-[3/2] shadow-md">
              <Image
                src={photos[0].src}
                alt={photos[0].alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {/* Two smaller photos side by side */}
            {photos.slice(1).map((photo) => (
              <div
                key={photo.label}
                className="relative rounded-[20px] overflow-hidden aspect-[4/3] shadow-md"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
