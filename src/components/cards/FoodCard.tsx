import React from 'react';
import { Food } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

interface FoodCardProps {
  food: Food;
  onClick?: () => void;
  className?: string;
}

export function FoodCard({ food, onClick, className }: FoodCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-2xl p-4 shadow-card border border-border transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-elevated hover:scale-[1.02] active:scale-[0.98]",
        "animate-fade-in",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-foreground truncate">
            {food.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {food.category}
          </p>
        </div>
        <StatusBadge status={food.defaultStatus} size="sm" />
      </div>
      
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {food.notes}
      </p>
      
      <div className="mt-3 flex items-center gap-2">
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full",
          food.fodmapLevel === 'low' && "bg-success/15 text-success",
          food.fodmapLevel === 'moderate' && "bg-caution/15 text-caution",
          food.fodmapLevel === 'high' && "bg-destructive/15 text-destructive",
        )}>
          {food.fodmapLevel.toUpperCase()} FODMAP
        </span>
      </div>
    </div>
  );
}
