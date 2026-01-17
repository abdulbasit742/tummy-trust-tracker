import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from './button';

interface TipContent {
  message: string;
  emoji: string;
  isCustom?: boolean;
}

const DEFAULT_TIPS: TipContent[] = [
  {
    message: "Every journey starts with one step. Track what you eat and you'll soon understand your body better!",
    emoji: "🌟"
  },
  {
    message: "With the right preventive measures, you can enjoy many foods with confidence. Don't worry!",
    emoji: "😊"
  },
  {
    message: "Consistent logging helps identify patterns. You're doing great - keep it up!",
    emoji: "💪"
  },
  {
    message: "Portion control and timing matter too. Small portions of trigger foods are often tolerated.",
    emoji: "🍽️"
  },
  {
    message: "Many IBS patients find that their triggers become clearer within weeks of tracking. Good news ahead!",
    emoji: "✨"
  },
  {
    message: "IBS is manageable. Your personal data will guide better food choices. Stay positive!",
    emoji: "🌈"
  },
  {
    message: "After a week of tracking, check your Insights to see your progress! You've got this!",
    emoji: "🎉"
  }
];

const getLocalStorageKey = (date: Date) => {
  return `tip-dismissed-${date.toISOString().split('T')[0]}`;
};

export function MotivationalTip() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<TipContent & { day?: number } | null>(null);

  useEffect(() => {
    if (!profile?.created_at) return;

    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const diffTime = now.getTime() - createdAt.getTime();
    const daysSinceJoined = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Check if already dismissed today
    const today = new Date();
    const dismissKey = getLocalStorageKey(today);
    const isDismissed = localStorage.getItem(dismissKey) === 'true';

    if (isDismissed) return;

    // Get custom tips from profile
    const customTips: TipContent[] = (profile.custom_tips || []).map(tip => ({
      message: tip,
      emoji: "💫",
      isCustom: true
    }));

    // During first 7 days: show default tip for that day, mixed with custom tips randomly
    if (daysSinceJoined < 7) {
      const tipIndex = Math.min(Math.max(daysSinceJoined, 0), 6);
      
      // 30% chance to show a custom tip if available, otherwise show default
      if (customTips.length > 0 && Math.random() < 0.3) {
        const randomCustom = customTips[Math.floor(Math.random() * customTips.length)];
        setCurrentTip({ ...randomCustom, day: daysSinceJoined + 1 });
      } else {
        setCurrentTip({ ...DEFAULT_TIPS[tipIndex], day: daysSinceJoined + 1 });
      }
      setIsVisible(true);
    } 
    // After 7 days: only show custom tips if available
    else if (customTips.length > 0) {
      const randomCustom = customTips[Math.floor(Math.random() * customTips.length)];
      setCurrentTip(randomCustom);
      setIsVisible(true);
    }
  }, [profile?.created_at, profile?.custom_tips]);

  const handleDismiss = () => {
    const today = new Date();
    const dismissKey = getLocalStorageKey(today);
    localStorage.setItem(dismissKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !currentTip) return null;

  return (
    <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-success/10 rounded-2xl border border-primary/20 p-5 shadow-soft animate-fade-in overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
            {currentTip.isCustom ? (
              <Sparkles className="w-4 h-4 text-primary" />
            ) : (
              <Lightbulb className="w-4 h-4 text-primary" />
            )}
          </div>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {currentTip.isCustom ? 'Your Tip' : currentTip.day ? `Day ${currentTip.day} Tip` : 'Daily Tip'}
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Dismiss tip"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <p className="text-lg font-semibold text-foreground mb-1">
          {currentTip.emoji} {currentTip.message.split('.')[0]}.
        </p>
        {currentTip.message.split('.').length > 1 && currentTip.message.split('.').slice(1).join('.').trim() && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentTip.message.split('.').slice(1).join('.').trim()}
          </p>
        )}
      </div>

      {/* Action button */}
      <div className="mt-4 relative z-10">
        <Button
          onClick={handleDismiss}
          variant="outline"
          size="sm"
          className="bg-card/80 border-primary/20 text-primary hover:bg-primary/10 font-medium"
        >
          Got it! 👍
        </Button>
      </div>
    </div>
  );
}
