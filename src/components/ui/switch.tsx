import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  loading?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, loading, disabled, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      // Base - iOS-like dimensions
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5",
      // Transition
      "transition-colors duration-200 ease-in-out",
      // States
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-200",
      "dark:data-[state=unchecked]:bg-gray-700",
      // Focus
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled/Loading
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Base
        "pointer-events-none block h-6 w-6 rounded-full bg-white",
        // Shadow
        "shadow-sm ring-1 ring-black/5",
        // Transition
        "transition-transform duration-200 ease-in-out",
        // Position
        "data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        // Loading spinner
        loading && "flex items-center justify-center"
      )}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));

Switch.displayName = "Switch";

export { Switch };
