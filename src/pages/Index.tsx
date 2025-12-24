import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';

const Index = () => {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MobileLayout>
        <DashboardSkeleton />
      </MobileLayout>
    );
  }

  if (!profile) {
    return <Onboarding />;
  }

  return <Dashboard />;
};

export default Index;
