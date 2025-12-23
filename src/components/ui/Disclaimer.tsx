import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DISCLAIMER_TEXT } from '@/data/constants';

interface DisclaimerProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function Disclaimer({ className, variant = 'default' }: DisclaimerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-2xl border transition-colors",
      variant === 'default' 
        ? "p-4 bg-muted/50 border-border" 
        : "p-3 bg-muted/30 border-border/50",
      className
    )}>
      <div className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        variant === 'default' ? "w-8 h-8 bg-muted" : "w-6 h-6 bg-muted/50"
      )}>
        <Info className={cn(
          "text-muted-foreground",
          variant === 'default' ? "w-4 h-4" : "w-3.5 h-3.5"
        )} />
      </div>
      <p className={cn(
        "text-muted-foreground leading-relaxed",
        variant === 'default' ? "text-xs" : "text-[11px]"
      )}>
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
