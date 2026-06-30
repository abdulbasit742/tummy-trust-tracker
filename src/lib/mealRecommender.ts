/**
 * Meal Recommender
 * --------------------------------------------------------------------------
 * Suggests what the user can safely eat right now, based on their own logged
 * tolerance plus the static food_reference list. Pure + dependency-free.
 *
 * Strategy:
 *  1. Start from the food_reference catalogue (safe/caution/avoid + notes).
 *  2. Override each food's status with the user's PERSONAL tolerance when we
 *     have enough evidence (>= 2 rated meals) - personal beats generic.
 *  3. Drop anything that resolves to "avoid".
 *  4. Rank "safe" above "caution", then by personal tolerance %, then by how
 *     little it's been eaten lately (variety), and return the top N.
 *
 * This pairs with lib/triggerAnalysis (tolerance) and lib/aiFoodCheck (novel
 * foods). It deliberately knows nothing about React so it can run in a Web
 * Worker or an overnight batch on the Linux box.
 */
import type { FoodReference, FoodStatus, ToleranceData, MealLog } from '@/types';

export interface MealSuggestion {
  food_name: string;
  status: FoodStatus;          // resolved (personal beats default)
  is_personal: boolean;        // true when personal tolerance was used
  tolerance_percent: number | null;
  fodmap_note: string;
  reason: string;              // short why-we-picked-it line
}

export interface RecommenderOptions {
  /** How many suggestions to return. Default 8. */
  limit?: number;
  /** Include "caution" foods too, or only "safe". Default true. */
  includeCaution?: boolean;
  /** Min rated meals before personal tolerance overrides the default. Default 2. */
  personalThreshold?: number;
  /** Down-rank foods eaten within this many hours (variety). Default 24. */
  recentWindowHours?: number;
  /** "now" override for testing. */
  now?: Date;
}

const STATUS_RANK: Record<FoodStatus, number> = { safe: 0, caution: 1, avoid: 2 };

function norm(name: string): string {
  return name.trim().toLowerCase();
}

export function recommendMeals(
  foods: FoodReference[],
  tolerance: ToleranceData[],
  recentMeals: MealLog[] = [],
  opts: RecommenderOptions = {},
): MealSuggestion[] {
  const {
    limit = 8,
    includeCaution = true,
    personalThreshold = 2,
    recentWindowHours = 24,
    now = new Date(),
  } = opts;

  const tolByName = new Map<string, ToleranceData>();
  for (const t of tolerance) tolByName.set(norm(t.food_name), t);

  // Count how recently each food was eaten (for variety down-ranking).
  const cutoff = now.getTime() - recentWindowHours * 3600_000;
  const recentCount = new Map<string, number>();
  for (const m of recentMeals) {
    if (new Date(m.eaten_at).getTime() >= cutoff) {
      const k = norm(m.food_name);
      recentCount.set(k, (recentCount.get(k) ?? 0) + 1);
    }
  }

  const suggestions: (MealSuggestion & { _recent: number; _tol: number })[] = [];

  for (const f of foods) {
    const key = norm(f.name);
    const personal = tolByName.get(key);
    const hasPersonal =
      !!personal && personal.symptom_log_count >= personalThreshold;

    const status: FoodStatus = hasPersonal
      ? personal!.status
      : (f.default_status as FoodStatus);

    if (status === 'avoid') continue;
    if (status === 'caution' && !includeCaution) continue;

    const tol = hasPersonal ? personal!.tolerance_percent : null;
    const recent = recentCount.get(key) ?? 0;

    let reason: string;
    if (hasPersonal) {
      reason = `You tolerate this well (${tol}% over ${personal!.symptom_log_count} logs)`;
    } else if (status === 'safe') {
      reason = 'Generally low-FODMAP and well-tolerated';
    } else {
      reason = 'Usually OK in small portions';
    }

    suggestions.push({
      food_name: f.name,
      status,
      is_personal: hasPersonal,
      tolerance_percent: tol,
      fodmap_note: f.fodmap_note,
      reason,
      _recent: recent,
      _tol: tol ?? (status === 'safe' ? 80 : 50),
    });
  }

  suggestions.sort((a, b) => {
    // 1. safe before caution
    if (STATUS_RANK[a.status] !== STATUS_RANK[b.status]) {
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    }
    // 2. less recently eaten first (variety)
    if (a._recent !== b._recent) return a._recent - b._recent;
    // 3. higher tolerance first
    return b._tol - a._tol;
  });

  return suggestions.slice(0, limit).map(({ _recent, _tol, ...s }) => s);
}

/** Convenience: only the rock-solid "safe" picks, max 5. */
export function safePicks(
  foods: FoodReference[],
  tolerance: ToleranceData[],
  recentMeals: MealLog[] = [],
): MealSuggestion[] {
  return recommendMeals(foods, tolerance, recentMeals, {
    includeCaution: false,
    limit: 5,
  });
}
