import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { Button } from '@/components/ui/button';
import { calculateToleranceScores, getToleranceLabel } from '@/lib/toleranceEngine';
import { calculateProgressData, ProgressData } from '@/lib/progressEngine';
import { ToleranceData } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Target, FileText, Copy, CheckCircle, AlertTriangle,
  Calendar, ClipboardList, Utensils, Sunrise, Sun, Moon, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'progress' | 'triggers' | 'doctor' | 'suggestions';

export default function Insights() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [defaultSafeFoods, setDefaultSafeFoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    const [progress, tolerance, foods] = await Promise.all([
      calculateProgressData(user.id),
      calculateToleranceScores(user.id),
      supabase.from('food_reference').select('name').eq('default_status', 'safe'),
    ]);
    
    setProgressData(progress);
    setToleranceData(tolerance);
    setDefaultSafeFoods(foods.data?.map(f => f.name) || []);
    setIsLoading(false);
  };

  // Filter foods with >= 2 symptom logs
  const validTolerance = toleranceData.filter(t => t.symptom_log_count >= 2);
  const safeFoods = validTolerance.filter(t => t.tolerance_percent >= 70).slice(0, 5);
  const triggerFoods = [...validTolerance].sort((a, b) => a.tolerance_percent - b.tolerance_percent).filter(t => t.tolerance_percent < 70).slice(0, 5);

  const getTrendIcon = () => {
    if (!progressData) return null;
    switch (progressData.trend) {
      case 'improving': return <TrendingDown className="w-5 h-5 text-success" />;
      case 'worsening': return <TrendingUp className="w-5 h-5 text-destructive" />;
      case 'stable': return <Minus className="w-5 h-5 text-caution" />;
      default: return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    if (!progressData) return '';
    switch (progressData.trend) {
      case 'improving': return 'Symptoms improving';
      case 'worsening': return 'Symptoms worsening';
      case 'stable': return 'Symptoms stable';
      default: return 'Not enough data for comparison';
    }
  };

  const getTrendColor = () => {
    if (!progressData) return 'text-muted-foreground';
    switch (progressData.trend) {
      case 'improving': return 'text-success';
      case 'worsening': return 'text-destructive';
      case 'stable': return 'text-caution';
      default: return 'text-muted-foreground';
    }
  };

  const generateDoctorSummary = (): string => {
    if (!profile) return '';
    
    const lines = [
      '=== IBS Diet Companion Summary ===',
      '',
      `IBS Type: ${profile.ibs_type}`,
      `Severity: ${profile.severity}`,
      `Main Symptoms: ${profile.symptoms.length > 0 ? profile.symptoms.join(', ') : 'Not specified'}`,
      '',
    ];

    if (progressData && progressData.last7DaysAvg !== null) {
      lines.push(`Last 7 Days Avg Symptom Score: ${progressData.last7DaysAvg}/12`);
    }

    if (triggerFoods.length > 0) {
      lines.push('');
      lines.push('Foods Likely Triggering Symptoms:');
      triggerFoods.forEach(f => {
        lines.push(`  - ${f.food_name} (${f.tolerance_percent}% tolerance)`);
      });
    }

    if (safeFoods.length > 0) {
      lines.push('');
      lines.push('Foods Generally Tolerated:');
      safeFoods.forEach(f => {
        lines.push(`  - ${f.food_name} (${f.tolerance_percent}% tolerance)`);
      });
    }

    lines.push('');
    lines.push('Note: This summary is for discussion purposes only.');
    lines.push('This tool does not replace medical advice.');
    
    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    const summary = generateDoctorSummary();
    
    try {
      await navigator.clipboard.writeText(summary);
      toast({
        title: "Copied!",
        description: "Summary copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  // Daily Suggestions logic
  const safeFoodsForSuggestions = useMemo(() => {
    const personalSafe = toleranceData
      .filter(t => t.tolerance_percent >= 70 && t.symptom_log_count >= 2)
      .map(t => t.food_name);
    
    if (personalSafe.length >= 3) return personalSafe;
    return defaultSafeFoods;
  }, [toleranceData, defaultSafeFoods]);

  const suggestions = useMemo(() => {
    if (safeFoodsForSuggestions.length === 0) return [];

    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const shuffled = shuffle(safeFoodsForSuggestions);

    return [
      { mealType: 'breakfast' as const, foods: shuffled.slice(0, 2) },
      { mealType: 'lunch' as const, foods: shuffled.slice(2, 5).length >= 2 ? shuffled.slice(2, 5) : shuffled.slice(0, 3) },
      { mealType: 'dinner' as const, foods: shuffled.length > 5 ? shuffled.slice(5, 8) : shuffled.slice(0, 3) },
    ];
  }, [safeFoodsForSuggestions, refreshKey]);

  const hasPersonalSuggestionData = toleranceData.filter(t => t.tolerance_percent >= 70 && t.symptom_log_count >= 2).length >= 3;

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return <Sunrise className="w-5 h-5" />;
      case 'lunch': return <Sun className="w-5 h-5" />;
      case 'dinner': return <Moon className="w-5 h-5" />;
      default: return null;
    }
  };

  const getMealColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'text-caution bg-caution/10';
      case 'lunch': return 'text-primary bg-primary/10';
      case 'dinner': return 'text-accent-foreground bg-accent';
      default: return '';
    }
  };

  const tabs = [
    { id: 'progress' as TabType, label: 'Progress', icon: Activity },
    { id: 'triggers' as TabType, label: 'Triggers', icon: Target },
    { id: 'doctor' as TabType, label: 'Doctor', icon: FileText },
    { id: 'suggestions' as TabType, label: 'Suggest', icon: Utensils },
  ];

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-5">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Insights
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Understand your IBS patterns
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-slide-up">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse-soft">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Progress Tab */}
            {activeTab === 'progress' && progressData && (
              <div className="space-y-4 animate-fade-in">
                {/* Week Trend */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    {getTrendIcon()}
                    <span className={cn("font-display font-semibold", getTrendColor())}>
                      {getTrendLabel()}
                    </span>
                  </div>
                  {progressData.trend === 'insufficient' && (
                    <p className="text-xs text-muted-foreground">
                      Log more meals with symptoms to see trends
                    </p>
                  )}
                </div>

                {/* Averages */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Last 7 Days Avg</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {progressData.last7DaysAvg !== null ? `${progressData.last7DaysAvg}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">/12 max</p>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Previous 7 Days</p>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {progressData.prev7DaysAvg !== null ? `${progressData.prev7DaysAvg}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">/12 max</p>
                  </div>
                </div>

                {/* Tracking Consistency */}
                <div className="bg-card rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span className="font-display font-semibold text-foreground text-sm">
                      Tracking This Week
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{progressData.mealsLast7Days} meals</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{progressData.symptomsLast7Days} symptoms</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center gap-2 p-2 rounded-lg text-sm",
                    progressData.completionRatio >= 0.6 
                      ? "bg-success/10 text-success" 
                      : "bg-caution/10 text-caution"
                  )}>
                    {progressData.completionRatio >= 0.6 
                      ? <CheckCircle className="w-4 h-4" />
                      : <AlertTriangle className="w-4 h-4" />
                    }
                    {progressData.guidanceMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Triggers Tab */}
            {activeTab === 'triggers' && (
              <div className="space-y-4 animate-fade-in">
                {validTolerance.length === 0 ? (
                  <div className="bg-card rounded-xl p-6 border border-border text-center">
                    <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      Not enough data yet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Log meals + symptoms at least twice per food to see triggers.
                    </p>
                    <p className="text-primary/70 text-xs mt-2">
                      The more you log, the clearer your triggers become.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Safe Foods */}
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        Top Safe Foods
                      </h3>
                      {safeFoods.length > 0 ? (
                        <div className="bg-card rounded-xl border border-border divide-y divide-border">
                          {safeFoods.map((food) => (
                            <div key={food.food_name} className="p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                                <span className="text-xs text-success font-medium">
                                  {getToleranceLabel(food.tolerance_percent)}
                                </span>
                              </div>
                              <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-card rounded-xl p-4 border border-border text-center">
                          <p className="text-muted-foreground text-sm">No safe foods identified yet</p>
                        </div>
                      )}
                    </div>

                    {/* Trigger Foods */}
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        Top Trigger Foods
                      </h3>
                      {triggerFoods.length > 0 ? (
                        <div className="bg-card rounded-xl border border-border divide-y divide-border">
                          {triggerFoods.map((food) => (
                            <div key={food.food_name} className="p-3">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                                <span className={cn(
                                  "text-xs font-medium",
                                  food.tolerance_percent < 40 ? "text-destructive" : "text-caution"
                                )}>
                                  {getToleranceLabel(food.tolerance_percent)}
                                </span>
                              </div>
                              <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-card rounded-xl p-4 border border-border text-center">
                          <p className="text-muted-foreground text-sm">No triggers identified yet</p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Based on your tracking (≥2 logs per food)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Doctor Summary Tab */}
            {activeTab === 'doctor' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <h3 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Summary for Medical Discussion
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IBS Type:</span>
                      <span className="font-medium text-foreground">{profile?.ibs_type || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Severity:</span>
                      <span className="font-medium text-foreground capitalize">{profile?.severity || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Main Symptoms:</span>
                      <span className="font-medium text-foreground text-right max-w-[60%]">
                        {profile?.symptoms.length ? profile.symptoms.slice(0, 3).join(', ') : '—'}
                      </span>
                    </div>
                    {progressData?.last7DaysAvg !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recent Avg Score:</span>
                        <span className="font-medium text-foreground">{progressData.last7DaysAvg}/12</span>
                      </div>
                    )}
                  </div>

                  {triggerFoods.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Likely Triggers:</p>
                      <div className="flex flex-wrap gap-1">
                        {triggerFoods.slice(0, 5).map(f => (
                          <span key={f.food_name} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                            {f.food_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {safeFoods.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Generally Tolerated:</p>
                      <div className="flex flex-wrap gap-1">
                        {safeFoods.slice(0, 5).map(f => (
                          <span key={f.food_name} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                            {f.food_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCopySummary}
                  className="w-full h-12 rounded-xl gradient-calm text-primary-foreground border-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Summary
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Bring this summary to discuss with your doctor
                </p>
              </div>
            )}

            {/* Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    {hasPersonalSuggestionData ? 'Based on your safe foods' : 'Based on default safe foods'}
                  </p>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRefreshKey(k => k + 1)}
                    className="rounded-xl h-8 w-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {safeFoodsForSuggestions.length === 0 ? (
                  <div className="bg-card rounded-xl p-6 border border-border text-center">
                    <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-display font-semibold text-foreground mb-2">
                      No safe foods yet
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Log meals with symptoms to discover your safe foods.
                    </p>
                  </div>
                ) : (
                  <>
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={suggestion.mealType}
                        className="bg-card rounded-xl p-4 border border-border animate-slide-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMealColor(suggestion.mealType)}`}>
                            {getMealIcon(suggestion.mealType)}
                          </div>
                          <h3 className="font-display text-lg font-semibold text-foreground capitalize">
                            {suggestion.mealType}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {suggestion.foods.filter(f => f).map((food, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1.5 bg-success/10 text-success text-sm font-medium rounded-full"
                            >
                              {food}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}

                    <p className="text-xs text-muted-foreground text-center">
                      {hasPersonalSuggestionData 
                        ? `✨ Based on your ${toleranceData.filter(t => t.tolerance_percent >= 70).length} personal safe foods`
                        : `📚 Using ${defaultSafeFoods.length} default safe foods`
                      }
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <Disclaimer />
      </div>
    </MobileLayout>
  );
}