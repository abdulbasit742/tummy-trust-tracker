import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/use-analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Droplets, Plus, Minus, Target, Sparkles } from 'lucide-react';
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
  const [countAnimation, setCountAnimation] = useState<'up' | 'down' | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const prevGlasses = useRef(0);

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

    // Visual + Haptic feedback based on progress
    if (amount > 0) {
      setCountAnimation('up');
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
      
      if (newTotal >= DAILY_GOAL && prevGlasses.current < DAILY_GOAL) {
        // Goal achievement - celebration!
        hapticCelebrate();
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      } else {
        // Progress haptic - intensity increases with count
        hapticCount(newTotal, DAILY_GOAL);
      }
    } else {
      setCountAnimation('down');
      hapticCount(newTotal, DAILY_GOAL);
    }
    
    // Clear animation after it plays
    setTimeout(() => setCountAnimation(null), 300);
    
    prevGlasses.current = todayGlasses;
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

      {/* Progress bar with animation */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out",
            isGoalMet ? "bg-primary animate-glow-pulse" : "bg-blue-500"
          )}
          style={{ 
            width: `${progressPercent}%`,
            '--progress-width': `${progressPercent}%`
          } as React.CSSProperties}
        />
        {/* Shimmer effect on progress */}
        {progressPercent > 0 && progressPercent < 100 && (
          <div 
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
      </div>

      {/* Counter with animations */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => addWater(-1)}
          disabled={todayGlasses === 0 || isUpdating}
          className="h-12 w-12 rounded-xl transition-transform active:scale-90"
        >
          <Minus className="w-5 h-5" />
        </Button>

        <div className="text-center relative">
          {/* Celebration particles */}
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none">
              <Sparkles className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 text-primary animate-bounce-subtle" />
              <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-primary animate-pop" style={{ animationDelay: '0.1s' }} />
              <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-success animate-pop" style={{ animationDelay: '0.2s' }} />
              <div className="absolute bottom-0 left-1/4 w-1.5 h-1.5 rounded-full bg-caution animate-pop" style={{ animationDelay: '0.15s' }} />
              <div className="absolute bottom-0 right-1/4 w-1.5 h-1.5 rounded-full bg-primary animate-pop" style={{ animationDelay: '0.25s' }} />
            </div>
          )}
          
          <div className="overflow-hidden">
            <span className={cn(
              "font-display text-4xl font-bold inline-block transition-all duration-300",
              isGoalMet ? "text-primary" : "text-foreground",
              showCelebration && "animate-celebrate",
              countAnimation === 'up' && "animate-count-up",
              countAnimation === 'down' && "animate-count-down"
            )}>
              {todayGlasses}
            </span>
          </div>
          <span className="text-lg text-muted-foreground font-medium">/{DAILY_GOAL}</span>
          <p className="text-xs text-muted-foreground mt-1">{t('water.glasses')} today</p>
        </div>

        <div className="relative">
          {/* Ripple effect */}
          {showRipple && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-primary/30 animate-ripple" />
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => addWater(1)}
            disabled={isUpdating}
            className={cn(
              "h-12 w-12 rounded-xl transition-transform active:scale-90",
              !isGoalMet && "border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
            )}
          >
            <Plus className={cn(
              "w-5 h-5 transition-transform",
              showRipple && "animate-pop"
            )} />
          </Button>
        </div>
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
