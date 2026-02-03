export default function OnboardingLoading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-4 bg-background dark:bg-[#0a0a0f]">
      <div
        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground animate-pulse">Setting up your profile...</p>
    </div>
  );
}
