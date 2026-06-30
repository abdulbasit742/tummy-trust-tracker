/**
 * Insight Summary
 * --------------------------------------------------------------------------
 * Turns a TriggerReport (from lib/triggerAnalysis) into short, human-readable
 * advice cards the user can actually act on. Pure + dependency-free, and
 * bilingual (English / Urdu) to match the app's LanguageContext.
 *
 * Example:
 *   const report = analyzeTriggers(meals);
 *   const cards = summarizeInsights(report, isUrdu ? 'ur' : 'en');
 *   // -> [{ kind: 'trigger', title, body }, ...] ready to render
 */
import type { TriggerReport, FoodInsight, PortionEffect, TimeBucketEffect } from '@/lib/triggerAnalysis';

export type Lang = 'en' | 'ur';

export interface InsightCard {
  kind: 'trigger' | 'safe' | 'portion' | 'time' | 'empty';
  title: string;
  body: string;
  /** 0..3 priority for sorting; higher shows first. */
  weight: number;
}

const PORTION_LABEL: Record<string, { en: string; ur: string }> = {
  S: { en: 'small', ur: 'choti' },
  M: { en: 'medium', ur: 'darmiyani' },
  L: { en: 'large', ur: 'bari' },
};

const TIME_LABEL: Record<TimeBucketEffect['bucket'], { en: string; ur: string }> = {
  morning: { en: 'in the morning', ur: 'subah' },
  afternoon: { en: 'in the afternoon', ur: 'dopahar' },
  evening: { en: 'in the evening', ur: 'shaam' },
  night: { en: 'late at night', ur: 'raat ko' },
};

function triggerCard(f: FoodInsight, lang: Lang): InsightCard {
  const portion = f.worst_portion ? PORTION_LABEL[f.worst_portion]?.[lang] : null;
  if (lang === 'ur') {
    const p = portion ? ` khaas tor par ${portion} portion mein` : '';
    return {
      kind: 'trigger',
      title: `${f.food_name} aap ko suit nahi kar raha`,
      body: `${f.rated_count} dafa log kiya, average discomfort ${f.avg_score}/10${p}. Kuch din ke liye chhornay ki koshish karein.`,
      weight: 3,
    };
  }
  const p = portion ? `, especially in ${portion} portions` : '';
  return {
    kind: 'trigger',
    title: `${f.food_name} looks like a trigger`,
    body: `Logged ${f.rated_count} times with an average discomfort of ${f.avg_score}/10${p}. Try cutting it for a few days.`,
    weight: 3,
  };
}

function safeCard(foods: FoodInsight[], lang: Lang): InsightCard {
  const names = foods.slice(0, 4).map((f) => f.food_name).join(', ');
  if (lang === 'ur') {
    return {
      kind: 'safe',
      title: 'Yeh foods aap ke liye mehfooz lag rahe hain',
      body: `${names} se kam se kam symptoms aaye. Bure dinon mein in pe bharosa karein.`,
      weight: 1,
    };
  }
  return {
    kind: 'safe',
    title: 'These foods seem safe for you',
    body: `${names} caused the fewest symptoms. Lean on them on rough days.`,
    weight: 1,
  };
}

function portionCard(effects: PortionEffect[], lang: Lang): InsightCard | null {
  if (effects.length < 2) return null;
  const sorted = [...effects].sort((a, b) => b.avg_score - a.avg_score);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  if (worst.avg_score - best.avg_score < 1) return null; // no meaningful difference
  const worstL = PORTION_LABEL[worst.portion][lang];
  const bestL = PORTION_LABEL[best.portion][lang];
  if (lang === 'ur') {
    return {
      kind: 'portion',
      title: 'Portion size farq dal raha hai',
      body: `${worstL} portions (avg ${worst.avg_score}/10) ${bestL} (avg ${best.avg_score}/10) se zyada takleef de rahe hain. Chhoti plate try karein.`,
      weight: 2,
    };
  }
  return {
    kind: 'portion',
    title: 'Portion size matters for you',
    body: `${worstL} portions (avg ${worst.avg_score}/10) hurt more than ${bestL} ones (avg ${best.avg_score}/10). Try smaller plates.`,
    weight: 2,
  };
}

function timeCard(effects: TimeBucketEffect[], lang: Lang): InsightCard | null {
  if (effects.length < 2) return null;
  const sorted = [...effects].sort((a, b) => b.avg_score - a.avg_score);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  if (worst.avg_score - best.avg_score < 1) return null;
  const worstL = TIME_LABEL[worst.bucket][lang];
  const bestL = TIME_LABEL[best.bucket][lang];
  if (lang === 'ur') {
    return {
      kind: 'time',
      title: 'Khane ka waqt bhi asar dalta hai',
      body: `${worstL} khana (avg ${worst.avg_score}/10) ${bestL} (avg ${best.avg_score}/10) se zyada bhaari par raha hai.`,
      weight: 2,
    };
  }
  return {
    kind: 'time',
    title: 'Timing affects your symptoms',
    body: `Eating ${worstL} (avg ${worst.avg_score}/10) is rougher than ${bestL} (avg ${best.avg_score}/10).`,
    weight: 2,
  };
}

function emptyCard(lang: Lang): InsightCard {
  return lang === 'ur'
    ? {
        kind: 'empty',
        title: 'Abhi data kam hai',
        body: 'Kuch khane aur symptoms log karein, phir hum aap ke triggers dhundh kar yahan dikhayenge.',
        weight: 0,
      }
    : {
        kind: 'empty',
        title: 'Not enough data yet',
        body: 'Log a few meals with symptoms and we will start surfacing your personal triggers here.',
        weight: 0,
      };
}

/**
 * Build a sorted list of insight cards (highest priority first).
 * Returns a single "empty" card when there is nothing to say yet.
 */
export function summarizeInsights(report: TriggerReport, lang: Lang = 'en'): InsightCard[] {
  const cards: InsightCard[] = [];

  for (const f of report.suspected_triggers.slice(0, 3)) {
    cards.push(triggerCard(f, lang));
  }
  if (report.safest_foods.length) {
    cards.push(safeCard(report.safest_foods, lang));
  }
  const pc = portionCard(report.by_portion, lang);
  if (pc) cards.push(pc);
  const tc = timeCard(report.by_time_of_day, lang);
  if (tc) cards.push(tc);

  if (!cards.length) return [emptyCard(lang)];
  return cards.sort((a, b) => b.weight - a.weight);
}

/** One-paragraph plain-text digest, handy for a daily push notification. */
export function digestLine(report: TriggerReport, lang: Lang = 'en'): string {
  if (!report.total_rated) {
    return lang === 'ur'
      ? 'Abhi tak koi rated meal nahi. Aaj kuch log karein!'
      : 'No rated meals yet. Log a few today!';
  }
  const top = report.suspected_triggers[0];
  if (top) {
    return lang === 'ur'
      ? `Aap ka top trigger: ${top.food_name} (${top.avg_score}/10). Aaj isse bachne ki koshish karein.`
      : `Your top trigger: ${top.food_name} (${top.avg_score}/10). Try to avoid it today.`;
  }
  return lang === 'ur'
    ? 'Achi khabar: koi strong trigger nahi mila. Aise hi chaltay rahein!'
    : 'Good news: no strong triggers found. Keep it up!';
}
