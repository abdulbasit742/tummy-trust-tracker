import React, { useState, useEffect, useMemo } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { calculateToleranceScores, shouldUsePersonalTolerance } from '@/lib/toleranceEngine';
import { FoodReference, FoodStatus, ToleranceData } from '@/types';
import { Search, X, Info, User, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FoodChecker() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodReference[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodReference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Fetch food reference
    const { data: foodData } = await supabase
      .from('food_reference')
      .select('*')
      .order('name');
    
    setFoods((foodData as FoodReference[]) || []);

    // Get personal tolerance data
    if (user) {
      const scores = await calculateToleranceScores(user.id);
      setToleranceData(scores);
    }
    
    setIsLoading(false);
  };

  const getStatusInfo = (foodName: string, defaultStatus: FoodStatus): { status: FoodStatus; isPersonal: boolean; tolerancePercent?: number } => {
    const personal = toleranceData.find(
      t => t.food_name.toLowerCase() === foodName.toLowerCase()
    );
    
    // Priority rule: use personal if >= 2 symptom logs
    if (shouldUsePersonalTolerance(personal)) {
      return { 
        status: personal!.status, 
        isPersonal: true,
        tolerancePercent: personal!.tolerance_percent
      };
    }
    
    return { status: defaultStatus, isPersonal: false };
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods.slice(0, 10);
    
    return foods.filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, foods]);

  const isCustomFood = searchQuery.trim().length >= 2 && 
    !foods.some(f => f.name.toLowerCase() === searchQuery.toLowerCase().trim());

  const handleFoodSelect = (food: FoodReference) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedFood(null);
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-5">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Food Checker
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Check if a food is safe for your IBS
          </p>
        </div>

        {/* Search with Autocomplete */}
        <div className="relative animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedFood(null);
            }}
            placeholder="Search foods (e.g. Rice, Daal)"
            className="pl-12 pr-12 h-14 text-lg rounded-xl bg-card border-border"
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

        {/* Custom Food Warning */}
        {isCustomFood && !selectedFood && (
          <div className="animate-scale-in">
            <div className="bg-caution/10 border border-caution/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-caution flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground text-sm">"{searchQuery}" not in database</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can still log this food. We'll track your reaction to help determine tolerance.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status="caution" size="sm" />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Database className="w-3 h-3" /> Default
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Food Detail */}
        {selectedFood && (
          <div className="animate-scale-in">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              {(() => {
                const { status, isPersonal, tolerancePercent } = getStatusInfo(selectedFood.name, selectedFood.default_status as FoodStatus);
                return (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h2 className="font-display text-xl font-bold text-foreground">
                        {selectedFood.name}
                      </h2>
                      <StatusBadge status={status} size="lg" />
                    </div>

                    {/* Personalized vs Default label */}
                    <div className="flex items-center gap-2 mb-3">
                      {isPersonal ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                          <User className="w-3 h-3" /> Personalized ({tolerancePercent}%)
                        </span>
                      ) : (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full flex items-center gap-1">
                          <Database className="w-3 h-3" /> Default
                        </span>
                      )}
                    </div>

                    <div className={cn(
                      "p-3 rounded-lg mb-3",
                      status === 'safe' && "bg-success/10",
                      status === 'caution' && "bg-caution/10",
                      status === 'avoid' && "bg-destructive/10",
                    )}>
                      <p className="text-foreground text-sm leading-relaxed">
                        {selectedFood.fodmap_note}
                      </p>
                    </div>

                    {isPersonal && (
                      <p className="text-xs text-muted-foreground">
                        Based on your logged reactions
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Food List / Autocomplete */}
        {!selectedFood && !isCustomFood && searchQuery.length >= 1 && (
          <div className="space-y-2 animate-fade-in">
            {filteredFoods.length > 0 ? (
              filteredFoods.slice(0, 8).map((food) => {
                const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                return (
                  <button
                    key={food.id}
                    onClick={() => handleFoodSelect(food)}
                    className="w-full text-left bg-card rounded-xl p-3 border border-border hover:shadow-soft transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground text-sm">{food.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {isPersonal ? '• Personal' : ''}
                        </span>
                      </div>
                      <StatusBadge status={status} size="sm" />
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                No foods found
              </p>
            )}
          </div>
        )}

        {/* Browse Foods (when empty search) */}
        {!selectedFood && !searchQuery && (
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Browse Foods ({foods.length})
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-card rounded-xl p-3 border border-border animate-pulse-soft">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {foods.slice(0, 10).map((food) => {
                  const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                  return (
                    <button
                      key={food.id}
                      onClick={() => handleFoodSelect(food)}
                      className="w-full text-left bg-card rounded-xl p-3 border border-border hover:shadow-soft transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground text-sm">{food.name}</span>
                          {isPersonal && (
                            <span className="text-xs text-primary ml-2">• Personal</span>
                          )}
                        </div>
                        <StatusBadge status={status} size="sm" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </MobileLayout>
  );
}
