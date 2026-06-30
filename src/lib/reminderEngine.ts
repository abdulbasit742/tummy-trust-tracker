/**
 * Reminder & Nudge Engine
 * --------------------------------------------------------------------------
 * Decides WHEN to gently nudge the user, without being annoying. Pure +
 * dependency-free so it can run from a hook, a service worker, or a batch job.
 * The UI layer decides HOW to deliver (web push, toast, local notification).
 *
 * Two core jobs:
 *  1. Symptom check-ins: ~2-4h after a meal is logged, ask "how do you feel?"
 *     (only for meals that don't yet have a symptom log).
 *  2. Daily engagement: if no meal logged today by evening, nudge to log;
 *     celebrate logging streaks.
 */
import type { MealLogWithSymptoms } from '@/types';

export type Lang = 'en' | 'ur';

export interface Nudge {
  id: string;                 // stable id so the UI can de-dupe / dismiss
  kind: 'symptom_checkin' | 'log_reminder' | 'streak';
  title: string;
  body: string;
  /** When this nudge becomes relevant (ms epoch). UI fires at/after this. */
  fire_at: number;
  priority: number;           // higher = more important
  meal_id?: string;
}

export interface NudgeOptions {
  lang?: Lang;
  now?: Date;
  /** Earliest a post-meal check-in should fire (hours after the meal). Default 2. */
  checkinMinHours?: number;
  /** Latest useful window for a check-in (hours after meal). Default 6. */
  checkinMaxHours?: number;
  /** Hour-of-day (0-23) after which we nudge for a missing daily log. Default 19. */
  eveningHour?: number;
}

const HOUR = 3_600_000;

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function t(lang: Lang, en: string, ur: string): string {
  return lang === 'ur' ? ur : en;
}

/**
 * Compute the set of nudges that are currently relevant. The UI should call
 * this periodically (e.g. on app open, or from a 15-min service-worker tick),
 * then surface nudges whose fire_at <= now and that haven't been dismissed.
 */
export function computeNudges(
  meals: MealLogWithSymptoms[],
  opts: NudgeOptions = {},
): Nudge[] {
  const {
    lang = 'en',
    now = new Date(),
    checkinMinHours = 2,
    checkinMaxHours = 6,
    eveningHour = 19,
  } = opts;
  const nowMs = now.getTime();
  const nudges: Nudge[] = [];

  // 1) Post-meal symptom check-ins for un-rated meals.
  for (const m of meals) {
    const hasSymptom = (m.symptom_logs?.length ?? 0) > 0;
    if (hasSymptom) continue;
    const eaten = new Date(m.eaten_at).getTime();
    const fireAt = eaten + checkinMinHours * HOUR;
    const expireAt = eaten + checkinMaxHours * HOUR;
    // Only relevant within the [min, max] window.
    if (nowMs > expireAt) continue;
    nudges.push({
      id: `checkin:${m.id}`,
      kind: 'symptom_checkin',
      meal_id: m.id,
      title: t(lang, 'How are you feeling?', 'Ab tabiyat kaisi hai?'),
      body: t(
        lang,
        `You logged "${m.food_name}" earlier. Tap to record any symptoms.`,
        `Aap ne "${m.food_name}" log kiya tha. Symptoms record karne ke liye tap karein.`,
      ),
      fire_at: fireAt,
      priority: 3,
    });
  }

  // 2) Daily log reminder + streak celebration.
  const today = meals.filter((m) => sameLocalDay(new Date(m.eaten_at), now));
  if (today.length === 0 && now.getHours() >= eveningHour) {
    const fireAt = new Date(now);
    fireAt.setHours(eveningHour, 0, 0, 0);
    nudges.push({
      id: `log:${now.toISOString().slice(0, 10)}`,
      kind: 'log_reminder',
      title: t(lang, "Don't forget to log today", 'Aaj log karna na bhoolen'),
      body: t(
        lang,
        'A quick meal log keeps your insights accurate.',
        'Ek chhota sa meal log aap ki insights ko sahi rakhta hai.',
      ),
      fire_at: fireAt.getTime(),
      priority: 2,
    });
  }

  // 3) Logging streak (consecutive days with >= 1 meal logged).
  const streak = loggingStreak(meals, now);
  if (streak >= 3 && today.length > 0) {
    nudges.push({
      id: `streak:${now.toISOString().slice(0, 10)}`,
      kind: 'streak',
      title: t(lang, `🔥 ${streak}-day logging streak!`, `🔥 ${streak} din ka streak!`),
      body: t(
        lang,
        'Consistency is what makes your trigger detection accurate. Keep going!',
        'Yehi consistency aap ke triggers ko sahi pakadti hai. Jari rakhein!',
      ),
      fire_at: nowMs,
      priority: 1,
    });
  }

  return nudges.sort((a, b) => b.priority - a.priority || a.fire_at - b.fire_at);
}

/** Count consecutive days (ending today or yesterday) with at least one meal. */
export function loggingStreak(meals: MealLogWithSymptoms[], now = new Date()): number {
  if (!meals.length) return 0;
  const days = new Set<string>();
  for (const m of meals) {
    days.add(new Date(m.eaten_at).toISOString().slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date(now);
  // Allow the streak to count from today OR yesterday (grace for "not logged yet today").
  if (!days.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
