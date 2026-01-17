import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

type EventType = 
  | 'page_view'
  | 'food_check'
  | 'meal_logged'
  | 'symptom_logged'
  | 'share_clicked'
  | 'profile_updated'
  | 'water_logged';

interface TrackEventOptions {
  eventType: EventType;
  page?: string;
  metadata?: Record<string, Json>;
}

export function useAnalytics() {
  const { user } = useAuth();
  const location = useLocation();
  const lastTrackedPage = useRef<string>('');

  const trackEvent = useCallback(async ({ eventType, page, metadata = {} }: TrackEventOptions) => {
    try {
      await supabase.from('analytics_events').insert([{
        user_id: user?.id || null,
        event_type: eventType,
        page: page || location.pathname,
        metadata,
      }]);
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.error('Analytics error:', error);
    }
  }, [user?.id, location.pathname]);

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastTrackedPage.current) {
      lastTrackedPage.current = location.pathname;
      trackEvent({ eventType: 'page_view', page: location.pathname });
    }
  }, [location.pathname, trackEvent]);

  return { trackEvent };
}

// Provider component to initialize analytics
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}
