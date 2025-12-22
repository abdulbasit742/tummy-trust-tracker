import React, { useState, useMemo } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { FoodCard } from '@/components/cards/FoodCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Input } from '@/components/ui/input';
import { FOODS_DATABASE } from '@/data/mockData';
import { useUser } from '@/contexts/UserContext';
import { Food, FoodStatus } from '@/types';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FoodChecker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const { toleranceScores } = useUser();

  const getPersonalStatus = (food: Food): FoodStatus => {
    const personalScore = toleranceScores.find(
      s => s.foodName.toLowerCase() === food.name.toLowerCase()
    );
    
    if (personalScore) {
      if (personalScore.score >= 70) return 'recommended';
      if (personalScore.score >= 40) return 'caution';
      return 'avoid';
    }
    
    return food.defaultStatus;
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return FOODS_DATABASE.slice(0, 6);
    
    return FOODS_DATABASE.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedFood(null);
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Food Checker
          </h1>
          <p className="text-muted-foreground mt-1">
            Check if a food is safe for your IBS
          </p>
        </div>

        {/* Search */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedFood(null);
            }}
            placeholder="Search for a food..."
            className="pl-12 pr-12 h-14 text-lg rounded-2xl bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Selected Food Detail */}
        {selectedFood && (
          <div className="animate-scale-in">
            <div className="bg-card rounded-2xl p-5 shadow-elevated border border-border">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {selectedFood.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedFood.category}
                  </p>
                </div>
                <StatusBadge status={getPersonalStatus(selectedFood)} size="lg" />
              </div>

              <div className={cn(
                "p-4 rounded-xl mb-4",
                getPersonalStatus(selectedFood) === 'recommended' && "bg-success/10",
                getPersonalStatus(selectedFood) === 'caution' && "bg-caution/10",
                getPersonalStatus(selectedFood) === 'avoid' && "bg-destructive/10",
              )}>
                <p className="text-foreground leading-relaxed">
                  {selectedFood.notes}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-medium px-3 py-1 rounded-full",
                  selectedFood.fodmapLevel === 'low' && "bg-success/15 text-success",
                  selectedFood.fodmapLevel === 'moderate' && "bg-caution/15 text-caution",
                  selectedFood.fodmapLevel === 'high' && "bg-destructive/15 text-destructive",
                )}>
                  {selectedFood.fodmapLevel.toUpperCase()} FODMAP
                </span>
              </div>

              {toleranceScores.find(s => s.foodName.toLowerCase() === selectedFood.name.toLowerCase()) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    📊 Based on your personal reaction history
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Food List */}
        {!selectedFood && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-muted-foreground text-sm uppercase tracking-wide">
              {searchQuery ? 'Search Results' : 'Popular Foods'}
            </h3>
            
            {filteredFoods.length > 0 ? (
              <div className="space-y-3">
                {filteredFoods.map((food, index) => (
                  <div 
                    key={food.id} 
                    style={{ animationDelay: `${index * 0.05}s` }}
                    className="animate-fade-in"
                  >
                    <FoodCard
                      food={{ ...food, defaultStatus: getPersonalStatus(food) }}
                      onClick={() => handleFoodSelect(food)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
                <p className="text-muted-foreground">
                  No foods found matching "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Disclaimer compact />
      </div>
    </MobileLayout>
  );
}
