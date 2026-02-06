import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";
import { hapticForSliderThreshold } from "@/lib/haptics";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, onValueChange, ...props }, ref) => {
  const lastValue = React.useRef<number | null>(null);

  const handleValueChange = React.useCallback((value: number[]) => {
    // Trigger haptic with threshold detection (0-10 scale thresholds)
    if (lastValue.current !== null && lastValue.current !== value[0]) {
      hapticForSliderThreshold(value[0], lastValue.current, [3, 5, 7]);
    }
    lastValue.current = value[0];
    onValueChange?.(value);
  }, [onValueChange]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-3",
        className
      )}
      onValueChange={handleValueChange}
      {...props}
    >
    <SliderPrimitive.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary transition-all duration-150" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        "block h-8 w-8 rounded-full border-[3px] border-primary bg-card shadow-elevated",
        "ring-offset-background transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:scale-105 active:scale-110 active:shadow-glow",
        "disabled:pointer-events-none disabled:opacity-50",
        "cursor-grab active:cursor-grabbing"
      )}
    />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
