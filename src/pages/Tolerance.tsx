import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ToleranceCard } from '@/components/cards/ToleranceCard';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortOrder = 'highest' | 'lowest';
type FilterType = 'all' | 'safe' | 'caution' | 'avoid';

export default function Tolerance() {
  const { toleranceScores } = useUser();
  const [sortOrder, setSortOrder] = useState<SortOrder>('highest');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredAndSorted = [...toleranceScores]
    .filter(score => {
      if (filter === 'all') return true;
      if (filter === 'safe') return score.score >= 70;
      if (filter === 'caution') return score.score >= 40 && score.score < 70;
      if (filter === 'avoid') return score.score < 40;
      return true;
    })
    .sort((a, b) => 
      sortOrder === 'highest' ? b.score - a.score : a.score - b.score
    );

  const stats = {
    safe: toleranceScores.filter(s => s.score >= 70).length,
    caution: toleranceScores.filter(s => s.score >= 40 && s.score < 70).length,
    avoid: toleranceScores.filter(s => s.score < 40).length,
  };

  return (
    <MobileLayout>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Personal Tolerance
          </h1>
          <p className="text-muted-foreground mt-1">
            Based on your logged reactions
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          <button
            onClick={() => setFilter(filter === 'safe' ? 'all' : 'safe')}
            className={cn(
              "bg-card rounded-2xl p-4 shadow-card border-2 transition-all",
              filter === 'safe' ? "border-success" : "border-border"
            )}
          >
            <div className="text-2xl font-bold text-success">{stats.safe}</div>
            <div className="text-xs text-muted-foreground font-medium">Safe</div>
          </button>
          <button
            onClick={() => setFilter(filter === 'caution' ? 'all' : 'caution')}
            className={cn(
              "bg-card rounded-2xl p-4 shadow-card border-2 transition-all",
              filter === 'caution' ? "border-caution" : "border-border"
            )}
          >
            <div className="text-2xl font-bold text-caution">{stats.caution}</div>
            <div className="text-xs text-muted-foreground font-medium">Caution</div>
          </button>
          <button
            onClick={() => setFilter(filter === 'avoid' ? 'all' : 'avoid')}
            className={cn(
              "bg-card rounded-2xl p-4 shadow-card border-2 transition-all",
              filter === 'avoid' ? "border-destructive" : "border-border"
            )}
          >
            <div className="text-2xl font-bold text-destructive">{stats.avoid}</div>
            <div className="text-xs text-muted-foreground font-medium">Avoid</div>
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <Button
            variant={sortOrder === 'highest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortOrder('highest')}
            className="rounded-full"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Highest
          </Button>
          <Button
            variant={sortOrder === 'lowest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortOrder('lowest')}
            className="rounded-full"
          >
            <TrendingDown className="w-4 h-4 mr-1" />
            Lowest
          </Button>
          {filter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('all')}
              className="rounded-full ml-auto"
            >
              <Filter className="w-4 h-4 mr-1" />
              Clear filter
            </Button>
          )}
        </div>

        {/* Tolerance List */}
        <div className="space-y-3">
          {filteredAndSorted.length > 0 ? (
            filteredAndSorted.map((score, index) => (
              <div 
                key={score.id} 
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ToleranceCard tolerance={score} />
              </div>
            ))
          ) : (
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center animate-fade-in">
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? "No tolerance data yet. Start logging meals to build your personal profile!"
                  : `No foods in the "${filter}" category.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <Disclaimer compact />
      </div>
    </MobileLayout>
  );
}
