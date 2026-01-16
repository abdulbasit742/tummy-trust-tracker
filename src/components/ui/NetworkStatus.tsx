import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        // Hide "Back online" after 2 seconds
        setTimeout(() => setShowBanner(false), 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setShowBanner(true);
      setWasOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] safe-top",
        "animate-fade-in"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium",
          isOnline
            ? "bg-emerald-500/90 text-white"
            : "bg-amber-500/90 text-white"
        )}
      >
        {isOnline ? (
          <>
            <Check className="w-4 h-4" />
            <span>Back online!</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>You're offline — some features may be limited</span>
          </>
        )}
      </div>
    </div>
  );
}
