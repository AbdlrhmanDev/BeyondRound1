import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-[0_4px_20px_-4px_hsl(220_25%_15%/0.08)] hover:shadow-[0_8px_30px_-8px_hsl(220_25%_15%/0.12)] rounded-2xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-2xl",
        outline: "border border-input/50 bg-transparent hover:bg-accent/10 hover:border-input rounded-2xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl",
        ghost: "bg-transparent hover:bg-accent/10 hover:text-accent-foreground rounded-2xl",
        link: "bg-transparent text-primary underline-offset-4 hover:underline rounded-2xl",
        hero: "bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-[0_8px_25px_-6px_hsl(35_85%_45%/0.35)] hover:shadow-[0_20px_50px_-15px_hsl(220_25%_15%/0.15)] font-semibold rounded-2xl",
        heroOutline: "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:text-primary font-semibold rounded-2xl",
        premium: "bg-foreground text-background hover:bg-foreground/90 shadow-[0_8px_30px_-8px_hsl(220_25%_15%/0.12)] hover:shadow-[0_20px_50px_-15px_hsl(220_25%_15%/0.15)] font-semibold rounded-2xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-2xl px-3",
        lg: "h-12 px-6 text-base rounded-2xl",
        xl: "h-14 px-8 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-2xl",
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
