/**
 * Analysis Engine Layer - Barrel
 * --------------------------------------------------------------------------
 * One import surface for every pure analysis lib added in this build. Lets the
 * UI do `import { analyzeTriggers, recommendMeals } from '@/lib/engines'`
 * instead of reaching into individual files.
 *
 * Everything re-exported here is React-free and side-effect-free, so it's safe
 * to use in components, hooks, web workers, or the overnight batch box.
 */

// Trigger correlation (per-food tolerance, portion + time patterns)
export {
  analyzeTriggers,
  symptomScore,
  type TriggerReport,
  type FoodInsight,
  type PortionEffect,
  type TimeBucketEffect,
} from '@/lib/triggerAnalysis';

// Symptom trends over time (series, rolling avg, streaks, week-over-week)
export {
  analyzeTrends,
  type TrendReport,
  type DailyPoint,
} from '@/lib/symptomTrends';

// Personalized safe-meal recommendations
export {
  recommendMeals,
  safePicks,
  type MealSuggestion,
  type RecommenderOptions,
} from '@/lib/mealRecommender';

// Natural-language insight cards (EN/Urdu)
export {
  summarizeInsights,
  digestLine,
  type InsightCard,
  type Lang as InsightLang,
} from '@/lib/insightSummary';

// Doctor-ready report + CSV builders
export {
  buildDoctorReport,
  buildMealCsv,
  reportFilename,
  type Lang as ReportLang,
} from '@/lib/reportExport';

// Reminder / nudge engine
export {
  computeNudges,
  loggingStreak,
  type Nudge,
  type NudgeOptions,
} from '@/lib/reminderEngine';

// AI food classifier (local Ollama, safe fallback)
export {
  checkFood,
  checkFoods,
  type FoodVerdict,
} from '@/lib/aiFoodCheck';

// Delivery helpers (download / native share / clipboard)
export {
  downloadText,
  downloadMarkdown,
  downloadCsv,
  shareReport,
  canShare,
  copyToClipboard,
} from '@/lib/exportActions';
