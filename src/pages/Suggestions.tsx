import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { MealSuggestionCard } from '@/components/cards/MealSuggestionCard';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { MEAL_SUGGESTIONS } from '@/data/mockData';
import { Sunrise, Sun, Moon, Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

type MealType = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';

const mealTypes = [
  { value: 'all', label: 'All', icon: null },
  { value: 'breakfast', label: 'Breakfast', icon: Sunrise },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snack', label: 'Snacks', icon: Cookie },
] as const;

export default function Suggestions() {
  const [selectedType, setSelectedType] = useState<MealType>('all');

  const filteredMeals = MEAL_SUGGESTIONS
    .filter(meal => selectedType === 'all' || meal.mealType === selectedType)
    .sort((a, b) => b.toleranceScore - a.toleranceScore);

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="w-4 h-4" />;
      case 'lunch': return <Sun className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      case 'snack': return <Cookie className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Meal Ideas
          </h1>
          <p className="text-muted-foreground mt-1">
            Safe meals based on your tolerance
          </p>
        </div>

        {/* Meal Type Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide animate-slide-up">
          {mealTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 font-medium text-sm",
                  selectedType === type.value
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/50"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Meal Suggestions */}
        <div className="space-y-4">
          {selectedType !== 'all' && (
            <div className="flex items-center gap-2 text-muted-foreground animate-fade-in">
              {getMealIcon(selectedType)}
              <span className="font-display font-semibold capitalize">
                {selectedType} Ideas
              </span>
            </div>
          )}

          {filteredMeals.length > 0 ? (
            <div className="space-y-3">
              {filteredMeals.map((meal, index) => (
                <div 
                  key={meal.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {selectedType === 'all' && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm">
                      {getMealIcon(meal.mealType)}
                      <span className="capitalize font-medium">{meal.mealType}</span>
                    </div>
                  )}
                  <MealSuggestionCard meal={meal} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center animate-fade-in">
              <p className="text-muted-foreground">
                No meal suggestions available for this category yet.
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <Disclaimer compact />
      </div>
    </MobileLayout>
  );
}
