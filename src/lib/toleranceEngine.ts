import { supabase } from '@/integrations/supabase/client';
import { SymptomLog, ToleranceData, FoodStatus } from '@/types';

export async function calculateToleranceScores(userId: string): Promise<ToleranceData[]> {
  // Fetch all meal logs with their symptom logs
  const { data: mealLogs, error: mealError } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', userId);

  if (mealError || !mealLogs) return [];

  const { data: symptomLogs, error: symptomError } = await supabase
    .from('symptom_logs')
    .select('*')
    .in('meal_log_id', mealLogs.map(m => m.id));

  if (symptomError) return [];

  // Group symptoms by food name
  const foodSymptoms: Record<string, { symptoms: SymptomLog[]; count: number }> = {};

  mealLogs.forEach(meal => {
    const mealSymptoms = symptomLogs?.filter(s => s.meal_log_id === meal.id) || [];
    const foodKey = meal.food_name.toLowerCase().trim();
    
    if (!foodSymptoms[foodKey]) {
      foodSymptoms[foodKey] = { symptoms: [], count: 0 };
    }
    
    foodSymptoms[foodKey].symptoms.push(...mealSymptoms);
    foodSymptoms[foodKey].count++;
  });

  // Calculate tolerance for each food
  const toleranceData: ToleranceData[] = [];

  Object.entries(foodSymptoms).forEach(([foodName, data]) => {
    if (data.symptoms.length === 0) {
      // No symptoms logged yet - can't determine personal tolerance
      toleranceData.push({
        food_name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
        tolerance_percent: 50,
        status: 'caution',
        meal_count: data.count,
        symptom_log_count: 0,
      });
      return;
    }

    // Calculate average symptom score
    // symptom_score = (bloating + pain) / 2 + (stool_issue ? 2 : 0)
    const avgScore = data.symptoms.reduce((sum, s) => {
      const score = (s.bloating_0_10 + s.pain_0_10) / 2 + (s.stool_issue ? 2 : 0);
      return sum + score;
    }, 0) / data.symptoms.length;

    // tolerance_percent = clamp(100 - (average * 10), 0, 100)
    const tolerancePercent = Math.max(0, Math.min(100, Math.round(100 - avgScore * 10)));

    // Classify status
    let status: FoodStatus;
    if (tolerancePercent >= 70) status = 'safe';
    else if (tolerancePercent >= 40) status = 'caution';
    else status = 'avoid';

    toleranceData.push({
      food_name: foodName.charAt(0).toUpperCase() + foodName.slice(1),
      tolerance_percent: tolerancePercent,
      status,
      meal_count: data.count,
      symptom_log_count: data.symptoms.length,
    });
  });

  return toleranceData.sort((a, b) => b.tolerance_percent - a.tolerance_percent);
}

// Check if personal tolerance should override default (>=2 symptom logs)
export function shouldUsePersonalTolerance(toleranceData: ToleranceData | undefined): boolean {
  return !!toleranceData && toleranceData.symptom_log_count >= 2;
}

export function getStatusFromTolerance(percent: number): FoodStatus {
  if (percent >= 70) return 'safe';
  if (percent >= 40) return 'caution';
  return 'avoid';
}
