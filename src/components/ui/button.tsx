import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-pill bg-gradient-to-r from-coral-500 to-blush-200 text-white shadow-soft hover:shadow-hover hover:-translate-y-0.5",
        destructive:
          "rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline:
          "rounded-pill border-2 border-warm bg-transparent text-foreground shadow-soft hover:bg-accent/10 hover:border-plum-900/20",
        secondary:
          "rounded-pill border-2 border-plum-900/20 bg-transparent text-foreground hover:bg-accent/10 hover:border-plum-900/30",
        ghost: "rounded-pill hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Legacy variants mapped to BeyondRounds system
        hero: "rounded-pill bg-gradient-to-r from-coral-500 to-blush-200 text-white shadow-hover hover:shadow-modal hover:-translate-y-1 h-12 px-8 text-base font-semibold",
        heroOutline: "rounded-pill border-2 border-plum-900/30 bg-transparent text-foreground hover:bg-accent/10 hover:border-plum-900/40 h-12 px-8 text-base font-semibold",
        premium: "rounded-pill bg-accent/20 text-accent-foreground shadow-soft hover:bg-accent/30 hover:shadow-hover",
      },
      size: {
        default: "h-12 px-6 py-2.5", // 48px min height for mobile touch
        sm: "h-10 rounded-pill px-4 text-sm",
        lg: "h-14 rounded-pill px-10 text-base font-semibold",
        xl: "h-16 rounded-pill px-12 text-lg font-semibold",
        icon: "h-12 w-12 rounded-pill",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
