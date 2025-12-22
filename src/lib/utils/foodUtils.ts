// Normalize food name for consistent matching
export function normalizeFoodName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

// Capitalize for display
export function displayFoodName(name: string): string {
  const normalized = normalizeFoodName(name);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

// Calculate symptom score from a symptom log
export function calculateSymptomScore(
  bloating: number, 
  pain: number, 
  stoolIssue: boolean
): number {
  return (bloating + pain) / 2 + (stoolIssue ? 2 : 0);
}
