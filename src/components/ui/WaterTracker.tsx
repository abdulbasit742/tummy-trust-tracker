import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/use-analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Plus, Minus, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticCelebrate, hapticCount } from '@/lib/haptics';

const DAILY_GOAL = 8; // 8 glasses recommended

interface WaterLog {
  id: string;
  user_id: string;
  glasses: number;
  logged_at: string;
  created_at: string;
}

export function WaterTracker() {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [todayGlasses, setTodayGlasses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadTodayWater = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('water_logs')
      .select('glasses')
      .eq('user_id', user.id)
      .gte('logged_at', today.toISOString());

    const total = (data as WaterLog[] | null)?.reduce((sum, log) => sum + log.glasses, 0) || 0;
    setTodayGlasses(total);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadTodayWater();
  }, [loadTodayWater]);

  const addWater = async (amount: number) => {
    if (!user || isUpdating) return;
    
    const newTotal = Math.max(0, todayGlasses + amount);
    if (amount < 0 && todayGlasses === 0) return;

    // Haptic feedback based on progress
    if (amount > 0) {
      if (newTotal >= DAILY_GOAL && todayGlasses < DAILY_GOAL) {
        // Goal achievement - celebration haptic!
        hapticCelebrate();
      } else {
        // Progress haptic - intensity increases with count
        hapticCount(newTotal, DAILY_GOAL);
      }
    } else {
      hapticCount(newTotal, DAILY_GOAL);
    }

    setIsUpdating(true);
    setTodayGlasses(newTotal);

    if (amount > 0) {
      const { error } = await supabase
        .from('water_logs')
        .insert({
          user_id: user.id,
          glasses: amount,
          logged_at: new Date().toISOString(),
        });

      if (error) {
        setTodayGlasses(todayGlasses);
        toast({
          title: t('common.error'),
          description: "Failed to log water",
          variant: "destructive",
        });
      } else {
        trackEvent({ eventType: 'water_logged', metadata: { glasses: amount, total: newTotal } });
        
        if (newTotal >= DAILY_GOAL && todayGlasses < DAILY_GOAL) {
          toast({
            title: "🎉 " + t('water.goal') + "!",
            description: t('water.hydrationReminder'),
          });
        }
      }
    } else {
      // For removing, delete the most recent log
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('water_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString())
        .order('logged_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        await supabase.from('water_logs').delete().eq('id', data[0].id);
      }
    }

    setIsUpdating(false);
  };

  const progressPercent = Math.min((todayGlasses / DAILY_GOAL) * 100, 100);
  const isGoalMet = todayGlasses >= DAILY_GOAL;

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 border shadow-soft transition-all",
      isGoalMet ? "border-primary/30 bg-primary/5" : "border-border"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isGoalMet ? "bg-primary/15" : "bg-blue-500/10"
          )}>
            <Droplets className={cn("w-5 h-5", isGoalMet ? "text-primary" : "text-blue-500")} />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">{t('water.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('water.dailyGoal')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{DAILY_GOAL} {t('water.glasses')}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
            isGoalMet ? "bg-primary" : "bg-blue-500"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => addWater(-1)}
          disabled={todayGlasses === 0 || isUpdating}
          className="h-12 w-12 rounded-xl"
        >
          <Minus className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <span className={cn(
            "font-display text-4xl font-bold",
            isGoalMet ? "text-primary" : "text-foreground"
          )}>
            {todayGlasses}
          </span>
          <span className="text-lg text-muted-foreground font-medium">/{DAILY_GOAL}</span>
          <p className="text-xs text-muted-foreground mt-1">{t('water.glasses')} today</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => addWater(1)}
          disabled={isUpdating}
          className={cn(
            "h-12 w-12 rounded-xl",
            !isGoalMet && "border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
          )}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Encouragement message */}
      {todayGlasses > 0 && todayGlasses < DAILY_GOAL && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          {DAILY_GOAL - todayGlasses} more {DAILY_GOAL - todayGlasses > 1 ? t('water.glasses') : t('water.glass')} to reach your goal! 💪
        </p>
      )}

      {isGoalMet && (
        <p className="text-center text-xs text-primary font-medium mt-4">
          🎉 {t('water.hydrationReminder')}
        </p>
      )}
    </div>
  );
}
