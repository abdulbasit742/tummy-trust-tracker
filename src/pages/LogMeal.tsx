import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/use-analytics';
import { supabase } from '@/integrations/supabase/client';
import { PORTION_SIZES } from '@/data/constants';
import { FoodReference, PortionSize, FoodStatus } from '@/types';
import { normalizeFoodName, displayFoodName, searchFoods, getFoodDisplayName } from '@/lib/utils/foodUtils';
import { useToast } from '@/hooks/use-toast';
import { Utensils, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'meal' | 'symptoms';

export default function LogMeal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('meal');
  const [mealLogId, setMealLogId] = useState<string | null>(null);
  
  // Meal form
  const [foodName, setFoodName] = useState('');
  const [portion, setPortion] = useState<PortionSize | null>(null);
  const [notes, setNotes] = useState('');
  const [foods, setFoods] = useState<FoodReference[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Symptom form
  const [bloating, setBloating] = useState([0]);
  const [pain, setPain] = useState([0]);
  const [stoolIssue, setStoolIssue] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    const { data } = await supabase
      .from('food_reference')
      .select('*')
      .order('name');
    setFoods((data as FoodReference[]) || []);
  };

  // Use bilingual search
  const suggestions = searchFoods(foodName, foods).slice(0, 6);

  const normalizedInput = normalizeFoodName(foodName);
  const selectedFoodRef = foods.find(f => normalizeFoodName(f.name) === normalizedInput);
  const isCustomFood = foodName.trim().length >= 2 && !selectedFoodRef;

  const handleMealSubmit = async () => {
    if (!user || !foodName.trim() || !portion) {
      toast({
        title: "Missing information",
        description: "Please enter food name and portion size.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Store normalized food name for consistent matching
    const normalizedFoodName = displayFoodName(foodName);
    
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        food_name: normalizedFoodName,
        portion: portion,
        eaten_at: new Date().toISOString(),
        notes: notes.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error logging meal",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setMealLogId(data.id);
    trackEvent({ 
      eventType: 'meal_logged', 
      metadata: { food_name: normalizedFoodName, portion: portion } 
    });
    setStep('symptoms');
    setIsSubmitting(false);
  };

  const handleSymptomSubmit = async () => {
    if (!mealLogId) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('symptom_logs')
      .insert({
        meal_log_id: mealLogId,
        bloating_0_10: bloating[0],
        pain_0_10: pain[0],
        stool_issue: stoolIssue,
      });

    if (error) {
      toast({
        title: "Error logging symptoms",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    trackEvent({ 
      eventType: 'symptom_logged', 
      metadata: { bloating: bloating[0], pain: pain[0], stool_issue: stoolIssue } 
    });

    toast({
      title: "Logged successfully!",
      description: `${displayFoodName(foodName)} and symptoms recorded.`,
    });

    navigate('/');
  };

  const handleSkipSymptoms = () => {
    toast({
      title: "Meal logged!",
      description: `${displayFoodName(foodName)} recorded without symptoms.`,
    });
    navigate('/');
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

  return (
    <MobileLayout>
      <div className="px-5 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {step === 'meal' ? 'Log Meal' : 'Log Symptoms'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            {step === 'meal' 
              ? 'What did you eat?' 
              : `How do you feel after ${displayFoodName(foodName)}?`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex-1 h-1.5 rounded-full transition-colors",
            step === 'meal' ? "bg-primary" : "bg-primary"
          )} />
          <div className={cn(
            "flex-1 h-1.5 rounded-full transition-colors",
            step === 'symptoms' ? "bg-primary" : "bg-muted"
          )} />
        </div>

        {step === 'meal' ? (
          <>
            {/* Food Name with Autocomplete */}
            <div className="animate-slide-up space-y-3 relative z-20">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
                <Utensils className="w-4 h-4 text-primary" />
                Food Name *
              </label>
              <div className="relative">
                <Input
                  value={foodName}
                  onChange={(e) => {
                    setFoodName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type: Rice, چاول, chawal"
                  className="h-14 rounded-xl bg-card border-border text-base"
                  dir="auto"
                />
                
                {/* Autocomplete Dropdown */}
                {showSuggestions && foodName.length >= 1 && suggestions.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-elevated border border-border overflow-hidden max-h-[280px] flex flex-col"
                    style={{ 
                      backgroundColor: 'hsl(40 40% 99%)',
                      zIndex: 9999,
                      position: 'absolute'
                    }}
                  >
                    {/* Close button header */}
                    <div 
                      className="flex items-center justify-between px-4 py-2 border-b border-border"
                      style={{ backgroundColor: 'hsl(42 18% 96%)' }}
                    >
                      <span className="text-xs text-muted-foreground font-medium">
                        {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors"
                        aria-label="Close suggestions"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    
                    {/* Suggestions list */}
                    <div className="overflow-y-auto flex-1">
                      {suggestions.map((food) => (
                        <button
                          key={food.id}
                          onClick={() => {
                            setFoodName(food.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3.5 transition-colors flex items-center justify-between min-h-[52px]"
                          style={{ backgroundColor: 'hsl(40 40% 99%)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(42 18% 94%)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(40 40% 99%)'}
                        >
                          <span className="text-sm text-foreground font-medium" dir="auto">
                            {getFoodDisplayName(food)}
                          </span>
                          <StatusBadge status={food.default_status as FoodStatus} size="sm" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom food notice */}
              {isCustomFood && (
                <div className="flex items-start gap-3 p-3 bg-caution/8 rounded-xl border border-caution/20">
                  <Info className="w-4 h-4 text-caution flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Custom food - will be tracked as "Caution" until you log reactions.
                  </p>
                </div>
              )}

              {/* Selected food preview */}
              {selectedFoodRef && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                  <StatusBadge status={selectedFoodRef.default_status as FoodStatus} size="sm" />
                  <span className="text-xs text-muted-foreground leading-relaxed">{selectedFoodRef.fodmap_note}</span>
                </div>
              )}

              {/* Caution/Avoid food encouragement */}
              {selectedFoodRef && (selectedFoodRef.default_status === 'caution' || selectedFoodRef.default_status === 'avoid') && (
                <div className="bg-caution/8 border border-caution/20 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    😊 Don't worry! With the right portion size and preventive measures, many people tolerate this well. Track your reaction to learn what works for you!
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-caution/30 text-caution hover:bg-caution/10"
                    onClick={() => setNotes(prev => prev + (prev ? '\n' : '') + 'Eating cautious food - monitoring reaction')}
                  >
                    📝 Add precaution note
                  </Button>
                </div>
              )}
            </div>

            {/* Portion Size */}
            <div className="animate-slide-up space-y-3" style={{ animationDelay: '0.05s' }}>
              <label className="text-sm font-semibold text-foreground">
                Portion Size *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PORTION_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setPortion(size.value as PortionSize)}
                    className={cn(
                      "pill-button text-center",
                      portion === size.value && "pill-button-active"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="animate-slide-up space-y-3" style={{ animationDelay: '0.1s' }}>
              <label className="text-sm font-semibold text-foreground">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="min-h-[80px]"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleMealSubmit}
              disabled={isSubmitting || !foodName.trim() || !portion}
              className="w-full h-14 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? 'Saving...' : 'Next: Log Symptoms'}
            </Button>
          </>
        ) : (
          <>
            {/* Bloating Slider */}
            <div className="animate-slide-up space-y-4 bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Bloating</label>
                <span className={cn("font-bold text-sm", getSeverityColor(bloating[0]))}>
                  {bloating[0]}/10 — {getSeverityLabel(bloating[0])}
                </span>
              </div>
              <Slider
                value={bloating}
                onValueChange={setBloating}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Pain Slider */}
            <div className="animate-slide-up space-y-4 bg-card rounded-2xl p-5 border border-border" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Pain/Cramping</label>
                <span className={cn("font-bold text-sm", getSeverityColor(pain[0]))}>
                  {pain[0]}/10 — {getSeverityLabel(pain[0])}
                </span>
              </div>
              <Slider
                value={pain}
                onValueChange={setPain}
                max={10}
                step={1}
                className="w-full"
              />
            </div>

            {/* Stool Issue Toggle */}
            <div className="animate-slide-up flex items-center justify-between p-5 bg-card rounded-2xl border border-border" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  stoolIssue ? "bg-destructive/10" : "bg-muted"
                )}>
                  <AlertCircle className={cn(
                    "w-5 h-5",
                    stoolIssue ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <span className="font-semibold text-foreground text-sm">Stool Issue</span>
              </div>
              <Switch
                checked={stoolIssue}
                onCheckedChange={setStoolIssue}
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleSymptomSubmit}
                disabled={isSubmitting}
                className="w-full h-14 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0 shadow-soft active:scale-[0.98] transition-transform"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkipSymptoms}
                className="w-full h-12 text-muted-foreground font-medium hover:text-foreground"
              >
                Skip symptom logging
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
