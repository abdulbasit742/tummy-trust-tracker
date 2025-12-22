import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Button } from '@/components/ui/button';
import { calculateToleranceScores } from '@/lib/toleranceEngine';
import { MealLog, ToleranceData } from '@/types';
import { Search, PlusCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    setIsLoading(false);
  };

  const safeFoods = toleranceData.filter(t => t.tolerance_percent >= 70).slice(0, 5);
  const triggerFoods = toleranceData.filter(t => t.tolerance_percent < 40).slice(0, 5);

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profile?.ibs_type && `Managing ${profile.ibs_type}`}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          <Button
            onClick={() => navigate('/food-checker')}
            className="h-auto py-4 flex flex-col items-center gap-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border-0"
          >
            <Search className="w-6 h-6" />
            <span className="font-semibold">Food Check</span>
          </Button>
          <Button
            onClick={() => navigate('/log-meal')}
            className="h-auto py-4 flex flex-col items-center gap-2 rounded-xl bg-success/10 text-success hover:bg-success/20 border-0"
          >
            <PlusCircle className="w-6 h-6" />
            <span className="font-semibold">Log Meal</span>
          </Button>
        </div>

        {/* Today's Meals */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Today's Meals
            </h2>
          </div>

          {isLoading ? (
            <div className="bg-card rounded-xl p-4 border border-border animate-pulse-soft">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          ) : todayMeals.length > 0 ? (
            <div className="bg-card rounded-xl p-4 border border-border space-y-3">
              {todayMeals.map((meal) => (
                <div 
                  key={meal.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <span className="font-medium text-foreground">{meal.food_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({meal.portion})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(meal.eaten_at), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-6 border border-border text-center">
              <p className="text-muted-foreground text-sm">No meals logged today</p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => navigate('/log-meal')}
              >
                Log your first meal
              </Button>
            </div>
          )}
        </div>

        {/* Top Safe Foods */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Top 5 Safe Foods
            </h2>
          </div>

          {safeFoods.length > 0 ? (
            <div className="bg-card rounded-xl p-4 border border-border space-y-3">
              {safeFoods.map((food) => (
                <div key={food.food_name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                    <span className="text-xs text-muted-foreground">{food.meal_count} logs</span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-muted-foreground text-sm">
                Log meals with symptoms to discover your safe foods
              </p>
            </div>
          )}
        </div>

        {/* Top Trigger Foods */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h2 className="font-display text-lg font-semibold text-foreground">
              Top 5 Triggers
            </h2>
          </div>

          {triggerFoods.length > 0 ? (
            <div className="bg-card rounded-xl p-4 border border-border space-y-3">
              {triggerFoods.map((food) => (
                <div key={food.food_name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                    <span className="text-xs text-muted-foreground">{food.meal_count} logs</span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 border border-border text-center">
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
