export type IBSType = 'IBS-C' | 'IBS-D' | 'IBS-M';
export type SeverityLevel = 'mild' | 'moderate' | 'severe';
export type FoodStatus = 'safe' | 'caution' | 'avoid';
export type PortionSize = 'S' | 'M' | 'L';
export type PlanType = 'free' | 'plus';

export interface Profile {
  id: string;
  user_id: string;
  ibs_type: IBSType;
  severity: SeverityLevel;
  symptoms: string[];
  trigger_sensitivities: string[];
  plan: PlanType;
  free_access_expiry: string | null;
  custom_tips: string[];
  created_at: string;
  updated_at: string;
}

export interface FoodReference {
  id: string;
  name: string;
  urdu_name: string | null;
  default_status: FoodStatus;
  fodmap_note: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  food_name: string;
  portion: PortionSize;
  eaten_at: string;
  notes: string;
  created_at: string;
}

export interface SymptomLog {
  id: string;
  meal_log_id: string;
  bloating_0_10: number;
  pain_0_10: number;
  stool_issue: boolean;
  recorded_at: string;
}

export interface MealLogWithSymptoms extends MealLog {
  symptom_logs?: SymptomLog[];
}

export interface ToleranceData {
  food_name: string;
  tolerance_percent: number;
  status: FoodStatus;
  meal_count: number;
  symptom_log_count: number;
}
