import { ReactNode, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/haptics';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  className?: string;
  threshold?: number;
}

export function SwipeToDelete({ 
  children, 
  onDelete, 
  className,
  threshold = -100 
}: SwipeToDeleteProps) {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map drag distance to background opacity and icon scale
  const bgOpacity = useTransform(x, [0, threshold], [0, 1]);
  const iconScale = useTransform(x, [0, threshold * 0.6, threshold], [0.5, 0.8, 1.2]);
  const iconOpacity = useTransform(x, [0, threshold * 0.4], [0, 1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < threshold) {
      hapticLight();
      setIsDeleting(true);
      // Animate out then delete
      setTimeout(() => {
        onDelete();
      }, 300);
    }
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      {/* Delete background */}
      <motion.div
        className="absolute inset-0 bg-destructive flex items-center justify-end pr-6 rounded-2xl"
        style={{ opacity: bgOpacity }}
      >
        <motion.div style={{ scale: iconScale, opacity: iconOpacity }}>
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: threshold * 1.5, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin={!isDeleting}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={isDeleting ? { x: -500, opacity: 0 } : undefined}
        transition={isDeleting ? { duration: 0.3, ease: 'easeOut' } : undefined}
        className="relative z-10 touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
