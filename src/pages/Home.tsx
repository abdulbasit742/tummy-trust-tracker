import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceBar } from '@/components/ui/ToleranceBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, BarChart3, Utensils, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { profile, mealLogs, toleranceScores } = useUser();

  const recentLogs = mealLogs.slice(0, 3);
  const topTolerance = [...toleranceScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const quickActions = [
    { label: 'Check Food', icon: Search, path: '/food-checker', color: 'bg-primary/10 text-primary' },
    { label: 'Log Meal', icon: PlusCircle, path: '/log-meal', color: 'bg-success/10 text-success' },
    { label: 'Tolerance', icon: BarChart3, path: '/tolerance', color: 'bg-caution/10 text-caution' },
    { label: 'Meal Ideas', icon: Utensils, path: '/suggestions', color: 'bg-accent text-accent-foreground' },
  ];

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.ibsType && `Managing ${profile.ibsType}`}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="bg-card rounded-2xl p-4 shadow-card border border-border hover:shadow-elevated transition-all duration-200 active:scale-[0.98]"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                  action.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-display font-semibold text-foreground">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Top Safe Foods */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Your Safe Foods
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tolerance')}>
              View all
            </Button>
          </div>

          {topTolerance.length > 0 ? (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border space-y-4">
              {topTolerance.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{item.foodName}</span>
                    <span className="text-sm font-bold text-success">{item.score}%</span>
                  </div>
                  <ToleranceBar score={item.score} showLabel={false} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
              <p className="text-muted-foreground">
                Start logging meals to discover your safe foods!
              </p>
              <Button 
                className="mt-4 gradient-calm text-primary-foreground border-0"
                onClick={() => navigate('/log-meal')}
              >
                Log Your First Meal
              </Button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Recent Logs
            </h2>
          </div>

          {recentLogs.length > 0 ? (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div 
                  key={log.id}
                  className="bg-card rounded-xl p-3 shadow-soft border border-border flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-foreground">{log.foodName}</span>
                    <span className="text-sm text-muted-foreground ml-2">{log.portionSize}</span>
                  </div>
                  <div className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded-full",
                    log.symptomSeverity <= 3 ? "bg-success/15 text-success" :
                    log.symptomSeverity <= 6 ? "bg-caution/15 text-caution" :
                    "bg-destructive/15 text-destructive"
                  )}>
                    {log.symptomSeverity}/10
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center">
              <p className="text-muted-foreground">
                No recent logs yet. Start tracking your meals!
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Disclaimer compact />
        </div>
      </div>
    </MobileLayout>
  );
}
