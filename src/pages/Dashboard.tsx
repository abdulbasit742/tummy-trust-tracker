import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { GrowthBanner, WelcomeCard } from '@/components/ui/FreeAccessBanner';
import { ShareButton } from '@/components/ui/ShareButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardSkeleton, CardSkeleton, FoodListSkeleton } from '@/components/ui/skeletons';
import { calculateToleranceScores, shouldUsePersonalTolerance } from '@/lib/toleranceEngine';
import { getDisplayNameWithUrdu, searchFoods, getFoodDisplayName } from '@/lib/utils/foodUtils';
import { MealLog, ToleranceData, FoodReference, FoodStatus } from '@/types';
import { Search, PlusCircle, TrendingUp, TrendingDown, Calendar, Database, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [foods, setFoods] = useState<FoodReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Starter foods search
  const [foodSearch, setFoodSearch] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);

    // Fetch today's meals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('eaten_at', today.toISOString())
      .order('eaten_at', { ascending: false });

    setTodayMeals((meals as MealLog[]) || []);

    // Calculate tolerance scores
    const scores = await calculateToleranceScores(user.id);
    setToleranceData(scores);

    // Fetch food reference
    const { data: foodData } = await supabase
      .from('food_reference')
      .select('*')
      .order('name');
    setFoods((foodData as FoodReference[]) || []);

    setIsLoading(false);
  };

  const getStatusInfo = (foodName: string, defaultStatus: FoodStatus): { status: FoodStatus; isPersonal: boolean } => {
    const personal = toleranceData.find(
      t => t.food_name.toLowerCase() === foodName.toLowerCase()
    );
    
    if (shouldUsePersonalTolerance(personal)) {
      return { status: personal!.status, isPersonal: true };
    }
    
    return { status: defaultStatus, isPersonal: false };
  };

  // Only show foods with >= 2 symptom logs (enough data for reliable insight)
  const validTolerance = toleranceData.filter(t => t.symptom_log_count >= 2);
  const safeFoods = validTolerance.filter(t => t.tolerance_percent >= 70).slice(0, 5);
  const triggerFoods = validTolerance.filter(t => t.tolerance_percent < 40).slice(0, 5);

  // Use bilingual search
  const filteredFoods = foodSearch.trim()
    ? searchFoods(foodSearch, foods).slice(0, 6)
    : [];

  if (isLoading) {
    return (
      <MobileLayout>
        <DashboardSkeleton />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-5">
        {/* Welcome Card for first-time users */}
        <WelcomeCard />
        
        {/* Growth Banner */}
        <GrowthBanner />

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile?.ibs_type && `Managing ${profile.ibs_type}`}
            </p>
          </div>
          <ShareButton variant="icon" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <Button
            onClick={() => navigate('/food-checker')}
            className="quick-action-card bg-primary/8 text-primary hover:bg-primary/12"
          >
            <Search className="w-6 h-6" />
            <span className="font-semibold text-sm">Food Check</span>
          </Button>
          <Button
            onClick={() => navigate('/log-meal')}
            className="quick-action-card bg-success/8 text-success hover:bg-success/12"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="font-semibold text-sm">Log Meal</span>
          </Button>
        </div>

        {/* Starter Foods Search */}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              Starter Foods ({foods.length})
            </h2>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="Search: Rice, چاول, chawal"
              className="pl-10 pr-10 h-12 rounded-xl bg-card border-border text-sm"
              dir="auto"
            />
            {foodSearch && (
              <button
                onClick={() => setFoodSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search Results */}
          {filteredFoods.length > 0 && (
            <div className="mt-3 bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-soft">
              {filteredFoods.map((food) => {
                const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                return (
                  <div 
                    key={food.id}
                    className="list-item"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm" dir="auto">
                        {getFoodDisplayName(food)}
                      </span>
                      {isPersonal && (
                        <span className="text-xs text-primary ml-2">• Personal</span>
                      )}
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Meals */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              Today's Meals
            </h2>
          </div>

          {isLoading ? (
            <FoodListSkeleton count={2} />
          ) : todayMeals.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-soft">
              {todayMeals.map((meal) => (
                <div 
                  key={meal.id}
                  className="list-item"
                >
                  <div>
                    <span className="font-medium text-foreground text-sm" dir="auto">
                      {getDisplayNameWithUrdu(meal.food_name, foods)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">({meal.portion})</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {format(new Date(meal.eaten_at), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted-foreground text-sm">No meals logged today</p>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                Log meals consistently for better insights.
              </p>
              <Button 
                variant="link" 
                className="mt-2 text-primary text-sm p-0 h-auto font-semibold"
                onClick={() => navigate('/log-meal')}
              >
                Log your first meal
              </Button>
            </div>
          )}
        </div>

        {/* Top Safe Foods */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <TrendingUp className="w-4 h-4 text-success" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              Top 5 Safe Foods
            </h2>
          </div>

          {safeFoods.length > 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-4 shadow-soft">
              {safeFoods.map((food) => (
                <div key={food.food_name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm" dir="auto">
                      {getDisplayNameWithUrdu(food.food_name, foods)}
                    </span>
                    <span className="text-xs text-muted-foreground">{food.meal_count} logs</span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log meals with symptoms to discover your safe foods.
              </p>
              <p className="text-primary/70 text-xs mt-2">
                The more you log, the clearer your triggers become.
              </p>
            </div>
          )}
        </div>

        {/* Top Trigger Foods */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <h2 className="font-display text-sm font-semibold text-foreground">
              Top 5 Triggers
            </h2>
          </div>

          {triggerFoods.length > 0 ? (
            <div className="bg-card rounded-2xl p-4 border border-border space-y-4 shadow-soft">
              {triggerFoods.map((food) => (
                <div key={food.food_name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm" dir="auto">
                      {getDisplayNameWithUrdu(food.food_name, foods)}
                    </span>
                    <span className="text-xs text-muted-foreground">{food.meal_count} logs</span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted-foreground text-sm">
                No trigger foods identified yet
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </MobileLayout>
  );
}
