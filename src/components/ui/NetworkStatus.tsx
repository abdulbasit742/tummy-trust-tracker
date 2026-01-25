import { useState, useEffect, useCallback } from 'react';
import { WifiOff, Check, RefreshCw, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { syncQueue } from '@/lib/offlineStorage';
import { processSyncQueue } from '@/lib/syncQueue';

export function NetworkStatus() {
  const { t } = useLanguage();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await syncQueue.getCount();
      setPendingCount(count);
    } catch (error) {
      console.log('Error getting pending count:', error);
    }
  }, []);

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await processSyncQueue();
      await updatePendingCount();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowBanner(true);
        // Auto-sync when coming back online
        handleSync();
        // Hide "Back online" after 3 seconds
        setTimeout(() => setShowBanner(false), 3000);
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

    // Initial pending count
    updatePendingCount();

    // Poll for pending count updates
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [wasOffline, handleSync, updatePendingCount]);

  // Show banner if offline OR if there are pending items to sync
  const shouldShowBanner = showBanner || (!isOnline) || (isOnline && pendingCount > 0);

  if (!shouldShowBanner) return null;

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
          isOnline && pendingCount === 0
            ? "bg-emerald-500/90 text-white"
            : isOnline && pendingCount > 0
              ? "bg-blue-500/90 text-white"
              : "bg-amber-500/90 text-white"
        )}
      >
        {isOnline && pendingCount === 0 ? (
          <>
            <Check className="w-4 h-4" />
            <span>{t('common.backOnline')}</span>
          </>
        ) : isOnline && pendingCount > 0 ? (
          <>
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('common.syncing')}</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>{pendingCount} {t('common.pendingSync')}</span>
                <button
                  onClick={handleSync}
                  className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
                >
                  Sync
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>{t('common.offline')} — {t('common.offlineMessage')}</span>
          </>
        )}
      </div>
    </div>
  );
}
