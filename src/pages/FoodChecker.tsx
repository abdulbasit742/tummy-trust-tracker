import React, { useState, useEffect, useMemo } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Input } from '@/components/ui/input';
import { FoodListSkeleton } from '@/components/ui/skeletons';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics } from '@/hooks/use-analytics';
import { useOfflineData } from '@/hooks/use-offline-data';
import { shouldUsePersonalTolerance } from '@/lib/toleranceEngine';
import { normalizeFoodName, getFoodDisplayName, searchFoods } from '@/lib/utils/foodUtils';
import { FoodReference, FoodStatus, ToleranceData } from '@/types';
import { Search, X, Info, User, Database, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isOnline } from '@/lib/offlineStorage';
import { hapticSelection, hapticForFoodStatus } from '@/lib/haptics';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedList';

export default function FoodChecker() {
  const { user } = useAuth();
  const { t, isUrdu } = useLanguage();
  const { trackEvent } = useAnalytics();
  const { getFoods, getToleranceData } = useOfflineData();
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<FoodReference[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodReference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    const online = isOnline();
    setIsOfflineData(!online);
    
    // Fetch food reference (online or cached)
    const foodData = await getFoods();
    setFoods(foodData || []);

    // Get personal tolerance data (online or cached)
    if (user) {
      const scores = await getToleranceData();
      setToleranceData(scores);
    }
    
    setIsLoading(false);
  };

  const getStatusInfo = (foodName: string, defaultStatus: FoodStatus): { status: FoodStatus; isPersonal: boolean; tolerancePercent?: number } => {
    const normalizedName = normalizeFoodName(foodName);
    const personal = toleranceData.find(
      t => normalizeFoodName(t.food_name) === normalizedName
    );
    
    // Priority rule: use personal if >= 2 symptom logs
    if (shouldUsePersonalTolerance(personal)) {
      return { 
        status: personal!.status, 
        isPersonal: true,
        tolerancePercent: personal!.tolerance_percent
      };
    }
    
    return { status: defaultStatus, isPersonal: false };
  };

  // Use bilingual search - show all results
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    return searchFoods(searchQuery, foods);
  }, [searchQuery, foods]);

  const normalizedSearch = normalizeFoodName(searchQuery);
  const isCustomFood = searchQuery.trim().length >= 2 && 
    !foods.some(f => normalizeFoodName(f.name) === normalizedSearch);

  const handleFoodSelect = (food: FoodReference) => {
    const { status } = getStatusInfo(food.name, food.default_status as FoodStatus);
    
    // Haptic feedback based on food status
    hapticForFoodStatus(status);
    
    setSelectedFood(food);
    setSearchQuery(food.name);
    trackEvent({ 
      eventType: 'food_check', 
      metadata: { food_name: food.name, status: food.default_status } 
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedFood(null);
  };

  return (
    <MobileLayout>
      <StaggerContainer className="px-5 py-6 space-y-5">
        {/* Sync Status */}
        <StaggerItem>
          <SyncStatusIndicator 
            showRefreshButton={true}
            onRefresh={loadData}
          />
        </StaggerItem>

        {/* Header */}
        <StaggerItem>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {t('foodChecker.title')}
              </h1>
              {isOfflineData && (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              {t('foodChecker.subtitle')}
            </p>
            <p className="text-xs text-primary/80 mt-1.5">
              {t('foodChecker.personalNote')}
            </p>
          </div>
        </StaggerItem>

        {/* Search with Autocomplete */}
        <StaggerItem>
          <div className="relative">
            <Search className={`absolute ${isUrdu ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedFood(null);
              }}
              placeholder={t('dashboard.searchPlaceholder')}
              className={`${isUrdu ? 'pr-12 pl-12' : 'pl-12 pr-12'} h-14 text-base rounded-xl bg-card border-border shadow-soft`}
              dir="auto"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute ${isUrdu ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 transition-colors`}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </StaggerItem>

        {/* Custom Food Warning */}
        {isCustomFood && !selectedFood && (
          <StaggerItem>
            <div className="bg-caution/8 border border-caution/25 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-caution/12 flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-caution" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">"{searchQuery}" {t('foodChecker.notInDatabase')}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {t('foodChecker.canStillLog')}
                  </p>
                  <div className="flex items-center gap-2.5 mt-3">
                    <StatusBadge status="caution" size="sm" />
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Database className="w-3 h-3" /> {t('foodChecker.default')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </StaggerItem>
        )}

        {/* Selected Food Detail */}
        {selectedFood && (
          <StaggerItem>
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
              {(() => {
                const { status, isPersonal, tolerancePercent } = getStatusInfo(selectedFood.name, selectedFood.default_status as FoodStatus);
                return (
                  <>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h2 className="font-display text-xl font-bold text-foreground" dir="auto">
                        {getFoodDisplayName(selectedFood)}
                      </h2>
                      <StatusBadge status={status} size="lg" />
                    </div>

                    {/* Personalized vs Default label */}
                    <div className="flex items-center gap-2.5 mb-4">
                      {isPersonal ? (
                        <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                          <User className="w-3 h-3" /> {t('foodChecker.personalized')} ({tolerancePercent}%)
                        </span>
                      ) : (
                        <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                          <Database className="w-3 h-3" /> {t('foodChecker.default')}
                        </span>
                      )}
                    </div>

                    <div className={cn(
                      "p-4 rounded-xl mb-4",
                      status === 'safe' && "bg-success/8",
                      status === 'caution' && "bg-caution/8",
                      status === 'avoid' && "bg-destructive/8",
                    )}>
                      <p className="text-foreground text-sm leading-relaxed">
                        {selectedFood.fodmap_note}
                      </p>
                    </div>

                    {isPersonal && (
                      <p className="text-xs text-muted-foreground">
                        {t('foodChecker.basedOnReactions')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          </StaggerItem>
        )}

        {/* Food List / Autocomplete */}
        {!selectedFood && !isCustomFood && searchQuery.length >= 1 && (
          <StaggerItem>
            <div className="space-y-2">
              <h3 className="font-display font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {t('foodChecker.searchResults')} ({filteredFoods.length})
              </h3>
              {filteredFoods.length > 0 ? (
                <StaggerContainer className="space-y-2">
                  {filteredFoods.map((food) => {
                    const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                    return (
                      <StaggerItem key={food.id}>
                        <button
                          onClick={() => handleFoodSelect(food)}
                          className="w-full text-left bg-card rounded-xl p-4 border border-border hover:shadow-soft hover:border-primary/20 transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-foreground text-sm" dir="auto">
                                {getFoodDisplayName(food)}
                              </span>
                              {isPersonal && (
                                <span className="text-xs text-primary ml-2 font-medium">• {t('dashboard.personal')}</span>
                              )}
                            </div>
                            <StatusBadge status={status} size="sm" />
                          </div>
                        </button>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              ) : (
                <p className="text-center text-muted-foreground text-sm py-6">
                  {t('foodChecker.noFoodsFound')}
                </p>
              )}
            </div>
          </StaggerItem>
        )}

        {/* Browse Foods (when empty search) */}
        {!selectedFood && !searchQuery && (
          <StaggerItem>
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                {t('foodChecker.browseFoods')} ({foods.length})
              </h3>
              
              {isLoading ? (
                <FoodListSkeleton count={5} />
              ) : (
                <StaggerContainer className="space-y-2">
                  {foods.map((food) => {
                    const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                    return (
                      <StaggerItem key={food.id}>
                        <button
                          onClick={() => handleFoodSelect(food)}
                          className="w-full text-left bg-card rounded-xl p-4 border border-border hover:shadow-soft hover:border-primary/20 transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-foreground text-sm" dir="auto">
                                {getFoodDisplayName(food)}
                              </span>
                              {isPersonal && (
                                <span className="text-xs text-primary ml-2 font-medium">• {t('dashboard.personal')}</span>
                              )}
                            </div>
                            <StatusBadge status={status} size="sm" />
                          </div>
                        </button>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </div>
          </StaggerItem>
        )}

        {/* Disclaimer */}
        <StaggerItem>
          <Disclaimer />
        </StaggerItem>
      </StaggerContainer>
    </MobileLayout>
  );
}
