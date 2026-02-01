/**
 * Enhanced Skeleton Loader Component
 * Provides better loading states with shimmer effect
 */

import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const SkeletonLoader = ({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonLoaderProps) => {
  const baseClasses = "animate-pulse bg-primary-foreground/10";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-2xl",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count === 1) {
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        style={style}
      />
    );
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            baseClasses,
            variantClasses[variant],
            className
          )}
          style={style}
        />
      ))}
    </>
  );
};

/**
 * Page-level skeleton loader
 */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-foreground dark:bg-background p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <SkeletonLoader variant="rounded" height={60} className="w-64" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="rounded" height={200} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Card skeleton loader
 */
export const CardSkeleton = () => (
  <div className="bg-primary-foreground/5 backdrop-blur-xl border border-primary-foreground/10 rounded-3xl p-6 space-y-4">
    <SkeletonLoader variant="rounded" height={40} className="w-3/4" />
    <SkeletonLoader variant="text" count={3} />
    <SkeletonLoader variant="rounded" height={100} />
  </div>
);

/**
 * Page loading skeleton – title placeholder + content block placeholders.
 * Use on white/background pages while data is loading.
 */
export const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-10 w-48 rounded-2xl animate-pulse bg-muted" />
      <div className="space-y-4">
        <div className="h-32 w-full rounded-2xl animate-pulse bg-muted" />
        <div className="h-32 w-full rounded-2xl animate-pulse bg-muted" />
        <div className="h-32 w-full rounded-2xl animate-pulse bg-muted" />
      </div>
    </div>
  </div>
);
