/**
 * Native img – zero JS. srcset for mobile (smaller) vs desktop. Fastest LCP.
 */
interface HeroImageServerProps {
  /** When true, fills parent container (for hero card) */
  fill?: boolean;
}

export default function HeroImageServer({ fill }: HeroImageServerProps) {
  return (
    <div
      className={
        fill
          ? 'absolute inset-0 overflow-hidden rounded-[2rem]'
          : 'relative rounded-[2rem] overflow-hidden shadow-2xl border border-primary-foreground/10 aspect-[4/5] w-full max-w-[500px] mx-auto lg:mx-0'
      }
    >
      <img
        src="/hero-doctors-friendship-mobile.webp"
        srcSet="/hero-doctors-friendship-mobile.webp 500w, /hero-doctors-friendship.webp 1000w"
        sizes="(max-width: 768px) 100vw, 500px"
        alt="Doctors enjoying genuine friendship at a coffee meetup"
        width={500}
        height={625}
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="w-full h-full object-cover rounded-[2rem]"
      />
    </div>
  );
}
