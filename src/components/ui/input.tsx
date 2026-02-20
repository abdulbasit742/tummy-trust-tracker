import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-13 w-full rounded-xl border border-input bg-card px-4 py-3.5 text-base",
          "ring-offset-background transition-all duration-150",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0 focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_hsl(var(--ring)/0.12)]",
          "hover:border-primary/35 hover:shadow-soft hover:bg-card/80",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
