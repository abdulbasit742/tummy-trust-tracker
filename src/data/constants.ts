export const SYMPTOMS = [
  { id: 'bloating', label: 'Bloating' },
  { id: 'gas', label: 'Gas' },
  { id: 'cramping', label: 'Cramping' },
  { id: 'diarrhea', label: 'Diarrhea' },
  { id: 'constipation', label: 'Constipation' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'urgency', label: 'Urgency' },
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

export const PORTION_SIZES = [
  { value: 'S', label: 'Small' },
  { value: 'M', label: 'Medium' },
  { value: 'L', label: 'Large' },
] as const;

export const DISCLAIMER_TEXT = "This tool is for educational tracking only and does not replace medical advice. Always consult a qualified doctor.";
