export type IBSType = 'IBS-C' | 'IBS-D' | 'IBS-M';

export type Symptom = 
  | 'bloating'
  | 'gas'
  | 'cramping'
  | 'diarrhea'
  | 'constipation'
  | 'nausea'
  | 'fatigue'
  | 'urgency';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export type FoodStatus = 'recommended' | 'caution' | 'avoid';

export interface UserProfile {
  id: string;
  ibsType: IBSType;
  symptoms: Symptom[];
  severity: SeverityLevel;
  knownTriggers: string[];
  createdAt: Date;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  fodmapLevel: 'low' | 'moderate' | 'high';
  defaultStatus: FoodStatus;
  notes: string;
}

export interface MealLog {
  id: string;
  userId: string;
  foodName: string;
  portionSize: string;
  time: Date;
  symptomSeverity: number;
  notes: string;
}

export interface ToleranceScore {
  id: string;
  userId: string;
  foodName: string;
  score: number;
  reactionCount: number;
  lastUpdated: Date;
}

export interface MealSuggestion {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  ingredients: string[];
  toleranceScore: number;
}
