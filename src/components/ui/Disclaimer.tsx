import React, { forwardRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DISCLAIMER_TEXT } from '@/data/constants';

interface DisclaimerProps {
  className?: string;
}

export const Disclaimer = forwardRef<HTMLDivElement, DisclaimerProps>(
  function Disclaimer({ className }, ref) {
    return (
      <div 
        ref={ref}
        className={cn(
          "flex items-start gap-3 p-3 bg-accent/50 rounded-xl border border-accent",
          className
        )}
      >
        <AlertTriangle className="w-4 h-4 text-accent-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-accent-foreground leading-relaxed">
          {DISCLAIMER_TEXT}
        </p>
      </div>
    );
  }
);
