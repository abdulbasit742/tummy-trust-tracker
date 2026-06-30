/**
 * Report Export
 * --------------------------------------------------------------------------
 * Builds a clean, shareable summary a user can hand to their doctor or
 * dietitian. Pulls together the trigger report (lib/triggerAnalysis) and the
 * trend report (lib/symptomTrends) into:
 *   - a human-readable Markdown summary
 *   - a raw CSV of every meal + its symptoms (for spreadsheets)
 *
 * Pure + dependency-free. The UI can drop these into a Blob and download, or
 * pass the Markdown to a share sheet. Bilingual headings (EN/Urdu).
 */
import type { MealLogWithSymptoms, Profile } from '@/types';
import { analyzeTriggers } from '@/lib/triggerAnalysis';
import { analyzeTrends } from '@/lib/symptomTrends';
import { symptomScore } from '@/lib/triggerAnalysis';

export type Lang = 'en' | 'ur';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(0, 10);
}

function csvCell(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v);
  // Quote if it contains comma, quote, or newline.
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * Flat CSV: one row per (meal, symptom) pair. Meals with no symptom log still
 * appear once with blank symptom columns.
 */
export function buildMealCsv(meals: MealLogWithSymptoms[]): string {
  const header = [
    'meal_date',
    'food_name',
    'portion',
    'notes',
    'symptom_recorded_at',
    'bloating_0_10',
    'pain_0_10',
    'stool_issue',
    'combined_score_0_10',
  ];
  const rows: string[] = [header.join(',')];

  for (const m of meals) {
    const base = [fmtDate(m.eaten_at), m.food_name, m.portion, m.notes ?? ''];
    const symptoms = m.symptom_logs ?? [];
    if (!symptoms.length) {
      rows.push([...base, '', '', '', '', ''].map(csvCell).join(','));
      continue;
    }
    for (const s of symptoms) {
      rows.push(
        [
          ...base,
          fmtDate(s.recorded_at),
          s.bloating_0_10,
          s.pain_0_10,
          s.stool_issue,
          symptomScore(s).toFixed(1),
        ]
          .map(csvCell)
          .join(','),
      );
    }
  }
  return rows.join('\n');
}

/**
 * Doctor-facing Markdown summary. `rangeDays` is just for the header label.
 */
export function buildDoctorReport(
  meals: MealLogWithSymptoms[],
  profile: Profile | null,
  lang: Lang = 'en',
  rangeDays = 30,
): string {
  const triggers = analyzeTriggers(meals);
  const allSymptoms = meals.flatMap((m) => m.symptom_logs ?? []);
  const trends = analyzeTrends(allSymptoms);
  const L = lang === 'ur';

  const lines: string[] = [];
  lines.push(L ? '# IBS Riport (Doctor ke liye)' : '# IBS Symptom Report');
  lines.push('');
  lines.push(
    L
      ? `_Pichhle ${rangeDays} din ka khulasa. Tummy Trust se export kiya gaya._`
      : `_Summary of the last ${rangeDays} days. Exported from Tummy Trust._`,
  );
  lines.push('');

  // Profile block
  if (profile) {
    lines.push(L ? '## Mareez ki maloomat' : '## Patient profile');
    lines.push(`- ${L ? 'IBS type' : 'IBS type'}: **${profile.ibs_type}**`);
    lines.push(`- ${L ? 'Shiddat' : 'Severity'}: **${profile.severity}**`);
    if (profile.trigger_sensitivities?.length) {
      lines.push(
        `- ${L ? 'Maaloom sensitivities' : 'Known sensitivities'}: ${profile.trigger_sensitivities.join(', ')}`,
      );
    }
    lines.push('');
  }

  // Overview
  lines.push(L ? '## Khulasa' : '## Overview');
  lines.push(`- ${L ? 'Total meals logged' : 'Total meals logged'}: ${triggers.total_meals}`);
  lines.push(`- ${L ? 'Symptom-rated meals' : 'Symptom-rated meals'}: ${triggers.total_rated}`);
  if (trends.overall_avg !== null) {
    lines.push(
      `- ${L ? 'Average takleef' : 'Average discomfort'}: **${trends.overall_avg}/10**`,
    );
  }
  const wow = trends.week_over_week;
  if (wow.direction !== 'unknown') {
    const dirEn = { improving: 'improving', worsening: 'worsening', flat: 'stable', unknown: '' }[wow.direction];
    const dirUr = { improving: 'behtar ho raha hai', worsening: 'kharab ho raha hai', flat: 'stable hai', unknown: '' }[wow.direction];
    lines.push(`- ${L ? 'Hafta-dar-hafta rujhan' : 'Week-over-week trend'}: **${L ? dirUr : dirEn}** (${wow.last_week_avg ?? '-'} → ${wow.this_week_avg ?? '-'})`);
  }
  if (trends.best_good_streak > 0) {
    lines.push(`- ${L ? 'Behtareen achhe din ka silsila' : 'Best good-day streak'}: ${trends.best_good_streak} ${L ? 'din' : 'days'}`);
  }
  lines.push('');

  // Suspected triggers
  lines.push(L ? '## Mashkook triggers' : '## Suspected triggers');
  if (triggers.suspected_triggers.length) {
    lines.push(L ? '| Khana | Avg takleef | Dafa log | Portion |' : '| Food | Avg discomfort | Times logged | Worst portion |');
    lines.push('|---|---|---|---|');
    for (const f of triggers.suspected_triggers.slice(0, 10)) {
      lines.push(`| ${f.food_name} | ${f.avg_score}/10 | ${f.rated_count} | ${f.worst_portion ?? '-'} |`);
    }
  } else {
    lines.push(L ? '_Abhi koi waazeh trigger nahi mila._' : '_No clear triggers identified yet._');
  }
  lines.push('');

  // Safe foods
  lines.push(L ? '## Mehfooz foods' : '## Well-tolerated foods');
  if (triggers.safest_foods.length) {
    lines.push(
      triggers.safest_foods.slice(0, 10).map((f) => `- ${f.food_name} (${f.tolerance_percent}%)`).join('\n'),
    );
  } else {
    lines.push(L ? '_Kafi data nahi._' : '_Not enough data._');
  }
  lines.push('');

  lines.push('---');
  lines.push(
    L
      ? '_Yeh self-tracking data hai, medical tashkhees nahi. Apne doctor se mashwara karein._'
      : '_This is self-tracked data, not a medical diagnosis. Please consult your doctor._',
  );

  return lines.join('\n');
}

/** Suggested filename stem, e.g. "ibs-report-2026-06-30". */
export function reportFilename(prefix = 'ibs-report', now = new Date()): string {
  return `${prefix}-${now.toISOString().slice(0, 10)}`;
}
