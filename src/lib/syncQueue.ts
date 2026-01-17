import { supabase } from '@/integrations/supabase/client';
import { syncQueue, SyncQueueItem, isOnline, offlineMealLogs, offlineSymptomLogs, offlineWaterLogs } from './offlineStorage';

// Process the sync queue when online
export const processSyncQueue = async (): Promise<{ success: number; failed: number }> => {
  if (!isOnline()) {
    return { success: 0, failed: 0 };
  }

  const items = await syncQueue.getAll();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const result = await processQueueItem(item);
      if (result) {
        await syncQueue.remove(item.id);
        success++;
      } else {
        // Increment retry count
        if (item.retries < 3) {
          await syncQueue.add({ ...item, retries: item.retries + 1 });
        } else {
          // Give up after 3 retries
          await syncQueue.remove(item.id);
          failed++;
        }
      }
    } catch (error) {
      console.error('Sync error for item:', item.id, error);
      failed++;
    }
  }

  return { success, failed };
};

const processQueueItem = async (item: SyncQueueItem): Promise<boolean> => {
  const { type, action, data } = item;
  
  try {
    switch (type) {
      case 'meal_log':
        return await processMealLog(action, data);
      case 'symptom_log':
        return await processSymptomLog(action, data);
      case 'water_log':
        return await processWaterLog(action, data);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error processing queue item:', error);
    return false;
  }
};

const processMealLog = async (action: string, data: any): Promise<boolean> => {
  const { offlineId, ...cleanData } = data;
  
  switch (action) {
    case 'insert': {
      // Remove offline ID prefix if present
      const insertData = { ...cleanData };
      if (insertData.id?.startsWith('offline_')) {
        delete insertData.id;
      }
      
      const { data: result, error } = await supabase
        .from('meal_logs')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local storage with new server ID
      if (offlineId) {
        await offlineMealLogs.delete(offlineId);
        await offlineMealLogs.save(result);
      }
      
      return true;
    }
    case 'update': {
      const { error } = await supabase
        .from('meal_logs')
        .update(cleanData)
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    case 'delete': {
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    default:
      return false;
  }
};

const processSymptomLog = async (action: string, data: any): Promise<boolean> => {
  const { offlineId, offlineMealLogId, ...cleanData } = data;
  
  switch (action) {
    case 'insert': {
      const insertData = { ...cleanData };
      if (insertData.id?.startsWith('offline_')) {
        delete insertData.id;
      }
      
      // If meal_log_id was an offline ID, we need to find the real ID
      if (insertData.meal_log_id?.startsWith('offline_')) {
        // This case shouldn't happen if meal logs are synced first
        console.warn('Symptom log references offline meal ID');
        return false;
      }
      
      const { data: result, error } = await supabase
        .from('symptom_logs')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      if (offlineId) {
        await offlineSymptomLogs.delete(offlineId);
        await offlineSymptomLogs.save(result);
      }
      
      return true;
    }
    case 'update': {
      const { error } = await supabase
        .from('symptom_logs')
        .update(cleanData)
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    case 'delete': {
      const { error } = await supabase
        .from('symptom_logs')
        .delete()
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    default:
      return false;
  }
};

const processWaterLog = async (action: string, data: any): Promise<boolean> => {
  const { offlineId, ...cleanData } = data;
  
  switch (action) {
    case 'insert': {
      const insertData = { ...cleanData };
      if (insertData.id?.startsWith('offline_')) {
        delete insertData.id;
      }
      
      const { data: result, error } = await supabase
        .from('water_logs')
        .insert(insertData)
        .select()
        .single();
      
      if (error) throw error;
      
      if (offlineId) {
        await offlineWaterLogs.delete(offlineId);
        await offlineWaterLogs.save(result);
      }
      
      return true;
    }
    case 'update': {
      const { error } = await supabase
        .from('water_logs')
        .update(cleanData)
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    case 'delete': {
      const { error } = await supabase
        .from('water_logs')
        .delete()
        .eq('id', cleanData.id);
      
      if (error) throw error;
      return true;
    }
    default:
      return false;
  }
};

// Add item to sync queue
export const addToSyncQueue = async (
  type: SyncQueueItem['type'],
  action: SyncQueueItem['action'],
  data: any
): Promise<void> => {
  const item: SyncQueueItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    action,
    data,
    timestamp: Date.now(),
    retries: 0,
  };
  
  await syncQueue.add(item);
};

// Get count of pending items
export const getPendingSyncCount = async (): Promise<number> => {
  return syncQueue.getCount();
};
