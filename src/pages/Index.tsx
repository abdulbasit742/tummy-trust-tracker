import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';

const Index = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
