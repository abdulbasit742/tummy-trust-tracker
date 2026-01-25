import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfflineData } from '@/hooks/use-offline-data';
import { Button } from './button';

interface SyncStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function SyncStatusIndicator({ className, showDetails = false }: SyncStatusIndicatorProps) {
  const { t } = useLanguage();
  const { isOnline, pendingSyncCount, isSyncing, syncData } = useOfflineData();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  // Show success message briefly after sync completes
  useEffect(() => {
    if (!isSyncing && pendingSyncCount === 0 && showSyncSuccess) {
      const timer = setTimeout(() => setShowSyncSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, pendingSyncCount, showSyncSuccess]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setShowSyncSuccess(true);
    await syncData();
  };

  // Don't show anything if online and no pending items
  if (isOnline && pendingSyncCount === 0 && !showSyncSuccess) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Sync status icon */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
        !isOnline 
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          : isSyncing
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : pendingSyncCount > 0
              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      )}>
        {!isOnline ? (
          <>
            <CloudOff className="w-3.5 h-3.5" />
            <span>{t('common.offline')}</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{t('common.syncing')}</span>
          </>
        ) : pendingSyncCount > 0 ? (
          <>
            <Cloud className="w-3.5 h-3.5" />
            <span>{pendingSyncCount} {t('common.pendingSync')}</span>
          </>
        ) : showSyncSuccess ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>{t('common.syncComplete')}</span>
          </>
        ) : null}
      </div>

      {/* Manual sync button - only show when online with pending items */}
      {showDetails && isOnline && pendingSyncCount > 0 && !isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSync}
          className="h-7 px-2 text-xs"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync Now
        </Button>
      )}
    </div>
  );
}
