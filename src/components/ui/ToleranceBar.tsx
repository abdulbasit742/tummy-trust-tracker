import React from 'react';
import { cn } from '@/lib/utils';

interface ToleranceBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ToleranceBar({ score, showLabel = true, size = 'md', className }: ToleranceBarProps) {
  const getColor = (score: number) => {
    if (score >= 70) return 'bg-success';
    if (score >= 40) return 'bg-caution';
    return 'bg-destructive';
  };

  const getLabel = (score: number) => {
    if (score >= 70) return 'Safe';
    if (score >= 40) return 'Caution';
    return 'Avoid';
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {getLabel(score)}
          </span>
          <span className="text-xs font-bold text-foreground">
            {score}%
          </span>
        </div>
      )}
      <div className={cn(
        "w-full bg-muted rounded-full overflow-hidden",
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getColor(score)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
