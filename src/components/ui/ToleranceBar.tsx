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

  const getBackgroundColor = (score: number) => {
    if (score >= 70) return 'bg-success/12';
    if (score >= 40) return 'bg-caution/12';
    return 'bg-destructive/12';
  };

  const getLabel = (score: number) => {
    if (score >= 70) return 'Safe';
    if (score >= 40) return 'Caution';
    return 'Avoid';
  };

  const getTextColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-caution';
    return 'text-destructive';
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-xs font-semibold", getTextColor(score))}>
            {getLabel(score)}
          </span>
          <span className={cn("text-xs font-bold", getTextColor(score))}>
            {score}%
          </span>
        </div>
      )}
      <div className={cn(
        "w-full rounded-full overflow-hidden",
        getBackgroundColor(score),
        size === 'sm' ? 'h-2' : 'h-2.5'
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getColor(score)
          )}
          style={{ width: `${Math.max(score, 3)}%` }}
        />
      </div>
    </div>
  );
}
