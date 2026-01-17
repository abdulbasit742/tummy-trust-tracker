// IndexedDB wrapper for offline storage
const DB_NAME = 'ibs_diet_companion';
const DB_VERSION = 1;

interface OfflineStore {
  foods: any[];
  mealLogs: any[];
  symptomLogs: any[];
  waterLogs: any[];
  profile: any | null;
  syncQueue: SyncQueueItem[];
  lastSyncTime: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'meal_log' | 'symptom_log' | 'water_log';
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      if (!database.objectStoreNames.contains('foods')) {
        database.createObjectStore('foods', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('mealLogs')) {
        const mealStore = database.createObjectStore('mealLogs', { keyPath: 'id' });
        mealStore.createIndex('user_id', 'user_id', { unique: false });
        mealStore.createIndex('eaten_at', 'eaten_at', { unique: false });
      }
      if (!database.objectStoreNames.contains('symptomLogs')) {
        const symptomStore = database.createObjectStore('symptomLogs', { keyPath: 'id' });
        symptomStore.createIndex('meal_log_id', 'meal_log_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('waterLogs')) {
        const waterStore = database.createObjectStore('waterLogs', { keyPath: 'id' });
        waterStore.createIndex('user_id', 'user_id', { unique: false });
        waterStore.createIndex('logged_at', 'logged_at', { unique: false });
      }
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
};

// Generic store operations
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const put = async <T>(storeName: string, data: T): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const putMany = async <T>(storeName: string, items: T[]): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    items.forEach(item => store.put(item));
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

const deleteItem = async (storeName: string, key: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async (storeName: string): Promise<void> => {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Food Reference operations
export const offlineFoods = {
  getAll: () => getAll<any>('foods'),
  saveAll: (foods: any[]) => putMany('foods', foods),
  clear: () => clearStore('foods'),
};

// Meal Logs operations
export const offlineMealLogs = {
  getAll: () => getAll<any>('mealLogs'),
  save: (meal: any) => put('mealLogs', meal),
  saveAll: (meals: any[]) => putMany('mealLogs', meals),
  delete: (id: string) => deleteItem('mealLogs', id),
  clear: () => clearStore('mealLogs'),
  
  getByUserId: async (userId: string): Promise<any[]> => {
    const all = await getAll<any>('mealLogs');
    return all.filter(m => m.user_id === userId);
  },
  
  getTodayByUserId: async (userId: string): Promise<any[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const all = await getAll<any>('mealLogs');
    return all.filter(m => 
      m.user_id === userId && 
      new Date(m.eaten_at) >= today
    );
  },
};

// Symptom Logs operations
export const offlineSymptomLogs = {
  getAll: () => getAll<any>('symptomLogs'),
  save: (symptom: any) => put('symptomLogs', symptom),
  saveAll: (symptoms: any[]) => putMany('symptomLogs', symptoms),
  delete: (id: string) => deleteItem('symptomLogs', id),
  clear: () => clearStore('symptomLogs'),
  
  getByMealLogId: async (mealLogId: string): Promise<any[]> => {
    const all = await getAll<any>('symptomLogs');
    return all.filter(s => s.meal_log_id === mealLogId);
  },
};

// Water Logs operations
export const offlineWaterLogs = {
  getAll: () => getAll<any>('waterLogs'),
  save: (water: any) => put('waterLogs', water),
  saveAll: (waters: any[]) => putMany('waterLogs', waters),
  delete: (id: string) => deleteItem('waterLogs', id),
  clear: () => clearStore('waterLogs'),
  
  getTodayByUserId: async (userId: string): Promise<any[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const all = await getAll<any>('waterLogs');
    return all.filter(w => 
      w.user_id === userId && 
      new Date(w.logged_at) >= today
    );
  },
};

// Sync Queue operations
export const syncQueue = {
  getAll: () => getAll<SyncQueueItem>('syncQueue'),
  add: (item: SyncQueueItem) => put('syncQueue', item),
  remove: (id: string) => deleteItem('syncQueue', id),
  clear: () => clearStore('syncQueue'),
  
  getCount: async (): Promise<number> => {
    const items = await getAll<SyncQueueItem>('syncQueue');
    return items.length;
  },
};

// Metadata operations
export const metadata = {
  get: async (key: string): Promise<any> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('metadata', 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  },
  
  set: async (key: string, value: any): Promise<void> => {
    return put('metadata', { key, value });
  },
};

// Helper to check if we're online
export const isOnline = (): boolean => navigator.onLine;

// Generate offline-compatible UUID
export const generateOfflineId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
