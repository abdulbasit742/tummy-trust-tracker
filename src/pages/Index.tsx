import React from 'react';
import { useUser } from '@/contexts/UserContext';
import Onboarding from './Onboarding';
import Home from './Home';

const Index = () => {
  const { isOnboarded } = useUser();

  if (!isOnboarded) {
    return <Onboarding />;
  }

  return <Home />;
};

export default Index;
