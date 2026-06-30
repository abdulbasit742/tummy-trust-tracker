/**
 * Engine Smoke Tests
 * --------------------------------------------------------------------------
 * A zero-dependency smoke harness for the pure analysis libs. It does NOT need
 * Jest/Vitest - run it directly with `npx tsx src/lib/__tests__/engines.smoke.ts`
 * (or import runSmoke() from a dev route). Exits non-zero on failure so it can
 * gate CI. Validates triggerAnalysis, symptomTrends, mealRecommender,
 * insightSummary, reportExport and reminderEngine against synthetic data.
 */
import type {
  MealLogWithSymptoms,
  SymptomLog,
  FoodReference,
  ToleranceData,
  Profile,
} from '@/types';
import { analyzeTriggers, symptomScore } from '@/lib/triggerAnalysis';
import { analyzeTrends } from '@/lib/symptomTrends';
import { recommendMeals, safePicks } from '@/lib/mealRecommender';
import { summarizeInsights, digestLine } from '@/lib/insightSummary';
import { buildDoctorReport, buildMealCsv } from '@/lib/reportExport';
import { computeNudges, loggingStreak } from '@/lib/reminderEngine';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean): void {
  if (cond) {
    passed++;
    // eslint-disable-next-line no-console
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    // eslint-disable-next-line no-console
    console.error(`  \u2717 ${name}`);
  }
}

// ---- Synthetic data -------------------------------------------------------
const day = 86_400_000;
const base = Date.now();

function sym(mealId: string, bloat: number, pain: number, stool: boolean, daysAgo: number): SymptomLog {
  return {
    id: `s-${mealId}-${daysAgo}`,
    meal_log_id: mealId,
    bloating_0_10: bloat,
    pain_0_10: pain,
    stool_issue: stool,
    recorded_at: new Date(base - daysAgo * day).toISOString(),
  };
}

function meal(
  id: string,
  food: string,
  portion: 'S' | 'M' | 'L',
  daysAgo: number,
  symptoms: SymptomLog[],
): MealLogWithSymptoms {
  return {
    id,
    user_id: 'u1',
    food_name: food,
    portion,
    eaten_at: new Date(base - daysAgo * day).toISOString(),
    notes: '',
    created_at: new Date(base - daysAgo * day).toISOString(),
    symptom_logs: symptoms,
  };
}

// Garlic = clear trigger (high scores). Rice = safe (low scores).
const meals: MealLogWithSymptoms[] = [
  meal('m1', 'Garlic', 'L', 1, [sym('m1', 8, 9, true, 1)]),
  meal('m2', 'Garlic', 'M', 3, [sym('m2', 7, 8, true, 3)]),
  meal('m3', 'Garlic', 'L', 5, [sym('m3', 9, 9, true, 5)]),
  meal('m4', 'Rice', 'M', 1, [sym('m4', 1, 0, false, 1)]),
  meal('m5', 'Rice', 'M', 2, [sym('m5', 0, 1, false, 2)]),
  meal('m6', 'Rice', 'S', 4, [sym('m6', 1, 1, false, 4)]),
  meal('m7', 'Banana', 'S', 1, []), // un-rated -> triggers a check-in nudge
];

const foods: FoodReference[] = [
  { id: 'f1', name: 'Rice', urdu_name: 'Chawal', default_status: 'safe', fodmap_note: 'Low FODMAP', created_at: '' },
  { id: 'f2', name: 'Garlic', urdu_name: 'Lehsan', default_status: 'avoid', fodmap_note: 'High fructans', created_at: '' },
  { id: 'f3', name: 'Banana', urdu_name: 'Kela', default_status: 'safe', fodmap_note: 'Ripe = low FODMAP', created_at: '' },
];

const tolerance: ToleranceData[] = [
  { food_name: 'Rice', tolerance_percent: 92, status: 'safe', meal_count: 3, symptom_log_count: 3 },
  { food_name: 'Garlic', tolerance_percent: 15, status: 'avoid', meal_count: 3, symptom_log_count: 3 },
];

const profile: Profile = {
  id: 'p1', user_id: 'u1', ibs_type: 'IBS-D', severity: 'moderate',
  symptoms: ['bloating', 'pain'], trigger_sensitivities: ['fructans'],
  plan: 'free', free_access_expiry: null, custom_tips: [],
  created_at: '', updated_at: '',
};

// ---- Tests ----------------------------------------------------------------
export function runSmoke(): number {
  // eslint-disable-next-line no-console
  console.log('triggerAnalysis');
  const tr = analyzeTriggers(meals);
  check('garlic flagged as suspected trigger', tr.suspected_triggers.some((f) => f.food_name === 'Garlic'));
  check('rice not a suspected trigger', !tr.suspected_triggers.some((f) => f.food_name === 'Rice'));
  check('rice appears in safest foods', tr.safest_foods.some((f) => f.food_name === 'Rice'));
  check('symptomScore stays within 0..10', symptomScore(sym('x', 10, 10, true, 0)) <= 10);

  console.log('symptomTrends');
  const trends = analyzeTrends(meals.flatMap((m) => m.symptom_logs ?? []));
  check('trend series is non-empty', trends.series.length > 0);
  check('overall average computed', trends.overall_avg !== null);
  check('total logs counted', trends.total_logs === 6);

  console.log('mealRecommender');
  const recs = recommendMeals(foods, tolerance, meals);
  check('garlic excluded from recommendations', !recs.some((r) => r.food_name === 'Garlic'));
  check('rice recommended', recs.some((r) => r.food_name === 'Rice'));
  check('safePicks returns only safe foods', safePicks(foods, tolerance, meals).every((r) => r.status === 'safe'));

  console.log('insightSummary');
  const cards = summarizeInsights(tr, 'en');
  check('produces at least one insight card', cards.length > 0);
  check('a trigger card exists', cards.some((c) => c.kind === 'trigger'));
  const urdu = summarizeInsights(tr, 'ur');
  check('urdu summaries differ from english', urdu[0].body !== cards[0].body);
  check('digestLine mentions a trigger', /Garlic/.test(digestLine(tr, 'en')));

  console.log('reportExport');
  const md = buildDoctorReport(meals, profile, 'en', 30);
  check('doctor report has a triggers section', /Suspected triggers/.test(md));
  check('doctor report mentions garlic', /Garlic/.test(md));
  const csv = buildMealCsv(meals);
  check('csv has a header row', csv.split('\n')[0].includes('food_name'));
  check('csv includes un-rated meal (banana)', /Banana/.test(csv));

  console.log('reminderEngine');
  check('logging streak counts recent days', loggingStreak(meals) >= 1);
  const nudges = computeNudges(meals, { now: new Date(base) });
  check('a symptom check-in nudge exists for banana', nudges.some((n) => n.kind === 'symptom_checkin' && n.meal_id === 'm7'));

  // ---- Summary ----
  // eslint-disable-next-line no-console
  console.log(`\n${passed} passed, ${failed} failed`);
  return failed;
}

// Auto-run when executed directly (tsx / node), not when imported.
// @ts-ignore - import.meta.main is supported by tsx/bun; guarded for safety.
if (typeof process !== 'undefined' && process.argv?.[1]?.includes('engines.smoke')) {
  const code = runSmoke();
  // eslint-disable-next-line no-process-exit
  process.exit(code === 0 ? 0 : 1);
}
