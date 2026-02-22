import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { EarlyUserStatus, WhyThisApp } from '@/components/ui/FreeAccessBanner';
import { ShareButton } from '@/components/ui/ShareButton';
import { CustomTipsEditor } from '@/components/ui/CustomTipsEditor';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ProfileSkeleton, MealLogSkeleton } from '@/components/ui/skeletons';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedList';
import { calculateToleranceScores } from '@/lib/toleranceEngine';
import { MealLog, SymptomLog, ToleranceData, IBSType, SeverityLevel } from '@/types';
import { IBS_TYPES, SYMPTOMS, SEVERITY_LEVELS } from '@/data/constants';
import { User, LogOut, Trash2, Edit2, ChevronRight, Save, X, AlertCircle, Lightbulb, Globe, Moon, Sun } from 'lucide-react';
import { SwipeToDelete } from '@/components/ui/SwipeToDelete';
import { CircularReveal } from '@/components/ui/CircularReveal';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MealWithSymptoms extends MealLog {
  symptom_logs?: SymptomLog[];
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { t, language, setLanguage, isUrdu } = useLanguage();
  const { toast } = useToast();
  
  const [mealLogs, setMealLogs] = useState<MealWithSymptoms[]>([]);
  const [toleranceData, setToleranceData] = useState<ToleranceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllLogs, setShowAllLogs] = useState(false);
  
  // Edit profile mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editIbsType, setEditIbsType] = useState<IBSType | null>(null);
  const [editSeverity, setEditSeverity] = useState<SeverityLevel | null>(null);
  const [editSymptoms, setEditSymptoms] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Symptom editing state
  const [editingSymptomLog, setEditingSymptomLog] = useState<SymptomLog | null>(null);
  const [editBloating, setEditBloating] = useState([0]);
  const [editPain, setEditPain] = useState([0]);
  const [editStoolIssue, setEditStoolIssue] = useState(false);

  // Custom tips editing state
  const [isEditingTips, setIsEditingTips] = useState(false);
  const [isSavingTips, setIsSavingTips] = useState(false);

  // Dark mode state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const [revealActive, setRevealActive] = useState(false);
  const [revealOrigin, setRevealOrigin] = useState({ x: 0, y: 0 });
  const [revealColor, setRevealColor] = useState('');
  const toggleRef = useRef<HTMLDivElement>(null);

  const toggleDarkMode = useCallback((checked: boolean) => {
    // Get toggle position for circular reveal origin
    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      setRevealOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }

    // The reveal color should be the NEW theme's background
    const newBg = checked
      ? 'hsl(222, 24%, 6%)'    // dark mode --background
      : 'hsl(42, 32%, 97%)';   // light mode --background
    setRevealColor(newBg);
    setRevealActive(true);

    // Apply theme change shortly after reveal starts (so the reveal covers the flash)
    setTimeout(() => {
      setIsDark(checked);
      if (checked) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }, 150);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealActive(false);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);

    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('eaten_at', { ascending: false });

    if (meals) {
      const { data: symptoms } = await supabase
        .from('symptom_logs')
        .select('*')
        .in('meal_log_id', meals.map(m => m.id));

      const mealsWithSymptoms = meals.map(meal => ({
        ...meal,
        symptom_logs: symptoms?.filter(s => s.meal_log_id === meal.id) || [],
      }));
      
      setMealLogs(mealsWithSymptoms as MealWithSymptoms[]);
    }

    const scores = await calculateToleranceScores(user.id);
    setToleranceData(scores);

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const { handlers, PullIndicator } = usePullToRefresh({
    onRefresh: loadData,
  });

  const handleDeleteMeal = async (mealId: string) => {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId);

    if (error) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Meal log removed.",
    });
    
    loadData();
  };

  const handleDeleteSymptom = async (symptomLogId: string) => {
    const { error } = await supabase
      .from('symptom_logs')
      .delete()
      .eq('id', symptomLogId);

    if (error) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Deleted",
      description: "Symptom log removed.",
    });
    
    loadData();
  };

  const startEditingSymptom = (symptomLog: SymptomLog) => {
    setEditingSymptomLog(symptomLog);
    setEditBloating([symptomLog.bloating_0_10]);
    setEditPain([symptomLog.pain_0_10]);
    setEditStoolIssue(symptomLog.stool_issue);
  };

  const cancelEditingSymptom = () => {
    setEditingSymptomLog(null);
  };

  const handleSaveSymptom = async () => {
    if (!editingSymptomLog) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('symptom_logs')
      .update({
        bloating_0_10: editBloating[0],
        pain_0_10: editPain[0],
        stool_issue: editStoolIssue,
      })
      .eq('id', editingSymptomLog.id);

    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    toast({
      title: "Updated",
      description: "Symptom log updated.",
    });
    setEditingSymptomLog(null);
    setIsSaving(false);
    loadData();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const startEditing = () => {
    if (profile) {
      setEditIbsType(profile.ibs_type);
      setEditSeverity(profile.severity);
      setEditSymptoms(profile.symptoms || []);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const toggleEditSymptom = (symptomId: string) => {
    setEditSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSaveProfile = async () => {
    if (!profile || !editIbsType || !editSeverity) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        ibs_type: editIbsType,
        severity: editSeverity,
        symptoms: editSymptoms,
      })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    await refreshProfile();
    toast({
      title: "Profile updated",
      description: "Your changes have been saved.",
    });
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleSaveCustomTips = async (tips: string[]) => {
    if (!profile) return;
    
    setIsSavingTips(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ custom_tips: tips })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: "Error saving tips",
        description: error.message,
        variant: "destructive",
      });
      setIsSavingTips(false);
      return;
    }

    await refreshProfile();
    toast({
      title: "Tips saved",
      description: "Your custom tips have been saved.",
    });
    setIsEditingTips(false);
    setIsSavingTips(false);
  };

  const getSeverityLabel = (value: number) => {
    if (value === 0) return 'None';
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'Severe';
    return 'Very severe';
  };

  const getSeverityColor = (value: number) => {
    if (value <= 3) return 'text-success';
    if (value <= 6) return 'text-caution';
    return 'text-destructive';
  };

  const displayedLogs = showAllLogs ? mealLogs : mealLogs.slice(0, 5);

  return (
    <MobileLayout>
      <StaggerContainer 
        className="px-5 py-6 space-y-6"
        {...handlers}
      >
        <PullIndicator />
        <StaggerItem>
          <SyncStatusIndicator 
            className="justify-end" 
            showRefreshButton 
            onRefresh={loadData}
          />
        </StaggerItem>
        
        {/* Header */}
        <StaggerItem><div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t('profile.title')}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton variant="icon" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="rounded-xl h-10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('auth.signOut')}
            </Button>
          </div>
        </div></StaggerItem>

        {/* Circular Reveal Effect */}
        <CircularReveal
          active={revealActive}
          x={revealOrigin.x}
          y={revealOrigin.y}
          color={revealColor}
          duration={0.55}
          onComplete={handleRevealComplete}
        />

        {/* Dark Mode Toggle */}
        <StaggerItem><div ref={toggleRef} className="bg-card rounded-2xl p-5 border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                isDark ? "bg-accent" : "bg-primary/10"
              )}>
                {isDark ? (
                  <Moon className="w-5 h-5 text-accent-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Dark Mode</h3>
                <p className="text-xs text-muted-foreground">
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </p>
              </div>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </div></StaggerItem>

        {/* Language Toggle */}
        <StaggerItem><div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Language / زبان</h3>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'English' : 'اردو'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-medium", language === 'en' ? "text-primary" : "text-muted-foreground")}>EN</span>
              <Switch
                checked={language === 'ur'}
                onCheckedChange={(checked) => setLanguage(checked ? 'ur' : 'en')}
              />
              <span className={cn("text-sm font-medium", language === 'ur' ? "text-primary" : "text-muted-foreground")}>اردو</span>
            </div>
          </div>
        </div></StaggerItem>

        {/* Profile Summary - View Mode */}
        {profile && !isEditing && (
          <StaggerItem><div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 gradient-calm rounded-2xl flex items-center justify-center shadow-glow">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground text-lg">{profile.ibs_type}</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile.severity} severity</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={startEditing}
                className="rounded-xl h-10 w-10 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            
            {(profile.symptoms?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {(profile.symptoms ?? []).slice(0, 4).map((symptom) => (
                  <span 
                    key={symptom}
                    className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full capitalize font-medium"
                  >
                    {symptom}
                  </span>
                ))}
                {(profile.symptoms?.length ?? 0) > 4 && (
                  <span className="text-xs text-muted-foreground px-3 py-1.5">
                    +{(profile.symptoms?.length ?? 0) - 4} more
                  </span>
                )}
              </div>
            )}
          </div></StaggerItem>
        )}

        {/* Profile Edit Mode */}
        {profile && isEditing && (
          <StaggerItem><div className="bg-card rounded-2xl p-5 border border-border shadow-soft space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-foreground text-lg">Edit Profile</h3>
              <Button variant="ghost" size="sm" onClick={cancelEditing} className="rounded-xl h-10 w-10 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">IBS Type</label>
              <div className="space-y-2">
                {IBS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setEditIbsType(type.value as IBSType)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium min-h-[52px]",
                      editIbsType === type.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Severity</label>
              <div className="grid grid-cols-3 gap-3">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setEditSeverity(level.value as SeverityLevel)}
                    className={cn(
                      "pill-button text-center",
                      editSeverity === level.value && "pill-button-active"
                    )}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">Symptoms</label>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom.id}
                    onClick={() => toggleEditSymptom(symptom.id)}
                    className={cn(
                      "px-4 py-2 rounded-full border-2 transition-all text-xs font-semibold min-h-[40px]",
                      editSymptoms.includes(symptom.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    )}
                  >
                    {symptom.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || !editIbsType || !editSeverity}
              className="w-full h-14 rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft font-semibold text-base active:scale-[0.98] transition-transform"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div></StaggerItem>
        )}

        {/* Early User Status */}
        <StaggerItem><EarlyUserStatus /></StaggerItem>

        {/* Share Section */}
        <StaggerItem><div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
          <ShareButton variant="full" />
        </div></StaggerItem>

        {/* Why This App */}
        <StaggerItem><WhyThisApp /></StaggerItem>

        {/* Custom Tips Section */}
        {isEditingTips ? (
          <CustomTipsEditor
            tips={profile?.custom_tips || []}
            onSave={handleSaveCustomTips}
            onCancel={() => setIsEditingTips(false)}
            isSaving={isSavingTips}
          />
        ) : (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-soft animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">Custom Tips</h3>
                  <p className="text-xs text-muted-foreground">
                    {profile?.custom_tips && profile.custom_tips.length > 0 
                      ? `${profile.custom_tips.length} custom tip${profile.custom_tips.length > 1 ? 's' : ''}`
                      : 'Add your own motivational messages'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTips(true)}
                className="rounded-xl h-10 w-10 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Personal Tolerance */}
        <StaggerItem><div className="animate-slide-up">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Personal Tolerance
          </h2>

          {toleranceData.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-soft">
              {toleranceData.slice(0, 8).map((food) => (
                <div key={food.food_name} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">{food.food_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {food.meal_count} {food.meal_count === 1 ? 'log' : 'logs'}
                    </span>
                  </div>
                  <ToleranceBar score={food.tolerance_percent} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Log meals with symptoms to build your tolerance profile
              </p>
            </div>
          )}
        </div></StaggerItem>

        {/* Meal History */}
        <StaggerItem><div>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Meal History
          </h2>

          {isLoading ? (
            <MealLogSkeleton count={3} />
          ) : mealLogs.length > 0 ? (
            <div className="space-y-3">
              {displayedLogs.map((meal) => (
                <SwipeToDelete
                  key={meal.id}
                  onDelete={() => handleDeleteMeal(meal.id)}
                >
                  <div className="bg-card rounded-2xl p-4 border border-border shadow-soft">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm truncate">{meal.food_name}</span>
                          <span className="text-xs text-muted-foreground font-medium">({meal.portion})</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(meal.eaten_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">← swipe</span>
                    </div>

                    {/* Symptom Logs for this meal */}
                    {meal.symptom_logs && meal.symptom_logs.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        {meal.symptom_logs.map((symptomLog) => (
                          <div key={symptomLog.id}>
                            {editingSymptomLog?.id === symptomLog.id ? (
                              <div className="space-y-4 p-3 bg-muted/40 rounded-xl">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-foreground">Edit Symptoms</span>
                                  <Button variant="ghost" size="sm" onClick={cancelEditingSymptom} className="h-8 w-8 p-0 rounded-lg">
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Bloating</span>
                                    <span className={cn("text-xs font-medium", getSeverityColor(editBloating[0]))}>
                                      {editBloating[0]}/10
                                    </span>
                                  </div>
                                  <Slider
                                    value={editBloating}
                                    onValueChange={setEditBloating}
                                    max={10}
                                    step={1}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Pain</span>
                                    <span className={cn("text-xs font-medium", getSeverityColor(editPain[0]))}>
                                      {editPain[0]}/10
                                    </span>
                                  </div>
                                  <Slider
                                    value={editPain}
                                    onValueChange={setEditPain}
                                    max={10}
                                    step={1}
                                    className="w-full"
                                  />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Stool Issue</span>
                                  <Switch
                                    checked={editStoolIssue}
                                    onCheckedChange={setEditStoolIssue}
                                  />
                                </div>
                                
                                <Button
                                  onClick={handleSaveSymptom}
                                  disabled={isSaving}
                                  size="sm"
                                  className="w-full h-10 text-sm rounded-xl font-semibold"
                                >
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between py-1">
                                <span className={cn(
                                  "text-xs font-medium px-2 py-0.5 rounded-full",
                                  symptomLog.bloating_0_10 + symptomLog.pain_0_10 <= 4 
                                    ? "bg-success/15 text-success" 
                                    : symptomLog.bloating_0_10 + symptomLog.pain_0_10 <= 10
                                    ? "bg-caution/15 text-caution"
                                    : "bg-destructive/15 text-destructive"
                                )}>
                                  B:{symptomLog.bloating_0_10} P:{symptomLog.pain_0_10} {symptomLog.stool_issue && '💩'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditingSymptom(symptomLog)}
                                    className="p-1 text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSymptom(symptomLog.id)}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!meal.symptom_logs || meal.symptom_logs.length === 0) && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground italic">
                          No symptoms logged
                        </span>
                      </div>
                    )}
                  </div>
                </SwipeToDelete>
              ))}
              
              {mealLogs.length > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="w-full text-muted-foreground h-12 font-medium"
                >
                  {showAllLogs ? 'Show less' : `Show all ${mealLogs.length} logs`}
                  <ChevronRight className={cn(
                    "w-4 h-4 ml-1.5 transition-transform",
                    showAllLogs && "rotate-90"
                  )} />
                </Button>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p className="text-muted-foreground text-sm">No meal logs yet</p>
            </div>
          )}
        </div></StaggerItem>

        {/* Disclaimer */}
        <StaggerItem><Disclaimer /></StaggerItem>
      </StaggerContainer>
    </MobileLayout>
  );
}
