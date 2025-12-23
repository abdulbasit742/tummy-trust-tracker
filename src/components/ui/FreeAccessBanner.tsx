import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Sprout, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FreeAccessBannerProps {
  storageKey?: string;
}

// Dashboard growth banner (smaller, dismissible)
export function GrowthBanner({ storageKey = 'growth-banner-dismissed' }: FreeAccessBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    setIsDismissed(dismissed === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-success/6 via-primary/4 to-success/6 rounded-2xl p-4 border border-success/15 animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(160_55%_42%/0.06),transparent_50%)]" />
      <div className="relative flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
          <Sprout className="w-5 h-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold">
            6 Months Free Access
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
            Full features for early users — no payment needed.
          </p>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs h-9 px-4 hover:bg-success/10 text-success font-semibold"
        >
          Got it
        </Button>
      </div>
    </div>
  );
}

// Welcome card for first-time users (after onboarding)
export function WelcomeCard({ storageKey = 'welcome-card-dismissed' }: FreeAccessBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    setIsDismissed(dismissed === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden bg-card rounded-2xl p-5 border border-primary/15 shadow-card animate-fade-in">
      <div className="absolute inset-0 gradient-hero" />
      <div className="relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-1 -right-1 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-calm flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-display font-bold text-foreground text-lg mb-1.5">
              Welcome, Early User!
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You have full access to all features for 6 months — completely free.
            </p>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-border/50">
          <p className="text-foreground text-sm mb-4 leading-relaxed">
            Track meals, understand triggers, and prepare for doctor visits.
          </p>
          <Button
            onClick={handleDismiss}
            className="h-12 px-6 rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft font-semibold"
          >
            Start Tracking
          </Button>
        </div>
      </div>
    </div>
  );
}

// Early user status section for Profile page
export function EarlyUserStatus() {
  return (
    <div className="relative overflow-hidden bg-card rounded-2xl p-5 border border-primary/15 shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-success/4" />
      <div className="relative">
        <h3 className="font-display font-semibold text-foreground text-sm mb-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
            <Sprout className="w-4 h-4 text-success" />
          </div>
          Early User Status
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full text-xs">Plus</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Access:</span>
            <span className="font-semibold text-success bg-success/10 px-3 py-1 rounded-full text-xs">Free 6 months</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-5 pt-4 border-t border-border/50 leading-relaxed">
          Pricing will be introduced later. Early users will be informed in advance.
        </p>
      </div>
    </div>
  );
}

// Why this app section for Profile page
export function WhyThisApp() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
      <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2.5">
        <Heart className="w-4 h-4 text-destructive" />
        Why this app?
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Built to help IBS sufferers track their own data — not to sell supplements or give medical advice.
      </p>
      <p className="text-muted-foreground text-sm leading-relaxed mt-2.5">
        Your data stays private and is used only to improve your personal insights.
      </p>
    </div>
  );
}
