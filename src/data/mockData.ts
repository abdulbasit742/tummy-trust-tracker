import { Food, ToleranceScore, MealSuggestion } from '@/types';

export const SYMPTOMS = [
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'gas', label: 'Gas', icon: '💨' },
  { id: 'cramping', label: 'Cramping', icon: '😣' },
  { id: 'diarrhea', label: 'Diarrhea', icon: '🚽' },
  { id: 'constipation', label: 'Constipation', icon: '🧱' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'urgency', label: 'Urgency', icon: '⚡' },
] as const;

export const IBS_TYPES = [
  { value: 'IBS-C', label: 'IBS-C (Constipation)', description: 'Primarily constipation symptoms' },
  { value: 'IBS-D', label: 'IBS-D (Diarrhea)', description: 'Primarily diarrhea symptoms' },
  { value: 'IBS-M', label: 'IBS-M (Mixed)', description: 'Alternating constipation and diarrhea' },
] as const;

export const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', description: 'Occasional discomfort' },
  { value: 'moderate', label: 'Moderate', description: 'Regular symptoms affecting daily life' },
  { value: 'severe', label: 'Severe', description: 'Frequent, intense symptoms' },
] as const;

export const COMMON_TRIGGERS = [
  'Dairy', 'Gluten', 'Garlic', 'Onion', 'Beans', 
  'Caffeine', 'Alcohol', 'Spicy foods', 'Fried foods', 'Artificial sweeteners'
];

export const FOODS_DATABASE: Food[] = [
  { id: '1', name: 'Rice', category: 'Grains', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Easy to digest, well-tolerated by most IBS patients' },
  { id: '2', name: 'Banana', category: 'Fruits', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Ripe bananas are low FODMAP in small portions' },
  { id: '3', name: 'Chicken', category: 'Protein', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Plain grilled or baked chicken is usually safe' },
  { id: '4', name: 'Eggs', category: 'Protein', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Excellent protein source, generally well-tolerated' },
  { id: '5', name: 'Spinach', category: 'Vegetables', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Nutrient-dense and low in FODMAPs' },
  { id: '6', name: 'Oats', category: 'Grains', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Gentle on the stomach when plain' },
  { id: '7', name: 'Garlic', category: 'Vegetables', fodmapLevel: 'high', defaultStatus: 'avoid', notes: 'High in fructans, common trigger' },
  { id: '8', name: 'Onion', category: 'Vegetables', fodmapLevel: 'high', defaultStatus: 'avoid', notes: 'High in fructans, may cause symptoms' },
  { id: '9', name: 'Milk', category: 'Dairy', fodmapLevel: 'high', defaultStatus: 'caution', notes: 'Contains lactose, try lactose-free alternatives' },
  { id: '10', name: 'Apple', category: 'Fruits', fodmapLevel: 'high', defaultStatus: 'caution', notes: 'High in fructose and sorbitol' },
  { id: '11', name: 'Avocado', category: 'Fruits', fodmapLevel: 'moderate', defaultStatus: 'caution', notes: 'Small portions (1/8) are low FODMAP' },
  { id: '12', name: 'Broccoli', category: 'Vegetables', fodmapLevel: 'moderate', defaultStatus: 'caution', notes: 'Heads are higher FODMAP than stalks' },
  { id: '13', name: 'Salmon', category: 'Protein', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Rich in omega-3s, anti-inflammatory' },
  { id: '14', name: 'Potato', category: 'Vegetables', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Plain potatoes are well-tolerated' },
  { id: '15', name: 'Blueberries', category: 'Fruits', fodmapLevel: 'low', defaultStatus: 'recommended', notes: 'Low FODMAP in reasonable portions' },
];

export const MOCK_TOLERANCE_SCORES: ToleranceScore[] = [
  { id: '1', userId: '1', foodName: 'Rice', score: 95, reactionCount: 0, lastUpdated: new Date() },
  { id: '2', userId: '1', foodName: 'Chicken', score: 90, reactionCount: 1, lastUpdated: new Date() },
  { id: '3', userId: '1', foodName: 'Banana', score: 85, reactionCount: 2, lastUpdated: new Date() },
  { id: '4', userId: '1', foodName: 'Oats', score: 80, reactionCount: 2, lastUpdated: new Date() },
  { id: '5', userId: '1', foodName: 'Milk', score: 35, reactionCount: 8, lastUpdated: new Date() },
  { id: '6', userId: '1', foodName: 'Garlic', score: 15, reactionCount: 12, lastUpdated: new Date() },
  { id: '7', userId: '1', foodName: 'Eggs', score: 88, reactionCount: 1, lastUpdated: new Date() },
  { id: '8', userId: '1', foodName: 'Spinach', score: 92, reactionCount: 0, lastUpdated: new Date() },
];

export const MEAL_SUGGESTIONS: MealSuggestion[] = [
  {
    id: '1',
    mealType: 'breakfast',
    name: 'Gentle Oatmeal Bowl',
    description: 'Creamy oats with banana and blueberries',
    ingredients: ['Oats', 'Banana', 'Blueberries', 'Maple syrup'],
    toleranceScore: 88,
  },
  {
    id: '2',
    mealType: 'breakfast',
    name: 'Simple Eggs & Toast',
    description: 'Scrambled eggs with gluten-free toast',
    ingredients: ['Eggs', 'GF bread', 'Butter'],
    toleranceScore: 90,
  },
  {
    id: '3',
    mealType: 'lunch',
    name: 'Grilled Chicken Salad',
    description: 'Fresh spinach with grilled chicken',
    ingredients: ['Chicken', 'Spinach', 'Cucumber', 'Olive oil'],
    toleranceScore: 92,
  },
  {
    id: '4',
    mealType: 'lunch',
    name: 'Rice Bowl',
    description: 'Simple rice with steamed vegetables',
    ingredients: ['Rice', 'Carrots', 'Zucchini', 'Chicken'],
    toleranceScore: 94,
  },
  {
    id: '5',
    mealType: 'dinner',
    name: 'Baked Salmon',
    description: 'Herb-crusted salmon with potatoes',
    ingredients: ['Salmon', 'Potato', 'Olive oil', 'Herbs'],
    toleranceScore: 91,
  },
  {
    id: '6',
    mealType: 'dinner',
    name: 'Chicken & Rice',
    description: 'Classic comfort meal, easy on digestion',
    ingredients: ['Chicken', 'Rice', 'Carrots', 'Herbs'],
    toleranceScore: 93,
  },
  {
    id: '7',
    mealType: 'snack',
    name: 'Banana & Peanut Butter',
    description: 'Quick energy boost',
    ingredients: ['Banana', 'Peanut butter'],
    toleranceScore: 85,
  },
];

export const PORTION_SIZES = [
  'Small (1/4 cup)',
  'Medium (1/2 cup)',
  'Large (1 cup)',
  'Extra Large (1.5+ cups)',
];
