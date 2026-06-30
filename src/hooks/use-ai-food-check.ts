/**
 * useAiFoodCheck
 * --------------------------------------------------------------------------
 * Thin React wrapper around lib/aiFoodCheck. Designed to light up the
 * "custom food not in database" path in FoodChecker: when a user types a food
 * the static reference list doesn't know, this fetches a live AI verdict
 * (local Ollama by default) and exposes simple loading / error / verdict state.
 *
 * Usage:
 *   const { verdict, isLoading, run, reset } = useAiFoodCheck();
 *   useEffect(() => { if (isCustomFood) run(searchQuery); }, [isCustomFood, searchQuery]);
 *
 * Notes:
 *  - Debounced so we don't hammer the GPU box on every keystroke.
 *  - Aborts the in-flight request when a new query comes in or on unmount.
 *  - Never throws: lib/aiFoodCheck always resolves to a fallback verdict.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { checkFood, type FoodVerdict } from '@/lib/aiFoodCheck';

export interface UseAiFoodCheck {
  verdict: FoodVerdict | null;
  isLoading: boolean;
  /** Kick off a (debounced) check for the given food name. */
  run: (food: string) => void;
  /** Clear current verdict and cancel any in-flight request. */
  reset: () => void;
}

export function useAiFoodCheck(debounceMs = 450): UseAiFoodCheck {
  const [verdict, setVerdict] = useState<FoodVerdict | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (controller.current) {
      controller.current.abort();
      controller.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setVerdict(null);
    setIsLoading(false);
  }, [cancel]);

  const run = useCallback(
    (food: string) => {
      const name = food.trim();
      cancel();
      if (name.length < 2) {
        setVerdict(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      timer.current = setTimeout(async () => {
        const ctrl = new AbortController();
        controller.current = ctrl;
        const result = await checkFood(name, ctrl.signal);
        // Ignore if a newer request superseded this one.
        if (controller.current !== ctrl) return;
        setVerdict(result);
        setIsLoading(false);
        controller.current = null;
      }, debounceMs);
    },
    [cancel, debounceMs],
  );

  // Clean up on unmount.
  useEffect(() => cancel, [cancel]);

  return { verdict, isLoading, run, reset };
}
