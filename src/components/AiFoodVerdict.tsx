/**
 * AiFoodVerdict
 * --------------------------------------------------------------------------
 * Drop-in presentational card for the AI food checker. Pair it with the
 * useAiFoodCheck() hook (src/hooks/use-ai-food-check.ts) to light up the
 * "custom food not in the database" path on the FoodChecker page.
 *
 *   const { verdict, isLoading, run } = useAiFoodCheck();
 *   useEffect(() => { if (isCustomFood) run(searchQuery); }, [isCustomFood, searchQuery]);
 *   {isCustomFood && <AiFoodVerdict food={searchQuery} verdict={verdict} isLoading={isLoading} isUrdu={isUrdu} />}
 *
 * Styling matches the existing app: rounded cards, soft shadow, status colours.
 * No external deps beyond lucide-react (already in the project).
 */
import React from 'react';
import { Sparkles, Loader2, Database, Lightbulb } from 'lucide-react';
import type { FoodVerdict } from '@/lib/aiFoodCheck';
import type { FoodStatus } from '@/types';

export interface AiFoodVerdictProps {
  food: string;
  verdict: FoodVerdict | null;
  isLoading: boolean;
  isUrdu?: boolean;
  className?: string;
}

const STATUS_STYLE: Record<FoodStatus, { bg: string; text: string; dot: string }> = {
  safe: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  caution: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  avoid: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

function statusLabel(status: FoodStatus, isUrdu: boolean): string {
  if (isUrdu) {
    return { safe: 'Mehfooz', caution: 'Ehtiyat', avoid: 'Parhez' }[status];
  }
  return { safe: 'Safe', caution: 'Caution', avoid: 'Avoid' }[status];
}

function sourceLabel(source: FoodVerdict['source'], isUrdu: boolean): string {
  if (isUrdu) {
    return {
      ai: 'AI ne bataya',
      reference: 'Reference list se',
      heuristic: 'Anumaan',
    }[source];
  }
  return { ai: 'AI estimate', reference: 'From reference list', heuristic: 'Best guess' }[source];
}

export function AiFoodVerdict({
  food,
  verdict,
  isLoading,
  isUrdu = false,
  className = '',
}: AiFoodVerdictProps) {
  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft ${className}`}
        dir="auto"
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          {isUrdu ? `\u201c${food}\u201d check kiya ja raha hai\u2026` : `Checking \u201c${food}\u201d\u2026`}
        </span>
      </div>
    );
  }

  if (!verdict) return null;

  const style = STATUS_STYLE[verdict.status];
  const SourceIcon = verdict.source === 'ai' ? Sparkles : verdict.source === 'reference' ? Database : Lightbulb;
  const confidencePct = Math.round(verdict.confidence * 100);

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 shadow-soft ${className}`}
      dir="auto"
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold capitalize">{verdict.food}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {statusLabel(verdict.status, isUrdu)}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{verdict.fodmap_note}</p>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <SourceIcon className="h-3.5 w-3.5" />
        <span>{sourceLabel(verdict.source, isUrdu)}</span>
        {verdict.source === 'ai' && (
          <span className="ml-auto">
            {isUrdu ? 'Yaqeen' : 'Confidence'}: {confidencePct}%
          </span>
        )}
      </div>

      {verdict.source !== 'ai' && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">
          {isUrdu
            ? 'Yeh aam maaloomat hai. Chhota portion log karke apna reaction dekhein.'
            : 'This is general guidance. Log a small portion and watch your own reaction.'}
        </p>
      )}
    </div>
  );
}

export default AiFoodVerdict;
