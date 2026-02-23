import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { IBS_TYPES, SYMPTOMS, SEVERITY_LEVELS, COMMON_TRIGGERS, DISCLAIMER_TEXT } from '@/data/constants';
import { IBSType, SeverityLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'welcome' | 'ibs-type' | 'symptoms' | 'severity' | 'triggers';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('welcome');
  const [ibsType, setIbsType] = useState<IBSType | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState<SeverityLevel | null>(null);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  const steps: Step[] = ['welcome', 'ibs-type', 'symptoms', 'severity', 'triggers'];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const canContinue = () => {
    switch (step) {
      case 'welcome': return disclaimerAccepted;
      case 'ibs-type': return ibsType !== null;
      case 'symptoms': return symptoms.length > 0;
      case 'severity': return severity !== null;
      case 'triggers': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setDirection(1);
      setStep(steps[nextIndex]);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setDirection(-1);
      setStep(steps[prevIndex]);
    }
  };

  const handleComplete = async () => {
    if (!user || !ibsType || !severity) return;
    
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        ibs_type: ibsType,
        severity: severity,
        symptoms: symptoms,
        trigger_sensitivities: triggers,
      });

    if (error) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    await refreshProfile();
    toast({
      title: "Profile created!",
      description: "Welcome to IBS Diet Companion.",
    });
    navigate('/');
  };

  const toggleSymptom = (symptomId: string) => {
    setSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const toggleTrigger = (trigger: string) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Step indicator dots + progress bar */}
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              className={cn(
                "rounded-full transition-colors duration-300",
                i === currentIndex
                  ? "bg-primary"
                  : i < currentIndex
                    ? "bg-primary/40"
                    : "bg-muted"
              )}
              animate={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          ))}
        </div>
        {step !== 'welcome' && (
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-4 py-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
        {/* Welcome Step */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col justify-center"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 gradient-calm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-elevated">
                <Heart className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-3">
                Let's personalize your experience
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Answer a few questions to help us tailor recommendations for you.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-soft mb-4">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {DISCLAIMER_TEXT}
              </p>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="disclaimer"
                  checked={disclaimerAccepted}
                  onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
                  className="mt-0.5"
                />
                <label 
                  htmlFor="disclaimer" 
                  className="text-sm font-semibold text-foreground cursor-pointer leading-tight"
                >
                  I understand and accept
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {/* IBS Type Step */}
        {step === 'ibs-type' && (
          <motion.div
            key="ibs-type"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              What's your IBS type?
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              This helps us provide more relevant recommendations.
            </p>

            <div className="space-y-3">
              {IBS_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setIbsType(type.value as IBSType)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                    ibsType === type.value
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="font-display font-semibold text-foreground">
                    {type.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Symptoms Step */}
        {step === 'symptoms' && (
          <motion.div
            key="symptoms"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Common symptoms
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Select all that apply to you.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SYMPTOMS.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={cn(
                    "flex items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                    symptoms.includes(symptom.id)
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="font-medium text-foreground text-sm">
                    {symptom.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Severity Step */}
        {step === 'severity' && (
          <motion.div
            key="severity"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Symptom severity
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              How would you describe your typical symptoms?
            </p>

            <div className="space-y-3">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSeverity(level.value as SeverityLevel)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                    severity === level.value
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="font-display font-semibold text-foreground">
                    {level.label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Triggers Step */}
        {step === 'triggers' && (
          <motion.div
            key="triggers"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col overflow-y-auto"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Known triggers
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Select any foods you already know trigger your symptoms (optional).
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_TRIGGERS.map((trigger) => (
                <button
                  key={trigger}
                  onClick={() => toggleTrigger(trigger)}
                  className={cn(
                    "px-4 py-2 rounded-full border-2 transition-all duration-200 text-sm font-medium",
                    triggers.includes(trigger)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  )}
                >
                  {trigger}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 h-14 rounded-xl font-semibold active:scale-[0.98] transition-transform"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canContinue() || isSubmitting}
            className={cn(
              "flex-1 h-14 rounded-xl gradient-calm text-primary-foreground border-0 font-semibold text-base shadow-soft active:scale-[0.98] transition-transform",
              currentIndex === 0 && "w-full"
            )}
          >
            {isSubmitting ? 'Saving...' : step === 'triggers' ? 'Get Started' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
