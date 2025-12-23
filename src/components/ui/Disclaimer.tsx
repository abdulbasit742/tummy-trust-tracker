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
        ? "p-4 bg-muted/40 border-border/60" 
        : "p-3 bg-muted/30 border-border/40",
      className
    )}>
      <div className={cn(
        "rounded-xl flex items-center justify-center flex-shrink-0",
        variant === 'default' ? "w-9 h-9 bg-muted/80" : "w-7 h-7 bg-muted/60"
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
