import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, MealLog, ToleranceScore, IBSType, Symptom, SeverityLevel } from '@/types';
import { MOCK_TOLERANCE_SCORES } from '@/data/mockData';

interface UserContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  isOnboarded: boolean;
  completeOnboarding: (data: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  mealLogs: MealLog[];
  addMealLog: (log: Omit<MealLog, 'id' | 'userId'>) => void;
  toleranceScores: ToleranceScore[];
  updateToleranceScore: (foodName: string, reaction: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('ibs-profile');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('ibs-meal-logs');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [toleranceScores, setToleranceScores] = useState<ToleranceScore[]>(() => {
    const saved = localStorage.getItem('ibs-tolerance-scores');
    return saved ? JSON.parse(saved) : MOCK_TOLERANCE_SCORES;
  });

  const isOnboarded = profile !== null;

  useEffect(() => {
    if (profile) {
      localStorage.setItem('ibs-profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('ibs-meal-logs', JSON.stringify(mealLogs));
  }, [mealLogs]);

  useEffect(() => {
    localStorage.setItem('ibs-tolerance-scores', JSON.stringify(toleranceScores));
  }, [toleranceScores]);

  const completeOnboarding = (data: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newProfile: UserProfile = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setProfile(newProfile);
  };

  const addMealLog = (log: Omit<MealLog, 'id' | 'userId'>) => {
    const newLog: MealLog = {
      ...log,
      id: crypto.randomUUID(),
      userId: profile?.id || '',
    };
    setMealLogs(prev => [newLog, ...prev]);
    
    // Update tolerance score based on reaction
    updateToleranceScore(log.foodName, log.symptomSeverity);
  };

  const updateToleranceScore = (foodName: string, reaction: number) => {
    setToleranceScores(prev => {
      const existing = prev.find(s => s.foodName.toLowerCase() === foodName.toLowerCase());
      
      if (existing) {
        // Weighted average: more weight to recent reactions
        const newScore = Math.max(0, Math.min(100, 
          existing.score * 0.7 + (100 - reaction * 10) * 0.3
        ));
        return prev.map(s => 
          s.foodName.toLowerCase() === foodName.toLowerCase()
            ? { ...s, score: Math.round(newScore), reactionCount: s.reactionCount + 1, lastUpdated: new Date() }
            : s
        );
      } else {
        // New food entry
        const newEntry: ToleranceScore = {
          id: crypto.randomUUID(),
          userId: profile?.id || '',
          foodName,
          score: Math.round(100 - reaction * 10),
          reactionCount: 1,
          lastUpdated: new Date(),
        };
        return [...prev, newEntry];
      }
    });
  };

  return (
    <UserContext.Provider value={{
      profile,
      setProfile,
      isOnboarded,
      completeOnboarding,
      mealLogs,
      addMealLog,
      toleranceScores,
      updateToleranceScore,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
