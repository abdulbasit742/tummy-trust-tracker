import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  offlineFoods, 
  offlineMealLogs, 
  offlineSymptomLogs, 
  offlineWaterLogs,
  isOnline,
  generateOfflineId,
  metadata
} from '@/lib/offlineStorage';
import { addToSyncQueue, processSyncQueue, getPendingSyncCount } from '@/lib/syncQueue';
import { FoodReference } from '@/types';

export function useOfflineData() {
  const { user } = useAuth();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Update pending sync count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
  }, []);

  // Sync data when online
  const syncData = useCallback(async () => {
    if (!isOnline() || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await processSyncQueue();
      await updatePendingCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      syncData();
    };

    window.addEventListener('online', handleOnline);
    
    // Initial sync check
    updatePendingCount();
    if (isOnline()) {
      syncData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncData, updatePendingCount]);

  // Food Reference - with offline fallback
  const getFoods = useCallback(async (): Promise<FoodReference[]> => {
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('food_reference')
          .select('*')
          .order('name');
        
        if (!error && data) {
          // Cache for offline use
          await offlineFoods.saveAll(data);
          await metadata.set('foods_last_sync', Date.now());
          return data as FoodReference[];
        }
      }
    } catch (error) {
      console.log('Falling back to offline foods');
    }
    
    // Fallback to cached data
    const cached = await offlineFoods.getAll();
    return cached as FoodReference[];
  }, []);

  // Meal Logs - with offline support
  const getMealLogs = useCallback(async () => {
    if (!user) return [];
    
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('eaten_at', { ascending: false });
        
        if (!error && data) {
          await offlineMealLogs.saveAll(data);
          return data;
        }
      }
    } catch (error) {
      console.log('Falling back to offline meal logs');
    }
    
    return offlineMealLogs.getByUserId(user.id);
  }, [user]);

  const getTodayMealLogs = useCallback(async () => {
    if (!user) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('meal_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('eaten_at', today.toISOString())
          .order('eaten_at', { ascending: false });
        
        if (!error && data) {
          // Update cache with fresh data
          for (const meal of data) {
            await offlineMealLogs.save(meal);
          }
          return data;
        }
      }
    } catch (error) {
      console.log('Falling back to offline today meals');
    }
    
    return offlineMealLogs.getTodayByUserId(user.id);
  }, [user]);

  const addMealLog = useCallback(async (mealData: any) => {
    if (!user) throw new Error('User not authenticated');
    
    const fullData = {
      ...mealData,
      user_id: user.id,
      eaten_at: mealData.eaten_at || new Date().toISOString(),
    };

    if (isOnline()) {
      const { data, error } = await supabase
        .from('meal_logs')
        .insert(fullData)
        .select()
        .single();
      
      if (error) throw error;
      
      await offlineMealLogs.save(data);
      return data;
    } else {
      // Offline: save locally and queue for sync
      const offlineId = generateOfflineId();
      const offlineData = { ...fullData, id: offlineId };
      
      await offlineMealLogs.save(offlineData);
      await addToSyncQueue('meal_log', 'insert', { ...fullData, offlineId });
      await updatePendingCount();
      
      return offlineData;
    }
  }, [user, updatePendingCount]);

  // Symptom Logs - with offline support
  const getSymptomLogs = useCallback(async (mealLogIds: string[]) => {
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('symptom_logs')
          .select('*')
          .in('meal_log_id', mealLogIds);
        
        if (!error && data) {
          await offlineSymptomLogs.saveAll(data);
          return data;
        }
      }
    } catch (error) {
      console.log('Falling back to offline symptom logs');
    }
    
    const all = await offlineSymptomLogs.getAll();
    return all.filter(s => mealLogIds.includes(s.meal_log_id));
  }, []);

  const addSymptomLog = useCallback(async (symptomData: any) => {
    const fullData = {
      ...symptomData,
      recorded_at: symptomData.recorded_at || new Date().toISOString(),
    };

    if (isOnline()) {
      const { data, error } = await supabase
        .from('symptom_logs')
        .insert(fullData)
        .select()
        .single();
      
      if (error) throw error;
      
      await offlineSymptomLogs.save(data);
      return data;
    } else {
      const offlineId = generateOfflineId();
      const offlineData = { ...fullData, id: offlineId };
      
      await offlineSymptomLogs.save(offlineData);
      await addToSyncQueue('symptom_log', 'insert', { ...fullData, offlineId });
      await updatePendingCount();
      
      return offlineData;
    }
  }, [updatePendingCount]);

  // Water Logs - with offline support
  const getTodayWaterLogs = useCallback(async () => {
    if (!user) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    try {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('water_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('logged_at', today.toISOString());
        
        if (!error && data) {
          for (const log of data) {
            await offlineWaterLogs.save(log);
          }
          return data;
        }
      }
    } catch (error) {
      console.log('Falling back to offline water logs');
    }
    
    return offlineWaterLogs.getTodayByUserId(user.id);
  }, [user]);

  const addWaterLog = useCallback(async (glasses: number = 1) => {
    if (!user) throw new Error('User not authenticated');
    
    const fullData = {
      user_id: user.id,
      glasses,
      logged_at: new Date().toISOString(),
    };

    if (isOnline()) {
      const { data, error } = await supabase
        .from('water_logs')
        .insert(fullData)
        .select()
        .single();
      
      if (error) throw error;
      
      await offlineWaterLogs.save(data);
      return data;
    } else {
      const offlineId = generateOfflineId();
      const offlineData = { ...fullData, id: offlineId };
      
      await offlineWaterLogs.save(offlineData);
      await addToSyncQueue('water_log', 'insert', { ...fullData, offlineId });
      await updatePendingCount();
      
      return offlineData;
    }
  }, [user, updatePendingCount]);

  return {
    // Status
    isOnline: isOnline(),
    pendingSyncCount,
    isSyncing,
    syncData,
    
    // Foods
    getFoods,
    
    // Meal Logs
    getMealLogs,
    getTodayMealLogs,
    addMealLog,
    
    // Symptom Logs
    getSymptomLogs,
    addSymptomLog,
    
    // Water Logs
    getTodayWaterLogs,
    addWaterLog,
  };
}
