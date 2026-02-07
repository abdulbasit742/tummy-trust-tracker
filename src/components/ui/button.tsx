import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { hapticImpact } from "@/lib/haptics";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-soft hover:shadow-card hover:bg-primary/92 active:shadow-soft",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/92",
        outline: "border-2 border-border bg-card hover:bg-accent hover:text-accent-foreground hover:border-primary/35 active:bg-accent/80",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/85 active:bg-secondary/70",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground active:bg-accent",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground shadow-soft hover:bg-success/92 active:shadow-soft",
        caution: "bg-caution text-caution-foreground shadow-soft hover:bg-caution/92 active:shadow-soft",
      },
      size: {
        default: "h-12 px-5 py-2.5",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-base font-semibold",
        icon: "h-11 w-11 rounded-xl",
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
  haptic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, haptic = true, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (haptic) {
          hapticImpact();
        }
        onClick?.(e);
      },
      [haptic, onClick]
    );
    
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        onClick={handleClick}
        {...props} 
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
