/**
 * NudgeBanner
 * --------------------------------------------------------------------------
 * Shows the single most important, currently-due nudge from
 * useInsights().nudges (lib/reminderEngine). Dismissible, and remembers
 * dismissals for the session via the id so it doesn't nag.
 *
 *   const { nudges } = useInsights({ meals, lang });
 *   <NudgeBanner nudges={nudges} isUrdu={isUrdu} onAction={(n) => ...} />
 */
import React, { useState } from 'react';
import { Bell, X, CheckCircle2, Flame } from 'lucide-react';
import type { Nudge } from '@/lib/reminderEngine';

export interface NudgeBannerProps {
  nudges: Nudge[];
  isUrdu?: boolean;
  /** Called when the user taps the banner body (e.g. open the relevant screen). */
  onAction?: (nudge: Nudge) => void;
  className?: string;
}

const KIND_ICON = {
  symptom_checkin: CheckCircle2,
  log_reminder: Bell,
  streak: Flame,
} as const;

export function NudgeBanner({ nudges, isUrdu = false, onAction, className = '' }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const now = Date.now();

  // First due, non-dismissed nudge (already priority-sorted by the engine).
  const nudge = nudges.find((n) => n.fire_at <= now && !dismissed.has(n.id));
  if (!nudge) return null;

  const Icon = KIND_ICON[nudge.kind] ?? Bell;
  const isStreak = nudge.kind === 'streak';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 shadow-soft ${
        isStreak ? 'border-orange-200 bg-orange-50' : 'border-primary/20 bg-primary/5'
      } ${className}`}
      dir="auto"
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${isStreak ? 'text-orange-500' : 'text-primary'}`} />
      <button
        type="button"
        onClick={() => onAction?.(nudge)}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-sm font-semibold leading-snug">{nudge.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{nudge.body}</p>
      </button>
      <button
        type="button"
        aria-label={isUrdu ? 'Band karein' : 'Dismiss'}
        onClick={() => setDismissed((prev) => new Set(prev).add(nudge.id))}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-black/5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default NudgeBanner;
