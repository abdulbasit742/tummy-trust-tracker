import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Button } from '@/components/ui/button';
import { calculateToleranceScores } from '@/lib/toleranceEngine';
import { MealLog, SymptomLog, ToleranceData } from '@/types';
import { User, LogOut, Trash2, Edit2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MealWithSymptoms extends MealLog {
  symptom_logs?: SymptomLog[];
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [mealLogs, setMealLogs] = useState<MealWithSymptoms[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);

    // Fetch meal logs with symptoms
    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('eaten_at', { ascending: false });

    if (meals) {
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .in('meal_log_id', meals.map(m => m.id));

      const mealsWithSymptoms = meals.map(meal => ({
        ...meal,
        symptom_logs: symptoms?.filter(s => s.meal_log_id === meal.id) || [],
      }));
      
      setMealLogs(mealsWithSymptoms as MealWithSymptoms[]);
    }

    // Get tolerance data
    const scores = await calculateToleranceScores(user.id);
    setToleranceData(scores);

    setIsLoading(false);
  };

  const handleDeleteMeal = async (mealId: string) => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (error) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Meal log removed.",
    });
    
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayedLogs = showAllLogs ? mealLogs : mealLogs.slice(0, 5);

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Profile
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.email}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="bg-card rounded-xl p-4 border border-border animate-slide-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 gradient-calm rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{profile.ibs_type}</p>
                <p className="text-sm text-muted-foreground capitalize">{profile.severity} severity</p>
              </div>
            </div>
            
            {profile.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.symptoms.slice(0, 4).map((symptom) => (
                  <span 
                    key={symptom}
                    className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full capitalize"
                  >
                    {symptom}
                  </span>
                ))}
                {profile.symptoms.length > 4 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    +{profile.symptoms.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Personal Tolerance */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Personal Tolerance
          </h2>

          {toleranceData.length > 0 ? (
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {toleranceData.slice(0, 8).map((food) => (
                <div key={food.food_name} className="p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {food.meal_count} {food.meal_count === 1 ? 'log' : 'logs'}
                    </span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-muted-foreground text-sm">
                Log meals with symptoms to build your tolerance profile
              </p>
            </div>
          )}
        </div>

        {/* Meal History */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Meal History
          </h2>

          {isLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse-soft">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : mealLogs.length > 0 ? (
            <div className="space-y-2">
              {displayedLogs.map((meal) => (
                <div 
                  key={meal.id}
                  className="bg-card rounded-xl p-3 border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm truncate">{meal.food_name}</span>
                        <span className="text-xs text-muted-foreground">({meal.portion})</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(meal.eaten_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {meal.symptom_logs && meal.symptom_logs.length > 0 && (
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          meal.symptom_logs[0].bloating_0_10 + meal.symptom_logs[0].pain_0_10 <= 4 
                            ? "bg-success/15 text-success" 
                            : meal.symptom_logs[0].bloating_0_10 + meal.symptom_logs[0].pain_0_10 <= 10
                            ? "bg-caution/15 text-caution"
                            : "bg-destructive/15 text-destructive"
                        )}>
                          B:{meal.symptom_logs[0].bloating_0_10} P:{meal.symptom_logs[0].pain_0_10}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {mealLogs.length > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="w-full text-muted-foreground"
                >
                  {showAllLogs ? 'Show less' : `Show all ${mealLogs.length} logs`}
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-1 transition-transform",
                    showAllLogs && "rotate-90"
                  )} />
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-muted-foreground text-sm">No meal logs yet</p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </MobileLayout>
  );
}
