import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Droplets, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const DAILY_GOAL = 8;

interface WaterLog {
  glasses: number;
}

export function WaterReminder() {
  const { user } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [todayGlasses, setTodayGlasses] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkWaterAndRemind = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('water_logs')
        .select('glasses')
        .eq('user_id', user.id)
        .gte('logged_at', today.toISOString());

      const total = (data as WaterLog[] | null)?.reduce((sum, log) => sum + log.glasses, 0) || 0;
      setTodayGlasses(total);

      // Check last dismissal time
      const lastDismissed = localStorage.getItem('waterReminderDismissed');
      const now = Date.now();

      if (total < DAILY_GOAL) {
        if (!lastDismissed || now - parseInt(lastDismissed) > REMINDER_INTERVAL_MS) {
          // Only show between 8 AM and 10 PM
          const currentHour = new Date().getHours();
          if (currentHour >= 8 && currentHour < 22) {
            setShowReminder(true);
          }
        }
      }
    };

    // Initial check after 5 seconds
    const initialTimeout = setTimeout(checkWaterAndRemind, 5000);

    // Check every 30 minutes
    const interval = setInterval(checkWaterAndRemind, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user]);

  const dismissReminder = () => {
    localStorage.setItem('waterReminderDismissed', Date.now().toString());
    setShowReminder(false);
  };

  const getEncouragementMessage = () => {
    const remaining = DAILY_GOAL - todayGlasses;
    if (todayGlasses === 0) {
      return "Start your day with a glass of water! 💧";
    }
    if (remaining <= 2) {
      return `Almost there! Just ${remaining} more glass${remaining > 1 ? 'es' : ''} to go!`;
    }
    return `You've had ${todayGlasses} glass${todayGlasses > 1 ? 'es' : ''}. Keep hydrating! 💪`;
  };

  if (!showReminder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div 
        className={cn(
          "w-full max-w-sm bg-card rounded-2xl shadow-elevated border border-border p-5 pointer-events-auto",
          "animate-in slide-in-from-bottom-5 duration-300"
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Droplets className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-foreground">
              Time to hydrate! 💧
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {getEncouragementMessage()}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Staying hydrated helps with IBS symptoms.
            </p>
          </div>
          <button
            onClick={dismissReminder}
            className="p-2 rounded-xl hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={dismissReminder}
            className="flex-1"
          >
            Remind later
          </Button>
          <Button
            size="sm"
            onClick={() => {
              dismissReminder();
              // Scroll to top where water tracker is
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Log water
          </Button>
        </div>
      </div>
    </div>
  );
}