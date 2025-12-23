import { FoodReference } from '@/types';

// Normalize food name for consistent matching (used for calculations)
export function normalizeFoodName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Capitalize for display (English only)
export function displayFoodName(name: string): string {
  const normalized = normalizeFoodName(name);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Format food name as "English (Urdu)" for display
export function formatBilingualName(englishName: string, urduName?: string | null): string {
  if (!urduName) return englishName;
  return `${englishName} (${urduName})`;
}

// Get formatted display name from a FoodReference object
export function getFoodDisplayName(food: FoodReference): string {
  return formatBilingualName(food.name, food.urdu_name);
}

// Get formatted display name for any food (with optional urdu lookup)
export function getDisplayNameWithUrdu(
  foodName: string, 
  foodList: FoodReference[]
): string {
  const normalized = normalizeFoodName(foodName);
  const match = foodList.find(f => normalizeFoodName(f.name) === normalized);
  if (match?.urdu_name) {
    return formatBilingualName(displayFoodName(foodName), match.urdu_name);
  }
  return displayFoodName(foodName);
}

// Roman Urdu to English mappings for search
const romanUrduMappings: Record<string, string[]> = {
  // Grains & Bread
  'chawal': ['rice', 'چاول'],
  'roti': ['roti', 'روٹی'],
  'chapati': ['roti', 'روٹی'],
  'naan': ['naan', 'نان'],
  'jo': ['barley', 'جو'],
  'jai': ['oats', 'جئی'],
  
  // Dairy
  'doodh': ['milk', 'دودھ'],
  'dahi': ['yogurt', 'دہی'],
  'paneer': ['cheese', 'پنیر'],
  'makhan': ['butter', 'مکھن'],
  
  // Vegetables
  'gobi': ['cauliflower', 'گوبھی'],
  'gobhi': ['cauliflower', 'گوبھی'],
  'phool gobi': ['cauliflower', 'گوبھی'],
  'band gobi': ['cabbage', 'بند گوبھی'],
  'aloo': ['potato', 'آلو'],
  'alu': ['potato', 'آلو'],
  'pyaz': ['onion', 'پیاز'],
  'piyaz': ['onion', 'پیاز'],
  'pyaaz': ['onion', 'پیاز'],
  'tamatar': ['tomato', 'ٹماٹر'],
  'palak': ['spinach', 'پالک'],
  'gajar': ['carrot', 'گاجر'],
  'kheera': ['cucumber', 'کھیرا'],
  'matar': ['peas', 'مٹر'],
  'baingan': ['eggplant', 'بینگن'],
  'lehsun': ['garlic', 'لہسن'],
  'adrak': ['ginger', 'ادرک'],
  'kaddu': ['pumpkin', 'کدو'],
  'bhindi': ['okra', 'بھنڈی'],
  'tori': ['zucchini', 'توری'],
  'shakarkandi': ['sweet potato', 'شکرقندی'],
  
  // Legumes
  'daal': ['lentils', 'دال'],
  'dal': ['lentils', 'دال'],
  'chanay': ['chickpeas', 'چنے'],
  'chane': ['chickpeas', 'چنے'],
  'channay': ['chickpeas', 'چنے'],
  'rajma': ['kidney beans', 'راجما'],
  
  // Fruits
  'kela': ['banana', 'کیلا'],
  'seb': ['apple', 'سیب'],
  'aam': ['mango', 'آم'],
  'angoor': ['grapes', 'انگور'],
  'santra': ['orange', 'سنگترہ'],
  'tarbooz': ['watermelon', 'تربوز'],
  'kharbuza': ['melon', 'خربوزہ'],
  'papita': ['papaya', 'پپیتا'],
  
  // Protein
  'murgh': ['chicken', 'چکن'],
  'chicken': ['chicken', 'چکن'],
  'anda': ['egg', 'انڈا'],
  'machli': ['fish', 'مچھلی'],
  'gosht': ['beef', 'گوشت'],
  'mutton': ['mutton', 'گوشت'],
  
  // Beverages
  'chai': ['tea', 'چائے'],
  'coffee': ['coffee', 'کافی'],
};

// Search foods by English, Urdu script, or Roman Urdu
export function searchFoods(query: string, foods: FoodReference[]): FoodReference[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = normalizeFoodName(query);
  
  // Check for Roman Urdu mapping first
  const romanMatch = romanUrduMappings[normalizedQuery];
  
  return foods.filter(food => {
    const normalizedName = normalizeFoodName(food.name);
    const normalizedUrdu = food.urdu_name || '';
    
    // Direct English match
    if (normalizedName.includes(normalizedQuery)) return true;
    
    // Direct Urdu script match
    if (normalizedUrdu.includes(query)) return true;
    
    // Roman Urdu mapping match
    if (romanMatch) {
      const [englishEquivalent] = romanMatch;
      if (normalizedName.includes(englishEquivalent.toLowerCase())) return true;
    }
    
    return false;
  });
}

// Calculate symptom score from a symptom log
export function calculateSymptomScore(
  bloating: number, 
  pain: number, 
  stoolIssue: boolean
): number {
  return (bloating + pain) / 2 + (stoolIssue ? 2 : 0);
}
