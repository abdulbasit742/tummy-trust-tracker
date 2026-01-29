import { useState, useCallback, useRef, TouchEvent } from 'react';
import { hapticLight, hapticMedium } from '@/lib/haptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  handlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: () => void;
  };
  PullIndicator: React.FC;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const hasTriggeredThresholdHaptic = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at top of page
    if (window.scrollY === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
      hasTriggeredThresholdHaptic.current = false;
    }
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      // Apply resistance to make it feel natural
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, maxPull);
      setPullDistance(pull);
      
      // Trigger haptic when crossing threshold
      if (pull >= threshold && !hasTriggeredThresholdHaptic.current) {
        hapticLight();
        hasTriggeredThresholdHaptic.current = true;
      } else if (pull < threshold && hasTriggeredThresholdHaptic.current) {
        // Reset if user pulls back below threshold
        hasTriggeredThresholdHaptic.current = false;
      }
    }
  }, [isRefreshing, maxPull, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      hapticMedium(); // Stronger haptic when refresh triggers
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const PullIndicator: React.FC = () => {
    if (pullDistance === 0 && !isRefreshing) return null;

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = isRefreshing ? 'animate-spin' : '';
    const opacity = Math.min(progress * 1.5, 1);

    return (
      <div 
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ 
          height: pullDistance,
          opacity,
        }}
      >
        <div 
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 ${rotation}`}
          style={{
            transform: !isRefreshing ? `rotate(${progress * 180}deg)` : undefined,
          }}
        >
          <svg 
            className="w-5 h-5 text-primary" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </div>
        {pullDistance >= threshold && !isRefreshing && (
          <span className="ml-2 text-xs text-primary font-medium">Release to refresh</span>
        )}
        {isRefreshing && (
          <span className="ml-2 text-xs text-primary font-medium">Refreshing...</span>
        )}
      </div>
    );
  };

  return {
    isRefreshing,
    pullDistance,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    PullIndicator,
  };
}
