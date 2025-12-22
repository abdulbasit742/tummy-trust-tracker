import { supabase } from '@/integrations/supabase/client';
import { SymptomLog } from '@/types';
import { calculateSymptomScore } from './utils/foodUtils';

export interface ProgressData {
  last7DaysAvg: number | null;
  prev7DaysAvg: number | null;
  trend: 'improving' | 'stable' | 'worsening' | 'insufficient';
  mealsLast7Days: number;
  symptomsLast7Days: number;
  completionRatio: number;
  guidanceMessage: string;
}

export async function calculateProgressData(userId: string): Promise<ProgressData> {
  const now = new Date();
  const day7Ago = new Date(now);
  day7Ago.setDate(day7Ago.getDate() - 7);
  const day14Ago = new Date(now);
  day14Ago.setDate(day14Ago.getDate() - 14);

  // Fetch meal logs for last 14 days
  const { data: mealLogs } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('eaten_at', day14Ago.toISOString())
    .order('eaten_at', { ascending: false });

  const meals = mealLogs || [];
  
  // Get symptom logs for these meals
  const mealIds = meals.map(m => m.id);
  const { data: symptomLogs } = await supabase
    .from('symptom_logs')
    .select('*')
    .in('meal_log_id', mealIds);

  const symptoms = (symptomLogs || []) as SymptomLog[];

  // Split into last 7 days and previous 7 days
  const mealsLast7 = meals.filter(m => new Date(m.eaten_at) >= day7Ago);
  const mealsPrev7 = meals.filter(m => {
    const d = new Date(m.eaten_at);
    return d >= day14Ago && d < day7Ago;
  });

  const symptomsLast7 = symptoms.filter(s => {
    const meal = meals.find(m => m.id === s.meal_log_id);
    return meal && new Date(meal.eaten_at) >= day7Ago;
  });

  const symptomsPrev7 = symptoms.filter(s => {
    const meal = meals.find(m => m.id === s.meal_log_id);
    if (!meal) return false;
    const d = new Date(meal.eaten_at);
    return d >= day14Ago && d < day7Ago;
  });

  // Calculate averages
  const calcAvg = (logs: SymptomLog[]): number | null => {
    if (logs.length === 0) return null;
    const total = logs.reduce((sum, s) => {
      return sum + calculateSymptomScore(s.bloating_0_10, s.pain_0_10, s.stool_issue);
    }, 0);
    return Math.round((total / logs.length) * 10) / 10;
  };

  const last7Avg = calcAvg(symptomsLast7);
  const prev7Avg = calcAvg(symptomsPrev7);

  // Determine trend
  let trend: ProgressData['trend'] = 'insufficient';
  if (last7Avg !== null && prev7Avg !== null) {
    const diff = last7Avg - prev7Avg;
    if (diff <= -0.5) trend = 'improving';
    else if (diff >= 0.5) trend = 'worsening';
    else trend = 'stable';
  } else if (last7Avg !== null) {
    trend = 'stable';
  }

  // Tracking consistency
  const mealsCount = mealsLast7.length;
  const symptomsCount = symptomsLast7.length;
  const completionRatio = mealsCount > 0 ? symptomsCount / mealsCount : 0;

  // Guidance message
  let guidanceMessage = '';
  if (mealsCount === 0) {
    guidanceMessage = 'Start by logging a meal';
  } else if (completionRatio < 0.6) {
    guidanceMessage = 'Log symptoms to improve accuracy';
  } else {
    guidanceMessage = 'Great consistency this week!';
  }

  return {
    last7DaysAvg: last7Avg,
    prev7DaysAvg: prev7Avg,
    trend,
    mealsLast7Days: mealsCount,
    symptomsLast7Days: symptomsCount,
    completionRatio,
    guidanceMessage,
  };
}
