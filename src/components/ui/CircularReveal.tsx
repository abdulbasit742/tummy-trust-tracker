import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface CircularRevealProps {
  /** Whether the reveal is active */
  active: boolean;
  /** X coordinate of the reveal origin */
  x: number;
  /** Y coordinate of the reveal origin */
  y: number;
  /** The color of the reveal overlay (the NEW theme's background) */
  color: string;
  /** Duration in seconds */
  duration?: number;
  /** Called when animation completes */
  onComplete?: () => void;
}

export function CircularReveal({
  active,
  x,
  y,
  color,
  duration = 0.6,
  onComplete,
}: CircularRevealProps) {
  const [maxRadius, setMaxRadius] = useState(0);

  useEffect(() => {
    if (active) {
      // Calculate the max radius needed to cover the entire viewport
      const w = window.innerWidth;
      const h = window.innerHeight;
      const corners = [
        Math.hypot(x, y),
        Math.hypot(w - x, y),
        Math.hypot(x, h - y),
        Math.hypot(w - x, h - y),
      ];
      setMaxRadius(Math.max(...corners));
    }
  }, [active, x, y]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {active && maxRadius > 0 && (
        <motion.div
          initial={{ clipPath: `circle(0px at ${x}px ${y}px)` }}
          animate={{ clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` }}
          exit={{ opacity: 0 }}
          transition={{
            clipPath: { duration, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.2, delay: duration * 0.8 },
          }}
          onAnimationComplete={onComplete}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: color,
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>,
    document.body
  );
}
