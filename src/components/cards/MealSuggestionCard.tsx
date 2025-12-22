import React from 'react';
import { MealSuggestion } from '@/types';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { cn } from '@/lib/utils';

interface MealSuggestionCardProps {
  meal: MealSuggestion;
  className?: string;
}

export function MealSuggestionCard({ meal, className }: MealSuggestionCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-4 shadow-card border border-border animate-fade-in",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-foreground">
            {meal.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meal.description}
          </p>
        </div>
      </div>
      
      <div className="mt-3 flex flex-wrap gap-1.5">
        {meal.ingredients.map((ingredient, index) => (
          <span
            key={index}
            className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
          >
            {ingredient}
          </span>
        ))}
      </div>
      
      <div className="mt-4">
        <ToleranceBar score={meal.toleranceScore} size="sm" />
      </div>
    </div>
  );
}
