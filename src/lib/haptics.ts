/**
 * Advanced Haptic Feedback System
 * Premium native-like experience with contextual patterns, debouncing, and milestones
 */

type HapticStyle = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error'
  | 'selection'
  | 'impact'
  | 'notification'
  | 'milestone'
  | 'celebrate'
  | 'navigation';

// Advanced patterns: single number = duration, array = pattern [vibrate, pause, vibrate, ...]
const hapticPatterns: Record<HapticStyle, number | number[]> = {
  // Basic feedback
  light: 8,
  medium: 20,
  heavy: 40,
  
  // Semantic feedback  
  success: [8, 60, 15],              // Quick double-tap confirmation
  warning: [20, 40, 20],             // Attention-getting pulse
  error: [40, 80, 40, 80, 40],       // Strong triple vibration
  
  // UI interaction patterns
  selection: 5,                       // Ultra-light for list selections
  impact: 15,                         // Button presses, card interactions
  notification: [10, 50, 10, 50, 10], // Notification received
  
  // Achievement patterns
  milestone: [10, 40, 15, 40, 25],    // Building crescendo for achievements
  celebrate: [8, 30, 12, 30, 18, 30, 25, 30, 35], // Victory celebration
  
  // Navigation
  navigation: 12,                     // Tab switches, screen transitions
};

// Debounce tracking to prevent over-triggering
const lastTriggerTime: Record<string, number> = {};
const DEBOUNCE_MS = 50; // Minimum ms between same haptic type

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Check if device prefers reduced motion
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Trigger haptic feedback with intelligent debouncing
 * @param style - The type of haptic feedback
 * @param force - Bypass debounce check (for critical feedback)
 */
export function triggerHaptic(style: HapticStyle = 'light', force = false): void {
  if (!isHapticsSupported()) return;
  if (prefersReducedMotion()) return;
  
  // Debounce check
  const now = Date.now();
  const lastTime = lastTriggerTime[style] || 0;
  if (!force && now - lastTime < DEBOUNCE_MS) return;
  lastTriggerTime[style] = now;
  
  try {
    navigator.vibrate(hapticPatterns[style]);
  } catch {
    // Silently fail - haptics are optional enhancement
  }
}

/**
 * Stop any ongoing haptic feedback
 */
export function stopHaptic(): void {
  if (!isHapticsSupported()) return;
  try {
    navigator.vibrate(0);
  } catch {
    // Silently fail
  }
}

// ============= Semantic Haptic Functions =============

/**
 * Light tap feedback - for standard interactions, toggles
 */
export function hapticLight(): void {
  triggerHaptic('light');
}

/**
 * Medium tap feedback - for navigation and selections  
 */
export function hapticMedium(): void {
  triggerHaptic('medium');
}

/**
 * Heavy tap feedback - for important/destructive actions
 */
export function hapticHeavy(): void {
  triggerHaptic('heavy');
}

/**
 * Success feedback - for completed actions
 */
export function hapticSuccess(): void {
  triggerHaptic('success', true); // Force to ensure it's felt
}

/**
 * Warning feedback - for caution states
 */
export function hapticWarning(): void {
  triggerHaptic('warning', true);
}

/**
 * Error feedback - for failed actions
 */
export function hapticError(): void {
  triggerHaptic('error', true);
}

/**
 * Selection feedback - ultra-light for list item selection
 */
export function hapticSelection(): void {
  triggerHaptic('selection');
}

/**
 * Impact feedback - for button presses and card interactions
 */
export function hapticImpact(): void {
  triggerHaptic('impact');
}

/**
 * Notification feedback - for incoming notifications
 */
export function hapticNotification(): void {
  triggerHaptic('notification', true);
}

/**
 * Milestone feedback - for achievements and goals
 */
export function hapticMilestone(): void {
  triggerHaptic('milestone', true);
}

/**
 * Celebrate feedback - for major victories (water goal, etc.)
 */
export function hapticCelebrate(): void {
  triggerHaptic('celebrate', true);
}

/**
 * Navigation feedback - for tab switches and screen transitions
 */
export function hapticNavigation(): void {
  triggerHaptic('navigation');
}

// ============= Contextual Haptic Helpers =============

/**
 * Trigger appropriate haptic based on food status
 */
export function hapticForFoodStatus(status: 'safe' | 'caution' | 'avoid'): void {
  switch (status) {
    case 'safe':
      hapticSuccess();
      break;
    case 'caution':
      hapticWarning();
      break;
    case 'avoid':
      hapticError();
      break;
  }
}

/**
 * Trigger haptic for slider value crossing thresholds
 */
export function hapticForSliderThreshold(currentValue: number, previousValue: number, thresholds: number[]): void {
  for (const threshold of thresholds) {
    // Check if we crossed this threshold
    const crossedUp = previousValue < threshold && currentValue >= threshold;
    const crossedDown = previousValue >= threshold && currentValue < threshold;
    if (crossedUp || crossedDown) {
      hapticMedium();
      return;
    }
  }
  // Regular step haptic
  hapticLight();
}

/**
 * Create a counting haptic pattern (for water glasses, etc.)
 */
export function hapticCount(count: number, max = 5): void {
  const intensity = Math.min(count, max);
  if (intensity <= 2) {
    hapticLight();
  } else if (intensity <= 4) {
    hapticMedium();
  } else {
    hapticMilestone();
  }
}
