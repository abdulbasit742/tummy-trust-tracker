/**
 * Trigger Correlation Engine
 * --------------------------------------------------------------------------
 * Pure, dependency-free analysis over a user's meal + symptom logs. Finds which
 * foods correlate with worse symptoms, how portion size and time of day affect
 * them, and surfaces the safest foods. Runs entirely client-side, no API keys.
 */
import type { FoodStatus, MealLogWithSymptoms, PortionSize, SymptomLog } from '@/types';

/** Combined 0..10 discomfort score for a single symptom record. */
export function symptomScore(s: SymptomLog): number {
  const base = (s.bloating_0_10 + s.pain_0_10) / 2;
  return Math.min(10, base + (s.stool_issue ? 1.5 : 0));
}

function worstScore(symptoms: SymptomLog[] = []): number | null {
  if (!symptoms.length) return null;
  return Math.max(...symptoms.map(symptomScore));
}

function statusFromScore(avg: number): FoodStatus {
  if (avg >= 6) return 'avoid';
  if (avg >= 3) return 'caution';
  return 'safe';
}

export interface FoodInsight {
  food_name: string;
  meal_count: number;
  rated_count: number;        // meals that had at least one symptom log
  avg_score: number;          // 0..10, average worst-symptom score
  tolerance_percent: number;  // 100 = perfectly tolerated, 0 = always bad
  status: FoodStatus;
  worst_portion: PortionSize | null;
  confidence: 'low' | 'medium' | 'high';
}

export interface PortionEffect {
  portion: PortionSize;
  avg_score: number;
  rated_count: number;
}

export interface TimeBucketEffect {
  bucket: 'morning' | 'afternoon' | 'evening' | 'night';
  avg_score: number;
  rated_count: number;
}

export interface TriggerReport {
  foods: FoodInsight[];        // sorted worst -> best
  suspected_triggers: FoodInsight[];
  safest_foods: FoodInsight[];
  by_portion: PortionEffect[];
  by_time_of_day: TimeBucketEffect[];
  total_meals: number;
  total_rated: number;
}

function confidenceFor(rated: number): FoodInsight['confidence'] {
  if (rated >= 5) return 'high';
  if (rated >= 2) return 'medium';
  return 'low';
}

function timeBucket(iso: string): TimeBucketEffect['bucket'] {
  const h = new Date(iso).getHours();
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'evening';
  return 'night';
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/**
 * Build a full trigger report from meal logs (each optionally carrying its
 * symptom_logs). Foods are grouped case-insensitively by name.
 */
export function analyzeTriggers(meals: MealLogWithSymptoms[]): TriggerReport {
  const groups = new Map<string, { display: string; meals: MealLogWithSymptoms[] }>();
  for (const m of meals) {
    const key = m.food_name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, { display: m.food_name.trim(), meals: [] });
    groups.get(key)!.meals.push(m);
  }

  const foods: FoodInsight[] = [];
  for (const { display, meals: ms } of groups.values()) {
    const scores: number[] = [];
    const portionScores = new Map<PortionSize, number[]>();
    for (const m of ms) {
      const w = worstScore(m.symptom_logs);
      if (w === null) continue;
      scores.push(w);
      if (!portionScores.has(m.portion)) portionScores.set(m.portion, []);
      portionScores.get(m.portion)!.push(w);
    }
    const avg = mean(scores);
    let worstPortion: PortionSize | null = null;
    let worstPortionAvg = -1;
    for (const [p, arr] of portionScores) {
      const a = mean(arr);
      if (a > worstPortionAvg) { worstPortionAvg = a; worstPortion = p; }
    }
    foods.push({
      food_name: display,
      meal_count: ms.length,
      rated_count: scores.length,
      avg_score: Number(avg.toFixed(2)),
      tolerance_percent: Math.round((1 - avg / 10) * 100),
      status: scores.length ? statusFromScore(avg) : 'caution',
      worst_portion: worstPortion,
      confidence: confidenceFor(scores.length),
    });
  }

  foods.sort((a, b) => b.avg_score - a.avg_score);

  // Portion effect across all rated meals
  const portionBuckets = new Map<PortionSize, number[]>();
  // Time-of-day effect across all rated meals
  const timeBuckets = new Map<TimeBucketEffect['bucket'], number[]>();
  let totalRated = 0;
  for (const m of meals) {
    const w = worstScore(m.symptom_logs);
    if (w === null) continue;
    totalRated++;
    if (!portionBuckets.has(m.portion)) portionBuckets.set(m.portion, []);
    portionBuckets.get(m.portion)!.push(w);
    const tb = timeBucket(m.eaten_at);
    if (!timeBuckets.has(tb)) timeBuckets.set(tb, []);
    timeBuckets.get(tb)!.push(w);
  }

  const by_portion: PortionEffect[] = (['S', 'M', 'L'] as PortionSize[])
    .filter((p) => portionBuckets.has(p))
    .map((p) => ({
      portion: p,
      avg_score: Number(mean(portionBuckets.get(p)!).toFixed(2)),
      rated_count: portionBuckets.get(p)!.length,
    }));

  const order: TimeBucketEffect['bucket'][] = ['morning', 'afternoon', 'evening', 'night'];
  const by_time_of_day: TimeBucketEffect[] = order
    .filter((b) => timeBuckets.has(b))
    .map((b) => ({
      bucket: b,
      avg_score: Number(mean(timeBuckets.get(b)!).toFixed(2)),
      rated_count: timeBuckets.get(b)!.length,
    }));

  const suspected_triggers = foods.filter(
    (f) => f.rated_count >= 2 && f.avg_score >= 5,
  );
  const safest_foods = [...foods]
    .filter((f) => f.rated_count >= 2 && f.avg_score <= 2)
    .sort((a, b) => a.avg_score - b.avg_score)
    .slice(0, 10);

  return {
    foods,
    suspected_triggers,
    safest_foods,
    by_portion,
    by_time_of_day,
    total_meals: meals.length,
    total_rated: totalRated,
  };
}
