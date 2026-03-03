import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOfflineData } from '@/hooks/use-offline-data';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { InstallPrompt } from '@/components/ui/InstallPrompt';
import { GrowthBanner, WelcomeCard } from '@/components/ui/FreeAccessBanner';
import { ShareButton } from '@/components/ui/ShareButton';
import { MotivationalTip } from '@/components/ui/MotivationalTip';
import { WaterTracker } from '@/components/ui/WaterTracker';
import { StreakCounter } from '@/components/ui/StreakCounter';
import { WaterReminder } from '@/components/ui/WaterReminder';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardSkeleton, CardSkeleton, FoodListSkeleton } from '@/components/ui/skeletons';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedList';
import { shouldUsePersonalTolerance } from '@/lib/toleranceEngine';
import { getDisplayNameWithUrdu, searchFoods, getFoodDisplayName } from '@/lib/utils/foodUtils';
import { MealLog, ToleranceData, FoodReference, FoodStatus } from '@/types';
import { Search, PlusCircle, TrendingUp, TrendingDown, Calendar, Database, X, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isUrdu } = useLanguage();
  const { 
    getFoods, 
    getTodayMealLogs, 
    getToleranceData,
    isOnline: online,
    pendingSyncCount,
    isSyncing 
  } = useOfflineData();
  
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [foods, setFoods] = useState<FoodReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineData, setIsOfflineData] = useState(false);
  
  const [foodSearch, setFoodSearch] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setIsOfflineData(!navigator.onLine);

    try {
      const meals = await getTodayMealLogs();
      setTodayMeals((meals as MealLog[]) || []);

      const scores = await getToleranceData();
      setToleranceData(scores);

      const foodData = await getFoods();
      setFoods((foodData as FoodReference[]) || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    setIsLoading(false);
  }, [user, getTodayMealLogs, getToleranceData, getFoods]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const { handlers, PullIndicator } = usePullToRefresh({
    onRefresh: loadData,
  });

  const getStatusInfo = (foodName: string, defaultStatus: FoodStatus): { status: FoodStatus; isPersonal: boolean } => {
    const personal = toleranceData.find(
      t => t.food_name.toLowerCase() === foodName.toLowerCase()
    );
    
    if (shouldUsePersonalTolerance(personal)) {
      return { status: personal!.status, isPersonal: true };
    }
    
    return { status: defaultStatus, isPersonal: false };
  };

  const validTolerance = toleranceData.filter(t => t.symptom_log_count >= 2);
  const safeFoods = validTolerance.filter(t => t.tolerance_percent >= 70).slice(0, 5);
  const triggerFoods = validTolerance.filter(t => t.tolerance_percent < 40).slice(0, 5);

  const filteredFoods = foodSearch.trim()
    ? searchFoods(foodSearch, foods).slice(0, 6)
    : [];

  if (isLoading) {
    return (
      <MobileLayout>
        <DashboardSkeleton />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div 
        className="px-5 py-6 space-y-6"
        onTouchStart={handlers.onTouchStart}
        onTouchMove={handlers.onTouchMove}
        onTouchEnd={handlers.onTouchEnd}
      >
        <PullIndicator />
        <WelcomeCard />
        <GrowthBanner />
        <MotivationalTip />
        <WaterReminder />

        <StaggerContainer className="space-y-6">
          {/* Header */}
          <StaggerItem>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-foreground leading-none">
                    {t('dashboard.title')}
                  </h1>
                  {isOfflineData && (
                    <WifiOff className="w-4 h-4 text-warning" />
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1.5">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}{profile?.ibs_type && ` • ${profile.ibs_type}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <SyncStatusIndicator 
                  showRefreshButton={true}
                  onRefresh={loadData}
                />
                <ShareButton variant="icon" />
              </div>
            </div>
          </StaggerItem>

          {/* Streak Counter */}
          <StaggerItem>
            <StreakCounter />
          </StaggerItem>

          {/* Quick Actions */}
          <StaggerItem>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate('/food-checker')}
                className="quick-action-card bg-primary/8 text-primary hover:bg-primary/12 shadow-soft active:scale-[0.97] transition-transform"
              >
                <Search className="w-6 h-6" />
                <span className="font-semibold text-sm">{t('dashboard.foodCheck')}</span>
              </Button>
              <Button
                onClick={() => navigate('/log-meal')}
                className="quick-action-card bg-success/8 text-success hover:bg-success/12 shadow-soft active:scale-[0.97] transition-transform"
              >
                <PlusCircle className="w-6 h-6" />
                <span className="font-semibold text-sm">{t('dashboard.logMeal')}</span>
              </Button>
            </div>
          </StaggerItem>

          {/* Starter Foods Search */}
          <StaggerItem>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Database className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {t('dashboard.starterFoods')} ({foods.length})
                </h2>
              </div>
              
              <div className="relative">
                <Search className={`absolute ${isUrdu ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder={t('dashboard.searchPlaceholder')}
                  className={`${isUrdu ? 'pr-11 pl-11' : 'pl-11 pr-11'} h-13`}
                  dir="auto"
                />
                {foodSearch && (
                  <button
                    onClick={() => setFoodSearch('')}
                    className={`absolute ${isUrdu ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-muted transition-colors`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {filteredFoods.length > 0 && (
                <div className="mt-3 bg-card rounded-2xl border border-border/80 divide-y divide-border/60 overflow-hidden shadow-soft">
                  {filteredFoods.map((food) => {
                    const { status, isPersonal } = getStatusInfo(food.name, food.default_status as FoodStatus);
                    return (
                      <div 
                        key={food.id}
                        className="list-item"
                      >
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
                    );
                  })}
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Today's Meals */}
          <StaggerItem>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {t('dashboard.todaysMeals')}
                </h2>
              </div>

              {todayMeals.length > 0 ? (
                <div className="bg-card rounded-2xl border border-border/80 divide-y divide-border/60 overflow-hidden shadow-soft">
                  {todayMeals.map((meal) => {
                    const matchedFood = foods.find(f => 
                      f.name.toLowerCase() === meal.food_name.toLowerCase()
                    );
                    const { status } = matchedFood 
                      ? getStatusInfo(matchedFood.name, matchedFood.default_status as FoodStatus)
                      : { status: 'caution' as FoodStatus };
                    
                    return (
                      <div 
                        key={meal.id}
                        className="list-item"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium text-foreground text-sm truncate" dir="auto">
                            {getDisplayNameWithUrdu(meal.food_name, foods)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium flex-shrink-0">({meal.portion})</span>
                          <StatusBadge status={status} size="sm" showIcon={true} />
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold flex-shrink-0">
                          {format(new Date(meal.eaten_at), 'h:mm a')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="text-muted-foreground text-sm">{t('dashboard.noMealsToday')}</p>
                  <p className="text-muted-foreground/70 text-xs mt-2 leading-relaxed">
                    {t('dashboard.logConsistently')}
                  </p>
                  <Button 
                    variant="link" 
                    className="mt-3 text-primary text-sm p-0 h-auto font-semibold"
                    onClick={() => navigate('/log-meal')}
                  >
                    {t('dashboard.logFirstMeal')}
                  </Button>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Water Tracking */}
          <StaggerItem>
            <WaterTracker />
          </StaggerItem>

          {/* Top Safe Foods */}
          <StaggerItem>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <TrendingUp className="w-4 h-4 text-success" />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {t('dashboard.topSafeFoods')}
                </h2>
              </div>

              {safeFoods.length > 0 ? (
                <div className="bg-card rounded-2xl p-5 border border-border/80 space-y-5 shadow-soft">
                  {safeFoods.map((food) => (
                    <div key={food.food_name}>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-medium text-foreground text-sm" dir="auto">
                          {getDisplayNameWithUrdu(food.food_name, foods)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{food.meal_count} {t('dashboard.logs')}</span>
                      </div>
                      <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('dashboard.discoverSafe')}
                  </p>
                  <p className="text-primary/70 text-xs mt-2.5 font-medium">
                    {t('dashboard.moreYouLog')}
                  </p>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Top Trigger Foods */}
          <StaggerItem>
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {t('dashboard.topTriggers')}
                </h2>
              </div>

              {triggerFoods.length > 0 ? (
                <div className="bg-card rounded-2xl p-5 border border-border/80 space-y-5 shadow-soft">
                  {triggerFoods.map((food) => (
                    <div key={food.food_name}>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="font-medium text-foreground text-sm" dir="auto">
                          {getDisplayNameWithUrdu(food.food_name, foods)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{food.meal_count} {t('dashboard.logs')}</span>
                      </div>
                      <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="text-muted-foreground text-sm">
                    {t('dashboard.noTriggersYet')}
                  </p>
                </div>
              )}
            </div>
          </StaggerItem>

          {/* Disclaimer */}
          <StaggerItem>
            <Disclaimer />
          </StaggerItem>

          {/* Install Prompt */}
          <StaggerItem>
            <InstallPrompt />
          </StaggerItem>
        </StaggerContainer>
      </div>
    </MobileLayout>
  );
}
