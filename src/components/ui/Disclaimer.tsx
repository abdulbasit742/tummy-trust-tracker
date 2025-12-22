import React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function Disclaimer({ className, compact = false }: DisclaimerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 bg-accent/50 rounded-xl border border-accent",
      compact && "p-3",
      className
    )}>
      <Info className={cn(
        "text-accent-foreground flex-shrink-0 mt-0.5",
        compact ? "w-4 h-4" : "w-5 h-5"
      )} />
      <p className={cn(
        "text-accent-foreground leading-relaxed",
        compact ? "text-xs" : "text-sm"
      )}>
        {compact 
          ? "Educational tool only. Not medical advice."
          : "This app is an educational tool to help you understand and track your diet. It does not provide medical diagnoses or replace professional healthcare advice. Always consult your doctor before making significant dietary changes."
        }
      </p>
    </div>
  );
}
