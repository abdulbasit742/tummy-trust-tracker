import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PORTION_SIZES } from '@/data/constants';
import { FoodReference, PortionSize } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Utensils, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'meal' | 'symptoms';

export default function LogMeal() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const suggestions = foods
    .filter(f => f.name.toLowerCase().includes(foodName.toLowerCase()))
    .slice(0, 5);

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

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: user.id,
        food_name: foodName.trim(),
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

    toast({
      title: "Logged successfully!",
      description: `${foodName} and symptoms recorded.`,
    });

    navigate('/');
  };

  const handleSkipSymptoms = () => {
    toast({
      title: "Meal logged!",
      description: `${foodName} recorded without symptoms.`,
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
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {step === 'meal' ? 'Log Meal' : 'Log Symptoms'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'meal' 
              ? 'What did you eat?' 
              : `How do you feel after ${foodName}?`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex-1 h-1.5 rounded-full",
            step === 'meal' ? "bg-primary" : "bg-primary"
          )} />
          <div className={cn(
            "flex-1 h-1.5 rounded-full",
            step === 'symptoms' ? "bg-primary" : "bg-muted"
          )} />
        </div>

        {step === 'meal' ? (
          <>
            {/* Food Name */}
            <div className="animate-slide-up space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Utensils className="w-4 h-4 text-primary" />
                Food Name
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
                  placeholder="What did you eat?"
                  className="h-12 rounded-xl bg-card border-border"
                />
                
                {showSuggestions && foodName && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-elevated border border-border overflow-hidden z-10">
                    {suggestions.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => {
                          setFoodName(food.name);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm"
                      >
                        {food.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Portion Size */}
            <div className="animate-slide-up space-y-2" style={{ animationDelay: '0.05s' }}>
              <label className="text-sm font-medium text-foreground">
                Portion Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PORTION_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setPortion(size.value as PortionSize)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                      portion === size.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="animate-slide-up space-y-2" style={{ animationDelay: '0.1s' }}>
              <label className="text-sm font-medium text-foreground">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="min-h-[80px] rounded-xl bg-card border-border resize-none"
              />
            </div>

            {/* Submit */}
            <Button
              onClick={handleMealSubmit}
              disabled={isSubmitting || !foodName.trim() || !portion}
              className="w-full h-12 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0"
            >
              {isSubmitting ? 'Saving...' : 'Next: Log Symptoms'}
            </Button>
          </>
        ) : (
          <>
            {/* Bloating Slider */}
            <div className="animate-slide-up space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Bloating</label>
                <span className={cn("font-semibold", getSeverityColor(bloating[0]))}>
                  {bloating[0]}/10 - {getSeverityLabel(bloating[0])}
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
            <div className="animate-slide-up space-y-3" style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Pain/Cramping</label>
                <span className={cn("font-semibold", getSeverityColor(pain[0]))}>
                  {pain[0]}/10 - {getSeverityLabel(pain[0])}
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
            <div className="animate-slide-up flex items-center justify-between p-4 bg-card rounded-xl border border-border" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3">
                <AlertCircle className={cn(
                  "w-5 h-5",
                  stoolIssue ? "text-destructive" : "text-muted-foreground"
                )} />
                <span className="font-medium text-foreground">Stool Issue</span>
              </div>
              <Switch
                checked={stoolIssue}
                onCheckedChange={setStoolIssue}
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleSymptomSubmit}
                disabled={isSubmitting}
                className="w-full h-12 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkipSymptoms}
                className="w-full h-12 text-muted-foreground"
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
