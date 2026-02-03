export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-white dark:bg-[#0a0a0f]">
      <div
        className="h-12 w-12 rounded-full border-amber-500/30 border-t-amber-500 animate-spin"
        style={{ borderWidth: 3 }}
        aria-hidden
      />
      <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">Setting up your profile...</p>
    </div>
  );
}
