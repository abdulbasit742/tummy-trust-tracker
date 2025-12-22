import React from 'react';
import { ToleranceScore } from '@/types';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { cn } from '@/lib/utils';

interface ToleranceCardProps {
  tolerance: ToleranceScore;
  className?: string;
}

export function ToleranceCard({ tolerance, className }: ToleranceCardProps) {
  const getStatusColor = (score: number) => {
    if (score >= 70) return 'border-l-success';
    if (score >= 40) return 'border-l-caution';
    return 'border-l-destructive';
  };

  return (
    <div className={cn(
      "bg-card rounded-2xl p-4 shadow-card border border-border border-l-4 animate-fade-in",
      getStatusColor(tolerance.score),
      className
    )}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="font-display font-semibold text-lg text-foreground">
          {tolerance.foodName}
        </h3>
        <span className="text-xs text-muted-foreground">
          {tolerance.reactionCount} logs
        </span>
      </div>
      
      <ToleranceBar score={tolerance.score} size="md" />
    </div>
  );
}
