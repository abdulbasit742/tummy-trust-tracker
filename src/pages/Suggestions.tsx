import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Button } from '@/components/ui/button';
import { calculateToleranceScores } from '@/lib/toleranceEngine';
import { FoodReference, ToleranceData } from '@/types';
import { Utensils, Sunrise, Sun, Moon, RefreshCw } from 'lucide-react';

interface MealSuggestion {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  foods: string[];
}

export default function Suggestions() {
  const { user } = useAuth();
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [defaultSafeFoods, setDefaultSafeFoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadData();
  }, [user, refreshKey]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Get default safe foods from food_reference
    const { data: foods } = await supabase
      .from('food_reference')
      .select('name')
      .eq('default_status', 'safe');
    
    setDefaultSafeFoods((foods?.map(f => f.name) || []));

    // Get personal tolerance data
    if (user) {
      const scores = await calculateToleranceScores(user.id);
      setToleranceData(scores);
    }
    
    setIsLoading(false);
  };

  const safeFoods = useMemo(() => {
    // Use personal safe foods (tolerance >= 70 with >=2 logs) or fallback to default
    const personalSafe = toleranceData
      .filter(t => t.tolerance_percent >= 70 && t.symptom_log_count >= 2)
      .map(t => t.food_name);
    
    if (personalSafe.length >= 3) {
      return personalSafe;
    }
    
    // Fallback to default safe foods
    return defaultSafeFoods;
  }, [toleranceData, defaultSafeFoods]);

  const suggestions: MealSuggestion[] = useMemo(() => {
    if (safeFoods.length === 0) return [];

    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const shuffled = shuffle(safeFoods);

    // Simple templates: pick random safe foods for each meal
    return [
      { mealType: 'breakfast', foods: shuffled.slice(0, 2) },
      { mealType: 'lunch', foods: shuffled.slice(2, 5).length >= 2 ? shuffled.slice(2, 5) : shuffled.slice(0, 3) },
      { mealType: 'dinner', foods: shuffled.length > 5 ? shuffled.slice(5, 8) : shuffled.slice(0, 3) },
    ];
  }, [safeFoods, refreshKey]);

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      default: return null;
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'text-caution bg-caution/10';
      case 'lunch': return 'text-primary bg-primary/10';
      case 'dinner': return 'text-accent-foreground bg-accent';
      default: return '';
    }
  };

  const hasPersonalData = toleranceData.filter(t => t.tolerance_percent >= 70 && t.symptom_log_count >= 2).length >= 3;

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Daily Suggestions
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {hasPersonalData ? 'Based on your safe foods' : 'Based on default safe foods'}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRefreshKey(k => k + 1)}
            className="rounded-xl"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse-soft">
                <div className="h-6 bg-muted rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : safeFoods.length === 0 ? (
          <div className="bg-card rounded-xl p-6 border border-border text-center animate-fade-in">
            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display font-semibold text-foreground mb-2">
              No safe foods yet
            </h3>
            <p className="text-muted-foreground text-sm">
              Log meals with symptoms to discover your safe foods.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div 
                key={suggestion.mealType}
                className="bg-card rounded-xl p-4 border border-border animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMealColor(suggestion.mealType)}`}>
                    {getMealIcon(suggestion.mealType)}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground capitalize">
                    {suggestion.mealType}
                  </h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {suggestion.foods.filter(f => f).map((food, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-success/10 text-success text-sm font-medium rounded-full"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Personal foods indicator */}
            <p className="text-xs text-muted-foreground text-center">
              {hasPersonalData 
                ? `✨ Based on your ${toleranceData.filter(t => t.tolerance_percent >= 70).length} personal safe foods`
                : `📚 Using ${defaultSafeFoods.length} default safe foods`
              }
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </MobileLayout>
  );
}
