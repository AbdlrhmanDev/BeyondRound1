/**
 * Matches index.html static hero - seamless transition when React hydrates.
 * Used as Suspense fallback for index route to avoid spinner flash.
 */
const HeroSkeleton = () => (
  <div className="min-h-screen bg-foreground flex items-center pt-24 pb-16 px-4">
    <div className="max-w-2xl mx-auto w-full">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold mb-8">
        Exclusively for Verified Doctors
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
        Your Next Great
        <br />
        <span className="bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent">
          Friendship Awaits
        </span>
      </h1>
      <p className="text-xl text-white/70 max-w-xl mb-8 leading-relaxed">
        Life in medicine can be isolating. BeyondRounds matches you with fellow doctors who share your interests.
      </p>
      <div className="rounded-2xl overflow-hidden aspect-[4/5] max-w-[500px] bg-white/5">
        <picture>
          <source srcSet="/hero-doctors-friendship-mobile.webp" type="image/webp" media="(max-width:768px)" />
          <source srcSet="/hero-doctors-friendship.webp" type="image/webp" media="(min-width:769px)" />
          <img
            src="/hero-doctors-friendship.jpg"
            alt=""
            className="w-full h-full object-cover"
            width={500}
            height={625}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </div>
    </div>
  </div>
);

export default HeroSkeleton;
