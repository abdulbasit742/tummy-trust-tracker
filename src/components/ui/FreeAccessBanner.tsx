import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, PartyPopper } from 'lucide-react';

interface FreeAccessBannerProps {
  storageKey?: string;
}

export function FreeAccessBanner({ storageKey = 'free-access-banner-dismissed' }: FreeAccessBannerProps) {
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
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-success/10 rounded-xl p-4 border border-primary/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <PartyPopper className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground text-sm mb-1">
            🎉 6 Months Free Access
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            You're getting full access to IBS Diet Companion — including insights, trigger analysis, and doctor summary — completely FREE for 6 months.
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            No payment required. Just track consistently and take control of your IBS.
          </p>
          <Button
            onClick={handleDismiss}
            className="mt-3 h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
          >
            Got it – Start Tracking
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

export function PlanStatusSection() {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="font-display font-semibold text-foreground text-sm mb-3">Plan Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Plan:</span>
          <span className="font-medium text-primary">Plus (Free for 6 months)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Access Type:</span>
          <span className="font-medium text-foreground">Early User</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        Pricing will be introduced later. Early users will be notified in advance.
      </p>
    </div>
  );
}