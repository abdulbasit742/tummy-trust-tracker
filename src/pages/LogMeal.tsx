import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { useUser } from '@/contexts/UserContext';
import { FOODS_DATABASE, PORTION_SIZES } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { Utensils, Clock, Activity, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LogMeal() {
  const navigate = useNavigate();
  const { addMealLog } = useUser();
  const { toast } = useToast();

  const [foodName, setFoodName] = useState('');
  const [portionSize, setPortionSize] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState([0]);
  const [notes, setNotes] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = FOODS_DATABASE
    .filter(f => f.name.toLowerCase().includes(foodName.toLowerCase()))
    .slice(0, 5);

  const getSeverityLabel = (value: number) => {
    if (value === 0) return 'No symptoms';
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

  const handleSubmit = () => {
    if (!foodName.trim() || !portionSize) {
      toast({
        title: "Missing information",
        description: "Please enter the food name and portion size.",
        variant: "destructive",
      });
      return;
    }

    addMealLog({
      foodName: foodName.trim(),
      portionSize,
      time: new Date(),
      symptomSeverity: symptomSeverity[0],
      notes: notes.trim(),
    });

    toast({
      title: "Meal logged! ✓",
      description: `${foodName} has been added to your log.`,
    });

    // Reset form
    setFoodName('');
    setPortionSize('');
    setSymptomSeverity([0]);
    setNotes('');
    
    navigate('/');
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Log Meal
          </h1>
          <p className="text-muted-foreground mt-1">
            Track what you eat and how you feel
          </p>
        </div>

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
              className="h-14 text-lg rounded-2xl bg-card border-border"
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
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <span className="text-foreground">{food.name}</span>
                    <span className="text-sm text-muted-foreground">{food.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Portion Size */}
        <div className="animate-slide-up space-y-2" style={{ animationDelay: '0.05s' }}>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Portion Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PORTION_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setPortionSize(size)}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                  portionSize === size
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom Severity */}
        <div className="animate-slide-up space-y-4" style={{ animationDelay: '0.1s' }}>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Activity className="w-4 h-4 text-primary" />
            Symptom Severity
          </label>
          
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                "font-display font-semibold text-lg",
                getSeverityColor(symptomSeverity[0])
              )}>
                {getSeverityLabel(symptomSeverity[0])}
              </span>
              <span className={cn(
                "text-2xl font-bold",
                getSeverityColor(symptomSeverity[0])
              )}>
                {symptomSeverity[0]}/10
              </span>
            </div>
            
            <Slider
              value={symptomSeverity}
              onValueChange={setSymptomSeverity}
              max={10}
              step={1}
              className="w-full"
            />
            
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>No symptoms</span>
              <span>Very severe</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="animate-slide-up space-y-2" style={{ animationDelay: '0.15s' }}>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="w-4 h-4 text-primary" />
            Notes (optional)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional observations..."
            className="min-h-[100px] rounded-2xl bg-card border-border resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="animate-slide-up pt-4" style={{ animationDelay: '0.2s' }}>
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-semibold rounded-2xl gradient-calm text-primary-foreground border-0"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
