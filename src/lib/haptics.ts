/**
 * Haptic feedback utilities for native-like mobile experience
 * Uses the Vibration API where supported
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 50, 30],
  error: [50, 100, 50],
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 * @param style - The type of haptic feedback
 */
export function triggerHaptic(style: HapticStyle = 'light'): void {
  if (!isHapticsSupported()) return;
  
  try {
    navigator.vibrate(hapticPatterns[style]);
  } catch (e) {
    // Silently fail - haptics are optional enhancement
  }
}

/**
 * Light tap feedback - for standard button presses
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
 * Heavy tap feedback - for important actions
 */
export function hapticHeavy(): void {
  triggerHaptic('heavy');
}

/**
 * Success feedback - for completed actions
 */
export function hapticSuccess(): void {
  triggerHaptic('success');
}

/**
 * Warning feedback - for caution states
 */
export function hapticWarning(): void {
  triggerHaptic('warning');
}

/**
 * Error feedback - for failed actions
 */
export function hapticError(): void {
  triggerHaptic('error');
}
