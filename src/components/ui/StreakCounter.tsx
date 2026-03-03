import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay } from 'date-fns';

export function StreakCounter() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!user) return;

    const calculateStreak = async () => {
      // Fetch distinct dates with meal logs, ordered descending
      const { data, error } = await supabase
        .from('meal_logs')
        .select('eaten_at')
        .eq('user_id', user.id)
        .order('eaten_at', { ascending: false });

      if (error || !data || data.length === 0) {
        setStreak(0);
        return;
      }

      // Get unique logged dates (local timezone)
      const loggedDates = new Set(
        data.map((log) => format(new Date(log.eaten_at), 'yyyy-MM-dd'))
      );

      // Count consecutive days ending today or yesterday
      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

      let count = 0;
      let startFrom: Date;

      if (loggedDates.has(todayStr)) {
        startFrom = today;
      } else if (loggedDates.has(yesterdayStr)) {
        startFrom = subDays(today, 1);
      } else {
        setStreak(0);
        return;
      }

      for (let i = 0; i < 365; i++) {
        const checkDate = format(subDays(startFrom, i), 'yyyy-MM-dd');
        if (loggedDates.has(checkDate)) {
          count++;
        } else {
          break;
        }
      }

      setStreak(count);
      if (count > 0) {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 600);
      }
    };

    calculateStreak();
  }, [user]);

  const isHot = streak >= 7;
  const isWarm = streak >= 3;

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-2xl border p-4 shadow-soft transition-all",
      isHot
        ? "bg-gradient-to-r from-warning/10 to-destructive/10 border-warning/30"
        : isWarm
          ? "bg-warning/5 border-warning/20"
          : "bg-card border-border/80"
    )}>
      <motion.div
        animate={animate ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl",
          isHot
            ? "bg-gradient-to-br from-warning to-destructive"
            : isWarm
              ? "bg-warning/20"
              : "bg-muted"
        )}
      >
        <Flame className={cn(
          "w-5 h-5",
          isHot
            ? "text-primary-foreground"
            : isWarm
              ? "text-warning"
              : "text-muted-foreground"
        )} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={streak}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-display text-2xl font-bold text-foreground leading-none"
          >
            {streak}
          </motion.span>
          <span className="text-sm text-muted-foreground font-medium">
            {streak === 1 ? 'day' : 'days'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {streak === 0
            ? 'Log a meal to start your streak!'
            : isHot
              ? "You're on fire! Keep it up 🔥"
              : isWarm
                ? 'Great consistency!'
                : 'Logging streak'}
        </p>
      </div>

      {/* Mini streak dots for last 7 days */}
      <StreakDots streak={streak} />
    </div>
  );
}

function StreakDots({ streak }: { streak: number }) {
  const dots = Array.from({ length: 7 }, (_, i) => i < streak);

  return (
    <div className="flex gap-1">
      {dots.map((active, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
          className={cn(
            "w-2 h-2 rounded-full",
            active ? "bg-warning" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
