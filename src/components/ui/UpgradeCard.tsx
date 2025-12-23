import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, TrendingUp, Target, FileText, Lightbulb, Check } from 'lucide-react';

interface UpgradeCardProps {
  className?: string;
  onUpgraded?: () => void;
}

export function UpgradeCard({ className, onUpgraded }: UpgradeCardProps) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  const handleUpgrade = async () => {
    if (!profile) return;
    
    setIsUpgrading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ plan: 'plus' })
      .eq('id', profile.id);

    if (error) {
      toast({
        title: "Error upgrading",
        description: error.message,
        variant: "destructive",
      });
      setIsUpgrading(false);
      return;
    }

    await refreshProfile();
    toast({
      title: "Plus features unlocked!",
      description: "You now have access to all insights and suggestions.",
    });
    setIsUpgrading(false);
    onUpgraded?.();
  };

  const features = [
    { icon: TrendingUp, text: "See progress trends" },
    { icon: Target, text: "Identify strongest trigger foods" },
    { icon: FileText, text: "Get doctor-ready summaries" },
    { icon: Lightbulb, text: "Daily personalized food suggestions" },
  ];

  return (
    <div className={`bg-card rounded-2xl p-6 border border-border shadow-card ${className}`}>
      <div className="text-center mb-5">
        <div className="w-14 h-14 gradient-calm rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          Unlock IBS Insights
        </h2>
        <p className="text-muted-foreground text-sm">
          Get deeper understanding of your patterns
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground text-sm">{feature.text}</span>
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className="w-full h-12 text-base font-semibold rounded-xl gradient-calm text-primary-foreground border-0"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isUpgrading ? 'Upgrading...' : 'Upgrade to Plus'}
      </Button>

      <Disclaimer className="mt-4" />
    </div>
  );
}

export function PlusBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
      <Sparkles className="w-3 h-3" />
      Plus
    </span>
  );
}