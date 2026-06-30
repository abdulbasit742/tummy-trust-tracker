/**
 * SafeToEatNow
 * --------------------------------------------------------------------------
 * Dashboard widget that answers "what can I safely eat right now?" using the
 * suggestions from useInsights().safe (or .recommendations). Presentational.
 *
 *   const { safe } = useInsights({ meals, foods, tolerance });
 *   <SafeToEatNow picks={safe} isUrdu={isUrdu} onPick={(name) => navigate(...)} />
 */
import React from 'react';
import { Leaf, ShieldCheck, ChevronRight } from 'lucide-react';
import type { MealSuggestion } from '@/lib/mealRecommender';

export interface SafeToEatNowProps {
  picks: MealSuggestion[];
  isUrdu?: boolean;
  /** Optional: called when a suggestion is tapped (e.g. prefill Log Meal). */
  onPick?: (foodName: string) => void;
  className?: string;
}

export function SafeToEatNow({ picks, isUrdu = false, onPick, className = '' }: SafeToEatNowProps) {
  if (!picks.length) return null;

  return (
    <section className={`rounded-xl border border-border bg-card p-4 shadow-soft ${className}`} dir="auto">
      <header className="mb-3 flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-500" />
        <h3 className="text-sm font-semibold">
          {isUrdu ? 'Abhi kya kha sakte hain' : 'Safe to eat now'}
        </h3>
      </header>

      <ul className="space-y-2">
        {picks.map((p) => {
          const Tag = onPick ? 'button' : 'div';
          return (
            <Tag
              key={p.food_name}
              {...(onPick ? { onClick: () => onPick(p.food_name), type: 'button' as const } : {})}
              className={`flex w-full items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-all ${
                onPick ? 'hover:border-primary/30 hover:shadow-soft active:scale-[0.98]' : ''
              }`}
            >
              <ShieldCheck
                className={`h-4 w-4 shrink-0 ${p.status === 'safe' ? 'text-green-500' : 'text-amber-500'}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{p.food_name}</span>
                  {p.is_personal && p.tolerance_percent !== null && (
                    <span className="shrink-0 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                      {p.tolerance_percent}%
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{p.reason}</p>
              </div>
              {onPick && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </Tag>
          );
        })}
      </ul>
    </section>
  );
}

export default SafeToEatNow;
