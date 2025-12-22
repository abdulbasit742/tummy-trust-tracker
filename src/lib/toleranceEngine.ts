import { supabase } from '@/integrations/supabase/client';
import { SymptomLog, ToleranceData, FoodStatus } from '@/types';
import { normalizeFoodName, displayFoodName, calculateSymptomScore } from './utils/foodUtils';

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

  // Group symptoms by normalized food name
  const foodSymptoms: Record<string, { symptoms: SymptomLog[]; count: number; displayName: string }> = {};

  mealLogs.forEach(meal => {
    const mealSymptoms = symptomLogs?.filter(s => s.meal_log_id === meal.id) || [];
    const normalizedName = normalizeFoodName(meal.food_name);
    
    if (!foodSymptoms[normalizedName]) {
      foodSymptoms[normalizedName] = { 
        symptoms: [], 
        count: 0, 
        displayName: displayFoodName(meal.food_name) 
      };
    }
    
    foodSymptoms[normalizedName].symptoms.push(...mealSymptoms);
    foodSymptoms[normalizedName].count++;
  });

  // Calculate tolerance for each food
  const toleranceData: ToleranceData[] = [];

  Object.entries(foodSymptoms).forEach(([normalizedName, data]) => {
    if (data.symptoms.length === 0) {
      // No symptoms logged yet - can't determine personal tolerance
      toleranceData.push({
        food_name: data.displayName,
        tolerance_percent: 50,
        status: 'caution',
        meal_count: data.count,
        symptom_log_count: 0,
      });
      return;
    }

    // Calculate average symptom score using the standard formula
    const avgScore = data.symptoms.reduce((sum, s) => {
      const score = calculateSymptomScore(s.bloating_0_10, s.pain_0_10, s.stool_issue);
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
      food_name: data.displayName,
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

export function getToleranceLabel(percent: number): string {
  if (percent >= 70) return 'Generally safe';
  if (percent >= 40) return 'Moderate trigger';
  return 'Strong trigger';
}
