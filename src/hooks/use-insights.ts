/**
 * useInsights
 * --------------------------------------------------------------------------
 * The bridge between raw logs and the engine layer. Give it the user's meals
 * (with symptom_logs) plus the food reference + tolerance data, and it returns
 * everything the Insights / Dashboard pages need - memoised so it only
 * recomputes when the inputs actually change.
 *
 * Deliberately presentation-agnostic: it returns data, the components render.
 */
import { useMemo } from 'react';
import type {
  MealLogWithSymptoms,
  FoodReference,
  ToleranceData,
  Profile,
} from '@/types';
import {
  analyzeTriggers,
  analyzeTrends,
  recommendMeals,
  safePicks,
  summarizeInsights,
  digestLine,
  computeNudges,
  buildDoctorReport,
  buildMealCsv,
  reportFilename,
  type TriggerReport,
  type TrendReport,
  type MealSuggestion,
  type InsightCard,
  type Nudge,
} from '@/lib/engines';

export interface UseInsightsInput {
  meals: MealLogWithSymptoms[];
  foods?: FoodReference[];
  tolerance?: ToleranceData[];
  profile?: Profile | null;
  lang?: 'en' | 'ur';
}

export interface UseInsightsResult {
  triggers: TriggerReport;
  trends: TrendReport;
  cards: InsightCard[];
  digest: string;
  recommendations: MealSuggestion[];
  safe: MealSuggestion[];
  nudges: Nudge[];
  hasEnoughData: boolean;
  /** Lazily build the doctor report + CSV only when the user asks to export. */
  buildExport: () => { filenameStem: string; markdown: string; csv: string };
}

export function useInsights({
  meals,
  foods = [],
  tolerance = [],
  profile = null,
  lang = 'en',
}: UseInsightsInput): UseInsightsResult {
  const triggers = useMemo(() => analyzeTriggers(meals), [meals]);

  const trends = useMemo(
    () => analyzeTrends(meals.flatMap((m) => m.symptom_logs ?? [])),
    [meals],
  );

  const cards = useMemo(() => summarizeInsights(triggers, lang), [triggers, lang]);
  const digest = useMemo(() => digestLine(triggers, lang), [triggers, lang]);

  const recommendations = useMemo(
    () => recommendMeals(foods, tolerance, meals),
    [foods, tolerance, meals],
  );
  const safe = useMemo(
    () => safePicks(foods, tolerance, meals),
    [foods, tolerance, meals],
  );

  const nudges = useMemo(() => computeNudges(meals, { lang }), [meals, lang]);

  const hasEnoughData = triggers.total_rated >= 3;

  const buildExport = () => ({
    filenameStem: reportFilename(),
    markdown: buildDoctorReport(meals, profile, lang, 30),
    csv: buildMealCsv(meals),
  });

  return {
    triggers,
    trends,
    cards,
    digest,
    recommendations,
    safe,
    nudges,
    hasEnoughData,
    buildExport,
  };
}
