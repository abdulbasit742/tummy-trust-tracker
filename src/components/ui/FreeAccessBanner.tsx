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
    <div className="relative overflow-hidden bg-gradient-to-r from-success/8 via-primary/5 to-success/8 rounded-2xl p-4 border border-success/15 animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(158_55%_42%/0.08),transparent_50%)]" />
      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
          <Sprout className="w-5 h-5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-semibold">
            6 Months Free Access
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Full features for early users — no payment needed.
          </p>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs h-8 px-3 hover:bg-success/10"
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
          className="absolute -top-1 -right-1 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-calm flex items-center justify-center flex-shrink-0 shadow-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-display font-bold text-foreground text-lg mb-1">
              Welcome, Early User!
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You have full access to all features for 6 months — completely free.
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-foreground text-sm mb-3">
            Track meals, understand triggers, and prepare for doctor visits.
          </p>
          <Button
            onClick={handleDismiss}
            className="h-11 px-6 rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft"
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
    <div className="relative overflow-hidden bg-card rounded-2xl p-4 border border-primary/15 shadow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-success/5" />
      <div className="relative">
        <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
            <Sprout className="w-3.5 h-3.5 text-success" />
          </div>
          Early User Status
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs">Plus</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Access:</span>
            <span className="font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full text-xs">Free 6 months</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50">
          Pricing will be introduced later. Early users will be informed in advance.
        </p>
      </div>
    </div>
  );
}

// Why this app section for Profile page
export function WhyThisApp() {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-soft">
      <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
        <Heart className="w-4 h-4 text-destructive" />
        Why this app?
      </h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Built to help IBS sufferers track their own data — not to sell supplements or give medical advice.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed mt-2">
        Your data stays private and is used only to improve your personal insights.
      </p>
    </div>
  );
}