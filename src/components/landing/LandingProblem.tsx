import Image from 'next/image';

interface LandingProblemProps {
  t: (key: string) => string;
}

export function LandingProblem({ t }: LandingProblemProps) {
  return (
    <section className="py-20 sm:py-28 bg-[#F6F1EC]">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#3A0B22] tracking-tight leading-[1.15] mb-6">
              Being a doctor can feel lonely — even when you&apos;re surrounded by people.
            </h2>

            <p className="text-[#5E555B] text-base leading-relaxed mb-6">
              Medicine is demanding. Long hours, rotating hospitals, new cities, and little time to build real friendships.
            </p>

            <p className="text-[#3A0B22] font-bold text-lg leading-snug">
              The problem isn&apos;t motivation.<br />
              The problem is structure.
            </p>
          </div>

          {/* Right: Photo */}
          <div className="relative rounded-[24px] overflow-hidden aspect-[4/3] shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=700&h=525&fit=crop&q=80"
              alt="Two women chatting over coffee at a warm café"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
