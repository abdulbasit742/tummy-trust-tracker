/**
 * Symptom Trends
 * --------------------------------------------------------------------------
 * Aggregates a user's symptom history over time so the Insights page can show
 * "are you getting better?" Pure + dependency-free, output is chart-ready
 * (plays nicely with the recharts already in the project).
 *
 * Produces:
 *  - a daily time series of average discomfort
 *  - a 7-day rolling average (smooths the noise)
 *  - good-day / bad-day streaks
 *  - week-over-week change (is the trend improving?)
 */
import type { SymptomLog } from '@/types';
import { symptomScore } from '@/lib/triggerAnalysis';

export interface DailyPoint {
  date: string;        // YYYY-MM-DD (local)
  avg_score: number;   // 0..10
  count: number;       // symptom logs that day
  rolling7: number;    // 7-day trailing average of avg_score
  good_day: boolean;   // avg_score <= GOOD_DAY_MAX
}

export interface TrendReport {
  series: DailyPoint[];
  current_streak: { type: 'good' | 'bad' | 'none'; days: number };
  best_good_streak: number;
  week_over_week: {
    this_week_avg: number | null;
    last_week_avg: number | null;
    delta: number | null;        // negative = improving (less discomfort)
    direction: 'improving' | 'worsening' | 'flat' | 'unknown';
  };
  overall_avg: number | null;
  total_logs: number;
}

const GOOD_DAY_MAX = 3; // avg discomfort <= 3 counts as a good day

function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

/**
 * Build a continuous daily series between the first and last log (filling gap
 * days with count=0 so charts don't lie about cadence).
 */
export function analyzeTrends(symptoms: SymptomLog[]): TrendReport {
  if (!symptoms.length) {
    return {
      series: [],
      current_streak: { type: 'none', days: 0 },
      best_good_streak: 0,
      week_over_week: { this_week_avg: null, last_week_avg: null, delta: null, direction: 'unknown' },
      overall_avg: null,
      total_logs: 0,
    };
  }

  // Group scores by local day.
  const byDay = new Map<string, number[]>();
  for (const s of symptoms) {
    const key = localDateKey(s.recorded_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(symptomScore(s));
  }

  const sortedKeys = [...byDay.keys()].sort();
  const start = new Date(sortedKeys[0] + 'T00:00:00');
  const end = new Date(sortedKeys[sortedKeys.length - 1] + 'T00:00:00');

  // Walk day-by-day, filling gaps.
  const series: DailyPoint[] = [];
  const window: number[] = []; // rolling buffer of daily averages (incl. gap days as null-ish)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = localDateKey(d.toISOString());
    const scores = byDay.get(key) ?? [];
    const avg = scores.length ? mean(scores) : 0;

    // rolling average only over days that actually had logs in the trailing 7
    window.push(scores.length ? avg : NaN);
    while (window.length > 7) window.shift();
    const valid = window.filter((n) => !Number.isNaN(n));
    const rolling7 = valid.length ? round2(mean(valid)) : 0;

    series.push({
      date: key,
      avg_score: round2(avg),
      count: scores.length,
      rolling7,
      good_day: scores.length > 0 && avg <= GOOD_DAY_MAX,
    });
  }

  // Streaks (only consider days that had logs).
  let best = 0;
  let curGood = 0;
  for (const p of series) {
    if (p.count === 0) continue;
    if (p.good_day) {
      curGood += 1;
      best = Math.max(best, curGood);
    } else {
      curGood = 0;
    }
  }

  // Current streak: walk backwards over logged days.
  const logged = series.filter((p) => p.count > 0);
  let current: TrendReport['current_streak'] = { type: 'none', days: 0 };
  if (logged.length) {
    const lastGood = logged[logged.length - 1].good_day;
    let days = 0;
    for (let i = logged.length - 1; i >= 0; i--) {
      if (logged[i].good_day === lastGood) days += 1;
      else break;
    }
    current = { type: lastGood ? 'good' : 'bad', days };
  }

  // Week over week (last 7 logged-day window vs the 7 before it).
  const now = new Date();
  const dayMs = 86_400_000;
  const thisWeekCut = now.getTime() - 7 * dayMs;
  const lastWeekCut = now.getTime() - 14 * dayMs;
  const thisWeek: number[] = [];
  const lastWeek: number[] = [];
  for (const s of symptoms) {
    const t = new Date(s.recorded_at).getTime();
    if (t >= thisWeekCut) thisWeek.push(symptomScore(s));
    else if (t >= lastWeekCut) lastWeek.push(symptomScore(s));
  }
  const twAvg = thisWeek.length ? round2(mean(thisWeek)) : null;
  const lwAvg = lastWeek.length ? round2(mean(lastWeek)) : null;
  let delta: number | null = null;
  let direction: TrendReport['week_over_week']['direction'] = 'unknown';
  if (twAvg !== null && lwAvg !== null) {
    delta = round2(twAvg - lwAvg);
    direction = Math.abs(delta) < 0.5 ? 'flat' : delta < 0 ? 'improving' : 'worsening';
  }

  const allScores = symptoms.map(symptomScore);

  return {
    series,
    current_streak: current,
    best_good_streak: best,
    week_over_week: { this_week_avg: twAvg, last_week_avg: lwAvg, delta, direction },
    overall_avg: round2(mean(allScores)),
    total_logs: symptoms.length,
  };
}
