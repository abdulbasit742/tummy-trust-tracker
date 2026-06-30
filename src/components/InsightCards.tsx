/**
 * InsightCards
 * --------------------------------------------------------------------------
 * Renders the advice cards produced by summarizeInsights() (lib/insightSummary)
 * for the Insights / Dashboard pages. Presentational only - feed it the cards
 * from useInsights().cards.
 *
 *   const { cards } = useInsights({ meals, foods, tolerance, profile, lang });
 *   <InsightCards cards={cards} isUrdu={isUrdu} />
 */
import React from 'react';
import { AlertTriangle, Leaf, Scale, Clock, Sparkles } from 'lucide-react';
import type { InsightCard } from '@/lib/insightSummary';

export interface InsightCardsProps {
  cards: InsightCard[];
  isUrdu?: boolean;
  className?: string;
}

const KIND_STYLE: Record<
  InsightCard['kind'],
  { icon: React.ComponentType<{ className?: string }>; ring: string; iconColor: string }
> = {
  trigger: { icon: AlertTriangle, ring: 'border-red-200', iconColor: 'text-red-500' },
  safe: { icon: Leaf, ring: 'border-green-200', iconColor: 'text-green-500' },
  portion: { icon: Scale, ring: 'border-amber-200', iconColor: 'text-amber-500' },
  time: { icon: Clock, ring: 'border-blue-200', iconColor: 'text-blue-500' },
  empty: { icon: Sparkles, ring: 'border-border', iconColor: 'text-muted-foreground' },
};

export function InsightCards({ cards, isUrdu = false, className = '' }: InsightCardsProps) {
  if (!cards.length) return null;

  return (
    <div className={`space-y-3 ${className}`} dir="auto">
      {cards.map((card, i) => {
        const style = KIND_STYLE[card.kind];
        const Icon = style.icon;
        return (
          <div
            key={`${card.kind}-${i}`}
            className={`flex gap-3 rounded-xl border bg-card p-4 shadow-soft ${style.ring}`}
          >
            <div className="mt-0.5 shrink-0">
              <Icon className={`h-5 w-5 ${style.iconColor}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-snug">{card.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default InsightCards;
