import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, PartyPopper, Sprout } from 'lucide-react';

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
    <div className="bg-gradient-to-r from-success/10 via-primary/5 to-primary/10 rounded-xl p-3 border border-success/20 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sprout className="w-5 h-5 text-success flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-medium">
            🌱 6 Months Free Access for Early Users
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Full insights, trigger analysis, and doctor summary — free for now.
          </p>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="rounded-lg text-xs h-8 px-3"
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
    <div className="bg-gradient-to-br from-primary/10 via-card to-success/10 rounded-xl p-5 border border-primary/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
          <PartyPopper className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-foreground text-lg mb-2">
            🎉 Welcome – You're an Early User
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            You're getting full access to IBS Diet Companion for 6 months — completely free.
          </p>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Track your meals, understand your triggers, and build clarity before doctor visits.
          </p>
          <p className="text-foreground text-sm font-medium mt-2">
            No payment required.
          </p>
          <Button
            onClick={handleDismiss}
            className="mt-4 h-10 px-5 rounded-xl gradient-calm text-primary-foreground border-0 text-sm font-medium"
          >
            Start Tracking
          </Button>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Early user status section for Profile page
export function EarlyUserStatus() {
  return (
    <div className="bg-gradient-to-r from-primary/5 to-success/5 rounded-xl p-4 border border-primary/20">
      <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
        <Sprout className="w-4 h-4 text-success" />
        Early User Status
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Plan:</span>
          <span className="font-medium text-primary">Plus</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Access:</span>
          <span className="font-medium text-success">Free for 6 months</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
        Pricing will be introduced later. Early users will be informed in advance.
      </p>
    </div>
  );
}

// Why this app section for Profile page
export function WhyThisApp() {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="font-display font-semibold text-foreground text-sm mb-2">Why this app?</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">
        This app was built to help IBS sufferers track their own data — not to sell supplements or give medical advice.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed mt-2">
        Your data stays private and is used only to improve your personal insights.
      </p>
    </div>
  );
}